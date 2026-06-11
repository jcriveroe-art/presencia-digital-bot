const { json, supabase } = require("./_crm");

const COLUMNAS_OLD = [
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

const COLUMNAS_NEW = [
  "nombre",
  "categoria",
  "prioridad",
  "score",
  "total_fugas",
  "fugas_detectadas",
  "rating",
  "resenas",
  "fotos_estimadas",
  "diagnostico_fotos",
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

const COLUMNAS = COLUMNAS_NEW;

const COLUMNAS_BASE = [
  "telefono",
  "nombre",
  "estado",
  "bot_enabled",
  "fecha_ultimo_mensaje",
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

function normalizarHeader(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

function tieneHeader(valores) {
  const headers = valores.map(normalizarHeader);
  return headers.includes("telefono") && headers.includes("nombre");
}

function rowDesdeHeader(headers, valores) {
  const row = {};
  headers.forEach((header, index) => {
    row[header] = valores[index] || null;
  });
  if (row.fotos && !row.fotos_estimadas) row.fotos_estimadas = row.fotos;
  delete row.fotos;
  return row;
}

function rowDesdeOrden(valores) {
  const columnas = valores.length >= COLUMNAS_NEW.length ? COLUMNAS_NEW : COLUMNAS_OLD;
  const row = {};
  columnas.forEach((col, index) => {
    row[col] = valores[index] || null;
  });
  if (row.fotos && !row.fotos_estimadas) row.fotos_estimadas = row.fotos;
  delete row.fotos;
  return row;
}

function parseContenido(contenido) {
  if (typeof contenido !== "string") {
    throw new Error("El body debe incluir contenido como texto CSV o TSV");
  }

  const lineas = String(contenido || "")
    .split(/\r?\n/)
    .map((linea) => linea.trim())
    .filter(Boolean);
  if (!lineas.length) return [];

  const separador = detectarSeparador(lineas[0]);
  let filas = lineas.map((linea) => parseCsvLine(linea, separador));
  const primera = filas[0];
  const headers = tieneHeader(primera) ? primera.map(normalizarHeader) : null;
  if (headers) filas = filas.slice(1);

  return filas
    .map((valores) => {
      const row = headers ? rowDesdeHeader(headers, valores) : rowDesdeOrden(valores);
      row.telefono = normalizarTelefono(row.telefono);
      if (!row.nombre) row.nombre = null;
      if (!row.fugas_detectadas) row.fugas_detectadas = null;
      if (!row.diagnostico_fotos && row.fotos_estimadas) {
        row.diagnostico_fotos = "posible baja actividad visual en la ficha";
      }
      row.estado = "prospectado";
      row.bot_enabled = true;
      row.ultimo_mensaje = null;
      row.fecha_ultimo_mensaje = new Date().toISOString();
      return row;
    })
    .filter((row) => row.telefono);
}

function esErrorColumnas(error) {
  const message = String(error?.message || "").toLowerCase();
  return message.includes("column") || message.includes("schema cache") || message.includes("could not find");
}

function soloBase(row) {
  const base = {};
  COLUMNAS_BASE.forEach((col) => {
    base[col] = row[col];
  });
  return base;
}

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  try {
    if (!req.body || typeof req.body !== "object") {
      return json(res, 400, { ok: false, error: "Body JSON requerido" });
    }

    const { contenido } = req.body;
    const rows = parseContenido(contenido);
    if (!rows.length) {
      return json(res, 400, { ok: false, error: "No se encontraron filas validas con telefono" });
    }

    const muestra = rows[0];
    console.log("POST /api/importar-prospector parsed sample:", {
      telefono: muestra.telefono,
      nombre: muestra.nombre,
      fugas_detectadas: muestra.fugas_detectadas,
      fotos_estimadas: muestra.fotos_estimadas,
      diagnostico_fotos: muestra.diagnostico_fotos,
    });

    let { data, error } = await supabase
      .from("conversaciones")
      .upsert(rows, { onConflict: "telefono" })
      .select("telefono, nombre, estado");

    if (error && esErrorColumnas(error)) {
      console.error("POST /api/importar-prospector optional columns error, retrying base fields:", error.message);
      const baseRows = rows.map(soloBase);
      const retry = await supabase
        .from("conversaciones")
        .upsert(baseRows, { onConflict: "telefono" })
        .select("telefono, nombre, estado");
      data = retry.data;
      error = retry.error;
    }

    if (error) {
      console.error("POST /api/importar-prospector Supabase error:", error.message);
      return json(res, 500, { ok: false, error: error.message });
    }

    return json(res, 200, {
      ok: true,
      importados: data?.length || rows.length,
      conversaciones: data || [],
    });
  } catch (e) {
    console.error("POST /api/importar-prospector exception:", e.message);
    return json(res, 500, { ok: false, error: e.message });
  }
};
