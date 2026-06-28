// ─────────────────────────────────────────────────────────────
// auth.js — InOut Media · Connect
// Incluir DESPUÉS de supabase.min.js y ANTES del script de página
// Expone: currentUser, userProfile, orgData, checkSession(), doLogout()
// ─────────────────────────────────────────────────────────────

const SUPABASE_URL     = 'https://raoxkjnwrccoxjcipfpv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhb3hram53cmNjb3hqY2lwZnB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyMzMxNzgsImV4cCI6MjA5MTgwOTE3OH0.dlPG4hpA-ypmGkqrP0ohaiOfMtXq5dpVmV7QNOt7_Qs';

// supabase se declara en el HTML después de cargar el SDK
// auth.js NO declara var supabase — lo usa el que ya existe en el HTML

let currentUser  = null;
let userProfile  = null;
let orgData      = null;

// Roles con permisos de administración
function canAdmin() {
  return ['admin','rrhh','superadmin'].includes(userProfile?.role);
}
function canAdminRole(r) {
  return ['admin','rrhh','superadmin'].includes(r);
}
function canGaleria() {
  return ['org_admin','superadmin','manager','admin'].includes(userProfile?.role);
}

// Cargar sesión activa — llámalo al inicio de cada página
// onSuccess(profile, org) se llama si hay sesión válida
// onFail() se llama si no hay sesión (redirige a index por defecto)
async function checkSession(onSuccess, onFail) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    if (onFail) onFail();
    else window.location.href = '/index.html';
    return;
  }
  currentUser = session.user;
  const { data: perfil, error } = await supabase
    .from('empleados').select('*')
    .eq('auth_user_id', currentUser.id).maybeSingle();

  if (error || !perfil) {
    await supabase.auth.signOut();
    if (onFail) onFail();
    else window.location.href = '/index.html';
    return;
  }

  userProfile = {
    nombre:          perfil.nombre,
    role:            perfil.role,
    dept:            perfil.departamento || '—',
    email:           perfil.email,
    irpf:            parseFloat(perfil.irpf) || 15,
    salarioBase:     parseFloat(perfil.salario_base) || 0,
    tipo:            perfil.tipo || 'fijo',
    tlf:             perfil.telefono || '—',
    fechaAlta:       perfil.fecha_alta || '—',
    estado:          perfil.estado || 'activo',
    _id:             perfil.id,
    organization_id: perfil.organization_id || null,
    pin_desbloqueo:  perfil.pin_desbloqueo || '',
    staff_pin:       perfil.staff_pin || '',
    staff_uid:       perfil.staff_uid || ''
  };

  // Multi-tenant: aplicar branding de org
  const slug = localStorage.getItem('inout_org_slug');
  if (slug || userProfile.organization_id) {
    let q = supabase.from('organizations').select('*');
    q = slug ? q.eq('slug', slug) : q.eq('id', userProfile.organization_id);
    const { data: org } = await q.maybeSingle();
    if (org) {
      orgData = org;
      localStorage.setItem('inout_org_id', org.id);
      localStorage.setItem('inout_org_name', org.nombre);
      if (org.color_primario)   document.documentElement.style.setProperty('--a1', org.color_primario);
      if (org.color_secundario) document.documentElement.style.setProperty('--a2', org.color_secundario);
    }
  }

  if (onSuccess) onSuccess(userProfile, orgData);
}

async function doLogout() {
  await supabase.auth.signOut();
  currentUser = null; userProfile = null; orgData = null;
  window.location.href = '/index.html';
}
