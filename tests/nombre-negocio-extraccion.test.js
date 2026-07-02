const assert = require("assert");

process.env.SUPABASE_URL = "https://example.supabase.co";
process.env.SUPABASE_SERVICE_KEY = "test";
process.env.ANTHROPIC_API_KEY = "test";
process.env.WHATSAPP_TOKEN = "test";
process.env.PHONE_NUMBER_ID = "123";

const { supabase } = require("../lib/crm");
supabase.from = () => ({
  update: () => ({ eq: async () => ({ error: null }) }),
  insert: () => ({ eq: async () => ({ error: null }) }),
  upsert: async () => ({ error: null }),
  select: () => ({ eq: () => ({ single: async () => ({ data: null }), maybeSingle: async () => ({ data: null }) }) }),
});

const { detectarNombreNegocio } = require("../api/webhook").__test;

// Casos positivos: los tres patrones documentados en el plan
assert.strictEqual(detectarNombreNegocio("Mi negocio se llama Tacos El Buen Sabor"), "Tacos El Buen Sabor");
assert.strictEqual(detectarNombreNegocio("El negocio es Ferreteria Lopez"), "Ferreteria Lopez");
assert.strictEqual(detectarNombreNegocio("Somos Dental Sonrisas BCS"), "Dental Sonrisas BCS");

// Corta en conjunciones/preposiciones que indican que sigue descripcion, no nombre
assert.strictEqual(detectarNombreNegocio("Somos Tacos El Buen Sabor y estamos en el centro"), "Tacos El Buen Sabor");

// Guardia: "somos un/una <giro>" no debe capturarse como nombre propio
assert.strictEqual(detectarNombreNegocio("Somos un restaurante en la colonia centro"), null);
assert.strictEqual(detectarNombreNegocio("Somos una tintoreria"), null);
assert.strictEqual(detectarNombreNegocio("El negocio es una farmacia"), null);

// Nombres propios cortos con articulo no deben confundirse con el giro (no matchean GIRO_KEYWORDS)
assert.strictEqual(detectarNombreNegocio("Mi negocio se llama La Fuente"), "La Fuente");

// Nombre propio que contiene una palabra de GIRO_KEYWORDS pero con mas de 2 palabras: se conserva
assert.strictEqual(detectarNombreNegocio("Somos Restaurante El Fogon"), "Restaurante El Fogon");

// Sin patron reconocible: null (falso negativo aceptable)
assert.strictEqual(detectarNombreNegocio("hola, quiero informacion"), null);
assert.strictEqual(detectarNombreNegocio(""), null);
assert.strictEqual(detectarNombreNegocio(null), null);
assert.strictEqual(detectarNombreNegocio(undefined), null);

console.log("nombre-negocio-extraccion tests passed");
