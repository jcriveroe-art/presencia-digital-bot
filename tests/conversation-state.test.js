const assert = require("assert");
const Module = require("module");

process.env.SUPABASE_URL = "https://example.supabase.co";
process.env.SUPABASE_SERVICE_KEY = "test";

const TEL = "525512345678";

function createSupabaseMock(options) {
  const state = {
    conversationState: (options && options.conversationState) || null,
    upserts: [],
  };

  function builder(table) {
    const ctx = { table, filters: {} };
    return {
      select() {
        return this;
      },
      eq(key, value) {
        ctx.filters[key] = value;
        return this;
      },
      single: async () => {
        if (table === "conversation_state") return { data: state.conversationState, error: null };
        return { data: null, error: null };
      },
      upsert: async (payload) => {
        state.upserts.push({ table, payload });
        return { data: payload, error: null };
      },
    };
  }

  return {
    state,
    from(table) {
      return builder(table);
    },
  };
}

function withMockedSupabase(supabaseMock, fn) {
  const originalLoad = Module._load;
  Module._load = function patchedLoad(request, parent, isMain) {
    if (request.endsWith("./crm") || request.endsWith("../lib/crm")) {
      return { supabase: supabaseMock };
    }
    return originalLoad(request, parent, isMain);
  };
  try {
    delete require.cache[require.resolve("../lib/conversationState")];
    return fn(require("../lib/conversationState"));
  } finally {
    Module._load = originalLoad;
    delete require.cache[require.resolve("../lib/conversationState")];
  }
}

(async () => {
  // getConversationState devuelve el registro existente
  await withMockedSupabase(
    createSupabaseMock({ conversationState: { telefono: TEL, etapa: "interesado" } }),
    async ({ getConversationState }) => {
      const state = await getConversationState(TEL);
      assert.strictEqual(state.etapa, "interesado");
    }
  );

  // getConversationState devuelve null cuando no hay registro
  await withMockedSupabase(createSupabaseMock({}), async ({ getConversationState }) => {
    const state = await getConversationState(TEL);
    assert.strictEqual(state, null);
  });

  // upsertConversationState escribe en conversation_state y espeja los campos mapeados
  await (async () => {
    const supabaseMock = createSupabaseMock({});
    await withMockedSupabase(supabaseMock, async ({ upsertConversationState }) => {
      await upsertConversationState(TEL, { etapa: "interesado", giro_negocio: "restaurante", nombre_negocio: "Tacos El Buen Sabor" });
    });

    const csUpsert = supabaseMock.state.upserts.find((u) => u.table === "conversation_state");
    assert.ok(csUpsert, "debe upsertear conversation_state");
    assert.strictEqual(csUpsert.payload.telefono, TEL);
    assert.strictEqual(csUpsert.payload.etapa, "interesado");
    assert.strictEqual(csUpsert.payload.giro_negocio, "restaurante");
    assert.strictEqual(csUpsert.payload.nombre_negocio, "Tacos El Buen Sabor");
    assert.ok(csUpsert.payload.updated_at);

    const convUpsert = supabaseMock.state.upserts.find((u) => u.table === "conversaciones");
    assert.ok(convUpsert, "debe espejar hacia conversaciones");
    assert.strictEqual(convUpsert.payload.estado, "interesado");
    assert.strictEqual(convUpsert.payload.categoria, "restaurante");
    assert.strictEqual(convUpsert.payload.negocio, "Tacos El Buen Sabor");
  })();

  // Campos no mapeados (ultimo_trigger/ultimo_trigger_at) no generan espejo, y updates parciales no tocan campos ausentes
  await (async () => {
    const supabaseMock = createSupabaseMock({});
    await withMockedSupabase(supabaseMock, async ({ upsertConversationState }) => {
      await upsertConversationState(TEL, { ultimo_trigger: "confirmar_explicacion", ultimo_trigger_at: "2026-07-02T10:00:00.000Z" });
    });

    const csUpsert = supabaseMock.state.upserts.find((u) => u.table === "conversation_state");
    assert.strictEqual(csUpsert.payload.ultimo_trigger, "confirmar_explicacion");
    assert.strictEqual(csUpsert.payload.etapa, undefined);

    const convUpsert = supabaseMock.state.upserts.find((u) => u.table === "conversaciones");
    assert.strictEqual(convUpsert, undefined, "sin campos mapeados no debe espejar");
  })();

  // Limpiar un trigger con null explícito debe persistirse (no perderse por checks truthy)
  await (async () => {
    const supabaseMock = createSupabaseMock({});
    await withMockedSupabase(supabaseMock, async ({ upsertConversationState }) => {
      await upsertConversationState(TEL, { ultimo_trigger: null, ultimo_trigger_at: null });
    });

    const csUpsert = supabaseMock.state.upserts.find((u) => u.table === "conversation_state");
    assert.strictEqual(csUpsert.payload.ultimo_trigger, null);
    assert.strictEqual(csUpsert.payload.ultimo_trigger_at, null);
  })();

  console.log("conversation-state tests passed");
})();
