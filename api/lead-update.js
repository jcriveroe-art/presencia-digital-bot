const { json, logEventoCRM, requireCrmToken, supabase } = require("./_crm");

const CAMPOS_EDITABLES = new Set([
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
  "estado",
  "caliente",
  "bot_enabled",
  "notas",
]);

const BOOLEAN_FIELDS = new Set(["caliente", "bot_enabled"]);

function normalizarTelefono(value) {
  return String(value || "").replace(/[+\s\-()]/g, "").trim();
}

function cleanText(value) {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text === "" ? null : text;
}

function cleanBoolean(value) {
  if (typeof value === "boolean") return value;
  if (value === "true" || value === "1" || value === 1) return true;
  if (value === "false" || value === "0" || value === 0) return false;
  return null;
}

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");
  if (!requireCrmToken(req, res)) return;

  try {
    const { telefono_original, updates } = req.body || {};
    const telefonoOriginal = normalizarTelefono(telefono_original);

    if (!telefonoOriginal) {
      return json(res, 400, { ok: false, error: "telefono_original requerido" });
    }

    if (!updates || typeof updates !== "object" || Array.isArray(updates)) {
      return json(res, 400, { ok: false, error: "updates debe ser un objeto" });
    }

    const payload = {};
    for (const [campo, valor] of Object.entries(updates)) {
      if (!CAMPOS_EDITABLES.has(campo)) continue;
      if (campo === "telefono") {
        payload.telefono = normalizarTelefono(valor);
      } else if (BOOLEAN_FIELDS.has(campo)) {
        payload[campo] = cleanBoolean(valor);
      } else {
        payload[campo] = cleanText(valor);
      }
    }

    if ("telefono" in payload && !payload.telefono) {
      return json(res, 400, { ok: false, error: "telefono no puede quedar vacio" });
    }

    if (!("telefono" in payload)) payload.telefono = telefonoOriginal;
    if (!payload.telefono) {
      return json(res, 400, { ok: false, error: "telefono no puede quedar vacio" });
    }

    payload.fecha_ultimo_mensaje = new Date().toISOString();

    const { data, error } = await supabase
      .from("conversaciones")
      .update(payload)
      .eq("telefono", telefonoOriginal)
      .select("*")
      .single();

    if (error) {
      console.error("POST /api/lead-update Supabase error:", error.message);
      return json(res, 500, { ok: false, error: error.message });
    }

    if (!data) {
      return json(res, 404, { ok: false, error: "Lead no encontrado" });
    }

    await logEventoCRM(payload.telefono, "nota_actualizada", "Prospecto editado desde CRM", {
      telefono_original: telefonoOriginal,
      campos: Object.keys(payload).filter((campo) => campo !== "fecha_ultimo_mensaje"),
    });

    return json(res, 200, { ok: true, conversacion: data });
  } catch (e) {
    console.error("POST /api/lead-update exception:", e.message);
    return json(res, 500, { ok: false, error: e.message });
  }
};
