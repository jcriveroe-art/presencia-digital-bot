const { supabase } = require("./crm");

const CAMPOS_CONVERSATION_STATE = ["etapa", "giro_negocio", "nombre_negocio", "ultimo_trigger", "ultimo_trigger_at"];

const MIRROR_A_CONVERSACIONES = {
  etapa: "estado",
  giro_negocio: "categoria",
  nombre_negocio: "negocio",
};

async function getConversationState(telefono) {
  try {
    const { data } = await supabase
      .from("conversation_state")
      .select("*")
      .eq("telefono", telefono)
      .single();
    return data || null;
  } catch (e) {
    return null;
  }
}

async function upsertConversationState(telefono, updates) {
  const payload = { telefono, updated_at: new Date().toISOString() };
  const mirrorPayload = { telefono };
  let tieneMirror = false;

  for (const campo of CAMPOS_CONVERSATION_STATE) {
    if (!Object.prototype.hasOwnProperty.call(updates || {}, campo)) continue;
    payload[campo] = updates[campo];
    const campoEspejo = MIRROR_A_CONVERSACIONES[campo];
    if (campoEspejo) {
      mirrorPayload[campoEspejo] = updates[campo];
      tieneMirror = true;
    }
  }

  try {
    await supabase.from("conversation_state").upsert(payload, { onConflict: "telefono" });
  } catch (e) {
    console.error("Supabase conversation_state upsert error:", e.message);
  }

  if (tieneMirror) {
    try {
      await supabase.from("conversaciones").upsert(mirrorPayload, { onConflict: "telefono" });
    } catch (e) {
      console.error("Supabase conversaciones (espejo de conversation_state) error:", e.message);
    }
  }
}

module.exports = {
  getConversationState,
  upsertConversationState,
};
