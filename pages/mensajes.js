// pages/mensajes.js
checkSession(async () => {
  document.getElementById('app').style.display = 'flex';
  buildPageNav(userProfile.role, 'mensajes');
  setSidebarUser();
  await renderMensajes();
  activarRealtime();
}, () => window.location.href = '/index.html');

let MENSAJES = [], EMPLEADOS = [];

async function renderMensajes() {
  // Cargar empleados para destinatarios
  let q = supabase.from('empleados').select('id,nombre').neq('id', userProfile._id);
  if(userProfile.organization_id) q = q.eq('organization_id', userProfile.organization_id);
  const { data: emps } = await q; EMPLEADOS = emps || [];

  await cargarMensajes();

  document.getElementById('page-content').innerHTML = `
    <div class="page-hd"><div><div class="page-title">Mensajes</div></div></div>
    <div class="card">
      <div style="display:flex;flex-direction:column;height:500px">
        <div id="chat-messages" style="flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:8px"></div>
        <div style="display:flex;gap:8px;padding:12px;border-top:1px solid var(--border)">
          <select id="chat-dest" style="width:140px;padding:8px 10px;background:var(--bg);border:1px solid var(--border);border-radius:8px;color:var(--txt);font-family:'DM Sans',sans-serif;font-size:13px;outline:none">
            <option value="">Para…</option>
            ${EMPLEADOS.map(e=>`<option value="${e.id}">${e.nombre}</option>`).join('')}
          </select>
          <input id="chat-input" style="flex:1;padding:8px 12px;background:var(--bg);border:1px solid var(--border);border-radius:8px;color:var(--txt);font-family:'DM Sans',sans-serif;font-size:13px;outline:none" placeholder="Escribe un mensaje…" onkeydown="if(event.key==='Enter')enviarMensaje()"/>
          <button onclick="enviarMensaje()" style="padding:8px 16px;background:var(--a1);border:none;border-radius:8px;color:#000;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:600;cursor:pointer">Enviar</button>
        </div>
      </div>
    </div>`;
  renderChat();
}

async function cargarMensajes() {
  const { data } = await supabase.from('mensajes').select('*')
    .or(`de.eq.${userProfile._id},para.eq.${userProfile._id}`)
    .order('created_at', { ascending: false }).limit(60);
  MENSAJES = data || [];
}

function renderChat() {
  const container = document.getElementById('chat-messages'); if(!container) return;
  const msgs = MENSAJES.slice().reverse();
  let lastDate = '', html = '';
  msgs.forEach(m => {
    const d = new Date(m.created_at), dateStr = d.toLocaleDateString();
    if(dateStr!==lastDate){html+=`<div style="text-align:center;font-size:11px;color:var(--muted);margin:12px 0">${dateStr}</div>`;lastDate=dateStr;}
    const isMine = m.de === userProfile._id;
    const sender = isMine ? 'Tú' : (EMPLEADOS.find(e=>e.id===m.de)?.nombre||'?');
    const receiver = isMine ? (EMPLEADOS.find(e=>e.id===m.para)?.nombre||'?') : 'Tú';
    html+=`<div style="display:flex;${isMine?'justify-content:flex-end':''}">
      <div style="max-width:70%;padding:10px 14px;border-radius:12px;background:${isMine?'rgba(200,255,0,.1)':'var(--bg)'};border:1px solid ${isMine?'rgba(200,255,0,.2)':'var(--border)'}" >
        ${!isMine?`<div style="font-size:11px;color:var(--a3);margin-bottom:4px;font-weight:600">${sender}</div>`:''}
        <div>${m.contenido}</div>
        <div style="font-size:10px;color:var(--muted);margin-top:4px;display:flex;gap:8px">
          <span>${d.toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'})}</span>
          ${isMine?`<span style="color:var(--a1)">→ ${receiver}</span>`:''}
        </div>
      </div>
    </div>`;
  });
  container.innerHTML = html || `<div style="text-align:center;color:var(--muted);padding:40px">Sin mensajes aún</div>`;
  container.scrollTop = container.scrollHeight;
}

async function enviarMensaje() {
  const dest = document.getElementById('chat-dest').value;
  const texto = document.getElementById('chat-input').value.trim();
  if(!dest||!texto){toast('⚠️ Selecciona destinatario y escribe algo');return;}
  await supabase.from('mensajes').insert({de:userProfile._id,para:dest,contenido:texto,leido:false});
  document.getElementById('chat-input').value='';
  await cargarMensajes(); renderChat();
}

function activarRealtime() {
  supabase.channel('mensajes-realtime')
    .on('postgres_changes',{event:'INSERT',schema:'public',table:'mensajes'},async()=>{
      await cargarMensajes(); renderChat();
    }).subscribe();
}
