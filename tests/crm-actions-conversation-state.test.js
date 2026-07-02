const assert = require("assert");

process.env.SUPABASE_URL = "https://example.supabase.co";
process.env.SUPABASE_SERVICE_KEY = "test";
process.env.ANTHROPIC_API_KEY = "test";
process.env.WHATSAPP_TOKEN = "test";
process.env.PHONE_NUMBER_ID = "123";

const { supabase } = require("../lib/crm");

const TEL = "5215512345678";

function mockSupabase() {
  const calls = [];
  supabase.from = (table) => ({
    // upsertConversationState hace `await ...upsert(payload)` directo (thenable),
    // mientras que leadEstado encadena `.upsert(payload).select("*").single()`.
    // El mock soporta ambos patrones sobre el mismo objeto.
    upsert: (payload) => {
      calls.push({ table, type: "upsert", payload });
      const resultado = { data: { telefono: TEL, ...payload }, error: null };
      return {
        select: () => ({ single: async () => resultado }),
        then: (resolve) => resolve(resultado),
      };
    },
    update: (payload) => ({
      eq: () => ({
        select: () => ({
          single: async () => {
            calls.push({ table, type: "update", payload });
            return { data: { telefono: TEL, ...payload }, error: null };
          },
        }),
      }),
    }),
    insert: async (payload) => {
      calls.push({ table, type: "insert", payload });
      return { error: null };
    },
    select: () => ({
      eq: () => ({
        single: async () => ({ data: null, error: null }),
        maybeSingle: async () => ({ data: null, error: null }),
      }),
    }),
  });
  return calls;
}

const { leadEstado, leadUpdate } = require("../api/crm-actions").__test;

(async () => {
  // leadEstado espeja estado->etapa hacia conversation_state
  {
    const calls = mockSupabase();
    const result = await leadEstado({ telefono: TEL, estado: "interesado" });
    assert.strictEqual(result.ok, true);
    const csUpsert = calls.find((c) => c.table === "conversation_state" && c.payload.etapa === "interesado");
    assert.ok(csUpsert, "leadEstado debe espejar estado hacia conversation_state.etapa");
    const mirror = calls.find((c) => c.table === "conversaciones" && c.payload.estado === "interesado");
    assert.ok(mirror, "conversation_state debe espejar de vuelta hacia conversaciones.estado");
  }

  // leadEstado con estado invalido no debe llamar nada
  {
    const calls = mockSupabase();
    const result = await leadEstado({ telefono: TEL, estado: "estado_que_no_existe" });
    assert.strictEqual(result.status, 400);
    assert.strictEqual(calls.length, 0);
  }

  // leadUpdate espeja solo los campos tocados (estado, categoria, nombre)
  {
    const calls = mockSupabase();
    const result = await leadUpdate({
      telefono_original: TEL,
      updates: { categoria: "restaurante", nombre: "Tacos El Buen Sabor", website: "https://example.com" },
    });
    assert.strictEqual(result.ok, true);
    const csUpsert = calls.find((c) => c.table === "conversation_state");
    assert.ok(csUpsert, "leadUpdate debe upsertear conversation_state cuando toca campos mapeados");
    assert.strictEqual(csUpsert.payload.giro_negocio, "restaurante");
    assert.strictEqual(csUpsert.payload.nombre_negocio, "Tacos El Buen Sabor");
    assert.strictEqual(csUpsert.payload.etapa, undefined, "no debe incluir etapa si no se toco estado");
  }

  // leadUpdate sin campos mapeados no debe tocar conversation_state
  {
    const calls = mockSupabase();
    await leadUpdate({ telefono_original: TEL, updates: { website: "https://example.com" } });
    const csUpsert = calls.find((c) => c.table === "conversation_state");
    assert.strictEqual(csUpsert, undefined, "sin campos mapeados no debe upsertear conversation_state");
  }

  console.log("crm-actions-conversation-state tests passed");
})();
