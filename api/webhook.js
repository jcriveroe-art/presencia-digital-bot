const axios = require('axios');

export default async function handler(req, res) {
  // 1. Verificación de Webhook (Meta) - Esto se queda igual
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
          // LLAMADA A MANUS API USANDO EL PROYECTO
          await axios.post('https://api.manus.ai/v2/task.create', {
            message: {
              content: `Responde a este mensaje de WhatsApp de ${from}: "${msgText}". Usa las credenciales de Meta guardadas en el proyecto para enviar la respuesta.`
            },
            project_id: "proj_whatsapp_presencia_digital", // Este ID vincula todo
            hide_in_task_list: true
          }, {
            headers: {
              'x-manus-api-key': process.env.MANUS_API_KEY,
              'Content-Type': 'application/json'
            }
          } );
        } catch (error) {
          console.error("Error con Manus API:", error.message);
        }
      }
      return res.status(200).send('EVENT_RECEIVED');
    }
  }
  res.status(405).end();
}
