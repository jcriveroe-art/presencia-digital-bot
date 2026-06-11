module.exports = async (req, res) => {
  if (req.method !== "GET") return res.status(405).send("Method Not Allowed");

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(`<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>CRM ON</title>
  <style>
    :root { color-scheme: light; --line:#d8dee8; --ink:#17202a; --muted:#657386; --bg:#f6f8fb; --panel:#ffffff; --on:#137a4d; --off:#9b2c2c; --accent:#1358a8; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: Arial, Helvetica, sans-serif; background: var(--bg); color: var(--ink); }
    header { height: 56px; display: flex; align-items: center; justify-content: space-between; padding: 0 18px; border-bottom: 1px solid var(--line); background: var(--panel); }
    h1 { font-size: 18px; margin: 0; letter-spacing: 0; }
    button, textarea { font: inherit; }
    button { border: 1px solid var(--line); background: #fff; color: var(--ink); border-radius: 6px; min-height: 36px; padding: 0 12px; cursor: pointer; }
    button.primary { background: var(--accent); border-color: var(--accent); color: #fff; }
    button.danger { color: var(--off); }
    main { display: grid; grid-template-columns: minmax(260px, 360px) 1fr; height: calc(100vh - 56px); }
    aside { border-right: 1px solid var(--line); background: var(--panel); overflow: auto; }
    .lead { width: 100%; text-align: left; border: 0; border-bottom: 1px solid var(--line); border-radius: 0; padding: 12px 14px; min-height: 74px; display: block; }
    .lead.active { background: #edf4ff; }
    .lead strong { display: block; font-size: 14px; margin-bottom: 4px; }
    .lead span { display: block; color: var(--muted); font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    section { display: grid; grid-template-rows: auto 1fr auto; min-width: 0; }
    .detail-head { display: flex; gap: 10px; align-items: center; justify-content: space-between; padding: 14px 16px; border-bottom: 1px solid var(--line); background: var(--panel); }
    .identity { min-width: 0; }
    .identity strong { display: block; font-size: 16px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .identity span { color: var(--muted); font-size: 12px; }
    .actions { display: flex; gap: 8px; align-items: center; }
    .badge { border-radius: 999px; padding: 5px 9px; font-size: 12px; border: 1px solid var(--line); }
    .badge.on { color: var(--on); }
    .badge.off { color: var(--off); }
    .messages { overflow: auto; padding: 18px; display: flex; flex-direction: column; gap: 10px; }
    .msg { max-width: min(680px, 82%); padding: 10px 12px; border: 1px solid var(--line); border-radius: 8px; background: var(--panel); line-height: 1.38; white-space: pre-wrap; overflow-wrap: anywhere; }
    .msg.saliente { align-self: flex-end; background: #edf7f1; }
    .msg small { display: block; margin-top: 6px; color: var(--muted); font-size: 11px; }
    form { display: grid; grid-template-columns: 1fr auto; gap: 10px; padding: 14px 16px; border-top: 1px solid var(--line); background: var(--panel); }
    textarea { width: 100%; min-height: 58px; max-height: 150px; resize: vertical; border: 1px solid var(--line); border-radius: 6px; padding: 10px; }
    .empty { padding: 24px; color: var(--muted); }
    @media (max-width: 760px) { main { grid-template-columns: 1fr; grid-template-rows: 38vh 1fr; } aside { border-right: 0; border-bottom: 1px solid var(--line); } }
  </style>
</head>
<body>
  <header>
    <h1>CRM ON</h1>
    <button id="refresh">Actualizar</button>
  </header>
  <main>
    <aside id="leads"></aside>
    <section>
      <div class="detail-head">
        <div class="identity"><strong id="title">Selecciona una conversacion</strong><span id="subtitle"></span></div>
        <div class="actions"><span id="botBadge" class="badge">IA</span><button id="toggleBot" disabled>IA ON/OFF</button></div>
      </div>
      <div id="messages" class="messages"><div class="empty">Sin conversacion seleccionada.</div></div>
      <form id="manualForm">
        <textarea id="manualText" placeholder="Responder por WhatsApp" disabled></textarea>
        <button class="primary" id="sendManual" disabled>Enviar</button>
      </form>
    </section>
  </main>
  <script>
    let conversaciones = [];
    let selected = null;

    const leads = document.getElementById("leads");
    const messages = document.getElementById("messages");
    const title = document.getElementById("title");
    const subtitle = document.getElementById("subtitle");
    const botBadge = document.getElementById("botBadge");
    const toggleBot = document.getElementById("toggleBot");
    const manualText = document.getElementById("manualText");
    const sendManual = document.getElementById("sendManual");

    function botOn(c) { return c && c.bot_enabled !== false; }
    function label(c) { return c.nombre || c.negocio || c.telefono; }

    async function loadConversaciones() {
      const res = await fetch("/api/conversaciones");
      const data = await res.json();
      conversaciones = data.conversaciones || [];
      renderLeads();
      if (selected) {
        selected = conversaciones.find(c => c.telefono === selected.telefono) || selected;
        await selectLead(selected.telefono);
      }
    }

    function renderLeads() {
      leads.innerHTML = conversaciones.map(c => '<button class="lead ' + (selected?.telefono === c.telefono ? 'active' : '') + '" data-tel="' + c.telefono + '"><strong>' + label(c) + '</strong><span>' + c.telefono + ' | ' + (c.estado || 'nuevo') + ' | IA ' + (botOn(c) ? 'ON' : 'OFF') + '</span></button>').join("") || '<div class="empty">Sin conversaciones.</div>';
      leads.querySelectorAll(".lead").forEach(btn => btn.addEventListener("click", () => selectLead(btn.dataset.tel)));
    }

    async function selectLead(telefono) {
      selected = conversaciones.find(c => c.telefono === telefono) || { telefono };
      renderLeads();
      title.textContent = label(selected);
      subtitle.textContent = selected.telefono + " | " + (selected.estado || "nuevo");
      botBadge.textContent = botOn(selected) ? "IA ON" : "IA OFF";
      botBadge.className = "badge " + (botOn(selected) ? "on" : "off");
      toggleBot.disabled = false;
      toggleBot.textContent = botOn(selected) ? "Apagar IA" : "Encender IA";
      manualText.disabled = false;
      sendManual.disabled = false;

      const res = await fetch("/api/mensajes?telefono=" + encodeURIComponent(telefono));
      const data = await res.json();
      const items = data.mensajes || [];
      messages.innerHTML = items.map(m => '<div class="msg ' + m.direccion + '">' + escapeHtml(m.mensaje) + '<small>' + m.direccion + ' | ' + new Date(m.created_at).toLocaleString() + '</small></div>').join("") || '<div class="empty">Sin mensajes guardados.</div>';
      messages.scrollTop = messages.scrollHeight;
    }

    function escapeHtml(value) {
      return String(value).replace(/[&<>"']/g, ch => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[ch]));
    }

    toggleBot.addEventListener("click", async () => {
      if (!selected) return;
      await fetch("/api/bot-enabled", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telefono: selected.telefono, bot_enabled: !botOn(selected) }),
      });
      await loadConversaciones();
    });

    document.getElementById("manualForm").addEventListener("submit", async (event) => {
      event.preventDefault();
      const mensaje = manualText.value.trim();
      if (!selected || !mensaje) return;
      sendManual.disabled = true;
      await fetch("/api/enviar-manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telefono: selected.telefono, mensaje }),
      });
      manualText.value = "";
      sendManual.disabled = false;
      await selectLead(selected.telefono);
    });

    document.getElementById("refresh").addEventListener("click", loadConversaciones);
    loadConversaciones();
  </script>
</body>
</html>`);
};
