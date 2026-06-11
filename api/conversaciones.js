const { json, supabase } = require("./_crm");

module.exports = async (req, res) => {
  if (req.method !== "GET") return res.status(405).send("Method Not Allowed");

  const { data, error } = await supabase
    .from("conversaciones")
    .select("telefono, estado, nombre, negocio, fecha_ultimo_mensaje, caliente, bot_enabled, categoria, prioridad, score, total_fugas, fugas_detectadas, rating, resenas, fotos, ultima_resena, responde_resenas, publicaciones, website, horarios, descripcion, whatsapp_link, direccion, maps_url, ultimo_mensaje, mensaje_inicial_enviado")
    .order("fecha_ultimo_mensaje", { ascending: false });

  if (error) return json(res, 500, { error: error.message });
  return json(res, 200, { conversaciones: data || [] });
};
