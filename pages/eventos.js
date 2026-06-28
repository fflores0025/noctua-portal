// pages/eventos.js
checkSession(async () => {
  document.getElementById('app').style.display = 'flex';
  buildPageNav(userProfile.role, 'eventos');
  setSidebarUser();
  await renderEventos();
}, () => window.location.href = '/index.html');

let EVENTOS = [], selectedEvent = null;

function canAdmin() { return ['admin','rrhh','superadmin','org_admin'].includes(userProfile?.role); }

async function renderEventos() {
  let q = supabase.from('events').select('*').order('fecha_inicio', { ascending: false });
  if (userProfile.organization_id) q = q.eq('organization_id', userProfile.organization_id);
  const { data } = await q;
  EVENTOS = (data || []).map(e => ({
    ...e,
    fecha: (e.fecha_inicio||'').slice(0,10),
    hora_inicio: (e.fecha_inicio||'').slice(11,16),
    fecha_fin: (e.fecha_fin||'').slice(0,10),
    hora_fin: (e.fecha_fin||'').slice(11,16),
    lugar: `${e.venue_nombre||''}${e.venue_ciudad?', '+e.venue_ciudad:''}`
  }));

  document.getElementById('page-content').innerHTML = `
    <div class="page-hd">
      <div><div class="page-title">Eventos</div><div class="page-sub">${EVENTOS.length} eventos</div></div>
      ${canAdmin() ? `<button class="btn btn-p" onclick="nuevoEvento()">+ Nuevo evento</button>` : ''}
    </div>
    <div class="g-auto">
      ${EVENTOS.map(e => `
        <div class="card" style="cursor:pointer;transition:all .2s" onclick="verEvento('${e.id}')" onmouseover="this.style.borderColor='rgba(200,255,0,.25)';this.style.transform='translateY(-2px)'" onmouseout="this.style.borderColor='var(--border)';this.style.transform='translateY(0)'">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">
            ${badge(e.estado)}<span style="font-size:11px;color:var(--muted)">👥 ${e.equipo||0}</span>
          </div>
          <div style="font-family:Syne,sans-serif;font-size:16px;font-weight:600;margin-bottom:8px">${e.nombre}</div>
          <div style="font-size:12px;color:var(--muted);display:flex;flex-direction:column;gap:4px">
            <div>📅 ${e.fecha} ${e.hora_inicio}</div>
            <div>📍 ${e.lugar||'—'}</div>
          </div>
        </div>`).join('')}
      ${EVENTOS.length === 0 ? `<div class="card" style="text-align:center;padding:40px;color:var(--muted)">No hay eventos registrados.</div>` : ''}
    </div>`;
  initModal();
}

function nuevoEvento() {
  showModal(`<button class="modal-close" onclick="closeModal()">✕</button>
    <div class="modal-title">Nuevo Evento</div>
    <label class="form-lbl">Nombre *</label><input class="form-input" id="ne-nombre" placeholder="Festival Primavera Sound 2025"/>
    <label class="form-lbl">Fecha inicio *</label><input class="form-input" id="ne-fecha" type="date"/>
    <label class="form-lbl">Hora inicio</label><input class="form-input" id="ne-hora" placeholder="20:00"/>
    <label class="form-lbl">Fecha fin</label><input class="form-input" id="ne-fecha-fin" type="date"/>
    <label class="form-lbl">Hora fin</label><input class="form-input" id="ne-hora-fin" placeholder="06:00"/>
    <label class="form-lbl">Lugar / Venue</label><input class="form-input" id="ne-lugar" placeholder="Parc del Fòrum, Barcelona"/>
    <label class="form-lbl">Descripción</label><textarea class="form-textarea" id="ne-desc"></textarea>
    <label class="form-lbl">Estado</label>
    <select class="form-select" id="ne-estado">
      <option value="borrador">Borrador</option><option value="negociacion">Negociación</option>
      <option value="preproduccion">Preproducción</option><option value="confirmado">Confirmado</option>
      <option value="produccion">En Producción</option><option value="finalizado">Finalizado</option>
      <option value="cancelado">Cancelado</option>
    </select>
    <button class="btn btn-p btn-full" onclick="guardarEvento()">Crear evento</button>`);
}

async function guardarEvento() {
  const nombre=document.getElementById('ne-nombre').value.trim();
  const fecha=document.getElementById('ne-fecha').value;
  if(!nombre||!fecha){toast('⚠️ Nombre y fecha obligatorios');return;}
  const hora=document.getElementById('ne-hora').value||'00:00';
  const fechaFin=document.getElementById('ne-fecha-fin').value||fecha;
  const horaFin=document.getElementById('ne-hora-fin').value||'06:00';
  const lugar=document.getElementById('ne-lugar').value.trim();
  const desc=document.getElementById('ne-desc').value.trim();
  const estado=document.getElementById('ne-estado').value;
  const parts=lugar.split(',').map(s=>s.trim());
  const payload={nombre,fecha_inicio:`${fecha}T${hora}:00`,fecha_fin:`${fechaFin}T${horaFin}:00`,venue_nombre:parts[0]||'',venue_ciudad:parts[1]||'',descripcion:desc,estado,equipo:0};
  if(userProfile.organization_id) payload.organization_id=userProfile.organization_id;
  const{error}=await supabase.from('events').insert(payload);
  if(error){toast('Error: '+error.message);return;}
  toast('Evento creado ✓'); closeModal(); await renderEventos();
}

async function verEvento(id) {
  const e=EVENTOS.find(x=>x.id===id); if(!e) return;
  const{data:tickets}=await supabase.from('tickets').select('*').eq('event_id',id);
  selectedEvent={...e,ticketTypes:tickets||[]};
  const editable=canAdmin()&&['borrador','negociacion','preproduccion','confirmado','produccion'].includes(e.estado);
  showModal(`
    <button class="modal-close" onclick="closeModal()">✕</button>
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px">
      <div class="modal-title" style="margin-bottom:0">${e.nombre}</div>${badge(e.estado)}
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
      <div><div style="font-size:11px;color:var(--muted);margin-bottom:4px">INICIO</div><div style="font-weight:500">${e.fecha} ${e.hora_inicio}</div></div>
      <div><div style="font-size:11px;color:var(--muted);margin-bottom:4px">FIN</div><div style="font-weight:500">${e.fecha_fin} ${e.hora_fin}</div></div>
    </div>
    <div style="font-size:11px;color:var(--muted);margin-bottom:4px">LUGAR</div>
    <div style="font-weight:500;margin-bottom:12px">${e.lugar||'—'}</div>
    ${e.descripcion?`<div style="font-size:11px;color:var(--muted);margin-bottom:4px">DESCRIPCIÓN</div><div style="color:var(--muted);font-size:13px;line-height:1.5;margin-bottom:12px">${e.descripcion}</div>`:''}
    <div style="border-top:1px solid var(--border);padding-top:16px;margin-top:8px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <div style="font-family:Syne,sans-serif;font-size:13px;font-weight:700">🎟️ Entradas</div>
        ${editable?`<button class="btn btn-g" style="padding:5px 10px;font-size:11px" onclick="nuevoTicket()">+ Añadir</button>`:''}
      </div>
      <div id="tickets-list">
        ${selectedEvent.ticketTypes.length===0
          ?`<div style="color:var(--muted);font-size:12px;text-align:center;padding:12px">Sin tipos de entrada</div>`
          :selectedEvent.ticketTypes.map(t=>`
            <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;background:var(--bg);border-radius:8px;border:1px solid var(--border);margin-bottom:6px">
              <div><div style="font-weight:600;font-size:13px">${t.name}</div><div style="font-size:11px;color:var(--muted)">${t.price}€ · Stock: ${t.stock||0}</div></div>
              ${editable?`<button class="btn btn-danger" style="padding:4px 8px;font-size:11px" onclick="eliminarTicket('${t.id}')">✕</button>`:''}
            </div>`).join('')}
      </div>
    </div>
    <div style="display:flex;gap:8px;margin-top:20px">
      ${editable?`<button class="btn btn-p btn-full" onclick="editarEvento('${e.id}')">✏️ Editar</button>`:''}
      <button class="btn btn-g btn-full" onclick="closeModal()">Cerrar</button>
    </div>`);
}

function nuevoTicket() {
  if(!selectedEvent) return;
  showModal(`<button class="modal-close" onclick="closeModal()">✕</button>
    <div class="modal-title">Nueva entrada</div>
    <div style="color:var(--muted);font-size:12px;margin-bottom:16px">Evento: <strong style="color:var(--txt)">${selectedEvent.nombre}</strong></div>
    <label class="form-lbl">Nombre *</label><input class="form-input" id="nt-name" placeholder="Entrada General"/>
    <label class="form-lbl">Precio (€) *</label><input class="form-input" id="nt-price" type="number" step="0.01" placeholder="45.00"/>
    <label class="form-lbl">Stock</label><input class="form-input" id="nt-stock" type="number" placeholder="1000"/>
    <label class="form-lbl">Descripción</label><textarea class="form-textarea" id="nt-desc"></textarea>
    <button class="btn btn-p btn-full" onclick="guardarTicket()">Crear entrada</button>`);
}
async function guardarTicket() {
  const name=document.getElementById('nt-name').value.trim();
  const price=parseFloat(document.getElementById('nt-price').value)||0;
  if(!name||price<=0){toast('⚠️ Nombre y precio obligatorios');return;}
  await supabase.from('tickets').insert({event_id:selectedEvent.id,name,price,stock:parseInt(document.getElementById('nt-stock').value)||0,description:document.getElementById('nt-desc').value.trim()});
  toast('Entrada creada ✓'); await verEvento(selectedEvent.id);
}
async function eliminarTicket(id) {
  if(!confirm('¿Eliminar esta entrada?')) return;
  await supabase.from('tickets').delete().eq('id',id);
  toast('Entrada eliminada ✓'); await verEvento(selectedEvent.id);
}

function editarEvento(id) {
  const e=EVENTOS.find(x=>x.id===id); if(!e) return;
  showModal(`<button class="modal-close" onclick="closeModal()">✕</button>
    <div class="modal-title">Editar Evento</div>
    <label class="form-lbl">Nombre *</label><input class="form-input" id="ee-nombre" value="${e.nombre}"/>
    <label class="form-lbl">Fecha inicio</label><input class="form-input" id="ee-fecha" value="${e.fecha}"/>
    <label class="form-lbl">Hora inicio</label><input class="form-input" id="ee-hora" value="${e.hora_inicio}"/>
    <label class="form-lbl">Fecha fin</label><input class="form-input" id="ee-fecha-fin" value="${e.fecha_fin}"/>
    <label class="form-lbl">Hora fin</label><input class="form-input" id="ee-hora-fin" value="${e.hora_fin}"/>
    <label class="form-lbl">Lugar</label><input class="form-input" id="ee-lugar" value="${e.lugar}"/>
    <label class="form-lbl">Descripción</label><textarea class="form-textarea" id="ee-desc">${e.descripcion||e.notas||''}</textarea>
    <label class="form-lbl">Estado</label>
    <select class="form-select" id="ee-estado">
      ${['borrador','negociacion','preproduccion','confirmado','produccion','finalizado','cancelado'].map(s=>`<option value="${s}" ${e.estado===s?'selected':''}>${s}</option>`).join('')}
    </select>
    <div style="display:flex;gap:8px">
      <button class="btn btn-p btn-full" onclick="actualizarEvento('${e.id}')">Guardar</button>
      <button class="btn btn-g" onclick="verEvento('${e.id}')">Cancelar</button>
    </div>`);
}
async function actualizarEvento(id) {
  const nombre=document.getElementById('ee-nombre').value.trim();
  const fecha=document.getElementById('ee-fecha').value;
  if(!nombre||!fecha){toast('⚠️ Nombre y fecha obligatorios');return;}
  const hora=document.getElementById('ee-hora').value||'00:00';
  const fechaFin=document.getElementById('ee-fecha-fin').value||fecha;
  const horaFin=document.getElementById('ee-hora-fin').value||'06:00';
  const lugar=document.getElementById('ee-lugar').value.trim();
  const parts=lugar.split(',').map(s=>s.trim());
  await supabase.from('events').update({nombre,fecha_inicio:`${fecha}T${hora}:00`,fecha_fin:`${fechaFin}T${horaFin}:00`,venue_nombre:parts[0]||'',venue_ciudad:parts[1]||'',descripcion:document.getElementById('ee-desc').value.trim(),estado:document.getElementById('ee-estado').value}).eq('id',id);
  toast('Evento actualizado ✓'); closeModal(); await renderEventos(); setTimeout(()=>verEvento(id),200);
}
