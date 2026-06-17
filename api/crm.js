module.exports = async (req, res) => {
  if (req.method !== "GET") return res.status(405).send("Method Not Allowed");

  // Insertar Formulario Manual
  const formularioManual = `
<div style="margin: 10px 16px; padding: 12px 14px; border: 1px solid var(--line); border-radius: var(--radius); background: var(--panel-sunken); display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
  <input type="text" id="nombreLead" placeholder="Nombre" style="flex: 1; min-width: 140px;">
  <input type="text" id="telLead" placeholder="Teléfono" style="flex: 1; min-width: 140px;">
  <input type="text" id="zonaLead" placeholder="Zona" style="flex: 1; min-width: 120px;">
  <button class="primary" onclick="agregarLead()">Agregar Lead Manual</button>
</div>`;

  // Insertar Botón Bitácora
  const botonBitacora = `<button onclick="abrirBitacora()">Bitácora</button>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
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
      --line:#e3e5e0; --line-strong:#cdd0c8;
      --ink:#14171a; --ink-soft:#3a3f38; --muted:#6b7066;
      --bg:#f5f6f3; --panel:#ffffff; --panel-sunken:#f9faf8;
      --on:#0f7a4f; --off:#b3261e; --accent:#1a3c2e; --hot:#a15c00;
      --lime:#d4ff3d; --lime-ink:#1c2a0c;
      --radius:10px; --radius-sm:7px;
      --shadow-sm: 0 1px 2px rgba(20, 23, 26, .05), 0 1px 1px rgba(20, 23, 26, .04);
      --shadow-md: 0 4px 14px rgba(20, 23, 26, .08), 0 1px 3px rgba(20, 23, 26, .06);
      --font-display: 'Space Grotesk', 'Inter', Arial, sans-serif;
      --font-body: 'Inter', Arial, sans-serif;
    }
    * { box-sizing: border-box; }
    body { margin: 0; padding-top: 60px; font-family: var(--font-body); background: var(--bg); color: var(--ink); -webkit-font-smoothing: antialiased; }
    header { position: fixed; top: 0; left: 0; right: 0; z-index: 1000; height: 60px; display: grid; grid-template-columns: auto 1fr auto; gap: 14px; align-items: center; padding: 0 20px; border-bottom: 1px solid var(--line); background: var(--panel); box-shadow: var(--shadow-sm); }
    h1 { font-family: var(--font-display); font-size: 19px; font-weight: 700; margin: 0; letter-spacing: -.01em; }
    h2 { font-family: var(--font-display); font-size: 14px; font-weight: 600; margin: 0; letter-spacing: -.005em; }
    button, textarea, input, select { font: inherit; }
    button { border: 1px solid var(--line-strong); background: #fff; color: var(--ink); border-radius: var(--radius-sm); min-height: 34px; padding: 0 12px; cursor: pointer; font-weight: 500; transition: border-color .15s ease, background .15s ease, transform .05s ease; }
    button:hover { border-color: var(--ink-soft); background: var(--panel-sunken); }
    button:active { transform: scale(.98); }
    button.primary { background: var(--lime); border-color: var(--lime); color: var(--lime-ink); font-weight: 700; }
    button.primary:hover { background: #c5f02a; border-color: #c5f02a; }
    button.danger { color: var(--off); border-color: #f0c9c6; }
    button.danger:hover { background: #fdf3f2; border-color: var(--off); }
    button:disabled { cursor: not-allowed; opacity: .5; }
    .top-nav { display: flex; gap: 4px; align-items: center; justify-content: center; }
    .top-nav button { min-height: 34px; border-color: transparent; color: var(--muted); }
    .top-nav button:hover { background: var(--panel-sunken); color: var(--ink); }
    .top-nav button.active { background: var(--ink); border-color: var(--ink); color: #fff; }
    .top-nav button.active:hover { background: var(--ink); }
    .page { height: calc(100vh - 60px); display: grid; grid-template-rows: auto auto auto 1fr; min-height: 0; }
    .dashboard { padding: 16px 20px; display: grid; grid-template-columns: repeat(7, minmax(110px, 1fr)); gap: 10px; border-bottom: 1px solid var(--line); background: var(--panel); }
    #reports { display: none; overflow: auto; }
    .metric { border: 1px solid var(--line); border-radius: var(--radius); padding: 12px 14px; min-height: 64px; background: var(--panel); transition: border-color .15s ease; }
    .metric.clickable { cursor: pointer; }
    .metric.clickable:hover { border-color: var(--ink-soft); box-shadow: var(--shadow-sm); }
    .metric strong { display: block; font-family: var(--font-display); font-size: 24px; font-weight: 700; line-height: 1; letter-spacing: -.01em; }
    .metric span { display: block; color: var(--muted); font-size: 11.5px; margin-top: 6px; font-weight: 500; }
    .dashboard-panel { grid-column: 1 / -1; display: grid; gap: 14px; padding: 4px 20px 20px; background: var(--panel); border-bottom: 1px solid var(--line); }
    .dashboard-section { display: grid; gap: 8px; }
    .dashboard-section h2 { color: var(--ink-soft); text-transform: uppercase; font-size: 11.5px; letter-spacing: .06em; }
    .funnel { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 10px; }
    .funnel-step { border: none; border-radius: var(--radius); background: var(--ink); color: #fff; padding: 14px; font-size: 12px; }
    .activity-item, .objection-item { border: 1px solid var(--line); border-radius: var(--radius-sm); background: var(--panel); padding: 10px; font-size: 12px; }
    .funnel-step strong { display: block; font-family: var(--font-display); font-size: 20px; font-weight: 700; color: #fff; }
    .funnel-step span { color: rgba(255,255,255,.62); }
    .bar { height: 7px; background: rgba(255,255,255,.14); border-radius: 999px; overflow: hidden; margin-top: 10px; }
    .bar span { display: block; height: 100%; background: var(--lime); border-radius: 999px; }
    .activity-list, .objection-list { display: grid; gap: 8px; }
    main { min-height: 0; display: grid; grid-template-columns: minmax(420px, var(--lead-pane-width, 58vw)) 7px minmax(320px, 1fr); position: relative; }
    .left { min-width: 0; display: grid; grid-template-rows: auto auto 1fr; background: var(--panel); }
    .pane-resizer { cursor: col-resize; background: var(--line); position: relative; z-index: 3; }
    .pane-resizer::after { content: ""; position: absolute; inset: 0 2px; background: transparent; }
    .pane-resizer:hover, body.resizing-pane .pane-resizer { background: var(--ink-soft); }
    .import { padding: 14px 16px; border-bottom: 1px solid var(--line); display: grid; grid-template-columns: 1fr auto; gap: 10px; align-items: end; background: var(--panel-sunken); }
    .import textarea { width: 100%; min-height: 58px; resize: vertical; border: 1px solid var(--line); border-radius: var(--radius-sm); padding: 8px 10px; font-family: var(--font-body); }
    .import-row { display: grid; gap: 8px; }
    .mobile-collapse summary { display: none; }
    .filters { padding: 12px 16px; border-bottom: 1px solid var(--line); display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)) auto; gap: 8px; align-items: end; }
    .lead-search { padding: 12px 16px; border-bottom: 1px solid var(--line); background: var(--panel); }
    .lead-search input { width: 100%; }
    .attention { padding: 12px 18px; border-bottom: 1px solid var(--line); background: #fffaeb; display: grid; gap: 8px; }
    .attention-list { display: flex; gap: 8px; overflow: auto; padding-bottom: 2px; }
    .attention button { white-space: nowrap; background: #fff; }
    .chat-dashboard { display: none; padding: 12px 16px; gap: 10px; border-bottom: 1px solid var(--line); background: var(--panel); }
    .chat-dashboard .metric { min-height: 54px; }
    label { color: var(--muted); font-size: 11px; font-weight: 500; display: grid; gap: 4px; }
    select, input { border: 1px solid var(--line-strong); border-radius: var(--radius-sm); min-height: 34px; padding: 0 9px; background: #fff; min-width: 0; font-family: var(--font-body); color: var(--ink); }
    select:focus, input:focus, textarea:focus, button:focus-visible { outline: 2px solid var(--ink-soft); outline-offset: 1px; }
    .table-wrap { overflow: auto; min-height: 0; }
    table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
    th, td { border-bottom: 1px solid var(--line); padding: 10px; text-align: left; vertical-align: top; }
    th { position: sticky; top: 0; background: var(--panel-sunken); z-index: 1; color: var(--muted); font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: .03em; }
    tr { cursor: pointer; transition: background .1s ease; }
    tr:hover { background: var(--panel-sunken); }
    tr.active { background: #f1f5ec; }
    .lead-actions { display: flex; flex-wrap: wrap; gap: 6px; }
    .lead-actions button { min-height: 30px; padding: 0 9px; font-size: 12px; }
    .lead-line { display: grid; gap: 6px; min-width: 0; }
    .lead-main { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; }
    .lead-name { color: var(--ink); font-size: 14px; font-weight: 700; overflow-wrap: anywhere; font-family: var(--font-display); }
    .lead-meta { color: var(--muted); font-size: 11px; line-height: 1.3; overflow-wrap: anywhere; }
    .lead-next { display: inline-flex; width: fit-content; max-width: 100%; padding: 4px 8px; border: 1px solid var(--line-strong); border-radius: var(--radius-sm); background: var(--panel-sunken); color: var(--ink-soft); font-size: 11px; font-weight: 600; overflow-wrap: anywhere; }
    .lead-last { color: var(--ink); font-size: 12px; line-height: 1.35; }
    .badge { border-radius: 999px; padding: 4px 10px; font-size: 11.5px; font-weight: 600; border: 1px solid var(--line); display: inline-flex; align-items: center; min-height: 24px; }
    .badge.on { color: var(--on); border-color: #a9dcc4; background: #eefcf5; }
    .badge.off { color: var(--off); border-color: #f0c9c6; background: #fdf3f2; }
    .badge.hot { color: var(--lime-ink); border-color: #b4dd1f; background: var(--lime); }
    .badge.new { color: #1c2a0c; border-color: #b4dd1f; background: #eaffb0; }
    .badge.state-prospectado { color: #51564c; border-color: var(--line-strong); background: var(--panel-sunken); }
    .badge.state-contactado { color: #0f4f7a; border-color: #9cc3ff; background: #edf5ff; }
    .badge.state-seguimiento { color: #92400e; border-color: #facc15; background: #fef9c3; }
    .badge.state-interesado { color: #166534; border-color: #86efac; background: #f0fdf4; }
    .badge.state-cliente_caliente { color: var(--lime-ink); border-color: #b4dd1f; background: var(--lime); }
    .badge.state-diagnostico_pagado { color: #581c87; border-color: #c084fc; background: #faf5ff; }
    .badge.state-diagnostico_entregado { color: #6b21a8; border-color: #d8b4fe; background: #faf5ff; }
    .badge.state-envio_pendiente { color: #854d0e; border-color: #fef08a; background: #fef9c3; }
    .badge.state-envio_fallido { color: #991b1b; border-color: #fca5a5; background: #fef2f2; }
    .badge.state-perdido { color: #991b1b; border-color: #fca5a5; background: #fef2f2; }
    .badge.state-requiere_intervencion { color: #fff; border-color: var(--off); background: var(--off); }
    
    /* Vista Bitácora */
    .page.view-bitacora main, .page.view-bitacora .dashboard, .page.view-bitacora .attention, .page.view-bitacora .chat-dashboard { display: none; }
    .page.view-bitacora #bitacoraView { display: grid; grid-template-rows: auto 1fr; overflow-y: auto; padding: 18px 20px; height: calc(100vh - 56px); }
    @media (max-width: 768px) {
      .page.view-bitacora #bitacoraView { height: calc(100vh - 52px); }
    }

    .detail { min-width: 0; min-height: 0; display: grid; grid-template-rows: auto auto auto 1fr auto; background: var(--bg); }
    .detail-head { display: flex; gap: 10px; align-items: center; justify-content: space-between; padding: 16px 18px; border-bottom: 1px solid var(--line); background: var(--panel); }
    .identity { min-width: 0; }
    .identity strong { display: block; font-family: var(--font-display); font-size: 17px; font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .identity span { color: var(--muted); font-size: 12px; }
    .actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; justify-content: flex-end; padding: 12px 18px; border-bottom: 1px solid var(--line); background: var(--panel); }
    .context { background: var(--panel); border-bottom: 1px solid var(--line); padding: 14px 18px; display: grid; gap: 12px; max-height: 250px; overflow: auto; align-content: start; }
    .context-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px 14px; font-size: 12px; align-items: start; }
    .context-grid > div { min-width: 0; }
    .context-grid strong { display: block; color: var(--muted); font-size: 10.5px; text-transform: uppercase; letter-spacing: .03em; font-weight: 600; margin-bottom: 2px; }
    .context-grid span { display: block; overflow-wrap: anywhere; line-height: 1.3; }
    .fugas { white-space: pre-wrap; overflow-wrap: anywhere; font-size: 12px; line-height: 1.45; background: #fff8eb; border: 1px solid #f5e3b3; border-radius: var(--radius-sm); padding: 10px 12px; }
    .notes { white-space: pre-wrap; overflow-wrap: anywhere; font-size: 12px; line-height: 1.45; padding: 10px 12px; border: 1px solid var(--line); border-radius: var(--radius-sm); background: var(--panel-sunken); }
    .ops { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; align-items: start; }
    .ops label.wide { grid-column: span 2; }
    .ops textarea { width: 100%; min-height: 58px; resize: vertical; border: 1px solid var(--line); border-radius: var(--radius-sm); padding: 8px 10px; font-family: var(--font-body); }
    .timeline { display: grid; gap: 10px; }
    .event { border-left: 3px solid var(--ink-soft); padding-left: 10px; font-size: 12px; }
    .event small { color: var(--muted); display: block; margin-top: 2px; }
    .mobile-only { display: none; }
    .detail-toggle { display: none; }
    .messages { min-height: 0; overflow: auto; padding: 18px; display: flex; flex-direction: column; gap: 10px; }
    .msg { max-width: min(680px, 84%); padding: 11px 13px; border: 1px solid var(--line); border-radius: var(--radius); background: var(--panel); line-height: 1.42; white-space: pre-wrap; overflow-wrap: anywhere; box-shadow: var(--shadow-sm); }
    .msg.saliente { align-self: flex-end; background: #eaf5ee; border-color: #cfe8d8; }
    .msg small { display: block; margin-top: 6px; color: var(--muted); font-size: 11px; }
    form { display: grid; grid-template-columns: 1fr auto; gap: 10px; padding: 14px 18px; border-top: 1px solid var(--line); background: var(--panel); }
    form textarea { width: 100%; min-height: 54px; max-height: 140px; resize: vertical; border: 1px solid var(--line); border-radius: var(--radius-sm); padding: 10px; font-family: var(--font-body); }
    .empty { padding: 20px; color: var(--muted); font-size: 13px; }
    .modal { position: fixed; inset: 0; display: none; align-items: center; justify-content: center; background: rgba(20, 23, 26, .5); z-index: 2000; padding: 18px; }
    .modal.open { display: flex; }
    .modal-panel { width: min(920px, 100%); max-height: min(86vh, 820px); display: grid; grid-template-rows: auto 1fr auto; background: #fff; border: 1px solid var(--line); border-radius: var(--radius); box-shadow: 0 22px 48px rgba(20, 23, 26, .25); }
    .modal-head, .modal-actions { padding: 14px 16px; display: flex; align-items: center; justify-content: space-between; gap: 10px; border-bottom: 1px solid var(--line); }
    .modal-head strong { font-family: var(--font-display); font-size: 16px; }
    .modal-actions { border-top: 1px solid var(--line); border-bottom: 0; justify-content: flex-end; }
    .edit-grid { overflow: auto; padding: 16px; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
    .edit-grid label.wide { grid-column: span 3; }
    .edit-grid textarea { width: 100%; min-height: 76px; resize: vertical; border: 1px solid var(--line); border-radius: var(--radius-sm); padding: 8px 10px; font-family: var(--font-body); }
    .edit-status { margin-right: auto; color: var(--muted); font-size: 12px; }
    .page.view-chat { grid-template-rows: auto 1fr; }
    .page.view-chat .dashboard, .page.view-chat .attention { display: none; }
    .page.view-chat .chat-dashboard { display: grid; grid-template-columns: repeat(3, minmax(120px, 1fr)); }
    .page.view-chat main { grid-template-columns: minmax(280px, var(--lead-pane-width, 340px)) 7px minmax(420px, 1fr); }
    .page.view-chat .left { grid-template-rows: auto 1fr; }
    .page.view-chat .left .import { display: none; }
    .page.view-chat .lead-search { display: none; }
    .page.view-chat .filters { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .page.view-chat .filters button { grid-column: span 2; }
    .page.view-chat .detail { display: grid; grid-template-columns: minmax(0, 1fr) minmax(340px, 390px); grid-template-rows: auto auto 1fr auto; min-width: 0; min-height: 0; }
    .page.view-chat .detail-head { grid-column: 2; grid-row: 1; }
    .page.view-chat .actions { grid-column: 2; grid-row: 2; justify-content: flex-start; }
    .page.view-chat .context { grid-column: 2; grid-row: 3 / 5; max-height: none; border-bottom: 0; border-left: 1px solid var(--line); }
    .page.view-chat .messages { grid-column: 1; grid-row: 1 / 4; }
    .page.view-chat form { grid-column: 1; grid-row: 4; position: sticky; bottom: 0; z-index: 2; }
    .page.view-leads .dashboard, .page.view-leads .attention, .page.view-leads .chat-dashboard { display: none; }
    .page.view-leads .left { grid-template-rows: auto auto auto 1fr; }
    .page.view-leads main { grid-template-columns: minmax(420px, var(--lead-pane-width, 56vw)) 7px minmax(420px, 1fr); }
    .page.view-leads .detail { display: grid; }
    .page.view-leads .context { max-height: none; align-content: start; }
    @media (min-width: 1051px) {
      .page.view-chat .detail-toggle, .page.view-leads .detail-toggle { display: inline-flex; align-items: center; position: absolute; top: 10px; right: 12px; z-index: 6; min-height: 30px; font-size: 12px; background: #fff; box-shadow: 0 1px 5px rgba(17, 24, 39, .08); }
      .page.view-chat.detail-collapsed .detail { grid-template-columns: minmax(0, 1fr); }
      .page.view-chat.detail-collapsed .detail-head, .page.view-chat.detail-collapsed .actions, .page.view-chat.detail-collapsed .context { display: none; }
      .page.view-chat.detail-collapsed .messages { grid-column: 1; grid-row: 1 / 4; }
      .page.view-chat.detail-collapsed form { grid-column: 1; grid-row: 4; }
      .page.view-leads.detail-collapsed main { grid-template-columns: minmax(0, 1fr); }
      .page.view-leads.detail-collapsed .pane-resizer, .page.view-leads.detail-collapsed .detail { display: none; }
      .page.view-leads.detail-collapsed .left { border-right: 0; }
    }
    .page.view-dashboard main, .page.view-dashboard .chat-dashboard { display: none; }
    .page.view-dashboard .attention { display: none; }
    .page.view-reportes main, .page.view-reportes .dashboard, .page.view-reportes .attention, .page.view-reportes .chat-dashboard { display: none; }
    .page.view-reportes #reports { display: grid; grid-template-columns: 1fr; align-content: start; }
    .page.view-seguimiento .dashboard, .page.view-seguimiento .chat-dashboard { display: none; }
    .page.view-seguimiento main { display: none; }
    .page.view-seguimiento .attention { overflow: auto; align-content: start; padding: 18px 20px; }
    .followup-board { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
    .followup-block { display: grid; align-content: start; gap: 10px; min-width: 0; }
    .followup-block h2 { font-family: var(--font-display); font-size: 14px; color: var(--ink-soft); text-transform: uppercase; letter-spacing: .04em; }
    .followup-card { border: 1px solid var(--line); border-radius: var(--radius); background: var(--panel); padding: 12px; display: grid; gap: 8px; font-size: 12px; box-shadow: var(--shadow-sm); }
    .followup-card strong { font-family: var(--font-display); font-size: 13.5px; overflow-wrap: anywhere; }
    .followup-meta { color: var(--muted); line-height: 1.35; overflow-wrap: anywhere; }
    .followup-badges, .followup-actions { display: flex; flex-wrap: wrap; gap: 6px; }
    .followup-actions button { min-height: 28px; padding: 0 9px; font-size: 12px; }
    @media (max-width: 1050px) { .dashboard { grid-template-columns: repeat(2, 1fr); } main { grid-template-columns: 1fr; grid-template-rows: 44vh 1fr; } .pane-resizer { display: none; } .left { border-right: 0; border-bottom: 1px solid var(--line); } .page.view-chat main { grid-template-columns: 1fr; grid-template-rows: 40vh 1fr; } .page.view-chat .detail { grid-template-columns: 1fr; grid-template-rows: auto 1fr auto auto auto; } .page.view-chat .detail-head, .page.view-chat .actions, .page.view-chat .context, .page.view-chat .messages, .page.view-chat form { grid-column: 1; } .page.view-chat .detail-head { grid-row: 1; } .page.view-chat .messages { grid-row: 2; } .page.view-chat form { grid-row: 3; } .page.view-chat .actions { grid-row: 4; } .page.view-chat .context { grid-row: 5; border-left: 0; max-height: 320px; } }
    @media (max-width: 768px) {
      html, body { width: 100%; max-width: 100%; overflow: hidden; }
      body { padding-top: 52px; }
      header { height: 52px; grid-template-columns: auto minmax(0, 1fr) auto; padding: 0 8px; gap: 6px; }
      h1 { font-size: 15px; white-space: nowrap; }
      .top-nav { justify-content: flex-start; overflow-x: auto; padding-bottom: 2px; }
      .top-nav { scrollbar-width: none; }
      .top-nav::-webkit-scrollbar { display: none; }
      .top-nav button { min-width: max-content; padding: 0 9px; }
      header > #refresh { justify-self: end; min-width: 42px; max-width: 42px; padding: 0; overflow: hidden; color: transparent; position: relative; }
      header > #refresh::after { content: "↻"; color: var(--ink); position: absolute; inset: 0; display: grid; place-items: center; font-size: 18px; }
      .page { height: calc(100vh - 52px); overflow: hidden; }
      .chat-dashboard { grid-template-columns: 1fr !important; }
      .page.view-chat .chat-dashboard { grid-template-columns: repeat(3, minmax(86px, 1fr)) !important; gap: 6px; padding: 6px 8px; }
      .page.view-chat .chat-dashboard .metric { min-height: 42px; padding: 6px 7px; border-radius: 7px; }
      .page.view-chat .chat-dashboard .metric strong { font-size: 16px; }
      .page.view-chat .chat-dashboard .metric span { font-size: 10px; line-height: 1.15; margin-top: 3px; }
      .dashboard { grid-template-columns: 1fr; overflow: auto; }
      .page.view-dashboard .dashboard { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 7px; padding: 8px; align-content: start; }
      .page.view-dashboard .metric { min-height: 48px; padding: 7px 8px; border-radius: 7px; }
      .page.view-dashboard .metric strong { font-size: 18px; }
      .page.view-dashboard .metric span { font-size: 10px; line-height: 1.2; margin-top: 4px; }
      .followup-board { grid-template-columns: 1fr; }
      .dashboard-panel { overflow: auto; padding: 12px; }
      .funnel { grid-template-columns: 1fr; }
      .page.view-dashboard .dashboard-panel { padding: 8px; gap: 10px; }
      .page.view-dashboard .dashboard-section { gap: 6px; }
      .page.view-dashboard .dashboard-section h2 { font-size: 13px; }
      .page.view-dashboard .funnel { grid-template-columns: 1fr 1fr; gap: 6px; }
      .page.view-dashboard .funnel-step, .page.view-dashboard .activity-item, .page.view-dashboard .objection-item { padding: 8px; font-size: 11px; border-radius: 7px; }
      .page.view-dashboard .funnel-step strong { font-size: 16px; }
      .page.view-dashboard .activity-list, .page.view-dashboard .objection-list { gap: 6px; }
      .page.view-reportes #reports { padding: 8px; overflow: auto; align-content: start; }
      .page.view-reportes #reports .dashboard-panel { padding: 0; gap: 10px; border-bottom: 0; background: transparent; }
      .page.view-reportes #reports .dashboard-section { gap: 6px; }
      .page.view-reportes #reports .dashboard-section h2 { font-size: 13px; padding: 0 2px; }
      .page.view-reportes #reports .chat-dashboard { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)) !important; gap: 6px; padding: 0; border-bottom: 0; background: transparent; }
      .page.view-reportes #reports .metric { min-height: 46px; padding: 7px 8px; border-radius: 7px; }
      .page.view-reportes #reports .metric strong { font-size: 17px; }
      .page.view-reportes #reports .metric span { font-size: 10px; line-height: 1.15; margin-top: 4px; }
      .page.view-reportes #reports .table-wrap { overflow: visible; }
      .page.view-reportes #reports table, .page.view-reportes #reports tbody, .page.view-reportes #reports tr, .page.view-reportes #reports td { display: block; width: 100%; }
      .page.view-reportes #reports tr { padding: 8px; margin-bottom: 7px; border: 1px solid var(--line); border-radius: 7px; background: #fff; }
      .page.view-reportes #reports td { display: inline-grid; grid-template-columns: minmax(72px, auto) 1fr; gap: 5px; width: auto; max-width: 100%; padding: 2px 8px 2px 0; color: var(--muted); font-size: 11px; overflow-wrap: anywhere; }
      .page.view-reportes #reports td::before { content: attr(data-label); color: var(--ink); font-weight: 700; }
      .page.view-reportes #reports td:first-child { display: block; padding: 0 0 5px; color: var(--ink); font-size: 12px; font-weight: 700; }
      .page.view-reportes #reports td:first-child::before { display: none; }
      .page.view-reportes #reports td[data-label="Diag. ofrecidos"], .page.view-reportes #reports td[data-label="Diag. vendidos"], .page.view-reportes #reports td[data-label="Act. ofrecidas"], .page.view-reportes #reports td[data-label="Act. vendidas"], .page.view-reportes #reports td[data-label="Vendidos"], .page.view-reportes #reports td[data-label="Descartados"], .page.view-reportes #reports td[data-label="Interes"] { display: none; }
      main, .page.view-chat main, .page.view-leads main { grid-template-columns: 1fr; grid-template-rows: 1fr; overflow: hidden; }
      .left { border-right: 0; min-height: 0; }
      .mobile-collapse summary { display: flex; align-items: center; justify-content: space-between; min-height: 36px; padding: 0 10px; border-bottom: 1px solid var(--line); color: var(--ink); font-weight: 700; cursor: pointer; list-style: none; }
      .mobile-collapse summary::-webkit-details-marker { display: none; }
      .mobile-collapse summary::after { content: "+"; color: var(--muted); font-size: 18px; }
      .mobile-collapse[open] summary::after { content: "−"; }
      .page.view-leads .mobile-collapse:not([open]) { display: block; border-bottom: 1px solid var(--line); }
      .page.view-leads .mobile-collapse:not([open]) > :not(summary) { display: none; }
      .filters { grid-template-columns: 1fr 1fr; padding: 8px 10px; gap: 6px; }
      .import { grid-template-columns: 1fr; padding: 0; }
      .import[open] { padding-bottom: 8px; }
      .import[open] .import-row { padding: 8px 10px 0; }
      .import textarea { min-height: 90px; }
      .import button { min-height: 42px; }
      .table-wrap { overflow: auto; }
      table, thead, tbody, tr, td { display: block; width: 100%; }
      thead { display: none; }
      tr { border-bottom: 1px solid var(--line); padding: 10px; }
      td { border-bottom: 0; padding: 2px 0; }
      .page.view-chat main { grid-template-rows: minmax(0, 1fr); }
      .page.view-chat .left { grid-template-rows: auto minmax(0, 1fr); }
      .page.view-chat .filters { display: none; }
      .page.view-chat .table-wrap { min-height: 0; }
      .page.view-leads main { grid-template-rows: minmax(0, 1fr); }
      .page.view-leads .left { grid-template-rows: auto auto auto minmax(0, 1fr); }
      .page.view-leads .detail { display: none; }
      .page.view-leads.mobile-chat-open .left { display: none; }
      .page.view-leads.mobile-chat-open .detail { display: grid; grid-template-columns: minmax(0, 1fr); grid-template-rows: auto auto minmax(0, 1fr) auto; min-width: 0; min-height: 0; overflow: hidden; }
      .page.view-leads.mobile-chat-open .detail-head { grid-row: 1; }
      .page.view-leads.mobile-chat-open .actions { grid-row: 2; max-height: 126px; overflow-y: auto; }
      .page.view-leads.mobile-chat-open .messages { grid-row: 3; min-height: 0; overflow: auto; }
      .page.view-leads.mobile-chat-open .context { display: none; grid-row: 3; max-height: none; overflow: auto; }
      .page.view-leads.mobile-chat-open.show-mobile-context .context { display: grid; }
      .page.view-leads.mobile-chat-open form { grid-row: 4; position: sticky; bottom: 0; grid-template-columns: 1fr 78px; padding: 10px; }
      .page.view-chat .detail { display: none; }
      .page.view-chat.mobile-chat-open .left { display: none; }
      .page.view-chat.mobile-chat-open .detail { display: grid; grid-template-columns: minmax(0, 1fr); grid-template-rows: auto minmax(0, 1fr) auto auto; min-width: 0; min-height: 0; overflow: hidden; }
      .page.view-chat.mobile-chat-open .detail-head { grid-row: 1; grid-column: 1; }
      .page.view-chat.mobile-chat-open .messages { grid-row: 2; grid-column: 1; }
      .page.view-chat.mobile-chat-open form { grid-row: 3; grid-column: 1; position: sticky; bottom: 0; grid-template-columns: minmax(0, 1fr) 84px; gap: 8px; padding: 8px 10px 10px; align-items: end; }
      .page.view-chat.mobile-chat-open .actions { grid-row: 4; grid-column: 1; justify-content: flex-start; max-height: 132px; overflow-y: auto; overflow-x: hidden; }
      .page.view-chat.mobile-chat-open .actions button, .page.view-leads.mobile-chat-open .actions button { flex: 1 1 calc(50% - 8px); min-width: 0; min-height: 34px; padding: 0 8px; white-space: normal; font-size: 13px; }
      .page.view-leads.mobile-chat-open #initialBtn, .page.view-leads.mobile-chat-open #contactedBtn, .page.view-leads.mobile-chat-open #interestedBtn, .page.view-leads.mobile-chat-open #lostBtn { flex-basis: calc(50% - 8px); }
      .page.view-leads.mobile-chat-open #editBtn, .page.view-leads.mobile-chat-open #paidBtn, .page.view-leads.mobile-chat-open #deleteBtn { flex-basis: calc(33.333% - 8px); font-size: 12px; min-height: 30px; }
      .page.view-chat.mobile-chat-open .context { display: none; grid-row: 5; grid-column: 1; max-height: 46vh; overflow: auto; border-left: 0; }
      .page.view-chat.mobile-chat-open.show-mobile-context .context { display: grid; }
      .page.view-leads.mobile-chat-open.show-mobile-context .messages { display: none; }
      .mobile-only { display: inline-flex; }
      .messages { padding: 10px; min-width: 0; overflow-x: hidden; }
      .msg { max-width: 94%; box-sizing: border-box; }
      .msg.saliente { max-width: 88%; }
      .detail-head { padding: 10px; min-width: 0; flex-wrap: wrap; }
      .detail-head .identity { min-width: 0; flex: 1 1 150px; }
      .actions { padding: 8px 10px; justify-content: flex-start; }
      .page.view-chat.mobile-chat-open form textarea { min-height: 56px; max-height: 116px; }
      .page.view-chat.mobile-chat-open form button { min-height: 56px; padding: 0 10px; }
      form textarea { min-height: 48px; max-height: 96px; }
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
      ${botonBitacora}
    </nav>
    <button id="refresh">Actualizar</button>
  </header>
  ${formularioManual}
  <div id="page" class="page view-chat">
    <div id="dashboard" class="dashboard"></div>
    <div id="attention" class="attention"></div>
    <div id="chatDashboard" class="chat-dashboard"></div>
    <div id="reports" class="dashboard"></div>
    <div id="bitacoraView" style="display: none; padding: 16px; background: var(--panel); border-bottom: 1px solid var(--line); overflow-y: auto; height: calc(100vh - 56px);"></div>
    <main>
      <section class="left">
        <details class="import mobile-collapse" open>
          <summary>Importar leads</summary>
          <div class="import-row">
            <h2>Importar Prospector ON</h2>
            <input id="fileInput" type="file" accept=".csv,.tsv,text/csv,text/tab-separated-values" />
            <textarea id="importText" placeholder="Pega filas CSV o TSV de Prospector ON"></textarea>
          </div>
          <div class="import-row"><button class="primary" id="importBtn">Importar</button><span id="importStatus" class="badge">Listo</span></div>
        </details>
        <details class="filters mobile-collapse" open>
          <summary>Filtros</summary>
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
        </details>
        <label class="lead-search">Buscar lead<input id="leadSearch" placeholder="Telefono, nombre, zona, fuente o estado" /></label>
        <div class="table-wrap"><table><thead><tr><th>Nombre</th><th>Telefono</th><th>Zona</th><th>Fuente</th><th>Estado comercial</th><th>Siguiente accion</th><th>Seguimiento</th><th>Producto</th><th>Monto</th><th>Pago</th><th>Acciones</th></tr></thead><tbody id="leads"></tbody></table></div>
      </section>
      <button id="toggleDetailPanel" class="detail-toggle" type="button">Ocultar detalle</button>
      <div id="paneResizer" class="pane-resizer" role="separator" aria-label="Ajustar ancho de leads" aria-orientation="vertical"></div>
      <section class="detail">
        <div class="detail-head">
          <div class="identity"><strong id="title">Selecciona un lead</strong><span id="subtitle"></span></div>
          <button class="mobile-only" id="backToLeads" type="button">Lista</button>
          <button class="mobile-only" id="toggleLeadData" type="button">Datos</button>
          <div><span id="botBadge" class="badge">IA</span> <span id="hotBadge" class="badge">Lead</span></div>
        </div>
        <div class="actions">
          <button id="initialBtn" disabled>Enviar mensaje inicial</button>
          <button id="editBtn" disabled>Editar prospecto</button>
          <button id="pauseBtn" disabled>Pausar IA</button>
          <button id="resumeBtn" disabled>Reanudar IA</button>
          <button id="contactedBtn" disabled>Marcar contactado</button>
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
      currentView = view;
      page.classList.remove("mobile-chat-open", "show-mobile-context");
      page.className = "page view-" + view;
      
      const bitacoraView = document.getElementById("bitacoraView");
      if (view === "bitacora") {
        bitacoraView.style.display = "grid";
      } else {
        bitacoraView.style.display = "none";
      }
      
      if (detailCollapsed && !isMobile() && (view === "chat" || view === "leads")) page.classList.add("detail-collapsed");
      updateDetailToggle();
      document.querySelectorAll(".nav-btn").forEach(btn => btn.classList.toggle("active", btn.dataset.view === view));
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
      toggleDetailPanel.hidden = !visible;
      toggleDetailPanel.textContent = detailCollapsed ? "Mostrar detalle" : "Ocultar detalle";
      page.classList.toggle("detail-collapsed", visible && detailCollapsed);
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
    }

    function renderLeads() {
      const leadActions = (telefono) => '<div class="lead-actions"><button type="button" data-chat="' + escapeHtml(telefono) + '">Ver chat</button><button type="button" data-edit="' + escapeHtml(telefono) + '">Editar</button><button class="danger" type="button" data-delete="' + escapeHtml(telefono) + '">Borrar</button></div>';
      const alertBadges = (c) => '<span class="badge state-' + escapeHtml(c.estado || 'nuevo') + '">' + escapeHtml(estadoLabel(c.estado || 'nuevo')) + '</span> ' + alertasLead(c).map(a => '<span class="badge off">' + escapeHtml(a) + '</span>').join(" ");
      if (currentView === "chat") {
        leads.innerHTML = filtered.map(c => {
          const pending = Number(c.respuestas_post_campana || c.mensajes_pendientes || 0);
          const newBadge = hasNewMessage(c) ? ' <span class="badge new">Respondio</span>' : '';
          const pendingBadge = hasNewMessage(c) ? ' <span class="badge new">(' + escapeHtml(pending) + ')</span>' : '';
          return '<tr class="' + (selected?.telefono === c.telefono ? 'active' : '') + '" data-tel="' + escapeHtml(c.telefono) + '"><td colspan="11"><div class="lead-line"><div class="lead-main"><span class="lead-name">' + escapeHtml(label(c)) + '</span>' + alertBadges(c) + newBadge + pendingBadge + (c.prioridad ? ' <span class="badge">' + escapeHtml(c.prioridad) + '</span>' : '') + '</div><div class="lead-meta">' + escapeHtml(c.telefono) + ' | ' + escapeHtml(zonaLabel(c.zona)) + ' | ' + escapeHtml(fuenteLabel(c.fuente_busqueda)) + '</div><div class="lead-next">Siguiente: ' + escapeHtml(safeDato(c.siguiente_accion)) + '</div><div class="lead-last"><strong>Ultimo mensaje:</strong> ' + escapeHtml(lastMessageLabel(c)) + '</div></div></td></tr>';
        }).join("") || '<tr><td colspan="11">Sin resultados</td></tr>';
        leads.querySelectorAll("tr[data-tel]").forEach(row => row.addEventListener("click", () => { selectLead(row.dataset.tel); page.classList.add("mobile-chat-open"); }));
        return;
      }
      if (isMobile()) {
        leads.innerHTML = filtered.map(c => {
          const pending = Number(c.respuestas_post_campana || c.mensajes_pendientes || 0);
          return '<tr class="' + (selected?.telefono === c.telefono ? 'active' : '') + '" data-tel="' + escapeHtml(c.telefono) + '"><td colspan="11"><div class="lead-line"><div class="lead-main"><span class="lead-name">' + escapeHtml(label(c)) + '</span>' + alertBadges(c) + (hasNewMessage(c) ? ' <span class="badge new">Respondio</span> <span class="badge new">(' + escapeHtml(pending) + ')</span>' : '') + (c.prioridad ? ' <span class="badge">' + escapeHtml(c.prioridad) + '</span>' : '') + '</div><div class="lead-meta">' + escapeHtml(c.telefono) + ' | ' + escapeHtml(zonaLabel(c.zona)) + ' | ' + escapeHtml(fuenteLabel(c.fuente_busqueda)) + ' | Score ' + escapeHtml(c.score || 'sin dato') + '</div><div class="lead-next">Siguiente: ' + escapeHtml(safeDato(c.siguiente_accion)) + '</div><div class="lead-actions"><button type="button" data-chat="' + escapeHtml(c.telefono) + '">Ver chat</button> <button type="button" data-initial="' + escapeHtml(c.telefono) + '">Enviar inicial</button></div></div></td></tr>';
        }).join("") || '<tr><td colspan="11">Sin resultados</td></tr>';
        leads.querySelectorAll("tr[data-tel] td").forEach(td => {
          const tel = td.parentElement.dataset.tel;
          td.querySelector(".lead-actions").insertAdjacentHTML("beforeend", ' <button type="button" data-edit="' + escapeHtml(tel) + '">Editar</button> <button class="danger" type="button" data-delete="' + escapeHtml(tel) + '">Borrar</button>');
        });
        bindLeadRowActions();
        leads.querySelectorAll("button[data-initial]").forEach(btn => btn.addEventListener("click", async (event) => { event.stopPropagation(); selected = conversaciones.find(c => c.telefono === btn.dataset.initial); if (selected) document.getElementById("initialBtn").click(); }));
        leads.querySelectorAll("tr[data-tel]").forEach(row => row.addEventListener("click", () => { selectLead(row.dataset.tel); page.classList.add("mobile-chat-open"); }));
        return;
      }
      leads.innerHTML = filtered.map(c => {
        const pending = Number(c.respuestas_post_campana || c.mensajes_pendientes || 0);
        const newBadge = hasNewMessage(c) ? ' <span class="badge new">Respondio</span>' : '';
        const pendingBadge = hasNewMessage(c) ? ' <span class="badge new">(' + escapeHtml(pending) + ')</span>' : '';
        return '<tr class="' + (selected?.telefono === c.telefono ? 'active' : '') + '" data-tel="' + escapeHtml(c.telefono) + '"><td><div class="lead-line"><div class="lead-main"><span class="lead-name">' + escapeHtml(label(c)) + '</span>' + alertBadges(c) + newBadge + pendingBadge + (c.prioridad ? ' <span class="badge">' + escapeHtml(c.prioridad) + '</span>' : '') + '</div><div class="lead-meta">' + escapeHtml(c.categoria || 'Sin nicho') + ' | Score ' + escapeHtml(c.score || 'sin dato') + '</div></div></td><td><span class="lead-meta">' + escapeHtml(c.telefono || 'Sin telefono') + '</span></td><td><span class="lead-meta">' + escapeHtml(zonaLabel(c.zona)) + '</span></td><td><span class="lead-meta">' + escapeHtml(fuenteLabel(c.fuente_busqueda)) + '</span></td><td>' + escapeHtml(commercialState(c) || 'Sin dato') + '</td><td><span class="lead-next">' + escapeHtml(safeDato(c.siguiente_accion)) + '</span></td><td><span class="lead-meta">' + escapeHtml(c.fecha_siguiente_seguimiento ? fmtDate(c.fecha_siguiente_seguimiento) : 'Sin dato') + '</span></td><td>' + escapeHtml(safeDato(c.producto_interesado)) + '<br><small>' + escapeHtml(money(c.monto_cotizado)) + '</small></td><td>' + escapeHtml(safeDato(c.estado_pago)) + '<br><small>Pagado ' + escapeHtml(money(c.monto_pagado)) + '</small><br>' + leadActions(c.telefono) + '</td></tr>';
      }).join("") || '<tr><td colspan="11">Sin resultados</td></tr>';
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
      if ((currentView === "chat" || currentView === "leads") && isMobile()) page.classList.add("mobile-chat-open");
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
    document.getElementById("contactedBtn").addEventListener("click", () => setEstado("contactado"));
    document.getElementById("interestedBtn").addEventListener("click", () => setEstado("interesado"));
    document.getElementById("lostBtn").addEventListener("click", () => setEstado("perdido"));
    document.getElementById("paidBtn").addEventListener("click", () => setEstado("diagnostico_pagado"));
    document.getElementById("deleteBtn").addEventListener("click", () => deleteLead());
    document.getElementById("refresh").addEventListener("click", loadConversaciones);
    document.querySelectorAll(".nav-btn").forEach(btn => btn.addEventListener("click", () => setView(btn.dataset.view)));
    toggleDetailPanel.addEventListener("click", () => {
      detailCollapsed = !detailCollapsed;
      updateDetailToggle();
    });
    window.addEventListener("resize", updateDetailToggle);
    document.getElementById("backToLeads").addEventListener("click", () => page.classList.remove("mobile-chat-open", "show-mobile-context"));
    document.getElementById("toggleLeadData").addEventListener("click", () => page.classList.toggle("show-mobile-context"));
    document.getElementById("clearFilters").addEventListener("click", () => {
      clearFilterValues();
      applyFilters();
    });
    paneResizer.addEventListener("pointerdown", (event) => {
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
      paneResizer.addEventListener("pointermove", resize);
      paneResizer.addEventListener("pointerup", stop);
      paneResizer.addEventListener("pointercancel", stop);
    });
    ["filterEstado","filterPrioridad","filterCategoria","filterZona","filterFuente","filterEstadoContacto","filterCaliente","filterOperativo"].forEach(id => document.getElementById(id).addEventListener("change", applyFilters));
    document.getElementById("filterTexto").addEventListener("input", applyFilters);
    leadSearch.addEventListener("input", () => {
      document.getElementById("filterTexto").value = leadSearch.value;
      applyFilters();
    });

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
          const nombreLead = g.nombre || g.telefono;
          return '<div class="followup-card"><strong>' + escapeHtml(nombreLead) + '</strong><div class="followup-meta">' + escapeHtml(g.telefono) + '</div><div class="followup-badges">' + badges + '</div></div>';
        }).filter(function(t) { return t; });

        bitacoraContent.innerHTML = tarjetas.length
          ? '<div class="followup-board" style="grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));">' + tarjetas.join("") + '</div>'
          : '<span class="badge">Sin eventos registrados</span>';
        
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

    const initialView = (location.hash || "#chat").replace("#", "");
    if (isMobile()) document.querySelectorAll(".mobile-collapse").forEach(el => el.removeAttribute("open"));
    if (["chat","seguimiento","leads","dashboard","reportes"].includes(initialView)) setView(initialView);
    loadConversaciones();
  </script>
</body>
</html>`);
};
