const Anthropic = require("@anthropic-ai/sdk");
const { logMensaje, sendWhatsApp, supabase } = require("./_crm");

const client = new Anthropic.Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const JUAN_CARLOS_NUMBER = "5215647943262"; // número de JC para alertas

const MAX_MENSAJES = 30;

const SYSTEM_PROMPT = `Eres el asistente de ventas de Presencia Digital IA por WhatsApp. Tu trabajo es orientar con calma a negocios locales, hacer un mini diagnostico conversacional y avanzar solo cuando exista interes real.

Presencia Digital IA ayuda a negocios locales a mejorar su ficha de Google Maps y WhatsApp para que mas clientes los encuentren, confien y escriban. No somos agencia de redes sociales. No vendemos likes, publicaciones ni anuncios.

REGLA DE PRIMER CONTACTO
Si el usuario saluda, dice "hola", "buen dia", "soy nuevo" o no trae contexto, responde exactamente:
"Hola, soy el asistente de Presencia Digital IA. Ayudamos a negocios locales a mejorar su ficha de Google Maps y WhatsApp para que mas clientes los encuentren y les escriban. �Que tipo de negocio tienes y en que zona estas?"

MINI DIAGNOSTICO
Debe sentirse como conversacion, no interrogatorio. Haz una sola pregunta por mensaje.
No hagas mas de 3 preguntas antes de resumir. Usa este orden:
P1 giro y zona.
P2 si tiene ficha de Google Maps.
P3 si responde resenas o tiene fotos recientes.
P4 solo si falta informacion importante: si usa WhatsApp Business.

Si el usuario ya dijo giro y zona, no lo marques caliente. Estado: mini_diagnostico, caliente=false.
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

ESTADOS Y JSON
Al final de CADA respuesta, agrega una linea separada con JSON. Esa linea es solo para el sistema; el cliente no la ve.

Formato exacto:
ESTADO:{"caliente":true/false,"estado":"nuevo|mini_diagnostico|interesado|cliente_caliente|diagnostico_pagado|diagnostico_entregado|seguimiento|perdido","nombre":"nombre si lo dijo","negocio":"negocio si lo dijo","alerta":"texto corto si es caliente, o null","intervencion":true/false,"razon_intervencion":"razon breve, o null"}

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
Usuario: tintoreria en Fuentes de Satelite
Respuesta: no marques caliente; pregunta si tiene ficha de Google Maps.
Usuario: no entiendo
Respuesta: explica simple y no cobres.`;
// Helpers WhatsApp

async function sendMessage(to, message) {
  return sendWhatsApp(to, message);
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
    await sendMessage(JUAN_CARLOS_NUMBER, mensaje);
  } catch (e) {
    console.error("Error alertando a JC:", e.message);
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
  try {
    const match = respuesta.match(/ESTADO:(\{.*\})/);
    if (!match) return { texto: respuesta, estado: null };
    const estado = JSON.parse(match[1]);
    const texto = respuesta.replace(/\nESTADO:\{.*\}/, "").trim();
    return { texto, estado };
  } catch (e) {
    return { texto: respuesta, estado: null };
  }
}

// ─── Comandos de Juan Carlos ─────────────────────────────────────────────────

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

async function getClaudeResponse(from, userMessage) {
  const cliente = await getCliente(from);
  const historial = cliente?.historial || [];

  historial.push({ role: "user", content: userMessage });
  const ventana = historial.slice(-MAX_MENSAJES);

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 400,
    system: SYSTEM_PROMPT,
    messages: ventana,
  });

  const rawReply = message.content[0].text;
  const { texto, estado } = parsearEstado(rawReply);

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
    if (estado.caliente && !cliente?.caliente) {
      await alertarJuanCarlos("caliente", from, estado);
    }
    if (estado.intervencion) {
      updates.bot_enabled = false;
      await alertarJuanCarlos("intervencion", from, {
        ...estado,
        ultimo_mensaje: userMessage,
      });
    }

    // Programar seguimientos si corresponde
    if (estado.estado === "prospecto_frio" && cliente?.estado !== "prospecto_frio") {
      await programarSeguimientos(from, "prospecto_frio");
    }
  }

  await saveCliente(from, updates);
  if (estado?.intervencion) return null;
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
          const messages = change.value?.messages;
          if (messages && messages.length > 0) {
            const msg = messages[0];
            const from = msg.from;
            const text = msg.text?.body;

            if (!text) continue;

            await logMensaje(from, "entrante", text, msg);
            await saveCliente(from, {});

            const esAdmin = from === JUAN_CARLOS_NUMBER;

            // Comandos de Juan Carlos
            if (esAdmin) {
              const esComando = await procesarComandoJC(text, from);
              if (esComando) continue;
            }

            const cliente = await getCliente(from);
            if (cliente?.bot_enabled === false) {
              console.log(`IA pausada para ${from}`);
              continue;
            }

            // Ignorar mensajes de bots
            if (!esAdmin && esBot(text)) {
              console.log(`Bot detectado, ignorando mensaje de ${from}`);
              continue;
            }

            // Cortar si supera limite de mensajes
            if (!esAdmin && await superaLimite(from)) {
              console.log(`Rate limit alcanzado para ${from}`);
              await alertarJuanCarlos("intervencion", from, {
                negocio: null,
                nombre: null,
                razon_intervencion: `Posible bot o spam — mas de ${LIMITE_MENSAJES_POR_HORA} mensajes. Revisar manualmente.`,
              });
              continue;
            }

            const reply = await getClaudeResponse(from, text);
            if (reply) {
              await sendMessage(from, reply);
            }
          }
        }
      }
    }
    return res.status(200).json({ status: "ok" });
  }

  res.status(405).send("Method Not Allowed");
};
