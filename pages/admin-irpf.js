// pages/admin-irpf.js
checkSession(async () => {
  if(!['admin','rrhh','superadmin','org_admin'].includes(userProfile?.role)){window.location.href='/index.html';return;}
  document.getElementById('app').style.display = 'flex';
  buildPageNav(userProfile.role, 'admin-irpf');
  setSidebarUser();
  await renderAdminIRPF();
}, () => window.location.href = '/index.html');

let EMPLEADOS_IRPF = [];

async function renderAdminIRPF() {
  let q = supabase.from('empleados').select('id,nombre,irpf,salario_base');
  if(userProfile.role!=='superadmin'&&userProfile.organization_id) q=q.eq('organization_id',userProfile.organization_id);
  const{data}=await q; EMPLEADOS_IRPF=data||[];

  document.getElementById('page-content').innerHTML=`
    <div class="page-hd"><div class="page-title">Cambiar IRPF</div></div>
    <div class="card">
      <div class="card-title">Selecciona empleado</div>
      <select class="form-select" id="irpf-empleado" onchange="mostrarEditorIRPF()">
        <option value="">— Selecciona —</option>
        ${EMPLEADOS_IRPF.map(e=>`<option value="${e.id}">${e.nombre} (${e.irpf}%)</option>`).join('')}
      </select>
      <div id="irpf-editor"></div>
    </div>`;
  initModal();
}

function mostrarEditorIRPF() {
  const id=document.getElementById('irpf-empleado').value;
  if(!id){document.getElementById('irpf-editor').innerHTML='';return;}
  const e=EMPLEADOS_IRPF.find(x=>x.id===id); if(!e) return;
  document.getElementById('irpf-editor').innerHTML=`
    <div style="text-align:center;padding:30px 0">
      <div class="irpf-big" id="irpf-val">${e.irpf}%</div>
      <div style="color:var(--muted);font-size:12px;margin:6px 0 20px">Retención actual</div>
      <input type="range" min="2" max="45" value="${e.irpf}" id="irpf-slider" style="width:100%;accent-color:var(--a1);cursor:pointer;height:4px" oninput="document.getElementById('irpf-val').textContent=this.value+'%'"/>
      <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--muted);margin-top:6px"><span>2%</span><span>45%</span></div>
    </div>
    <button class="btn btn-p btn-full" onclick="guardarIRPF('${e.id}')">Actualizar IRPF</button>`;
}
async function guardarIRPF(id) {
  const v=parseInt(document.getElementById('irpf-slider').value);
  await supabase.from('empleados').update({irpf:v}).eq('id',id);
  toast('IRPF actualizado ✓'); await renderAdminIRPF();
}
