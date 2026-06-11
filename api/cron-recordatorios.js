const { json, logEventoCRM, sendWhatsApp, supabase } = require("./_crm");

const JUAN_CARLOS_NUMBER = "5215647943262";
const CRM_URL = "https://presencia-digital-bot.vercel.app/crm";
const DOCE_HORAS_MS = 12 * 60 * 60 * 1000;

function autorizado(req) {
  return req.headers["x-cron-secret"] && req.headers["x-cron-secret"] === process.env.CRON_SECRET;
}

function puedeRecordar(lead) {
  if (!lead.ultimo_recordatorio_at) return true;
  return new Date(lead.ultimo_recordatorio_at).getTime() <= Date.now() - DOCE_HORAS_MS;
}

function mensajeRecordatorio(lead) {
  return [
    "RECORDATORIO CRM ON",
    `Lead: ${lead.nombre || lead.negocio || "sin datos"}`,
    `Telefono: ${lead.telefono}`,
    `Estado: ${lead.estado || "sin datos"}`,
    `Proxima accion: ${lead.proxima_accion || "sin datos"}`,
    `Motivo: ${lead.motivo_seguimiento || "sin datos"}`,
    `Notas: ${lead.notas || "sin notas"}`,
    `Abrir CRM: ${CRM_URL}`,
  ].join("\n");
}

module.exports = async (req, res) => {
  if (req.method !== "POST" && req.method !== "GET") return res.status(405).send("Method Not Allowed");
  if (!autorizado(req)) return json(res, 401, { ok: false, error: "Unauthorized" });

  try {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("conversaciones")
      .select("*")
      .eq("seguimiento_activo", true)
      .lte("fecha_seguimiento", now)
      .order("fecha_seguimiento", { ascending: true })
      .limit(50);

    if (error) return json(res, 500, { ok: false, error: error.message });

    const enviados = [];
    for (const lead of data || []) {
      if (!puedeRecordar(lead)) continue;
      await sendWhatsApp(JUAN_CARLOS_NUMBER, mensajeRecordatorio(lead));
      const sentAt = new Date().toISOString();
      await supabase
        .from("conversaciones")
        .update({ ultimo_recordatorio_at: sentAt })
        .eq("telefono", lead.telefono);
      await logEventoCRM(lead.telefono, "recordatorio_enviado", "Recordatorio enviado a Juan Carlos", {
        proxima_accion: lead.proxima_accion,
        motivo_seguimiento: lead.motivo_seguimiento,
      });
      enviados.push(lead.telefono);
    }

    return json(res, 200, { ok: true, enviados: enviados.length, telefonos: enviados });
  } catch (e) {
    return json(res, 500, { ok: false, error: e.message });
  }
};
