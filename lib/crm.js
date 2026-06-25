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
  return /ESTADO\s*:\s*[\{\`]|"caliente"\s*:|"estado"\s*:|"intervencion"\s*:|"razon_intervencion"\s*:|"bot_enabled"\s*:/i.test(String(message || ""));
}

function extractUrls(text) {
  const urlRegex = /https?:\/\/[^\s$.?#].[^\s]*/gi;
  return text.match(urlRegex) || [];
}

function hasForbiddenUrls(message) {
  const urls = extractUrls(message);
  const allowedDomains = [
    "buy.stripe.com",
    "presencia-digital-bot.vercel.app",
    "vercel.app"
  ];
  
  for (const url of urls) {
    try {
      const urlObj = new URL(url);
      const host = urlObj.hostname.toLowerCase();
      const isAllowed = allowedDomains.some(domain => host === domain || host.endsWith("." + domain));
      if (!isAllowed) {
        return true;
      }
    } catch (e) {
      return true;
    }
  }
  return false;
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
  if (hasForbiddenUrls(message) && String(to) !== JUAN_CARLOS_NUMBER) {
    console.error("Bloqueado envio con URL no autorizada a destino no admin:", {
      to,
      reason: "forbidden_url_detected",
      message: message
    });
    throw new Error("Mensaje con URL no autorizada bloqueado para destino no admin");
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

function sanitizarVariablePlantilla(texto) {
  if (!texto) return "";
  return String(texto)
    .replace(/[\r\n\t]+/g, " ")           // saltos de línea y tabs -> espacio
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "") // emojis comunes
    .replace(/["']/g, "")                  // comillas que rompen el parámetro
    .replace(/\s{2,}/g, " ")               // espacios múltiples -> uno solo
    .trim()
    .slice(0, 60);                         // límite razonable de longitud para el parámetro
}

async function sendWhatsAppTemplate(to, templateName, languageCode, params) {
  try {
    const isDiagnostico = templateName === "diagnostico_on_inicial";
    const mappedParameters = params.map((p, index) => {
      const param = { type: "text", text: p };
      if (isDiagnostico && index === 0) {
        param.parameter_name = "nombre_negocio";
      }
      return param;
    });

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
              parameters: mappedParameters,
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
  } catch (err) {
    const metaError = err.response?.data || { message: err.message };
    console.error("sendWhatsAppTemplate error Meta", {
      to,
      templateName,
      params,
      status: err.response?.status,
      metaError,
    });
    await logEventoCRM(to, "mensaje_inicial_fallido", "Plantilla " + templateName + " fallo al enviar", {
      template: templateName,
      params,
      metaError,
    }).catch(() => {});
    const wrapped = new Error(metaError?.error?.message || metaError?.message || "Error al enviar plantilla de WhatsApp");
    wrapped.metaError = metaError;
    wrapped.status = err.response?.status || 500;
    throw wrapped;
  }
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
  sanitizarVariablePlantilla,
  supabase,
};
