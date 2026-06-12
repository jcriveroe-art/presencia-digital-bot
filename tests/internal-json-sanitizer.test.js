const assert = require("assert");

process.env.SUPABASE_URL = "https://example.supabase.co";
process.env.SUPABASE_SERVICE_KEY = "test";
process.env.ANTHROPIC_API_KEY = "test";
process.env.WHATSAPP_TOKEN = "test";
process.env.PHONE_NUMBER_ID = "123";

const axios = require("axios");
axios.post = async () => ({ data: { ok: true } });

const { sendWhatsApp } = require("../lib/crm");
const {
  contieneAlucinacionComercialCritica,
  contieneEstadoInterno,
  parsearEstado,
  preguntaComoPagar,
  preguntaPrecio,
  prepararRespuestaCliente,
  sanitizarRespuestaCliente,
} = require("../api/webhook").__test;

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

assert.strictEqual(preguntaPrecio("¿Cuánto cuesta?"), true);
assert.strictEqual(preguntaComoPagar("¿Cómo pago?"), true);
assert.strictEqual(contieneAlucinacionComercialCritica("El Diagnóstico ON cuesta $1,500 MXN."), false);
assert.strictEqual(contieneAlucinacionComercialCritica("Te hago promo en $999."), true);
assert.strictEqual(contieneAlucinacionComercialCritica("Puedo apoyarte con $1,000 MXN como diagnóstico piloto."), false);
assert.strictEqual(contieneAlucinacionComercialCritica("Te dejo descuento en $1,200."), true);
assert.strictEqual(contieneAlucinacionComercialCritica("Transfiere por SPEI a la CLABE 123."), true);

const safePrice = prepararRespuestaCliente("El Diagnóstico ON cuesta $1,500 MXN.");
assert.deepStrictEqual(safePrice, {
  cleanText: "El Diagnóstico ON cuesta $1,500 MXN.",
  bloqueada: false,
});

const fakeBank = prepararRespuestaCliente("Puedes transferir al banco con CLABE 123.");
assert.strictEqual(fakeBank.bloqueada, true);

const pilot = prepararRespuestaCliente("El precio normal es $1,500 MXN. Puedo apoyarte con $1,000 MXN como diagnóstico piloto.");
assert.strictEqual(pilot.bloqueada, false);

(async () => {
  await assert.rejects(
    () => sendWhatsApp("525512345678", 'Hola\nESTADO:{"caliente":false,"estado":"nuevo"}'),
    /estado interno bloqueado/
  );

  console.log("internal-json-sanitizer ok");
})();
