module.exports = async (req, res) => {
  if (req.method !== "GET") return res.status(405).send("Method Not Allowed");

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
  res.status(200).send(`<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>CRM ON</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      color-scheme: light;
      /* Paleta Simla */
      --brand-main: #6c5ce7;
      --brand-hover: #5a4bcf;
      --brand-light: #f0edff;
      --ink: #1e293b;
      --ink-soft: #475569;
      --muted: #94a3b8;
      --line: #e2e8f0;
      --line-strong: #cbd5e1;
      --bg: #f8fafc;
      --bg-sidebar: #1e1b4b; /* Azul muy oscuro / morado */
      --bg-sidebar-hover: #312e81;
      --panel: #ffffff;
      --panel-sunken: #f1f5f9;
      --on: #10b981;
      --off: #ef4444;
      --warning: #f59e0b;
      --radius: 12px;
      --radius-sm: 8px;
      --shadow-sm: 0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03);
      --shadow-md: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.05);
      --font-display: 'Inter', Arial, sans-serif;
      --font-body: 'Inter', Arial, sans-serif;
    }
    * { box-sizing: border-box; }
    body { 
      margin: 0; 
      font-family: var(--font-body); 
      background: var(--bg); 
      color: var(--ink); 
      -webkit-font-smoothing: antialiased; 
      height: 100vh;
      overflow: hidden;
    }
    h1, h2, h3 { font-family: var(--font-display); margin: 0; }
    h1 { font-size: 24px; font-weight: 700; letter-spacing: -0.02em; }
    h2 { font-size: 16px; font-weight: 600; letter-spacing: -0.01em; color: var(--ink); }
    
    button, textarea, input, select { font: inherit; }
    button { border: 1px solid var(--line-strong); background: #fff; color: var(--ink); border-radius: var(--radius-sm); min-height: 36px; padding: 0 16px; cursor: pointer; font-weight: 500; transition: all .15s ease; }
    button:hover { border-color: var(--ink-soft); background: var(--panel-sunken); }
    button:active { transform: scale(.98); }
    button.primary { background: var(--brand-main); border-color: var(--brand-main); color: #fff; }
    button.primary:hover { background: var(--brand-hover); border-color: var(--brand-hover); }
    button.danger { color: var(--off); border-color: #fca5a5; }
    button.danger:hover { background: #fef2f2; border-color: var(--off); }
    button:disabled { cursor: not-allowed; opacity: .5; }

    /* Estructura App Container (Layout Simla) */
    .app-container {
      display: flex;
      height: 100vh;
      width: 100vw;
      overflow: hidden;
    }
    
    /* Sidebar Primaria (Iconos) */
    .sidebar-primary {
      width: 64px;
      min-width: 64px;
      background: var(--bg-sidebar);
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 16px 0;
      z-index: 100;
      border-right: 1px solid rgba(255,255,255,0.1);
    }
    .sidebar-primary .logo {
      width: 40px;
      height: 40px;
      background: rgba(255,255,255,0.1);
      border-radius: var(--radius-sm);
      margin-bottom: 24px;
      display: grid;
      place-items: center;
      color: #fff;
      font-weight: bold;
    }
    .nav-primary-item {
      width: 48px;
      height: 48px;
      display: grid;
      place-items: center;
      color: rgba(255,255,255,0.6);
      border-radius: var(--radius-sm);
      margin-bottom: 8px;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 20px;
      position: relative;
    }
    .nav-primary-item:hover {
      background: var(--bg-sidebar-hover);
      color: #fff;
    }
    .nav-primary-item.active {
      background: rgba(255,255,255,0.1);
      color: #fff;
    }
    .nav-primary-item.active::before {
      content: "";
      position: absolute;
      left: 0;
      top: 20%;
      bottom: 20%;
      width: 4px;
      background: var(--brand-main);
      border-radius: 0 4px 4px 0;
    }

    /* Sidebar Secundaria (Submenús) */
    .sidebar-secondary {
      width: 240px;
      min-width: 240px;
      background: var(--panel);
      border-right: 1px solid var(--line);
      display: flex;
      flex-direction: column;
      transition: width 0.3s ease;
      overflow: hidden;
      z-index: 90;
    }
    .sidebar-secondary.collapsed {
      width: 0;
      min-width: 0;
      border-right: none;
    }
    .sidebar-secondary-header {
      padding: 20px 24px;
      border-bottom: 1px solid var(--line);
    }
    .sidebar-secondary-title {
      font-size: 14px;
      font-weight: 700;
      color: var(--ink);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .sidebar-secondary-menu {
      padding: 16px 12px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .nav-secondary-item {
      padding: 10px 12px;
      border-radius: var(--radius-sm);
      color: var(--ink-soft);
      font-weight: 500;
      font-size: 14px;
      cursor: pointer;
      display: flex;
      align-items: center;
      transition: all 0.2s;
    }
    .nav-secondary-item:hover {
      background: var(--panel-sunken);
      color: var(--ink);
    }
    .nav-secondary-item.active {
      background: var(--brand-light);
      color: var(--brand-main);
      font-weight: 600;
    }

    /* Contenido Principal */
    .main-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
      background: var(--bg);
    }
    .topbar {
      height: 64px;
      background: var(--panel);
      border-bottom: 1px solid var(--line);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 24px;
      z-index: 80;
    }
    .topbar-title {
      font-size: 18px;
      font-weight: 600;
    }
    .topbar-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    /* El contenedor anterior #page ahora llenará el main-content */
    .page { 
      flex: 1;
      display: grid; 
      grid-template-rows: auto auto auto 1fr; 
      min-height: 0; 
      overflow: hidden;
    }

    /* Estilos Dashboard y Componentes (Adaptados a Simla) */
    .dashboard { padding: 24px; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; background: transparent; border: none; }
    .metric { border: 1px solid var(--line); border-radius: var(--radius); padding: 20px; background: var(--panel); transition: all .2s ease; box-shadow: var(--shadow-sm); }
    .metric.clickable { cursor: pointer; }
    .metric.clickable:hover { border-color: var(--brand-main); transform: translateY(-2px); box-shadow: var(--shadow-md); }
    .metric strong { display: block; font-family: var(--font-display); font-size: 28px; font-weight: 700; color: var(--ink); }
    .metric span { display: block; color: var(--muted); font-size: 13px; margin-top: 8px; font-weight: 500; }
    
    .dashboard-panel { display: grid; gap: 24px; background: transparent; border: none; }
    .dashboard-section { display: grid; gap: 12px; background: var(--panel); padding: 24px; border-radius: var(--radius); border: 1px solid var(--line); box-shadow: var(--shadow-sm); }
    .dashboard-section h2 { font-size: 16px; color: var(--ink); text-transform: none; letter-spacing: normal; }
    
    .page.view-dashboard { display: block; overflow-y: auto; overflow-x: hidden; }
    .dashboard-layout { display: grid; grid-template-columns: 1fr 340px; gap: 24px; padding: 0 24px 24px; align-items: start; }
    @media (max-width: 1024px) { .dashboard-layout { grid-template-columns: 1fr; } }
    
    .funnel { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 12px; }
    .funnel-step { border: 1px solid var(--line); border-radius: var(--radius); background: var(--panel); color: var(--ink); padding: 16px; font-size: 13px; }
    .funnel-step strong { display: block; font-size: 24px; font-weight: 700; color: var(--brand-main); }
    .funnel-step span { color: var(--ink-soft); font-weight: 500; }
    .bar { height: 6px; background: var(--line); border-radius: 999px; overflow: hidden; margin-top: 12px; }
    .bar span { display: block; height: 100%; background: var(--brand-main); border-radius: 999px; }
    .activity-item, .objection-item { border: 1px solid var(--line); border-radius: var(--radius-sm); background: var(--panel-sunken); padding: 12px; font-size: 13px; }
    
    /* Layout Chat y Leads */
    main { min-height: 0; display: grid; grid-template-columns: minmax(320px, var(--lead-pane-width, 400px)) 1px minmax(320px, 1fr); position: relative; background: var(--bg); }
    .left { min-height: 0; min-width: 0; display: grid; grid-template-rows: auto auto 1fr; background: var(--panel); border-right: 1px solid var(--line); }
    .pane-resizer { cursor: col-resize; background: transparent; position: relative; z-index: 3; transition: background 0.2s; }
    .pane-resizer:hover, body.resizing-pane .pane-resizer { background: var(--brand-main); }
    
    .import { padding: 16px; border-bottom: 1px solid var(--line); background: var(--panel-sunken); border-radius: var(--radius-sm); margin: 16px; }
    .import textarea { width: 100%; min-height: 60px; border: 1px solid var(--line); border-radius: var(--radius-sm); padding: 10px; font-family: var(--font-body); }
    
    .filters, .lead-search, .attention { padding: 16px; border-bottom: 1px solid var(--line); background: var(--panel); }
    .attention { background: #fffbeb; border-bottom: 1px solid #fde68a; }
    
    label { color: var(--ink-soft); font-size: 12px; font-weight: 600; display: grid; gap: 6px; }
    select, input { border: 1px solid var(--line-strong); border-radius: var(--radius-sm); min-height: 38px; padding: 0 12px; background: #fff; color: var(--ink); font-size: 14px; }
    select:focus, input:focus, textarea:focus { outline: 2px solid var(--brand-main); outline-offset: -1px; border-color: transparent; }
    
    .table-wrap { overflow: auto; min-height: 0; }
    table { width: 100%; border-collapse: separate; border-spacing: 0; font-size: 13px; }
    th, td { border-bottom: 1px solid var(--line); padding: 12px 16px; text-align: left; vertical-align: top; }
    th { position: sticky; top: 0; background: #f8fafc; z-index: 1; color: var(--ink-soft); font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: .02em; }
    tr { cursor: pointer; transition: background .15s ease; }
    tr:hover { background: var(--panel-sunken); }
    tr.active { background: var(--brand-light); }
    
    .lead-name { color: var(--ink); font-size: 15px; font-weight: 700; font-family: var(--font-display); }
    .lead-meta { color: var(--muted); font-size: 12px; margin-top: 4px; }
    .lead-next { padding: 4px 8px; border-radius: 6px; background: var(--panel-sunken); color: var(--ink-soft); font-size: 12px; font-weight: 600; display: inline-block; margin-top: 8px;}
    
    .badge { border-radius: 999px; padding: 4px 10px; font-size: 12px; font-weight: 600; border: 1px solid var(--line); display: inline-flex; align-items: center; }
    .badge.on { color: #047857; background: #d1fae5; border-color: #a7f3d0; }
    .badge.off { color: #b91c1c; background: #fee2e2; border-color: #fecaca; }
    .badge.hot { color: #854d0e; background: #fef08a; border-color: #fde047; }
    .badge.new { color: #1d4ed8; background: #dbeafe; border-color: #bfdbfe; }
    
    /* Detalle (Derecha) */
    .detail { min-height: 0; background: var(--bg); display: grid; grid-template-rows: auto auto 1fr auto; border-left: 1px solid var(--line); }
    .detail-head { background: var(--panel); padding: 20px 24px; border-bottom: 1px solid var(--line); }
    .identity strong { font-size: 20px; font-weight: 700; color: var(--ink); }
    .detail-tabs { display: flex; gap: 8px; padding: 0 24px; background: var(--panel); border-bottom: 1px solid var(--line); }
    .detail-tabs .tab-btn { border: none; background: transparent; padding: 16px 12px; font-weight: 600; color: var(--muted); border-bottom: 2px solid transparent; border-radius: 0; font-size: 14px; }
    .detail-tabs .tab-btn:hover { color: var(--ink); }
    .detail-tabs .tab-btn.active { border-bottom-color: var(--brand-main); color: var(--brand-main); }
    
    /* Lógica de los Tabs */
    .show-chat-tab #context { display: none !important; }
    .show-chat-tab #messages { display: flex !important; }
    .show-chat-tab #manualForm { display: flex !important; }
    
    .show-datos-tab #messages, .show-datos-tab #manualForm { display: none !important; }
    .show-datos-tab #context { display: block !important; }
    
    .actions { padding: 16px 24px; background: var(--panel); border-bottom: 1px solid var(--line); display: flex; gap: 8px; flex-wrap: wrap; }
    
    .messages { padding: 24px; display: flex; flex-direction: column; gap: 12px; background: #efeae2; overflow: auto; }
    .msg { max-width: 75%; padding: 12px 16px; border-radius: 12px; background: #fff; font-size: 14px; line-height: 1.5; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
    .msg.saliente { align-self: flex-end; background: #d9fdd3; }
    .msg small { color: rgba(0,0,0,0.4); font-size: 11px; margin-top: 4px; text-align: right; }
    
    form { padding: 16px 24px; background: var(--panel); border-top: 1px solid var(--line); display: flex; gap: 12px; align-items: flex-end; }
    form textarea { flex: 1; border-radius: 24px; padding: 12px 16px; background: var(--panel-sunken); border: 1px solid var(--line); min-height: 48px; max-height: 120px; }
    form button.primary { border-radius: 24px; height: 48px; padding: 0 24px; }
    
    /* Layout View Logic */
    .page.view-dashboard main, .page.view-dashboard .chat-dashboard { display: none; }
    .page.view-leads .dashboard, .page.view-leads .dashboard-layout, .page.view-leads .chat-dashboard { display: none; }
    .page.view-chat .dashboard, .page.view-chat .dashboard-layout { display: none; }
    .page.view-chat .chat-dashboard { display: grid; grid-template-columns: repeat(3, minmax(120px, 1fr)); padding: 16px 24px; background: var(--panel); border-bottom: 1px solid var(--line); gap: 16px;}
    .page.view-chat .left .import, .page.view-chat .lead-search { display: none; }
    
    /* Estado Vacio (Empty State) para vistas sin datos */
    .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; text-align: center; color: var(--muted); padding: 40px; }
    .empty-state svg { width: 64px; height: 64px; opacity: 0.2; margin-bottom: 16px; }
    .empty-state h3 { color: var(--ink-soft); font-size: 18px; margin-bottom: 8px; }
    
    /* Ocultar elementos originales que no se usan */
    .mobile-only { display: none; }
    .detail-toggle { display: none; }
    
    @media (max-width: 1024px) {
      .sidebar-secondary { position: absolute; left: 64px; top: 0; bottom: 0; box-shadow: var(--shadow-md); z-index: 95; }
      .sidebar-secondary.collapsed { display: none; }
    }
</style>
</head>
<body>
  <div class="app-container">
    <!-- Sidebar Primaria (Simla) -->
    <aside class="sidebar-primary" id="sidebarPrimary">
      <div class="logo">ON</div>
      <div id="navPrimaryContainer">
        <!-- Renderizado dinamico via JS -->
      </div>
    </aside>

    <!-- Sidebar Secundaria (Simla) -->
    <aside class="sidebar-secondary collapsed" id="sidebarSecondary">
      <div class="sidebar-secondary-header">
        <div class="sidebar-secondary-title" id="sidebarSecondaryTitle">Menú</div>
      </div>
      <div class="sidebar-secondary-menu" id="navSecondaryContainer">
        <!-- Renderizado dinamico via JS -->
      </div>
    </aside>

    <!-- Contenido Principal -->
    <div class="main-content">
      <header class="topbar">
        <div class="topbar-title" id="topbarTitle">Dashboard</div>
        <div class="topbar-actions">
          <div id="manualLeadFormContainer" style="display: flex; gap: 8px; align-items: center;">
            <input type="text" id="nombreLead" placeholder="Nombre" style="width: 120px;">
            <input type="text" id="telLead" placeholder="Teléfono" style="width: 120px;">
            <button class="primary" onclick="agregarLead()">+ Lead</button>
            <div id="bulkSendContainer" style="display: none; align-items: center; gap: 8px;">
              <span id="bulkSelectedCount" style="font-size: 12px; color: var(--muted);">0</span>
              <button class="primary" id="btnBulkSend">Enviar</button>
            </div>
          </div>
          <button id="refresh" style="width: 36px; padding: 0; display: grid; place-items: center; border-radius: 50%;">↻</button>
        </div>
      </header>

      <div id="page" class="page view-dashboard">
        <div id="dashboard" class="dashboard"></div>
        <div id="dashboardLayout" class="dashboard-layout">
          <div class="dashboard-left-col">
            <div id="attention" class="attention" style="margin-bottom: 24px; border-radius: var(--radius); box-shadow: var(--shadow-sm);"></div>
            <div id="reports" class="reports-container"></div>
          </div>
          <div class="dashboard-right-col" id="dashboardPanels"></div>
        </div>
        <div id="chatDashboard" class="chat-dashboard"></div>
        <div id="bitacoraView" style="display: none; padding: 24px; background: var(--panel); overflow-y: auto;"></div>
        
        <main>
          <section class="left">
            <details class="import mobile-collapse">
              <summary style="padding: 0 16px; cursor: pointer; font-weight: 600;">Importar leads</summary>
              <div style="padding: 16px;">
                <input id="fileInput" type="file" accept=".csv,.tsv,text/csv,text/tab-separated-values" style="margin-bottom: 8px; width:100%;"/>
                <textarea id="importText" placeholder="Pega filas CSV o TSV"></textarea>
                <div style="margin-top: 8px; display: flex; gap: 8px; align-items: center;">
                  <button class="primary" id="importBtn">Importar</button>
                  <span id="importStatus" class="badge">Listo</span>
                </div>
              </div>
            </details>
            <details class="filters mobile-collapse">
              <summary style="padding: 0 16px; cursor: pointer; font-weight: 600;">Filtros avanzados</summary>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding: 16px;">
                <label>Estado<select id="filterEstado"><option value="">Todos</option></select></label>
                <label>Prioridad<select id="filterPrioridad"><option value="">Todas</option></select></label>
                <label>Categoria<select id="filterCategoria"><option value="">Todas</option></select></label>
                <label>Buscar<input id="filterTexto" placeholder="Nombre, tel" /></label>
                <label>Zona<select id="filterZona"><option value="">Todas</option><option value="__sin_zona__">Sin zona</option></select></label>
                <label>Fuente<select id="filterFuente"><option value="">Todas</option><option value="__sin_fuente__">Sin fuente</option></select></label>
                <label>Estado comercial<select id="filterEstadoContacto"><option value="">Todos</option></select></label>
                <label>Caliente<select id="filterCaliente"><option value="">Todos</option><option value="true">Si</option><option value="false">No</option></select></label>
                <label>Vista<select id="filterOperativo"><option value="">Todos</option><option value="nuevo">Nuevos</option><option value="requiere_intervencion">Atención</option><option value="interesados">Interesados</option><option value="calientes">Calientes</option><option value="diagnostico_pagado">Pagados</option></select></label>
                <button id="clearFilters" style="grid-column: span 2;">Limpiar Filtros</button>
              </div>
            </details>
            <label class="lead-search" style="border-top: 1px solid var(--line); border-bottom: none;"><input id="leadSearch" placeholder="Buscar rápido..." /></label>
            <div class="table-wrap">
              <table>
                <thead><tr><th class="col-cb"><input type="checkbox" id="selectAllLeads" onchange="toggleSelectAll(this.checked)" /></th><th>Nombre</th><th>Info</th><th>Estado</th></tr></thead>
                <tbody id="leads"></tbody>
              </table>
            </div>
          </section>
          
          <div id="paneResizer" class="pane-resizer" role="separator"></div>
          
          <section class="detail show-chat-tab">
            <div class="detail-head">
              <div class="identity"><strong id="title">Selecciona un lead</strong><div id="subtitle" class="lead-meta"></div></div>
              <div style="margin-top: 8px;"><span id="botBadge" class="badge">IA</span> <span id="hotBadge" class="badge">Lead</span></div>
            </div>
            <div class="detail-tabs">
              <button type="button" class="tab-btn active" id="tabChat">💬 Chat</button>
              <button type="button" class="tab-btn" id="tabDatos">📝 Ficha del Lead</button>
            </div>
            <div class="actions">
              <button id="initialBtn" disabled>Mensaje inicial</button>
              <button id="editBtn" disabled>Editar</button>
              <button id="pauseBtn" disabled>Pausar IA</button>
              <button id="resumeBtn" disabled>Reanudar IA</button>
              <button id="contactedBtn" disabled>Marcar contactado</button>
              <button id="interestedBtn" disabled>Marcar interesado</button>
              <button id="paidBtn" disabled>Diagnostico pagado</button>
              <button class="danger" id="lostBtn" disabled>Perdido</button>
              <button class="danger" id="deleteBtn" disabled>Borrar</button>
            </div>
            <div id="context" class="context" style="padding: 24px; overflow: auto; display: none;"><div class="empty-state"><h3>Sin datos</h3><p>Selecciona un lead para ver su ficha.</p></div></div>
            <div id="messages" class="messages"><div class="empty-state"><h3>Bandeja vacía</h3><p>Selecciona un lead para ver el chat.</p></div></div>
            <form id="manualForm">
              <textarea id="manualText" placeholder="Escribe un mensaje..." disabled></textarea>
              <button class="primary" id="sendManual" disabled>Enviar</button>
            </form>
          </section>
        </main>
      </div>
    </div>
  </div>

  <div id="editModal" class="modal" aria-hidden="true">
    <div class="modal-panel" role="dialog">
      <div class="modal-head" style="padding: 24px; border-bottom: 1px solid var(--line);">
        <h2 id="editTitle">Editar prospecto</h2>
        <button id="closeEdit" type="button" style="border:none; background:transparent; font-size:20px;">✕</button>
      </div>
      <div id="editForm" class="edit-grid" style="padding: 24px; gap: 16px; display: grid; grid-template-columns: 1fr 1fr;"></div>
      <div class="modal-actions" style="padding: 24px; border-top: 1px solid var(--line); display:flex; justify-content: flex-end; gap: 12px;">
        <span id="editStatus" class="edit-status" style="margin-right:auto;"></span>
        <button id="cancelEdit" type="button">Cancelar</button>
        <button id="saveEdit" class="primary" type="button">Guardar</button>
      </div>
    </div>
  </div>
<script>
    // --- NUEVO SISTEMA DE NAVEGACION MODULAR (ESTILO SIMLA) ---
    const NAVIGATION_CONFIG = [
      { id: 'dashboard', icon: '📊', label: 'Dashboard', view: 'dashboard' },
      { id: 'ventas', icon: '🛒', label: 'Ventas', submenus: [
        { id: 'leads', label: 'Todos los Leads', view: 'leads' },
        { id: 'seguimiento', label: 'Seguimientos activos', view: 'seguimiento' },
        { id: 'bitacora', label: 'Bitácora general', view: 'bitacora' }
      ]},
      { id: 'chats', icon: '💬', label: 'Comunicaciones', view: 'chat' },
      { id: 'analiticas', icon: '📈', label: 'Analíticas', view: 'reportes' }
    ];

    let activeNavPrimary = 'dashboard';
    let activeNavSecondary = 'dashboard';

    function initNavigation() {
      const primaryContainer = document.getElementById('navPrimaryContainer');
      primaryContainer.innerHTML = NAVIGATION_CONFIG.map(item => 
        '<div class="nav-primary-item ' + (item.id === activeNavPrimary ? 'active' : '') + '" data-nav="' + item.id + '" title="' + item.label + '">' + item.icon + '</div>'
      ).join('');

      document.querySelectorAll('.nav-primary-item').forEach(el => {
        el.addEventListener('click', (e) => {
          const navId = e.currentTarget.dataset.nav;
          selectNavPrimary(navId);
        });
      });
    }

    function selectNavPrimary(navId) {
      activeNavPrimary = navId;
      document.querySelectorAll('.nav-primary-item').forEach(el => {
        el.classList.toggle('active', el.dataset.nav === navId);
      });

      const navConfig = NAVIGATION_CONFIG.find(n => n.id === navId);
      const sidebarSec = document.getElementById('sidebarSecondary');
      const secContainer = document.getElementById('navSecondaryContainer');
      const secTitle = document.getElementById('sidebarSecondaryTitle');

      if (navConfig.submenus && navConfig.submenus.length > 0) {
        // Mostrar submenu
        sidebarSec.classList.remove('collapsed');
        secTitle.textContent = navConfig.label;
        secContainer.innerHTML = navConfig.submenus.map(sub => 
          '<div class="nav-secondary-item" data-view="' + sub.view + '">' + sub.label + '</div>'
        ).join('');
        
        // Asignar eventos
        document.querySelectorAll('.nav-secondary-item').forEach(el => {
          el.addEventListener('click', (e) => {
            const view = e.currentTarget.dataset.view;
            document.querySelectorAll('.nav-secondary-item').forEach(n => n.classList.remove('active'));
            e.currentTarget.classList.add('active');
            setView(view);
            const foundSub = navConfig.submenus.find(s => s.view === view);
            document.getElementById('topbarTitle').textContent = navConfig.label + ' / ' + (foundSub ? foundSub.label : '');
          });
        });
        
        // Auto-seleccionar el primero si no hay activo
        const firstView = navConfig.submenus[0].view;
        secContainer.querySelector('.nav-secondary-item').classList.add('active');
        setView(firstView);
        document.getElementById('topbarTitle').textContent = navConfig.label + ' / ' + navConfig.submenus[0].label;

      } else if (navConfig.view) {
        // Ocultar submenu y cargar vista directa
        sidebarSec.classList.add('collapsed');
        setView(navConfig.view);
        document.getElementById('topbarTitle').textContent = navConfig.label;
      }
    }
    // ------------------------------------------------------------

    let conversaciones = [];
    let filtered = [];
    let selected = null;
    let currentView = "chat";
    let selectedLeads = new Set();
    let bulkInterval = null;
    let bulkActiveTelefonos = [];
    let detailCollapsed = false;
    let dashboardInfo = { eventos: [], objeciones: [] };
    const DEBUG_CRM = false;
    const estadosBase = ["prospectado","contactado","interesado","cliente_caliente","diagnostico_pagado","diagnostico_entregado","seguimiento","perdido","nuevo","mini_diagnostico"];
    const estadosContacto = ["Pendiente de contactar","Contactado","Respondió","Pidió información","Interesado","Diagnóstico ofrecido","Diagnóstico vendido","Activación ofrecida","Activación vendida","Control ON ofrecido","Cliente recurrente","Seguimiento","No interesado","Descartado"];
    const productosInteres = ["Sin dato","Diagnóstico ON","Activación ON","Control ON","Otro"];
    const estadosPago = ["Sin pago","Pendiente","Anticipo","Pagado","Vencido","Cancelado"];
    const page = document.getElementById("page");
    const leads = document.getElementById("leads");
    const paneResizer = document.getElementById("paneResizer");
    const toggleDetailPanel = document.getElementById("toggleDetailPanel");
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
    const leadSearch = document.getElementById("leadSearch");
    const manualText = document.getElementById("manualText");
    const sendManual = document.getElementById("sendManual");
    const actionIds = ["initialBtn","editBtn","pauseBtn","resumeBtn","contactedBtn","interestedBtn","paidBtn","lostBtn","deleteBtn"];
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

    const savedPaneWidth = localStorage.getItem("crmLeadPaneWidth");
    if (savedPaneWidth) document.documentElement.style.setProperty("--lead-pane-width", savedPaneWidth);

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
    window.copiarMensajeTexto = function(btn, texto) {
      if (!navigator.clipboard) {
        const textarea = document.createElement("textarea");
        textarea.value = texto;
        textarea.style.position = "fixed";
        document.body.appendChild(textarea);
        textarea.select();
        try {
          document.execCommand("copy");
          showSuccess(btn);
        } catch (err) {
          alert("Error al copiar texto");
        }
        document.body.removeChild(textarea);
        return;
      }
      navigator.clipboard.writeText(texto).then(() => {
        showSuccess(btn);
      }).catch(() => {
        alert("Error al copiar texto");
      });
    };
    function showSuccess(btn) {
      const originalText = btn.textContent;
      btn.textContent = "¡Copiado!";
      btn.style.background = "#d4ff3d";
      btn.style.color = "#1c2a0c";
      setTimeout(() => {
        btn.textContent = originalText;
        btn.style.background = "rgba(0,0,0,0.05)";
        btn.style.color = "";
      }, 1500);
    }
    function fmtDate(value) { return value ? new Date(value).toLocaleString("es-MX", { timeZone: "America/Mexico_City" }) : "sin datos"; }
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

    function soloDigitos(value) {
      return String(value || "").replace(/\D/g, "");
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

    function estadoLabel(estado) {
      const labels = {
        prospectado: "Prospectado",
        contactado: "Contactado",
        interesado: "Interesado",
        cliente_caliente: "Cliente caliente",
        diagnostico_pagado: "Diagnóstico pagado",
        diagnostico_entregado: "Diagnóstico entregado",
        seguimiento: "Seguimiento",
        perdido: "Perdido",
        requiere_intervencion: "Requiere intervención",
        nuevo: "Nuevo",
        mini_diagnostico: "Mini diagnóstico",
      };
      return labels[estado] || String(estado || "nuevo").replace(/_/g, " ");
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
      if(!NAVIGATION_CONFIG) return; // Prevent run before init
      currentView = view;
      page.classList.remove("mobile-chat-open", "show-mobile-context");
      page.className = "page view-" + view;
      
      const bitacoraView = document.getElementById("bitacoraView");
      if (bitacoraView) {
        bitacoraView.style.display = (view === "bitacora") ? "grid" : "none";
      }
      
      const mainEl = document.querySelector("main");
      if (mainEl) {
        mainEl.style.display = (view === "chat" || view === "leads") ? "grid" : "none";
      }
      
      if (detailCollapsed && !isMobile() && (view === "chat" || view === "leads")) page.classList.add("detail-collapsed");
      updateDetailToggle();
      // update nav visual state handled by selectNavPrimary
      renderLeads();
      if (view === "seguimiento") renderAttention();
      if (view === "dashboard") renderDashboard();
      if (view === "reportes") renderReports();
    }

    function isMobile() {
      return window.matchMedia && window.matchMedia("(max-width: 768px)").matches;
    }

    function updateDetailToggle() {
      const visible = !isMobile() && (currentView === "chat" || currentView === "leads");
      if (toggleDetailPanel) {
        toggleDetailPanel.hidden = !visible;
        toggleDetailPanel.textContent = detailCollapsed ? "Mostrar detalle" : "Ocultar detalle";
      }
      if (typeof page !== "undefined" && page) {
        page.classList.toggle("detail-collapsed", visible && detailCollapsed);
      }
    }

    function clearFilterValues() {
      document.getElementById("filterTexto").value = "";
      leadSearch.value = "";
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
        if (selected) await selectLead(selected.telefono, true);
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
      document.getElementById("dashboardPanels").innerHTML = renderDashboardPanel({ total, contactados, interesados, pagados, calientes });
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
      const noContactados = ["Pendiente de contactar", "nuevo", "Enviado", "Fallido", ""];
      return state && !noContactados.includes(state);
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
      const mobileLabels = { "Resp.": "Tasa respuesta", "Interes": "Tasa interes" };
      const labeledRows = rows.map(row => {
        let index = 0;
        return row.replace(/<td(.*?)>/g, (match, attrs) => {
          const label = mobileLabels[headers[index]] || headers[index] || "";
          index += 1;
          return '<td' + attrs + ' data-label="' + escapeHtml(label) + '">';
        });
      });
      return '<section class="dashboard-section"><h2>' + title + '</h2><div class="table-wrap"><table><thead><tr>' + headers.map(h => '<th>' + h + '</th>').join("") + '</tr></thead><tbody>' + (labeledRows.join("") || '<tr><td colspan="' + headers.length + '" data-label="">Sin datos.</td></tr>') + '</tbody></table></div></section>';
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
      if (DEBUG_CRM) console.log("CRM resumen reportes", { total, contactados, respondieron, interesados, seguimiento, cotizado, pagado });
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
      const atencion = conversaciones.filter(needsAttention).slice(0, 30);
      const interesados = conversaciones.filter(c => c.estado === "interesado" || c.estado === "cliente_caliente" || c.caliente === true || ["Interesado","Diagnóstico ofrecido","Activación ofrecida"].includes(commercialState(c))).slice(0, 30);
      const proximos = conversaciones.filter(c => c.fecha_siguiente_seguimiento || c.fecha_seguimiento).filter(c => !isOverdue(c)).sort((a, b) => new Date(a.fecha_siguiente_seguimiento || a.fecha_seguimiento || 0) - new Date(b.fecha_siguiente_seguimiento || b.fecha_seguimiento || 0)).slice(0, 30);
      const wrap = document.getElementById("attention");
      const card = (c) => '<article class="followup-card"><strong>' + escapeHtml(label(c)) + '</strong><div class="followup-meta">' + escapeHtml(c.telefono || 'sin telefono') + '<br>' + escapeHtml(commercialState(c) || c.estado || 'nuevo') + '<br>Ultimo: ' + escapeHtml(c.ultimo_mensaje || c.texto_ultimo_mensaje || 'sin mensaje') + '<br>Accion: ' + escapeHtml(c.siguiente_accion || c.proxima_accion || 'sin accion') + '<br>Seguimiento: ' + escapeHtml(c.fecha_siguiente_seguimiento ? fmtDate(c.fecha_siguiente_seguimiento) : (c.fecha_seguimiento ? fmtDate(c.fecha_seguimiento) : 'sin fecha')) + '</div><div class="followup-badges">' + (botOn(c) ? '<span class="badge on">IA ON</span>' : '<span class="badge off">IA OFF</span>') + (c.caliente ? '<span class="badge hot">Caliente</span>' : '') + (hasNewMessage(c) ? '<span class="badge new">Respondio</span>' : '') + (c.prioridad ? '<span class="badge">' + escapeHtml(c.prioridad) + '</span>' : '') + '</div><div class="followup-actions"><button data-follow-chat="' + escapeHtml(c.telefono) + '">Ver chat</button><button data-follow-status="contactado" data-tel="' + escapeHtml(c.telefono) + '">Contactado</button><button data-follow-status="interesado" data-tel="' + escapeHtml(c.telefono) + '">Interesado</button><button class="danger" data-follow-status="perdido" data-tel="' + escapeHtml(c.telefono) + '">Perdido</button><button data-follow-bot="' + escapeHtml(c.telefono) + '" data-value="' + (!botOn(c)) + '">' + (botOn(c) ? 'Pausar IA' : 'Reanudar IA') + '</button></div></article>';
      const block = (title, items, empty) => '<section class="followup-block"><h2>' + title + '</h2>' + (items.length ? items.map(card).join("") : '<span class="badge">' + empty + '</span>') + '</section>';
      wrap.innerHTML = '<div class="followup-board">' + [
        block("Requiere atencion", atencion, "Sin pendientes"),
        block("Interesados / calientes", interesados, "Sin interesados"),
        block("Proximos seguimientos", proximos, "Sin proximos seguimientos"),
      ].join("") + '</div>';
      wrap.querySelectorAll("[data-follow-chat]").forEach(btn => btn.addEventListener("click", () => { setView("chat"); selectLead(btn.dataset.followChat); }));
      wrap.querySelectorAll("[data-follow-status]").forEach(btn => btn.addEventListener("click", async () => { selected = conversaciones.find(c => c.telefono === btn.dataset.tel) || { telefono: btn.dataset.tel }; await setEstado(btn.dataset.followStatus); }));
      wrap.querySelectorAll("[data-follow-bot]").forEach(btn => btn.addEventListener("click", async () => { selected = conversaciones.find(c => c.telefono === btn.dataset.followBot) || { telefono: btn.dataset.followBot }; await setBot(btn.dataset.value === "true"); }));
    }

    function fillSelect(id, values, firstLabel) {
      const select = document.getElementById(id);
      const current = select.value;
      select.innerHTML = '<option value="">' + firstLabel + '</option>' + values.map(v => '<option value="' + escapeHtml(v) + '">' + escapeHtml(v) + '</option>').join("");
      select.value = current;
    }

    function fillZonaSelect() {
      const zonas = zonasDetectadas();
      if (DEBUG_CRM) console.log("CRM zonas detectadas", zonas);
      const select = document.getElementById("filterZona");
      const current = select.value;
      select.innerHTML = '<option value="">Todas las zonas</option><option value="__sin_zona__">Sin zona</option>' + zonas.map(z => '<option value="' + escapeHtml(z) + '">' + escapeHtml(z) + '</option>').join("");
      select.value = current && [...zonas, "__sin_zona__"].includes(current) ? current : "";
    }

    function fillFuenteSelect() {
      const fuentes = fuentesDetectadas();
      if (DEBUG_CRM) console.log("CRM fuentes detectadas", fuentes);
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
      if (leadSearch.value !== texto) leadSearch.value = texto;
      const textoDigitos = soloDigitos(texto);
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
          const haystack = [label(c), c.telefono, c.zona, c.fuente_busqueda, c.estado_contacto].map(v => String(v || "").toLowerCase()).join(" ");
          const telefonoDigitos = soloDigitos(c.telefono);
          const matchTelefono = textoDigitos && telefonoDigitos.includes(textoDigitos);
          if (!haystack.includes(texto) && !matchTelefono) return false;
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
      if (DEBUG_CRM) console.log("CRM filtros", { zona_seleccionada: zona || "Todas las zonas", fuente_seleccionada: fuente || "Todas las fuentes", estado_seleccionado: estadoContacto || estado || "Todos", leads_filtrados: filtered.length, seguimientos_vencidos: conversaciones.filter(isOverdue).length });
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
      leads.querySelectorAll(".lead-select-cb").forEach(cb => cb.addEventListener("change", () => {
        toggleSelectLead(cb.dataset.tel, cb.checked);
      }));
    }

    function renderLeads() {
      const leadActions = (telefono) => '<div class="lead-actions"><button type="button" data-chat="' + escapeHtml(telefono) + '">Ver chat</button><button type="button" data-edit="' + escapeHtml(telefono) + '">Editar</button><button class="danger" type="button" data-delete="' + escapeHtml(telefono) + '">Borrar</button></div>';
      const alertBadges = (c) => '<span class="badge state-' + escapeHtml(c.estado || 'nuevo') + '">' + escapeHtml(estadoLabel(c.estado || 'nuevo')) + '</span> ' + alertasLead(c).map(a => '<span class="badge off">' + escapeHtml(a) + '</span>').join(" ");
      if (currentView === "chat") {
        leads.innerHTML = filtered.map(c => {
          const pending = Number(c.respuestas_post_campana || c.mensajes_pendientes || 0);
          const newBadge = hasNewMessage(c) ? ' <span class="badge new">Respondio</span>' : '';
          const pendingBadge = hasNewMessage(c) ? ' <span class="badge new">(' + escapeHtml(pending) + ')</span>' : '';
          return '<tr class="' + (selected?.telefono === c.telefono ? 'active' : '') + '" data-tel="' + escapeHtml(c.telefono) + '"><td colspan="12"><div class="lead-line"><div class="lead-main"><span class="lead-name">' + escapeHtml(label(c)) + '</span>' + alertBadges(c) + newBadge + pendingBadge + (c.prioridad ? ' <span class="badge">' + escapeHtml(c.prioridad) + '</span>' : '') + '</div><div class="lead-meta">' + escapeHtml(c.telefono) + ' | ' + escapeHtml(zonaLabel(c.zona)) + ' | ' + escapeHtml(fuenteLabel(c.fuente_busqueda)) + '</div><div class="lead-next">Siguiente: ' + escapeHtml(safeDato(c.siguiente_accion)) + '</div><div class="lead-last"><strong>Ultimo mensaje:</strong> ' + escapeHtml(lastMessageLabel(c)) + '</div></div></td></tr>';
        }).join("") || '<tr><td colspan="12">Sin resultados</td></tr>';
        leads.querySelectorAll("tr[data-tel]").forEach(row => row.addEventListener("click", () => { selectLead(row.dataset.tel); page.classList.add("mobile-chat-open"); }));
        updateBulkSendUI();
        return;
      }
      if (isMobile()) {
        leads.innerHTML = filtered.map(c => {
          const pending = Number(c.respuestas_post_campana || c.mensajes_pendientes || 0);
          const isChecked = selectedLeads.has(c.telefono) ? "checked" : "";
          const checkboxHtml = currentView === "leads" ? '<input type="checkbox" class="lead-select-cb" data-tel="' + escapeHtml(c.telefono) + '" ' + isChecked + ' onclick="event.stopPropagation()" style="margin-right: 8px;" />' : '';
          return '<tr class="' + (selected?.telefono === c.telefono ? 'active' : '') + '" data-tel="' + escapeHtml(c.telefono) + '"><td colspan="12"><div class="lead-line"><div class="lead-main">' + checkboxHtml + '<span class="lead-name">' + escapeHtml(label(c)) + '</span>' + alertBadges(c) + (hasNewMessage(c) ? ' <span class="badge new">Respondio</span> <span class="badge new">(' + escapeHtml(pending) + ')</span>' : '') + (c.prioridad ? ' <span class="badge">' + escapeHtml(c.prioridad) + '</span>' : '') + '</div><div class="lead-meta">' + escapeHtml(c.telefono) + ' | ' + escapeHtml(zonaLabel(c.zona)) + ' | ' + escapeHtml(fuenteLabel(c.fuente_busqueda)) + ' | Score ' + escapeHtml(c.score || 'sin dato') + '</div><div class="lead-next">Siguiente: ' + escapeHtml(safeDato(c.siguiente_accion)) + '</div><div class="lead-actions"><button type="button" data-chat="' + escapeHtml(c.telefono) + '">Ver chat</button> <button type="button" data-initial="' + escapeHtml(c.telefono) + '">Enviar inicial</button></div></div></td></tr>';
        }).join("") || '<tr><td colspan="12">Sin resultados</td></tr>';
        leads.querySelectorAll("tr[data-tel] td").forEach(td => {
          const tel = td.parentElement.dataset.tel;
          td.querySelector(".lead-actions").insertAdjacentHTML("beforeend", ' <button type="button" data-edit="' + escapeHtml(tel) + '">Editar</button> <button class="danger" type="button" data-delete="' + escapeHtml(tel) + '">Borrar</button>');
        });
        bindLeadRowActions();
        leads.querySelectorAll("button[data-initial]").forEach(btn => btn.addEventListener("click", async (event) => { event.stopPropagation(); selected = conversaciones.find(c => c.telefono === btn.dataset.initial); if (selected) document.getElementById("initialBtn").click(); }));
        leads.querySelectorAll("tr[data-tel]").forEach(row => row.addEventListener("click", () => { selectLead(row.dataset.tel); page.classList.add("mobile-chat-open"); }));
        updateBulkSendUI();
        return;
      }
      leads.innerHTML = filtered.map(c => {
        const pending = Number(c.respuestas_post_campana || c.mensajes_pendientes || 0);
        const newBadge = hasNewMessage(c) ? ' <span class="badge new">Respondio</span>' : '';
        const pendingBadge = hasNewMessage(c) ? ' <span class="badge new">(' + escapeHtml(pending) + ')</span>' : '';
        const isChecked = selectedLeads.has(c.telefono) ? "checked" : "";
        return '<tr class="' + (selected?.telefono === c.telefono ? 'active' : '') + '" data-tel="' + escapeHtml(c.telefono) + '"><td class="col-cb"><input type="checkbox" class="lead-select-cb" data-tel="' + escapeHtml(c.telefono) + '" ' + isChecked + ' onclick="event.stopPropagation()" /></td><td><div class="lead-line"><div class="lead-main"><span class="lead-name">' + escapeHtml(label(c)) + '</span>' + alertBadges(c) + newBadge + pendingBadge + (c.prioridad ? ' <span class="badge">' + escapeHtml(c.prioridad) + '</span>' : '') + '</div><div class="lead-meta">' + escapeHtml(c.categoria || 'Sin nicho') + ' | Score ' + escapeHtml(c.score || 'sin dato') + '</div></div></td><td><span class="lead-meta">' + escapeHtml(c.telefono || 'Sin telefono') + '</span></td><td><span class="lead-meta">' + escapeHtml(zonaLabel(c.zona)) + '</span></td><td><span class="lead-meta">' + escapeHtml(fuenteLabel(c.fuente_busqueda)) + '</span></td><td>' + escapeHtml(commercialState(c) || 'Sin dato') + '</td><td><span class="lead-next">' + escapeHtml(safeDato(c.siguiente_accion)) + '</span></td><td><span class="lead-meta">' + escapeHtml(c.fecha_siguiente_seguimiento ? fmtDate(c.fecha_siguiente_seguimiento) : 'Sin dato') + '</span></td><td>' + escapeHtml(safeDato(c.producto_interesado)) + '<br><small>' + escapeHtml(money(c.monto_cotizado)) + '</small></td><td>' + escapeHtml(safeDato(c.estado_pago)) + '<br><small>Pagado ' + escapeHtml(money(c.monto_pagado)) + '</small><br>' + leadActions(c.telefono) + '</td></tr>';
      }).join("") || '<tr><td colspan="12">Sin resultados</td></tr>';
      bindLeadRowActions();
      leads.querySelectorAll("tr[data-tel]").forEach(row => row.addEventListener("click", () => selectLead(row.dataset.tel)));
      updateBulkSendUI();
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
      document.getElementById("saveFollowup")?.addEventListener("click", saveFollowup);
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



    function fillFuenteSelect() {
      const fuentes = fuentesDetectadas();
      if (DEBUG_CRM) console.log("CRM fuentes detectadas", fuentes);
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
      if (leadSearch.value !== texto) leadSearch.value = texto;
      const textoDigitos = soloDigitos(texto);
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
          const haystack = [label(c), c.telefono, c.zona, c.fuente_busqueda, c.estado_contacto].map(v => String(v || "").toLowerCase()).join(" ");
          const telefonoDigitos = soloDigitos(c.telefono);
          const matchTelefono = textoDigitos && telefonoDigitos.includes(textoDigitos);
          if (!haystack.includes(texto) && !matchTelefono) return false;
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
      if (DEBUG_CRM) console.log("CRM filtros", { zona_seleccionada: zona || "Todas las zonas", fuente_seleccionada: fuente || "Todas las fuentes", estado_seleccionado: estadoContacto || estado || "Todos", leads_filtrados: filtered.length, seguimientos_vencidos: conversaciones.filter(isOverdue).length });
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
      leads.querySelectorAll(".lead-select-cb").forEach(cb => cb.addEventListener("change", () => {
        toggleSelectLead(cb.dataset.tel, cb.checked);
      }));
    }

    function renderLeads() {
      const leadActions = (telefono) => '<div class="lead-actions"><button type="button" data-chat="' + escapeHtml(telefono) + '">Ver chat</button><button type="button" data-edit="' + escapeHtml(telefono) + '">Editar</button><button class="danger" type="button" data-delete="' + escapeHtml(telefono) + '">Borrar</button></div>';
      const alertBadges = (c) => '<span class="badge state-' + escapeHtml(c.estado || 'nuevo') + '">' + escapeHtml(estadoLabel(c.estado || 'nuevo')) + '</span> ' + alertasLead(c).map(a => '<span class="badge off">' + escapeHtml(a) + '</span>').join(" ");
      if (currentView === "chat") {
        leads.innerHTML = filtered.map(c => {
          const pending = Number(c.respuestas_post_campana || c.mensajes_pendientes || 0);
          const newBadge = hasNewMessage(c) ? ' <span class="badge new">Respondio</span>' : '';
          const pendingBadge = hasNewMessage(c) ? ' <span class="badge new">(' + escapeHtml(pending) + ')</span>' : '';
          return '<tr class="' + (selected?.telefono === c.telefono ? 'active' : '') + '" data-tel="' + escapeHtml(c.telefono) + '"><td colspan="12"><div class="lead-line"><div class="lead-main"><span class="lead-name">' + escapeHtml(label(c)) + '</span>' + alertBadges(c) + newBadge + pendingBadge + (c.prioridad ? ' <span class="badge">' + escapeHtml(c.prioridad) + '</span>' : '') + '</div><div class="lead-meta">' + escapeHtml(c.telefono) + ' | ' + escapeHtml(zonaLabel(c.zona)) + ' | ' + escapeHtml(fuenteLabel(c.fuente_busqueda)) + '</div><div class="lead-next">Siguiente: ' + escapeHtml(safeDato(c.siguiente_accion)) + '</div><div class="lead-last"><strong>Ultimo mensaje:</strong> ' + escapeHtml(lastMessageLabel(c)) + '</div></div></td></tr>';
        }).join("") || '<tr><td colspan="12">Sin resultados</td></tr>';
        leads.querySelectorAll("tr[data-tel]").forEach(row => row.addEventListener("click", () => { selectLead(row.dataset.tel); page.classList.add("mobile-chat-open"); }));
        updateBulkSendUI();
        return;
      }
      if (isMobile()) {
        leads.innerHTML = filtered.map(c => {
          const pending = Number(c.respuestas_post_campana || c.mensajes_pendientes || 0);
          const isChecked = selectedLeads.has(c.telefono) ? "checked" : "";
          const checkboxHtml = currentView === "leads" ? '<input type="checkbox" class="lead-select-cb" data-tel="' + escapeHtml(c.telefono) + '" ' + isChecked + ' onclick="event.stopPropagation()" style="margin-right: 8px;" />' : '';
          return '<tr class="' + (selected?.telefono === c.telefono ? 'active' : '') + '" data-tel="' + escapeHtml(c.telefono) + '"><td colspan="12"><div class="lead-line"><div class="lead-main">' + checkboxHtml + '<span class="lead-name">' + escapeHtml(label(c)) + '</span>' + alertBadges(c) + (hasNewMessage(c) ? ' <span class="badge new">Respondio</span> <span class="badge new">(' + escapeHtml(pending) + ')</span>' : '') + (c.prioridad ? ' <span class="badge">' + escapeHtml(c.prioridad) + '</span>' : '') + '</div><div class="lead-meta">' + escapeHtml(c.telefono) + ' | ' + escapeHtml(zonaLabel(c.zona)) + ' | ' + escapeHtml(fuenteLabel(c.fuente_busqueda)) + ' | Score ' + escapeHtml(c.score || 'sin dato') + '</div><div class="lead-next">Siguiente: ' + escapeHtml(safeDato(c.siguiente_accion)) + '</div><div class="lead-actions"><button type="button" data-chat="' + escapeHtml(c.telefono) + '">Ver chat</button> <button type="button" data-initial="' + escapeHtml(c.telefono) + '">Enviar inicial</button></div></div></td></tr>';
        }).join("") || '<tr><td colspan="12">Sin resultados</td></tr>';
        leads.querySelectorAll("tr[data-tel] td").forEach(td => {
          const tel = td.parentElement.dataset.tel;
          td.querySelector(".lead-actions").insertAdjacentHTML("beforeend", ' <button type="button" data-edit="' + escapeHtml(tel) + '">Editar</button> <button class="danger" type="button" data-delete="' + escapeHtml(tel) + '">Borrar</button>');
        });
        bindLeadRowActions();
        leads.querySelectorAll("button[data-initial]").forEach(btn => btn.addEventListener("click", async (event) => { event.stopPropagation(); selected = conversaciones.find(c => c.telefono === btn.dataset.initial); if (selected) document.getElementById("initialBtn").click(); }));
        leads.querySelectorAll("tr[data-tel]").forEach(row => row.addEventListener("click", () => { selectLead(row.dataset.tel); page.classList.add("mobile-chat-open"); }));
        updateBulkSendUI();
        return;
      }
      leads.innerHTML = filtered.map(c => {
        const pending = Number(c.respuestas_post_campana || c.mensajes_pendientes || 0);
        const newBadge = hasNewMessage(c) ? ' <span class="badge new">Respondio</span>' : '';
        const pendingBadge = hasNewMessage(c) ? ' <span class="badge new">(' + escapeHtml(pending) + ')</span>' : '';
        const isChecked = selectedLeads.has(c.telefono) ? "checked" : "";
        return '<tr class="' + (selected?.telefono === c.telefono ? 'active' : '') + '" data-tel="' + escapeHtml(c.telefono) + '"><td class="col-cb"><input type="checkbox" class="lead-select-cb" data-tel="' + escapeHtml(c.telefono) + '" ' + isChecked + ' onclick="event.stopPropagation()" /></td><td><div class="lead-line"><div class="lead-main"><span class="lead-name">' + escapeHtml(label(c)) + '</span>' + alertBadges(c) + newBadge + pendingBadge + (c.prioridad ? ' <span class="badge">' + escapeHtml(c.prioridad) + '</span>' : '') + '</div><div class="lead-meta">' + escapeHtml(c.categoria || 'Sin nicho') + ' | Score ' + escapeHtml(c.score || 'sin dato') + '</div></div></td><td><span class="lead-meta">' + escapeHtml(c.telefono || 'Sin telefono') + '</span></td><td><span class="lead-meta">' + escapeHtml(zonaLabel(c.zona)) + '</span></td><td><span class="lead-meta">' + escapeHtml(fuenteLabel(c.fuente_busqueda)) + '</span></td><td>' + escapeHtml(commercialState(c) || 'Sin dato') + '</td><td><span class="lead-next">' + escapeHtml(safeDato(c.siguiente_accion)) + '</span></td><td><span class="lead-meta">' + escapeHtml(c.fecha_siguiente_seguimiento ? fmtDate(c.fecha_siguiente_seguimiento) : 'Sin dato') + '</span></td><td>' + escapeHtml(safeDato(c.producto_interesado)) + '<br><small>' + escapeHtml(money(c.monto_cotizado)) + '</small></td><td>' + escapeHtml(safeDato(c.estado_pago)) + '<br><small>Pagado ' + escapeHtml(money(c.monto_pagado)) + '</small><br>' + leadActions(c.telefono) + '</td></tr>';
      }).join("") || '<tr><td colspan="12">Sin resultados</td></tr>';
      bindLeadRowActions();
      leads.querySelectorAll("tr[data-tel]").forEach(row => row.addEventListener("click", () => selectLead(row.dataset.tel)));
      updateBulkSendUI();
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
      document.getElementById("saveFollowup")?.addEventListener("click", saveFollowup);
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
      openEdit.trigger = document.activeElement;
      editStatus.textContent = "";
      renderEditForm();
      editModal.setAttribute("aria-hidden", "false");
      editModal.classList.add("open");
      document.getElementById("closeEdit").focus();
    }

    function closeEdit() {
      const trigger = openEdit.trigger;
      if (editModal.contains(document.activeElement)) document.activeElement.blur();
      editModal.classList.remove("open");
      editModal.setAttribute("aria-hidden", "true");
      if (trigger && typeof trigger.focus === "function" && document.contains(trigger)) trigger.focus();
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
      if (DEBUG_CRM) console.log("CRM lead_update payload", { telefono_original: selected.telefono, updates });
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
      await selectLead(selected.telefono, true);
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
        if (title) title.textContent = "Selecciona un lead";
        if (subtitle) subtitle.textContent = "";
        if (context) context.innerHTML = '<div class="empty">Sin lead seleccionado.</div>';
        if (messages) messages.innerHTML = '<div class="empty">Sin conversacion seleccionada.</div>';
        actionIds.forEach(id => {
          const el = document.getElementById(id);
          if (el) el.disabled = true;
        });
      }
      await loadConversaciones();
    }

    async function selectLead(telefono, isSilent = false) {
      selected = conversaciones.find(c => c.telefono === telefono) || { telefono };
      if ((currentView === "chat" || currentView === "leads") && isMobile()) {
        if (typeof page !== "undefined" && page) page.classList.add("mobile-chat-open");
      }
      renderLeads();
      if (title) title.textContent = label(selected);
      if (subtitle) subtitle.textContent = selected.telefono + " | " + (selected.estado || "nuevo") + " | " + fmtDate(selected.fecha_ultimo_mensaje);
      if (botBadge) botBadge.textContent = botOn(selected) ? "IA ON" : "IA OFF";
      if (botBadge) botBadge.className = "badge " + (botOn(selected) ? "on" : "off");
      if (hotBadge) hotBadge.textContent = selected.caliente ? "Caliente" : "Lead";
      if (hotBadge) hotBadge.className = "badge " + (selected.caliente ? "hot" : "");
      actionIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.disabled = false;
      });
      
      const revisarWaBtn = document.getElementById("revisarWaBtn");
      const sinWaBtn = document.getElementById("sinWaBtn");
      if (selected) {
        const estadoContacto = String(selected.estado_contacto || "").trim();
        const sigAccion = String(selected.siguiente_accion || "").trim();
        if (estadoContacto === "No entregado" || sigAccion === "Revisar WhatsApp") {
          if (revisarWaBtn) revisarWaBtn.style.display = "inline-block";
          if (sinWaBtn) sinWaBtn.style.display = "inline-block";
        } else {
          if (revisarWaBtn) revisarWaBtn.style.display = "none";
          if (sinWaBtn) sinWaBtn.style.display = "none";
        }
      } else {
        if (revisarWaBtn) revisarWaBtn.style.display = "none";
        if (sinWaBtn) sinWaBtn.style.display = "none";
      }

      if (manualText) manualText.disabled = false;
      if (sendManual) sendManual.disabled = false;
      renderContext(selected);
      
      if (!isSilent) {
        if (messages) messages.innerHTML = '<div class="empty">Cargando mensajes...</div>';
      }
      
      const res = await actionFetch("mensajes", { telefono });
      const data = await res.json();
      const items = data.mensajes || [];
      if (messages) {
        messages.innerHTML = items.map(m => {
          const textEscaped = escapeHtml(m.mensaje);
          const uriText = encodeURIComponent(m.mensaje).replace(/'/g, "%27");
          return '<div class="msg ' + m.direccion + '">' + 
                   textEscaped + 
                   '<div style="display:flex; justify-content:space-between; align-items:center; margin-top:6px; gap:8px;">' +
                     '<small>' + m.direccion + ' | ' + fmtDate(m.created_at) + '</small>' +
                     '<button type="button" class="copy-msg-btn" style="min-height:20px; padding:2px 6px; font-size:10px; border-radius:4px; background:rgba(0,0,0,0.05); border:none; cursor:pointer;" onclick="copiarMensajeTexto(this, decodeURIComponent(\\\'' + uriText + '\\\'))">Copiar</button>' +
                   '</div>' +
                 '</div>';
        }).join("") || '<div class="empty">Sin mensajes guardados.</div>';
        messages.scrollTop = messages.scrollHeight;
      }
    }

    async function setBot(value) {
      if (!selected) return;
      await actionFetch("bot_enabled", { telefono: selected.telefono, bot_enabled: value });
      await loadConversaciones();
    }

    async function setEstado(estado) {
      if (!selected) return;
      console.log("CRM lead_estado click", { action: "lead_estado", telefono: selected.telefono, estado });
      const res = await actionFetch("lead_estado", { telefono: selected.telefono, estado });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        console.error("CRM lead_estado error", { telefono: selected.telefono, estado, status: res.status, error: data.error });
        alert(data.error || "No se pudo actualizar el estado.");
        return;
      }
      await loadConversaciones();
    }

    document.getElementById("fileInput")?.addEventListener("change", async (event) => {
      const file = event.target.files[0];
      if (file) importText.value = await file.text();
    });

    document.getElementById("importBtn")?.addEventListener("click", async () => {
      const contenido = importText.value.trim();
      if (!contenido) return;
      importStatus.textContent = "Importando";
      const res = await actionFetch("importar_prospector", { contenido });
      const data = await res.json();
      importStatus.textContent = res.ok ? "Importados: " + data.importados : "Error";
      if (res.ok) { importText.value = ""; await loadConversaciones(); }
    });

    document.getElementById("initialBtn")?.addEventListener("click", async () => {
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
    document.getElementById("editBtn")?.addEventListener("click", openEdit);
    document.getElementById("closeEdit")?.addEventListener("click", closeEdit);
    document.getElementById("cancelEdit")?.addEventListener("click", closeEdit);
    document.getElementById("saveEdit")?.addEventListener("click", saveEdit);
    document.getElementById("pauseBtn")?.addEventListener("click", () => setBot(false));
    document.getElementById("resumeBtn")?.addEventListener("click", () => setBot(true));
    document.getElementById("contactedBtn")?.addEventListener("click", () => setEstado("contactado"));
    document.getElementById("interestedBtn")?.addEventListener("click", () => setEstado("interesado"));
    document.getElementById("lostBtn")?.addEventListener("click", () => setEstado("perdido"));
    document.getElementById("paidBtn")?.addEventListener("click", () => setEstado("diagnostico_pagado"));
    document.getElementById("deleteBtn")?.addEventListener("click", () => deleteLead());
    document.getElementById("revisarWaBtn")?.addEventListener("click", () => {
      if (selected) {
        let d = String(selected.telefono || "").replace(/\D/g, "");
        if (d.length === 10) d = "52" + d;
        window.open("https://wa.me/" + d, "_blank");
      }
    });
    document.getElementById("sinWaBtn")?.addEventListener("click", async () => {
      if (!selected) return;
      if (!confirm("¿Marcar prospecto sin WhatsApp?")) return;
      const res = await actionFetch("marcar_sin_whatsapp", { telefono: selected.telefono });
      const data = await res.json();
      if (res.ok && data.ok) {
        await loadConversaciones();
        await selectLead(selected.telefono);
      } else {
        alert(data.error || "No se pudo marcar sin WhatsApp");
      }
    });
    document.getElementById("refresh")?.addEventListener("click", loadConversaciones);
    document.querySelectorAll(".nav-btn").forEach(btn => btn.addEventListener("click", () => setView(btn.dataset.view)));
    const selectAllCbElement = document.getElementById("selectAllLeads");
    if (selectAllCbElement) {
      selectAllCbElement.addEventListener("change", (event) => {
        toggleSelectAll(event.target.checked);
      });
    }
    document.getElementById("btnBulkSend")?.addEventListener("click", () => {
      if (selectedLeads.size === 0) return;
      if (confirm("¿Enviar mensaje inicial a los " + selectedLeads.size + " leads seleccionados?\\n(Nota: Los leads ya contactados o sin nombre se omitirán automáticamente)")) {
        startBulkSend(Array.from(selectedLeads));
      }
    });
    toggleDetailPanel?.addEventListener("click", () => {
      detailCollapsed = !detailCollapsed;
      updateDetailToggle();
    });
    window.addEventListener("resize", updateDetailToggle);
    document.getElementById("backToLeads")?.addEventListener("click", () => page.classList.remove("mobile-chat-open", "show-mobile-context"));
    document.getElementById("toggleLeadData")?.addEventListener("click", () => page.classList.toggle("show-mobile-context"));
    
    // Desktop tabs switching logic
    const tabChat = document.getElementById("tabChat");
    const tabDatos = document.getElementById("tabDatos");
    const detailPanel = document.querySelector(".detail");
    if (tabChat && tabDatos && detailPanel) {
      tabChat.addEventListener("click", () => {
        tabChat.classList.add("active");
        tabDatos.classList.remove("active");
        detailPanel.classList.add("show-chat-tab");
        detailPanel.classList.remove("show-datos-tab");
      });
      tabDatos.addEventListener("click", () => {
        tabDatos.classList.add("active");
        tabChat.classList.remove("active");
        detailPanel.classList.add("show-datos-tab");
        detailPanel.classList.remove("show-chat-tab");
      });
    }

    document.getElementById("clearFilters")?.addEventListener("click", () => {
      clearFilterValues();
      applyFilters();
    });
    paneResizer?.addEventListener("pointerdown", (event) => {
      if (isMobile()) return;
      event.preventDefault();
      paneResizer.setPointerCapture(event.pointerId);
      document.body.classList.add("resizing-pane");
      const resize = (moveEvent) => {
        const width = Math.min(Math.max(moveEvent.clientX, 360), Math.round(window.innerWidth * 0.82));
        const value = width + "px";
        document.documentElement.style.setProperty("--lead-pane-width", value);
        localStorage.setItem("crmLeadPaneWidth", value);
      };
      const stop = () => {
        document.body.classList.remove("resizing-pane");
        paneResizer.removeEventListener("pointermove", resize);
        paneResizer.removeEventListener("pointerup", stop);
        paneResizer.removeEventListener("pointercancel", stop);
      };
      paneResizer?.addEventListener("pointermove", resize);
      paneResizer?.addEventListener("pointerup", stop);
      paneResizer?.addEventListener("pointercancel", stop);
    });
    ["filterEstado","filterPrioridad","filterCategoria","filterZona","filterFuente","filterEstadoContacto","filterCaliente","filterOperativo"].forEach(id => document.getElementById(id)?.addEventListener("change", applyFilters));
    document.getElementById("filterTexto")?.addEventListener("input", applyFilters);
    leadSearch?.addEventListener("input", () => {
      document.getElementById("filterTexto").value = leadSearch.value;
      applyFilters();
    });

    document.getElementById("manualForm")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const mensaje = manualText.value.trim();
      if (!selected || !mensaje) return;
      sendManual.disabled = true;
      await actionFetch("enviar_manual", { telefono: selected.telefono, mensaje });
      manualText.value = "";
      sendManual.disabled = false;
      await loadConversaciones();
    });

    const bitacoraView = document.getElementById("bitacoraView");
    
    function volverBitacora() {
      setView("chat");
    }

    async function abrirBitacora() {
      let titleText = "Bitácora global";

      setView("bitacora");
      bitacoraView.style.display = "grid";
      bitacoraView.innerHTML = '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 16px;">' +
                                 '<h2 style="margin:0;">' + escapeHtml(titleText) + '</h2>' +
                                 '<button type="button" onclick="volverBitacora()">Volver</button>' +
                               '</div>' +
                               '<div id="bitacoraContent" style="display:grid; gap:12px; align-content:start;"><span class="badge">Cargando bitácora...</span></div>';

      const bitacoraContent = document.getElementById("bitacoraContent");
      
      try {
        const response = await apiFetch('/api/crm-actions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'bitacora_global' })
        });
        
        if (!response.ok) throw new Error('Error en el servidor');
        const data = await response.json();
        let eventos = data.eventos || [];
        

        
        if (eventos.length === 0) {
          bitacoraContent.innerHTML = '<span class="badge">Sin eventos registrados</span>';
          return;
        }
        
        function normTel(t) {
          let d = String(t || "").replace(/\D/g, "");
          if (d.length === 10) d = "52" + d;
          if (d.length === 12 && d.startsWith("52") && !d.startsWith("521")) d = "521" + d.slice(2);
          return d;
        }
        const grupos = {};
        eventos.forEach(e => {
          const tel = normTel(e.telefono);
          if (!tel) return;
          if (!grupos[tel]) grupos[tel] = { telefono: tel, nombre: e.nombre || null, eventos: [] };
          grupos[tel].eventos.push(e);
        });
        function clasificar(e) {
          const meta = e.metadata || {};
          const statusVal = meta.whatsapp_status?.status || meta.status;
          if (e.tipo === "whatsapp_status" && statusVal === "delivered") return { etapa: "entregado", label: "Entregado", clase: "on" };
          if (e.tipo === "whatsapp_status" && statusVal === "read") return { etapa: "leido", label: "Leído", clase: "on" };
          if (e.tipo === "whatsapp_status" && statusVal === "sent") return { etapa: "enviado", label: "Enviado", clase: "new" };
          if (e.tipo === "whatsapp_failed") return { etapa: "fallido", label: "No entregado", clase: "off" };
          if (e.tipo === "mensaje_entrante" || e.tipo === "lead_respondio") return { etapa: "respondio", label: "Respondió", clase: "hot" };
          if (e.tipo === "mensaje_inicial_enviado") return { etapa: "inicial", label: "Mensaje enviado", clase: "new" };
          return null;
        }
        const ordenEtapas = ["inicial", "enviado", "entregado", "fallido", "leido", "respondio"];

        const tarjetas = Object.values(grupos).map(function(g) {
          g.eventos.sort(function(a, b) { return new Date(a.created_at) - new Date(b.created_at); });
          const etapasPresentes = {};
          g.eventos.forEach(function(e) {
            const c = clasificar(e);
            if (c) etapasPresentes[c.etapa] = Object.assign({}, c, { fecha: e.created_at });
          });
          if (Object.keys(etapasPresentes).length === 0) return "";
          const badges = ordenEtapas.filter(function(et) { return etapasPresentes[et]; }).map(function(et) {
            const info = etapasPresentes[et];
            return '<span class="badge ' + info.clase + '">' + escapeHtml(info.label) + ' · ' + fmtDate(info.fecha) + '</span>';
          }).join(" ");
          const lead = conversaciones.find(c => normTel(c.telefono) === normTel(g.telefono));
          const nombreClean = (lead && lead.nombre && String(lead.nombre).trim() && String(lead.nombre).toLowerCase() !== "sin_dato") ? String(lead.nombre).trim() : null;
          const displayHeader = nombreClean ? (nombreClean.toUpperCase() + ' · ' + g.telefono) : g.telefono;
          const telAbrir = lead && lead.telefono ? lead.telefono : g.telefono;
          return '<div class="followup-card" data-bitacora-chat="' + escapeHtml(telAbrir) + '" title="Abrir lead" style="cursor:pointer;"><strong>' + escapeHtml(displayHeader) + '</strong><div class="followup-meta">' + escapeHtml(g.telefono) + '</div><div class="followup-badges">' + badges + '</div></div>';
        }).filter(function(t) { return t; });

        bitacoraContent.innerHTML = tarjetas.length
          ? '<div class="followup-board" style="grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));">' + tarjetas.join("") + '</div>'
          : '<span class="badge">Sin eventos registrados</span>';

        bitacoraContent.querySelectorAll("[data-bitacora-chat]").forEach(card => {
          card.addEventListener("click", () => {
            const tel = card.dataset.bitacoraChat;
            if (!tel) return;
            setView("chat");
            selectLead(tel);
          });
        });
        
      } catch (error) {
        console.error('Error:', error);
        bitacoraContent.innerHTML = '<span class="badge off">No se pudo cargar la bitácora. Verifica la consola.</span>';
      }
    }

    async function agregarLead() {
      const nombre = document.getElementById('nombreLead').value.trim();
      const telefono = document.getElementById('telLead').value.trim();
      const zona = document.getElementById('zonaLead').value.trim();
      
      if (!nombre || !telefono) {
        alert('El nombre y el teléfono son requeridos.');
        return;
      }
      
      try {
        const response = await apiFetch('/api/crm-actions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'importar_prospector',
            rows: [{ nombre, telefono, zona }]
          })
        });
        
        if (!response.ok) throw new Error('Error al registrar lead');
        const data = await response.json();
        if (data.ok) {
          alert('Lead agregado con éxito.');
          document.getElementById('nombreLead').value = '';
          document.getElementById('telLead').value = '';
          document.getElementById('zonaLead').value = '';
          await loadConversaciones();
        } else {
          alert('Error: ' + (data.error || 'No se pudo agregar el lead.'));
        }
      } catch (error) {
        console.error('Error:', error);
        alert('Error al agregar el lead. Verifica la consola.');
      }
    }

    function toggleSelectLead(telefono, checked) {
      if (checked) {
        selectedLeads.add(telefono);
      } else {
        selectedLeads.delete(telefono);
      }
      document.querySelectorAll(".lead-select-cb[data-tel='" + telefono + "']").forEach(cb => cb.checked = checked);
      updateBulkSendUI();
    }

    function toggleSelectAll(checked) {
      if (checked) {
        filtered.forEach(c => {
          if (c.telefono) selectedLeads.add(c.telefono);
        });
      } else {
        filtered.forEach(c => {
          if (c.telefono) selectedLeads.delete(c.telefono);
        });
      }
      document.querySelectorAll(".lead-select-cb").forEach(cb => {
        const tel = cb.dataset.tel;
        if (tel) cb.checked = selectedLeads.has(tel);
      });
      updateBulkSendUI();
    }

    function updateBulkSendUI() {
      const container = document.getElementById("bulkSendContainer");
      const countSpan = document.getElementById("bulkSelectedCount");
      const selectAllCb = document.getElementById("selectAllLeads");
      if (!container) return;
      if (currentView === "leads" && selectedLeads.size > 0) {
        container.style.display = "flex";
      } else {
        container.style.display = "none";
      }
      if (countSpan) {
        countSpan.textContent = selectedLeads.size + " leads seleccionados";
      }
      if (selectAllCb) {
        const visibleTels = filtered.map(c => c.telefono).filter(Boolean);
        if (visibleTels.length > 0 && visibleTels.every(tel => selectedLeads.has(tel))) {
          selectAllCb.checked = true;
          selectAllCb.indeterminate = false;
        } else if (visibleTels.some(tel => selectedLeads.has(tel))) {
          selectAllCb.checked = false;
          selectAllCb.indeterminate = true;
        } else {
          selectAllCb.checked = false;
          selectAllCb.indeterminate = false;
        }
      }
    }

    async function startBulkSend(telefonosArray) {
      if (!telefonosArray || !telefonosArray.length) return;
      const btn = document.getElementById("btnBulkSend");
      const progress = document.getElementById("bulkProgress");
      
      btn.disabled = true;
      progress.style.display = "inline";
      progress.textContent = "Preparando lote...";
      
      try {
        const res = await actionFetch("encolar_lote_manual", { telefonos: telefonosArray });
        const data = await res.json();
        if (!res.ok || !data.ok) {
          alert(data.error || "No se pudo encolar el lote");
          btn.disabled = false;
          progress.style.display = "none";
          return;
        }
        
        const totalEnqueued = data.encolados ? data.encolados.length : 0;
        const yaContactadosCount = data.ya_contactados ? data.ya_contactados.length : 0;
        const sinNombreCount = data.sin_nombre ? data.sin_nombre.length : 0;
        
        alert("Lote procesado en backend:\\n" +
              "- Encolados para envío: " + totalEnqueued + "\\n" +
              "- Omitidos por ya estar contactados: " + yaContactadosCount + "\\n" +
              "- Omitidos por falta de nombre: " + sinNombreCount);
              
        selectedLeads.clear();
        updateBulkSendUI();
        
        const selectAllCb = document.getElementById("selectAllLeads");
        if (selectAllCb) selectAllCb.checked = false;
        
        await loadConversaciones();
        
        if (totalEnqueued > 0) {
          bulkActiveTelefonos = data.encolados;
          progress.textContent = "Procesando: 0 de " + bulkActiveTelefonos.length + " listos...";
          if (bulkInterval) clearInterval(bulkInterval);
          bulkInterval = setInterval(pollBulkStatus, 6000);
        } else {
          btn.disabled = false;
          progress.style.display = "none";
        }
      } catch (e) {
        console.error(e);
        alert("Error al iniciar el envío en lote");
        btn.disabled = false;
        progress.style.display = "none";
      }
    }

    async function pollBulkStatus() {
      if (!bulkActiveTelefonos || !bulkActiveTelefonos.length) {
        if (bulkInterval) clearInterval(bulkInterval);
        const progress = document.getElementById("bulkProgress");
        const btn = document.getElementById("btnBulkSend");
        if (progress) progress.style.display = "none";
        if (btn) btn.disabled = false;
        return;
      }
      
      try {
        const res = await actionFetch("cola_envios_batch_status", { telefonos: bulkActiveTelefonos });
        const data = await res.json();
        if (!res.ok || !data.ok) return;
        
        const estados = data.estados || [];
        const estadoMap = new Map(estados.map(item => [item.telefono, item.estado]));
        
        let completados = 0;
        let pendientes = 0;
        let fallidos = 0;
        
        bulkActiveTelefonos.forEach(tel => {
          const est = estadoMap.get(tel);
          if (!est || (est !== "pendiente" && est !== "procesando")) {
            completados++;
            if (est === "fallido_descartado" || est === "fallido") {
              fallidos++;
            }
          } else {
            pendientes++;
          }
        });
        
        const progress = document.getElementById("bulkProgress");
        if (progress) {
          progress.textContent = "Progreso: " + completados + " de " + bulkActiveTelefonos.length + " procesados...";
        }
        
        if (pendientes === 0) {
          if (bulkInterval) clearInterval(bulkInterval);
          if (progress) {
            progress.textContent = "¡Tanda completada! (" + completados + " procesados)";
            setTimeout(() => {
              progress.style.display = "none";
              const btn = document.getElementById("btnBulkSend");
              if (btn) btn.disabled = false;
            }, 5000);
          }
          await loadConversaciones();
        }
      } catch (e) {
        console.error("Error polling bulk status:", e);
      }
    }

    try {
      // 1. CONSTRUCCIÓN DEL DOM (Primero se crean los elementos del menú)
      initNavigation();
      
      if (typeof isMobile === 'function' && isMobile()) {
        document.querySelectorAll(".mobile-collapse").forEach(el => el.removeAttribute("open"));
      }

      // 2. ASEGURAR REFERENCIA DE LA VARIABLE 'page'
      // Si 'page' no está declarada globalmente arriba, la asignamos de forma segura aquí:
      if (typeof page === 'undefined' || !page) {
        window.page = document.getElementById('page') || document.querySelector('.page') || document.body;
      }

      // 3. DETERMINAR Y CONFIGURAR VISTA INICIAL
      const initialView = (location.hash || "#dashboard").replace("#", "");
      const validViews = ["chat", "seguimiento", "leads", "dashboard", "reportes"];
      
      if (validViews.includes(initialView)) {
        // Se ejecuta setView ahora que el menú existe en el DOM
        setView(initialView);
        
        if (typeof NAVIGATION_CONFIG !== 'undefined' && typeof selectNavPrimary === 'function') {
          // Mapeo para activar el botón correcto del menú principal
          const parentMenu = NAVIGATION_CONFIG.find(item => item.submenus?.some(sub => sub.view === initialView));
          const primaryToActivate = parentMenu ? parentMenu.id : (initialView === 'chat' ? 'dashboard' : initialView);
          
          selectNavPrimary(primaryToActivate);
        }
      } else {
        // Fallback seguro si el hash no es válido
        setView("dashboard");
        if (typeof selectNavPrimary === 'function') selectNavPrimary("dashboard");
      }
      
      // 4. LLAMADAS ASÍNCRONAS DE DATOS (Al final para no bloquear la UI)
      if (typeof loadConversaciones === 'function') {
        loadConversaciones();
      }

    } catch (error) {
      console.error("🚨 Error crítico en la secuencia de arranque del CRM:", error);
    }
  </script>
</body>
</html>`);
};
