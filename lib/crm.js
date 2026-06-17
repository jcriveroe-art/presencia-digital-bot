const axios = require("axios");
const { createClient } = require("@supabase/supabase-js");

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const JUAN_CARLOS_NUMBER = "5215647943262";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

function json(res, status, payload) {
  res.status(status).json(payload);
}

function requireCrmToken(req, res) {
  const expected = process.env.CRM_API_TOKEN;
  if (!expected) return true;
  if (req.headers["x-crm-token"] === expected) return true;
  json(res, 401, { ok: false, error: "CRM token invalido o faltante" });
  return false;
}

async function logMensaje(telefono, direccion, mensaje, raw) {
  try {
    const { error } = await supabase.from("mensajes").insert({
      telefono,
      direccion,
      mensaje,
      raw: raw || null,
    });
    if (error) {
      console.error("Supabase mensajes error:", error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.error("Supabase mensajes exception:", e.message);
    return false;
  }
}

async function logEventoCRM(telefono, tipo, descripcion, metadata) {
  try {
    const { error } = await supabase.from("eventos_crm").insert({
      telefono,
      tipo,
      descripcion: descripcion || null,
      metadata: metadata || null,
    });
    if (error) console.error("Supabase eventos_crm error:", error.message);
  } catch (e) {
    console.error("Supabase eventos_crm exception:", e.message);
  }
}

function isProtectedAdministrativeMessage(message) {
  const text = String(message || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
  return [
    "INTERVENCION REQUERIDA",
    "IA PAUSADA",
    "RESPONDER MANUALMENTE DESDE CRM",
  ].some((fragment) => text.includes(fragment));
}

function hasInternalStateLeak(message) {
  return /ESTADO\s*:|"caliente"\s*:|"intervencion"\s*:|"razon_intervencion"\s*:|"bot_enabled"\s*:|requiere_intervencion/i.test(String(message || ""));
}

async function sendWhatsApp(to, message) {
  if (isProtectedAdministrativeMessage(message) && String(to) !== JUAN_CARLOS_NUMBER) {
    console.error("Bloqueado envio administrativo a destino no admin:", {
      to,
      reason: "protected_administrative_message",
    });
    throw new Error("Mensaje administrativo bloqueado para destino no admin");
  }
  if (hasInternalStateLeak(message) && String(to) !== JUAN_CARLOS_NUMBER) {
    console.error("Bloqueado envio con estado interno a destino no admin:", {
      to,
      reason: "internal_state_leak",
    });
    throw new Error("Mensaje con estado interno bloqueado para destino no admin");
  }

  const response = await axios.post(
    `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,
    {
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: message },
    },
    {
      headers: {
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
    }
  );

  await logMensaje(to, "saliente", message, response.data);
  await logEventoCRM(to, "mensaje_saliente", message, { whatsapp: response.data });
  return response.data;
}

async function sendWhatsAppTemplate(to, templateName, languageCode, params) {
  const response = await axios.post(
    `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,
    {
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: {
        name: templateName,
        language: { code: languageCode },
        components: [
          {
            type: "body",
            parameters: params.map((p) => ({ type: "text", text: p })),
          },
        ],
      },
    },
    {
      headers: {
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
    }
  );
  await logEventoCRM(to, "mensaje_inicial_enviado", "Plantilla " + templateName + " enviada", { whatsapp: response.data, template: templateName });
  return response.data;
}

module.exports = {
  hasInternalStateLeak,
  json,
  isProtectedAdministrativeMessage,
  logMensaje,
  logEventoCRM,
  requireCrmToken,
  sendWhatsApp,
  sendWhatsAppTemplate,
  supabase,
};
