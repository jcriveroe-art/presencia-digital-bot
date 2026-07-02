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

const { buildLeadContext, buildConversationState, buildSystemPrompt } = require("../api/webhook").__test;

// Gap corregido: buildLeadContext ahora expone cliente.negocio a Claude (antes solo categoria)
assert.ok(buildLeadContext({ negocio: "Tacos El Buen Sabor", categoria: "restaurante" }).includes("negocio: Tacos El Buen Sabor"));
assert.ok(buildLeadContext({ negocio: "Tacos El Buen Sabor" }).includes("negocio: Tacos El Buen Sabor"));

// buildConversationState: bloque de fuente de verdad con fallback "sin datos"
const bloqueVacio = buildConversationState(null, null);
assert.ok(bloqueVacio.startsWith("ESTADO DE LA CONVERSACION (fuente de verdad)"));
assert.ok(bloqueVacio.includes("etapa: sin datos"));
assert.ok(bloqueVacio.includes("giro_negocio: sin datos"));
assert.ok(bloqueVacio.includes("nombre_negocio: sin datos"));

const bloqueConDatos = buildConversationState({ etapa: "interesado", giro_negocio: "restaurante", nombre_negocio: "Tacos El Buen Sabor" }, null);
assert.ok(bloqueConDatos.includes("etapa: interesado"));
assert.ok(bloqueConDatos.includes("giro_negocio: restaurante"));
assert.ok(bloqueConDatos.includes("nombre_negocio: Tacos El Buen Sabor"));

// instruccion efimera solo aparece cuando se pasa explicitamente
const sinInstruccion = buildConversationState({ etapa: "interesado" }, null);
assert.ok(!sinInstruccion.includes("YA CONFIRMO"));

const conInstruccion = buildConversationState({ etapa: "interesado" }, "El prospecto YA CONFIRMO que quiere la explicacion.");
assert.ok(conInstruccion.includes("YA CONFIRMO"));

// buildSystemPrompt integra el bloque nuevo y no revienta con conversationState null
const prompt = buildSystemPrompt({ negocio: "Tacos El Buen Sabor" }, { etapa: "interesado", giro_negocio: "restaurante" }, null);
assert.ok(prompt.includes("ESTADO DE LA CONVERSACION (fuente de verdad)"));
assert.ok(prompt.includes("etapa: interesado"));
assert.ok(prompt.includes("negocio: Tacos El Buen Sabor"));

const promptSinConversationState = buildSystemPrompt({}, null, null);
assert.ok(promptSinConversationState.includes("etapa: sin datos"));

console.log("build-system-prompt tests passed");
