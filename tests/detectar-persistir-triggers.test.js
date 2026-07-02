const assert = require("assert");

process.env.SUPABASE_URL = "https://example.supabase.co";
process.env.SUPABASE_SERVICE_KEY = "test";
process.env.ANTHROPIC_API_KEY = "test";
process.env.WHATSAPP_TOKEN = "test";
process.env.PHONE_NUMBER_ID = "123";

const { supabase } = require("../lib/crm");

const TEL = "525512345678";

function mockSupabase(conversationStateInicial) {
  let csState = conversationStateInicial || null;
  const upserts = [];

  supabase.from = (table) => ({
    select() {
      return this;
    },
    eq() {
      return this;
    },
    single: async () => {
      if (table === "conversation_state") return { data: csState, error: null };
      return { data: null, error: null };
    },
    upsert: async (payload) => {
      upserts.push({ table, payload });
      if (table === "conversation_state") csState = { ...csState, ...payload };
      return { data: payload, error: null };
    },
  });

  return { upserts, getState: () => csState };
}

const { detectarYPersistirTriggers, TTL_TRIGGER_MS } = require("../api/webhook").__test;

(async () => {
  // 1. Deteccion de giro en vivo se persiste y se espeja a conversaciones.categoria
  {
    const mock = mockSupabase(null);
    const instruccion = await detectarYPersistirTriggers(TEL, "Tengo un restaurante de mariscos", {});
    const csUpsert = mock.upserts.find((u) => u.table === "conversation_state");
    const convUpsert = mock.upserts.find((u) => u.table === "conversaciones");
    assert.strictEqual(csUpsert.payload.giro_negocio, "restaurante");
    assert.strictEqual(convUpsert.payload.categoria, "restaurante");
    assert.strictEqual(instruccion, null);
  }

  // 2. Deteccion de nombre de negocio se persiste y se espeja a conversaciones.negocio
  {
    const mock = mockSupabase(null);
    await detectarYPersistirTriggers(TEL, "Mi negocio se llama Tacos El Buen Sabor", {});
    const csUpsert = mock.upserts.find((u) => u.table === "conversation_state");
    const convUpsert = mock.upserts.find((u) => u.table === "conversaciones");
    assert.strictEqual(csUpsert.payload.nombre_negocio, "Tacos El Buen Sabor");
    assert.strictEqual(convUpsert.payload.negocio, "Tacos El Buen Sabor");
  }

  // 3. Giro en vivo distinto al precargado gana (senal mas fresca)
  {
    const mock = mockSupabase({ telefono: TEL, giro_negocio: "farmacia" });
    await detectarYPersistirTriggers(TEL, "Perdon, en realidad tengo una tintoreria", {});
    const csUpsert = mock.upserts.find((u) => u.table === "conversation_state");
    assert.strictEqual(csUpsert.payload.giro_negocio, "tintoreria");
  }

  // 4. Trigger pendiente afirmativo con avance de etapa (confirmar_link_pago)
  {
    const mock = mockSupabase({
      telefono: TEL,
      ultimo_trigger: "confirmar_link_pago",
      ultimo_trigger_at: new Date().toISOString(),
    });
    const instruccion = await detectarYPersistirTriggers(TEL, "si", {});
    const csUpsert = mock.upserts.find((u) => u.table === "conversation_state");
    assert.strictEqual(csUpsert.payload.ultimo_trigger, null);
    assert.strictEqual(csUpsert.payload.ultimo_trigger_at, null);
    assert.strictEqual(csUpsert.payload.etapa, "interesado");
    const convUpsert = mock.upserts.find((u) => u.table === "conversaciones");
    assert.strictEqual(convUpsert.payload.estado, "interesado");
    assert.ok(instruccion && instruccion.includes("link de pago"));
  }

  // 5. Trigger pendiente afirmativo sin avance de etapa (confirmar_explicacion)
  {
    const mock = mockSupabase({
      telefono: TEL,
      ultimo_trigger: "confirmar_explicacion",
      ultimo_trigger_at: new Date().toISOString(),
    });
    const instruccion = await detectarYPersistirTriggers(TEL, "si", {});
    const csUpsert = mock.upserts.find((u) => u.table === "conversation_state");
    assert.strictEqual(csUpsert.payload.ultimo_trigger, null);
    assert.strictEqual(csUpsert.payload.etapa, undefined);
    assert.ok(instruccion && instruccion.includes("explicacion"));
  }

  // 6. Trigger pendiente negativo: se limpia en silencio, sin instruccion efimera
  {
    const mock = mockSupabase({
      telefono: TEL,
      ultimo_trigger: "confirmar_piloto",
      ultimo_trigger_at: new Date().toISOString(),
    });
    const instruccion = await detectarYPersistirTriggers(TEL, "no gracias", {});
    const csUpsert = mock.upserts.find((u) => u.table === "conversation_state");
    assert.strictEqual(csUpsert.payload.ultimo_trigger, null);
    assert.strictEqual(csUpsert.payload.etapa, undefined);
    assert.strictEqual(instruccion, null);
  }

  // 7. Trigger pendiente ambiguo: se deja pendiente, no se upsertea conversation_state
  {
    const mock = mockSupabase({
      telefono: TEL,
      ultimo_trigger: "confirmar_link_pago",
      ultimo_trigger_at: new Date().toISOString(),
    });
    const instruccion = await detectarYPersistirTriggers(TEL, "cuanto cuesta el otro servicio", {});
    assert.strictEqual(mock.upserts.length, 0, "mensaje ambiguo sin giro/nombre detectado no debe generar upsert");
    assert.strictEqual(mock.getState().ultimo_trigger, "confirmar_link_pago");
    assert.strictEqual(instruccion, null);
  }

  // 8. TTL vencido: trigger afirmativo pero viejo se limpia en silencio, sin instruccion ni avance de etapa
  {
    const viejo = new Date(Date.now() - (TTL_TRIGGER_MS + 60 * 1000)).toISOString();
    const mock = mockSupabase({
      telefono: TEL,
      ultimo_trigger: "confirmar_piloto",
      ultimo_trigger_at: viejo,
    });
    const instruccion = await detectarYPersistirTriggers(TEL, "si", {});
    const csUpsert = mock.upserts.find((u) => u.table === "conversation_state");
    assert.strictEqual(csUpsert.payload.ultimo_trigger, null);
    assert.strictEqual(csUpsert.payload.ultimo_trigger_at, null);
    assert.strictEqual(csUpsert.payload.etapa, undefined);
    assert.strictEqual(instruccion, null);
  }

  console.log("detectar-persistir-triggers tests passed");
})();
