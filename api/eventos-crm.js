const { json, requireCrmToken, supabase } = require("./_crm");

module.exports = async (req, res) => {
  if (req.method !== "GET") return res.status(405).send("Method Not Allowed");
  if (!requireCrmToken(req, res)) return;

  try {
    const telefono = String(req.query.telefono || "").trim();
    if (!telefono) return json(res, 400, { ok: false, error: "telefono requerido" });

    const { data, error } = await supabase
      .from("eventos_crm")
      .select("id, telefono, tipo, descripcion, metadata, created_at")
      .eq("telefono", telefono)
      .order("created_at", { ascending: false })
      .limit(80);

    if (error) return json(res, 500, { ok: false, error: error.message });
    return json(res, 200, { ok: true, eventos: data || [] });
  } catch (e) {
    return json(res, 500, { ok: false, error: e.message });
  }
};
