const assert = require("assert");

process.env.SUPABASE_URL = "https://example.supabase.co";
process.env.SUPABASE_SERVICE_KEY = "test";
process.env.ANTHROPIC_API_KEY = "test";
process.env.WHATSAPP_TOKEN = "test";
process.env.PHONE_NUMBER_ID = "123";

const { supabase } = require("../lib/crm");
supabase.from = () => ({
  update: () => ({ eq: async () => ({ error: null }) }),
  insert: () => ({ eq: async () => ({ error: null }) }),
  upsert: async () => ({ error: null }),
  select: () => ({ eq: () => ({ single: async () => ({ data: null }), maybeSingle: async () => ({ data: null }) }) }),
});

const { esRespuestaAfirmativa, esRespuestaNegativa, detectarTriggerPendiente } = require("../api/webhook").__test;

// esRespuestaAfirmativa
for (const texto of ["si", "Sí", "SI", "sip", "claro", "va", "dale", "ok", "okay", "correcto", "Sí, por favor"]) {
  assert.ok(esRespuestaAfirmativa(texto), `deberia ser afirmativo: "${texto}"`);
  assert.ok(!esRespuestaNegativa(texto), `no deberia ser negativo: "${texto}"`);
}

// esRespuestaNegativa
for (const texto of ["no", "No", "nel", "no gracias", "mejor no", "todavia no", "para nada"]) {
  assert.ok(esRespuestaNegativa(texto), `deberia ser negativo: "${texto}"`);
  assert.ok(!esRespuestaAfirmativa(texto), `no deberia ser afirmativo: "${texto}"`);
}

// Respuestas ambiguas o mensajes largos no deben clasificarse como si/no puro
for (const texto of ["no se, tal vez despues", "si claro que quiero pero primero dime el precio", "hola, quiero informacion"]) {
  assert.ok(!esRespuestaAfirmativa(texto), `ambiguo no deberia ser afirmativo: "${texto}"`);
  assert.ok(!esRespuestaNegativa(texto), `ambiguo no deberia ser negativo: "${texto}"`);
}

// TRIGGERS_PENDIENTES: deben matchear las frases deterministas reales del bot
assert.strictEqual(
  detectarTriggerPendiente("El Diagnóstico ON cuesta $499 MXN...\n\n¿Quieres que te comparta el link de pago seguro?"),
  "confirmar_link_pago"
);
assert.strictEqual(
  detectarTriggerPendiente("Claro. Encontré algunas oportunidades en tu ficha:\n\n*obs*\n\n¿Quiere que le comparta el link de pago?"),
  "confirmar_link_pago"
);
assert.strictEqual(
  detectarTriggerPendiente("El precio normal es $499 MXN. Puedo apoyarte con $499 MXN como diagnóstico piloto.\n\n¿Quieres que avancemos con el piloto?"),
  "confirmar_piloto"
);
assert.strictEqual(
  detectarTriggerPendiente("Eso lo revisamos en el Diagnostico ON. ¿Quiere que le explique como funciona?"),
  "confirmar_explicacion"
);
assert.strictEqual(detectarTriggerPendiente("Hola, ¿en qué zona estás?"), null);
assert.strictEqual(detectarTriggerPendiente(""), null);
assert.strictEqual(detectarTriggerPendiente(null), null);

console.log("clasificadores-si-no tests passed");
