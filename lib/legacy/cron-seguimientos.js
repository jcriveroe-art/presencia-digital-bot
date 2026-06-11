const fs = require("fs");
const path = require("path");
const Anthropic = require("@anthropic-ai/sdk");
const { json, logEventoCRM, sendWhatsApp, supabase } = require("./_crm");

const client = new Anthropic.Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const JUAN_CARLOS_NUMBER = "5215647943262";
const DOCE_HORAS_MS = 12 * 60 * 60 * 1000;
const ESTADOS = ["interesado", "seguimiento", "cliente_caliente", "contactado"];
const SALES_PLAYBOOK_PATH = path.join(__dirname, "..", "playbooks", "sales_playbook_v1.md");

function autorizado(req) {
  return req.headers["x-cron-secret"] && req.headers["x-cron-secret"] === process.env.CRON_SECRET;
}

function loadSalesPlaybook() {
  try {
    return fs.readFileSync(SALES_PLAYBOOK_PATH, "utf8").trim();
  } catch (e) {
    return "No inventes datos. No presiones. Mensaje maximo 3 lineas.";
  }
}

function reciente(fecha) {
  if (!fecha) return false;
  return new Date(fecha).getTime() > Date.now() - DOCE_HORAS_MS;
}

function promptLead(lead, mensajes) {
  const historial = (mensajes || [])
    .slice(-8)
    .map((m) => `${m.direccion}: ${m.mensaje}`)
    .join("\n");
  return [
    "SALES_PLAYBOOK",
    loadSalesPlaybook(),
    "CONTEXTO DEL LEAD",
    `nombre: ${lead.nombre || "sin datos"}`,
    `categoria: ${lead.categoria || "sin datos"}`,
    `estado: ${lead.estado || "sin datos"}`,
    `fugas_detectadas: ${lead.fugas_detectadas || "sin datos"}`,
    `diagnostico_fotos: ${lead.diagnostico_fotos || "sin datos"}`,
    `direccion: ${lead.direccion || "sin datos"}`,
    "NOTAS INTERNAS",
    lead.notas || "Sin notas internas.",
    "SEGUIMIENTO",
    `motivo_seguimiento: ${lead.motivo_seguimiento || "sin datos"}`,
    `proxima_accion: ${lead.proxima_accion || "sin datos"}`,
    "HISTORIAL RECIENTE",
    historial || "Sin historial.",
    "INSTRUCCIONES",
    "Genera un seguimiento breve de maximo 3 lineas para WhatsApp.",
    "No cobres salvo que exista intencion clara de compra en el historial.",
    "No inventes datos. No menciones notas internas.",
    "Si detectas duda comercial compleja, responde exactamente: REQUIERE_INTERVENCION: razon.",
  ].join("\n");
}

async function ultimoMensajeCliente(telefono) {
  const { data } = await supabase
    .from("mensajes")
    .select("created_at")
    .eq("telefono", telefono)
    .eq("direccion", "entrante")
    .order("created_at", { ascending: false })
    .limit(1);
  return data?.[0]?.created_at || null;
}

async function historial(telefono) {
  const { data } = await supabase
    .from("mensajes")
    .select("direccion, mensaje, created_at")
    .eq("telefono", telefono)
    .order("created_at", { ascending: false })
    .limit(12);
  return (data || []).reverse();
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
      .eq("bot_enabled", true)
      .in("estado", ESTADOS)
      .lte("fecha_seguimiento", now)
      .order("fecha_seguimiento", { ascending: true })
      .limit(25);

    if (error) return json(res, 500, { ok: false, error: error.message });

    const enviados = [];
    const intervenidos = [];
    for (const lead of data || []) {
      if (lead.estado === "requiere_intervencion" || lead.estado === "perdido") continue;
      if (reciente(lead.ultimo_recordatorio_at)) continue;
      if (reciente(await ultimoMensajeCliente(lead.telefono))) continue;

      const mensajes = await historial(lead.telefono);
      const response = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 220,
        system: "Eres asistente de seguimiento comercial de CRM ON. Obedece estrictamente el playbook.",
        messages: [{ role: "user", content: promptLead(lead, mensajes) }],
      });
      const texto = String(response.content[0].text || "").trim();

      if (/^REQUIERE_INTERVENCION:/i.test(texto)) {
        const razon = texto.replace(/^REQUIERE_INTERVENCION:\s*/i, "").trim();
        await supabase
          .from("conversaciones")
          .update({ estado: "requiere_intervencion", bot_enabled: false, ultimo_recordatorio_at: now })
          .eq("telefono", lead.telefono);
        await sendWhatsApp(JUAN_CARLOS_NUMBER, `INTERVENCION REQUERIDA\nLead: ${lead.nombre || lead.telefono}\nTelefono: ${lead.telefono}\nMotivo: ${razon}\nAccion sugerida: Responder manualmente desde CRM.`);
        await logEventoCRM(lead.telefono, "requiere_intervencion", razon, { origen: "cron-seguimientos" });
        intervenidos.push(lead.telefono);
        continue;
      }

      await sendWhatsApp(lead.telefono, texto);
      const sentAt = new Date().toISOString();
      await supabase
        .from("conversaciones")
        .update({
          estado: lead.estado === "contactado" ? "seguimiento" : lead.estado,
          ultimo_mensaje: texto,
          fecha_ultimo_mensaje: sentAt,
          ultimo_recordatorio_at: sentAt,
        })
        .eq("telefono", lead.telefono);
      await logEventoCRM(lead.telefono, "seguimiento_enviado", "Seguimiento automatico enviado", { mensaje: texto });
      enviados.push(lead.telefono);
    }

    return json(res, 200, { ok: true, enviados: enviados.length, intervenidos: intervenidos.length, telefonos: enviados });
  } catch (e) {
    return json(res, 500, { ok: false, error: e.message });
  }
};
