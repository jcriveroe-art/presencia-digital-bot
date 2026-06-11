const { json, supabase } = require("./_crm");

const CAMPOS_DEFAULT = {
  telefono: null,
  estado: null,
  nombre: null,
  negocio: null,
  fecha_ultimo_mensaje: null,
  caliente: false,
  bot_enabled: true,
  categoria: null,
  prioridad: null,
  score: null,
  total_fugas: null,
  fugas_detectadas: null,
  rating: null,
  resenas: null,
  fotos: null,
  fotos_estimadas: null,
  diagnostico_fotos: null,
  ultima_resena: null,
  responde_resenas: null,
  publicaciones: null,
  website: null,
  horarios: null,
  descripcion: null,
  whatsapp_link: null,
  direccion: null,
  maps_url: null,
  ultimo_mensaje: null,
  mensaje_inicial_enviado: false,
  notas: null,
};

function normalizarConversacion(row) {
  return { ...CAMPOS_DEFAULT, ...row };
}

module.exports = async (req, res) => {
  if (req.method !== "GET") return res.status(405).send("Method Not Allowed");

  try {
    const { data, error } = await supabase
      .from("conversaciones")
      .select("*")
      .order("fecha_ultimo_mensaje", { ascending: false });

    if (error) {
      console.error("GET /api/conversaciones Supabase error:", error.message);
      return json(res, 500, { ok: false, error: error.message });
    }

    return json(res, 200, {
      ok: true,
      conversaciones: (data || []).map(normalizarConversacion),
    });
  } catch (e) {
    console.error("GET /api/conversaciones exception:", e.message);
    return json(res, 500, { ok: false, error: e.message });
  }
};
