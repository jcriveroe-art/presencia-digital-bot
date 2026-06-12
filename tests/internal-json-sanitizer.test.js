const assert = require("assert");

process.env.SUPABASE_URL = "https://example.supabase.co";
process.env.SUPABASE_SERVICE_KEY = "test";
process.env.ANTHROPIC_API_KEY = "test";
process.env.WHATSAPP_TOKEN = "test";
process.env.PHONE_NUMBER_ID = "123";

const axios = require("axios");
axios.post = async () => ({ data: { ok: true } });

const { sendWhatsApp } = require("../lib/crm");
const { contieneEstadoInterno, parsearEstado, prepararRespuestaCliente, sanitizarRespuestaCliente } = require("../api/webhook").__test;

const claude = [
  "Hola, claro.",
  "---",
  "ESTADO:",
  "```json",
  '{"caliente":false,"estado":"nuevo","intervencion":false,"razon_intervencion":null}',
  "```",
].join("\n");

const parsed = parsearEstado(claude);

assert.strictEqual(parsed.texto, "Hola, claro.");
assert.deepStrictEqual(parsed.estado, {
  caliente: false,
  estado: "nuevo",
  intervencion: false,
  razon_intervencion: null,
});
assert.strictEqual(contieneEstadoInterno(parsed.texto), false);

assert.strictEqual(
  sanitizarRespuestaCliente('Perfecto.\n\n{"caliente":false,"estado":"nuevo"}'),
  "Perfecto."
);

const usable = prepararRespuestaCliente('Perfecto. Te explico...\n\n---\nESTADO:{"caliente":false,"estado":"nuevo"}');
assert.deepStrictEqual(usable, {
  cleanText: "Perfecto. Te explico...",
  bloqueada: false,
});

const onlyJson = prepararRespuestaCliente('ESTADO:{"caliente":false,"estado":"nuevo"}');
assert.deepStrictEqual(onlyJson, {
  cleanText: "",
  bloqueada: true,
});

(async () => {
  await assert.rejects(
    () => sendWhatsApp("525512345678", 'Hola\nESTADO:{"caliente":false,"estado":"nuevo"}'),
    /estado interno bloqueado/
  );

  console.log("internal-json-sanitizer ok");
})();
