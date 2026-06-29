// pages/admin-turnos.js
checkSession(async () => {
  if(!['admin','rrhh','superadmin','org_admin'].includes(userProfile?.role)){window.location.href='/index.html';return;}
  document.getElementById('app').style.display = 'flex';
  buildPageNav(userProfile.role, 'admin-turnos');
  setSidebarUser();
  await renderAdminTurnos();
}, () => window.location.href = '/index.html');

let TURNOS=[], AUSENCIAS_PEND=[], AUSENCIAS_APRO=[], EMPLEADOS_T=[], vistaActual='turnos';

async function renderAdminTurnos() {
  await Promise.all([cargarTurnos(), cargarAusenciasPend(), cargarAusenciasApro(), cargarEmpleados()]);

  document.getElementById('page-content').innerHTML=`
    <div class="page-hd">
      <div><div class="page-title">Gestión de Turnos</div><div class="page-sub">${TURNOS.length} turnos · ${AUSENCIAS_PEND.length} pendientes</div></div>
      <button class="btn btn-p" onclick="nuevoTurno()">+ Asignar turno</button>
    </div>
    <div style="display:flex;gap:8px;margin-bottom:16px">
      <button class="btn ${vistaActual==='turnos'?'btn-p':'btn-g'}" onclick="cambiarVista('turnos')" style="flex:1">📅 Turnos (${TURNOS.length})</button>
      <button class="btn ${vistaActual==='pendientes'?'btn-p':'btn-g'}" onclick="cambiarVista('pendientes')" style="flex:1">⏳ Pendientes (${AUSENCIAS_PEND.length})</button>
      <button class="btn ${vistaActual==='aprobadas'?'btn-p':'btn-g'}" onclick="cambiarVista('aprobadas')" style="flex:1">✓ Aprobadas (${AUSENCIAS_APRO.length})</button>
    </div>
    <div id="vista-content"></div>`;
  renderVista(); initModal();
}

async function cargarTurnos() {
  let q=supabase.from('turnos').select('*').order('fecha');
  if(userProfile.organization_id) q=q.eq('organization_id',userProfile.organization_id);
  const{data}=await q; TURNOS=data||[];
}
async function cargarAusenciasPend() {
  let q=supabase.from('ausencias').select('*').eq('estado','pendiente').order('created_at',{ascending:false});
  if(userProfile.organization_id) q=q.eq('organization_id',userProfile.organization_id);
  const{data}=await q; AUSENCIAS_PEND=data||[];
}
async function cargarAusenciasApro() {
  let q=supabase.from('ausencias').select('*').eq('estado','aprobada').order('fecha_inicio',{ascending:false});
  if(userProfile.organization_id) q=q.eq('organization_id',userProfile.organization_id);
  const{data}=await q; AUSENCIAS_APRO=data||[];
}
async function cargarEmpleados() {
  let q=supabase.from('empleados').select('id,nombre').eq('estado','activo');
  if(userProfile.organization_id) q=q.eq('organization_id',userProfile.organization_id);
  const{data}=await q; EMPLEADOS_T=data||[];
}

function cambiarVista(v){vistaActual=v;renderVista();}

function renderVista() {
  const c=document.getElementById('vista-content'); if(!c) return;
  if(vistaActual==='turnos') {
    c.innerHTML=`<div class="card"><div class="tbl-wrap"><table>
      <thead><tr><th>Empleado</th><th>Fecha</th><th>Tipo</th><th>Horario</th><th>Lugar</th><th></th></tr></thead>
      <tbody>
        ${TURNOS.length===0?`<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:30px">Sin turnos</td></tr>`:
          TURNOS.slice(0,60).map(t=>`<tr>
            <td style="font-weight:500">${t.empleado_nombre||'—'}</td>
            <td>${t.fecha}</td><td>${t.tipo}</td>
            <td style="color:var(--muted)">${t.tipo==='libre'?'—':`${t.hora_inicio||''}–${t.hora_fin||''}`}</td>
            <td style="color:var(--muted)">${t.notas||'—'}</td>
            <td><button class="btn btn-danger" style="padding:4px 8px;font-size:11px" onclick="eliminarTurno('${t.id}')">✕</button></td>
          </tr>`).join('')}
      </tbody>
    </table></div></div>`;
  } else if(vistaActual==='pendientes') {
    c.innerHTML=`<div class="card"><div class="card-title">Solicitudes pendientes</div>
      ${AUSENCIAS_PEND.length===0?`<div style="text-align:center;color:var(--muted);padding:30px">Sin solicitudes pendientes</div>`:`
      <div class="tbl-wrap"><table>
        <thead><tr><th>Empleado</th><th>Tipo</th><th>Desde</th><th>Hasta</th><th>Días</th><th></th></tr></thead>
        <tbody>
          ${AUSENCIAS_PEND.map(a=>`<tr>
            <td style="font-weight:500">${a.empleado_nombre}</td>
            <td>${tipoAusenciaBadge(a.tipo)}</td>
            <td>${a.fecha_inicio}</td><td>${a.fecha_fin}</td>
            <td style="font-weight:600;color:var(--a3)">${a.dias_totales}</td>
            <td><div style="display:flex;gap:4px">
              <button class="btn btn-p" style="padding:4px 8px;font-size:11px" onclick="aprobarAusencia('${a.id}')">✓</button>
              <button class="btn btn-danger" style="padding:4px 8px;font-size:11px" onclick="rechazarAusencia('${a.id}')">✕</button>
            </div></td>
          </tr>`).join('')}
        </tbody>
      </table></div>`}
    </div>`;
  } else {
    c.innerHTML=`<div class="card"><div class="card-title">Ausencias aprobadas</div>
      ${AUSENCIAS_APRO.length===0?`<div style="text-align:center;color:var(--muted);padding:30px">Sin ausencias aprobadas</div>`:`
      <div class="tbl-wrap"><table>
        <thead><tr><th>Empleado</th><th>Tipo</th><th>Desde</th><th>Hasta</th><th>Días</th><th>Observaciones</th></tr></thead>
        <tbody>
          ${AUSENCIAS_APRO.map(a=>`<tr>
            <td style="font-weight:500">${a.empleado_nombre}</td>
            <td>${tipoAusenciaBadge(a.tipo)}</td>
            <td>${a.fecha_inicio}</td><td>${a.fecha_fin}</td>
            <td style="font-weight:600;color:var(--a1)">${a.dias_totales}</td>
            <td style="color:var(--muted);max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${a.observaciones||'—'}</td>
          </tr>`).join('')}
        </tbody>
      </table></div>`}
    </div>`;
  }
}

function nuevoTurno() {
  showModal(`<button class="modal-close" onclick="closeModal()">✕</button>
    <div class="modal-title">Asignar Turno</div>
    <label class="form-lbl">Empleado *</label>
    <select class="form-select" id="nt-emp">
      <option value="">— Selecciona —</option>
      ${EMPLEADOS_T.map(e=>`<option value="${e.id}|${e.nombre}">${e.nombre}</option>`).join('')}
    </select>
    <label class="form-lbl">Fecha *</label><input class="form-input" id="nt-fecha" type="date"/>
    <label class="form-lbl">Tipo</label>
    <select class="form-select" id="nt-tipo"><option value="oficina">Oficina</option><option value="evento">Evento</option><option value="rodaje">Rodaje</option><option value="libre">Día libre</option></select>
    <label class="form-lbl">Hora entrada</label><input class="form-input" id="nt-entrada" placeholder="09:00"/>
    <label class="form-lbl">Hora salida</label><input class="form-input" id="nt-salida" placeholder="18:00"/>
    <label class="form-lbl">Lugar / Notas</label><input class="form-input" id="nt-lugar"/>
    <button class="btn btn-p btn-full" onclick="guardarTurno()">Asignar</button>`);
}
async function guardarTurno() {
  const empVal=document.getElementById('nt-emp').value;
  const fecha=document.getElementById('nt-fecha').value;
  if(!empVal||!fecha){toast('⚠️ Empleado y fecha obligatorios');return;}
  const [empId,empNombre]=empVal.split('|');
  const payload={empleado_id:empId,empleado_nombre:empNombre,fecha,tipo:document.getElementById('nt-tipo').value,hora_inicio:document.getElementById('nt-entrada').value,hora_fin:document.getElementById('nt-salida').value,notas:document.getElementById('nt-lugar').value};
  if(userProfile.organization_id) payload.organization_id=userProfile.organization_id;
  await supabase.from('turnos').insert(payload);
  toast('Turno asignado ✓'); closeModal(); await renderAdminTurnos();
}
async function eliminarTurno(id) {
  if(!confirm('¿Eliminar este turno?')) return;
  await supabase.from('turnos').delete().eq('id',id);
  toast('Turno eliminado ✓'); await cargarTurnos(); renderVista();
}

async function aprobarAusencia(id) {
  const a=AUSENCIAS_PEND.find(x=>x.id===id); if(!a) return;
  showModal(`<button class="modal-close" onclick="closeModal()">✕</button>
    <div class="modal-title">Aprobar Ausencia</div>
    <div style="padding:14px;background:var(--bg);border-radius:9px;margin-bottom:16px">
      <div style="font-weight:600">${a.empleado_nombre}</div>
      <div style="margin-top:6px">${tipoAusenciaBadge(a.tipo)}</div>
      <div style="font-size:13px;margin-top:8px">${a.fecha_inicio} → ${a.fecha_fin} <span style="color:var(--a3);font-weight:600">(${a.dias_totales} días)</span></div>
    </div>
    <label class="form-lbl">Observaciones (opcional)</label>
    <textarea class="form-textarea" id="obs-apr"></textarea>
    <div style="display:flex;gap:8px">
      <button class="btn btn-p btn-full" onclick="confirmarAprobar('${id}')">✓ Aprobar</button>
      <button class="btn btn-g" onclick="closeModal()">Cancelar</button>
    </div>`);
}
async function confirmarAprobar(id) {
  await supabase.from('ausencias').update({estado:'aprobada',aprobado_por:userProfile._id,observaciones:document.getElementById('obs-apr').value.trim()||null}).eq('id',id);
  toast('Ausencia aprobada ✓'); closeModal(); await renderAdminTurnos();
}

async function rechazarAusencia(id) {
  showModal(`<button class="modal-close" onclick="closeModal()">✕</button>
    <div class="modal-title">Rechazar Ausencia</div>
    <div style="padding:14px;background:rgba(255,60,172,.1);border:1px solid rgba(255,60,172,.2);border-radius:9px;margin-bottom:16px;font-size:12px;color:var(--a2)">⚠️ Esta acción notificará al empleado del rechazo.</div>
    <label class="form-lbl">Motivo del rechazo *</label>
    <textarea class="form-textarea" id="obs-rej" placeholder="Explica el motivo…"></textarea>
    <div style="display:flex;gap:8px">
      <button class="btn btn-danger btn-full" onclick="confirmarRechazar('${id}')">✕ Rechazar</button>
      <button class="btn btn-g" onclick="closeModal()">Cancelar</button>
    </div>`);
}
async function confirmarRechazar(id) {
  const obs=document.getElementById('obs-rej').value.trim();
  if(!obs){toast('⚠️ Explica el motivo del rechazo');return;}
  await supabase.from('ausencias').update({estado:'rechazada',aprobado_por:userProfile._id,observaciones:obs}).eq('id',id);
  toast('Ausencia rechazada'); closeModal(); await renderAdminTurnos();
}
