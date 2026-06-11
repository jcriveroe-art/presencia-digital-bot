const { json, sendWhatsApp, supabase } = require("./_crm");

function mensajeInicial(nombre) {
  return `Hola, soy Juan Carlos de Presencia Digital. Vi ${nombre} en Google Maps y detecté detalles que podrían estar haciendo que algunos clientes elijan otra opción antes de escribirles. ¿Les puedo compartir qué encontré?`;
}

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  const { telefono } = req.body || {};
  if (!telefono) return json(res, 400, { error: "telefono requerido" });

  const { data: lead, error } = await supabase
    .from("conversaciones")
    .select("telefono, nombre")
    .eq("telefono", telefono)
    .single();

  if (error || !lead) return json(res, 404, { error: "Lead no encontrado" });

  const mensaje = mensajeInicial(lead.nombre || "su negocio");
  try {
    const whatsapp = await sendWhatsApp(telefono, mensaje);
    const now = new Date().toISOString();
    await supabase
      .from("conversaciones")
      .upsert(
        {
          telefono,
          estado: "contactado",
          bot_enabled: true,
          ultimo_mensaje: mensaje,
          fecha_ultimo_mensaje: now,
          mensaje_inicial_enviado: true,
        },
        { onConflict: "telefono" }
      );
    return json(res, 200, { ok: true, mensaje, whatsapp });
  } catch (e) {
    const detail = e.response?.data || e.message;
    console.error("Error envio inicial:", detail);
    return json(res, 500, { error: "No se pudo enviar el mensaje inicial", detail });
  }
};
