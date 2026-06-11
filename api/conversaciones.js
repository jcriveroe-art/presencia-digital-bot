const { json, supabase } = require("./_crm");

module.exports = async (req, res) => {
  if (req.method !== "GET") return res.status(405).send("Method Not Allowed");

  const { data, error } = await supabase
    .from("conversaciones")
    .select("telefono, estado, nombre, negocio, fecha_ultimo_mensaje, caliente, bot_enabled")
    .order("fecha_ultimo_mensaje", { ascending: false });

  if (error) return json(res, 500, { error: error.message });
  return json(res, 200, { conversaciones: data || [] });
};
