const { createClient } = require("@supabase/supabase-js");

module.exports = async (req, res) => {
  if (req.query.secret !== 'antigravity_secret_123') {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    // Query 1: Get recent events from eventos_crm (SELECT * FROM eventos_crm ORDER BY created_at DESC LIMIT 5)
    const { data: eventos, error: errEventos } = await supabase
      .from("eventos_crm")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5);

    // Query 2: Get recent events with the dashboard_data filter
    const eventosPermitidos = [
      "mensaje_entrante",
      "mensaje_saliente",
      "estado_actualizado",
      "seguimiento_programado",
      "requiere_intervencion",
      "diagnostico_pagado",
    ];
    const { data: eventosFiltrados, error: errFiltrados } = await supabase
      .from("eventos_crm")
      .select("id, telefono, tipo, descripcion, metadata, created_at")
      .in("tipo", eventosPermitidos)
      .order("created_at", { ascending: false })
      .limit(10);

    res.status(200).json({
      ok: true,
      eventos_unfiltered: eventos || [],
      eventos_unfiltered_error: errEventos ? errEventos.message : null,
      eventos_filtered: eventosFiltrados || [],
      eventos_filtered_error: errFiltrados ? errFiltrados.message : null,
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};
