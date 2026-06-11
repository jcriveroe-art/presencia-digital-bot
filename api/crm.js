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
    h1 { font-size: 18px; margin: 0; }
    button, textarea, input { font: inherit; }
    button { border: 1px solid var(--line); background: #fff; color: var(--ink); border-radius: 6px; min-height: 36px; padding: 0 12px; cursor: pointer; }
    button.primary { background: var(--accent); border-color: var(--accent); color: #fff; }
    main { display: grid; grid-template-columns: minmax(360px, 46vw) 1fr; height: calc(100vh - 56px); }
    aside { border-right: 1px solid var(--line); background: var(--panel); overflow: auto; display: grid; grid-template-rows: auto auto 1fr; min-width: 0; }
    .import { padding: 14px; border-bottom: 1px solid var(--line); display: grid; gap: 10px; }
    .import h2 { font-size: 14px; margin: 0; }
    .import textarea { width: 100%; min-height: 86px; resize: vertical; border: 1px solid var(--line); border-radius: 6px; padding: 8px; }
    .import-actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
    .table-wrap { overflow: auto; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { border-bottom: 1px solid var(--line); padding: 8px; text-align: left; vertical-align: top; }
    th { position: sticky; top: 0; background: #f3f6fa; z-index: 1; color: var(--muted); font-weight: 700; }
    tr { cursor: pointer; }
    tr.active { background: #edf4ff; }
    .toolbar { padding: 10px 14px; border-bottom: 1px solid var(--line); display: flex; justify-content: space-between; gap: 8px; align-items: center; }
    section { display: grid; grid-template-rows: auto auto 1fr auto; min-width: 0; }
    .detail-head { display: flex; gap: 10px; align-items: center; justify-content: space-between; padding: 14px 16px; border-bottom: 1px solid var(--line); background: var(--panel); }
    .identity { min-width: 0; }
    .identity strong { display: block; font-size: 16px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .identity span { color: var(--muted); font-size: 12px; }
    .actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; justify-content: flex-end; }
    .badge { border-radius: 999px; padding: 5px 9px; font-size: 12px; border: 1px solid var(--line); }
    .badge.on { color: var(--on); }
    .badge.off { color: var(--off); }
    .lead-context { background: var(--panel); border-bottom: 1px solid var(--line); padding: 12px 16px; display: grid; gap: 8px; max-height: 210px; overflow: auto; }
    .context-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px 14px; font-size: 12px; }
    .context-grid strong { display: block; color: var(--muted); font-size: 11px; }
    .fugas { white-space: pre-wrap; overflow-wrap: anywhere; font-size: 12px; line-height: 1.38; }
    .messages { overflow: auto; padding: 18px; display: flex; flex-direction: column; gap: 10px; }
    .msg { max-width: min(680px, 82%); padding: 10px 12px; border: 1px solid var(--line); border-radius: 8px; background: var(--panel); line-height: 1.38; white-space: pre-wrap; overflow-wrap: anywhere; }
    .msg.saliente { align-self: flex-end; background: #edf7f1; }
    .msg small { display: block; margin-top: 6px; color: var(--muted); font-size: 11px; }
    form { display: grid; grid-template-columns: 1fr auto; gap: 10px; padding: 14px 16px; border-top: 1px solid var(--line); background: var(--panel); }
    form textarea { width: 100%; min-height: 58px; max-height: 150px; resize: vertical; border: 1px solid var(--line); border-radius: 6px; padding: 10px; }
    .empty { padding: 24px; color: var(--muted); }
    @media (max-width: 900px) { main { grid-template-columns: 1fr; grid-template-rows: 48vh 1fr; } aside { border-right: 0; border-bottom: 1px solid var(--line); } }
  </style>
</head>
<body>
  <header>
    <h1>CRM ON</h1>
    <button id="refresh">Actualizar</button>
  </header>
  <main>
    <aside>
      <div class="import">
        <h2>Importar Prospector ON</h2>
        <input id="fileInput" type="file" accept=".csv,.tsv,text/csv,text/tab-separated-values" />
        <textarea id="importText" placeholder="Pega filas CSV o TSV de Prospector ON"></textarea>
        <div class="import-actions"><button class="primary" id="importBtn">Importar</button><span id="importStatus" class="badge">Listo</span></div>
      </div>
      <div class="toolbar"><strong>Leads</strong><span id="count" class="badge">0</span></div>
      <div class="table-wrap"><table><thead><tr><th>Nombre</th><th>Categoria</th><th>Prioridad</th><th>Score</th><th>Total Fugas</th><th>Telefono</th><th>Estado</th></tr></thead><tbody id="leads"></tbody></table></div>
    </aside>
    <section>
      <div class="detail-head">
        <div class="identity"><strong id="title">Selecciona un lead</strong><span id="subtitle"></span></div>
        <div class="actions"><span id="botBadge" class="badge">IA</span><button id="initialBtn" disabled>Enviar mensaje inicial</button><button id="toggleBot" disabled>IA ON/OFF</button></div>
      </div>
      <div id="context" class="lead-context"><div class="empty">Sin lead seleccionado.</div></div>
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
    const initialBtn = document.getElementById("initialBtn");
    const manualText = document.getElementById("manualText");
    const sendManual = document.getElementById("sendManual");
    const context = document.getElementById("context");
    const importText = document.getElementById("importText");
    const importStatus = document.getElementById("importStatus");

    function botOn(c) { return c && c.bot_enabled !== false; }
    function label(c) { return c.nombre || c.negocio || c.telefono; }
    function escapeHtml(value) { return String(value ?? "").replace(/[&<>"']/g, ch => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[ch])); }

    async function loadConversaciones() {
      const res = await fetch("/api/conversaciones");
      const data = await res.json();
      conversaciones = data.conversaciones || [];
      document.getElementById("count").textContent = conversaciones.length;
      renderLeads();
      if (selected) {
        selected = conversaciones.find(c => c.telefono === selected.telefono) || selected;
        await selectLead(selected.telefono);
      }
    }

    function renderLeads() {
      leads.innerHTML = conversaciones.map(c => '<tr class="' + (selected?.telefono === c.telefono ? 'active' : '') + '" data-tel="' + c.telefono + '"><td>' + escapeHtml(label(c)) + '</td><td>' + escapeHtml(c.categoria || '') + '</td><td>' + escapeHtml(c.prioridad || '') + '</td><td>' + escapeHtml(c.score || '') + '</td><td>' + escapeHtml(c.total_fugas || '') + '</td><td>' + escapeHtml(c.telefono) + '</td><td>' + escapeHtml(c.estado || 'nuevo') + '</td></tr>').join("") || '<tr><td colspan="7">Sin conversaciones.</td></tr>';
      leads.querySelectorAll("tr[data-tel]").forEach(row => row.addEventListener("click", () => selectLead(row.dataset.tel)));
    }

    function renderContext(c) {
      if (!c) { context.innerHTML = '<div class="empty">Sin lead seleccionado.</div>'; return; }
      const fields = [
        ["Rating", c.rating], ["Reseñas", c.resenas], ["Fotos", c.fotos], ["Ultima reseña", c.ultima_resena],
        ["Responde reseñas", c.responde_resenas], ["Website", c.website], ["Horarios", c.horarios], ["Descripcion", c.descripcion],
        ["Direccion", c.direccion], ["Maps", c.maps_url ? '<a href="' + escapeHtml(c.maps_url) + '" target="_blank" rel="noreferrer">Abrir Maps</a>' : ""],
      ];
      context.innerHTML = '<div><strong>Fugas detectadas</strong><div class="fugas">' + escapeHtml(c.fugas_detectadas || 'Sin fugas guardadas.') + '</div></div><div class="context-grid">' + fields.map(([k, v]) => '<div><strong>' + k + '</strong><span>' + (v || 'sin datos') + '</span></div>').join("") + '</div>';
    }

    async function selectLead(telefono) {
      selected = conversaciones.find(c => c.telefono === telefono) || { telefono };
      renderLeads();
      title.textContent = label(selected);
      subtitle.textContent = selected.telefono + " | " + (selected.estado || "nuevo");
      botBadge.textContent = botOn(selected) ? "IA ON" : "IA OFF";
      botBadge.className = "badge " + (botOn(selected) ? "on" : "off");
      toggleBot.disabled = false;
      initialBtn.disabled = false;
      manualText.disabled = false;
      sendManual.disabled = false;
      renderContext(selected);
      const res = await fetch("/api/mensajes?telefono=" + encodeURIComponent(telefono));
      const data = await res.json();
      const items = data.mensajes || [];
      messages.innerHTML = items.map(m => '<div class="msg ' + m.direccion + '">' + escapeHtml(m.mensaje) + '<small>' + m.direccion + ' | ' + new Date(m.created_at).toLocaleString() + '</small></div>').join("") || '<div class="empty">Sin mensajes guardados.</div>';
      messages.scrollTop = messages.scrollHeight;
    }

    document.getElementById("fileInput").addEventListener("change", async (event) => {
      const file = event.target.files[0];
      if (!file) return;
      importText.value = await file.text();
    });

    document.getElementById("importBtn").addEventListener("click", async () => {
      const contenido = importText.value.trim();
      if (!contenido) return;
      importStatus.textContent = "Importando";
      const res = await fetch("/api/importar-prospector", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contenido }) });
      const data = await res.json();
      importStatus.textContent = res.ok ? "Importados: " + data.importados : "Error";
      if (res.ok) { importText.value = ""; await loadConversaciones(); }
    });

    toggleBot.addEventListener("click", async () => {
      if (!selected) return;
      await fetch("/api/bot-enabled", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ telefono: selected.telefono, bot_enabled: !botOn(selected) }) });
      await loadConversaciones();
    });

    initialBtn.addEventListener("click", async () => {
      if (!selected) return;
      initialBtn.disabled = true;
      await fetch("/api/enviar-inicial", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ telefono: selected.telefono }) });
      initialBtn.disabled = false;
      await loadConversaciones();
    });

    document.getElementById("manualForm").addEventListener("submit", async (event) => {
      event.preventDefault();
      const mensaje = manualText.value.trim();
      if (!selected || !mensaje) return;
      sendManual.disabled = true;
      await fetch("/api/enviar-manual", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ telefono: selected.telefono, mensaje }) });
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
