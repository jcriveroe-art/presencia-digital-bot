const { json, supabase } = require("./_crm");

const COLUMNAS = [
  "nombre",
  "categoria",
  "prioridad",
  "score",
  "total_fugas",
  "fugas_detectadas",
  "rating",
  "resenas",
  "fotos",
  "ultima_resena",
  "responde_resenas",
  "publicaciones",
  "website",
  "horarios",
  "descripcion",
  "telefono",
  "whatsapp_link",
  "direccion",
  "maps_url",
];

function normalizarTelefono(value) {
  return String(value || "").replace(/\D/g, "");
}

function detectarSeparador(linea) {
  return linea.includes("\t") ? "\t" : ",";
}

function parseCsvLine(linea, separador) {
  const out = [];
  let current = "";
  let quoted = false;

  for (let i = 0; i < linea.length; i += 1) {
    const ch = linea[i];
    const next = linea[i + 1];
    if (ch === '"' && quoted && next === '"') {
      current += '"';
      i += 1;
    } else if (ch === '"') {
      quoted = !quoted;
    } else if (ch === separador && !quoted) {
      out.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  out.push(current.trim());
  return out;
}

function parseContenido(contenido) {
  const lineas = String(contenido || "")
    .split(/\r?\n/)
    .map((linea) => linea.trim())
    .filter(Boolean);
  if (!lineas.length) return [];

  const separador = detectarSeparador(lineas[0]);
  let filas = lineas.map((linea) => parseCsvLine(linea, separador));
  const primera = filas[0].map((v) => v.toLowerCase());
  const tieneHeader = COLUMNAS.every((col, index) => primera[index] === col);
  if (tieneHeader) filas = filas.slice(1);

  return filas
    .map((valores) => {
      const row = {};
      COLUMNAS.forEach((col, index) => {
        row[col] = valores[index] || null;
      });
      row.telefono = normalizarTelefono(row.telefono);
      row.estado = "prospectado";
      row.bot_enabled = true;
      row.ultimo_mensaje = null;
      row.fecha_ultimo_mensaje = new Date().toISOString();
      return row;
    })
    .filter((row) => row.telefono);
}

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  const { contenido } = req.body || {};
  const rows = parseContenido(contenido);
  if (!rows.length) return json(res, 400, { error: "No se encontraron filas validas" });

  const { data, error } = await supabase
    .from("conversaciones")
    .upsert(rows, { onConflict: "telefono" })
    .select("telefono, nombre, estado");

  if (error) return json(res, 500, { error: error.message });
  return json(res, 200, { ok: true, importados: data?.length || rows.length, conversaciones: data || [] });
};
