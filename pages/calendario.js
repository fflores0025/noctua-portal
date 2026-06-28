// pages/calendario.js
checkSession(async () => {
  document.getElementById('app').style.display = 'flex';
  buildPageNav(userProfile.role, 'calendario');
  setSidebarUser();
  await renderCalendario();
}, () => window.location.href = '/index.html');

let selMes=new Date().getMonth(), selYear=new Date().getFullYear(), selDate=null;
let TURNOS=[], EVENTOS=[], AUSENCIAS=[];

async function renderCalendario() {
  const [rT,rE,rA]=await Promise.all([
    supabase.from('turnos').select('*').eq('empleado_id',userProfile._id).order('fecha'),
    supabase.from('events').select('*').order('fecha_inicio',{ascending:false}),
    supabase.from('ausencias').select('*').eq('empleado_id',userProfile._id).eq('estado','aprobada'),
  ]);
  TURNOS=(rT.data||[]).map(t=>({...t,entrada:t.hora_inicio||'—',salida:t.hora_fin||'—',lugar:t.notas||'—'}));
  EVENTOS=(rE.data||[]).map(e=>({...e,fecha:(e.fecha_inicio||'').slice(0,10)}));
  AUSENCIAS=rA.data||[];

  document.getElementById('page-content').innerHTML=`
    <div class="page-hd"><div><div class="page-title">Calendario</div><div class="page-sub">Tus turnos y eventos</div></div></div>
    <div class="g2">
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px">
          <button class="btn btn-g" style="padding:6px 12px;font-size:12px" onclick="cambiarMes(-1)">◀</button>
          <div style="font-family:Syne,sans-serif;font-weight:700;font-size:16px" id="cal-label">—</div>
          <button class="btn btn-g" style="padding:6px 12px;font-size:12px" onclick="cambiarMes(1)">▶</button>
        </div>
        <div id="cal-grid"></div>
        <div style="display:flex;gap:16px;flex-wrap:wrap;margin-top:16px;font-size:11px;color:var(--muted)">
          <span><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--a3);margin-right:4px"></span>Turno</span>
          <span><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--a2);margin-right:4px"></span>Evento</span>
          <span><span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:var(--a1);margin-right:4px"></span>Ausencia</span>
        </div>
      </div>
      <div class="card" id="day-detail"><div class="card-title">Detalle del día</div><div style="color:var(--muted);font-size:13px;padding-top:10px">Selecciona un día.</div></div>
    </div>`;

  // Inyectar estilos cal
  if(!document.getElementById('cal-style')){
    const s=document.createElement('style'); s.id='cal-style';
    s.textContent=`.cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:5px}.cal-hd{text-align:center;padding:6px 4px;font-size:11px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.5px}.cal-day{aspect-ratio:1;display:flex;flex-direction:column;align-items:center;justify-content:center;border-radius:9px;font-size:13px;cursor:pointer;transition:all .15s;background:var(--bg);border:1px solid var(--border);user-select:none;position:relative}.cal-day:hover{border-color:var(--a3);background:rgba(0,212,255,.05)}.cal-day.empty{background:transparent;border-color:transparent;cursor:default;pointer-events:none}.cal-day.today{border-color:var(--a1);color:var(--a1);font-weight:700}.cal-day.selected{background:rgba(200,255,0,.14);border-color:var(--a1);color:var(--a1)}.cal-day.has-event::after{content:'';position:absolute;bottom:4px;left:50%;transform:translateX(-50%);width:5px;height:5px;border-radius:50%;background:var(--a2)}.cal-day.has-turno::after{content:'';position:absolute;bottom:4px;left:50%;transform:translateX(-50%);width:5px;height:5px;border-radius:50%;background:var(--a3)}.cal-day.has-ausencia{background:rgba(200,255,0,.06);border-color:rgba(200,255,0,.25)}`;
    document.head.appendChild(s);
  }
  renderGrid();
}

function cambiarMes(d){
  selMes+=d;
  if(selMes<0){selMes=11;selYear--;}
  if(selMes>11){selMes=0;selYear++;}
  renderGrid();
}

function renderGrid(){
  const meses=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const lbl=document.getElementById('cal-label'); if(lbl) lbl.textContent=`${meses[selMes]} ${selYear}`;
  const hoy=new Date(), hoyStr=`${hoy.getFullYear()}-${String(hoy.getMonth()+1).padStart(2,'0')}-${String(hoy.getDate()).padStart(2,'0')}`;
  const primerDia=new Date(selYear,selMes,1).getDay(), diasMes=new Date(selYear,selMes+1,0).getDate();
  const offset=primerDia===0?6:primerDia-1;
  let html='<div class="cal-grid">';
  ['L','M','X','J','V','S','D'].forEach(d=>html+=`<div class="cal-hd">${d}</div>`);
  for(let i=0;i<offset;i++) html+='<div class="cal-day empty"></div>';
  for(let d=1;d<=diasMes;d++){
    const fecha=`${selYear}-${String(selMes+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const isHoy=fecha===hoyStr, isSel=fecha===selDate;
    const hasTurno=TURNOS.some(t=>t.fecha===fecha);
    const hasEvento=EVENTOS.some(e=>e.fecha===fecha);
    const hasAus=AUSENCIAS.some(a=>{const ini=new Date(a.fecha_inicio+'T00:00:00'),fin=new Date(a.fecha_fin+'T23:59:59'),act=new Date(fecha+'T12:00:00');return act>=ini&&act<=fin;});
    let cls='cal-day';
    if(isHoy) cls+=' today'; if(isSel) cls+=' selected';
    if(hasAus) cls+=' has-ausencia'; if(hasTurno) cls+=' has-turno'; if(hasEvento) cls+=' has-event';
    html+=`<div class="${cls}" onclick="selDay('${fecha}')">${d}</div>`;
  }
  html+='</div>';
  const g=document.getElementById('cal-grid'); if(g) g.innerHTML=html;
}

function selDay(fecha){
  selDate=fecha; renderGrid();
  const turnos=TURNOS.filter(t=>t.fecha===fecha);
  const eventos=EVENTOS.filter(e=>e.fecha===fecha);
  const ausencia=AUSENCIAS.find(a=>{const ini=new Date(a.fecha_inicio+'T00:00:00'),fin=new Date(a.fecha_fin+'T23:59:59'),act=new Date(fecha+'T12:00:00');return act>=ini&&act<=fin;});
  const det=document.getElementById('day-detail'); if(!det) return;
  if(!turnos.length&&!eventos.length&&!ausencia){det.innerHTML=`<div class="card-title">${new Date(fecha+'T12:00:00').toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long'})}</div><div style="color:var(--muted);font-size:13px;padding-top:10px">Sin actividad.</div>`;return;}
  let html=`<div class="card-title">${new Date(fecha+'T12:00:00').toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long'})}</div>`;
  if(ausencia) html+=`<div style="margin-bottom:16px"><div style="font-size:13px;font-weight:700;margin:12px 0 8px;color:var(--a1)">🏖️ Ausencia Aprobada</div><div style="padding:12px;background:var(--bg);border-radius:9px;border:1px solid rgba(200,255,0,.2)">${tipoAusenciaBadge(ausencia.tipo)}<div style="font-size:12px;color:var(--muted);margin-top:6px">Del ${ausencia.fecha_inicio} al ${ausencia.fecha_fin} (${ausencia.dias_totales} días)</div></div></div>`;
  if(turnos.length){html+=`<div style="font-size:13px;font-weight:700;margin:12px 0 8px;color:var(--a3)">Tu turno</div>`;turnos.forEach(t=>{html+=`<div style="padding:12px;background:var(--bg);border-radius:9px;border:1px solid var(--border);margin-bottom:8px"><div style="font-weight:600">${t.tipo==='libre'?'Día libre':t.tipo}</div>${t.tipo!=='libre'?`<div style="font-size:12px;color:var(--muted)">${t.entrada}–${t.salida} · ${t.lugar}</div>`:''}</div>`;});}
  if(eventos.length){html+=`<div style="font-size:13px;font-weight:700;margin:12px 0 8px;color:var(--a2)">Eventos</div>`;eventos.forEach(e=>{html+=`<div style="padding:12px;background:var(--bg);border-radius:9px;border:1px solid var(--border);margin-bottom:8px"><div style="display:flex;justify-content:space-between;align-items:center"><span style="font-family:Syne,sans-serif;font-weight:600;font-size:13px">${e.nombre}</span>${badge(e.estado)}</div></div>`;});}
  det.innerHTML=html;
}
