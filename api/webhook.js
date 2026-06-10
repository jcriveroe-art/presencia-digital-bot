const Anthropic = require("@anthropic-ai/sdk");
const axios = require("axios");

const client = new Anthropic.Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;

const SYSTEM_PROMPT = `Eres un asistente de ventas de Presencia Digital IA, una agencia de presencia digital para pequeños negocios en Naucalpan, Satélite y Tlalnepantla.

PRODUCTOS:
- Diagnóstico ON: Gratis (gancho de entrada)
- Auditoría ON: $2,500 pago único
- Activación ON: $4,500 pago único
- Presencia ON: $6,500/mes (primer mes incluye Auditoría)

REGLAS:
- Tono informal, cercano, directo. Máximo 3-4 líneas por mensaje.
- Nunca digas "número 1 en Google", di "competir mejor en tu zona"
- Nunca digas "reseñas automáticas", di "sistema para pedir reseñas reales"
- Nunca ofrezcas llamadas ni videollamadas
- Máximo 2 seguimientos sin respuesta
- El siguiente paso siempre es el Diagnóstico ON gratis
- Para cerrar usa: "¿Te mando los datos para la transferencia?"

OBJECIONES COMUNES:
- "Estamos en temporada baja" → El mejor momento para aparecer primero es ANTES de temporada alta
- "Ya tenemos Facebook" → Facebook no aparece en búsquedas de Google Maps, nosotros sí
- "Está caro" → Un cliente nuevo al mes ya paga el servicio
- "Déjame pensarlo" → Ofrece el Diagnóstico gratis sin compromiso`;

async function sendMessage(to, message) {
  await axios.post(
    `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,
    {
      messaging_product: "whatsapp",
      to: to,
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
}

async function getClaudeResponse(userMessage) {
  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 300,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMessage }],
  });
  return message.content[0].text;
}

module.exports = async (req, res) => {
  if (req.method === "GET") {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      return res.status(200).send(challenge);
    }
    return res.status(403).send("Forbidden");
  }

  if (req.method === "POST") {
    const body = req.body;
    if (body.object === "whatsapp_business_account") {
      for (const entry of body.entry) {
        for (const change of entry.changes) {
          const messages = change.value?.messages;
          if (messages && messages.length > 0) {
            const msg = messages[0];
            const from = msg.from;
            const text = msg.text?.body;
            if (text) {
              const reply = await getClaudeResponse(text);
              await sendMessage(from, reply);
            }
          }
        }
      }
    }
    return res.status(200).json({ status: "ok" });
  }

  res.status(405).send("Method Not Allowed");
};