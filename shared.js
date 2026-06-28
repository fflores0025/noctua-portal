// ─────────────────────────────────────────────────────────────
// shared.js — InOut Media · Connect
// Helpers compartidos: toast, badge, sidebar, modal, initials
// ─────────────────────────────────────────────────────────────

// ── TOAST ──
function toast(msg, ms = 2800) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), ms);
}

// ── INICIALES Y AVATAR ──
function initials(n) {
  return (n || '').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}
function avatarColor(r) {
  return r === 'admin' ? 'av-blue' : r === 'rrhh' ? 'av-pink' : r === 'superadmin' ? 'av-pink' : r === 'freelance' ? 'av-gray' : '';
}

// ── BADGES ──
function badge(e) {
  const m = {
    pagada:        ['b-green','Pagada'],
    pendiente:     ['b-blue','Pendiente'],
    aprobada:      ['b-green','Aprobada'],
    rechazada:     ['b-pink','Rechazada'],
    confirmado:    ['b-green','Confirmado'],
    produccion:    ['b-blue','En producción'],
    preproduccion: ['b-gray','Preproducción'],
    negociacion:   ['b-orange','Negociación'],
    activo:        ['b-green','Activo'],
    cerrado:       ['b-gray','Cerrado'],
    baja:          ['b-pink','Baja'],
    borrador:      ['b-gray','Borrador'],
    publicado:     ['b-green','Publicado'],
    agotado:       ['b-pink','Agotado'],
    cancelado:     ['b-pink','Cancelado'],
    finalizado:    ['b-gray','Finalizado'],
    abierta:       ['b-pink','Abierta'],
    en_proceso:    ['b-blue','En proceso'],
    resuelta:      ['b-green','Resuelta'],
    disponible:    ['b-green','Disponible'],
    en_uso:        ['b-blue','En uso'],
    mantenimiento: ['b-orange','Mantenimiento']
  };
  const [c, l] = m[e] || ['b-gray', e];
  return `<span class="badge ${c}">${l}</span>`;
}

function tipoBadge(t) {
  return t === 'fijo'
    ? '<span class="badge b-blue">Fijo</span>'
    : '<span class="badge b-orange">Freelance</span>';
}

function roleBadge(r) {
  const m = {
    admin:          'b-pink Admin',
    rrhh:           'b-blue RRHH',
    empleado:       'b-gray Empleado',
    freelance:      'b-orange Freelance',
    empresa_externa:'b-gray Empresa Externa',
    superadmin:     'b-pink SuperAdmin',
    manager:        'b-blue Manager',
    tecnico:        'b-gray Técnico',
    org_admin:      'b-pink Org Admin'
  };
  const s = (m[r] || 'b-gray ' + r).split(' ');
  return `<span class="badge ${s[0]}">${s.slice(1).join(' ')}</span>`;
}

function tipoAusenciaBadge(tipo) {
  const tipos = {
    vacaciones:      '<span class="badge b-green">🏖️ Vacaciones</span>',
    libre:           '<span class="badge b-blue">📅 Día libre</span>',
    asunto_personal: '<span class="badge b-gray">📋 Asunto personal</span>',
    baja_medica:     '<span class="badge b-orange">🏥 Baja médica</span>',
    baja_maternidad: '<span class="badge b-pink">👶 Maternidad/Paternidad</span>'
  };
  return tipos[tipo] || `<span class="badge b-gray">${tipo}</span>`;
}

// ── MODAL ──
function showModal(h) {
  document.getElementById('modal-body').innerHTML = h;
  document.getElementById('modal-bg').classList.add('show');
}
function closeModal() {
  document.getElementById('modal-bg').classList.remove('show');
}
function initModal() {
  document.getElementById('modal-bg')?.addEventListener('click', e => {
    if (e.target === document.getElementById('modal-bg')) closeModal();
  });
}

// ── SIDEBAR ──
function toggleSidebar() {
  document.getElementById('sidebar')?.classList.toggle('open');
  document.getElementById('overlay')?.classList.toggle('show');
}
function closeSidebar() {
  document.getElementById('sidebar')?.classList.remove('open');
  document.getElementById('overlay')?.classList.remove('show');
}

// ── POBLAR SIDEBAR CON DATOS DE USUARIO ──
function initSidebar(activeKey) {
  if (!userProfile) return;
  const ini = initials(userProfile.nombre);
  const avc = avatarColor(userProfile.role);
  ['s-avatar','tb-avatar'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = ini;
    el.className = `avatar ${avc}`;
  });
  document.getElementById('s-name') && (document.getElementById('s-name').textContent = userProfile.nombre);
  document.getElementById('s-role') && (document.getElementById('s-role').textContent = userProfile.role);

  // Marcar nav item activo
  document.querySelectorAll('.nav-item[data-key]').forEach(el => {
    el.classList.toggle('active', el.dataset.key === activeKey);
  });
}

// ── CSS COMPARTIDO (inyectado dinámicamente si no está en el HTML) ──
const SHARED_CSS = `
*, *::before, *::after { box-sizing:border-box; margin:0; padding:0; -webkit-tap-highlight-color:transparent; }
:root {
  --bg:#07070f; --surf:#0d0d1a; --card:#111120; --border:#1c1c2e;
  --a1:#c8ff00; --a2:#ff3cac; --a3:#00d4ff;
  --txt:#e6e6f0; --muted:#60607a; --r:13px; --sidebar:240px;
}
html,body { height:100%; font-family:'DM Sans',sans-serif; font-size:14px; color:var(--txt); background:var(--bg); overflow-x:hidden; }
::-webkit-scrollbar { width:4px; height:4px; }
::-webkit-scrollbar-thumb { background:var(--border); border-radius:4px; }
#app { display:flex; min-height:100vh; }
.sidebar { width:var(--sidebar); height:100vh; background:var(--surf); border-right:1px solid var(--border); display:flex; flex-direction:column; position:fixed; top:0; left:0; z-index:200; transition:transform .25s cubic-bezier(.4,0,.2,1); overflow:hidden; }
.main-area { margin-left:var(--sidebar); flex:1; display:flex; flex-direction:column; min-height:100vh; }
.topbar { height:56px; background:var(--surf); border-bottom:1px solid var(--border); display:flex; align-items:center; padding:0 16px; gap:12px; position:sticky; top:0; z-index:100; }
.main-content { flex:1; padding:28px 24px; max-width:1100px; width:100%; margin:0 auto; }
.overlay { display:none; position:fixed; inset:0; background:rgba(0,0,0,.6); z-index:150; }
.overlay.show { display:block; }
.s-logo { padding:20px 20px 16px; border-bottom:1px solid var(--border); font-family:'Syne',sans-serif; font-weight:800; font-size:19px; letter-spacing:-.5px; display:flex; align-items:center; justify-content:space-between; }
.s-logo-close { background:none; border:none; color:var(--muted); font-size:20px; cursor:pointer; padding:4px; line-height:1; }
.s-logo-close:hover { color:var(--txt); }
.logo-dot { color:var(--a1); }
.s-user { padding:14px 20px; border-bottom:1px solid var(--border); display:flex; align-items:center; gap:10px; cursor:pointer; transition:background .15s; }
.s-user:hover { background:rgba(255,255,255,.04); }
.s-user-arrow { margin-left:auto; color:var(--muted); font-size:14px; transition:all .2s; }
.s-user:hover .s-user-arrow { color:var(--a1); transform:translateX(2px); }
.avatar { width:36px; height:36px; border-radius:50%; background:var(--a1); color:#000; font-weight:700; font-size:12px; display:flex; align-items:center; justify-content:center; font-family:'Syne',sans-serif; flex-shrink:0; }
.av-pink{background:var(--a2);color:#fff;} .av-blue{background:var(--a3);color:#000;} .av-gray{background:var(--muted);color:#fff;}
.u-name { font-size:13px; font-weight:500; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.u-role { font-size:11px; color:var(--muted); text-transform:uppercase; letter-spacing:.5px; }
.nav { flex:1; padding:8px 0; overflow-y:auto; min-height:0; }
.nav-sec { padding:10px 20px 4px; font-size:10px; color:var(--muted); text-transform:uppercase; letter-spacing:1px; font-weight:600; }
.nav-item { display:flex; align-items:center; gap:10px; padding:9px 20px; cursor:pointer; color:var(--muted); transition:all .15s; font-size:13px; border-left:2px solid transparent; user-select:none; }
.nav-item:hover { color:var(--txt); background:rgba(255,255,255,.03); }
.nav-item.active { color:var(--a1); border-left-color:var(--a1); background:rgba(200,255,0,.05); }
.nav-icon { font-size:15px; width:20px; text-align:center; flex-shrink:0; }
.nav-badge { background:var(--a2); color:#fff; font-size:10px; font-weight:700; padding:1px 6px; border-radius:10px; margin-left:auto; line-height:1.4; }
.s-bottom { padding:14px 20px; border-top:1px solid var(--border); flex-shrink:0; }
.btn-logout { width:100%; padding:9px; border-radius:8px; border:1px solid var(--border); background:transparent; color:var(--muted); cursor:pointer; font-family:'DM Sans',sans-serif; font-size:13px; transition:all .15s; }
.btn-logout:hover { border-color:var(--a2); color:var(--a2); }
.burger { background:none; border:none; color:var(--txt); font-size:20px; cursor:pointer; padding:4px; display:none; }
.topbar-title { font-family:'Syne',sans-serif; font-weight:700; font-size:15px; }
.topbar-right { margin-left:auto; display:flex; align-items:center; gap:10px; }
.notif-btn { width:34px; height:34px; border-radius:50%; background:var(--card); border:1px solid var(--border); display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:16px; transition:border-color .15s; }
.notif-btn:hover { border-color:var(--a1); }
.page-hd { margin-bottom:24px; display:flex; align-items:flex-start; justify-content:space-between; flex-wrap:wrap; gap:12px; }
.page-title { font-family:'Syne',sans-serif; font-size:24px; font-weight:700; letter-spacing:-.5px; }
.page-sub { color:var(--muted); font-size:13px; margin-top:3px; }
.card { background:var(--card); border:1px solid var(--border); border-radius:var(--r); padding:20px; }
.card-title { font-family:'Syne',sans-serif; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:1px; color:var(--muted); margin-bottom:14px; }
.g2{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
.g3{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;}
.g4{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;}
.g-auto{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px;}
.mb16{margin-bottom:16px;} .mb24{margin-bottom:24px;}
.stat { background:var(--card); border:1px solid var(--border); border-radius:var(--r); padding:18px 20px; }
.stat-lbl { font-size:11px; color:var(--muted); text-transform:uppercase; letter-spacing:.5px; margin-bottom:8px; }
.stat-val { font-family:'Syne',sans-serif; font-size:26px; font-weight:700; letter-spacing:-1px; }
.stat-note { font-size:12px; color:var(--muted); margin-top:4px; }
.c-a1{color:var(--a1);} .c-a2{color:var(--a2);} .c-a3{color:var(--a3);}
.badge { display:inline-flex; align-items:center; padding:3px 8px; border-radius:20px; font-size:11px; font-weight:500; text-transform:uppercase; letter-spacing:.5px; }
.b-green{background:rgba(200,255,0,.12);color:var(--a1);}
.b-pink{background:rgba(255,60,172,.12);color:var(--a2);}
.b-blue{background:rgba(0,212,255,.12);color:var(--a3);}
.b-gray{background:rgba(107,107,136,.15);color:var(--muted);}
.b-orange{background:rgba(255,165,0,.12);color:#ffa500;}
.tbl-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch;border-radius:8px;}
.tbl-wrap::-webkit-scrollbar{height:3px;}
.tbl-wrap::-webkit-scrollbar-thumb{background:var(--border);border-radius:2px;}
table{width:100%;border-collapse:collapse;}
thead th{text-align:left;padding:8px 12px;font-size:11px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.5px;border-bottom:1px solid var(--border);white-space:nowrap;}
tbody td{padding:12px;border-bottom:1px solid rgba(255,255,255,.04);font-size:13px;}
tbody tr:last-child td{border-bottom:none;}
tbody tr:hover td{background:rgba(255,255,255,.02);}
.info-row{display:flex;justify-content:space-between;align-items:center;padding:13px 0;border-bottom:1px solid rgba(255,255,255,.05);font-size:14px;}
.info-row:last-child{border-bottom:none;}
.info-lbl{color:var(--muted);font-size:13px;}
.form-lbl{font-size:12px;color:var(--muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px;display:block;}
.form-input,.form-select,.form-textarea{width:100%;padding:10px 14px;background:var(--bg);border:1px solid var(--border);border-radius:9px;color:var(--txt);font-family:'DM Sans',sans-serif;font-size:14px;outline:none;transition:border-color .15s;margin-bottom:14px;}
.form-input:focus,.form-select:focus,.form-textarea:focus{border-color:var(--a1);}
.form-textarea{resize:vertical;min-height:80px;}
.modal-bg{display:none;position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:500;align-items:center;justify-content:center;padding:16px;}
.modal-bg.show{display:flex;}
.modal{background:var(--card);border:1px solid var(--border);border-radius:var(--r);padding:28px;width:100%;max-width:460px;max-height:90vh;overflow-y:auto;}
.modal-title{font-family:'Syne',sans-serif;font-size:18px;font-weight:700;margin-bottom:20px;}
.modal-close{float:right;background:none;border:none;color:var(--muted);font-size:20px;cursor:pointer;line-height:1;margin-top:-4px;}
.modal-close:hover{color:var(--a2);}
.btn{display:inline-flex;align-items:center;gap:6px;padding:9px 16px;border-radius:9px;border:none;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:500;transition:all .15s;white-space:nowrap;}
.btn-p{background:var(--a1);color:#000;} .btn-p:hover{background:#d4ff20;}
.btn-g{background:transparent;color:var(--muted);border:1px solid var(--border);} .btn-g:hover{color:var(--txt);border-color:var(--muted);}
.btn-danger{background:rgba(255,60,172,.1);color:var(--a2);border:1px solid rgba(255,60,172,.2);}
.btn-full{width:100%;justify-content:center;}
.nom-row{display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.04);font-size:14px;}
.nom-row:last-child{border-bottom:none;}
.nom-total{font-family:'Syne',sans-serif;font-size:28px;font-weight:700;color:var(--a1);}
.irpf-big{font-family:'Syne',sans-serif;font-size:56px;font-weight:800;color:var(--a1);text-align:center;line-height:1;}
#toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(80px);background:var(--card);border:1px solid var(--border);border-radius:10px;padding:12px 20px;font-size:13px;z-index:1000;transition:transform .3s;white-space:nowrap;}
#toast.show{transform:translateX(-50%) translateY(0);}
@media(max-width:768px){
  :root{--sidebar:100vw;}
  .sidebar{width:100vw;transform:translateX(-100%);position:fixed;top:0;left:0;height:100vh;z-index:300;overflow-y:auto;}
  .sidebar.open{transform:translateX(0);}
  .main-area{margin-left:0;}
  .burger{display:flex!important;}
  .main-content{padding:16px 12px;}
  .g4{grid-template-columns:1fr 1fr;} .g3{grid-template-columns:1fr 1fr;} .g2{grid-template-columns:1fr;}
  .g-auto{grid-template-columns:1fr;}
  .page-title{font-size:20px;}
  .page-hd{margin-bottom:16px;flex-wrap:wrap;gap:10px;}
  .page-hd .btn{width:100%;justify-content:center;}
  .card{padding:16px;} .stat{padding:14px;} .stat-val{font-size:22px;}
  .btn{padding:10px 14px;font-size:14px;}
  .modal{padding:20px;}
  .irpf-big{font-size:40px;} .nom-total{font-size:20px;}
}
@media(max-width:480px){
  .g4{grid-template-columns:1fr 1fr;} .g3{grid-template-columns:1fr;}
  .main-content{padding:12px 10px;}
  .page-title{font-size:18px;}
  .card{padding:14px;} .stat-val{font-size:20px;}
  .modal{max-height:92vh;padding:18px;border-radius:16px 16px 0 0;position:fixed;bottom:0;left:0;right:0;width:100%;max-width:100%;}
  .modal-bg.show{align-items:flex-end;padding:0;}
  .page-hd{flex-direction:column;align-items:stretch;}
  .page-hd .btn{width:100%;justify-content:center;padding:12px;font-size:14px;}
}
`;

// Inyectar CSS compartido si no existe ya un <link> al shared CSS
(function injectSharedCSS() {
  if (document.getElementById('shared-css')) return;
  const style = document.createElement('style');
  style.id = 'shared-css';
  style.textContent = SHARED_CSS;
  document.head.appendChild(style);
})();

// ── NAVEGACIÓN COMPARTIDA PARA PÁGINAS ──
const _NAV_ICONS  = {dashboard:'⚡',perfil:'👤',mensajes:'💬',nominas:'💶',retribuciones:'📊',calendario:'📅',ausencias:'🏖️',eventos:'🎪',galeria:'🖼️',inventario:'📦',incidencias:'🚨',admin:'👥','admin-irpf':'🔧','admin-nominas':'📋','admin-turnos':'🗓'};
const _NAV_LABELS = {dashboard:'Inicio',perfil:'Mi perfil',mensajes:'Mensajes',nominas:'Nóminas',retribuciones:'Retribuciones',calendario:'Calendario',ausencias:'Ausencias',eventos:'Eventos',galeria:'Galería',inventario:'Inventario',incidencias:'Incidencias',admin:'Empleados','admin-irpf':'Cambiar IRPF','admin-nominas':'Nóminas equipo','admin-turnos':'Gestión turnos'};
const _NAV_URLS   = {dashboard:'/index.html',perfil:'/pages/perfil.html',mensajes:'/pages/mensajes.html',nominas:'/pages/nominas.html',retribuciones:'/pages/retribuciones.html',calendario:'/pages/calendario.html',ausencias:'/pages/ausencias.html',eventos:'/pages/eventos.html',galeria:'/pages/galeria.html',inventario:'/pages/inventario.html',incidencias:'/pages/incidencias.html',admin:'/pages/admin.html','admin-irpf':'/pages/admin-irpf.html','admin-nominas':'/pages/admin-nominas.html','admin-turnos':'/pages/admin-turnos.html'};
const _NAV_ROLES  = {
  admin:       ['dashboard','perfil','mensajes','nominas','retribuciones','calendario','ausencias','eventos','galeria','inventario','incidencias','admin','admin-irpf','admin-nominas','admin-turnos'],
  org_admin:   ['dashboard','perfil','mensajes','nominas','retribuciones','calendario','ausencias','eventos','galeria','inventario','incidencias','admin','admin-irpf','admin-nominas','admin-turnos'],
  rrhh:        ['dashboard','perfil','mensajes','nominas','retribuciones','calendario','ausencias','eventos','inventario','incidencias','admin','admin-irpf','admin-nominas','admin-turnos'],
  manager:     ['dashboard','perfil','mensajes','nominas','retribuciones','calendario','ausencias','eventos','galeria','inventario','incidencias'],
  empleado:    ['dashboard','perfil','mensajes','nominas','retribuciones','calendario','ausencias','eventos','inventario','incidencias'],
  tecnico:     ['dashboard','perfil','mensajes','nominas','calendario','ausencias','inventario','incidencias'],
  freelance:   ['dashboard','perfil','mensajes','nominas','calendario','ausencias','eventos','inventario','incidencias'],
  empresa_externa: ['dashboard','perfil','mensajes'],
  superadmin:  ['dashboard','perfil','mensajes','nominas','retribuciones','calendario','ausencias','eventos','galeria','inventario','incidencias','admin','admin-irpf','admin-nominas','admin-turnos'],
};

function buildPageNav(role, activeKey) {
  const keys = _NAV_ROLES[role] || _NAV_ROLES.empleado;
  const el = document.getElementById('nav-items');
  if (!el) return;
  el.innerHTML = keys.map(k =>
    `<div class="nav-item ${k===activeKey?'active':''}" onclick="window.location.href='${_NAV_URLS[k]}'">
      <span class="nav-icon">${_NAV_ICONS[k]}</span><span>${_NAV_LABELS[k]}</span>
    </div>`
  ).join('');
}

function setSidebarUser() {
  if (!userProfile) return;
  const ini = initials(userProfile.nombre), avc = avatarColor(userProfile.role);
  ['s-avatar','tb-avatar'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = ini; el.className = `avatar ${avc}`;
  });
  const sn = document.getElementById('s-name'); if(sn) sn.textContent = userProfile.nombre;
  const sr = document.getElementById('s-role'); if(sr) sr.textContent = userProfile.role;
}
