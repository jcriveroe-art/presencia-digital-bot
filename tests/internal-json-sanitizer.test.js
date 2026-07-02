const assert = require("assert");

process.env.SUPABASE_URL = "https://example.supabase.co";
process.env.SUPABASE_SERVICE_KEY = "test";
process.env.ANTHROPIC_API_KEY = "test";
process.env.WHATSAPP_TOKEN = "test";
process.env.PHONE_NUMBER_ID = "123";

const axios = require("axios");
axios.post = async () => ({ data: { ok: true } });

const { sendWhatsApp, supabase } = require("../lib/crm");

// Mock Supabase to run tests cleanly without DB access
supabase.from = () => ({
  update: () => ({
    eq: async () => ({ error: null })
  }),
  insert: () => ({
    eq: async () => ({ error: null })
  }),
  upsert: async () => ({ error: null }),
  select: () => ({
    eq: () => ({
      single: async () => ({ data: { negocio: "Test Biz", diagnostico_fotos: "Tienes baja actividad visual en la ficha.", fugas_detectadas: "No hay reseñas respondidas." } }),
      maybeSingle: async () => ({ data: { estado_contacto: "contactado" } })
    })
  })
});

const {
  contieneAlucinacionComercialCritica,
  contieneEstadoInterno,
  parsearEstado,
  preguntaComoPagar,
  preguntaPrecio,
  prepararRespuestaCliente,
  sanitizarRespuestaCliente,
  esObservacionAptaCliente,
  esAceptacionOpener,
  solicitaHumano,
  esFueraDeAlcance,
  responderComercialCritico,
} = require("../api/webhook").__test;

// Test Claude JSON Parser
const claude = [
  "Hola, claro.",
  "---",
  "ESTADO:",
  "```json",
  '{"caliente":false,"estado":"nuevo","intervencion":false,"razon_intervencion":null}',
  "```",
].join("\n");

const parsed = parsearEstado(claude);
assert.strictEqual(parsed.texto, "Hola, claro.");
assert.deepStrictEqual(parsed.estado, {
  caliente: false,
  estado: "nuevo",
  intervencion: false,
  razon_intervencion: null,
});
assert.strictEqual(contieneEstadoInterno(parsed.texto), false);

assert.strictEqual(
  sanitizarRespuestaCliente('Perfecto.\n\n{"caliente":false,"estado":"nuevo"}'),
  "Perfecto."
);

const usable = prepararRespuestaCliente('Perfecto. Te explico...\n\n---\nESTADO:{"caliente":false,"estado":"nuevo"}');
assert.deepStrictEqual(usable, {
  cleanText: "Perfecto. Te explico...",
  bloqueada: false,
});

const onlyJson = prepararRespuestaCliente('ESTADO:{"caliente":false,"estado":"nuevo"}');
assert.deepStrictEqual(onlyJson, {
  cleanText: "",
  bloqueada: true,
});

// Tarea 12: parsearEstado sigue parseando estado/negocio de un ESTADO legado
// (no es su responsabilidad decidir que se escribe en conversaciones — eso
// lo dejo de hacer getClaudeResponse en la tarea 10), y caliente/intervencion
// se siguen extrayendo igual que siempre.
const legacyParsed = parsearEstado(
  'Genial.\nESTADO:{"caliente":true,"estado":"cliente_caliente","nombre":null,"negocio":"Taco X","alerta":null,"intervencion":false,"razon_intervencion":null}'
);
assert.strictEqual(legacyParsed.texto, "Genial.");
assert.strictEqual(legacyParsed.estado.caliente, true);
assert.strictEqual(legacyParsed.estado.intervencion, false);
assert.strictEqual(legacyParsed.estado.estado, "cliente_caliente");
assert.strictEqual(legacyParsed.estado.negocio, "Taco X");

assert.strictEqual(preguntaPrecio("¿Cuánto cuesta?"), true);
assert.strictEqual(preguntaComoPagar("¿Cómo pago?"), true);
assert.strictEqual(contieneAlucinacionComercialCritica("El Diagnóstico ON cuesta $1,500 MXN."), true);
assert.strictEqual(contieneAlucinacionComercialCritica("Te hago promo en $999."), true);
assert.strictEqual(contieneAlucinacionComercialCritica("Puedo apoyarte con $499 MXN como diagnóstico piloto."), false);
assert.strictEqual(contieneAlucinacionComercialCritica("Te dejo descuento en $1,200."), true);
assert.strictEqual(contieneAlucinacionComercialCritica("Transfiere por SPEI a la CLABE 123."), true);

const safePrice = prepararRespuestaCliente("El Diagnóstico ON cuesta $1,500 MXN.");
assert.deepStrictEqual(safePrice, {
  cleanText: "El Diagnóstico ON cuesta $1,500 MXN.",
  bloqueada: true,
});

const fakeBank = prepararRespuestaCliente("Puedes transferir al banco con CLABE 123.");
assert.strictEqual(fakeBank.bloqueada, true);

const pilot = prepararRespuestaCliente("El precio normal es $1,500 MXN. Puedo apoyarte con $499 MXN como diagnóstico piloto.");
assert.strictEqual(pilot.bloqueada, true);

// ─── NUEVAS PRUEBAS DE ENRUTAMIENTO Y VALIDACIONES ───────────────────────────

// 1. Test esObservacionAptaCliente
assert.strictEqual(esObservacionAptaCliente("Tienes varias fugas visuales importantes."), true); // "fugas" no debe bloquear
assert.strictEqual(esObservacionAptaCliente("Corta"), false); // muy corta
assert.strictEqual(esObservacionAptaCliente("Esto contiene un null de base de datos."), false); // patron invalido
assert.strictEqual(esObservacionAptaCliente("sin observaciones en la ficha de maps."), false); // patron invalido

// 2. Test esAceptacionOpener
assert.strictEqual(esAceptacionOpener("Sí claro, dime"), true);
assert.strictEqual(esAceptacionOpener("a ver platícame"), true);
assert.strictEqual(esAceptacionOpener("no gracias"), false);

// 3. Test solicitaHumano
assert.strictEqual(solicitaHumano("quiero hablar con un asesor"), true);
assert.strictEqual(solicitaHumano("llámame por favor"), true);
assert.strictEqual(solicitaHumano("ok, entiendo"), false);

// 4. Test esFueraDeAlcance
assert.strictEqual(esFueraDeAlcance("¿llevan redes sociales?"), true);
assert.strictEqual(esFueraDeAlcance("necesito diseño web"), true);
assert.strictEqual(esFueraDeAlcance("¿cómo funciona el diagnóstico?"), false);

// 5. Test responderComercialCritico Bypasses
(async () => {
  const cliente = {
    telefono: "524491234567",
    negocio: "Restaurante Test",
    diagnostico_fotos: "Tienes baja actividad visual en la ficha.",
    fugas_detectadas: "No hay reseñas respondidas."
  };

  // Test Aceptación Simple con observaciones aptas
  const respAceptacion = await responderComercialCritico("524491234567", "sí, claro", cliente);
  assert.match(respAceptacion, /Encontré algunas oportunidades en tu ficha/);
  assert.match(respAceptacion, /Tienes baja actividad visual en la ficha/);

  // Test Aceptación Simple con observaciones NO aptas (fallback)
  const clienteMalo = { ...cliente, diagnostico_fotos: "null", fugas_detectadas: "sin datos" };
  const respFallback = await responderComercialCritico("524491234567", "dime", clienteMalo);
  assert.strictEqual(respFallback, "Claro. Vi un par de oportunidades en tu ficha para que te encuentren y te contacten mejor. Si quieres, te comparto lo que noté o te hago un par de preguntas rápidas.");

  // Test Precio Bypass
  const respPrecio = await responderComercialCritico("524491234567", "¿Cuánto cuesta?", cliente);
  assert.match(respPrecio, /El Diagnóstico ON cuesta \$499 MXN/);

  // Test Pago Bypass
  const respPago = await responderComercialCritico("524491234567", "¿Cómo pago?", cliente);
  assert.match(respPago, /enlace de pago seguro mediante Stripe/);
  assert.match(respPago, /buy.stripe.com/);

  // Test Identidad Bypass
  const respIdentidad = await responderComercialCritico("524491234567", "¿Quién eres?", cliente);
  assert.match(respIdentidad, /soy Juan Carlos de Presencia Digital/);

  // Test Escalamiento Humano Directo
  const respHumano = await responderComercialCritico("524491234567", "quiero hablar con una persona", cliente);
  assert.match(respHumano, /Juan Carlos \(nuestro asesor principal\) revisará nuestro chat/);

  // Test Escalamiento Fuera de Alcance
  const respFuera = await responderComercialCritico("524491234567", "quiero campaña en redes sociales", cliente);
  assert.match(respFuera, /Esa parte de servicios no la manejamos de forma directa/);

  // Test URL Guardrail
  await assert.rejects(
    () => sendWhatsApp("524491234567", "Mira este link malicioso: http://hack-stripe.com/pago"),
    /Mensaje con URL no autorizada bloqueado/
  );

  // Test URL Guardrail con link permitido
  const sentOk = await sendWhatsApp("524491234567", "Link seguro: https://buy.stripe.com/3cI9AU2KFeuqf8Rezn6Ri00");
  assert.ok(sentOk);

  // Test original de fuga de estado
  await assert.rejects(
    () => sendWhatsApp("525512345678", 'Hola\nESTADO:{"caliente":false,"estado":"nuevo"}'),
    /estado interno bloqueado/
  );

  console.log("internal-json-sanitizer ok");
})();
