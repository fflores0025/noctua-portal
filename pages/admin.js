// pages/admin.js
checkSession(async () => {
  if(!['admin','rrhh','superadmin','org_admin'].includes(userProfile?.role)){window.location.href='/index.html';return;}
  document.getElementById('app').style.display = 'flex';
  buildPageNav(userProfile.role, 'admin');
  setSidebarUser();
  await renderAdmin();
}, () => window.location.href = '/index.html');

let EMPLEADOS = [];

async function renderAdmin() {
  let q = supabase.from('empleados').select('*');
  if(userProfile.role!=='superadmin'&&userProfile.organization_id) q=q.eq('organization_id',userProfile.organization_id);
  const{data}=await q; EMPLEADOS=data||[];

  document.getElementById('page-content').innerHTML=`
    <div class="page-hd">
      <div><div class="page-title">Empleados</div><div class="page-sub">${EMPLEADOS.length} personas</div></div>
      <button class="btn btn-p" onclick="nuevoEmpleado()">+ Nuevo</button>
    </div>
    <div class="card"><div class="tbl-wrap"><table>
      <thead><tr><th>Nombre</th><th>Email</th><th>Role</th><th>Dept.</th><th>Estado</th><th></th></tr></thead>
      <tbody>
        ${EMPLEADOS.map(e=>`<tr style="cursor:pointer" onclick="verEmpleado('${e.id}')">
          <td style="font-weight:500">${e.nombre}</td>
          <td style="color:var(--muted)">${e.email}</td>
          <td>${roleBadge(e.role)}</td>
          <td>${e.departamento||'—'}</td>
          <td>${badge(e.estado||'activo')}</td>
          <td><button class="btn btn-g" style="padding:4px 8px;font-size:11px">Ver</button></td>
        </tr>`).join('')}
      </tbody>
    </table></div></div>`;
  initModal();
}

function nuevoEmpleado() {
  showModal(`<button class="modal-close" onclick="closeModal()">✕</button>
    <div class="modal-title">Nuevo Empleado</div>
    <label class="form-lbl">Nombre *</label><input class="form-input" id="nemp-nombre"/>
    <label class="form-lbl">Email *</label><input class="form-input" id="nemp-email" type="email"/>
    <label class="form-lbl">Departamento</label><input class="form-input" id="nemp-dept"/>
    <label class="form-lbl">Role</label>
    <select class="form-select" id="nemp-role">
      <option value="empleado">Empleado</option><option value="manager">Manager</option>
      <option value="tecnico">Técnico</option><option value="rrhh">RRHH</option>
      <option value="admin">Admin</option><option value="org_admin">Org Admin</option>
    </select>
    <label class="form-lbl">Tipo</label>
    <select class="form-select" id="nemp-tipo"><option value="fijo">Fijo</option><option value="temporal">Temporal</option><option value="freelance">Freelance</option></select>
    <label class="form-lbl">Estado</label>
    <select class="form-select" id="nemp-estado"><option value="activo">Activo</option><option value="baja_temporal">Baja temporal</option><option value="inactivo">Inactivo</option></select>
    <label class="form-lbl">Salario base (€/mes)</label><input class="form-input" id="nemp-salario" type="number" placeholder="2000"/>
    <label class="form-lbl">IRPF (%)</label><input class="form-input" id="nemp-irpf" type="number" value="15"/>
    <button class="btn btn-p btn-full" onclick="guardarEmpleado()">Crear</button>`);
}
async function guardarEmpleado() {
  const nombre=document.getElementById('nemp-nombre').value.trim();
  const email=document.getElementById('nemp-email').value.trim();
  if(!nombre||!email){toast('⚠️ Nombre y email obligatorios');return;}
  const payload={nombre,email,departamento:document.getElementById('nemp-dept').value.trim(),role:document.getElementById('nemp-role').value,tipo:document.getElementById('nemp-tipo').value,estado:document.getElementById('nemp-estado').value,salario_base:parseFloat(document.getElementById('nemp-salario').value)||0,irpf:parseFloat(document.getElementById('nemp-irpf').value)||15,fecha_alta:new Date().toISOString().slice(0,10)};
  if(userProfile.organization_id) payload.organization_id=userProfile.organization_id;
  const{error}=await supabase.from('empleados').insert(payload);
  if(error){toast('Error: '+error.message);return;}
  toast('Empleado creado ✓'); closeModal(); await renderAdmin();
}
function verEmpleado(id) {
  const e=EMPLEADOS.find(x=>x.id===id); if(!e) return;
  showModal(`<button class="modal-close" onclick="closeModal()">✕</button>
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px">
      <div class="modal-title" style="margin-bottom:0">${e.nombre}</div>${badge(e.estado||'activo')}
    </div>
    <div class="info-row"><span class="info-lbl">Email</span><span>${e.email}</span></div>
    <div class="info-row"><span class="info-lbl">Departamento</span><span>${e.departamento||'—'}</span></div>
    <div class="info-row"><span class="info-lbl">Role</span><span>${roleBadge(e.role)}</span></div>
    <div class="info-row"><span class="info-lbl">Salario base</span><span style="font-weight:600">${(e.salario_base||0).toLocaleString()}€/mes</span></div>
    <div class="info-row"><span class="info-lbl">IRPF</span><span style="color:var(--a1)">${e.irpf}%</span></div>
    <div class="info-row"><span class="info-lbl">Fecha alta</span><span>${e.fecha_alta||'—'}</span></div>
    <div style="display:flex;gap:8px;margin-top:20px">
      <button class="btn btn-p btn-full" onclick="editarEmpleado('${e.id}')">✏️ Editar</button>
      <button class="btn btn-g" onclick="closeModal()">Cerrar</button>
    </div>`);
}
function editarEmpleado(id) {
  const e=EMPLEADOS.find(x=>x.id===id); if(!e) return;
  showModal(`<button class="modal-close" onclick="closeModal()">✕</button>
    <div class="modal-title">Editar Empleado</div>
    <label class="form-lbl">Nombre</label><input class="form-input" id="eemp-nombre" value="${e.nombre}"/>
    <label class="form-lbl">Email</label><input class="form-input" id="eemp-email" value="${e.email}"/>
    <label class="form-lbl">Departamento</label><input class="form-input" id="eemp-dept" value="${e.departamento||''}"/>
    <label class="form-lbl">Role</label>
    <select class="form-select" id="eemp-role">
      ${['empleado','manager','tecnico','rrhh','admin','org_admin'].map(r=>`<option value="${r}" ${e.role===r?'selected':''}>${r}</option>`).join('')}
    </select>
    <label class="form-lbl">Tipo</label>
    <select class="form-select" id="eemp-tipo">
      ${['fijo','temporal','freelance'].map(t=>`<option value="${t}" ${e.tipo===t?'selected':''}>${t}</option>`).join('')}
    </select>
    <label class="form-lbl">Estado</label>
    <select class="form-select" id="eemp-estado">
      ${['activo','baja_temporal','inactivo'].map(s=>`<option value="${s}" ${e.estado===s?'selected':''}>${s}</option>`).join('')}
    </select>
    <label class="form-lbl">Salario base</label><input class="form-input" id="eemp-salario" type="number" value="${e.salario_base||0}"/>
    <label class="form-lbl">IRPF (%)</label><input class="form-input" id="eemp-irpf" type="number" value="${e.irpf||15}"/>
    <div style="display:flex;gap:8px">
      <button class="btn btn-p btn-full" onclick="actualizarEmpleado('${e.id}')">Guardar</button>
      <button class="btn btn-g" onclick="verEmpleado('${e.id}')">Cancelar</button>
    </div>`);
}
async function actualizarEmpleado(id) {
  const{error}=await supabase.from('empleados').update({nombre:document.getElementById('eemp-nombre').value.trim(),email:document.getElementById('eemp-email').value.trim(),departamento:document.getElementById('eemp-dept').value.trim(),role:document.getElementById('eemp-role').value,tipo:document.getElementById('eemp-tipo').value,estado:document.getElementById('eemp-estado').value,salario_base:parseFloat(document.getElementById('eemp-salario').value)||0,irpf:parseFloat(document.getElementById('eemp-irpf').value)||15}).eq('id',id);
  if(error){toast('Error: '+error.message);return;}
  toast('Actualizado ✓'); closeModal(); await renderAdmin(); setTimeout(()=>verEmpleado(id),200);
}
