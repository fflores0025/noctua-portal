// pages/retribuciones.js
checkSession(async () => {
  document.getElementById('app').style.display = 'flex';
  buildPageNav(userProfile.role, 'retribuciones');
  setSidebarUser();
  renderRetribuciones();
}, () => window.location.href = '/index.html');

function renderRetribuciones() {
  const bruto = userProfile.salarioBase || 0;
  document.getElementById('page-content').innerHTML = `
    <div class="page-hd"><div class="page-title">Retribuciones & IRPF</div></div>
    <div class="g2">
      <div class="card">
        <div class="card-title">Modificar IRPF</div>
        <div style="text-align:center;padding:20px 0 24px">
          <div class="irpf-big" id="irpf-display">${userProfile.irpf}%</div>
          <div style="color:var(--muted);font-size:12px;margin:6px 0 20px">Tu retención actual</div>
          <input type="range" min="2" max="45" value="${userProfile.irpf}" id="irpf-slider" style="width:100%;accent-color:var(--a1);cursor:pointer;height:4px;" oninput="updateIRPF(this.value)"/>
          <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--muted);margin-top:6px"><span>2% mín.</span><span>45% máx.</span></div>
        </div>
        <div style="padding:14px;background:var(--bg);border-radius:9px;border:1px solid var(--border)">
          <div style="font-size:12px;color:var(--muted);margin-bottom:10px">⚠️ El cambio requiere aprobación de RRHH y se aplica en la siguiente nómina.</div>
          <button class="btn btn-p btn-full" onclick="solicitarIRPF()">Solicitar cambio de IRPF</button>
        </div>
      </div>
      <div class="card"><div class="card-title">Simulación mensual</div><div id="sim-content"></div></div>
    </div>`;
  updateIRPF(userProfile.irpf);
}

function updateIRPF(val) {
  const v = parseInt(val);
  const el = document.getElementById('irpf-display'); if(el) el.textContent = v + '%';
  const bruto = userProfile.salarioBase || 0, ss = 160, ret = Math.round(bruto*v/100), neto = bruto-ret-ss;
  const sim = document.getElementById('sim-content'); if(!sim) return;
  sim.innerHTML = `
    <div class="nom-row"><span>Salario bruto</span><span style="font-weight:600">${bruto.toLocaleString()}€</span></div>
    <div class="nom-row"><span>IRPF (${v}%)</span><span style="color:var(--a2)">−${ret}€</span></div>
    <div class="nom-row"><span>Seguridad Social</span><span style="color:var(--a2)">−${ss}€</span></div>
    <div style="padding-top:14px;display:flex;justify-content:space-between;align-items:center">
      <span style="font-family:Syne,sans-serif;font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:1px">Neto mensual</span>
      <span class="nom-total" style="font-size:24px">${neto.toLocaleString()}€</span>
    </div>`;
}

async function solicitarIRPF() {
  const v = parseInt(document.getElementById('irpf-slider').value);
  await supabase.from('solicitudes_irpf').insert({ empleado_id:userProfile._id, empleado_nombre:userProfile.nombre, email:userProfile.email, irpf_actual:userProfile.irpf, irpf_solicitado:v });
  showModal(`<button class="modal-close" onclick="closeModal()">✕</button>
    <div class="modal-title">Solicitud enviada ✅</div>
    <p style="color:var(--muted);font-size:14px;line-height:1.6">Tu solicitud de cambio de IRPF al <strong style="color:var(--a1)">${v}%</strong> ha sido enviada a RRHH.</p>
    <div style="margin-top:20px"><button class="btn btn-p btn-full" onclick="closeModal()">Entendido</button></div>`);
}

initModal();
