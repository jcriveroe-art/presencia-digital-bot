const { createClient } = require("@supabase/supabase-js");
const axios = require("axios");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const JUAN_CARLOS_NUMBER = "5215647943262";

const MENSAJES = {
  seguimiento_diagnostico_d2: (nombre) =>
    `${nombre ? nombre + ", " : ""}¿pudiste revisar el diagnóstico? La sección de reseñas es la que más impacto tiene en tu posición actual — quería saber si te generó alguna pregunta.`,

  seguimiento_diagnostico_d4: (nombre) =>
    `${nombre ? nombre + ", " : ""}el plazo para aplicar la toma a cuenta vence mañana. ¿Arrancamos con la Activación ON o prefieres resolver alguna duda primero?`,

  seguimiento_diagnostico_d6: (nombre) =>
    `El plazo de la toma a cuenta ya venció. Si decides contratar la Activación ON, el precio es $5,500 sin descuento. Aquí sigo para cuando quieras.`,

  seguimiento_frio_d2: (nombre) =>
    `${nombre ? nombre + ", " : ""}¿tuviste oportunidad de pensarlo? Hay negocios cercanos cuidando mejor su presencia en Google esta semana.`,

  seguimiento_frio_d4: (nombre) =>
    `Último mensaje de mi parte. Si en algún momento quieres revisar cómo estás apareciendo en Google, aquí ando.`,
};

async function sendWhatsApp(to, message) {
  try {
    await axios.post(
      `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: message },
      },
      {
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (e) {
    console.error(`Error enviando a ${to}:`, e.message);
  }
}

async function procesarSeguimientos() {
  const hoy = new Date().toISOString().split("T")[0];

  // Obtener tareas del día
  const { data: tareas } = await supabase
    .from("tareas")
    .select("*, conversaciones(nombre, negocio, estado, caliente)")
    .eq("fecha_programada", hoy)
    .eq("completada", false);

  if (!tareas || tareas.length === 0) return [];

  const enviados = [];

  for (const tarea of tareas) {
    const cliente = tarea.conversaciones;

    // No mandar si el cliente ya cerró o está perdido
    if (cliente?.estado === "cliente_activo" || cliente?.estado === "perdido") {
      await supabase.from("tareas").update({ completada: true }).eq("id", tarea.id);
      continue;
    }

    const mensaje = MENSAJES[tarea.tipo]?.(cliente?.nombre);
    if (!mensaje) continue;

    await sendWhatsApp(tarea.telefono, mensaje);
    await supabase.from("tareas").update({ completada: true }).eq("id", tarea.id);

    // Actualizar contador de seguimientos
    await supabase
      .from("conversaciones")
      .update({ contador_seguimientos: supabase.raw("contador_seguimientos + 1") })
      .eq("telefono", tarea.telefono);

    enviados.push({ telefono: tarea.telefono, tipo: tarea.tipo, negocio: cliente?.negocio });
  }

  return enviados;
}

async function generarResumenDiario() {
  // Clientes calientes activos
  const { data: calientes } = await supabase
    .from("conversaciones")
    .select("telefono, nombre, negocio, estado")
    .eq("caliente", true)
    .neq("estado", "perdido");

  // Seguimientos programados hoy
  const hoy = new Date().toISOString().split("T")[0];
  const { data: tareasHoy } = await supabase
    .from("tareas")
    .select("telefono, tipo")
    .eq("fecha_programada", hoy)
    .eq("completada", false);

  // Clientes sin actividad hace más de 7 días
  const hace7dias = new Date();
  hace7dias.setDate(hace7dias.getDate() - 7);
  const { data: inactivos } = await supabase
    .from("conversaciones")
    .select("telefono, nombre, negocio")
    .lt("fecha_ultimo_mensaje", hace7dias.toISOString())
    .neq("estado", "perdido")
    .neq("estado", "cliente_activo");

  let resumen = `Buenos dias. Resumen del dia:\n\n`;

  if (calientes?.length > 0) {
    resumen += `CLIENTES CALIENTES (${calientes.length}):\n`;
    calientes.forEach(c => {
      resumen += `- ${c.nombre || c.telefono} | ${c.negocio || "sin negocio"} | ${c.estado}\n`;
    });
    resumen += "\n";
  } else {
    resumen += `Sin clientes calientes activos.\n\n`;
  }

  if (tareasHoy?.length > 0) {
    resumen += `SEGUIMIENTOS HOY (${tareasHoy.length}):\n`;
    tareasHoy.forEach(t => {
      resumen += `- ${t.telefono} | ${t.tipo}\n`;
    });
    resumen += "\n";
  } else {
    resumen += `Sin seguimientos programados hoy.\n\n`;
  }

  if (inactivos?.length > 0) {
    resumen += `SIN ACTIVIDAD +7 DIAS (${inactivos.length}):\n`;
    inactivos.forEach(c => {
      resumen += `- ${c.nombre || c.telefono} | ${c.negocio || "sin negocio"}\n`;
    });
  }

  return resumen;
}

module.exports = async (req, res) => {
  // Verificar que es el cron de Vercel
  if (req.headers["authorization"] !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    // 1. Procesar seguimientos del día
    const enviados = await procesarSeguimientos();

    // 2. Generar y mandar resumen a Juan Carlos
    const resumen = await generarResumenDiario();
    await sendWhatsApp(JUAN_CARLOS_NUMBER, resumen);

    return res.status(200).json({
      ok: true,
      seguimientos_enviados: enviados.length,
      detalle: enviados,
    });
  } catch (e) {
    console.error("Cron error:", e.message);
    return res.status(500).json({ error: e.message });
  }
};
