const axios = require('axios');

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
      return res.status(200).send(challenge);
    }
    return res.status(403).end();
  }

  if (req.method === 'POST') {
    const body = req.body;
    if (body.object === 'whatsapp_business_account') {
      const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
      if (message && message.text) {
        const from = message.from;
        const msgText = message.text.body;

        try {
          // LLAMADA DIRECTA A MANUS CON TODO EL CONTEXTO
          await axios.post('https://api.manus.ai/v2/task.create', {
            message: {
              content: `ACTÚA COMO BOT DE VENTAS.
              Contexto: Eres un experto en ventas de presencia digital.
              Cliente (${from} ) dice: "${msgText}".
              INSTRUCCIÓN CRÍTICA: Genera una respuesta persuasiva y envíala de inmediato a WhatsApp usando:
              - Phone Number ID: 1171153759409978
              - Access Token: EAANUjm2AP5oBRtYxZAwE63e65y4ZA4KroOnbRZBZCbPjdnhSKmakrAhI9xYrcZAv1a2ctPrsZAnflZCzP47ZAJMyfYp7NchZCXHRIePBccgPdyVAOkEstVmQdRxnzZA9WDtDRcODnL5Vg30ba7p4EMkYied6TZBaxukNDGzCaZAz5SZAWyFh8WR2jbOp57bKUoMxQj2e8WwZDZD`
            },
            hide_in_task_list: true,
            agent_profile: 'manus-1.6-lite' // Más rápido para respuestas de chat
          }, {
            headers: {
              'x-manus-api-key': process.env.MANUS_API_KEY,
              'Content-Type': 'application/json'
            }
          });
        } catch (error) {
          console.error("Error con Manus API:", error.response?.data || error.message);
        }
      }
      return res.status(200).send('EVENT_RECEIVED');
    }
  }
  res.status(405).end();
}
