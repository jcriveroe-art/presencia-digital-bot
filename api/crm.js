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
    :root { color-scheme: light; --line:#d8dee8; --ink:#17202a; --muted:#657386; --bg:#f6f8fb; --panel:#fff; --on:#137a4d; --off:#9b2c2c; --accent:#1358a8; --hot:#8a4b00; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: Arial, Helvetica, sans-serif; background: var(--bg); color: var(--ink); }
    header { height: 56px; display: flex; align-items: center; justify-content: space-between; padding: 0 18px; border-bottom: 1px solid var(--line); background: var(--panel); }
    h1 { font-size: 18px; margin: 0; }
    h2 { font-size: 14px; margin: 0; }
    button, textarea, input, select { font: inherit; }
    button { border: 1px solid var(--line); background: #fff; color: var(--ink); border-radius: 6px; min-height: 34px; padding: 0 10px; cursor: pointer; }
    button.primary { background: var(--accent); border-color: var(--accent); color: #fff; }
    button.danger { color: var(--off); }
    button:disabled { cursor: not-allowed; opacity: .55; }
    .page { height: calc(100vh - 56px); display: grid; grid-template-rows: auto 1fr; min-height: 0; }
    .dashboard { padding: 12px 16px; display: grid; grid-template-columns: repeat(7, minmax(110px, 1fr)); gap: 10px; border-bottom: 1px solid var(--line); background: var(--panel); }
    .metric { border: 1px solid var(--line); border-radius: 8px; padding: 10px; min-height: 62px; background: #fff; }
    .metric strong { display: block; font-size: 22px; line-height: 1; }
    .metric span { display: block; color: var(--muted); font-size: 12px; margin-top: 6px; }
    main { min-height: 0; display: grid; grid-template-columns: minmax(520px, 58vw) 1fr; }
    .left { min-width: 0; display: grid; grid-template-rows: auto auto 1fr; border-right: 1px solid var(--line); background: var(--panel); }
    .import { padding: 12px 14px; border-bottom: 1px solid var(--line); display: grid; grid-template-columns: 1fr auto; gap: 10px; align-items: end; }
    .import textarea { width: 100%; min-height: 58px; resize: vertical; border: 1px solid var(--line); border-radius: 6px; padding: 8px; }
    .import-row { display: grid; gap: 8px; }
    .filters { padding: 10px 14px; border-bottom: 1px solid var(--line); display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)) auto; gap: 8px; align-items: end; }
    label { color: var(--muted); font-size: 11px; display: grid; gap: 4px; }
    select, input { border: 1px solid var(--line); border-radius: 6px; min-height: 34px; padding: 0 8px; background: #fff; min-width: 0; }
    .table-wrap { overflow: auto; min-height: 0; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { border-bottom: 1px solid var(--line); padding: 8px; text-align: left; vertical-align: top; }
    th { position: sticky; top: 0; background: #f3f6fa; z-index: 1; color: var(--muted); font-weight: 700; }
    tr { cursor: pointer; }
    tr.active { background: #edf4ff; }
    .badge { border-radius: 999px; padding: 4px 8px; font-size: 12px; border: 1px solid var(--line); display: inline-flex; align-items: center; min-height: 24px; }
    .badge.on { color: var(--on); }
    .badge.off { color: var(--off); }
    .badge.hot { color: var(--hot); }
    .detail { min-width: 0; min-height: 0; display: grid; grid-template-rows: auto auto auto 1fr auto; background: var(--bg); }
    .detail-head { display: flex; gap: 10px; align-items: center; justify-content: space-between; padding: 14px 16px; border-bottom: 1px solid var(--line); background: var(--panel); }
    .identity { min-width: 0; }
    .identity strong { display: block; font-size: 16px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .identity span { color: var(--muted); font-size: 12px; }
    .actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; justify-content: flex-end; padding: 10px 16px; border-bottom: 1px solid var(--line); background: var(--panel); }
    .context { background: var(--panel); border-bottom: 1px solid var(--line); padding: 12px 16px; display: grid; gap: 10px; max-height: 250px; overflow: auto; }
    .context-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px 14px; font-size: 12px; }
    .context-grid strong { display: block; color: var(--muted); font-size: 11px; }
    .fugas { white-space: pre-wrap; overflow-wrap: anywhere; font-size: 12px; line-height: 1.38; }
    .notes { white-space: pre-wrap; overflow-wrap: anywhere; font-size: 12px; line-height: 1.38; padding: 10px; border: 1px solid var(--line); border-radius: 8px; background: #fbfcfe; }
    .messages { min-height: 0; overflow: auto; padding: 16px; display: flex; flex-direction: column; gap: 10px; }
    .msg { max-width: min(680px, 84%); padding: 10px 12px; border: 1px solid var(--line); border-radius: 8px; background: var(--panel); line-height: 1.38; white-space: pre-wrap; overflow-wrap: anywhere; }
    .msg.saliente { align-self: flex-end; background: #edf7f1; }
    .msg small { display: block; margin-top: 6px; color: var(--muted); font-size: 11px; }
    form { display: grid; grid-template-columns: 1fr auto; gap: 10px; padding: 12px 16px; border-top: 1px solid var(--line); background: var(--panel); }
    form textarea { width: 100%; min-height: 54px; max-height: 140px; resize: vertical; border: 1px solid var(--line); border-radius: 6px; padding: 10px; }
    .empty { padding: 18px; color: var(--muted); }
    .modal { position: fixed; inset: 0; display: none; align-items: center; justify-content: center; background: rgba(17, 24, 39, .42); z-index: 20; padding: 18px; }
    .modal.open { display: flex; }
    .modal-panel { width: min(920px, 100%); max-height: min(86vh, 820px); display: grid; grid-template-rows: auto 1fr auto; background: #fff; border: 1px solid var(--line); border-radius: 8px; box-shadow: 0 18px 42px rgba(17, 24, 39, .22); }
    .modal-head, .modal-actions { padding: 12px 14px; display: flex; align-items: center; justify-content: space-between; gap: 10px; border-bottom: 1px solid var(--line); }
    .modal-actions { border-top: 1px solid var(--line); border-bottom: 0; justify-content: flex-end; }
    .edit-grid { overflow: auto; padding: 14px; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
    .edit-grid label.wide { grid-column: span 3; }
    .edit-grid textarea { width: 100%; min-height: 76px; resize: vertical; border: 1px solid var(--line); border-radius: 6px; padding: 8px; }
    .edit-status { margin-right: auto; color: var(--muted); font-size: 12px; }
    @media (max-width: 1050px) { .dashboard { grid-template-columns: repeat(2, 1fr); } main { grid-template-columns: 1fr; grid-template-rows: 48vh 1fr; } .left { border-right: 0; border-bottom: 1px solid var(--line); } }
    @media (max-width: 760px) { .edit-grid { grid-template-columns: 1fr; } .edit-grid label.wide { grid-column: span 1; } }
  </style>
</head>
<body>
  <header>
    <h1>CRM ON</h1>
    <button id="refresh">Actualizar</button>
  </header>
  <div class="page">
    <div id="dashboard" class="dashboard"></div>
    <main>
      <section class="left">
        <div class="import">
          <div class="import-row">
            <h2>Importar Prospector ON</h2>
            <input id="fileInput" type="file" accept=".csv,.tsv,text/csv,text/tab-separated-values" />
            <textarea id="importText" placeholder="Pega filas CSV o TSV de Prospector ON"></textarea>
          </div>
          <div class="import-row"><button class="primary" id="importBtn">Importar</button><span id="importStatus" class="badge">Listo</span></div>
        </div>
        <div class="filters">
          <label>Estado<select id="filterEstado"><option value="">Todos</option></select></label>
          <label>Prioridad<select id="filterPrioridad"><option value="">Todas</option></select></label>
          <label>Categoria<select id="filterCategoria"><option value="">Todas</option></select></label>
          <label>Caliente<select id="filterCaliente"><option value="">Todos</option><option value="true">Si</option><option value="false">No</option></select></label>
          <button id="clearFilters">Limpiar</button>
        </div>
        <div class="table-wrap"><table><thead><tr><th>Nombre</th><th>Categoria</th><th>Prioridad</th><th>Score</th><th>Total fugas</th><th>Telefono</th><th>Estado</th><th>IA</th><th>Ultima actividad</th></tr></thead><tbody id="leads"></tbody></table></div>
      </section>
      <section class="detail">
        <div class="detail-head">
          <div class="identity"><strong id="title">Selecciona un lead</strong><span id="subtitle"></span></div>
          <div><span id="botBadge" class="badge">IA</span> <span id="hotBadge" class="badge">Lead</span></div>
        </div>
        <div class="actions">
          <button id="initialBtn" disabled>Enviar mensaje inicial</button>
          <button id="editBtn" disabled>Editar prospecto</button>
          <button id="pauseBtn" disabled>Pausar IA</button>
          <button id="resumeBtn" disabled>Reanudar IA</button>
          <button id="interestedBtn" disabled>Marcar interesado</button>
          <button id="paidBtn" disabled>Marcar diagnostico pagado</button>
          <button class="danger" id="lostBtn" disabled>Marcar perdido</button>
        </div>
        <div id="context" class="context"><div class="empty">Sin lead seleccionado.</div></div>
        <div id="messages" class="messages"><div class="empty">Sin conversacion seleccionada.</div></div>
        <form id="manualForm">
          <textarea id="manualText" placeholder="Responder por WhatsApp" disabled></textarea>
          <button class="primary" id="sendManual" disabled>Enviar</button>
        </form>
      </section>
    </main>
  </div>
  <div id="editModal" class="modal" aria-hidden="true">
    <div class="modal-panel" role="dialog" aria-modal="true" aria-labelledby="editTitle">
      <div class="modal-head">
        <h2 id="editTitle">Editar prospecto</h2>
        <button id="closeEdit" type="button">Cerrar</button>
      </div>
      <div id="editForm" class="edit-grid"></div>
      <div class="modal-actions">
        <span id="editStatus" class="edit-status"></span>
        <button id="cancelEdit" type="button">Cancelar</button>
        <button id="saveEdit" class="primary" type="button">Guardar cambios</button>
      </div>
    </div>
  </div>
  <script>
    let conversaciones = [];
    let filtered = [];
    let selected = null;
    const estadosBase = ["prospectado","contactado","interesado","cliente_caliente","diagnostico_pagado","diagnostico_entregado","seguimiento","perdido","nuevo","mini_diagnostico"];
    const leads = document.getElementById("leads");
    const dashboard = document.getElementById("dashboard");
    const messages = document.getElementById("messages");
    const title = document.getElementById("title");
    const subtitle = document.getElementById("subtitle");
    const botBadge = document.getElementById("botBadge");
    const hotBadge = document.getElementById("hotBadge");
    const context = document.getElementById("context");
    const importText = document.getElementById("importText");
    const importStatus = document.getElementById("importStatus");
    const manualText = document.getElementById("manualText");
    const sendManual = document.getElementById("sendManual");
    const actionIds = ["initialBtn","editBtn","pauseBtn","resumeBtn","interestedBtn","paidBtn","lostBtn"];
    const editModal = document.getElementById("editModal");
    const editForm = document.getElementById("editForm");
    const editStatus = document.getElementById("editStatus");
    const editableFields = [
      ["nombre", "Nombre", "input"],
      ["categoria", "Categoria", "input"],
      ["prioridad", "Prioridad", "input"],
      ["score", "Score", "input"],
      ["total_fugas", "Total fugas", "input"],
      ["rating", "Rating", "input"],
      ["resenas", "Resenas", "input"],
      ["fotos_estimadas", "Fotos estimadas", "input"],
      ["diagnostico_fotos", "Diagnostico fotos", "textarea"],
      ["ultima_resena", "Ultima resena", "input"],
      ["responde_resenas", "Responde resenas", "input"],
      ["publicaciones", "Publicaciones", "input"],
      ["website", "Website", "input"],
      ["horarios", "Horarios", "input"],
      ["telefono", "Telefono", "input"],
      ["whatsapp_link", "WhatsApp link", "input"],
      ["direccion", "Direccion", "textarea"],
      ["maps_url", "Maps URL", "input"],
      ["estado", "Estado", "input"],
      ["caliente", "Caliente", "selectBoolean"],
      ["bot_enabled", "IA activa", "selectBoolean"],
      ["descripcion", "Descripcion", "textarea"],
      ["fugas_detectadas", "Fugas detectadas", "textarea"],
      ["notas", "Notas internas", "textarea"],
    ];

    function botOn(c) { return c && c.bot_enabled !== false; }
    function label(c) { return c.nombre || c.negocio || c.telefono; }
    function escapeHtml(value) { return String(value ?? "").replace(/[&<>"']/g, ch => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[ch])); }
    function fmtDate(value) { return value ? new Date(value).toLocaleString() : "sin datos"; }
    function uniqueValues(key) { return [...new Set(conversaciones.map(c => c[key]).filter(Boolean))].sort(); }

    async function loadConversaciones() {
      const res = await fetch("/api/conversaciones");
      const data = await res.json();
      conversaciones = data.conversaciones || [];
      fillFilters();
      applyFilters();
      renderDashboard();
      if (selected) {
        selected = conversaciones.find(c => c.telefono === selected.telefono) || null;
        if (selected) await selectLead(selected.telefono);
      }
    }

    function metric(label, value) { return '<div class="metric"><strong>' + value + '</strong><span>' + label + '</span></div>'; }
    function renderDashboard() {
      const count = (fn) => conversaciones.filter(fn).length;
      dashboard.innerHTML = [
        metric("Total leads", conversaciones.length),
        metric("Prospectados", count(c => (c.estado || "") === "prospectado")),
        metric("Contactados", count(c => (c.estado || "") === "contactado")),
        metric("Interesados", count(c => (c.estado || "") === "interesado")),
        metric("Clientes calientes", count(c => c.caliente === true || c.estado === "cliente_caliente")),
        metric("Diagnostico pagado", count(c => (c.estado || "") === "diagnostico_pagado")),
        metric("Perdidos", count(c => (c.estado || "") === "perdido")),
      ].join("");
    }

    function fillSelect(id, values, firstLabel) {
      const select = document.getElementById(id);
      const current = select.value;
      select.innerHTML = '<option value="">' + firstLabel + '</option>' + values.map(v => '<option value="' + escapeHtml(v) + '">' + escapeHtml(v) + '</option>').join("");
      select.value = current;
    }

    function fillFilters() {
      fillSelect("filterEstado", [...new Set([...estadosBase, ...uniqueValues("estado")])].filter(Boolean), "Todos");
      fillSelect("filterPrioridad", uniqueValues("prioridad"), "Todas");
      fillSelect("filterCategoria", uniqueValues("categoria"), "Todas");
    }

    function applyFilters() {
      const estado = document.getElementById("filterEstado").value;
      const prioridad = document.getElementById("filterPrioridad").value;
      const categoria = document.getElementById("filterCategoria").value;
      const caliente = document.getElementById("filterCaliente").value;
      filtered = conversaciones.filter(c => {
        if (estado && (c.estado || "") !== estado) return false;
        if (prioridad && (c.prioridad || "") !== prioridad) return false;
        if (categoria && (c.categoria || "") !== categoria) return false;
        if (caliente && String(c.caliente === true) !== caliente) return false;
        return true;
      });
      renderLeads();
    }

    function renderLeads() {
      leads.innerHTML = filtered.map(c => '<tr class="' + (selected?.telefono === c.telefono ? 'active' : '') + '" data-tel="' + escapeHtml(c.telefono) + '"><td>' + escapeHtml(label(c)) + '</td><td>' + escapeHtml(c.categoria || '') + '</td><td>' + escapeHtml(c.prioridad || '') + '</td><td>' + escapeHtml(c.score || '') + '</td><td>' + escapeHtml(c.total_fugas || '') + '</td><td>' + escapeHtml(c.telefono) + '</td><td>' + escapeHtml(c.estado || 'nuevo') + '</td><td>' + (botOn(c) ? '<span class="badge on">ON</span>' : '<span class="badge off">OFF</span>') + '</td><td>' + escapeHtml(fmtDate(c.fecha_ultimo_mensaje)) + '</td></tr>').join("") || '<tr><td colspan="9">Sin leads con esos filtros.</td></tr>';
      leads.querySelectorAll("tr[data-tel]").forEach(row => row.addEventListener("click", () => selectLead(row.dataset.tel)));
    }

    function renderContext(c) {
      if (!c) { context.innerHTML = '<div class="empty">Sin lead seleccionado.</div>'; return; }
      const negocio = [
        ["Nombre", label(c)], ["Categoria", c.categoria], ["Prioridad", c.prioridad], ["Score", c.score],
        ["Total fugas", c.total_fugas], ["Telefono", c.telefono], ["Estado", c.estado], ["Ultimo mensaje", c.ultimo_mensaje],
        ["Rating", c.rating], ["Resenas", c.resenas], ["Fotos estimadas", c.fotos_estimadas || c.fotos], ["Diagnostico fotos", c.diagnostico_fotos], ["Ultima resena", c.ultima_resena],
        ["Responde resenas", c.responde_resenas], ["Website", c.website], ["Horarios", c.horarios], ["Descripcion", c.descripcion],
        ["Direccion", c.direccion], ["Maps", c.maps_url ? '<a href="' + escapeHtml(c.maps_url) + '" target="_blank" rel="noreferrer">Abrir Maps</a>' : ""],
      ];
      context.innerHTML = '<h2>Datos del negocio</h2><div class="context-grid">' + negocio.map(([k, v]) => '<div><strong>' + k + '</strong><span>' + (v || 'sin datos') + '</span></div>').join("") + '</div><h2>Fugas detectadas</h2><div class="fugas">' + escapeHtml(c.fugas_detectadas || 'Sin fugas guardadas.') + '</div><h2>Notas internas</h2><div class="notes">' + escapeHtml(c.notas || 'Sin notas internas.') + '</div>';
    }

    function renderEditForm() {
      if (!selected) return;
      editForm.innerHTML = editableFields.map(([key, labelText, type]) => {
        const value = selected[key];
        const wide = type === "textarea" ? " wide" : "";
        if (type === "textarea") {
          return '<label class="' + wide.trim() + '">' + labelText + '<textarea data-field="' + key + '">' + escapeHtml(value || '') + '</textarea></label>';
        }
        if (type === "selectBoolean") {
          return '<label>' + labelText + '<select data-field="' + key + '"><option value="true"' + (value === true || (key === "bot_enabled" && value !== false) ? ' selected' : '') + '>Si</option><option value="false"' + (value === false ? ' selected' : '') + '>No</option></select></label>';
        }
        return '<label>' + labelText + '<input data-field="' + key + '" value="' + escapeHtml(value || '') + '" /></label>';
      }).join("");
    }

    function openEdit() {
      if (!selected) return;
      editStatus.textContent = "";
      renderEditForm();
      editModal.classList.add("open");
      editModal.setAttribute("aria-hidden", "false");
    }

    function closeEdit() {
      editModal.classList.remove("open");
      editModal.setAttribute("aria-hidden", "true");
    }

    function collectEditUpdates() {
      const updates = {};
      editForm.querySelectorAll("[data-field]").forEach(input => {
        const key = input.dataset.field;
        if (key === "caliente" || key === "bot_enabled") {
          updates[key] = input.value === "true";
        } else {
          updates[key] = input.value;
        }
      });
      return updates;
    }

    async function saveEdit() {
      if (!selected) return;
      const updates = collectEditUpdates();
      const telefono = String(updates.telefono || "").replace(/[+\\s\\-()]/g, "").trim();
      if (!telefono) {
        editStatus.textContent = "Telefono requerido.";
        return;
      }
      updates.telefono = telefono;
      editStatus.textContent = "Guardando";
      document.getElementById("saveEdit").disabled = true;
      const res = await fetch("/api/lead-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telefono_original: selected.telefono, updates })
      });
      const data = await res.json();
      document.getElementById("saveEdit").disabled = false;
      if (!res.ok || !data.ok) {
        editStatus.textContent = data.error || "No se pudo guardar.";
        return;
      }
      selected = data.conversacion;
      closeEdit();
      await loadConversaciones();
      await selectLead(selected.telefono);
    }

    async function selectLead(telefono) {
      selected = conversaciones.find(c => c.telefono === telefono) || { telefono };
      renderLeads();
      title.textContent = label(selected);
      subtitle.textContent = selected.telefono + " | " + (selected.estado || "nuevo") + " | " + fmtDate(selected.fecha_ultimo_mensaje);
      botBadge.textContent = botOn(selected) ? "IA ON" : "IA OFF";
      botBadge.className = "badge " + (botOn(selected) ? "on" : "off");
      hotBadge.textContent = selected.caliente ? "Caliente" : "Lead";
      hotBadge.className = "badge " + (selected.caliente ? "hot" : "");
      actionIds.forEach(id => document.getElementById(id).disabled = false);
      manualText.disabled = false;
      sendManual.disabled = false;
      renderContext(selected);
      const res = await fetch("/api/mensajes?telefono=" + encodeURIComponent(telefono));
      const data = await res.json();
      const items = data.mensajes || [];
      messages.innerHTML = items.map(m => '<div class="msg ' + m.direccion + '">' + escapeHtml(m.mensaje) + '<small>' + m.direccion + ' | ' + fmtDate(m.created_at) + '</small></div>').join("") || '<div class="empty">Sin mensajes guardados.</div>';
      messages.scrollTop = messages.scrollHeight;
    }

    async function setBot(value) {
      if (!selected) return;
      await fetch("/api/bot-enabled", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ telefono: selected.telefono, bot_enabled: value }) });
      await loadConversaciones();
    }

    async function setEstado(estado) {
      if (!selected) return;
      await fetch("/api/lead-estado", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ telefono: selected.telefono, estado }) });
      await loadConversaciones();
    }

    document.getElementById("fileInput").addEventListener("change", async (event) => {
      const file = event.target.files[0];
      if (file) importText.value = await file.text();
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

    document.getElementById("initialBtn").addEventListener("click", async () => {
      if (!selected) return;
      if (!selected.nombre || !String(selected.nombre).trim()) {
        alert("Agrega nombre antes de enviar mensaje inicial.");
        return;
      }
      const res = await fetch("/api/enviar-inicial", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ telefono: selected.telefono }) });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "No se pudo enviar el mensaje inicial.");
      }
      await loadConversaciones();
    });
    document.getElementById("editBtn").addEventListener("click", openEdit);
    document.getElementById("closeEdit").addEventListener("click", closeEdit);
    document.getElementById("cancelEdit").addEventListener("click", closeEdit);
    document.getElementById("saveEdit").addEventListener("click", saveEdit);
    document.getElementById("pauseBtn").addEventListener("click", () => setBot(false));
    document.getElementById("resumeBtn").addEventListener("click", () => setBot(true));
    document.getElementById("interestedBtn").addEventListener("click", () => setEstado("interesado"));
    document.getElementById("lostBtn").addEventListener("click", () => setEstado("perdido"));
    document.getElementById("paidBtn").addEventListener("click", () => setEstado("diagnostico_pagado"));
    document.getElementById("refresh").addEventListener("click", loadConversaciones);
    document.getElementById("clearFilters").addEventListener("click", () => {
      document.getElementById("filterEstado").value = "";
      document.getElementById("filterPrioridad").value = "";
      document.getElementById("filterCategoria").value = "";
      document.getElementById("filterCaliente").value = "";
      applyFilters();
    });
    ["filterEstado","filterPrioridad","filterCategoria","filterCaliente"].forEach(id => document.getElementById(id).addEventListener("change", applyFilters));

    document.getElementById("manualForm").addEventListener("submit", async (event) => {
      event.preventDefault();
      const mensaje = manualText.value.trim();
      if (!selected || !mensaje) return;
      sendManual.disabled = true;
      await fetch("/api/enviar-manual", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ telefono: selected.telefono, mensaje }) });
      manualText.value = "";
      sendManual.disabled = false;
      await loadConversaciones();
    });

    loadConversaciones();
  </script>
</body>
</html>`);
};
