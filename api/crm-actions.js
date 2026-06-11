const fs = require("fs");
const path = require("path");
const Anthropic = require("@anthropic-ai/sdk");
const { json, logEventoCRM, requireCrmToken, sendWhatsApp, supabase } = require("../lib/crm");

const client = new Anthropic.Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const JUAN_CARLOS_NUMBER = "5215647943262";
const CRM_URL = "https://presencia-digital-bot.vercel.app/crm";
const DOCE_HORAS_MS = 12 * 60 * 60 * 1000;
const SALES_PLAYBOOK_PATH = path.join(__dirname, "..", "playbooks", "sales_playbook_v1.md");

const COLUMNAS_OLD = ["nombre", "categoria", "prioridad", "score", "total_fugas", "fugas_detectadas", "rating", "resenas", "fotos", "ultima_resena", "responde_resenas", "publicaciones", "website", "horarios", "descripcion", "telefono", "whatsapp_link", "direccion", "maps_url"];
const COLUMNAS_NEW = ["nombre", "categoria", "prioridad", "score", "total_fugas", "fugas_detectadas", "rating", "resenas", "fotos_estimadas", "diagnostico_fotos", "ultima_resena", "responde_resenas", "publicaciones", "website", "horarios", "descripcion", "telefono", "whatsapp_link", "direccion", "maps_url"];
const COLUMNAS_BASE = ["telefono", "nombre", "estado", "bot_enabled", "fecha_ultimo_mensaje"];
const ESTADOS_VALIDOS = new Set(["prospectado", "contactado", "interesado", "cliente_caliente", "diagnostico_pagado", "diagnostico_entregado", "seguimiento", "perdido", "requiere_intervencion"]);
const ESTADOS_SEGUIMIENTO = ["interesado", "seguimiento", "cliente_caliente", "contactado"];
const CAMPOS_EDITABLES = new Set(["nombre", "categoria", "prioridad", "score", "total_fugas", "fugas_detectadas", "rating", "resenas", "fotos_estimadas", "diagnostico_fotos", "ultima_resena", "responde_resenas", "publicaciones", "website", "horarios", "descripcion", "telefono", "whatsapp_link", "direccion", "maps_url", "estado", "caliente", "bot_enabled", "notas"]);
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
    row.telefono = normalizarTelefono(row.telefono);
    if (!row.diagnostico_fotos && row.fotos_estimadas) row.diagnostico_fotos = "posible baja actividad visual en la ficha";
    row.estado = "prospectado";
    row.bot_enabled = true;
    row.ultimo_mensaje = null;
    row.fecha_ultimo_mensaje = new Date().toISOString();
    return row;
  }).filter((row) => row.telefono);
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
  return `Hola, soy Juan Carlos de Presencia Digital. Vi ${nombre} en Google Maps y detecté detalles que podrían estar haciendo que algunos clientes elijan otra opción antes de escribirles. ¿Les puedo compartir qué encontré?`;
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
  let { data, error } = await supabase
    .from("conversaciones_resumen")
    .select("*")
    .order("fecha_ultimo_mensaje_real", { ascending: false });
  if (error) {
    console.error("conversaciones_resumen no disponible, usando conversaciones:", error.message);
    const fallback = await supabase.from("conversaciones").select("*").order("fecha_ultimo_mensaje", { ascending: false });
    data = fallback.data;
    error = fallback.error;
    if (!error && data?.length) {
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
  }
  if (error) throw error;
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
  const rows = parseContenido(body.contenido);
  if (!rows.length) return { status: 400, payload: { ok: false, error: "No se encontraron filas validas con telefono" } };
  let { data, error } = await supabase.from("conversaciones").upsert(rows, { onConflict: "telefono" }).select("telefono, nombre, estado");
  if (error && esErrorColumnas(error)) {
    const retry = await supabase.from("conversaciones").upsert(rows.map(soloBase), { onConflict: "telefono" }).select("telefono, nombre, estado");
    data = retry.data;
    error = retry.error;
  }
  if (error) throw error;
  await Promise.all((data || rows).map((row) => logEventoCRM(row.telefono, "lead_importado", "Lead importado desde Prospector ON", { nombre: row.nombre })));
  return { ok: true, importados: data?.length || rows.length, conversaciones: data || [] };
}

async function enviarInicial(body) {
  const telefono = normalizarTelefono(body.telefono);
  if (!telefono) return { status: 400, payload: { ok: false, error: "telefono requerido" } };
  const { data: lead, error } = await supabase.from("conversaciones").select("telefono, nombre").eq("telefono", telefono).single();
  if (error || !lead) return { status: 404, payload: { ok: false, error: "Lead no encontrado" } };
  if (!lead.nombre || !String(lead.nombre).trim() || String(lead.nombre).trim().toLowerCase() === "sin_dato") {
    return { status: 400, payload: { ok: false, error: "nombre requerido para enviar mensaje inicial" } };
  }
  const mensaje = mensajeInicial(lead.nombre);
  const whatsapp = await sendWhatsApp(telefono, mensaje);
  const now = new Date().toISOString();
  await supabase.from("conversaciones").upsert({ telefono, estado: "contactado", bot_enabled: true, ultimo_mensaje: mensaje, fecha_ultimo_mensaje: now, mensaje_inicial_enviado: true, mensaje_inicial_enviado_at: now }, { onConflict: "telefono" });
  await logEventoCRM(telefono, "mensaje_inicial_enviado", "Mensaje inicial enviado desde CRM", { mensaje });
  return { ok: true, mensaje, whatsapp };
}

async function enviarManual(body) {
  const telefono = normalizarTelefono(body.telefono);
  const mensaje = String(body.mensaje || "").trim();
  if (!telefono || !mensaje) return { status: 400, payload: { ok: false, error: "telefono y mensaje son requeridos" } };
  const whatsapp = await sendWhatsApp(telefono, mensaje);
  await supabase.from("conversaciones").upsert({ telefono, ultimo_mensaje: mensaje, fecha_ultimo_mensaje: new Date().toISOString() }, { onConflict: "telefono" });
  await logEventoCRM(telefono, "mensaje_saliente", "Mensaje manual enviado desde CRM", { mensaje });
  return { ok: true, whatsapp };
}

async function leadEstado(body) {
  const telefono = normalizarTelefono(body.telefono);
  if (!telefono || !ESTADOS_VALIDOS.has(body.estado)) return { status: 400, payload: { ok: false, error: "telefono y estado valido son requeridos" } };
  const updates = { telefono, estado: body.estado, fecha_ultimo_mensaje: new Date().toISOString(), ultima_accion_at: new Date().toISOString() };
  if (body.estado === "interesado") updates.caliente = false;
  if (body.estado === "cliente_caliente" || body.estado === "diagnostico_pagado") updates.caliente = true;
  if (body.estado === "perdido") updates.caliente = false;
  const { data, error } = await supabase.from("conversaciones").upsert(updates, { onConflict: "telefono" }).select("telefono, estado, caliente").single();
  if (error) throw error;
  await logEventoCRM(telefono, "estado_actualizado", `Estado actualizado a ${body.estado}`, { estado: body.estado });
  return { ok: true, conversacion: data };
}

async function botEnabled(body) {
  const telefono = normalizarTelefono(body.telefono);
  if (!telefono || typeof body.bot_enabled !== "boolean") return { status: 400, payload: { ok: false, error: "telefono y bot_enabled boolean son requeridos" } };
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
    lead_followup: leadFollowup,
    eventos_crm: eventosCrm,
    dashboard_data: dashboardData,
    bot_enabled: botEnabled,
  };

  const handler = handlers[action];
  if (!handler) return { status: 400, payload: { ok: false, error: "action invalida" } };
  return handler(body);
}

module.exports = async (req, res) => {
  if (req.method !== "POST" && req.method !== "GET") return res.status(405).send("Method Not Allowed");

  try {
    const body = req.method === "GET" ? { action: req.query.action } : (req.body || {});
    const action = body.action;
    if (req.method === "GET" && action !== "cron_recordatorios" && action !== "cron_seguimientos") {
      return json(res, 405, { ok: false, error: "GET solo esta permitido para crons" });
    }
    const result = await dispatch(action, body, req, res);
    if (result === null) return;
    if (result?.payload) return json(res, result.status || 200, result.payload);
    return json(res, 200, result);
  } catch (e) {
    console.error("POST /api/crm-actions exception:", e.message);
    return json(res, 500, { ok: false, error: e.message });
  }
};

module.exports.__test = {
  aplicarMetricasMensajes,
  normalizarResumenConversacion,
};
