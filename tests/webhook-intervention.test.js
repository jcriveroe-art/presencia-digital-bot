const assert = require("assert");
const Module = require("module");

process.env.ANTHROPIC_API_KEY = "test";
process.env.SUPABASE_URL = "https://example.supabase.co";
process.env.SUPABASE_SERVICE_KEY = "test";
process.env.VERIFY_TOKEN = "verify";

const ADMIN = "525647943262";
const ADMINS = ["525647943262", "5215647943262"];
const LEAD = "525512345678";

function createSupabaseMock(options) {
  const state = {
    cliente: options.cliente || null,
    recentPausedAlert: Boolean(options.recentPausedAlert),
    upserts: [],
    inserts: [],
    events: [],
  };

  function builder(table) {
    const ctx = { table, filters: {}, countMode: false };
    return {
      select(_columns, opts) {
        ctx.countMode = Boolean(opts?.count);
        return this;
      },
      eq(key, value) {
        ctx.filters[key] = value;
        return this;
      },
      gte(key, value) {
        ctx.filters[key] = value;
        return this;
      },
      single: async () => {
        if (table === "conversaciones") return { data: state.cliente, error: null };
        return { data: null, error: null };
      },
      upsert: async (payload) => {
        state.upserts.push({ table, payload });
        return { data: payload, error: null };
      },
      insert: async (payload) => {
        state.inserts.push({ table, payload });
        if (table === "eventos_crm") state.events.push(payload);
        return { data: payload, error: null };
      },
      order() {
        return this;
      },
      limit() {
        return this;
      },
      then(resolve) {
        if (table === "eventos_crm" && ctx.countMode) {
          resolve({ count: state.recentPausedAlert ? 1 : 0, error: null });
          return;
        }
        if (table === "mensajes" && ctx.countMode) {
          resolve({ count: 0, error: null });
          return;
        }
        resolve({ data: [], count: 0, error: null });
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

async function runWebhook({ cliente, recentPausedAlert, claudeText, userMessage, conversationStateInicial }) {
  const sends = [];
  const supabaseMock = createSupabaseMock({ cliente, recentPausedAlert });
  supabaseMock.state.conversationState = {};
  if (conversationStateInicial) {
    supabaseMock.state.conversationState[LEAD] = conversationStateInicial;
  }
  const originalLoad = Module._load;

  Module._load = function patchedLoad(request, parent, isMain) {
    if (request.endsWith("../lib/conversationState")) {
      return {
        getConversationState: async (telefono) => supabaseMock.state.conversationState[telefono] || null,
        upsertConversationState: async (telefono, updates) => {
          const prev = supabaseMock.state.conversationState[telefono] || { telefono };
          supabaseMock.state.conversationState[telefono] = { ...prev, ...updates };
          supabaseMock.state.upserts.push({ table: "conversation_state", payload: { telefono, ...updates } });

          const mirror = {};
          if ("etapa" in updates) mirror.estado = updates.etapa;
          if ("giro_negocio" in updates) mirror.categoria = updates.giro_negocio;
          if ("nombre_negocio" in updates) mirror.negocio = updates.nombre_negocio;
          if (Object.keys(mirror).length) {
            supabaseMock.state.upserts.push({ table: "conversaciones", payload: { telefono, ...mirror } });
          }
        },
      };
    }
    if (request === "@anthropic-ai/sdk") {
      return {
        Anthropic: function AnthropicMock() {
          return {
            messages: {
              create: async () => ({
                content: [{ text: claudeText }],
              }),
            },
          };
        },
      };
    }
    if (request === "axios") {
      return {
        post: async (url, data) => {
          if (data && data.messaging_product === "whatsapp") {
            sends.push({ to: data.to, message: data.text?.body || data.template?.name });
          }
          return { data: { ok: true } };
        }
      };
    }
    if (request.endsWith("../lib/crm")) {
      return {
        logEventoCRM: async (telefono, tipo, descripcion, metadata) => {
          supabaseMock.state.events.push({ telefono, tipo, descripcion, metadata });
        },
        logMensaje: async (telefono, direccion, mensaje, raw) => {
          supabaseMock.state.inserts.push({ table: "mensajes", payload: { telefono, direccion, mensaje, raw } });
        },
        sendWhatsApp: async (to, message) => {
          sends.push({ to, message });
          return { ok: true };
        },
        supabase: supabaseMock,
      };
    }
    return originalLoad(request, parent, isMain);
  };

  try {
    delete require.cache[require.resolve("axios")];
  } catch (e) {}
  try {
    delete require.cache[require.resolve("../lib/crm")];
  } catch (e) {}

  delete require.cache[require.resolve("../api/webhook")];
  const webhook = require("../api/webhook");

  const req = {
    method: "POST",
    body: {
      object: "whatsapp_business_account",
      entry: [{
        changes: [{
          value: {
            messages: [{
              from: LEAD,
              text: { body: userMessage || "no entiendo y se me hace sospechoso" },
            }],
          },
        }],
      }],
    },
  };

  const status = await new Promise((resolve) => {
    webhook(req, {
      status(code) {
        return {
          json(payload) {
            resolve({ code, payload });
          },
          send(payload) {
            resolve({ code, payload });
          },
        };
      },
    });
  });

  Module._load = originalLoad;

  return { sends, status, state: supabaseMock.state };
}

(async () => {
  const intervention = await runWebhook({
    cliente: { telefono: LEAD, bot_enabled: true, historial: [] },
    recentPausedAlert: false,
    claudeText: 'Entiendo.\nESTADO:{"caliente":false,"estado":"requiere_intervencion","nombre":null,"negocio":null,"alerta":null,"intervencion":true,"razon_intervencion":"Desconfianza fuerte"}',
  });

  assert.strictEqual(intervention.status.code, 200);
  assert.deepStrictEqual(intervention.sends.map((s) => s.to), ADMINS);
  assert.ok(!intervention.sends.some((s) => s.to === LEAD));
  assert.ok(intervention.state.upserts.some((item) => item.payload.bot_enabled === false && item.payload.estado === "requiere_intervencion"));

  const pausedRecent = await runWebhook({
    cliente: { telefono: LEAD, bot_enabled: false },
    recentPausedAlert: true,
    claudeText: "",
  });

  assert.strictEqual(pausedRecent.status.code, 200);
  assert.strictEqual(pausedRecent.sends.length, 0);

  const pausedNoRecent = await runWebhook({
    cliente: { telefono: LEAD, bot_enabled: false },
    recentPausedAlert: false,
    claudeText: "",
  });

  assert.strictEqual(pausedNoRecent.status.code, 200);
  assert.deepStrictEqual(pausedNoRecent.sends.map((s) => s.to), ADMINS);
  assert.ok(!pausedNoRecent.sends.some((s) => s.to === LEAD));

  // Test case: Checkpoint de pago triggered via user asking how to pay
  const paymentQueryTest = await runWebhook({
    cliente: { telefono: LEAD, bot_enabled: true, estado: "interesado" },
    recentPausedAlert: false,
    claudeText: "",
    userMessage: "¿cómo pago?",
  });

  assert.strictEqual(paymentQueryTest.status.code, 200);
  assert.ok(paymentQueryTest.sends.some((s) => s.to === ADMIN && s.message.includes("CHECKPOINT DE PAGO")));
  assert.ok(paymentQueryTest.sends.some((s) => s.to === LEAD && s.message.includes("Perfecto. Te comparto los datos para apartarlo en un momento.")));
  assert.ok(paymentQueryTest.state.upserts.some((item) => item.payload.bot_enabled === false && item.payload.estado === "pago_pendiente_confirmacion"));

  // Test case: Checkpoint de pago triggered via Claude returning the state
  const paymentStateTest = await runWebhook({
    cliente: { telefono: LEAD, bot_enabled: true, estado: "interesado" },
    recentPausedAlert: false,
    claudeText: 'Entiendo.\nESTADO:{"caliente":true,"estado":"pago_pendiente_confirmacion","nombre":null,"negocio":null,"alerta":null,"intervencion":false,"razon_intervencion":null}',
    userMessage: "sí, compárteme los datos de transferencia",
  });

  assert.strictEqual(paymentStateTest.status.code, 200);
  assert.ok(paymentStateTest.sends.some((s) => s.to === ADMIN && s.message.includes("CHECKPOINT DE PAGO")));
  assert.ok(paymentStateTest.sends.some((s) => s.to === LEAD && s.message.includes("Perfecto. Te comparto los datos para apartarlo en un momento.")));
  assert.ok(paymentStateTest.state.upserts.some((item) => item.payload.bot_enabled === false && item.payload.estado === "pago_pendiente_confirmacion"));

  // Test case: giro mencionado a mitad de conversacion se persiste en conversation_state
  // y se espeja a conversaciones.categoria, sin depender de que Claude emita JSON.
  const giroTest = await runWebhook({
    cliente: { telefono: LEAD, bot_enabled: true, historial: [] },
    recentPausedAlert: false,
    claudeText: "Entendido. ¿Tienes ficha de Google Maps?",
    userMessage: "Tengo un restaurante de mariscos",
  });

  assert.strictEqual(giroTest.status.code, 200);
  const giroUpsert = giroTest.state.upserts.find((u) => u.table === "conversation_state" && u.payload.giro_negocio);
  assert.ok(giroUpsert, "debe persistir giro_negocio detectado a mitad de conversacion");
  assert.strictEqual(giroUpsert.payload.giro_negocio, "restaurante");
  const giroMirror = giroTest.state.upserts.find((u) => u.table === "conversaciones" && u.payload.categoria === "restaurante");
  assert.ok(giroMirror, "debe espejar categoria hacia conversaciones");

  // Test case: un "si" despues de un trigger confirmar_explicacion pendiente
  // limpia el trigger (no vuelve a preguntar en el siguiente turno).
  const triggerTest = await runWebhook({
    cliente: { telefono: LEAD, bot_enabled: true, historial: [] },
    recentPausedAlert: false,
    claudeText: "Perfecto, aquí tienes el detalle.",
    userMessage: "si",
    conversationStateInicial: { telefono: LEAD, ultimo_trigger: "confirmar_explicacion", ultimo_trigger_at: new Date().toISOString() },
  });

  assert.strictEqual(triggerTest.status.code, 200);
  const triggerUpsert = triggerTest.state.upserts.find((u) => u.table === "conversation_state" && "ultimo_trigger" in u.payload);
  assert.ok(triggerUpsert, "debe upsertear conversation_state limpiando el trigger resuelto");
  assert.strictEqual(triggerUpsert.payload.ultimo_trigger, null);
  assert.strictEqual(triggerUpsert.payload.ultimo_trigger_at, null);
  assert.strictEqual(triggerTest.state.conversationState[LEAD].ultimo_trigger, null);

  // Test case (Tarea 12): un ESTADO legado con "estado"/"negocio" ya no debe
  // sobreescribir conversaciones.estado/negocio (Tarea 10) — esos campos
  // ahora son responsabilidad exclusiva de conversation_state. "caliente"
  // se sigue extrayendo del JSON igual que siempre.
  const legacyEstadoTest = await runWebhook({
    cliente: { telefono: LEAD, bot_enabled: true, historial: [], estado: "interesado" },
    recentPausedAlert: false,
    claudeText: 'Genial, ya casi.\nESTADO:{"caliente":true,"estado":"cliente_caliente","nombre":null,"negocio":"Taco X","alerta":null,"intervencion":false,"razon_intervencion":null}',
  });

  assert.strictEqual(legacyEstadoTest.status.code, 200);
  const conversacionesUpserts = legacyEstadoTest.state.upserts.filter((u) => u.table === "conversaciones");
  assert.ok(
    !conversacionesUpserts.some((u) => u.payload.estado === "cliente_caliente"),
    "el 'estado' del ESTADO legado ya no debe escribirse en conversaciones"
  );
  assert.ok(
    !conversacionesUpserts.some((u) => u.payload.negocio === "Taco X"),
    "el 'negocio' del ESTADO legado ya no debe escribirse en conversaciones"
  );
  assert.ok(
    conversacionesUpserts.some((u) => u.payload.caliente === true),
    "caliente debe seguir escribiendose en conversaciones igual que antes de la tarea 10"
  );

  console.log("webhook intervention tests passed");
})();
