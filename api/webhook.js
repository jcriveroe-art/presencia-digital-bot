const axios = require('axios');

export default async function handler(req, res) {
  // 1. Verificación de Webhook (Meta)
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
      return res.status(200).send(challenge);
    }
    return res.status(403).end();
  }

  // 2. Procesamiento de Mensajes (POST)
  if (req.method === 'POST') {
    const body = req.body;
    if (body.object === 'whatsapp_business_account') {
      const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
      if (message && message.text) {
        const from = message.from;
        const msgText = message.text.body;

        try {
          // LLAMADA A MANUS API
          // Yo me encargaré de enviar la respuesta a WhatsApp usando tu Token
          await axios.post('https://api.manus.ai/v2/task.create', {
            message: {
              content: `Cliente WhatsApp (${from} ) dice: "${msgText}". Responde siguiendo el Sales Playbook de presencia digital y envíale la respuesta directamente a su WhatsApp.`
            },
            hide_in_task_list: true // Para que no sature tu historial web
          }, {
            headers: {
              'x-manus-api-key': process.env.MANUS_API_KEY,
              'Content-Type': 'application/json'
            }
          });
        } catch (error) {
          console.error("Error con Manus API:", error.message);
        }
      }
      return res.status(200).send('EVENT_RECEIVED');
    }
  }
  res.status(405).end();
}
