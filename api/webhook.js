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
          console.log("Enviando mensaje a Manus para cliente:", from);
          const response = await axios.post('https://api.manus.ai/v2/task.create', {
            message: {
              content: `Responde al cliente ${from}: "${msgText}". ENVÍALO a WhatsApp con ID 1171153759409978 y Token EAANUjm2AP5oBRqKpG99IekAjU0oTVRiRZCAWxZBG8IIuSUlwk6nTBUiYuK6neg8LIweNnu0hDZADF0lLsQHPiuIudLje2SxWASxYeZC5dZCJZBMn9zLxjjsVl5r5xrxMzIfZBRrxTdShvLZB7NCdCz1Xi7OdMI4ANnzFA4514sbbZC5zy5EZALYjY3HEUCb9ud5NPKD6Mn7tMk0n1KLyNdaewC7PJGCC1Po0YmVx1GP04xwkZAwXJqNyz0Q4lp2PdPUBFGdEafQhqfjHE10DzeK49e2ZBPH5T2ogfH5fKABjbQZDZD`
            },
            hide_in_task_list: false 
          }, {
            headers: {
              'x-manus-api-key': process.env.MANUS_API_KEY,
              'Content-Type': 'application/json'
            }
          } );
          console.log("Respuesta de Manus API:", response.data);
        } catch (error) {
          console.error("ERROR DETALLADO:", error.response?.data || error.message);
        }

      }
      return res.status(200).send('EVENT_RECEIVED');
    }
  }
  res.status(405).end();
}
