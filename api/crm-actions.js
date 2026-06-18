const fs = require("fs");
const path = require("path");
const Anthropic = require("@anthropic-ai/sdk");
const { json, logEventoCRM, requireCrmToken, sendWhatsApp, sendWhatsAppTemplate, sanitizarVariablePlantilla, supabase } = require("../lib/crm");

const client = new Anthropic.Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const JUAN_CARLOS_NUMBER = "5215647943262";
const CRM_URL = "https://presencia-digital-bot.vercel.app/crm";
const DOCE_HORAS_MS = 12 * 60 * 60 * 1000;
const SALES_PLAYBOOK_PATH = path.join(__dirname, "..", "playbooks", "sales_playbook_v1.md");
const DEBUG_CRM_ACTIONS = false;

const COLUMNAS_OLD = ["nombre", "categoria", "prioridad", "score", "total_fugas", "fugas_detectadas", "rating", "resenas", "fotos", "ultima_resena", "responde_resenas", "publicaciones", "website", "horarios", "descripcion", "telefono", "whatsapp_link", "direccion", "maps_url"];
const COLUMNAS_NEW = ["nombre", "categoria", "prioridad", "score", "total_fugas", "fugas_detectadas", "rating", "resenas", "fotos_estimadas", "diagnostico_fotos", "ultima_resena", "responde_resenas", "publicaciones", "website", "horarios", "descripcion", "telefono", "whatsapp_link", "direccion", "maps_url"];
const COLUMNAS_BASE = ["telefono", "nombre", "estado", "bot_enabled", "fecha_ultimo_mensaje"];
const CAMPOS_COMERCIALES = ["zona", "fuente_busqueda", "estado_contacto", "siguiente_accion", "fecha_siguiente_seguimiento", "ultimo_contacto", "ultima_respuesta", "intentos_contacto", "producto_interesado", "monto_cotizado", "monto_pagado", "estado_pago", "fecha_venta", "notas_internas"];
const CAMPOS_IMPORTABLES = new Set(["nombre", "categoria", "prioridad", "score", "total_fugas", "fugas_detectadas", "rating", "resenas", "fotos_estimadas", "diagnostico_fotos", "ultima_resena", "responde_resenas", "publicaciones", "website", "horarios", "descripcion", "telefono", "whatsapp_link", "direccion", "maps_url", "estado", "bot_enabled", "ultimo_mensaje", "fecha_ultimo_mensaje", ...CAMPOS_COMERCIALES]);
const ESTADOS_VALIDOS = new Set(["prospectado", "envio_pendiente", "contactado", "interesado", "cliente_caliente", "diagnostico_pagado", "diagnostico_entregado", "seguimiento", "perdido", "requiere_intervencion", "envio_fallido"]);
const ESTADOS_SEGUIMIENTO = ["interesado", "seguimiento", "cliente_caliente", "contactado"];
const CAMPOS_EDITABLES = new Set(["nombre", "categoria", "zona", "prioridad", "score", "total_fugas", "fugas_detectadas", "rating", "resenas", "fotos_estimadas", "diagnostico_fotos", "ultima_resena", "responde_resenas", "publicaciones", "website", "horarios", "descripcion", "telefono", "whatsapp_link", "direccion", "maps_url", "estado", "caliente", "bot_enabled", "notas", ...CAMPOS_COMERCIALES]);
const CAMPOS_FOLLOWUP = new Set(["proxima_accion", "fecha_seguimiento", "motivo_seguimiento", "seguimiento_activo", "objecion_principal", "resultado_conversacion"]);

const CAMPOS_DEFAULT = {
  telefono: null,
  estado: null,
  nombre: null,
  negocio: null,
  fecha_ultimo_mensaje: null,
  caliente: false,
  bot_enabled: true,
  categoria: null,
  zona: null,
  fuente_busqueda: null,
  estado_contacto: null,
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
  ultima_respuesta: null,
  ultimo_contacto: null,
  siguiente_accion: null,
  fecha_siguiente_seguimiento: null,
  intentos_contacto: null,
  producto_interesado: null,
  monto_cotizado: null,
  monto_pagado: null,
  estado_pago: null,
  fecha_venta: null,
  notas_internas: null,
  mensaje_inicial_enviado: false,
  mensaje_inicial_enviado_at: null,
  notas: null,
  proxima_accion: null,
  fecha_seguimiento: null,
  seguimiento_activo: true,
  motivo_seguimiento: null,
  resultado_conversacion: null,
  objecion_principal: null,
  etapa_perdida: null,
  ultima_accion_at: null,
  ultimo_recordatorio_at: null,
  total_mensajes: 0,
  mensajes_entrantes: 0,
  mensajes_salientes: 0,
  fecha_ultimo_mensaje_real: null,
  direccion_ultimo_mensaje: null,
  texto_ultimo_mensaje: null,
  mensajes_pendientes: 0,
  mensaje_nuevo: false,
  respuestas_post_campana: 0,
  fecha_primera_respuesta_post_campana: null,
  fecha_ultima_respuesta_post_campana: null,
  interactuo_post_campana: false,
};

function normalizarResumenConversacion(row) {
  const merged = { ...CAMPOS_DEFAULT, ...(row || {}) };
  const interactuoPostCampana = merged.interactuo_post_campana === true;
  const pendientesRaw = merged.mensajes_pendientes;
  const pendientes = Number(pendientesRaw || 0);
  const respuestasPostCampana = Number(merged.respuestas_post_campana || 0);

  if (pendientesRaw === null || pendientesRaw === undefined) {
    merged.mensajes_pendientes = respuestasPostCampana;
  } else {
    merged.mensajes_pendientes = pendientes;
  }

  merged.respuestas_post_campana = respuestasPostCampana;
  merged.interactuo_post_campana = interactuoPostCampana || respuestasPostCampana > 0;
  merged.mensaje_nuevo = merged.interactuo_post_campana;
  return merged;
}

function aplicarMetricasMensajes(conversacionesRows, mensajesRows) {
  const porTelefono = new Map();

  for (const msg of mensajesRows || []) {
    const telefono = msg.telefono;
    if (!telefono) continue;
    const current = porTelefono.get(telefono) || {
      total_mensajes: 0,
      mensajes_entrantes: 0,
      mensajes_salientes: 0,
      fecha_ultimo_mensaje_real: null,
      direccion_ultimo_mensaje: null,
      texto_ultimo_mensaje: null,
      fecha_ultima_respuesta: null,
      mensajes_pendientes: 0,
    };

    current.total_mensajes += 1;
    if (msg.direccion === "entrante") current.mensajes_entrantes += 1;
    if (msg.direccion === "saliente") {
      current.mensajes_salientes += 1;
      if (!current.fecha_ultima_respuesta || new Date(msg.created_at) > new Date(current.fecha_ultima_respuesta)) {
        current.fecha_ultima_respuesta = msg.created_at;
      }
    }

    if (!current.fecha_ultimo_mensaje_real || new Date(msg.created_at) > new Date(current.fecha_ultimo_mensaje_real)) {
      current.fecha_ultimo_mensaje_real = msg.created_at;
      current.direccion_ultimo_mensaje = msg.direccion;
      current.texto_ultimo_mensaje = msg.mensaje;
    }

    porTelefono.set(telefono, current);
  }

  for (const msg of mensajesRows || []) {
    const current = porTelefono.get(msg.telefono);
    if (!current || msg.direccion !== "entrante") continue;
    if (new Date(msg.created_at) > new Date(current.fecha_ultima_respuesta || "1970-01-01T00:00:00.000Z")) {
      current.mensajes_pendientes += 1;
    }
  }

  return (conversacionesRows || []).map((row) => {
    const metrics = porTelefono.get(row.telefono) || {};
    const campanaAt = row.mensaje_inicial_enviado_at ? new Date(row.mensaje_inicial_enviado_at) : null;
    const respuestasPostCampana = campanaAt
      ? (mensajesRows || []).filter((msg) => msg.telefono === row.telefono && msg.direccion === "entrante" && new Date(msg.created_at) > campanaAt)
      : [];
    const fechasPostCampana = respuestasPostCampana.map((msg) => msg.created_at).sort();
    return normalizarResumenConversacion({
      ...row,
      ...metrics,
      respuestas_post_campana: respuestasPostCampana.length,
      fecha_primera_respuesta_post_campana: fechasPostCampana[0] || null,
      fecha_ultima_respuesta_post_campana: fechasPostCampana[fechasPostCampana.length - 1] || null,
      interactuo_post_campana: respuestasPostCampana.length > 0,
      mensajes_pendientes: respuestasPostCampana.length,
    });
  });
}

function normalizarTelefono(value) {
  return String(value || "").replace(/[+\s\-()]/g, "").replace(/\D/g, "").trim();
}

function quitarAcentos(value) {
  return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function numeroLimpio(value) {
  if (value === null || value === undefined || value === "") return null;
  const text = String(value).trim().replace(/[$,\s]/g, "");
  const num = Number(text);
  return Number.isFinite(num) ? num : null;
}

function valorVacio(value) {
  return value === null || value === undefined || String(value).trim() === "";
}

function extraerTelefono(row) {
  const original = String(row?.telefono || "");
  const normalizado = normalizarTelefono(original);
  const telefonoRaro = /e\+?/i.test(original) || normalizado.length < 10 || normalizado.length > 13;
  const waMatch = String(row?.whatsapp_link || "").match(/wa\.me\/(\d{10,13})/i);
  let telefono = telefonoRaro && waMatch ? waMatch[1] : normalizado;
  if (!telefono && waMatch) telefono = waMatch[1];
  telefono = normalizarTelefono(telefono);
  if (telefono.length === 10) telefono = "52" + telefono;
  return telefono;
}

function textoZona(row) {
  return quitarAcentos([row?.nombre, row?.direccion, row?.maps_url, row?.fuente, row?.fuente_busqueda].filter(Boolean).join(" ")).toLowerCase();
}

function contieneCp(texto, inicio, fin) {
  const matches = texto.match(/\b\d{5}\b/g) || [];
  return matches.some((cp) => Number(cp) >= inicio && Number(cp) <= fin);
}

function inferirZona(row) {
  const texto = textoZona(row);
  if (/\batizapan\b|\batizapan de zaragoza\b|ciudad lopez mateos|cdad\.? lopez mateos/.test(texto) || contieneCp(texto, 52900, 52999)) return "Atizapan";
  if (/\bnaucalpan\b|\bsatelite\b|echegaray|lomas verdes/.test(texto) || contieneCp(texto, 53100, 53599)) return "Naucalpan / Satelite";
  if (/\btlalnepantla\b/.test(texto) || contieneCp(texto, 54000, 54199)) return "Tlalnepantla";
  if (/\bazcapotzalco\b|\bcdmx\b|ciudad de mexico/.test(texto)) return "CDMX";
  return null;
}

function inferirFuente(row, zona) {
  const categoria = quitarAcentos(row?.categoria || row?.nombre || "").toLowerCase();
  const base = /dentista|clinica dental|odontologia/.test(categoria) ? "dentistas" : cleanText(row?.categoria);
  if (base && zona) return `${base} ${zona}`;
  if (base) return base;
  return "Prospector ON";
}

function limpiarPrioridad(row) {
  const prioridad = String(row?.prioridad || "").trim();
  const normalizada = quitarAcentos(prioridad).toUpperCase();
  if (normalizada.includes("ALTA PRIORITARIA") || normalizada.startsWith("1.")) return "Alta prioritaria";
  if (normalizada.includes("ALTA") || normalizada.startsWith("2.")) return "Alta";
  if (normalizada.includes("MEDIA") || normalizada.startsWith("3.")) return "Media";
  if (normalizada.includes("BAJA") || normalizada.startsWith("4.")) return "Baja";
  const score = numeroLimpio(row?.score);
  if (score >= 12) return "Alta prioritaria";
  if (score >= 8) return "Alta";
  if (score >= 4) return "Media";
  if (score >= 0) return "Baja";
  return null;
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

function esSi(value) {
  return ["si", "sí", "true", "1", "yes"].includes(quitarAcentos(value).trim().toLowerCase());
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
  return String(value || "").trim().toLowerCase().replace(/\s+/g, "_");
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
  if (typeof contenido !== "string") throw new Error("El body debe incluir contenido como texto CSV o TSV");
  const lineas = contenido.split(/\r?\n/).map((linea) => linea.trim()).filter(Boolean);
  if (!lineas.length) return [];
  const separador = detectarSeparador(lineas[0]);
  let filas = lineas.map((linea) => parseCsvLine(linea, separador));
  const primera = filas[0];
  const headers = tieneHeader(primera) ? primera.map(normalizarHeader) : null;
  if (headers) filas = filas.slice(1);
  return filas.map((valores) => {
    const row = headers ? rowDesdeHeader(headers, valores) : rowDesdeOrden(valores);
    return row;
  });
}

function normalizarFilaImportacion(row) {
  const clean = { ...(row || {}) };
  const estadoCsv = clean.estado_contacto;
  const contactoWhatsapp = clean.contactado_whatsapp;
  const motivoEstado = clean.motivo_estado;
  const archivoOrigen = clean.archivo_origen;
  clean.telefono = extraerTelefono(clean);
  clean.zona = valorVacio(clean.zona) ? (inferirZona(clean) || "Sin zona") : String(clean.zona).trim();
  clean.fuente_busqueda = valorVacio(clean.fuente_busqueda) ? "Prospector ON" : String(clean.fuente_busqueda).trim();
  clean.prioridad = limpiarPrioridad(clean);
  clean.score = numeroLimpio(clean.score);
  clean.total_fugas = numeroLimpio(clean.total_fugas);
  clean.rating = numeroLimpio(clean.rating);
  clean.resenas = numeroLimpio(clean.resenas);
  if (clean.fotos && !clean.fotos_estimadas) clean.fotos_estimadas = clean.fotos;
  delete clean.fotos;
  if (!clean.diagnostico_fotos && clean.fotos_estimadas) clean.diagnostico_fotos = "posible baja actividad visual en la ficha";
  clean.estado_contacto = valorVacio(estadoCsv) ? "nuevo" : String(estadoCsv).trim();
  clean.estado = valorVacio(clean.estado) ? "prospectado" : String(clean.estado).trim();
  if (valorVacio(clean.siguiente_accion)) {
    clean.siguiente_accion = "Enviar inicial";
  }
  if (valorVacio(clean.notas_internas)) {
    const notas = [motivoEstado, archivoOrigen ? `archivo_origen: ${archivoOrigen}` : null].filter((value) => !valorVacio(value)).map((value) => String(value).trim()).join(" | ");
    if (notas) clean.notas_internas = notas;
  }
  clean.bot_enabled = clean.bot_enabled === undefined ? true : clean.bot_enabled;
  if (!("ultimo_mensaje" in clean)) clean.ultimo_mensaje = null;
  clean.fecha_ultimo_mensaje = clean.fecha_ultimo_mensaje || new Date().toISOString();
  return Object.fromEntries(Object.entries(clean).filter(([campo]) => CAMPOS_IMPORTABLES.has(campo)));
}

function filasImportacion(body) {
  if (Array.isArray(body.rows)) return body.rows.map(normalizarFilaImportacion);
  if (body.rows && typeof body.rows === "object") return [normalizarFilaImportacion(body.rows)];
  if (body.row && typeof body.row === "object") return [normalizarFilaImportacion(body.row)];
  if (body.lead && typeof body.lead === "object") return [normalizarFilaImportacion(body.lead)];
  return parseContenido(body.contenido);
}

function dedupeImportacionPorTelefono(rows) {
  const recibidas = Array.isArray(rows) ? rows : (rows ? [rows] : []);
  const porTelefono = new Map();
  const duplicadas = new Set();
  let invalidas = 0;

  recibidas.forEach((row) => {
    const clean = normalizarFilaImportacion(row);
    if (!clean.telefono) {
      invalidas += 1;
      return;
    }
    if (porTelefono.has(clean.telefono)) duplicadas.add(clean.telefono);
    const previous = porTelefono.get(clean.telefono) || {};
    const merged = { ...previous, ...clean };
    for (const [campo, valor] of Object.entries(clean)) {
      if (valorVacio(previous[campo]) && !valorVacio(valor)) merged[campo] = valor;
    }
    if (String(previous.estado_contacto || "").toLowerCase() === "ya_contactado") {
      merged.estado_contacto = previous.estado_contacto;
      if (valorVacio(merged.siguiente_accion) || merged.siguiente_accion === "Enviar inicial") merged.siguiente_accion = "Revisar historial";
    }
    porTelefono.set(clean.telefono, merged);
  });

  return {
    recibidas: recibidas.length,
    rows: Array.from(porTelefono.values()),
    duplicadas: Array.from(duplicadas),
    invalidas,
  };
}

function resumenImportacion(dedupe) {
  const rows = dedupe.rows || [];
  return {
    total_recibidos: dedupe.recibidas,
    insertados: rows.length,
    duplicados_por_telefono: dedupe.duplicadas.length,
    con_estado_contacto_nuevo: rows.filter((row) => String(row.estado_contacto || "").toLowerCase() === "nuevo").length,
    con_estado_contacto_ya_contactado: rows.filter((row) => String(row.estado_contacto || "").toLowerCase() === "ya_contactado").length,
    sin_zona: rows.filter((row) => valorVacio(row.zona) || row.zona === "Sin zona").length,
    sin_fuente_busqueda: rows.filter((row) => valorVacio(row.fuente_busqueda) || row.fuente_busqueda === "Prospector ON").length,
    con_maps_url: rows.filter((row) => !valorVacio(row.maps_url)).length,
    sin_maps_url: rows.filter((row) => valorVacio(row.maps_url)).length,
    con_rating: rows.filter((row) => row.rating !== null && row.rating !== undefined).length,
    sin_rating: rows.filter((row) => row.rating === null || row.rating === undefined).length,
  };
}

function mergeLeadImportado(existing, incoming) {
  const merged = { ...(existing || {}), ...(incoming || {}) };
  for (const [campo, valor] of Object.entries(incoming || {})) {
    if (valorVacio(valor) && !valorVacio(existing?.[campo])) merged[campo] = existing[campo];
  }
  if (existing?.estado && existing.estado !== "prospectado") {
    merged.estado = existing.estado;
  }
  if (String(existing?.estado_contacto || "").toLowerCase() === "ya_contactado" && String(incoming?.estado_contacto || "").toLowerCase() !== "ya_contactado") {
    merged.estado_contacto = existing.estado_contacto;
    if (valorVacio(incoming?.siguiente_accion) || incoming?.siguiente_accion === "Enviar inicial") merged.siguiente_accion = existing.siguiente_accion || "Revisar historial";
  }
  return Object.fromEntries(Object.entries(merged).filter(([campo]) => CAMPOS_IMPORTABLES.has(campo)));
}

async function mezclarConExistentes(rows) {
  const telefonos = rows.map((row) => row.telefono).filter(Boolean);
  if (!telefonos.length) return rows;
  const { data, error } = await supabase.from("conversaciones").select("*").in("telefono", telefonos);
  if (error) throw error;
  const existentes = new Map((data || []).map((row) => [row.telefono, row]));
  return rows.map((row) => mergeLeadImportado(existentes.get(row.telefono), row));
}

function logUpsert(action, tabla, onConflict, cantidadRecibida, cantidadDedupe, duplicadas) {
  if (!DEBUG_CRM_ACTIONS) return;
  console.log("crm-actions upsert", {
    action,
    tabla,
    onConflict,
    cantidad_recibida: cantidadRecibida,
    cantidad_despues_dedupe: cantidadDedupe,
    duplicadas_detectadas: duplicadas || [],
  });
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

function mensajeInicial(nombre) {
  return `Hola, soy Juan Carlos de Presencia Digital.\n\nEstaba revisando perfiles de Google Maps en la zona y me encontré con el de ${nombre}.\n\nMe llamaron la atención un par de oportunidades que podrían ayudarles a conseguir más consultas.\n\n¿Te las puedo compartir?`;
}

function loadSalesPlaybook() {
  try {
    return fs.readFileSync(SALES_PLAYBOOK_PATH, "utf8").trim();
  } catch (e) {
    return "No inventes datos. No presiones. Mensaje maximo 3 lineas.";
  }
}

function reciente(fecha) {
  if (!fecha) return false;
  return new Date(fecha).getTime() > Date.now() - DOCE_HORAS_MS;
}

function puedeRecordar(lead) {
  if (!lead.ultimo_recordatorio_at) return true;
  return !reciente(lead.ultimo_recordatorio_at);
}

function cronAutorizado(req) {
  return (
    (req.headers["x-cron-secret"] && req.headers["x-cron-secret"] === process.env.CRON_SECRET) ||
    req.headers.authorization === `Bearer ${process.env.CRON_SECRET}`
  );
}

function mensajeRecordatorio(lead) {
  return [
    "RECORDATORIO CRM ON",
    `Lead: ${lead.nombre || lead.negocio || "sin datos"}`,
    `Telefono: ${lead.telefono}`,
    `Estado: ${lead.estado || "sin datos"}`,
    `Proxima accion: ${lead.proxima_accion || "sin datos"}`,
    `Motivo: ${lead.motivo_seguimiento || "sin datos"}`,
    `Notas: ${lead.notas || "sin notas"}`,
    `Abrir CRM: ${CRM_URL}`,
  ].join("\n");
}

function promptLead(lead, mensajes) {
  const historial = (mensajes || []).slice(-8).map((m) => `${m.direccion}: ${m.mensaje}`).join("\n");
  return [
    "SALES_PLAYBOOK",
    loadSalesPlaybook(),
    "CONTEXTO DEL LEAD",
    `nombre: ${lead.nombre || "sin datos"}`,
    `categoria: ${lead.categoria || "sin datos"}`,
    `estado: ${lead.estado || "sin datos"}`,
    `fugas_detectadas: ${lead.fugas_detectadas || "sin datos"}`,
    `diagnostico_fotos: ${lead.diagnostico_fotos || "sin datos"}`,
    `direccion: ${lead.direccion || "sin datos"}`,
    "NOTAS INTERNAS",
    lead.notas || "Sin notas internas.",
    "SEGUIMIENTO",
    `motivo_seguimiento: ${lead.motivo_seguimiento || "sin datos"}`,
    `proxima_accion: ${lead.proxima_accion || "sin datos"}`,
    "HISTORIAL RECIENTE",
    historial || "Sin historial.",
    "INSTRUCCIONES",
    "Genera un seguimiento breve de maximo 3 lineas para WhatsApp.",
    "No cobres salvo que exista intencion clara de compra en el historial.",
    "No inventes datos. No menciones notas internas.",
    "Si detectas duda comercial compleja, responde exactamente: REQUIERE_INTERVENCION: razon.",
  ].join("\n");
}

async function conversaciones() {
  let { data, error } = await supabase.from("conversaciones").select("*").order("fecha_ultimo_mensaje", { ascending: false });
  if (error) throw error;
  if (data?.length) {
    const telefonos = data.map((row) => row.telefono).filter(Boolean);
    const mensajesResult = await supabase
      .from("mensajes")
      .select("id, telefono, direccion, mensaje, created_at")
      .in("telefono", telefonos)
      .order("created_at", { ascending: true })
      .order("id", { ascending: true });
    if (mensajesResult.error) {
      console.error("No se pudieron calcular metricas de mensajes:", mensajesResult.error.message);
    } else {
      return { ok: true, conversaciones: aplicarMetricasMensajes(data, mensajesResult.data || []) };
    }
  }
  return { ok: true, conversaciones: (data || []).map(normalizarResumenConversacion) };
}

async function mensajes(body) {
  const telefono = String(body.telefono || "").trim();
  if (!telefono) return { status: 400, payload: { ok: false, error: "telefono requerido" } };
  const { data, error } = await supabase.from("mensajes").select("id, telefono, direccion, mensaje, raw, created_at").eq("telefono", telefono).order("created_at", { ascending: true });
  if (error) throw error;
  return { ok: true, mensajes: data || [] };
}

async function eventosCrm(body) {
  const telefono = String(body.telefono || "").trim();
  if (!telefono) return { status: 400, payload: { ok: false, error: "telefono requerido" } };
  const { data, error } = await supabase.from("eventos_crm").select("id, telefono, tipo, descripcion, metadata, created_at").eq("telefono", telefono).order("created_at", { ascending: false }).limit(80);
  if (error) throw error;
  return { ok: true, eventos: data || [] };
}

async function bitacoraGlobal() {
  const { data, error } = await supabase
    .from("eventos_crm")
    .select("id, telefono, tipo, descripcion, metadata, created_at")
    .in("tipo", ["mensaje_inicial_enviado", "mensaje_saliente", "whatsapp_status", "whatsapp_failed", "mensaje_entrante"])
    .order("created_at", { ascending: false })
    .limit(300);
  if (error) throw error;
  return { ok: true, eventos: data || [] };
}

async function dashboardData() {
  const eventosPermitidos = [
    "mensaje_entrante",
    "mensaje_saliente",
    "estado_actualizado",
    "seguimiento_programado",
    "requiere_intervencion",
    "diagnostico_pagado",
  ];
  const eventos = await supabase
    .from("eventos_crm")
    .select("id, telefono, tipo, descripcion, metadata, created_at")
    .in("tipo", eventosPermitidos)
    .order("created_at", { ascending: false })
    .limit(10);
  if (eventos.error) throw eventos.error;

  const objeciones = await supabase
    .from("conversaciones")
    .select("objecion_principal")
    .not("objecion_principal", "is", null);
  if (objeciones.error) throw objeciones.error;

  const counts = {};
  for (const row of objeciones.data || []) {
    const key = String(row.objecion_principal || "").trim();
    if (!key) continue;
    counts[key] = (counts[key] || 0) + 1;
  }

  return {
    ok: true,
    eventos: eventos.data || [],
    objeciones: Object.entries(counts)
      .map(([objecion, total]) => ({ objecion, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8),
  };
}

async function importarProspector(body) {
  const dedupe = dedupeImportacionPorTelefono(filasImportacion(body));
  let rows = dedupe.rows;
  if (!rows.length) return { status: 400, payload: { ok: false, error: "No se encontraron filas validas con telefono" } };
  rows = await mezclarConExistentes(rows);
  const resumen = resumenImportacion({ ...dedupe, rows });
  console.log("importar_prospector resumen", resumen);
  logUpsert("importar_prospector", "conversaciones", "telefono", dedupe.recibidas, rows.length, dedupe.duplicadas);
  if (DEBUG_CRM_ACTIONS && dedupe.invalidas) console.log("importar_prospector filas invalidas filtradas", { cantidad_invalidas: dedupe.invalidas });
  let { data, error } = await supabase.from("conversaciones").upsert(rows, { onConflict: "telefono" }).select("telefono, nombre, estado");
  if (error && esErrorColumnas(error)) {
    const baseRows = dedupeImportacionPorTelefono(rows.map(soloBase)).rows;
    logUpsert("importar_prospector_retry_base", "conversaciones", "telefono", rows.length, baseRows.length, []);
    const retry = await supabase.from("conversaciones").upsert(baseRows, { onConflict: "telefono" }).select("telefono, nombre, estado");
    data = retry.data;
    error = retry.error;
  }
  if (error) throw error;
  await Promise.all((data || rows).map((row) => logEventoCRM(row.telefono, "lead_importado", "Lead importado desde Prospector ON", { nombre: row.nombre })));
  return { ok: true, importados: data?.length || rows.length, resumen, conversaciones: data || [] };
}

async function enviarInicial(body) {
  const telefono = normalizarTelefono(body.telefono);
  if (!telefono) return { status: 400, payload: { ok: false, error: "telefono requerido" } };
  const { data: lead, error } = await supabase.from("conversaciones").select("*").eq("telefono", telefono).single();
  if (error || !lead) return { status: 404, payload: { ok: false, error: "Lead no encontrado" } };

  if (!lead.nombre || !String(lead.nombre).trim() || String(lead.nombre).trim().toLowerCase() === "sin_dato") {
    return { status: 400, payload: { ok: false, error: "nombre requerido para enviar mensaje inicial" } };
  }

  const estadoContacto = String(lead.estado_contacto || "").trim().toLowerCase();

  const yaContactado =
    lead.mensaje_inicial_enviado === true ||
    Boolean(lead.mensaje_inicial_enviado_at) ||
    String(lead.estado || "").trim().toLowerCase() === "contactado" ||
    estadoContacto === "contactado" ||
    estadoContacto === "ya_contactado" ||
    (Boolean(lead.fecha_ultimo_mensaje) && Boolean(String(lead.ultimo_mensaje || "").trim()));

  if (yaContactado) {
    const motivo = lead.mensaje_inicial_enviado === true ? "mensaje_inicial_enviado" :
      lead.mensaje_inicial_enviado_at ? "mensaje_inicial_enviado_at" :
      String(lead.estado || "").trim().toLowerCase() === "contactado" ? "estado_contactado" :
      estadoContacto === "contactado" ? "estado_contacto_contactado" :
      estadoContacto === "ya_contactado" ? "estado_contacto_ya_contactado" :
      "ultimo_mensaje_existente";

    console.log("enviar_inicial bloqueado", { telefono, motivo, estado: lead.estado, estado_contacto: lead.estado_contacto });

    return { status: 409, payload: { ok: false, blocked: true, mensaje: "Este lead ya fue contactado. No se envio mensaje inicial." } };
  }
  const nombreSanitizado = sanitizarVariablePlantilla(lead.nombre);
  if (!nombreSanitizado) {
    return { status: 400, payload: { ok: false, error: "nombre del lead invalido tras sanitizar" } };
  }
  const mensaje = mensajeInicial(nombreSanitizado);
  const whatsapp = await sendWhatsAppTemplate(telefono, "diagnostico_on_inicial", "es_MX", [nombreSanitizado]);
  const now = new Date().toISOString();
  logUpsert("enviar_inicial", "conversaciones", "telefono", 1, 1, []);
  await supabase.from("conversaciones").upsert({ telefono, estado: "envio_pendiente", estado_contacto: "Enviado", bot_enabled: true, ultimo_mensaje: mensaje, fecha_ultimo_mensaje: now, mensaje_inicial_enviado: true, mensaje_inicial_enviado_at: now }, { onConflict: "telefono" });
  await logEventoCRM(telefono, "mensaje_inicial_enviado", "Mensaje inicial enviado desde CRM", { mensaje });
  return { ok: true, mensaje, whatsapp };
}

async function enviarManual(body) {
  const telefono = normalizarTelefono(body.telefono);
  const mensaje = String(body.mensaje || "").trim();
  if (!telefono || !mensaje) return { status: 400, payload: { ok: false, error: "telefono y mensaje son requeridos" } };
  const whatsapp = await sendWhatsApp(telefono, mensaje);
  logUpsert("enviar_manual", "conversaciones", "telefono", 1, 1, []);
  await supabase.from("conversaciones").upsert({ telefono, ultimo_mensaje: mensaje, fecha_ultimo_mensaje: new Date().toISOString() }, { onConflict: "telefono" });
  await logEventoCRM(telefono, "mensaje_saliente", "Mensaje manual enviado desde CRM", { mensaje });
  return { ok: true, whatsapp };
}

async function leadEstado(body) {
  const telefono = normalizarTelefono(body.telefono);
  if (!telefono || !ESTADOS_VALIDOS.has(body.estado)) return { status: 400, payload: { ok: false, error: "telefono y estado valido son requeridos" } };
  const updates = { telefono, estado: body.estado, fecha_ultimo_mensaje: new Date().toISOString(), ultima_accion_at: new Date().toISOString() };
  const comercialPorEstado = {
    contactado: { estado_contacto: "Contactado", siguiente_accion: "Seguimiento" },
    interesado: { estado_contacto: "Interesado", siguiente_accion: "Ofrecer diagnostico" },
    diagnostico_pagado: { estado_contacto: "Diagnostico vendido", siguiente_accion: "Entregar diagnostico" },
    perdido: { estado_contacto: "Perdido", siguiente_accion: null },
  };
  Object.assign(updates, comercialPorEstado[body.estado] || {});
  if (body.estado === "interesado") updates.caliente = false;
  if (body.estado === "cliente_caliente" || body.estado === "diagnostico_pagado") updates.caliente = true;
  if (body.estado === "perdido") updates.caliente = false;
  logUpsert("lead_estado", "conversaciones", "telefono", 1, 1, []);
  const { data, error } = await supabase.from("conversaciones").upsert(updates, { onConflict: "telefono" }).select("*").single();
  if (error) throw error;
  await logEventoCRM(telefono, "estado_actualizado", `Estado actualizado a ${body.estado}`, { estado: body.estado, estado_contacto: updates.estado_contacto, siguiente_accion: updates.siguiente_accion });
  return { ok: true, conversacion: data };
}

async function botEnabled(body) {
  const telefono = normalizarTelefono(body.telefono);
  if (!telefono || typeof body.bot_enabled !== "boolean") return { status: 400, payload: { ok: false, error: "telefono y bot_enabled boolean son requeridos" } };
  logUpsert("bot_enabled", "conversaciones", "telefono", 1, 1, []);
  const { data, error } = await supabase.from("conversaciones").upsert({ telefono, bot_enabled: body.bot_enabled, fecha_ultimo_mensaje: new Date().toISOString() }, { onConflict: "telefono" }).select("telefono, bot_enabled").single();
  if (error) throw error;
  await logEventoCRM(telefono, body.bot_enabled ? "ia_reanudada" : "ia_pausada", body.bot_enabled ? "IA reanudada desde CRM" : "IA pausada desde CRM", { bot_enabled: body.bot_enabled });
  return { ok: true, conversacion: data };
}

async function leadUpdate(body) {
  const telefonoOriginal = normalizarTelefono(body.telefono_original);
  if (!telefonoOriginal) return { status: 400, payload: { ok: false, error: "telefono_original requerido" } };
  if (!body.updates || typeof body.updates !== "object") return { status: 400, payload: { ok: false, error: "updates debe ser un objeto" } };
  const payload = {};
  for (const [campo, valor] of Object.entries(body.updates)) {
    if (!CAMPOS_EDITABLES.has(campo)) continue;
    if (campo === "telefono") payload.telefono = normalizarTelefono(valor);
    else if (campo === "caliente" || campo === "bot_enabled") payload[campo] = cleanBoolean(valor);
    else payload[campo] = cleanText(valor);
  }
  if ("telefono" in payload && !payload.telefono) return { status: 400, payload: { ok: false, error: "telefono no puede quedar vacio" } };
  if (!("telefono" in payload)) payload.telefono = telefonoOriginal;
  payload.fecha_ultimo_mensaje = new Date().toISOString();
  const { data, error } = await supabase.from("conversaciones").update(payload).eq("telefono", telefonoOriginal).select("*").single();
  if (error) throw error;
  await logEventoCRM(payload.telefono, "nota_actualizada", "Prospecto editado desde CRM", { telefono_original: telefonoOriginal, campos: Object.keys(payload).filter((campo) => campo !== "fecha_ultimo_mensaje") });
  return { ok: true, conversacion: data };
}

async function eliminarLead(body) {
  const telefono = normalizarTelefono(body.telefono);
  if (!telefono) return { status: 400, payload: { ok: false, error: "telefono requerido" } };
  await logEventoCRM(telefono, "lead_eliminado", "Lead eliminado desde CRM", {
    conservar_historial: true,
  });
  const { error } = await supabase.from("conversaciones").delete().eq("telefono", telefono);
  if (error) throw error;
  return { ok: true, telefono };
}

function esLeadImportacionMala(row) {
  const fuente = String(row.fuente_busqueda || row.fuente || "").trim();
  const zona = String(row.zona || "").trim();
  const estado = String(row.estado || "").trim().toLowerCase();
  const estadoContacto = String(row.estado_contacto || "").trim().toLowerCase();
  const siguienteAccion = String(row.siguiente_accion || "").trim().toLowerCase();
  const estadoPago = String(row.estado_pago || "").trim().toLowerCase();
  const tienePago = Number(row.monto_pagado || 0) > 0 || ["pagado", "anticipo"].includes(estadoPago);
  const estadosProtegidos = new Set(["contactado", "interesado", "cliente_caliente", "diagnostico_pagado", "diagnostico_entregado", "seguimiento", "perdido", "requiere_intervencion"]);
  return (
    fuente === "Prospector ON" &&
    (zona === "" || zona === "Sin zona") &&
    estado === "prospectado" &&
    siguienteAccion === "enviar inicial" &&
    estadoContacto !== "ya_contactado" &&
    !estadosProtegidos.has(estado) &&
    !tienePago
  );
}

async function candidatosImportacionMala() {
  const { data, error } = await supabase
    .from("conversaciones")
    .select("telefono,nombre,zona,fuente_busqueda,estado,estado_contacto,siguiente_accion,estado_pago,monto_pagado")
    .eq("estado", "prospectado")
    .eq("siguiente_accion", "Enviar inicial")
    .limit(500);
  if (error) throw error;
  return (data || []).filter(esLeadImportacionMala);
}

function resumenBorradoImportacionMala(candidatos) {
  return {
    total_encontrados: candidatos.length,
    muestra: candidatos.slice(0, 10).map((lead) => ({
      nombre: lead.nombre,
      telefono: lead.telefono,
      zona: lead.zona,
      fuente_busqueda: lead.fuente_busqueda,
      estado: lead.estado,
      siguiente_accion: lead.siguiente_accion,
    })),
  };
}

async function borrarLoteImportacionMalaDryRun() {
  return { ok: true, dry_run: true, ...resumenBorradoImportacionMala(await candidatosImportacionMala()) };
}

async function borrarLoteImportacionMalaConfirmado() {
  const candidatos = await candidatosImportacionMala();
  if (candidatos.length > 400) {
    return { status: 409, payload: { ok: false, error: "Se encontraron mas de 400 leads. Requiere revision manual antes de borrar.", ...resumenBorradoImportacionMala(candidatos) } };
  }
  const telefonos = candidatos.map((lead) => lead.telefono).filter(Boolean);
  if (!telefonos.length) return { ok: true, borrados: 0, total_encontrados: 0 };
  const { error } = await supabase.from("conversaciones").delete().in("telefono", telefonos);
  if (error) throw error;
  console.log("borrar_lote_importacion_mala_confirmado", { total_borrados: telefonos.length });
  return { ok: true, borrados: telefonos.length, total_encontrados: candidatos.length, telefonos };
}

async function leadFollowup(body) {
  const telefono = normalizarTelefono(body.telefono);
  if (!telefono) return { status: 400, payload: { ok: false, error: "telefono requerido" } };
  if (!body.updates || typeof body.updates !== "object") return { status: 400, payload: { ok: false, error: "updates debe ser un objeto" } };
  const payload = { ultima_accion_at: new Date().toISOString() };
  for (const [campo, valor] of Object.entries(body.updates)) {
    if (!CAMPOS_FOLLOWUP.has(campo)) continue;
    payload[campo] = campo === "seguimiento_activo" ? cleanBoolean(valor) !== false : cleanText(valor);
  }
  const { data, error } = await supabase.from("conversaciones").update(payload).eq("telefono", telefono).select("*").single();
  if (error) throw error;
  await logEventoCRM(telefono, "seguimiento_programado", "Seguimiento actualizado desde CRM", payload);
  return { ok: true, conversacion: data };
}

async function cronRecordatorios() {
  const now = new Date().toISOString();
  const { data, error } = await supabase.from("conversaciones").select("*").eq("seguimiento_activo", true).lte("fecha_seguimiento", now).order("fecha_seguimiento", { ascending: true }).limit(50);
  if (error) throw error;
  const enviados = [];
  for (const lead of data || []) {
    if (!puedeRecordar(lead)) continue;
    await sendWhatsApp(JUAN_CARLOS_NUMBER, mensajeRecordatorio(lead));
    const sentAt = new Date().toISOString();
    await supabase.from("conversaciones").update({ ultimo_recordatorio_at: sentAt }).eq("telefono", lead.telefono);
    await logEventoCRM(lead.telefono, "recordatorio_enviado", "Recordatorio enviado a Juan Carlos", { proxima_accion: lead.proxima_accion, motivo_seguimiento: lead.motivo_seguimiento });
    enviados.push(lead.telefono);
  }
  return { ok: true, enviados: enviados.length, telefonos: enviados };
}

async function ultimoMensajeCliente(telefono) {
  const { data } = await supabase.from("mensajes").select("created_at").eq("telefono", telefono).eq("direccion", "entrante").order("created_at", { ascending: false }).limit(1);
  return data?.[0]?.created_at || null;
}

async function historial(telefono) {
  const { data } = await supabase.from("mensajes").select("direccion, mensaje, created_at").eq("telefono", telefono).order("created_at", { ascending: false }).limit(12);
  return (data || []).reverse();
}

async function cronSeguimientos() {
  const now = new Date().toISOString();
  const { data, error } = await supabase.from("conversaciones").select("*").eq("seguimiento_activo", true).eq("bot_enabled", true).in("estado", ESTADOS_SEGUIMIENTO).lte("fecha_seguimiento", now).order("fecha_seguimiento", { ascending: true }).limit(25);
  if (error) throw error;
  const enviados = [];
  const intervenidos = [];
  for (const lead of data || []) {
    if (lead.estado === "requiere_intervencion" || lead.estado === "perdido") continue;
    if (reciente(lead.ultimo_recordatorio_at)) continue;
    if (reciente(await ultimoMensajeCliente(lead.telefono))) continue;
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 220,
      system: "Eres asistente de seguimiento comercial de CRM ON. Obedece estrictamente el playbook.",
      messages: [{ role: "user", content: promptLead(lead, await historial(lead.telefono)) }],
    });
    const texto = String(response.content[0].text || "").trim();
    if (/^REQUIERE_INTERVENCION:/i.test(texto)) {
      const razon = texto.replace(/^REQUIERE_INTERVENCION:\s*/i, "").trim();
      await supabase.from("conversaciones").update({ estado: "requiere_intervencion", bot_enabled: false, ultimo_recordatorio_at: now }).eq("telefono", lead.telefono);
      await sendWhatsApp(JUAN_CARLOS_NUMBER, `INTERVENCION REQUERIDA\nLead: ${lead.nombre || lead.telefono}\nTelefono: ${lead.telefono}\nMotivo: ${razon}\nAccion sugerida: Responder manualmente desde CRM.`);
      await logEventoCRM(lead.telefono, "requiere_intervencion", razon, { origen: "cron-seguimientos" });
      intervenidos.push(lead.telefono);
      continue;
    }
    await sendWhatsApp(lead.telefono, texto);
    const sentAt = new Date().toISOString();
    await supabase.from("conversaciones").update({ estado: lead.estado === "contactado" ? "seguimiento" : lead.estado, ultimo_mensaje: texto, fecha_ultimo_mensaje: sentAt, ultimo_recordatorio_at: sentAt }).eq("telefono", lead.telefono);
    await logEventoCRM(lead.telefono, "seguimiento_enviado", "Seguimiento automatico enviado", { mensaje: texto });
    enviados.push(lead.telefono);
  }
  return { ok: true, enviados: enviados.length, intervenidos: intervenidos.length, telefonos: enviados };
}

async function dispatch(action, body, req, res) {
  if (action === "cron_recordatorios" || action === "cron_seguimientos") {
    if (!cronAutorizado(req)) return { status: 401, payload: { ok: false, error: "Unauthorized" } };
    return action === "cron_recordatorios" ? cronRecordatorios() : cronSeguimientos();
  }

  if (!requireCrmToken(req, res)) return null;

  const handlers = {
    conversaciones,
    mensajes,
    importar_prospector: importarProspector,
    enviar_inicial: enviarInicial,
    enviar_manual: enviarManual,
    lead_estado: leadEstado,
    lead_update: leadUpdate,
    eliminar_lead: eliminarLead,
    borrar_lote_importacion_mala_dry_run: borrarLoteImportacionMalaDryRun,
    borrar_lote_importacion_mala_confirmado: borrarLoteImportacionMalaConfirmado,
    lead_followup: leadFollowup,
    eventos_crm: eventosCrm,
    dashboard_data: dashboardData,
    bitacora_global: bitacoraGlobal,
    bot_enabled: botEnabled,
  };

  const handler = handlers[action];
  if (!handler) return { status: 400, payload: { ok: false, error: "action invalida" } };
  return handler(body);
}

module.exports = async (req, res) => {
  if (req.method !== "POST" && req.method !== "GET") return res.status(405).send("Method Not Allowed");
  let body = {};

  try {
    body = req.method === "GET" ? { action: req.query.action } : (req.body || {});
    const action = body.action;
    if (req.method === "GET" && action !== "cron_recordatorios" && action !== "cron_seguimientos") {
      return json(res, 405, { ok: false, error: "GET solo esta permitido para crons" });
    }
    const result = await dispatch(action, body, req, res);
    if (result === null) return;
    if (result?.payload) return json(res, result.status || 200, result.payload);
    return json(res, 200, result);
  } catch (e) {
    console.error("POST /api/crm-actions exception:", {
      action: body?.action || null,
      tipo: body?.tipo || null,
      body_keys: Object.keys(body || {}),
      error: e.message,
    });
    return json(res, 500, { ok: false, error: e.message });
  }
};

module.exports.__test = {
  aplicarMetricasMensajes,
  normalizarResumenConversacion,
};
