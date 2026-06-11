const { json, supabase } = require("./_crm");

const ESTADOS_VALIDOS = new Set([
  "prospectado",
  "contactado",
  "interesado",
  "cliente_caliente",
  "diagnostico_pagado",
  "diagnostico_entregado",
  "seguimiento",
  "perdido",
]);

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  const { telefono, estado } = req.body || {};
  if (!telefono || !ESTADOS_VALIDOS.has(estado)) {
    return json(res, 400, { error: "telefono y estado valido son requeridos" });
  }

  const updates = {
    telefono,
    estado,
    fecha_ultimo_mensaje: new Date().toISOString(),
  };

  if (estado === "interesado") updates.caliente = false;
  if (estado === "cliente_caliente") updates.caliente = true;
  if (estado === "diagnostico_pagado") updates.caliente = true;
  if (estado === "perdido") updates.caliente = false;

  const { data, error } = await supabase
    .from("conversaciones")
    .upsert(updates, { onConflict: "telefono" })
    .select("telefono, estado, caliente")
    .single();

  if (error) return json(res, 500, { error: error.message });
  return json(res, 200, { conversacion: data });
};
