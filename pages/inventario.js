// pages/inventario.js
checkSession(async () => {
  document.getElementById('app').style.display = 'flex';
  buildPageNav(userProfile.role, 'inventario');
  setSidebarUser();
  await renderInventario();
}, () => window.location.href = '/index.html');

let INVENTARIO = [];
function canAdmin() { return ['admin','rrhh','superadmin','org_admin'].includes(userProfile?.role); }

async function renderInventario() {
  let q = supabase.from('inventario').select('*').order('nombre');
  if (userProfile.organization_id) q = q.eq('organization_id', userProfile.organization_id);
  const { data } = await q; INVENTARIO = data || [];

  document.getElementById('page-content').innerHTML = `
    <div class="page-hd">
      <div><div class="page-title">Inventario</div><div class="page-sub">${INVENTARIO.length} artículos</div></div>
      ${canAdmin()?`<button class="btn btn-p" onclick="nuevoItem()">+ Nuevo artículo</button>`:''}
    </div>
    <div class="card"><div class="tbl-wrap"><table>
      <thead><tr><th>Nombre</th><th>Categoría</th><th>Estado</th><th>Ubicación</th><th></th></tr></thead>
      <tbody>
        ${INVENTARIO.length===0?`<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:30px">Sin artículos</td></tr>`:
          INVENTARIO.map(i=>`<tr>
            <td style="font-weight:500">${i.nombre}</td><td>${i.categoria||'—'}</td>
            <td>${badge(i.estado||'disponible')}</td><td style="color:var(--muted)">${i.ubicacion||'—'}</td>
            <td style="text-align:right">${canAdmin()?`<button class="btn btn-g" style="padding:4px 8px;font-size:11px" onclick="editarItem('${i.id}')">✏️</button>`:''}</td>
          </tr>`).join('')}
      </tbody>
    </table></div></div>`;
  initModal();
}

function nuevoItem() {
  showModal(`<button class="modal-close" onclick="closeModal()">✕</button>
    <div class="modal-title">Nuevo Artículo</div>
    <label class="form-lbl">Nombre *</label><input class="form-input" id="ni-nombre" placeholder="Mesa plegable 180x80cm"/>
    <label class="form-lbl">Categoría</label><input class="form-input" id="ni-categoria" placeholder="Mobiliario"/>
    <label class="form-lbl">Estado</label>
    <select class="form-select" id="ni-estado"><option value="disponible">Disponible</option><option value="en_uso">En uso</option><option value="mantenimiento">Mantenimiento</option></select>
    <label class="form-lbl">Ubicación</label><input class="form-input" id="ni-ubicacion" placeholder="Almacén A"/>
    <label class="form-lbl">Notas</label><textarea class="form-textarea" id="ni-notas"></textarea>
    <button class="btn btn-p btn-full" onclick="guardarItem()">Crear</button>`);
}
async function guardarItem() {
  const nombre=document.getElementById('ni-nombre').value.trim();
  if(!nombre){toast('⚠️ El nombre es obligatorio');return;}
  const payload={nombre,categoria:document.getElementById('ni-categoria').value.trim(),estado:document.getElementById('ni-estado').value,ubicacion:document.getElementById('ni-ubicacion').value.trim(),notas:document.getElementById('ni-notas').value.trim()};
  if(userProfile.organization_id) payload.organization_id=userProfile.organization_id;
  const{error}=await supabase.from('inventario').insert(payload);
  if(error){toast('Error: '+error.message);return;}
  toast('Artículo creado ✓'); closeModal(); await renderInventario();
}
function editarItem(id) {
  const i=INVENTARIO.find(x=>x.id===id); if(!i) return;
  showModal(`<button class="modal-close" onclick="closeModal()">✕</button>
    <div class="modal-title">Editar Artículo</div>
    <label class="form-lbl">Nombre *</label><input class="form-input" id="ei-nombre" value="${i.nombre}"/>
    <label class="form-lbl">Categoría</label><input class="form-input" id="ei-categoria" value="${i.categoria||''}"/>
    <label class="form-lbl">Estado</label>
    <select class="form-select" id="ei-estado"><option value="disponible" ${i.estado==='disponible'?'selected':''}>Disponible</option><option value="en_uso" ${i.estado==='en_uso'?'selected':''}>En uso</option><option value="mantenimiento" ${i.estado==='mantenimiento'?'selected':''}>Mantenimiento</option></select>
    <label class="form-lbl">Ubicación</label><input class="form-input" id="ei-ubicacion" value="${i.ubicacion||''}"/>
    <label class="form-lbl">Notas</label><textarea class="form-textarea" id="ei-notas">${i.notas||''}</textarea>
    <div style="display:flex;gap:8px">
      <button class="btn btn-p btn-full" onclick="actualizarItem('${i.id}')">Guardar</button>
      <button class="btn btn-danger" onclick="eliminarItem('${i.id}')">Eliminar</button>
    </div>`);
}
async function actualizarItem(id) {
  await supabase.from('inventario').update({nombre:document.getElementById('ei-nombre').value.trim(),categoria:document.getElementById('ei-categoria').value.trim(),estado:document.getElementById('ei-estado').value,ubicacion:document.getElementById('ei-ubicacion').value.trim(),notas:document.getElementById('ei-notas').value.trim()}).eq('id',id);
  toast('Actualizado ✓'); closeModal(); await renderInventario();
}
async function eliminarItem(id) {
  if(!confirm('¿Eliminar este artículo?')) return;
  await supabase.from('inventario').delete().eq('id',id);
  toast('Eliminado ✓'); closeModal(); await renderInventario();
}
