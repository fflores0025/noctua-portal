// pages/ausencias.js
checkSession(async () => {
  document.getElementById('app').style.display = 'flex';
  buildPageNav(userProfile.role, 'ausencias');
  setSidebarUser();
  await renderAusencias();
}, () => window.location.href = '/index.html');

let MIS_AUSENCIAS = [];

async function renderAusencias() {
  const { data } = await supabase.from('ausencias').select('*')
    .eq('empleado_id', userProfile._id).order('created_at', { ascending: false });
  MIS_AUSENCIAS = data || [];

  document.getElementById('page-content').innerHTML = `
    <div class="page-hd">
      <div><div class="page-title">Mis Ausencias</div><div class="page-sub">${MIS_AUSENCIAS.length} solicitudes</div></div>
      <button class="btn btn-p" onclick="nuevaAusencia()">+ Nueva solicitud</button>
    </div>
    <div class="card">
      <div class="tbl-wrap"><table>
        <thead><tr><th>Tipo</th><th>Desde</th><th>Hasta</th><th>Días</th><th>Estado</th><th></th></tr></thead>
        <tbody>
          ${MIS_AUSENCIAS.length === 0
            ? `<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:30px">Sin solicitudes de ausencia</td></tr>`
            : MIS_AUSENCIAS.map(a => `
              <tr style="cursor:pointer" onclick="verAusencia('${a.id}')">
                <td>${tipoAusenciaBadge(a.tipo)}</td>
                <td>${a.fecha_inicio}</td><td>${a.fecha_fin}</td>
                <td style="font-weight:600;color:var(--a3)">${a.dias_totales}</td>
                <td>${badge(a.estado)}</td>
                <td><button class="btn btn-g" style="padding:4px 8px;font-size:11px">Ver</button></td>
              </tr>`).join('')}
        </tbody>
      </table></div>
    </div>`;
  initModal();
}

function nuevaAusencia() {
  showModal(`<button class="modal-close" onclick="closeModal()">✕</button>
    <div class="modal-title">Nueva Solicitud de Ausencia</div>
    <label class="form-lbl">Tipo *</label>
    <select class="form-select" id="na-tipo">
      <option value="vacaciones">🏖️ Vacaciones</option>
      <option value="libre">📅 Día libre</option>
      <option value="asunto_personal">📋 Asunto personal</option>
      <option value="baja_medica">🏥 Baja médica</option>
      <option value="baja_maternidad">👶 Baja maternidad/paternidad</option>
    </select>
    <label class="form-lbl">Fecha inicio *</label><input class="form-input" id="na-inicio" type="date"/>
    <label class="form-lbl">Fecha fin *</label><input class="form-input" id="na-fin" type="date"/>
    <label class="form-lbl">Motivo</label><textarea class="form-textarea" id="na-motivo" placeholder="Descripción opcional…"></textarea>
    <button class="btn btn-p btn-full" onclick="guardarAusencia()">Enviar solicitud</button>`);
}

async function guardarAusencia() {
  const tipo=document.getElementById('na-tipo').value;
  const inicio=document.getElementById('na-inicio').value;
  const fin=document.getElementById('na-fin').value;
  const motivo=document.getElementById('na-motivo').value.trim();
  if(!inicio||!fin){toast('⚠️ Las fechas son obligatorias');return;}
  const dias=Math.ceil((new Date(fin)-new Date(inicio))/(1000*60*60*24))+1;
  if(dias<=0){toast('⚠️ Fecha fin debe ser posterior');return;}
  const payload={empleado_id:userProfile._id,empleado_nombre:userProfile.nombre,tipo,fecha_inicio:inicio,fecha_fin:fin,dias_totales:dias,motivo,estado:'pendiente'};
  if(userProfile.organization_id) payload.organization_id=userProfile.organization_id;
  const{error}=await supabase.from('ausencias').insert(payload);
  if(error){toast('Error: '+error.message);return;}
  toast('Solicitud enviada ✓'); closeModal(); await renderAusencias();
}

function verAusencia(id) {
  const a=MIS_AUSENCIAS.find(x=>x.id===id); if(!a) return;
  showModal(`<button class="modal-close" onclick="closeModal()">✕</button>
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px">
      <div class="modal-title" style="margin-bottom:0">Solicitud</div>${badge(a.estado)}
    </div>
    <div class="info-row"><span class="info-lbl">Tipo</span><span>${tipoAusenciaBadge(a.tipo)}</span></div>
    <div class="info-row"><span class="info-lbl">Desde</span><span style="font-weight:600">${a.fecha_inicio}</span></div>
    <div class="info-row"><span class="info-lbl">Hasta</span><span style="font-weight:600">${a.fecha_fin}</span></div>
    <div class="info-row"><span class="info-lbl">Días</span><span style="color:var(--a3);font-weight:600">${a.dias_totales}</span></div>
    ${a.motivo?`<div style="margin-top:16px;padding-top:16px;border-top:1px solid var(--border)"><div style="font-size:11px;color:var(--muted);margin-bottom:6px">MOTIVO</div><div style="color:var(--muted);font-size:13px">${a.motivo}</div></div>`:''}
    ${a.observaciones?`<div style="margin-top:12px;padding:12px;background:var(--bg);border-radius:8px"><div style="font-size:11px;color:var(--muted);margin-bottom:4px">OBSERVACIONES RRHH</div><div style="font-size:13px">${a.observaciones}</div></div>`:''}
    <div style="margin-top:20px"><button class="btn btn-g btn-full" onclick="closeModal()">Cerrar</button></div>`);
}
