const fs = require("fs");
const path = require("path");
const Anthropic = require("@anthropic-ai/sdk");
const { logEventoCRM, logMensaje, sendWhatsApp, supabase } = require("../lib/crm");

const client = new Anthropic.Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const JUAN_CARLOS_NUMBERS = ["525647943262"]; // números de JC para alertas

const BOT_NUMBER = process.env.BOT_NUMBER || process.env.WHATSAPP_NUMBER || process.env.WHATSAPP_BUSINESS_NUMBER || process.env.PHONE_NUMBER || process.env.PHONE_NUMBER_ID || "";
const MAX_MENSAJES = 30;
const DOCE_HORAS_MS = 12 * 60 * 60 * 1000;
const DIEZ_MINUTOS_MS = 10 * 60 * 1000;
const VALIDACION_SIN_FILTROS_INBOUND = true;
const CONFIG_DIAGNOSTICO_PRECIO = 1500;
const CONFIG_DIAGNOSTICO_PILOTO_PRECIO = 1000;
const CONFIG_ACTIVACION_PRECIO = 5500;
const CONFIG_ACTIVACION_CON_DIAGNOSTICO = 4000;
const CONFIG_CONTROL_PRECIO = 3500;
const CONFIG_METODO_PAGO = "manual";
const PRECIOS_CONFIGURADOS = new Set([
  CONFIG_DIAGNOSTICO_PRECIO,
  CONFIG_DIAGNOSTICO_PILOTO_PRECIO,
  CONFIG_ACTIVACION_PRECIO,
  CONFIG_ACTIVACION_CON_DIAGNOSTICO,
  CONFIG_CONTROL_PRECIO,
]);

const SYSTEM_PROMPT = `Eres el asistente de ventas de Presencia Digital IA por WhatsApp. Tu trabajo es orientar con calma a negocios locales, hacer un mini diagnostico conversacional y avanzar solo cuando exista interes real.

Presencia Digital IA ayuda a negocios locales en M?xico a mejorar su presencia en Google Maps y WhatsApp para que mas clientes los encuentren, confien y escriban. No somos agencia de redes sociales. No vendemos likes, publicaciones ni anuncios.

PRIORIDAD COMERCIAL
No perder conversaciones. No inventar informacion. Resolver dudas y cerrar Diagnostico ON.
Antes de responder, usa el historial reciente y no repitas preguntas ya contestadas.
No converses por conversar: resuelve la duda y avanza al cierre cuando haya interes.

NO INVENTAR
Puedes decir: "Vi su ficha en Google Maps", "Encontre su negocio en Maps" o "Estaba revisando negocios de la zona".
No digas que detectaste fugas, problemas, perdida de clientes o competencia ganando salvo que exista evidencia real en CONTEXTO DEL LEAD o Prospector.
Si no tienes un dato, di: "No tengo ese dato todavía."

PRECIOS FIJOS
Diagnostico ON = $1,500 MXN.
Diagnostico piloto permitido = $1,000 MXN solo si pide descuento, promocion o dice que tiene menos presupuesto.
Activacion ON = $5,500 MXN.
Activacion ON con Diagnostico = $4,000 MXN.
Control ON = $3,500 MXN/mes.
Nunca uses otros precios.
Nunca inventes cuentas bancarias, CLABE, titulares, links de pago, promociones ni descuentos.
Unico apoyo permitido: diagnostico piloto de $1,000 MXN si pide descuento o tiene menos presupuesto.
Si preguntan como pagar, responde que Juan Carlos compartira los datos de pago para continuar.
Nunca aceptes menos de $1,000 MXN. Si ofrecen menos, reafirma precio normal y minimo piloto sin seguir negociando.

CIERRE
Si el prospecto dice "si", "ok", "me interesa", "cuanto cuesta", "como pago" o "quiero hacerlo", responde:
"El Diagnóstico ON cuesta $1,500 MXN y si después decide avanzar con la implementación, se bonifica.

¿Quiere que le comparta los datos para apartarlo?"

REGLA DE PRIMER CONTACTO
Si el usuario saluda, dice "hola", "buen dia", "soy nuevo" o no trae contexto, responde exactamente:
"Hola, soy el asistente de Presencia Digital IA. Ayudamos a negocios locales a mejorar su ficha de Google Maps y WhatsApp para que mas clientes los encuentren y les escriban. �Que tipo de negocio tienes y en que zona estas?"

MINI DIAGNOSTICO
IDENTIDAD: Nunca digas "Me llamo IA". Usa "Soy el asistente de Presencia Digital" o "Soy Juan Carlos de Presencia Digital".
Debe sentirse como conversacion, no interrogatorio. Haz una sola pregunta por mensaje.
No hagas mas de 3 preguntas antes de resumir. Usa este orden:
P1 giro y ciudad o colonia.
P2 si tiene ficha de Google Maps.
P3 si responde resenas o tiene fotos recientes.
P4 solo si falta informacion importante: si usa WhatsApp Business.

Si el usuario ya dijo giro y ciudad o colonia, no lo marques caliente. Estado: mini_diagnostico, caliente=false.
Si pregunta precio, estado: interesado, caliente=false.
Si pide datos de pago o dice "quiero hacerlo", "si me interesa", "como pago", "mandame datos" o "va", estado: cliente_caliente, caliente=true.
Si hay confusion fuerte, desconfianza, enojo o pregunta fuera de alcance, marca intervencion=true y no insistas en pago.

ANTES DE OFRECER EL DIAGNOSTICO ON
Antes de pedir pago, explica en simple:
"Con eso ya se ve una oportunidad: si tu ficha no esta actualizada o no transmite confianza, una persona que busca tu servicio puede elegir a otro negocio antes de escribirte."

Despues ofrece suave:
"El siguiente paso es el Diagnostico ON. Ahi revisamos tu ficha, tus competidores cercanos y te entregamos un plan claro de que corregir primero. Cuesta $1,500 y se entrega en 2-3 dias habiles. Si despues quieres que lo implementemos, ese pago se toma a cuenta."

Despues de explicar, cierra con:
"�Quieres que te explique que incluye o prefieres que revise primero si tu negocio tiene oportunidad real?"

Nunca cierres con "�te mando los datos para la transferencia?" salvo que el usuario haya dicho "si me interesa", "quiero hacerlo", "como pago", "mandame datos" o "va".
Si el usuario muestra intencion clara de compra, puedes pedir nombre, correo y telefono antes de datos de pago.
Nunca confirmes pago sin comprobante o folio real.


MODO A: PROSPECTO NUEVO
Si no hay contexto de Prospector ON, no asumas giro ni zona. Explica que hace Presencia Digital IA, pregunta primero el giro y despues la ciudad o colonia si falta. No pidas pago en el primer intercambio.

MODO B: PROSPECCION SALIENTE CON CONTEXTO
Si recibes un bloque llamado CONTEXTO DEL LEAD, significa que el mensaje inicial salio desde CRM ON y ya conocemos el negocio. Si el lead responde algo como "si", "si por favor", "claro", "comparteme", "a ver" o "que encontraste", no preguntes giro ni zona.
Usa solo fugas_detectadas reales del contexto. No inventes fugas, datos, resenas, fotos, rating ni competencia. Nunca menciones un numero exacto de fotos al prospecto.
Si existen fugas_detectadas, resume 3 a 5 oportunidades concretas y explica que el punto importante es saber cuales afectan mas la confianza y que corregir primero.
Si no existen fugas_detectadas, dilo con honestidad y pregunta si quiere que revisemos su ficha con mas detalle. No inventes informacion.
Cuando responda positivamente a prospeccion saliente, usa estado=interesado y caliente=false.
Si hay referencia a fotos, usa "posible baja actividad visual en la ficha", no "solo tiene X fotos".
Ejemplo de tono si hay contexto: "Claro. Detecte varias oportunidades en su ficha: tienen calificacion baja, pocas resenas y la ultima resena parece antigua. Tambien vi posible baja actividad visual en la ficha y resenas sin responder. El punto importante no es solo enlistarlas, sino saber cuales afectan mas la confianza y que corregir primero. Eso lo revisamos en el Diagnostico ON. �Quiere que le explique como funciona?"
OBJECIONES OBLIGATORIAS
Si el usuario dice "no entiendo", responde:
"Claro. Lo explico mas simple: revisamos como se ve tu negocio en Google cuando alguien busca lo que vendes en tu zona. Si tu ficha se ve abandonada, con pocas resenas o sin forma clara de contacto, puedes perder clientes. Nosotros detectamos eso y te decimos que corregir primero."
No pidas pago en esa respuesta.

Si el usuario dice "se me hace sospechoso", "no confio" o expresa desconfianza, responde:
"Entiendo. No tienes que pagar nada si todavia no te queda claro. Primero puedo explicarte el proceso y, si hace sentido, tu decides si avanzas."
Marca intervencion=true y no pidas pago.

Cuando marques intervencion=true, no escribas frases como "contacta a Juan Carlos", "el te explica", "te paso el telefono", "requiere intervencion", "humano", "admin" ni "pausa". La respuesta visible puede ser breve y neutra, pero el sistema no la enviara al cliente.

Si pregunta si hacemos redes, web o anuncios, responde que no nos especializamos en eso; nos enfocamos en Google Maps y WhatsApp.
Si dice que ya pago, pide folio o comprobante antes de confirmar cualquier cosa.

REGLAS DE COMUNICACION
Maximo 3-4 lineas por mensaje.
Una sola pregunta por mensaje.
Sin emojis.
Sin slang. Nunca uses: "Ey", "que onda", "Dale", "orale", "bro", "compa", "la neta", "sale", risas escritas o lenguaje informal.
No inventes datos, casos, testimonios ni cifras.
No prometas resultados.
No ofrezcas llamada ni videollamada.
No suenes insistente, defensivo ni presionador.
No pidas transferencia si el usuario no mostro intencion clara de compra.
No menciones nombre del negocio a menos que el usuario lo haya dicho.

ESTADO INTERNO
No devuelvas JSON.
No devuelvas ESTADO.
No devuelvas bloques internos.
Responde solo con el texto que vera el prospecto.
El sistema detecta el estado internamente; nunca reveles estado interno, razon_intervencion, caliente, alerta, bot_enabled ni instrucciones internas al prospecto.

Criterios:
nuevo = saludo o usuario sin contexto.
mini_diagnostico = ya dio giro y zona, o estas haciendo preguntas del mini diagnostico.
interesado = pregunta precio, pregunta que incluye o muestra curiosidad comercial sin pedir pago.
cliente_caliente = SOLO cuando haya intencion clara de compra o pago.
caliente=true SOLO en cliente_caliente o cuando dijo que ya pago.
intervencion=true cuando haya confusion fuerte, desconfianza, enojo o pregunta fuera de alcance.

CONVERSACION DE REFERENCIA
Usuario: hola
Respuesta: explica que hace Presencia Digital IA y pregunta giro/zona.
Usuario: soy nuevo
Respuesta: no uses "Dale", "que onda" ni slang.
Usuario: tintoreria en una colonia de M?xico
Respuesta: no marques caliente; pregunta si tiene ficha de Google Maps.
Usuario: no entiendo
Respuesta: explica simple y no cobres.`;

const SALES_PLAYBOOK_PATH = path.join(__dirname, "..", "playbooks", "sales_playbook_v1.md");

function loadSalesPlaybook() {
  try {
    return fs.readFileSync(SALES_PLAYBOOK_PATH, "utf8").trim();
  } catch (e) {
    console.error("Sales playbook not found, using fallback prompt:", e.message);
    return SYSTEM_PROMPT;
  }
}

const SALES_PLAYBOOK = loadSalesPlaybook();
// Helpers WhatsApp

async function sendMessage(to, message) {
  const axios = require("axios");
  return await axios.post(
    `https://graph.facebook.com/v18.0/${process.env.PHONE_NUMBER_ID}/messages`,
    {
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: message },
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
    }
  );
}

async function alertarJuanCarlos(tipo, telefono, datos) {
  let mensaje = "";

  if (tipo === "caliente") {
    mensaje = `CLIENTE CALIENTE\nNumero: ${telefono}\nNegocio: ${datos.negocio || "sin datos"}\nNombre: ${datos.nombre || "sin datos"}\nSituacion: ${datos.alerta}`;
  } else if (tipo === "intervencion") {
    mensaje = `INTERVENCION REQUERIDA\nNumero: ${telefono}\nNegocio: ${datos.negocio || "sin datos"}\nUltimo mensaje: ${datos.ultimo_mensaje || "sin datos"}\nRazon: ${datos.razon_intervencion || "sin datos"}\nIA pausada. Responder manualmente desde CRM.`;
  } else if (tipo === "resumen") {
    mensaje = datos.texto;
  }

  try {
    console.log("DEBUG alertarJuanCarlos payload", {
      tipo,
      to: JUAN_CARLOS_NUMBERS,
      mensaje
    });
    for (const to of JUAN_CARLOS_NUMBERS) {
      try {
        const resp = await sendMessage(to, mensaje);
        console.log("DEBUG alerta admin enviada OK", {
          to,
          response: JSON.stringify(resp?.data || null)
        });
      } catch (e) {
        console.error("DEBUG error alertando a JC", {
          to,
          message: e.message,
          status: e.response?.status,
          data: e.response?.data
        });
      }
    }
  } catch (e) {
    console.error("DEBUG error alertando a JC general", {
      message: e.message
    });
  }
}

// ─── Supabase ────────────────────────────────────────────────────────────────

async function getCliente(telefono) {
  try {
    const { data } = await supabase
      .from("conversaciones")
      .select("*")
      .eq("telefono", telefono)
      .single();
    return data || null;
  } catch (e) {
    return null;
  }
}

async function saveCliente(telefono, updates) {
  try {
    await supabase
      .from("conversaciones")
      .upsert(
        { telefono, ...updates, fecha_ultimo_mensaje: new Date().toISOString() },
        { onConflict: "telefono" }
      );
  } catch (e) {
    console.error("Supabase save error:", e.message);
  }
}

async function tieneAlertaReciente(telefono, tipo, ventanaMs) {
  try {
    const since = new Date(Date.now() - ventanaMs).toISOString();
    const { count, error } = await supabase
      .from("eventos_crm")
      .select("id", { count: "exact", head: true })
      .eq("telefono", telefono)
      .eq("tipo", tipo)
      .gte("created_at", since);
    if (error) {
      console.error("Error consultando alerta reciente:", error.message);
      return false;
    }
    return (count || 0) > 0;
  } catch (e) {
    console.error("Excepcion consultando alerta reciente:", e.message);
    return false;
  }
}

async function alertarMensajeConIAPausada(telefono, cliente, ultimoMensaje) {
  if (await tieneAlertaReciente(telefono, "mensaje_con_ia_pausada", DOCE_HORAS_MS)) return;

  await alertarJuanCarlos("resumen", telefono, {
    texto: [
      "INTERVENCION REQUERIDA",
      `Numero: ${telefono}`,
      `Negocio: ${cliente?.negocio || cliente?.nombre || "sin datos"}`,
      `Ultimo mensaje: ${ultimoMensaje || "sin datos"}`,
      "Razon: El lead escribio con IA pausada.",
      "IA pausada. Responder manualmente desde CRM.",
    ].join("\n"),
  });
  await logEventoCRM(telefono, "mensaje_con_ia_pausada", "Lead escribio con IA pausada", {
    ultimo_mensaje: ultimoMensaje,
  });
}

async function alertarInboundCRM(telefono, cliente, mensaje) {
  try {
    if (!telefono || JUAN_CARLOS_NUMBERS.includes(telefono) || telefono === BOT_NUMBER) return;

    const nombreLead = cliente?.nombre || cliente?.negocio || telefono;
    const estado = cliente?.estado || "nuevo";
    const alerta = [
      "🔔 Nuevo mensaje CRM ON",
      "",
      `Lead: ${nombreLead}`,
      "",
      "Teléfono:",
      telefono,
      "",
      "Mensaje:",
      `"${mensaje}"`,
      "",
      "Estado:",
      estado,
      "",
      "Abrir CRM:",
      "https://presencia-digital-bot.vercel.app/crm",
    ].join("\n");

    for (const to of JUAN_CARLOS_NUMBERS) {
      try {
        await sendMessage(to, alerta);
      } catch (err) {
        console.error("Error alertando inbound a JC:", to, err.message);
      }
    }
    await saveCliente(telefono, { ultima_alerta_inbound_at: new Date().toISOString() });
  } catch (e) {
    console.error("Error enviando alerta inbound CRM:", e.message);
  }
}

async function programarSeguimientos(telefono, tipo) {
  const hoy = new Date();
  let tareas = [];

  if (tipo === "diagnostico_entregado") {
    tareas = [
      { dias: 2, tipo: "seguimiento_diagnostico_d2" },
      { dias: 4, tipo: "seguimiento_diagnostico_d4" },
      { dias: 6, tipo: "seguimiento_diagnostico_d6" },
    ];
  } else if (tipo === "prospecto_frio") {
    tareas = [
      { dias: 2, tipo: "seguimiento_frio_d2" },
      { dias: 4, tipo: "seguimiento_frio_d4" },
    ];
  }

  for (const t of tareas) {
    const fecha = new Date(hoy);
    fecha.setDate(fecha.getDate() + t.dias);
    await supabase.from("tareas").insert({
      telefono,
      tipo: t.tipo,
      fecha_programada: fecha.toISOString().split("T")[0],
      completada: false,
    });
  }
}

// ─── Parsear estado del bot ──────────────────────────────────────────────────

function parsearEstado(respuesta) {
  let texto = String(respuesta || "");
  let estado = null;

  const estadoMatch = texto.match(/(?:^|\n)\s*-{0,3}\s*ESTADO\s*:\s*```(?:json)?\s*([\s\S]*?)\s*```/i)
    || texto.match(/(?:^|\n)\s*-{0,3}\s*ESTADO\s*:\s*(\{[\s\S]*?\})\s*$/i);

  if (estadoMatch) {
    try {
      estado = JSON.parse(estadoMatch[1].trim());
    } catch (e) {
      console.error("No se pudo parsear ESTADO interno:", e.message);
    }
    texto = texto.replace(estadoMatch[0], "");
  } else {
    const jsonFinal = texto.match(/(?:^|\n)\s*```(?:json)?\s*(\{[\s\S]*?(?:"caliente"|"estado"|"intervencion"|"razon_intervencion")[\s\S]*?\})\s*```\s*$/i)
      || texto.match(/(?:^|\n)\s*(\{[\s\S]*?(?:"caliente"|"estado"|"intervencion"|"razon_intervencion")[\s\S]*?\})\s*$/i);
    if (jsonFinal) {
      try {
        estado = JSON.parse(jsonFinal[1].trim());
      } catch (e) {
        console.error("No se pudo parsear JSON final interno:", e.message);
      }
      texto = texto.replace(jsonFinal[0], "");
    }
  }

  return { texto: sanitizarRespuestaCliente(texto), estado };
}

function sanitizarRespuestaCliente(texto) {
  return String(texto || "")
    .replace(/(?:^|\n)\s*-{0,3}\s*ESTADO\s*:\s*```(?:json)?[\s\S]*?```\s*$/gi, "")
    .replace(/(?:^|\n)\s*-{0,3}\s*ESTADO\s*:\s*\{[\s\S]*?\}\s*$/gi, "")
    .replace(/(?:^|\n)\s*```(?:json)?\s*\{[\s\S]*?(?:"caliente"|"estado"|"intervencion"|"razon_intervencion")[\s\S]*?\}\s*```\s*$/gi, "")
    .replace(/(?:^|\n)\s*\{[\s\S]*?(?:"caliente"|"estado"|"intervencion"|"razon_intervencion")[\s\S]*?\}\s*$/gi, "")
    .replace(/```(?:json)?/gi, "")
    .replace(/```/g, "")
    .replace(/(?:^|\n)\s*-{3,}\s*$/g, "")
    .trim();
}

function contieneEstadoInterno(texto) {
  return /ESTADO\s*:|"caliente"\s*:|"estado"\s*:|"intervencion"\s*:|"razon_intervencion"\s*:|"bot_enabled"\s*:|requiere_intervencion/i.test(String(texto || ""));
}

function normalizarTexto(texto) {
  return String(texto || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function preguntaPrecio(texto) {
  const clean = normalizarTexto(texto);
  return /\b(cuanto|precio|costo|cuesta|vale|tarifa)\b/.test(clean);
}

function preguntaComoPagar(texto) {
  const clean = normalizarTexto(texto);
  return /\b(como\s+pago|como\s+te\s+pago|como\s+les\s+pago|donde\s+pago|datos\s+(?:de\s+)?(?:pago|transferencia)|clabe|cuenta|spei|transferencia)\b/.test(clean);
}

function pideDescuentoOPiloto(texto) {
  const clean = normalizarTexto(texto);
  return /\b(descuento|promo|promocion|menos\s+presupuesto|no\s+tengo\s+(?:todo|completo)|se\s+puede\s+menos|muy\s+caro|tengo\s+menos|solo\s+tengo)\b/.test(clean);
}

function montosMencionados(texto) {
  return [...String(texto || "").matchAll(/\$?\s*([0-9]{1,3}(?:,[0-9]{3})+|[0-9]{3,6})(?:\s*(?:mxn|pesos))?/gi)]
    .map((match) => Number(match[1].replace(/,/g, "")))
    .filter((monto) => Number.isFinite(monto));
}

function contieneAlucinacionComercialCritica(texto) {
  const clean = normalizarTexto(texto);
  const mencionaDatosPago = /\b(banco|cuenta|clabe|transferencia|spei|titular|link\s+de\s+pago|liga\s+de\s+pago|tarjeta|deposito|dep[oó]sito|paypal|mercado\s+pago)\b/.test(clean);
  const mencionaPromocion = /\b(promo|promocion|descuento|oferta|rebaja|bono\s+especial)\b/.test(clean);
  const precios = montosMencionados(texto);
  const precioNoConfigurado = precios.some((precio) => !PRECIOS_CONFIGURADOS.has(precio));
  const promocionConfigurada = clean.includes("diagnostico piloto") && precios.includes(CONFIG_DIAGNOSTICO_PILOTO_PRECIO);
  return mencionaDatosPago || (mencionaPromocion && !promocionConfigurada) || precioNoConfigurado;
}

function prepararRespuestaCliente(texto) {
  const cleanText = sanitizarRespuestaCliente(texto);
  return {
    cleanText,
    bloqueada: !cleanText || contieneEstadoInterno(cleanText) || contieneAlucinacionComercialCritica(cleanText),
  };
}

async function alertarJsonBloqueado(telefono, cliente) {
  const ultimaAlerta = cliente?.ultima_alerta_json_bloqueado_at ? new Date(cliente.ultima_alerta_json_bloqueado_at).getTime() : 0;
  const alertaReciente = ultimaAlerta && Date.now() - ultimaAlerta < DIEZ_MINUTOS_MS;

  await logEventoCRM(telefono, "json_interno_bloqueado", "Respuesta automatica contenia JSON interno y fue bloqueada", {
    alerta_enviada: !alertaReciente,
  });

  if (alertaReciente) return;

  await alertarJuanCarlos("resumen", telefono, {
    texto: [
      "INTERVENCION REQUERIDA",
      `Numero: ${telefono}`,
      "Razon: Respuesta automatica contenia JSON interno y fue bloqueada.",
      "IA pausada. Responder manualmente desde CRM.",
    ].join("\n"),
  });
  await saveCliente(telefono, { ultima_alerta_json_bloqueado_at: new Date().toISOString() });
}

async function responderComercialCritico(telefono, mensaje, cliente) {
  if (preguntaComoPagar(mensaje)) {
    const respuesta = "Perfecto. Juan Carlos te compartirá los datos de pago para continuar.";
    await logEventoCRM(telefono, "datos_pago_solicitados", "Lead pregunto como pagar", {
      metodo_pago: CONFIG_METODO_PAGO,
    });
    await alertarJuanCarlos("resumen", telefono, {
      texto: [
        "INTERVENCION REQUERIDA",
        `Numero: ${telefono}`,
        `Negocio: ${cliente?.negocio || cliente?.nombre || "sin datos"}`,
        `Ultimo mensaje: ${mensaje || "sin datos"}`,
        "Razon: Solicita datos de pago. Compartir datos manualmente.",
        "Responder manualmente desde CRM.",
      ].join("\n"),
    });
    await saveCliente(telefono, { estado: "cliente_caliente", caliente: true });
    return respuesta;
  }

  if (pideDescuentoOPiloto(mensaje)) {
    const montos = montosMencionados(mensaje);
    const ofertaMenorAlMinimo = montos.some((monto) => monto > 0 && monto < CONFIG_DIAGNOSTICO_PILOTO_PRECIO);
    await saveCliente(telefono, { estado: "interesado" });

    if (ofertaMenorAlMinimo) {
      return `Por esa cantidad no se puede hacer el Diagnóstico ON porque requiere revisión manual de Google Maps, competencia, WhatsApp y oportunidades principales.\n\nPrecio normal: $${CONFIG_DIAGNOSTICO_PRECIO.toLocaleString("es-MX")} MXN.\nMínimo piloto: $${CONFIG_DIAGNOSTICO_PILOTO_PRECIO.toLocaleString("es-MX")} MXN.`;
    }

    return `El precio normal es $${CONFIG_DIAGNOSTICO_PRECIO.toLocaleString("es-MX")} MXN. Puedo apoyarte con $${CONFIG_DIAGNOSTICO_PILOTO_PRECIO.toLocaleString("es-MX")} MXN como diagnóstico piloto.\n\n¿Quieres que avancemos con el piloto?`;
  }

  if (preguntaPrecio(mensaje)) {
    await saveCliente(telefono, { estado: "interesado" });
    return `El Diagnóstico ON cuesta $${CONFIG_DIAGNOSTICO_PRECIO.toLocaleString("es-MX")} MXN y si después decide avanzar con la implementación, se bonifica.\n\n¿Quiere que le comparta los datos para apartarlo?`;
  }

  return null;
}

// ─── Comandos de Juan Carlos ─────────────────────────────────────────────────

function buildLeadContext(cliente) {
  if (!cliente) return "CONTEXTO DEL LEAD\nSin contexto de lead.";
  const fugasDetectadas = normalizarFugasParaClaude(cliente.fugas_detectadas);
  const campos = [
    "nombre",
    "categoria",
    "prioridad",
    "score",
    "total_fugas",
    "rating",
    "resenas",
    "diagnostico_fotos",
    "fotos_estimadas",
    "ultima_resena",
    "responde_resenas",
    "publicaciones",
    "website",
    "horarios",
    "descripcion",
    "direccion",
    "maps_url",
  ];
  const lineas = campos
    .filter((campo) => cliente[campo] !== undefined && cliente[campo] !== null && String(cliente[campo]).trim() !== "")
    .map((campo) => {
      if (campo === "fotos_estimadas") return `${campo}: ${cliente[campo]} (dato interno; no mencionar numero exacto al prospecto)`;
      if (campo === "diagnostico_fotos") return `${campo}: ${cliente[campo]} (texto seguro para prospecto)`;
      return `${campo}: ${cliente[campo]}`;
    });
  if (fugasDetectadas) {
    lineas.push(`fugas_detectadas: ${fugasDetectadas}`);
  }
  return `CONTEXTO DEL LEAD\n${lineas.length ? lineas.join("\n") : "Sin contexto de lead."}`;
}

function buildInternalNotes(cliente) {
  const notas = cliente?.notas ? String(cliente.notas).trim() : "";
  if (!notas) return "NOTAS INTERNAS\nSin notas internas.";
  return `NOTAS INTERNAS\n${notas}\n\nEstas notas son solo contexto interno. No las menciones ni las cites al prospecto.`;
}

function normalizarFugasParaClaude(fugas) {
  if (!fugas) return null;
  return String(fugas)
    .replace(/(?:solo\s*)?\d+\s+foto(?:s)?(?:\s+en\s+maps)?/gi, "posible baja actividad visual en la ficha")
    .replace(/pocas\s+foto(?:s)?/gi, "posible baja actividad visual en la ficha")
    .replace(/sin\s+foto(?:s)?/gi, "posible baja actividad visual en la ficha")
    .replace(/foto\(s\)/gi, "actividad visual")
    .replace(/\s+\|\s+/g, " | ");
}

function buildCrmState(cliente) {
  if (!cliente) return "ESTADO CRM\nSin registro CRM.";
  const lineas = [
    `telefono: ${cliente.telefono || "sin datos"}`,
    `estado: ${cliente.estado || "sin datos"}`,
    `caliente: ${cliente.caliente === true}`,
    `bot_enabled: ${cliente.bot_enabled !== false}`,
    `ultimo_mensaje: ${cliente.ultimo_mensaje || "sin datos"}`,
    `fecha_ultimo_mensaje: ${cliente.fecha_ultimo_mensaje || "sin datos"}`,
  ];
  return `ESTADO CRM\n${lineas.join("\n")}`;
}

function buildSystemPrompt(cliente) {
  return [
    "SALES_PLAYBOOK",
    SALES_PLAYBOOK,
    buildLeadContext(cliente),
    buildInternalNotes(cliente),
    buildCrmState(cliente),
    "ULTIMOS MENSAJES Y MENSAJE ACTUAL se envian separados en el arreglo messages de Claude.",
  ].join("\n\n");
}
async function procesarComandoJC(comando, from) {
  const partes = comando.trim().split(" ");
  const cmd = partes[0].toUpperCase();

  if (cmd === "ENTREGADO" && partes[1]) {
    const telefono = partes[1];
    await saveCliente(telefono, { estado: "diagnostico_entregado", fecha_ultimo_evento: new Date().toISOString() });
    await programarSeguimientos(telefono, "diagnostico_entregado");
    await sendMessage(from, `Listo. Diagnostico marcado como entregado para ${telefono}. Seguimientos programados en dia 2, 4 y 6.`);
    return true;
  }

  if (cmd === "ESTADO" && partes[1]) {
    const telefono = partes[1];
    const cliente = await getCliente(telefono);
    if (cliente) {
      await sendMessage(from, `Estado: ${cliente.estado}\nNombre: ${cliente.nombre || "sin datos"}\nNegocio: ${cliente.negocio || "sin datos"}\nCaliente: ${cliente.caliente ? "SI" : "NO"}\nIA: ${cliente.bot_enabled === false ? "OFF" : "ON"}\nUltimo mensaje: ${cliente.fecha_ultimo_mensaje}`);
    } else {
      await sendMessage(from, `No encontre registro para ${telefono}`);
    }
    return true;
  }

  if (cmd === "PAUSAR" && partes[1]) {
    const telefono = partes[1];
    await saveCliente(telefono, { bot_enabled: false });
    await sendMessage(from, `IA pausada para ${telefono}. Los mensajes se guardan, pero Claude no respondera.`);
    return true;
  }

  if (cmd === "REANUDAR" && partes[1]) {
    const telefono = partes[1];
    await saveCliente(telefono, { bot_enabled: true });
    await sendMessage(from, `IA reanudada para ${telefono}.`);
    return true;
  }

  if (cmd === "PERDIDO" && partes[1]) {
    const telefono = partes[1];
    await saveCliente(telefono, { estado: "perdido", caliente: false });
    await sendMessage(from, `Marcado como perdido: ${telefono}`);
    return true;
  }

  return false;
}

// ─── Claude ──────────────────────────────────────────────────────────────────


const PATRONES_INTERVENCION_COMERCIAL = [
  /negociaci[oó]n\s+especial/i,
  /descuento/i,
  /pago\s+parcial/i,
  /mensualidades/i,
  /excepci[oó]n\s+comercial/i,
  /hablar\s+con\s+juan\s+carlos/i,
  /escalar(?:lo|la)?\s+con\s+(?:mi\s+)?equipo/i,
  /aprobaci[oó]n\s+especial/i,
  /tengo\s+(?:la\s+)?mitad/i,
  /opci[oó]n\s*2/i,
];

function detectarIntervencionComercial(userMessage, replyText) {
  const combined = String(userMessage || "") + "\n" + String(replyText || "");
  if (!PATRONES_INTERVENCION_COMERCIAL.some((patron) => patron.test(combined))) return null;
  return "Solicita pago parcial del Diagnóstico ON.";
}

function buildInterventionAlert(telefono, cliente, motivo, ultimoMensaje) {
  return [
    "INTERVENCIÓN REQUERIDA",
    "",
    `Nombre: ${cliente?.nombre || "sin datos"}`,
    `Negocio: ${cliente?.negocio || cliente?.nombre || "sin datos"}`,
    `Teléfono: ${telefono}`,
    "",
    "Motivo:",
    motivo,
    "",
    "Último mensaje:",
    `"${ultimoMensaje || "sin datos"}"`,
    "",
    "Acción sugerida:",
    "Contactar manualmente desde CRM.",
  ].join("\n");
}

async function getClaudeResponse(from, userMessage) {
  const cliente = await getCliente(from);
  const historial = cliente?.historial || [];
  const systemPrompt = buildSystemPrompt(cliente);

  historial.push({ role: "user", content: userMessage });
  const ventana = historial.slice(-MAX_MENSAJES);

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 400,
    system: systemPrompt,
    messages: ventana,
  });

  const rawReply = message.content[0].text;
  const { texto, estado } = parsearEstado(rawReply);
  const motivoIntervencionComercial = detectarIntervencionComercial(userMessage, texto);
  const requiereIntervencion = Boolean(estado?.intervencion || motivoIntervencionComercial);
  const razonIntervencion = motivoIntervencionComercial || estado?.razon_intervencion || "Intervención humana requerida.";

  // Actualizar datos del cliente
  const updates = {
    historial: [...ventana, { role: "assistant", content: texto }],
    fecha_ultimo_mensaje: new Date().toISOString(),
  };

  if (estado) {
    if (estado.estado) updates.estado = estado.estado;
    if (estado.nombre) updates.nombre = estado.nombre;
    if (estado.negocio) updates.negocio = estado.negocio;
    if (estado.caliente !== undefined) updates.caliente = estado.caliente;

    // Alertar a Juan Carlos si es necesario
    if (estado.caliente && !cliente?.caliente && !requiereIntervencion) {
      await alertarJuanCarlos("caliente", from, estado);
    }

    // Programar seguimientos si corresponde
    if (estado.estado === "prospecto_frio" && cliente?.estado !== "prospecto_frio") {
      await programarSeguimientos(from, "prospecto_frio");
    }
  }

  if (requiereIntervencion) {
    updates.estado = "requiere_intervencion";
    updates.bot_enabled = false;
    updates.notas = `Intervención requerida: ${razonIntervencion}`;
    await alertarJuanCarlos("resumen", from, {
      texto: buildInterventionAlert(from, { ...cliente, ...estado }, razonIntervencion, userMessage),
    });
    await logEventoCRM(from, "requiere_intervencion", razonIntervencion, { ultimo_mensaje: userMessage });
  }

  await saveCliente(from, updates);
  if (requiereIntervencion) return null;
  return texto;
}

// ─── Deteccion de bots y rate limiting ──────────────────────────────────────

const LIMITE_MENSAJES_POR_HORA = 10;

const PATRONES_BOT = [
  /^(hola|hi|hello|hey),?\s*(soy|i am|im)\s+un?\s*(bot|asistente|assistant)/i,
  /este\s+es\s+un\s+mensaje\s+autom/i,
  /out\s+of\s+office/i,
  /respuesta\s+autom/i,
  /mensaje\s+autom/i,
  /auto.?reply/i,
  /autoresponder/i,
];

function esBot(texto) {
  return PATRONES_BOT.some(patron => patron.test(texto));
}

async function superaLimite(telefono) {
  try {
    const haceUnaHora = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count, error } = await supabase
      .from("mensajes")
      .select("id", { count: "exact", head: true })
      .eq("telefono", telefono)
      .eq("direccion", "entrante")
      .gte("created_at", haceUnaHora);
    if (error) {
      console.error("Supabase rate limit error:", error.message);
      return false;
    }
    return (count || 0) > LIMITE_MENSAJES_POR_HORA;
  } catch (e) {
    console.error("Rate limit exception:", e.message);
    return false;
  }
}

// ─── Handler principal ───────────────────────────────────────────────────────

module.exports = async (req, res) => {
  if (req.method === "GET") {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      return res.status(200).send(challenge);
    }
    return res.status(403).send("Forbidden");
  }

  if (req.method === "POST") {
    const body = req.body;
    if (body.object === "whatsapp_business_account") {
      for (const entry of body.entry) {
        for (const change of entry.changes) {
          console.log("DEBUG webhook change keys", {
            keys: Object.keys(change.value || {}),
            hasMessages: !!change.value?.messages,
            hasStatuses: !!change.value?.statuses,
            statuses: JSON.stringify(change.value?.statuses || null, null, 2)
          });

          const statuses = change.value?.statuses;
          if (statuses && statuses.length > 0) {
            for (const status of statuses) {
              const tel = status.recipient_id;
              if (status.status === "failed" || (status.errors && status.errors.length > 0)) {
                const msgErr = status.errors?.[0]?.message || status.status || "failed";
                await logEventoCRM(tel, "whatsapp_failed", msgErr, { whatsapp_status: status });
                await supabase.from("conversaciones").update({ estado: "envio_fallido" }).eq("telefono", tel).eq("estado", "envio_pendiente");
              } else if (status.status === "delivered") {
                await logEventoCRM(tel, "whatsapp_status", status.status, { whatsapp_status: status });
                await supabase.from("conversaciones").update({ estado: "contactado" }).eq("telefono", tel).eq("estado", "envio_pendiente");
              } else if (["sent", "read"].includes(status.status)) {
                await logEventoCRM(tel, "whatsapp_status", status.status, { whatsapp_status: status });
              }
            }
          }

          const messages = change.value?.messages;
          if (messages && messages.length > 0) {
            const msg = messages[0];
            const from = msg.from;
            const text = msg.text?.body;

            if (!text) continue;

            console.log("DEBUG inbound recibido", {
              from,
              admin: JUAN_CARLOS_NUMBERS,
              text,
              esAdmin: JUAN_CARLOS_NUMBERS.includes(from)
            });





            const inboundGuardado = await logMensaje(from, "entrante", text, msg);
            if (inboundGuardado) {
              await logEventoCRM(from, "mensaje_entrante", text, { raw: msg });
            } else {
              console.error("No se registro evento mensaje_entrante porque fallo el insert en mensajes", { from });
            }
            await saveCliente(from, { ultimo_mensaje: text });

            const esAdmin = JUAN_CARLOS_NUMBERS.includes(from);
            const cliente = await getCliente(from);
            if (inboundGuardado && !esAdmin) {
              await alertarInboundCRM(from, cliente, text);
            }

            // Comandos de Juan Carlos
            if (esAdmin) {
              const esComando = await procesarComandoJC(text, from);
              if (esComando) continue;
            }

            if (cliente?.bot_enabled === false) {
              console.log(`IA pausada para ${from}`);
              await alertarMensajeConIAPausada(from, cliente, text);
              continue;
            }

            // Ignorar mensajes de bots
            if (!VALIDACION_SIN_FILTROS_INBOUND && !esAdmin && esBot(text)) {
              console.log(`Bot detectado, ignorando mensaje de ${from}`);
              continue;
            }

            // Cortar si supera limite de mensajes
            if (!VALIDACION_SIN_FILTROS_INBOUND && !esAdmin && await superaLimite(from)) {
              console.log(`Rate limit alcanzado para ${from}`);
              await alertarJuanCarlos("intervencion", from, {
                negocio: null,
                nombre: null,
                razon_intervencion: `Posible bot o spam — mas de ${LIMITE_MENSAJES_POR_HORA} mensajes. Revisar manualmente.`,
              });
              continue;
            }

            const respuestaCritica = await responderComercialCritico(from, text, cliente);
            if (respuestaCritica) {
              await sendMessage(from, respuestaCritica);
              continue;
            }

            const reply = await getClaudeResponse(from, text);
            if (reply) {
              const { cleanText, bloqueada } = prepararRespuestaCliente(reply);
              if (bloqueada) {
                console.error("Respuesta de Claude bloqueada por contener estado interno", { from });
                await alertarJsonBloqueado(from, cliente);
                await saveCliente(from, { estado: "requiere_intervencion", bot_enabled: false });
                continue;
              }
              await sendMessage(from, cleanText);
            }
          }
        }
      }
    }
    return res.status(200).json({ status: "ok" });
  }

  res.status(405).send("Method Not Allowed");
};

module.exports.__test = {
  contieneEstadoInterno,
  contieneAlucinacionComercialCritica,
  parsearEstado,
  preguntaComoPagar,
  preguntaPrecio,
  prepararRespuestaCliente,
  sanitizarRespuestaCliente,
};
