const assert = require("assert");

process.env.SUPABASE_URL = "https://example.supabase.co";
process.env.SUPABASE_SERVICE_KEY = "test";
process.env.ANTHROPIC_API_KEY = "test";
process.env.WHATSAPP_TOKEN = "test";
process.env.PHONE_NUMBER_ID = "123";
process.env.TELEGRAM_BOT_TOKEN = "test";
process.env.TELEGRAM_CHAT_ID = "test";

const axios = require("axios");
axios.post = async () => ({ data: { ok: true } });

const { supabase } = require("../lib/crm");

function mockSupabase() {
  const calls = [];
  supabase.from = (table) => ({
    update: (payload) => ({
      eq: async () => {
        calls.push({ table, type: "update", payload });
        return { error: null };
      },
    }),
    upsert: async (payload) => {
      calls.push({ table, type: "upsert", payload });
      return { data: payload, error: null };
    },
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

const { responderComercialCritico } = require("../api/webhook").__test;
const TEL = "525512345678";

function assertEtapaSincronizada(calls, etapaEsperada) {
  const csCall = calls.find((c) => c.table === "conversation_state" && c.payload.etapa === etapaEsperada);
  assert.ok(csCall, `debe upsertear conversation_state con etapa="${etapaEsperada}"`);
  const mirrorCall = calls.find((c) => c.table === "conversaciones" && c.payload.estado === etapaEsperada);
  assert.ok(mirrorCall, `debe espejar estado="${etapaEsperada}" hacia conversaciones`);
}

(async () => {
  // no_interesado (diceQueNoOMolesto — hoy usa update() directo, no saveCliente)
  {
    const calls = mockSupabase();
    await responderComercialCritico(TEL, "no me interesa, ya no me escribas", {});
    assertEtapaSincronizada(calls, "no_interesado");
  }

  // requiere_intervencion via solicitaHumano
  {
    const calls = mockSupabase();
    await responderComercialCritico(TEL, "quiero hablar con un humano", {});
    assertEtapaSincronizada(calls, "requiere_intervencion");
  }

  // requiere_intervencion via esFueraDeAlcance
  {
    const calls = mockSupabase();
    await responderComercialCritico(TEL, "hacen paginas web o diseno web?", {});
    assertEtapaSincronizada(calls, "requiere_intervencion");
  }

  // pago_pendiente_confirmacion via preguntaComoPagar
  {
    const calls = mockSupabase();
    await responderComercialCritico(TEL, "como pago?", {});
    assertEtapaSincronizada(calls, "pago_pendiente_confirmacion");
  }

  // interesado via pideDescuentoOPiloto
  {
    const calls = mockSupabase();
    await responderComercialCritico(TEL, "me haces un descuento?", {});
    assertEtapaSincronizada(calls, "interesado");
  }

  // interesado via preguntaPrecio
  {
    const calls = mockSupabase();
    await responderComercialCritico(TEL, "cuanto cuesta?", {});
    assertEtapaSincronizada(calls, "interesado");
  }

  // interesado via esAceptacionOpener con observaciones aptas
  {
    const calls = mockSupabase();
    await responderComercialCritico(TEL, "si, comparteme", {
      diagnostico_fotos: "Tienes baja actividad visual en la ficha, revisa tus fotos.",
    });
    assertEtapaSincronizada(calls, "interesado");
  }

  // interesado via esAceptacionOpener sin observaciones aptas (fallback)
  {
    const calls = mockSupabase();
    await responderComercialCritico(TEL, "va, dale", {});
    assertEtapaSincronizada(calls, "interesado");
  }

  console.log("responder-comercial-critico-conversation-state tests passed");
})();
