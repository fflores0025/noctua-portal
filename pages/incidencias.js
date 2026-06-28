// pages/incidencias.js
checkSession(async () => {
  document.getElementById('app').style.display = 'flex';
  buildPageNav(userProfile.role, 'incidencias');
  setSidebarUser();
  await renderIncidencias();
}, () => window.location.href = '/index.html');

let INCIDENCIAS = [], INVENTARIO = [];
function canAdmin() { return ['admin','rrhh','superadmin','org_admin'].includes(userProfile?.role); }

async function renderIncidencias() {
  let q = supabase.from('incidencias').select('*').order('fecha_reporte',{ascending:false});
  if(userProfile.organization_id) q=q.eq('organization_id',userProfile.organization_id);
  const{data}=await q; INCIDENCIAS=data||[];

  document.getElementById('page-content').innerHTML=`
    <div class="page-hd">
      <div><div class="page-title">Incidencias</div><div class="page-sub">${INCIDENCIAS.length} registradas</div></div>
      <button class="btn btn-p" onclick="nuevaIncidencia()">+ Nueva</button>
    </div>
    <div class="card"><div class="tbl-wrap"><table>
      <thead><tr><th>Código</th><th>Material</th><th>Estado</th><th>Fecha</th><th></th></tr></thead>
      <tbody>
        ${INCIDENCIAS.length===0?`<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:30px">Sin incidencias</td></tr>`:
          INCIDENCIAS.map(inc=>`<tr style="cursor:pointer" onclick="verIncidencia('${inc.id}')">
            <td style="font-family:monospace;color:var(--a3)">${inc.codigo||'—'}</td>
            <td style="font-weight:500">${inc.material_afectado||'—'}</td>
            <td>${badge(inc.estado||'abierta')}</td>
            <td style="color:var(--muted)">${inc.fecha_reporte?new Date(inc.fecha_reporte).toLocaleDateString():'—'}</td>
            <td><button class="btn btn-g" style="padding:4px 8px;font-size:11px">Ver</button></td>
          </tr>`).join('')}
      </tbody>
    </table></div></div>`;
  initModal();
}

async function nuevaIncidencia() {
  let invQ = supabase.from('inventario').select('id,nombre');
  if(userProfile.organization_id) invQ=invQ.eq('organization_id',userProfile.organization_id);
  const{data}=await invQ; INVENTARIO=data||[];
  showModal(`<button class="modal-close" onclick="closeModal()">✕</button>
    <div class="modal-title">Nueva Incidencia</div>
    <label class="form-lbl">Material afectado *</label>
    <select class="form-select" id="ninc-material">
      <option value="">— Selecciona —</option>
      ${INVENTARIO.map(i=>`<option value="${i.nombre}">${i.nombre}</option>`).join('')}
      <option value="OTRO">Otro</option>
    </select>
    <label class="form-lbl">Descripción *</label><textarea class="form-textarea" id="ninc-desc"></textarea>
    <label class="form-lbl">Prioridad</label>
    <select class="form-select" id="ninc-prioridad"><option value="baja">Baja</option><option value="media" selected>Media</option><option value="alta">Alta</option></select>
    <button class="btn btn-p btn-full" onclick="guardarIncidencia()">Crear</button>`);
}
async function guardarIncidencia() {
  const material=document.getElementById('ninc-material').value;
  const desc=document.getElementById('ninc-desc').value.trim();
  if(!material||!desc){toast('⚠️ Material y descripción obligatorios');return;}
  let codigo='GEN-001';
  if(material==='OTRO'){
    const{data:last}=await supabase.from('incidencias').select('codigo').like('codigo','GEN-%').order('codigo',{ascending:false}).limit(1).maybeSingle();
    if(last) codigo=`GEN-${String(parseInt(last.codigo.split('-')[1]||'0')+1).padStart(3,'0')}`;
  } else {
    const inv=INVENTARIO.find(i=>i.nombre===material);
    codigo=inv?inv.id.slice(0,8).toUpperCase():'GEN-000';
  }
  const payload={codigo,material_afectado:material==='OTRO'?'Material genérico':material,descripcion:desc,estado:'abierta',prioridad:document.getElementById('ninc-prioridad').value,fecha_reporte:new Date().toISOString(),reportado_por:userProfile.nombre};
  if(userProfile.organization_id) payload.organization_id=userProfile.organization_id;
  const{error}=await supabase.from('incidencias').insert(payload);
  if(error){toast('Error: '+error.message);return;}
  toast('Incidencia creada ✓'); closeModal(); await renderIncidencias();
}
function verIncidencia(id) {
  const inc=INCIDENCIAS.find(x=>x.id===id); if(!inc) return;
  showModal(`<button class="modal-close" onclick="closeModal()">✕</button>
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px">
      <div class="modal-title" style="margin-bottom:0">Incidencia ${inc.codigo}</div>${badge(inc.estado||'abierta')}
    </div>
    <div class="info-row"><span class="info-lbl">Material</span><span style="font-weight:500">${inc.material_afectado||'—'}</span></div>
    <div class="info-row"><span class="info-lbl">Prioridad</span><span>${inc.prioridad||'media'}</span></div>
    <div class="info-row"><span class="info-lbl">Reportado por</span><span>${inc.reportado_por||'—'}</span></div>
    <div class="info-row"><span class="info-lbl">Fecha</span><span>${inc.fecha_reporte?new Date(inc.fecha_reporte).toLocaleDateString():'—'}</span></div>
    <div style="margin-top:16px;padding-top:16px;border-top:1px solid var(--border)">
      <div style="font-size:11px;color:var(--muted);margin-bottom:6px">DESCRIPCIÓN</div>
      <div style="color:var(--muted);font-size:13px;line-height:1.5">${inc.descripcion||'—'}</div>
    </div>
    ${canAdmin()&&inc.estado!=='resuelta'?`<div style="margin-top:20px"><button class="btn btn-p btn-full" onclick="marcarResuelta('${inc.id}')">✓ Marcar como resuelta</button></div>`:''}
    <div style="margin-top:12px"><button class="btn btn-g btn-full" onclick="closeModal()">Cerrar</button></div>`);
}
async function marcarResuelta(id) {
  await supabase.from('incidencias').update({estado:'resuelta'}).eq('id',id);
  toast('Incidencia resuelta ✓'); closeModal(); await renderIncidencias();
}
