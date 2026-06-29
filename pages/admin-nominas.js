// pages/admin-nominas.js
checkSession(async () => {
  if(!['admin','rrhh','superadmin','org_admin'].includes(userProfile?.role)){window.location.href='/index.html';return;}
  document.getElementById('app').style.display = 'flex';
  buildPageNav(userProfile.role, 'admin-nominas');
  setSidebarUser();
  renderAdminNominas();
}, () => window.location.href = '/index.html');

let EMPLEADOS_NOM = [];

async function renderAdminNominas() {
  let q = supabase.from('empleados').select('id,nombre,salario_base,irpf,tipo,estado');
  if(userProfile.role!=='superadmin'&&userProfile.organization_id) q=q.eq('organization_id',userProfile.organization_id);
  const{data}=await q; EMPLEADOS_NOM=data||[];

  document.getElementById('page-content').innerHTML=`
    <div class="page-hd">
      <div><div class="page-title">Nóminas del Equipo</div></div>
      <button class="btn btn-p" onclick="abrirGenerarNominas()">+ Generar nóminas</button>
    </div>
    <div class="card">
      <div class="card-title">Empleados activos con contrato fijo</div>
      <div class="tbl-wrap"><table>
        <thead><tr><th>Nombre</th><th>Bruto</th><th>IRPF</th><th>Neto estimado</th></tr></thead>
        <tbody>
          ${EMPLEADOS_NOM.filter(e=>e.estado==='activo'&&e.tipo==='fijo').map(e=>{
            const bruto=e.salario_base||0,irpf=e.irpf||15,ret=Math.round(bruto*irpf/100),ss=160,neto=bruto-ret-ss;
            return `<tr><td style="font-weight:500">${e.nombre}</td><td>${bruto.toLocaleString()}€</td><td style="color:var(--a2)">${irpf}%</td><td style="color:var(--a1);font-weight:600">${neto.toLocaleString()}€</td></tr>`;
          }).join('')}
        </tbody>
      </table></div>
    </div>`;
  initModal();
}

function abrirGenerarNominas() {
  const fijos=EMPLEADOS_NOM.filter(e=>e.estado==='activo'&&e.tipo==='fijo');
  const mesActual=new Date().toLocaleDateString('es-ES',{year:'numeric',month:'long'});
  showModal(`<button class="modal-close" onclick="closeModal()">✕</button>
    <div class="modal-title">Generar Nóminas</div>
    <label class="form-lbl">Mes</label>
    <input class="form-input" id="gn-mes" value="${mesActual}"/>
    <div style="padding:14px;background:var(--bg);border-radius:9px;border:1px solid var(--border);margin-bottom:16px">
      <div style="font-size:12px;color:var(--muted)">Se generarán nóminas para <strong style="color:var(--a1)">${fijos.length} empleados</strong> con contrato fijo.</div>
    </div>
    <button class="btn btn-p btn-full" onclick="generarNominas()">Generar</button>`);
}
async function generarNominas() {
  const mes=document.getElementById('gn-mes').value.trim();
  if(!mes){toast('⚠️ Indica el mes');return;}
  const fijos=EMPLEADOS_NOM.filter(e=>e.estado==='activo'&&e.tipo==='fijo');
  for(const emp of fijos){
    const bruto=emp.salario_base||0,irpf=emp.irpf||15,ret=Math.round(bruto*irpf/100),ss=160,neto=bruto-ret-ss;
    await supabase.from('nominas').insert({empleado_id:emp.id,empleado_nombre:emp.nombre,mes,bruto,irpf,retencion:ret,ss,neto,estado:'pendiente',generado_por:userProfile.nombre});
  }
  toast(`${fijos.length} nóminas generadas ✓`); closeModal();
}
