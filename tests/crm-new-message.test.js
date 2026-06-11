const assert = require("assert");

process.env.SUPABASE_URL = "https://example.supabase.co";
process.env.SUPABASE_SERVICE_KEY = "test";
process.env.ANTHROPIC_API_KEY = "test";

const { aplicarMetricasMensajes, normalizarResumenConversacion } = require("../api/crm-actions").__test;

const leadSinCampana = normalizarResumenConversacion({
  telefono: "525512345678",
  nombre: "Lead prueba",
  direccion_ultimo_mensaje: "entrante",
  mensajes_pendientes: 1,
  mensaje_nuevo: false,
});

assert.strictEqual(leadSinCampana.mensaje_nuevo, false);
assert.strictEqual(leadSinCampana.interactuo_post_campana, false);

const leadVistaConInteraccion = normalizarResumenConversacion({
  telefono: "525512345678",
  nombre: "Lead prueba",
  interactuo_post_campana: true,
  respuestas_post_campana: 1,
  mensajes_pendientes: null,
  mensaje_nuevo: null,
});

assert.strictEqual(leadVistaConInteraccion.mensaje_nuevo, true);
assert.strictEqual(leadVistaConInteraccion.interactuo_post_campana, true);
assert.strictEqual(leadVistaConInteraccion.mensajes_pendientes, 1);

const leadRespondido = normalizarResumenConversacion({
  telefono: "525512345678",
  nombre: "Lead prueba",
  direccion_ultimo_mensaje: "saliente",
  mensajes_pendientes: 0,
  mensaje_nuevo: false,
});

assert.strictEqual(leadRespondido.mensaje_nuevo, false);
assert.strictEqual(leadRespondido.mensajes_pendientes, 0);

const [leadCalculado] = aplicarMetricasMensajes(
  [{ telefono: "525512345678", nombre: "Lead prueba", mensaje_inicial_enviado_at: "2026-06-11T20:00:00.000Z" }],
  [
    {
      id: 1,
      telefono: "525512345678",
      direccion: "saliente",
      mensaje: "Mensaje inicial",
      created_at: "2026-06-11T20:00:00.000Z",
    },
    {
      id: 2,
      telefono: "525512345678",
      direccion: "entrante",
      mensaje: "Si por favor",
      created_at: "2026-06-11T20:05:00.000Z",
    },
    {
      id: 3,
      telefono: "525512345678",
      direccion: "saliente",
      mensaje: "Claro, te explico",
      created_at: "2026-06-11T20:06:00.000Z",
    },
  ]
);

assert.strictEqual(leadCalculado.total_mensajes, 3);
assert.strictEqual(leadCalculado.mensajes_entrantes, 1);
assert.strictEqual(leadCalculado.mensajes_salientes, 2);
assert.strictEqual(leadCalculado.direccion_ultimo_mensaje, "saliente");
assert.strictEqual(leadCalculado.respuestas_post_campana, 1);
assert.strictEqual(leadCalculado.interactuo_post_campana, true);
assert.strictEqual(leadCalculado.mensajes_pendientes, 1);
assert.strictEqual(leadCalculado.mensaje_nuevo, true);

console.log("crm-new-message fallback ok");
