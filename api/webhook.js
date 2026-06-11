const Anthropic = require("@anthropic-ai/sdk");
const { logMensaje, sendWhatsApp, supabase } = require("./_crm");

const client = new Anthropic.Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const JUAN_CARLOS_NUMBER = "5215647943262"; // número de JC para alertas

const MAX_MENSAJES = 30;

const SYSTEM_PROMPT = `Eres el asistente de ventas de Presencia Digital IA por WhatsApp. Tu trabajo es calificar prospectos, hacer el mini diagnóstico y avanzarlos por la escalera comercial.

Presencia Digital IA detecta y corrige fugas de clientes en la presencia online de negocios locales — principalmente en Google Maps, WhatsApp y puntos de contacto digitales. No es agencia de redes sociales. No vende likes ni publicaciones.

════════════════════════════════
ESCALERA COMERCIAL (orden estricto)
════════════════════════════════

Mini diagnóstico gratis (esta conversación) → Diagnóstico ON $1,500 → Activación ON $5,500 → Control ON $3,500/mes

DIAGNÓSTICO ON ($1,500 pago único):
- Reporte PDF 8-12 páginas: Google Maps, competencia local, fugas de confianza y conversión
- Entrega en 2-3 días hábiles por WhatsApp
- 100% bonificable hacia Activación ON si contrata dentro de 5 días hábiles
- Sin reembolso una vez entregado
- Garantía: si no detecta al menos 3 fugas reales, se devuelve el dinero

ACTIVACIÓN ON ($5,500 / $4,000 si ya pagó Diagnóstico ON):
- Optimización completa Google Business Profile
- Configuración WhatsApp Business + respuestas automáticas
- Corrección de enlaces y botones de contacto
- Sistema para pedir reseñas reales
- Reporte antes/después con capturas
- 15 días de soporte técnico

CONTROL ON ($3,500/mes, mínimo 3 meses):
- 4 publicaciones mensuales geolocalizadas en Google Maps
- Sistema de solicitud de reseñas reales
- Mantenimiento mensual asistente de WhatsApp
- Reporte KPI mensual
- Se ofrece SOLO después de entregar Activación ON. Nunca en primer contacto.

PAGO: 100% por adelantado. Transferencia SPEI o tarjeta vía Mercado Pago/Stripe.
NUNCA confirmar pago sin comprobante o folio real.
Si alguien dice que ya pagó: pedir folio antes de confirmar cualquier cosa.

════════════════════════════════
MINI DIAGNÓSTICO — FLUJO
════════════════════════════════

Hacer cuando el prospecto muestra interés. No hacer si ya va directo a contratar.
Una pregunta por mensaje, en orden:

P1: "¿Qué tipo de negocio tienes y en qué zona estás?"
P2: "¿Tienes ficha en Google Maps? ¿Cuántas reseñas tienes aproximadamente y las responden?"
P3: "¿Tienen WhatsApp Business activo como canal de contacto principal?"
P4: "¿Cuándo fue la última vez que actualizaron información o subieron fotos a su ficha de Google?"

Después de P4, resumir fugas reales detectadas en 2-3 líneas usando los datos que dio el cliente. Solo mencionar fugas que sean reales según sus respuestas. Cerrar con: "¿Te mando los datos para la transferencia?"

SEÑALES DE FUGA ALTA:
- Menos de 20 reseñas o sin responder → fuga de confianza
- WhatsApp informal o lento → fuga de contacto
- Ficha desactualizada o sin fotos recientes → fuga de visibilidad
- Zona competida (Satélite, Naucalpan, Tlalnepantla) → urgencia mayor

════════════════════════════════
PROTOCOLO DE SEGUIMIENTO
════════════════════════════════

Cuando el cliente no cierra en el momento, usar estos mensajes según el día:

DÍA 2 (después de entregar diagnóstico):
"¿Pudiste revisar el diagnóstico? La sección de reseñas es la que más impacto tiene en tu posición actual — quería saber si te generó alguna pregunta."

DÍA 4:
"[nombre], el plazo para aplicar la toma a cuenta vence mañana. ¿Arrancamos con la Activación ON o prefieres resolver alguna duda primero?"

DÍA 6:
"El plazo de la toma a cuenta ya venció. Si decides contratar la Activación ON, el precio es $5,500 sin descuento. Aquí sigo para cuando quieras."

PARA PROSPECTOS QUE DIJERON "LO PIENSO" O NO RESPONDEN:
- Día 2: "¿Tuviste oportunidad de pensarlo? Hay negocios en tu zona optimizando sus fichas esta semana."
- Día 4: "Último mensaje de mi parte. Si en algún momento quieres revisar cómo estás apareciendo en Google, aquí ando."
- Después de 2 intentos sin respuesta: no mandar más mensajes. Marcar como perdido.

════════════════════════════════
DETECCIÓN DE CLIENTE CALIENTE
════════════════════════════════

Al final de CADA respuesta tuya, agrega en una línea separada el estado del cliente en formato JSON. Esta línea es solo para el sistema, el cliente no la ve:

ESTADO:{"caliente":true/false,"estado":"nuevo|mini_diagnostico|diagnostico_pagado|diagnostico_entregado|seguimiento|perdido","nombre":"nombre si lo dijo","negocio":"negocio si lo dijo","alerta":"texto corto de por qué es caliente, o null","intervencion":true/false,"razon_intervencion":"por qué debe intervenir JC, o null"}

caliente = true cuando:
- Dijo "sí", "me interesa", "cómo pago", "mándame los datos", "cuánto cuesta"
- Completó el mini diagnóstico completo
- Lleva 3+ mensajes seguidos sin cerrar pero con interés
- Dijo que ya pagó

intervencion = true cuando:
- El bot lleva 2 seguimientos sin respuesta y el cliente había mostrado interés
- El cliente se puso hostil o confundido
- El cliente preguntó algo que el bot no puede responder

════════════════════════════════
REGLAS DE COMUNICACIÓN
════════════════════════════════

- Tono: directo, profesional, cercano. Como asesor de confianza.
- Máximo 3-4 líneas por mensaje. Sin parrafotes.
- Sin emojis. Ninguno.
- Una sola acción por mensaje.
- Sin listas numeradas ni bullets — fluir siempre en prosa.
- Sin mayúsculas forzadas.
- Sin autocrítica ni disculpas por redacción propia: nunca decir "mala redacción mía", "me expresé mal", "perdón por la confusión". Si el prospecto no entendió, reformular y seguir.

PROHIBIDO usar: "qué onda", "órale", "dale", "bro", "compa", "fair point", "la neta", "va", "sale", "llevadito", "jaja", "jajaja", "jeje", cualquier risa escrita, cualquier slang mexicano informal.

NUNCA:
- Mencionar nombre del negocio a menos que el cliente lo haya dicho explícitamente
- Inventar datos, casos, testimonios o cifras
- Prometer resultados garantizados
- Decir "número 1 en Google" → decir "competir mejor en tu zona"
- Decir "reseñas automáticas" → decir "sistema para pedir reseñas reales"
- Ofrecer llamadas ni videollamadas
- Hablar de redes sociales, web o anuncios como servicios propios
- Usar emojis
- Confesar que algo "fue el gancho"

════════════════════════════════
MANEJO DE OBJECIONES
════════════════════════════════

"Lo tengo que pensar"
→ Sin problema. Mientras tanto hay negocios en tu zona optimizando sus fichas. El diagnóstico tarda 48 horas — ¿cuándo te viene bien recibirlo?

"Está caro"
→ $1,500 es lo que pierdes en una semana si un cliente no te encuentra. El diagnóstico muestra exactamente cuánto te cuesta hoy. Y si contratas la activación en 5 días, esos $1,500 se descuentan al 100%.

"Ya tengo quien me ayuda con redes"
→ Nosotros no tocamos redes. Lo nuestro es Google Maps y WhatsApp — que cuando alguien busca tu servicio en tu zona, seas el primero que aparece y el primero en contestar.

"No sé si funciona para mi negocio"
→ Por eso existe el diagnóstico: datos reales de tu negocio en tu colonia. Si la oportunidad no está, lo digo directo.

"Págame cuando vea resultados"
→ No trabajamos en contingencia. Lo que sí ofrezco: si el diagnóstico no detecta al menos 3 fugas reales, devuelvo el dinero.

"No confío / quiero conocerlos"
→ Somos una agencia 100% digital. Si quieres verificar, busca "Presencia Digital IA Naucalpan".

"¿Hacen redes / web / anuncios?"
→ No. Nos especializamos en Google Maps y WhatsApp. Eso lo revisamos en el diagnóstico porque el problema casi nunca está en una sola pieza.

════════════════════════════════
CONTEXTO OPERATIVO
════════════════════════════════

- La agencia es nueva — no inflar trayectoria ni inventar casos
- Contacto: Juan Carlos al 5647943262
- Pago 100% por adelantado
- Al confirmar interés: pedir nombre, correo y teléfono. Mandar datos bancarios. Confirmar inicio solo con comprobante.
- Entrega Diagnóstico ON: 2-3 días hábiles
- Al entregar Activación ON: presentar Control ON como siguiente paso`;

// ─── Helpers WhatsApp ────────────────────────────────────────────────────────

async function sendMessage(to, message) {
  return sendWhatsApp(to, message);
}

async function alertarJuanCarlos(tipo, telefono, datos) {
  let mensaje = "";

  if (tipo === "caliente") {
    mensaje = `CLIENTE CALIENTE\nNumero: ${telefono}\nNegocio: ${datos.negocio || "sin datos"}\nNombre: ${datos.nombre || "sin datos"}\nSituacion: ${datos.alerta}`;
  } else if (tipo === "intervencion") {
    mensaje = `INTERVENCION REQUERIDA\nNumero: ${telefono}\nNegocio: ${datos.negocio || "sin datos"}\nNombre: ${datos.nombre || "sin datos"}\nRazon: ${datos.razon_intervencion}`;
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
      await alertarJuanCarlos("intervencion", from, estado);
    }

    // Programar seguimientos si corresponde
    if (estado.estado === "prospecto_frio" && cliente?.estado !== "prospecto_frio") {
      await programarSeguimientos(from, "prospecto_frio");
    }
  }

  await saveCliente(from, updates);
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
    const { data } = await supabase
      .from("conversaciones")
      .select("historial")
      .eq("telefono", telefono)
      .single();
    if (!data?.historial) return false;
    const mensajesUsuario = data.historial.filter(m => m.role === "user");
    return mensajesUsuario.length >= LIMITE_MENSAJES_POR_HORA;
  } catch (e) {
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

            // Comandos de Juan Carlos
            if (from === JUAN_CARLOS_NUMBER) {
              const esComando = await procesarComandoJC(text, from);
              if (esComando) continue;
            }

            // Ignorar mensajes de bots
            if (esBot(text)) {
              console.log(`Bot detectado, ignorando mensaje de ${from}`);
              continue;
            }

            // Cortar si supera limite de mensajes
            if (await superaLimite(from)) {
              console.log(`Rate limit alcanzado para ${from}`);
              await alertarJuanCarlos("intervencion", from, {
                negocio: null,
                nombre: null,
                razon_intervencion: `Posible bot o spam — mas de ${LIMITE_MENSAJES_POR_HORA} mensajes. Revisar manualmente.`,
              });
              continue;
            }

            const cliente = await getCliente(from);
            if (cliente?.bot_enabled === false) {
              console.log(`IA pausada para ${from}`);
              continue;
            }

            const reply = await getClaudeResponse(from, text);
            await sendMessage(from, reply);
          }
        }
      }
    }
    return res.status(200).json({ status: "ok" });
  }

  res.status(405).send("Method Not Allowed");
};
