const { json, supabase } = require("./_crm");

module.exports = async (req, res) => {
  if (req.method !== "GET") return res.status(405).send("Method Not Allowed");

  const telefono = req.query.telefono;
  if (!telefono) return json(res, 400, { error: "telefono requerido" });

  const { data, error } = await supabase
    .from("mensajes")
    .select("id, telefono, direccion, mensaje, raw, created_at")
    .eq("telefono", telefono)
    .order("created_at", { ascending: true });

  if (error) return json(res, 500, { error: error.message });
  return json(res, 200, { mensajes: data || [] });
};
