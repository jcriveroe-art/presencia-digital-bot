const { json, logEventoCRM, requireCrmToken, sendWhatsApp, supabase } = require("./_crm");

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");
  if (!requireCrmToken(req, res)) return;

  const { telefono, mensaje } = req.body || {};
  if (!String(telefono || "").trim() || !String(mensaje || "").trim()) {
    return json(res, 400, { ok: false, error: "telefono y mensaje son requeridos" });
  }

  try {
    const whatsapp = await sendWhatsApp(telefono, mensaje);
    await supabase
      .from("conversaciones")
      .upsert(
        { telefono, ultimo_mensaje: mensaje, fecha_ultimo_mensaje: new Date().toISOString() },
        { onConflict: "telefono" }
      );
    await logEventoCRM(telefono, "mensaje_saliente", "Mensaje manual enviado desde CRM", { mensaje });
    return json(res, 200, { ok: true, whatsapp });
  } catch (e) {
    const detail = e.response?.data || e.message;
    console.error("Error envio manual:", detail);
    return json(res, 500, { error: "No se pudo enviar el mensaje", detail });
  }
};
