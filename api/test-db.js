const { createClient } = require("@supabase/supabase-js");

module.exports = async (req, res) => {
  if (req.query.secret !== 'antigravity_secret_123') {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    // 1. Decodificar SUPABASE_SERVICE_KEY
    const key = process.env.SUPABASE_SERVICE_KEY;
    let role = "unknown";
    if (key) {
      const parts = key.split(".");
      if (parts.length === 3) {
        try {
          const payload = JSON.parse(atob(parts[1]));
          role = payload.role || "no role in payload";
        } catch (e) {
          role = "error decoding: " + e.message;
        }
      } else {
        role = "not a jwt";
      }
    } else {
      role = "SUPABASE_SERVICE_KEY not set";
    }

    // 2. select count(*) from eventos_crm
    const { count, error: errCount } = await supabase
      .from("eventos_crm")
      .select("*", { count: "exact", head: true });

    // 3. Intento de select * from pg_policies where tablename = 'eventos_crm'
    // Como PostgREST no suele exponer pg_policies, intentamos leerlo sabiendo que puede dar 404
    const { data: policies, error: errPolicies } = await supabase
      .from("pg_policies")
      .select("*")
      .eq("tablename", "eventos_crm");

    res.status(200).json({
      ok: true,
      role: role,
      count: count !== null ? count : null,
      count_error: errCount ? errCount.message : null,
      policies: policies || null,
      policies_error: errPolicies ? errPolicies.message : null,
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};
