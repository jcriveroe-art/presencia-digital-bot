const assert = require("assert");
const Module = require("module");

process.env.SUPABASE_URL = "https://example.supabase.co";
process.env.SUPABASE_SERVICE_KEY = "test";
process.env.WHATSAPP_TOKEN = "test";
process.env.PHONE_NUMBER_ID = "123";

let axiosCalled = false;
const originalLoad = Module._load;

Module._load = function patchedLoad(request, parent, isMain) {
  if (request === "axios") {
    return {
      post: async () => {
        axiosCalled = true;
        return { data: { ok: true } };
      },
    };
  }
  if (request === "@supabase/supabase-js") {
    return {
      createClient: () => ({
        from: () => ({
          insert: async () => ({ error: null }),
        }),
      }),
    };
  }
  return originalLoad(request, parent, isMain);
};

delete require.cache[require.resolve("../lib/crm")];
const { sendWhatsApp } = require("../lib/crm");
Module._load = originalLoad;

(async () => {
  await assert.rejects(
    () => sendWhatsApp("525512345678", "INTERVENCION REQUERIDA\nIA pausada. Responder manualmente desde CRM."),
    /Mensaje administrativo bloqueado/
  );
  assert.strictEqual(axiosCalled, false);
  console.log("send guard tests passed");
})();
