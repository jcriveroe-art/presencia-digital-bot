const assert = require("assert");
const Module = require("module");

process.env.ANTHROPIC_API_KEY = "test";
process.env.SUPABASE_URL = "https://example.supabase.co";
process.env.SUPABASE_SERVICE_KEY = "test";
process.env.VERIFY_TOKEN = "verify";

const ADMIN = "525647943262";
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

async function runWebhook({ cliente, recentPausedAlert, claudeText, userMessage }) {
  const sends = [];
  const supabaseMock = createSupabaseMock({ cliente, recentPausedAlert });
  const originalLoad = Module._load;

  Module._load = function patchedLoad(request, parent, isMain) {
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
  assert.deepStrictEqual(intervention.sends.map((s) => s.to), [ADMIN]);
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
  assert.deepStrictEqual(pausedNoRecent.sends.map((s) => s.to), [ADMIN]);
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

  console.log("webhook intervention tests passed");
})();
