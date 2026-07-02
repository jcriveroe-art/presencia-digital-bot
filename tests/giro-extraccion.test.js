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

const { detectarGiroNegocio } = require("../api/webhook").__test;

const casos = [
  ["Tengo un restaurante de mariscos", "restaurante"],
  ["Somos una taqueria en la colonia centro", "restaurante"],
  ["Es una clinica dental", "dental"],
  ["Tengo un consultorio dental", "dental"],
  ["Manejo un salon de belleza", "salon_belleza"],
  ["Tengo una peluqueria", "salon_belleza"],
  ["Es una tintoreria", "tintoreria"],
  ["Taller mecanico automotriz", "taller_mecanico"],
  ["Vendo en una ferreteria", "ferreteria"],
  ["Tengo una miscelanea", "abarrotes"],
  ["Es una farmacia de barrio", "farmacia"],
  ["Clinica veterinaria para mascotas", "veterinaria"],
  ["Doy clases en un gimnasio", "gimnasio"],
  ["Tengo una boutique de ropa", "boutique_ropa"],
  ["Manejamos un hotel pequeño", "hotel"],
  ["Somos una inmobiliaria", "inmobiliaria"],
  ["Somos una constructora", "construccion"],
];

for (const [texto, esperado] of casos) {
  const resultado = detectarGiroNegocio(texto);
  assert.strictEqual(resultado, esperado, `esperaba "${esperado}" para "${texto}", obtuve "${resultado}"`);
}

// Falsos negativos son aceptables: texto ambiguo o sin giro reconocible no debe reventar, solo devolver null
assert.strictEqual(detectarGiroNegocio("hola, quiero informacion"), null);
assert.strictEqual(detectarGiroNegocio(""), null);
assert.strictEqual(detectarGiroNegocio(null), null);
assert.strictEqual(detectarGiroNegocio(undefined), null);

// No debe confundir palabras parciales (evitar falsos positivos obvios por \b)
assert.strictEqual(detectarGiroNegocio("soy hotelero de toda la vida"), null);

console.log("giro-extraccion tests passed");
