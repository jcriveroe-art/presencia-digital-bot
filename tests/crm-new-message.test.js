const assert = require("assert");

process.env.SUPABASE_URL = "https://example.supabase.co";
process.env.SUPABASE_SERVICE_KEY = "test";
process.env.ANTHROPIC_API_KEY = "test";

const { normalizarResumenConversacion } = require("../api/crm-actions").__test;

const leadConPendiente = normalizarResumenConversacion({
  telefono: "525512345678",
  nombre: "Lead prueba",
  direccion_ultimo_mensaje: "entrante",
  mensajes_pendientes: 1,
  mensaje_nuevo: false,
});

assert.strictEqual(leadConPendiente.mensaje_nuevo, true);
assert.strictEqual(leadConPendiente.mensajes_pendientes, 1);

const leadVistaIncompleta = normalizarResumenConversacion({
  telefono: "525512345678",
  nombre: "Lead prueba",
  direccion_ultimo_mensaje: "entrante",
  mensajes_pendientes: null,
  mensaje_nuevo: null,
});

assert.strictEqual(leadVistaIncompleta.mensaje_nuevo, true);
assert.strictEqual(leadVistaIncompleta.mensajes_pendientes, 1);

const leadRespondido = normalizarResumenConversacion({
  telefono: "525512345678",
  nombre: "Lead prueba",
  direccion_ultimo_mensaje: "saliente",
  mensajes_pendientes: 0,
  mensaje_nuevo: false,
});

assert.strictEqual(leadRespondido.mensaje_nuevo, false);
assert.strictEqual(leadRespondido.mensajes_pendientes, 0);

console.log("crm-new-message fallback ok");
