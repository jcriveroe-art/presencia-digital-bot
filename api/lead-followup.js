const { json, logEventoCRM, requireCrmToken, supabase } = require("./_crm");

const CAMPOS = new Set([
  "proxima_accion",
  "fecha_seguimiento",
  "motivo_seguimiento",
  "seguimiento_activo",
  "objecion_principal",
  "resultado_conversacion",
]);

function cleanText(value) {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text === "" ? null : text;
}

function cleanBoolean(value) {
  if (typeof value === "boolean") return value;
  if (value === "true" || value === "1" || value === 1) return true;
  if (value === "false" || value === "0" || value === 0) return false;
  return true;
}

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");
  if (!requireCrmToken(req, res)) return;

  try {
    const { telefono, updates } = req.body || {};
    const tel = String(telefono || "").replace(/[+\s\-()]/g, "").trim();
    if (!tel) return json(res, 400, { ok: false, error: "telefono requerido" });
    if (!updates || typeof updates !== "object") {
      return json(res, 400, { ok: false, error: "updates debe ser un objeto" });
    }

    const payload = { ultima_accion_at: new Date().toISOString() };
    for (const [campo, valor] of Object.entries(updates)) {
      if (!CAMPOS.has(campo)) continue;
      if (campo === "seguimiento_activo") payload[campo] = cleanBoolean(valor);
      else if (campo === "fecha_seguimiento") payload[campo] = cleanText(valor);
      else payload[campo] = cleanText(valor);
    }

    const { data, error } = await supabase
      .from("conversaciones")
      .update(payload)
      .eq("telefono", tel)
      .select("*")
      .single();

    if (error) return json(res, 500, { ok: false, error: error.message });
    await logEventoCRM(tel, "seguimiento_programado", "Seguimiento actualizado desde CRM", payload);
    return json(res, 200, { ok: true, conversacion: data });
  } catch (e) {
    return json(res, 500, { ok: false, error: e.message });
  }
};
