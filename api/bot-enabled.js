const { json, logEventoCRM, requireCrmToken, supabase } = require("./_crm");

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");
  if (!requireCrmToken(req, res)) return;

  const { telefono, bot_enabled } = req.body || {};
  if (!telefono || typeof bot_enabled !== "boolean") {
    return json(res, 400, { error: "telefono y bot_enabled boolean son requeridos" });
  }

  const { data, error } = await supabase
    .from("conversaciones")
    .upsert(
      {
        telefono,
        bot_enabled,
        fecha_ultimo_mensaje: new Date().toISOString(),
      },
      { onConflict: "telefono" }
    )
    .select("telefono, bot_enabled")
    .single();

  if (error) return json(res, 500, { error: error.message });
  await logEventoCRM(
    telefono,
    bot_enabled ? "ia_reanudada" : "ia_pausada",
    bot_enabled ? "IA reanudada desde CRM" : "IA pausada desde CRM",
    { bot_enabled }
  );
  return json(res, 200, { conversacion: data });
};
