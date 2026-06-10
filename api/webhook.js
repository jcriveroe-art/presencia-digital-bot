const axios = require('axios');

export default async function handler(req, res) {
  // 1. Verificación para Meta (No tocar)
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
      return res.status(200).send(challenge);
    }
    return res.status(403).end();
  }

  // 2. Procesamiento de Mensajes
  if (req.method === 'POST') {
    const body = req.body;
    if (body.object === 'whatsapp_business_account') {
      const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
      if (message && message.text) {
        const from = message.from;
        const msgText = message.text.body;

        try {
          // LLAMADA A MANUS API - VERSIÓN DEFINITIVA
          await axios.post('https://api.manus.ai/v2/task.create', {
            message: {
              content: `NUEVO CLIENTE WHATSAPP:
              - Teléfono: ${from}
              - Mensaje: "${msgText}"
              
              INSTRUCCIÓN: Eres el asistente de ventas de Presencia Digital. Responde de forma breve y persuasiva. 
              CRÍTICO: Debes ENVIAR la respuesta tú mismo usando este comando CURL:
              curl -X POST "https://graph.facebook.com/v18.0/1171153759409978/messages" \\
              -H "Authorization: Bearer EAANUjm2AP5oBRhn1R5zl9j7o98o7lmtH8cQkn3YaUG4LCSb6xc7RTGdkzg5ZCwLg95syg0me9vZCmOKHqWktqq6glCZBMlixOQ2IuVcU5jO36cnTZBZATo8BKd9ShQJnzCEZCSzQakcuI4RgWssZB6Bp5Vm8cH6DSVnSW16GU8FN5DvOP98NHAr2q9oHBW8T20ZAzQZDZD" \\
              -H "Content-Type: application/json" \\
              -d '{"messaging_product": "whatsapp", "to": "${from}", "type": "text", "text": {"body": "TU_RESPUESTA_AQUÍ"}}'`
            },
            hide_in_task_list: false,
            agent_profile: 'manus-1.6-lite'
          }, {
            headers: {
              'x-manus-api-key': process.env.MANUS_API_KEY,
              'Content-Type': 'application/json'
            }
          } );
        } catch (error) {
          console.error("Error:", error.response?.data || error.message);
        }
      }
      return res.status(200).send('EVENT_RECEIVED');
    }
  }
  res.status(405).end();
}
