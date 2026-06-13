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
    header { height: 56px; display: grid; grid-template-columns: auto 1fr auto; gap: 14px; align-items: center; padding: 0 18px; border-bottom: 1px solid var(--line); background: var(--panel); }
    h1 { font-size: 18px; margin: 0; }
    h2 { font-size: 14px; margin: 0; }
    button, textarea, input, select { font: inherit; }
    button { border: 1px solid var(--line); background: #fff; color: var(--ink); border-radius: 6px; min-height: 34px; padding: 0 10px; cursor: pointer; }
    button.primary { background: var(--accent); border-color: var(--accent); color: #fff; }
    button.danger { color: var(--off); }
    button:disabled { cursor: not-allowed; opacity: .55; }
    .top-nav { display: flex; gap: 6px; align-items: center; justify-content: center; }
    .top-nav button { min-height: 32px; }
    .top-nav button.active { background: var(--ink); border-color: var(--ink); color: #fff; }
    .page { height: calc(100vh - 56px); display: grid; grid-template-rows: auto auto auto 1fr; min-height: 0; }
    .dashboard { padding: 12px 16px; display: grid; grid-template-columns: repeat(7, minmax(110px, 1fr)); gap: 10px; border-bottom: 1px solid var(--line); background: var(--panel); }
    #reports { display: none; overflow: auto; }
    .metric { border: 1px solid var(--line); border-radius: 8px; padding: 10px; min-height: 62px; background: #fff; }
    .metric.clickable { cursor: pointer; transition: border-color .15s ease, background .15s ease; }
    .metric.clickable:hover { border-color: var(--accent); background: #f7fbff; }
    .metric strong { display: block; font-size: 22px; line-height: 1; }
    .metric span { display: block; color: var(--muted); font-size: 12px; margin-top: 6px; }
    .dashboard-panel { grid-column: 1 / -1; display: grid; gap: 12px; padding: 0 16px 16px; background: var(--panel); border-bottom: 1px solid var(--line); }
    .dashboard-section { display: grid; gap: 8px; }
    .funnel { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 8px; }
    .funnel-step, .activity-item, .objection-item { border: 1px solid var(--line); border-radius: 8px; background: #fff; padding: 10px; font-size: 12px; }
    .funnel-step strong { display: block; font-size: 18px; }
    .bar { height: 6px; background: #e8edf5; border-radius: 999px; overflow: hidden; margin-top: 8px; }
    .bar span { display: block; height: 100%; background: var(--accent); }
    .activity-list, .objection-list { display: grid; gap: 8px; }
    main { min-height: 0; display: grid; grid-template-columns: minmax(520px, 58vw) 1fr; }
    .left { min-width: 0; display: grid; grid-template-rows: auto auto 1fr; border-right: 1px solid var(--line); background: var(--panel); }
    .import { padding: 12px 14px; border-bottom: 1px solid var(--line); display: grid; grid-template-columns: 1fr auto; gap: 10px; align-items: end; }
    .import textarea { width: 100%; min-height: 58px; resize: vertical; border: 1px solid var(--line); border-radius: 6px; padding: 8px; }
    .import-row { display: grid; gap: 8px; }
    .filters { padding: 10px 14px; border-bottom: 1px solid var(--line); display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)) auto; gap: 8px; align-items: end; }
    .attention { padding: 10px 16px; border-bottom: 1px solid var(--line); background: #fff8eb; display: grid; gap: 8px; }
    .attention-list { display: flex; gap: 8px; overflow: auto; padding-bottom: 2px; }
    .attention button { white-space: nowrap; background: #fff; }
    .chat-dashboard { display: none; padding: 10px 14px; gap: 10px; border-bottom: 1px solid var(--line); background: var(--panel); }
    .chat-dashboard .metric { min-height: 54px; }
    label { color: var(--muted); font-size: 11px; display: grid; gap: 4px; }
    select, input { border: 1px solid var(--line); border-radius: 6px; min-height: 34px; padding: 0 8px; background: #fff; min-width: 0; }
    .table-wrap { overflow: auto; min-height: 0; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { border-bottom: 1px solid var(--line); padding: 8px; text-align: left; vertical-align: top; }
    th { position: sticky; top: 0; background: #f3f6fa; z-index: 1; color: var(--muted); font-weight: 700; }
    tr { cursor: pointer; }
    tr.active { background: #edf4ff; }
    .lead-actions { display: flex; flex-wrap: wrap; gap: 6px; }
    .lead-actions button { min-height: 30px; padding: 0 8px; }
    .badge { border-radius: 999px; padding: 4px 8px; font-size: 12px; border: 1px solid var(--line); display: inline-flex; align-items: center; min-height: 24px; }
    .badge.on { color: var(--on); }
    .badge.off { color: var(--off); }
    .badge.hot { color: var(--hot); }
    .badge.new { color: #0f4f9f; border-color: #9cc3ff; background: #edf5ff; }
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
    .ops { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
    .ops label.wide { grid-column: span 2; }
    .ops textarea { width: 100%; min-height: 58px; resize: vertical; border: 1px solid var(--line); border-radius: 6px; padding: 8px; }
    .timeline { display: grid; gap: 8px; }
    .event { border-left: 3px solid var(--accent); padding-left: 8px; font-size: 12px; }
    .event small { color: var(--muted); display: block; margin-top: 2px; }
    .mobile-only { display: none; }
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
    .page.view-chat { grid-template-rows: auto 1fr; }
    .page.view-chat .dashboard, .page.view-chat .attention { display: none; }
    .page.view-chat .chat-dashboard { display: grid; grid-template-columns: repeat(3, minmax(120px, 1fr)); }
    .page.view-chat main { grid-template-columns: minmax(280px, 340px) minmax(0, 1fr); }
    .page.view-chat .left { grid-template-rows: auto 1fr; }
    .page.view-chat .left .import { display: none; }
    .page.view-chat .filters { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .page.view-chat .filters button { grid-column: span 2; }
    .page.view-chat .detail { display: grid; grid-template-columns: minmax(0, 1fr) minmax(300px, 360px); grid-template-rows: auto auto 1fr auto; min-width: 0; min-height: 0; }
    .page.view-chat .detail-head { grid-column: 2; grid-row: 1; }
    .page.view-chat .actions { grid-column: 2; grid-row: 2; justify-content: flex-start; }
    .page.view-chat .context { grid-column: 2; grid-row: 3 / 5; max-height: none; border-bottom: 0; border-left: 1px solid var(--line); }
    .page.view-chat .messages { grid-column: 1; grid-row: 1 / 4; }
    .page.view-chat form { grid-column: 1; grid-row: 4; position: sticky; bottom: 0; z-index: 2; }
    .page.view-leads .dashboard, .page.view-leads .attention, .page.view-leads .chat-dashboard { display: none; }
    .page.view-leads main { grid-template-columns: minmax(520px, 56vw) minmax(360px, 1fr); }
    .page.view-leads .detail { display: grid; }
    .page.view-dashboard main, .page.view-dashboard .chat-dashboard { display: none; }
    .page.view-dashboard .attention { display: none; }
    .page.view-reportes main, .page.view-reportes .dashboard, .page.view-reportes .attention, .page.view-reportes .chat-dashboard { display: none; }
    .page.view-reportes #reports { display: grid; grid-template-columns: 1fr; align-content: start; }
    .page.view-seguimiento .dashboard, .page.view-seguimiento .chat-dashboard { display: none; }
    @media (max-width: 1050px) { .dashboard { grid-template-columns: repeat(2, 1fr); } main { grid-template-columns: 1fr; grid-template-rows: 44vh 1fr; } .left { border-right: 0; border-bottom: 1px solid var(--line); } .page.view-chat main { grid-template-columns: 1fr; grid-template-rows: 40vh 1fr; } .page.view-chat .detail { grid-template-columns: 1fr; grid-template-rows: auto 1fr auto auto auto; } .page.view-chat .detail-head, .page.view-chat .actions, .page.view-chat .context, .page.view-chat .messages, .page.view-chat form { grid-column: 1; } .page.view-chat .detail-head { grid-row: 1; } .page.view-chat .messages { grid-row: 2; } .page.view-chat form { grid-row: 3; } .page.view-chat .actions { grid-row: 4; } .page.view-chat .context { grid-row: 5; border-left: 0; max-height: 320px; } }
    @media (max-width: 768px) {
      html, body { width: 100%; max-width: 100%; overflow: hidden; }
      header { height: 52px; grid-template-columns: auto minmax(0, 1fr) auto; padding: 0 10px; gap: 8px; }
      h1 { font-size: 15px; white-space: nowrap; }
      .top-nav { justify-content: flex-start; overflow-x: auto; padding-bottom: 2px; }
      .top-nav { scrollbar-width: none; }
      .top-nav::-webkit-scrollbar { display: none; }
      header > #refresh { justify-self: end; min-width: 84px; }
      .page { height: calc(100vh - 52px); overflow: hidden; }
      .chat-dashboard { grid-template-columns: 1fr !important; }
      .dashboard { grid-template-columns: 1fr; overflow: auto; }
      .dashboard-panel { overflow: auto; padding: 12px; }
      .funnel { grid-template-columns: 1fr; }
      main, .page.view-chat main, .page.view-leads main { grid-template-columns: 1fr; grid-template-rows: 1fr; overflow: hidden; }
      .left { border-right: 0; min-height: 0; }
      .filters { grid-template-columns: 1fr 1fr; }
      .import { grid-template-columns: 1fr; }
      .import textarea { min-height: 90px; }
      .import button { min-height: 42px; }
      .table-wrap { overflow: auto; }
      table, thead, tbody, tr, td { display: block; width: 100%; }
      thead { display: none; }
      tr { border-bottom: 1px solid var(--line); padding: 10px; }
      td { border-bottom: 0; padding: 2px 0; }
      .page.view-chat .detail { display: none; }
      .page.view-chat.mobile-chat-open .left { display: none; }
      .page.view-chat.mobile-chat-open .detail { display: grid; grid-template-columns: minmax(0, 1fr); grid-template-rows: auto minmax(0, 1fr) auto auto; min-width: 0; min-height: 0; overflow: hidden; }
      .page.view-chat.mobile-chat-open .detail-head { grid-row: 1; grid-column: 1; }
      .page.view-chat.mobile-chat-open .messages { grid-row: 2; grid-column: 1; }
      .page.view-chat.mobile-chat-open form { grid-row: 3; grid-column: 1; position: sticky; bottom: 0; grid-template-columns: 1fr 78px; padding: 10px; }
      .page.view-chat.mobile-chat-open .actions { grid-row: 4; grid-column: 1; justify-content: flex-start; max-height: 112px; overflow-y: auto; overflow-x: hidden; }
      .page.view-chat.mobile-chat-open .actions button { flex: 1 1 calc(50% - 8px); min-width: 0; white-space: normal; }
      .page.view-chat.mobile-chat-open .context { display: none; grid-row: 5; grid-column: 1; max-height: 46vh; overflow: auto; border-left: 0; }
      .page.view-chat.mobile-chat-open.show-mobile-context .context { display: grid; }
      .mobile-only { display: inline-flex; }
      .messages { padding: 10px; min-width: 0; overflow-x: hidden; }
      .msg { max-width: 94%; box-sizing: border-box; }
      .msg.saliente { max-width: 88%; }
      .detail-head { padding: 10px; min-width: 0; flex-wrap: wrap; }
      .detail-head .identity { min-width: 0; flex: 1 1 150px; }
      .actions { padding: 8px 10px; }
      .context-grid, .ops { grid-template-columns: 1fr; }
      .ops label.wide { grid-column: span 1; }
      .edit-grid { grid-template-columns: 1fr; }
      .edit-grid label.wide { grid-column: span 1; }
    }
  </style>
</head>
<body>
  <header>
    <h1>CRM ON</h1>
    <nav class="top-nav" aria-label="Navegacion principal">
      <button class="nav-btn active" data-view="chat">Chat</button>
      <button class="nav-btn" data-view="seguimiento">Seguimiento</button>
      <button class="nav-btn" data-view="leads">Leads</button>
      <button class="nav-btn" data-view="dashboard">Dashboard</button>
      <button class="nav-btn" data-view="reportes">Reportes</button>
    </nav>
    <button id="refresh">Actualizar</button>
  </header>
  <div id="page" class="page view-chat">
    <div id="dashboard" class="dashboard"></div>
    <div id="attention" class="attention"></div>
    <div id="chatDashboard" class="chat-dashboard"></div>
    <div id="reports" class="dashboard"></div>
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
          <label>Buscar<input id="filterTexto" placeholder="Nombre, telefono, zona" /></label>
          <label>Zona<select id="filterZona"><option value="">Todas las zonas</option><option value="__sin_zona__">Sin zona</option></select></label>
          <label>Fuente<select id="filterFuente"><option value="">Todas las fuentes</option><option value="__sin_fuente__">Sin fuente</option></select></label>
          <label>Estado comercial<select id="filterEstadoContacto"><option value="">Todos</option></select></label>
          <label>Caliente<select id="filterCaliente"><option value="">Todos</option><option value="true">Si</option><option value="false">No</option></select></label>
          <label>Vista<select id="filterOperativo"><option value="">Todos</option><option value="nuevo">Respondieron campaña</option><option value="requiere_intervencion">Requiere intervencion</option><option value="interesados">Interesados</option><option value="calientes">Calientes</option><option value="diagnostico_pagado">Diagnostico pagado</option><option value="hoy_vencidos">Hoy / Vencidos</option></select></label>
          <button id="clearFilters">Limpiar</button>
        </div>
        <div class="table-wrap"><table><thead><tr><th>Nombre</th><th>Telefono</th><th>Zona</th><th>Fuente</th><th>Estado comercial</th><th>Siguiente accion</th><th>Seguimiento</th><th>Producto</th><th>Monto</th><th>Pago</th><th>Acciones</th></tr></thead><tbody id="leads"></tbody></table></div>
      </section>
      <section class="detail">
        <div class="detail-head">
          <div class="identity"><strong id="title">Selecciona un lead</strong><span id="subtitle"></span></div>
          <button class="mobile-only" id="backToLeads" type="button">Volver a leads</button>
          <button class="mobile-only" id="toggleLeadData" type="button">Ver datos</button>
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
          <button class="danger" id="deleteBtn" disabled>Borrar lead</button>
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
    let currentView = "chat";
    let dashboardInfo = { eventos: [], objeciones: [] };
    const estadosBase = ["prospectado","contactado","interesado","cliente_caliente","diagnostico_pagado","diagnostico_entregado","seguimiento","perdido","nuevo","mini_diagnostico"];
    const estadosContacto = ["Pendiente de contactar","Contactado","Respondió","Pidió información","Interesado","Diagnóstico ofrecido","Diagnóstico vendido","Activación ofrecida","Activación vendida","Control ON ofrecido","Cliente recurrente","Seguimiento","No interesado","Descartado"];
    const productosInteres = ["Sin dato","Diagnóstico ON","Activación ON","Control ON","Otro"];
    const estadosPago = ["Sin pago","Pendiente","Anticipo","Pagado","Vencido","Cancelado"];
    const page = document.getElementById("page");
    const leads = document.getElementById("leads");
    const dashboard = document.getElementById("dashboard");
    const reports = document.getElementById("reports");
    const chatDashboard = document.getElementById("chatDashboard");
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
    const actionIds = ["initialBtn","editBtn","pauseBtn","resumeBtn","interestedBtn","paidBtn","lostBtn","deleteBtn"];
    const editModal = document.getElementById("editModal");
    const editForm = document.getElementById("editForm");
    const editStatus = document.getElementById("editStatus");
    const editableFields = [
      ["nombre", "Nombre", "input"],
      ["telefono", "Telefono", "input"],
      ["categoria", "Categoria", "input"],
      ["zona", "Zona", "input"],
      ["fuente_busqueda", "Fuente busqueda", "input"],
      ["estado_contacto", "Estado comercial", "input"],
      ["siguiente_accion", "Siguiente accion", "input"],
      ["fecha_siguiente_seguimiento", "Fecha siguiente seguimiento", "datetime"],
      ["ultimo_contacto", "Ultimo contacto", "datetime"],
      ["ultima_respuesta", "Ultima respuesta", "datetime"],
      ["intentos_contacto", "Intentos contacto", "input"],
      ["producto_interesado", "Producto interesado", "input"],
      ["monto_cotizado", "Monto cotizado", "input"],
      ["monto_pagado", "Monto pagado", "input"],
      ["estado_pago", "Estado pago", "input"],
      ["fecha_venta", "Fecha venta", "datetime"],
      ["estado", "Estado CRM", "input"],
      ["prioridad", "Prioridad", "input"],
      ["score", "Score", "input"],
      ["maps_url", "Maps URL", "input"],
      ["whatsapp_link", "WhatsApp link", "input"],
      ["fugas_detectadas", "Fugas detectadas", "textarea"],
      ["notas", "Notas internas", "textarea"],
      ["notas_internas", "Notas comerciales", "textarea"],
    ];
    let crmToken = localStorage.getItem("crmToken") || "";

    function headers(extra) {
      const base = Object.assign({}, extra || {});
      if (crmToken) base["x-crm-token"] = crmToken;
      return base;
    }

    async function apiFetch(url, options) {
      const opts = Object.assign({}, options || {});
      opts.headers = headers(opts.headers);
      const res = await fetch(url, opts);
      if (res.status !== 401) return res;
      crmToken = prompt("Token CRM") || "";
      localStorage.setItem("crmToken", crmToken);
      opts.headers = headers(options?.headers || {});
      return fetch(url, opts);
    }

    async function actionFetch(action, payload) {
      return apiFetch("/api/crm-actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.assign({ action }, payload || {})),
      });
    }

    function botOn(c) { return c && c.bot_enabled !== false; }
    function label(c) { return c.nombre || c.negocio || c.telefono; }
    function escapeHtml(value) { return String(value ?? "").replace(/[&<>"']/g, ch => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[ch])); }
    function fmtDate(value) { return value ? new Date(value).toLocaleString() : "sin datos"; }
    function uniqueValues(key) { return [...new Set(conversaciones.map(c => c[key]).filter(Boolean))].sort(); }
    function normalizeZona(value) {
      const zona = String(value ?? "").trim();
      return zona || "__sin_zona__";
    }
    function zonaLabel(value) {
      return normalizeZona(value) === "__sin_zona__" ? "Sin zona" : String(value).trim();
    }
    function zonasDetectadas() {
      return [...new Set(conversaciones.map(c => String(c.zona ?? "").trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b));
    }
    function normalizeFuente(value) {
      const fuente = String(value ?? "").trim();
      return fuente || "__sin_fuente__";
    }
    function fuenteLabel(value) {
      return normalizeFuente(value) === "__sin_fuente__" ? "Sin fuente" : String(value).trim();
    }
    function fuentesDetectadas() {
      return [...new Set(conversaciones.map(c => String(c.fuente_busqueda ?? "").trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b));
    }
    function safeDato(value) {
      const text = String(value ?? "").trim();
      return text || "Sin dato";
    }
    function money(value) {
      const n = Number(value || 0);
      return n ? n.toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }) : "$0";
    }
    function pct1(value, total) {
      return total > 0 ? ((value / total) * 100).toFixed(1) + "%" : "0%";
    }
    function todayStart() {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      return d;
    }
    function tomorrowStart() {
      const d = todayStart();
      d.setDate(d.getDate() + 1);
      return d;
    }
    function commercialState(c) {
      return String(c.estado_contacto || "").trim();
    }
    function isSold(c) {
      return ["Diagnóstico vendido","Activación vendida","Cliente recurrente"].includes(commercialState(c));
    }
    function isDiscarded(c) {
      return ["No interesado","Descartado"].includes(commercialState(c));
    }
    function isFollowupRelevant(c) {
      return ["Respondió","Pidió información","Interesado","Diagnóstico ofrecido","Activación ofrecida","Seguimiento"].includes(commercialState(c));
    }
    function isDueTodayOrOverdue(c) {
      if (!c.fecha_siguiente_seguimiento || isSold(c) || isDiscarded(c)) return false;
      const date = new Date(c.fecha_siguiente_seguimiento);
      return !Number.isNaN(date.getTime()) && date < tomorrowStart() && isFollowupRelevant(c);
    }
    function isOverdue(c) {
      if (!c.fecha_siguiente_seguimiento || isSold(c) || isDiscarded(c)) return false;
      const date = new Date(c.fecha_siguiente_seguimiento);
      return !Number.isNaN(date.getTime()) && date < todayStart();
    }
    function alertasLead(c) {
      const out = [];
      if (normalizeZona(c.zona) === "__sin_zona__") out.push("Sin zona");
      if (normalizeFuente(c.fuente_busqueda) === "__sin_fuente__") out.push("Sin fuente");
      if (!String(c.telefono || "").trim()) out.push("Sin telefono");
      if (!String(c.siguiente_accion || "").trim()) out.push("Sin siguiente accion");
      if (isOverdue(c)) out.push("Seguimiento vencido");
      if (commercialState(c) === "Contactado" && !c.ultima_respuesta) out.push("Contactado sin respuesta");
      if (commercialState(c) === "Interesado" && !c.fecha_siguiente_seguimiento) out.push("Interesado sin seguimiento");
      return out;
    }

    function setView(view) {
      currentView = view;
      page.classList.remove("mobile-chat-open", "show-mobile-context");
      page.className = "page view-" + view;
      document.querySelectorAll(".nav-btn").forEach(btn => btn.classList.toggle("active", btn.dataset.view === view));
      renderLeads();
      if (view === "seguimiento") renderAttention();
      if (view === "dashboard") renderDashboard();
      if (view === "reportes") renderReports();
    }

    function isMobile() {
      return window.matchMedia && window.matchMedia("(max-width: 768px)").matches;
    }

    function clearFilterValues() {
      document.getElementById("filterTexto").value = "";
      document.getElementById("filterEstado").value = "";
      document.getElementById("filterPrioridad").value = "";
      document.getElementById("filterCategoria").value = "";
      document.getElementById("filterZona").value = "";
      document.getElementById("filterFuente").value = "";
      document.getElementById("filterEstadoContacto").value = "";
      document.getElementById("filterCaliente").value = "";
      document.getElementById("filterOperativo").value = "";
    }

    async function loadConversaciones() {
      const res = await actionFetch("conversaciones");
      const data = await res.json();
      conversaciones = data.conversaciones || [];
      await loadDashboardData();
      fillFilters();
      applyFilters();
      renderDashboard();
      renderChatDashboard();
      renderAttention();
      if (currentView === "reportes") renderReports();
      if (selected) {
        selected = conversaciones.find(c => c.telefono === selected.telefono) || null;
        if (selected) await selectLead(selected.telefono);
      } else if (conversaciones.length > 0 && !isMobile()) {
        await selectLead(conversaciones.slice().sort(compareLeads)[0].telefono);
      }
    }

    async function loadDashboardData() {
      try {
        const res = await actionFetch("dashboard_data");
        const data = await res.json();
        if (data.ok) dashboardInfo = { eventos: data.eventos || [], objeciones: data.objeciones || [] };
      } catch (e) {
        dashboardInfo = { eventos: [], objeciones: [] };
      }
    }

    function metric(label, value, action) {
      const attr = action ? ' data-dash-action="' + action + '"' : "";
      const cls = action ? "metric clickable" : "metric";
      return '<div class="' + cls + '"' + attr + '><strong>' + value + '</strong><span>' + label + '</span></div>';
    }

    function renderDashboard() {
      const count = (fn) => conversaciones.filter(fn).length;
      const total = conversaciones.length;
      const prospectados = count(c => (c.estado || "") === "prospectado");
      const contactados = count(c => (c.estado || "") === "contactado");
      const interesados = count(c => (c.estado || "") === "interesado");
      const calientes = count(c => c.caliente === true || c.estado === "cliente_caliente");
      const pagados = count(c => (c.estado || "") === "diagnostico_pagado");
      const perdidos = count(c => (c.estado || "") === "perdido");
      const intervencion = count(c => (c.estado || "") === "requiere_intervencion");
      const nuevos = conversaciones.filter(hasNewMessage).length;
      dashboard.innerHTML = [
        metric("Total leads", total, "total"),
        metric("Prospectados", prospectados, "prospectados"),
        metric("Contactados", contactados, "contactados"),
        metric("Interesados", interesados, "interesados"),
        metric("Clientes calientes", calientes, "calientes"),
        metric("Diagnostico pagado", pagados, "diagnostico_pagado"),
        metric("Perdidos", perdidos, "perdidos"),
        metric("Requiere intervencion", intervencion, "requiere_intervencion"),
        metric("Respondieron campaña", nuevos, "mensajes_nuevos"),
      ].join("");
      dashboard.innerHTML += renderDashboardPanel({ total, contactados, interesados, pagados, calientes });
      dashboard.querySelectorAll("[data-dash-action]").forEach(card => card.addEventListener("click", () => applyDashboardAction(card.dataset.dashAction)));
    }

    function pct(a, b) { return b > 0 ? Math.round((a / b) * 100) : 0; }

    function renderFunnelStep(label, value, previous) {
      const conversion = previous === null ? 100 : pct(value, previous);
      return '<div class="funnel-step"><strong>' + value + '</strong><span>' + label + '</span><div class="bar"><span style="width:' + Math.max(4, conversion) + '%"></span></div><small>' + conversion + '% conversion</small></div>';
    }

    function renderDashboardPanel(stats) {
      const eventos = dashboardInfo.eventos || [];
      const objeciones = dashboardInfo.objeciones || [];
      return '<div class="dashboard-panel"><section class="dashboard-section"><h2>Embudo comercial</h2><div class="funnel">' + [
        renderFunnelStep("Leads", stats.total, null),
        renderFunnelStep("Contactados", stats.contactados, stats.total),
        renderFunnelStep("Interesados", stats.interesados, stats.contactados),
        renderFunnelStep("Diagnosticos", stats.pagados, stats.interesados),
        renderFunnelStep("Activaciones", 0, stats.pagados),
      ].join("") + '</div></section><section class="dashboard-section"><h2>Actividad reciente</h2><div class="activity-list">' + (eventos.map(e => '<div class="activity-item"><strong>' + escapeHtml(e.tipo) + '</strong><div>' + escapeHtml(e.descripcion || e.telefono || '') + '</div><small>' + fmtDate(e.created_at) + '</small></div>').join("") || '<div class="activity-item">Sin eventos recientes.</div>') + '</div></section><section class="dashboard-section"><h2>Top objeciones</h2><div class="objection-list">' + (objeciones.map(o => '<div class="objection-item"><strong>' + escapeHtml(o.objecion) + '</strong><div class="bar"><span style="width:' + Math.max(8, Math.min(100, o.total * 12)) + '%"></span></div><small>' + o.total + ' leads</small></div>').join("") || '<div class="objection-item">Sin objeciones registradas.</div>') + '</div></section></div>';
    }

    function applyDashboardAction(action) {
      clearFilterValues();
      if (action === "mensajes_nuevos") {
        document.getElementById("filterOperativo").value = "nuevo";
        setView("chat");
      } else {
        setView(action === "requiere_intervencion" ? "seguimiento" : "leads");
        if (action === "prospectados") document.getElementById("filterEstado").value = "prospectado";
        if (action === "contactados") document.getElementById("filterEstado").value = "contactado";
        if (action === "interesados") document.getElementById("filterOperativo").value = "interesados";
        if (action === "calientes") document.getElementById("filterOperativo").value = "calientes";
        if (action === "diagnostico_pagado") document.getElementById("filterOperativo").value = "diagnostico_pagado";
        if (action === "perdidos") document.getElementById("filterEstado").value = "perdido";
        if (action === "requiere_intervencion") document.getElementById("filterOperativo").value = "requiere_intervencion";
      }
      applyFilters();
    }

    function hasNewMessage(c) {
      return c.interactuo_post_campana === true || c.mensaje_nuevo === true || Number(c.respuestas_post_campana || 0) > 0;
    }

    function isContactedCommercial(c) {
      const state = commercialState(c);
      return state && state !== "Pendiente de contactar";
    }
    function isRespondedCommercial(c) {
      return ["Respondió","Pidió información","Interesado","Diagnóstico ofrecido","Diagnóstico vendido","Activación ofrecida","Activación vendida","Control ON ofrecido","Cliente recurrente"].includes(commercialState(c));
    }
    function isInterestedCommercial(c) {
      return ["Interesado","Diagnóstico ofrecido","Diagnóstico vendido","Activación ofrecida","Activación vendida","Control ON ofrecido","Cliente recurrente"].includes(commercialState(c));
    }
    function groupReport(keyFn) {
      const groups = new Map();
      conversaciones.forEach(c => {
        const key = keyFn(c);
        const row = groups.get(key) || { key, leads_totales: 0, contactados: 0, respondieron: 0, interesados: 0, diagnosticos_ofrecidos: 0, diagnosticos_vendidos: 0, activaciones_ofrecidas: 0, activaciones_vendidas: 0, vendidos_total: 0, descartados: 0, monto_cotizado_total: 0, monto_pagado_total: 0 };
        row.leads_totales += 1;
        if (isContactedCommercial(c)) row.contactados += 1;
        if (isRespondedCommercial(c)) row.respondieron += 1;
        if (isInterestedCommercial(c)) row.interesados += 1;
        if (commercialState(c) === "Diagnóstico ofrecido") row.diagnosticos_ofrecidos += 1;
        if (commercialState(c) === "Diagnóstico vendido") row.diagnosticos_vendidos += 1;
        if (commercialState(c) === "Activación ofrecida") row.activaciones_ofrecidas += 1;
        if (commercialState(c) === "Activación vendida") row.activaciones_vendidas += 1;
        if (isSold(c)) row.vendidos_total += 1;
        if (isDiscarded(c)) row.descartados += 1;
        row.monto_cotizado_total += Number(c.monto_cotizado || 0);
        row.monto_pagado_total += Number(c.monto_pagado || 0);
        groups.set(key, row);
      });
      return Array.from(groups.values()).sort((a, b) => a.key.localeCompare(b.key));
    }
    function reportTable(title, headers, rows) {
      return '<section class="dashboard-section"><h2>' + title + '</h2><div class="table-wrap"><table><thead><tr>' + headers.map(h => '<th>' + h + '</th>').join("") + '</tr></thead><tbody>' + (rows.join("") || '<tr><td colspan="' + headers.length + '">Sin datos.</td></tr>') + '</tbody></table></div></section>';
    }
    function renderReports() {
      const byZona = groupReport(c => zonaLabel(c.zona));
      const byFuente = groupReport(c => fuenteLabel(c.fuente_busqueda));
      const byEstado = groupReport(c => commercialState(c) || "Sin dato");
      const total = conversaciones.length;
      const contactados = conversaciones.filter(isContactedCommercial).length;
      const respondieron = conversaciones.filter(isRespondedCommercial).length;
      const interesados = conversaciones.filter(isInterestedCommercial).length;
      const diagVendidos = conversaciones.filter(c => commercialState(c) === "Diagnóstico vendido").length;
      const actVendidas = conversaciones.filter(c => commercialState(c) === "Activación vendida").length;
      const recurrentes = conversaciones.filter(c => commercialState(c) === "Cliente recurrente").length;
      const cotizado = conversaciones.reduce((sum, c) => sum + Number(c.monto_cotizado || 0), 0);
      const pagado = conversaciones.reduce((sum, c) => sum + Number(c.monto_pagado || 0), 0);
      const seguimiento = {
        vencidos: conversaciones.filter(isOverdue).length,
        hoy: conversaciones.filter(c => isDueTodayOrOverdue(c) && !isOverdue(c)).length,
        interesados_abiertos: conversaciones.filter(c => commercialState(c) === "Interesado").length,
        contactados_sin_respuesta: conversaciones.filter(c => commercialState(c) === "Contactado" && !c.ultima_respuesta).length,
        sin_accion: conversaciones.filter(c => !String(c.siguiente_accion || "").trim()).length,
        sin_zona: conversaciones.filter(c => normalizeZona(c.zona) === "__sin_zona__").length,
        sin_telefono: conversaciones.filter(c => !String(c.telefono || "").trim()).length,
      };
      console.log("CRM resumen reportes", { total, contactados, respondieron, interesados, seguimiento, cotizado, pagado });
      reports.innerHTML = '<div class="dashboard-panel">' + [
        '<section class="dashboard-section"><h2>Resumen general</h2><div class="chat-dashboard">' + [
          metric("Leads totales", total), metric("Contactados", contactados), metric("Respondieron", respondieron), metric("Interesados", interesados),
          metric("Diagnosticos vendidos", diagVendidos), metric("Activaciones vendidas", actVendidas), metric("Clientes recurrentes", recurrentes),
          metric("Cotizado", money(cotizado)), metric("Pagado", money(pagado)), metric("Tasa respuesta", pct1(respondieron, contactados)), metric("Tasa interes", pct1(interesados, respondieron)),
        ].join("") + '</div></section>',
        reportTable("Por zona", ["Zona","Leads","Contactados","Respondieron","Interesados","Diag. ofrecidos","Diag. vendidos","Act. ofrecidas","Act. vendidas","Vendidos","Descartados","Resp.","Interes","Cotizado","Pagado"], byZona.map(r => '<tr><td>' + escapeHtml(r.key) + '</td><td>' + r.leads_totales + '</td><td>' + r.contactados + '</td><td>' + r.respondieron + '</td><td>' + r.interesados + '</td><td>' + r.diagnosticos_ofrecidos + '</td><td>' + r.diagnosticos_vendidos + '</td><td>' + r.activaciones_ofrecidas + '</td><td>' + r.activaciones_vendidas + '</td><td>' + r.vendidos_total + '</td><td>' + r.descartados + '</td><td>' + pct1(r.respondieron, r.contactados) + '</td><td>' + pct1(r.interesados, r.respondieron) + '</td><td>' + money(r.monto_cotizado_total) + '</td><td>' + money(r.monto_pagado_total) + '</td></tr>')),
        reportTable("Por fuente busqueda", ["Fuente","Leads","Contactados","Respondieron","Interesados","Diag. vendidos","Act. vendidas","Vendidos","Resp.","Interes","Cotizado","Pagado"], byFuente.map(r => '<tr><td>' + escapeHtml(r.key) + '</td><td>' + r.leads_totales + '</td><td>' + r.contactados + '</td><td>' + r.respondieron + '</td><td>' + r.interesados + '</td><td>' + r.diagnosticos_vendidos + '</td><td>' + r.activaciones_vendidas + '</td><td>' + r.vendidos_total + '</td><td>' + pct1(r.respondieron, r.contactados) + '</td><td>' + pct1(r.interesados, r.respondieron) + '</td><td>' + money(r.monto_cotizado_total) + '</td><td>' + money(r.monto_pagado_total) + '</td></tr>')),
        reportTable("Por estado comercial", ["Estado comercial","Total leads"], byEstado.map(r => '<tr><td>' + escapeHtml(r.key) + '</td><td>' + r.leads_totales + '</td></tr>')),
        '<section class="dashboard-section"><h2>Seguimiento</h2><div class="chat-dashboard">' + [
          metric("Seguimientos vencidos", seguimiento.vencidos), metric("Seguimientos hoy", seguimiento.hoy), metric("Interesados abiertos", seguimiento.interesados_abiertos),
          metric("Contactados sin respuesta", seguimiento.contactados_sin_respuesta), metric("Sin siguiente accion", seguimiento.sin_accion), metric("Sin zona", seguimiento.sin_zona), metric("Sin telefono", seguimiento.sin_telefono),
        ].join("") + '</div></section>',
      ].join("") + '</div>';
    }

    function renderChatDashboard() {
      const nuevos = conversaciones.filter(hasNewMessage).length;
      const atencion = conversaciones.filter(needsAttention).length;
      const calientes = conversaciones.filter(c => c.caliente === true || c.estado === "cliente_caliente").length;
      chatDashboard.innerHTML = [
        metric("Respondieron campaña", nuevos, "mensajes_nuevos"),
        metric("Requieren atencion", atencion, "requiere_intervencion"),
        metric("Calientes", calientes, "calientes"),
      ].join("");
      chatDashboard.querySelectorAll("[data-dash-action]").forEach(card => card.addEventListener("click", () => applyDashboardAction(card.dataset.dashAction)));
    }

    function needsAttention(c) {
      const due = c.fecha_seguimiento && new Date(c.fecha_seguimiento).getTime() <= Date.now();
      const commercialDue = isDueTodayOrOverdue(c);
      const interested = c.estado === "interesado" && c.seguimiento_activo !== false;
      const hot = (c.estado === "cliente_caliente" || c.caliente === true) && c.estado !== "diagnostico_pagado";
      return c.seguimiento_activo !== false && (c.estado === "requiere_intervencion" || due || commercialDue || interested || hot);
    }

    function renderAttention() {
      const items = conversaciones.filter(needsAttention).slice(0, 20);
      const wrap = document.getElementById("attention");
      wrap.innerHTML = '<h2>Requiere atencion</h2><div class="attention-list">' + (items.map(c => '<button data-tel="' + escapeHtml(c.telefono) + '"><strong>' + escapeHtml(label(c)) + '</strong><br><small>' + escapeHtml(commercialState(c) || c.estado || 'nuevo') + ' | ' + escapeHtml(c.siguiente_accion || c.proxima_accion || 'sin accion') + '</small><br><small>' + escapeHtml(c.fecha_siguiente_seguimiento ? fmtDate(c.fecha_siguiente_seguimiento) : (c.fecha_seguimiento ? fmtDate(c.fecha_seguimiento) : 'sin fecha')) + '</small><br><small>' + escapeHtml(alertasLead(c).join(' | ') || c.motivo_seguimiento || 'sin motivo') + '</small><br><span class="badge">Ver chat</span></button>').join("") || '<span class="badge">Sin pendientes operativos</span>') + '</div>';
      wrap.querySelectorAll("button[data-tel]").forEach(btn => btn.addEventListener("click", () => { setView("chat"); selectLead(btn.dataset.tel); }));
    }

    function fillSelect(id, values, firstLabel) {
      const select = document.getElementById(id);
      const current = select.value;
      select.innerHTML = '<option value="">' + firstLabel + '</option>' + values.map(v => '<option value="' + escapeHtml(v) + '">' + escapeHtml(v) + '</option>').join("");
      select.value = current;
    }

    function fillZonaSelect() {
      const zonas = zonasDetectadas();
      console.log("CRM zonas detectadas", zonas);
      const select = document.getElementById("filterZona");
      const current = select.value;
      select.innerHTML = '<option value="">Todas las zonas</option><option value="__sin_zona__">Sin zona</option>' + zonas.map(z => '<option value="' + escapeHtml(z) + '">' + escapeHtml(z) + '</option>').join("");
      select.value = current && [...zonas, "__sin_zona__"].includes(current) ? current : "";
    }

    function fillFuenteSelect() {
      const fuentes = fuentesDetectadas();
      console.log("CRM fuentes detectadas", fuentes);
      const select = document.getElementById("filterFuente");
      const current = select.value;
      select.innerHTML = '<option value="">Todas las fuentes</option><option value="__sin_fuente__">Sin fuente</option>' + fuentes.map(f => '<option value="' + escapeHtml(f) + '">' + escapeHtml(f) + '</option>').join("");
      select.value = current && [...fuentes, "__sin_fuente__"].includes(current) ? current : "";
    }

    function fillFilters() {
      fillSelect("filterEstado", [...new Set([...estadosBase, ...uniqueValues("estado")])].filter(Boolean), "Todos");
      fillSelect("filterPrioridad", uniqueValues("prioridad"), "Todas");
      fillSelect("filterCategoria", uniqueValues("categoria"), "Todas");
      fillZonaSelect();
      fillFuenteSelect();
      fillSelect("filterEstadoContacto", estadosContacto, "Todos");
    }

    function applyFilters() {
      const texto = document.getElementById("filterTexto").value.trim().toLowerCase();
      const estado = document.getElementById("filterEstado").value;
      const prioridad = document.getElementById("filterPrioridad").value;
      const categoria = document.getElementById("filterCategoria").value;
      const zona = document.getElementById("filterZona").value;
      const fuente = document.getElementById("filterFuente").value;
      const estadoContacto = document.getElementById("filterEstadoContacto").value;
      const caliente = document.getElementById("filterCaliente").value;
      const operativo = document.getElementById("filterOperativo").value;
      filtered = conversaciones.filter(c => {
        if (texto) {
          const haystack = [label(c), c.telefono, c.categoria, c.zona, c.fuente_busqueda, c.estado_contacto, c.siguiente_accion].map(v => String(v || "").toLowerCase()).join(" ");
          if (!haystack.includes(texto)) return false;
        }
        if (estado && (c.estado || "") !== estado) return false;
        if (prioridad && (c.prioridad || "") !== prioridad) return false;
        if (categoria && (c.categoria || "") !== categoria) return false;
        if (zona && normalizeZona(c.zona) !== zona) return false;
        if (fuente && normalizeFuente(c.fuente_busqueda) !== fuente) return false;
        if (estadoContacto && commercialState(c) !== estadoContacto) return false;
        if (caliente && String(c.caliente === true) !== caliente) return false;
        if (operativo === "nuevo" && !hasNewMessage(c)) return false;
        if (operativo === "requiere_intervencion" && c.estado !== "requiere_intervencion") return false;
        if (operativo === "interesados" && c.estado !== "interesado") return false;
        if (operativo === "calientes" && !(c.caliente === true || c.estado === "cliente_caliente")) return false;
        if (operativo === "diagnostico_pagado" && c.estado !== "diagnostico_pagado") return false;
        if (operativo === "hoy_vencidos" && !isDueTodayOrOverdue(c)) return false;
        return true;
      }).sort(compareLeads);
      console.log("CRM filtros", { zona_seleccionada: zona || "Todas las zonas", fuente_seleccionada: fuente || "Todas las fuentes", estado_seleccionado: estadoContacto || estado || "Todos", leads_filtrados: filtered.length, seguimientos_vencidos: conversaciones.filter(isOverdue).length });
      renderLeads();
    }

    function priorityRank(c) {
      if (c.estado === "requiere_intervencion") return 0;
      if (hasNewMessage(c)) return 1;
      if (c.caliente === true || c.estado === "cliente_caliente") return 2;
      if (c.estado === "interesado") return 3;
      return 4;
    }

    function compareLeads(a, b) {
      const rank = priorityRank(a) - priorityRank(b);
      if (rank !== 0) return rank;
      return new Date(b.fecha_ultimo_mensaje_real || b.fecha_ultimo_mensaje || 0) - new Date(a.fecha_ultimo_mensaje_real || a.fecha_ultimo_mensaje || 0);
    }

    function relativeTime(value) {
      if (!value) return "sin datos";
      const diff = Date.now() - new Date(value).getTime();
      if (Number.isNaN(diff)) return "sin datos";
      const min = Math.max(1, Math.round(diff / 60000));
      if (min < 60) return "hace " + min + " min";
      const hrs = Math.round(min / 60);
      if (hrs < 48) return "hace " + hrs + " h";
      const days = Math.round(hrs / 24);
      return "hace " + days + " dias";
    }

    function lastMessageLabel(c) {
      const actor = c.direccion_ultimo_mensaje === "entrante" ? "Cliente" : (c.direccion_ultimo_mensaje === "saliente" ? "Nosotros" : "Sin mensajes");
      return actor + " " + relativeTime(c.fecha_ultimo_mensaje_real || c.fecha_ultimo_mensaje);
    }

    function bindLeadRowActions() {
      leads.querySelectorAll("button[data-chat]").forEach(btn => btn.addEventListener("click", async (event) => {
        event.stopPropagation();
        setView("chat");
        await selectLead(btn.dataset.chat);
      }));
      leads.querySelectorAll("button[data-edit]").forEach(btn => btn.addEventListener("click", async (event) => {
        event.stopPropagation();
        await selectLead(btn.dataset.edit);
        openEdit();
      }));
      leads.querySelectorAll("button[data-delete]").forEach(btn => btn.addEventListener("click", async (event) => {
        event.stopPropagation();
        await deleteLead(btn.dataset.delete);
      }));
    }

    function renderLeads() {
      const leadActions = (telefono) => '<div class="lead-actions"><button type="button" data-chat="' + escapeHtml(telefono) + '">Ver chat</button><button type="button" data-edit="' + escapeHtml(telefono) + '">Editar</button><button class="danger" type="button" data-delete="' + escapeHtml(telefono) + '">Borrar</button></div>';
      const alertBadges = (c) => alertasLead(c).map(a => '<span class="badge off">' + escapeHtml(a) + '</span>').join(" ");
      if (currentView === "chat") {
        leads.innerHTML = filtered.map(c => {
          const pending = Number(c.respuestas_post_campana || c.mensajes_pendientes || 0);
          const name = escapeHtml(label(c)) + (hasNewMessage(c) ? ' <span class="badge new">🔵 (' + pending + ')</span>' : '');
          const newBadge = hasNewMessage(c) ? ' <span class="badge new">Respondió</span>' : '';
          return '<tr class="' + (selected?.telefono === c.telefono ? 'active' : '') + '" data-tel="' + escapeHtml(c.telefono) + '"><td colspan="11"><strong>' + name + '</strong>' + newBadge + '<br><small>' + escapeHtml(c.telefono) + ' | ' + escapeHtml(zonaLabel(c.zona)) + ' | ' + escapeHtml(fuenteLabel(c.fuente_busqueda)) + ' | ' + escapeHtml(commercialState(c) || c.estado || 'nuevo') + '</small><br><small>Siguiente: ' + escapeHtml(safeDato(c.siguiente_accion)) + ' | ' + escapeHtml(c.fecha_siguiente_seguimiento ? fmtDate(c.fecha_siguiente_seguimiento) : 'Sin seguimiento') + '</small><br><small><strong>Ultimo mensaje:</strong> ' + escapeHtml(lastMessageLabel(c)) + '</small><br>' + alertBadges(c) + '</td></tr>';
        }).join("") || '<tr><td colspan="11">Sin leads con esos filtros.</td></tr>';
        leads.querySelectorAll("tr[data-tel]").forEach(row => row.addEventListener("click", () => { setView("chat"); selectLead(row.dataset.tel); }));
        return;
      }
      if (isMobile()) {
        leads.innerHTML = filtered.map(c => {
          const pending = Number(c.respuestas_post_campana || c.mensajes_pendientes || 0);
          return '<tr class="' + (selected?.telefono === c.telefono ? 'active' : '') + '" data-tel="' + escapeHtml(c.telefono) + '"><td colspan="11"><strong>' + escapeHtml(label(c)) + '</strong>' + (hasNewMessage(c) ? ' <span class="badge new">🔵 (' + escapeHtml(pending) + ')</span> <span class="badge new">Respondió</span>' : '') + '<br><small>' + escapeHtml(c.telefono) + ' | Zona: ' + escapeHtml(zonaLabel(c.zona)) + ' | Fuente: ' + escapeHtml(fuenteLabel(c.fuente_busqueda)) + '</small><br><small>Estado: ' + escapeHtml(commercialState(c) || c.estado || 'nuevo') + ' | Prioridad: ' + escapeHtml(c.prioridad || 'sin datos') + ' | Score: ' + escapeHtml(c.score || 'sin datos') + '</small><br><small>Siguiente: ' + escapeHtml(safeDato(c.siguiente_accion)) + ' | ' + escapeHtml(c.fecha_siguiente_seguimiento ? fmtDate(c.fecha_siguiente_seguimiento) : 'Sin seguimiento') + '</small><br>' + alertBadges(c) + '<br><button type="button" data-chat="' + escapeHtml(c.telefono) + '">Ver chat</button> <button type="button" data-initial="' + escapeHtml(c.telefono) + '">Enviar inicial</button></td></tr>';
        }).join("") || '<tr><td colspan="11">Sin leads con esos filtros.</td></tr>';
        leads.querySelectorAll("tr[data-tel] td").forEach(td => {
          const tel = td.parentElement.dataset.tel;
          td.insertAdjacentHTML("beforeend", ' <button type="button" data-edit="' + escapeHtml(tel) + '">Editar</button> <button class="danger" type="button" data-delete="' + escapeHtml(tel) + '">Borrar</button>');
        });
        bindLeadRowActions();
        leads.querySelectorAll("button[data-initial]").forEach(btn => btn.addEventListener("click", async (event) => { event.stopPropagation(); selected = conversaciones.find(c => c.telefono === btn.dataset.initial); if (selected) document.getElementById("initialBtn").click(); }));
        leads.querySelectorAll("tr[data-tel]").forEach(row => row.addEventListener("click", () => { setView("chat"); selectLead(row.dataset.tel); }));
        return;
      }
      leads.innerHTML = filtered.map(c => {
        const pending = Number(c.respuestas_post_campana || c.mensajes_pendientes || 0);
        const newBadge = hasNewMessage(c) ? ' <span class="badge new">Respondió</span>' : '';
        const name = escapeHtml(label(c)) + (hasNewMessage(c) ? ' <span class="badge new">🔵 (' + pending + ')</span>' : '');
        const counts = escapeHtml(c.total_mensajes || 0) + ' total<br><small>' + escapeHtml(c.mensajes_entrantes || 0) + ' in / ' + escapeHtml(c.mensajes_salientes || 0) + ' out</small>';
        return '<tr class="' + (selected?.telefono === c.telefono ? 'active' : '') + '" data-tel="' + escapeHtml(c.telefono) + '"><td><strong>' + name + newBadge + '</strong><br><small>' + escapeHtml(c.categoria || 'Sin nicho') + ' | ' + escapeHtml(c.prioridad || 'sin prioridad') + ' | Score ' + escapeHtml(c.score || 'sin dato') + '</small><br>' + alertBadges(c) + '</td><td>' + escapeHtml(c.telefono || 'Sin telefono') + '</td><td>' + escapeHtml(zonaLabel(c.zona)) + '</td><td>' + escapeHtml(fuenteLabel(c.fuente_busqueda)) + '</td><td>' + escapeHtml(commercialState(c) || 'Sin dato') + '</td><td>' + escapeHtml(safeDato(c.siguiente_accion)) + '</td><td>' + escapeHtml(c.fecha_siguiente_seguimiento ? fmtDate(c.fecha_siguiente_seguimiento) : 'Sin dato') + '</td><td>' + escapeHtml(safeDato(c.producto_interesado)) + '<br><small>' + escapeHtml(money(c.monto_cotizado)) + '</small></td><td>' + escapeHtml(safeDato(c.estado_pago)) + '<br><small>Pagado ' + escapeHtml(money(c.monto_pagado)) + '</small><br>' + leadActions(c.telefono) + '</td></tr>';
      }).join("") || '<tr><td colspan="11">Sin leads con esos filtros.</td></tr>';
      bindLeadRowActions();
      leads.querySelectorAll("tr[data-tel]").forEach(row => row.addEventListener("click", () => selectLead(row.dataset.tel)));
    }

    function renderContext(c) {
      if (!c) { context.innerHTML = '<div class="empty">Sin lead seleccionado.</div>'; return; }
      const negocio = [
        ["Nombre", label(c)], ["Categoria", c.categoria], ["Zona", zonaLabel(c.zona)], ["Fuente", fuenteLabel(c.fuente_busqueda)], ["Estado comercial", commercialState(c) || "Sin dato"], ["Prioridad", c.prioridad], ["Score", c.score],
        ["Total fugas", c.total_fugas], ["Telefono", c.telefono], ["Estado", c.estado], ["Ultimo mensaje", c.ultimo_mensaje],
        ["Siguiente accion", c.siguiente_accion], ["Fecha seguimiento", c.fecha_siguiente_seguimiento ? fmtDate(c.fecha_siguiente_seguimiento) : "Sin dato"], ["Producto", c.producto_interesado], ["Monto cotizado", money(c.monto_cotizado)], ["Monto pagado", money(c.monto_pagado)], ["Estado pago", c.estado_pago], ["Ultima respuesta", c.ultima_respuesta ? fmtDate(c.ultima_respuesta) : "Sin dato"],
        ["Rating", c.rating], ["Resenas", c.resenas], ["Fotos estimadas", c.fotos_estimadas || c.fotos], ["Diagnostico fotos", c.diagnostico_fotos], ["Ultima resena", c.ultima_resena],
        ["Responde resenas", c.responde_resenas], ["Website", c.website], ["Horarios", c.horarios], ["Descripcion", c.descripcion],
        ["Direccion", c.direccion], ["Maps", c.maps_url ? '<a href="' + escapeHtml(c.maps_url) + '" target="_blank" rel="noreferrer">Abrir Maps</a>' : ""],
      ];
      context.innerHTML = '<h2>Datos del negocio</h2><div class="context-grid">' + negocio.map(([k, v]) => '<div><strong>' + k + '</strong><span>' + (v || 'sin datos') + '</span></div>').join("") + '</div><h2>Seguimiento operativo</h2><div class="ops"><label>Proxima accion<input id="opAccion" value="' + escapeHtml(c.proxima_accion || '') + '"></label><label>Fecha seguimiento<input id="opFecha" type="datetime-local" value="' + toLocalInput(c.fecha_seguimiento) + '"></label><label>Motivo seguimiento<textarea id="opMotivo">' + escapeHtml(c.motivo_seguimiento || '') + '</textarea></label><label>Seguimiento activo<select id="opActivo"><option value="true"' + (c.seguimiento_activo !== false ? ' selected' : '') + '>ON</option><option value="false"' + (c.seguimiento_activo === false ? ' selected' : '') + '>OFF</option></select></label><label>Objecion principal<input id="opObjecion" value="' + escapeHtml(c.objecion_principal || '') + '"></label><label class="wide">Resultado conversacion<textarea id="opResultado">' + escapeHtml(c.resultado_conversacion || '') + '</textarea></label><button class="primary" id="saveFollowup">Guardar seguimiento</button><span id="followupStatus" class="badge">Listo</span></div><h2>Fugas detectadas</h2><div class="fugas">' + escapeHtml(c.fugas_detectadas || 'Sin fugas guardadas.') + '</div><h2>Notas internas</h2><div class="notes">' + escapeHtml(c.notas || 'Sin notas internas.') + '</div><h2>Timeline</h2><div id="timeline" class="timeline"><span class="badge">Cargando eventos</span></div>';
      document.getElementById("saveFollowup").addEventListener("click", saveFollowup);
      loadTimeline(c.telefono);
    }

    function toLocalInput(value) {
      if (!value) return "";
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return "";
      const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
      return local.toISOString().slice(0, 16);
    }

    function fromLocalInput(value) {
      return value ? new Date(value).toISOString() : null;
    }

    async function saveFollowup() {
      if (!selected) return;
      const status = document.getElementById("followupStatus");
      status.textContent = "Guardando";
      const res = await actionFetch("lead_followup", {
        telefono: selected.telefono,
        updates: {
          proxima_accion: document.getElementById("opAccion").value,
          fecha_seguimiento: fromLocalInput(document.getElementById("opFecha").value),
          motivo_seguimiento: document.getElementById("opMotivo").value,
          seguimiento_activo: document.getElementById("opActivo").value === "true",
          objecion_principal: document.getElementById("opObjecion").value,
          resultado_conversacion: document.getElementById("opResultado").value,
        }
      });
      const data = await res.json();
      status.textContent = res.ok && data.ok ? "Guardado" : (data.error || "Error");
      if (res.ok && data.ok) {
        selected = data.conversacion;
        await loadConversaciones();
      }
    }

    async function loadTimeline(telefono) {
      const wrap = document.getElementById("timeline");
      const res = await actionFetch("eventos_crm", { telefono });
      const data = await res.json();
      const eventos = data.eventos || [];
      wrap.innerHTML = eventos.map(e => '<div class="event"><strong>' + escapeHtml(e.tipo) + '</strong><div>' + escapeHtml(e.descripcion || '') + '</div><small>' + fmtDate(e.created_at) + '</small></div>').join("") || '<span class="badge">Sin eventos registrados.</span>';
    }

    function renderEditForm() {
      if (!selected) return;
      editForm.innerHTML = editableFields.map(([key, labelText, type]) => {
        const value = selected[key];
        const wide = type === "textarea" ? " wide" : "";
        if (type === "textarea") {
          return '<label class="' + wide.trim() + '">' + labelText + '<textarea data-field="' + key + '">' + escapeHtml(value || '') + '</textarea></label>';
        }
        if (type === "datetime") {
          return '<label>' + labelText + '<input type="datetime-local" data-field="' + key + '" value="' + toLocalInput(value) + '" /></label>';
        }
        if (type === "selectBoolean") {
          return '<label>' + labelText + '<select data-field="' + key + '"><option value="true"' + (value === true || (key === "bot_enabled" && value !== false) ? ' selected' : '') + '>Si</option><option value="false"' + (value === false ? ' selected' : '') + '>No</option></select></label>';
        }
        const list = key === "zona" ? ' list="zonasList"' : (key === "fuente_busqueda" ? ' list="fuentesList"' : (key === "estado_contacto" ? ' list="estadosContactoList"' : (key === "producto_interesado" ? ' list="productosList"' : (key === "estado_pago" ? ' list="estadosPagoList"' : ""))));
        return '<label>' + labelText + '<input data-field="' + key + '"' + list + ' value="' + escapeHtml(value || '') + '" /></label>';
      }).join("");
      editForm.insertAdjacentHTML("beforeend", '<datalist id="zonasList">' + zonasDetectadas().map(z => '<option value="' + escapeHtml(z) + '"></option>').join("") + '</datalist>');
      editForm.insertAdjacentHTML("beforeend", '<datalist id="fuentesList">' + fuentesDetectadas().map(f => '<option value="' + escapeHtml(f) + '"></option>').join("") + '</datalist>');
      editForm.insertAdjacentHTML("beforeend", '<datalist id="estadosContactoList">' + estadosContacto.map(e => '<option value="' + escapeHtml(e) + '"></option>').join("") + '</datalist><datalist id="productosList">' + productosInteres.map(e => '<option value="' + escapeHtml(e) + '"></option>').join("") + '</datalist><datalist id="estadosPagoList">' + estadosPago.map(e => '<option value="' + escapeHtml(e) + '"></option>').join("") + '</datalist>');
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
        } else if (["fecha_siguiente_seguimiento","ultimo_contacto","ultima_respuesta","fecha_venta"].includes(key)) {
          updates[key] = fromLocalInput(input.value);
        } else {
          updates[key] = input.value;
        }
      });
      return updates;
    }

    async function saveEdit() {
      if (!selected) return;
      const updates = collectEditUpdates();
      const telefono = String(updates.telefono || "").replace(/\\D/g, "").trim();
      if (!telefono) {
        editStatus.textContent = "Telefono requerido.";
        return;
      }
      updates.telefono = telefono;
      editStatus.textContent = "Guardando";
      document.getElementById("saveEdit").disabled = true;
      const res = await actionFetch("lead_update", { telefono_original: selected.telefono, updates });
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

    async function deleteLead(telefono) {
      const target = telefono || selected?.telefono;
      if (!target) return;
      const lead = conversaciones.find(c => c.telefono === target) || selected || { telefono: target };
      if (!confirm("¿Seguro que quieres borrar este lead? No se borrará el historial de mensajes.")) return;
      const res = await actionFetch("eliminar_lead", { telefono: target });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        alert(data.error || "No se pudo borrar el lead.");
        return;
      }
      if (selected?.telefono === target) {
        selected = null;
        title.textContent = "Selecciona un lead";
        subtitle.textContent = "";
        context.innerHTML = '<div class="empty">Sin lead seleccionado.</div>';
        messages.innerHTML = '<div class="empty">Sin conversacion seleccionada.</div>';
        actionIds.forEach(id => document.getElementById(id).disabled = true);
      }
      await loadConversaciones();
    }

    async function selectLead(telefono) {
      selected = conversaciones.find(c => c.telefono === telefono) || { telefono };
      if (currentView === "chat" && isMobile()) page.classList.add("mobile-chat-open");
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
      const res = await actionFetch("mensajes", { telefono });
      const data = await res.json();
      const items = data.mensajes || [];
      messages.innerHTML = items.map(m => '<div class="msg ' + m.direccion + '">' + escapeHtml(m.mensaje) + '<small>' + m.direccion + ' | ' + fmtDate(m.created_at) + '</small></div>').join("") || '<div class="empty">Sin mensajes guardados.</div>';
      messages.scrollTop = messages.scrollHeight;
    }

    async function setBot(value) {
      if (!selected) return;
      await actionFetch("bot_enabled", { telefono: selected.telefono, bot_enabled: value });
      await loadConversaciones();
    }

    async function setEstado(estado) {
      if (!selected) return;
      await actionFetch("lead_estado", { telefono: selected.telefono, estado });
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
      const res = await actionFetch("importar_prospector", { contenido });
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
      const res = await actionFetch("enviar_inicial", { telefono: selected.telefono });
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
    document.getElementById("deleteBtn").addEventListener("click", () => deleteLead());
    document.getElementById("refresh").addEventListener("click", loadConversaciones);
    document.querySelectorAll(".nav-btn").forEach(btn => btn.addEventListener("click", () => setView(btn.dataset.view)));
    document.getElementById("backToLeads").addEventListener("click", () => page.classList.remove("mobile-chat-open", "show-mobile-context"));
    document.getElementById("toggleLeadData").addEventListener("click", () => page.classList.toggle("show-mobile-context"));
    document.getElementById("clearFilters").addEventListener("click", () => {
      clearFilterValues();
      applyFilters();
    });
    ["filterEstado","filterPrioridad","filterCategoria","filterZona","filterFuente","filterEstadoContacto","filterCaliente","filterOperativo"].forEach(id => document.getElementById(id).addEventListener("change", applyFilters));
    document.getElementById("filterTexto").addEventListener("input", applyFilters);

    document.getElementById("manualForm").addEventListener("submit", async (event) => {
      event.preventDefault();
      const mensaje = manualText.value.trim();
      if (!selected || !mensaje) return;
      sendManual.disabled = true;
      await actionFetch("enviar_manual", { telefono: selected.telefono, mensaje });
      manualText.value = "";
      sendManual.disabled = false;
      await loadConversaciones();
    });

    const initialView = (location.hash || "#chat").replace("#", "");
    if (["chat","seguimiento","leads","dashboard","reportes"].includes(initialView)) setView(initialView);
    loadConversaciones();
  </script>
</body>
</html>`);
};
