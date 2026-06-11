const axios = require("axios");
const { createClient } = require("@supabase/supabase-js");

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;

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
    if (error) console.error("Supabase mensajes error:", error.message);
  } catch (e) {
    console.error("Supabase mensajes exception:", e.message);
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

async function sendWhatsApp(to, message) {
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

module.exports = {
  json,
  logMensaje,
  logEventoCRM,
  requireCrmToken,
  sendWhatsApp,
  supabase,
};
