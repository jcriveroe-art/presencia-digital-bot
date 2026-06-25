const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { createClient } = require("@supabase/supabase-js");
const axios = require("axios");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Helper to get raw body from request
async function getRawBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

// Phone number normalization helper
function normalizarTelefono(phone) {
  if (!phone) return null;
  let clean = phone.replace(/[^0-9]/g, "");
  // If it starts with 521 and is 13 digits (e.g. 521449...), convert to 52...
  if (clean.startsWith("521") && clean.length === 13) {
    clean = "52" + clean.slice(3);
  }
  // If it has 10 digits (e.g. 449...), add prefix 52
  else if (clean.length === 10) {
    clean = "52" + clean;
  }
  // If it has 11 digits and starts with 1 (e.g. 1449...), remove 1 and add 52
  else if (clean.length === 11 && clean.startsWith("1")) {
    clean = "52" + clean.slice(1);
  }
  return clean;
}

// Telegram alert helper
async function alertarTelegram(negocio, telefono, monto) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    console.error("Faltan variables de entorno de Telegram");
    return;
  }
  const mensaje = `✅ PAGO RECIBIDO (STRIPE)\n\n🏢 Negocio: ${negocio}\n📞 Teléfono: ${telefono}\n💰 Monto: $${monto} MXN`;
  try {
    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
      chat_id: chatId,
      text: mensaje,
    });
    console.log("Alerta de Telegram enviada con éxito");
  } catch (e) {
    console.error("Error al enviar alerta a Telegram:", e.message);
  }
}

// WhatsApp sending helper using process.env secrets
async function enviarMensajeWhatsApp(to, mensaje) {
  const phoneId = process.env.PHONE_NUMBER_ID;
  const token = process.env.WHATSAPP_TOKEN;
  if (!phoneId || !token) {
    console.error("Faltan variables de entorno de WhatsApp");
    return;
  }
  try {
    await axios.post(
      `https://graph.facebook.com/v18.0/${phoneId}/messages`,
      {
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: mensaje },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    console.log("Mensaje de confirmación WhatsApp enviado a:", to);
  } catch (e) {
    console.error("Error al enviar mensaje de WhatsApp:", e.response?.data || e.message);
  }
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }

  const sig = req.headers["stripe-signature"];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    const rawBody = await getRawBody(req);
    event = stripe.webhooks.constructEvent(rawBody, sig, endpointSecret);
  } catch (err) {
    console.error(`❌ Error de firma de Stripe Webhook: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`🔔 Evento recibido de Stripe: ${event.type}`);

  if (
    event.type === "checkout.session.completed" ||
    event.type === "payment_intent.succeeded"
  ) {
    const sessionOrIntent = event.data.object;

    // Extract phone number from metadata or customer_details
    let rawPhone = null;
    if (sessionOrIntent.metadata && sessionOrIntent.metadata.telefono) {
      rawPhone = sessionOrIntent.metadata.telefono;
    } else if (sessionOrIntent.customer_details && sessionOrIntent.customer_details.phone) {
      rawPhone = sessionOrIntent.customer_details.phone;
    }

    const telefono = normalizarTelefono(rawPhone);

    // Extract amount
    const amountTotal = sessionOrIntent.amount_total || sessionOrIntent.amount || 0;
    const montoPagado = amountTotal / 100;

    if (!telefono) {
      console.error("❌ No se encontró teléfono en los metadatos ni en los datos del cliente.");
      return res.status(200).json({ received: true, error: "No phone number found" });
    }

    console.log(`Processing successful payment for phone: ${telefono}, amount: ${montoPagado}`);

    try {
      // 1. Get client details from conversations
      const { data: cliente, error: getError } = await supabase
        .from("conversaciones")
        .select("*")
        .eq("telefono", telefono)
        .single();

      if (getError || !cliente) {
        console.warn(`⚠️ Cliente con teléfono ${telefono} no encontrado en la base de datos.`);
      }

      const nombreNegocio = cliente ? (cliente.negocio || cliente.nombre || "Negocio desconocido") : "Negocio desconocido";

      // 2. Update conversations table
      const updatePayload = {
        estado: "diagnostico_pagado",
        caliente: false,
        estado_pago: "pagado",
        monto_pagado: montoPagado,
        fecha_venta: new Date().toISOString(),
        bot_enabled: true, // Keep bot enabled as requested
      };

      const { error: updateError } = await supabase
        .from("conversaciones")
        .update(updatePayload)
        .eq("telefono", telefono);

      if (updateError) {
        console.error(`❌ Error al actualizar conversación en Supabase: ${updateError.message}`);
      } else {
        console.log(`✅ Conversación actualizada con éxito para ${telefono}`);
      }

      // 3. Send WhatsApp confirmation message
      const mensajeConfirmacion = "¡Recibimos tu pago! 🎉 En las próximas 24 horas te enviamos el Diagnóstico ON con el análisis completo de tu negocio. Si tienes dudas, aquí estamos.";
      await enviarMensajeWhatsApp(telefono, mensajeConfirmacion);

      // 4. Send Telegram Alert to Juan Carlos
      await alertarTelegram(nombreNegocio, telefono, montoPagado);

    } catch (err) {
      console.error(`❌ Error inesperado procesando el pago: ${err.message}`);
    }
  }

  res.status(200).json({ received: true });
};

// Disable Vercel's default body parser so we can verify the Stripe signature using raw body
module.exports.config = {
  api: {
    bodyParser: false,
  },
};
