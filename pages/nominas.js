// pages/nominas.js
checkSession(async () => {
  document.getElementById('app').style.display = 'flex';
  buildPageNav(userProfile.role, 'nominas');
  setSidebarUser();
  await renderNominas();
}, () => window.location.href = '/index.html');

let NOMINAS = [];

async function renderNominas() {
  const { data } = await supabase.from('nominas').select('*')
    .eq('empleado_id', userProfile._id).order('created_at', { ascending: false });
  NOMINAS = data || [];

  const pc = document.getElementById('page-content');
  pc.innerHTML = `
    <div class="page-hd">
      <div><div class="page-title">${userProfile.role === 'freelance' ? 'Mis Cachés' : 'Mis Nóminas'}</div></div>
    </div>
    <div class="g2">
      <div class="card">
        <div class="card-title">Historial</div>
        ${NOMINAS.length === 0
          ? `<div style="color:var(--muted);font-size:13px;padding:20px 0;text-align:center">No hay nóminas generadas aún.</div>`
          : `<div class="tbl-wrap"><table><thead><tr><th>Mes</th><th>Bruto</th><th>Neto</th><th>Estado</th><th></th></tr></thead><tbody>
              ${NOMINAS.map(n => `
                <tr style="cursor:pointer" onclick="verNomina('${n.id}')">
                  <td style="font-weight:500">${n.mes}</td>
                  <td>${(n.bruto||0).toLocaleString()}€</td>
                  <td style="color:var(--a1);font-weight:600">${(n.neto||0).toLocaleString()}€</td>
                  <td>${badge(n.estado||'pendiente')}</td>
                  <td><button class="btn btn-g" style="padding:4px 8px;font-size:11px">Ver</button></td>
                </tr>`).join('')}
            </tbody></table></div>`}
      </div>
      <div class="card" id="nomina-detail">
        <div class="card-title">Detalle</div>
        <div style="color:var(--muted);font-size:13px;padding-top:10px">Selecciona una nómina.</div>
      </div>
    </div>`;
}

function verNomina(id) {
  const n = NOMINAS.find(x => x.id === id); if (!n) return;
  const bruto = n.bruto||0, irpf = n.irpf||15, ss = n.ss||160;
  const ret = Math.round(bruto*irpf/100), neto = n.neto||(bruto-ret-ss);
  document.getElementById('nomina-detail').innerHTML = `
    <div class="card-title">${n.mes||'—'}</div>
    <div class="nom-row"><span>Salario bruto</span><span style="font-weight:600">${bruto.toLocaleString()}€</span></div>
    <div class="nom-row"><span>IRPF (${irpf}%)</span><span style="color:var(--a2)">−${ret}€</span></div>
    <div class="nom-row"><span>Seguridad Social</span><span style="color:var(--a2)">−${ss}€</span></div>
    <div style="padding-top:14px;display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--border)">
      <span style="font-size:12px;color:var(--muted)">Neto</span>
      <span class="nom-total">${neto.toLocaleString()}€</span>
    </div>
    <div style="margin-top:18px;display:flex;gap:8px;flex-wrap:wrap">
      ${n.estado==='pagada'?`<span class="badge b-green" style="padding:8px 14px;font-size:12px">✓ Pagada</span>`:''}
      <button class="btn btn-g" onclick="generarPDFNomina('${n.id}')">📄 Descargar PDF</button>
    </div>`;
}

function generarPDFNomina(id) {
  const n = NOMINAS.find(x => x.id === id); if (!n) return;
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setFontSize(20); doc.setTextColor(200,255,0); doc.text('InOut Media', 20, 20);
  doc.setFontSize(10); doc.setTextColor(100,100,100); doc.text('Portal Connect', 20, 27);
  doc.setFontSize(16); doc.setTextColor(0,0,0); doc.text('NÓMINA', 20, 45);
  doc.setFontSize(11);
  doc.text(`Empleado: ${n.empleado_nombre||userProfile.nombre}`, 20, 60);
  doc.text(`Mes: ${n.mes}`, 20, 67);
  doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 20, 74);
  doc.setDrawColor(200); doc.line(20,80,190,80);
  let y = 90;
  doc.setFontSize(10); doc.setTextColor(100,100,100);
  doc.text('CONCEPTO', 20, y); doc.text('IMPORTE', 160, y); y+=10;
  doc.setTextColor(0,0,0);
  doc.text('Salario bruto', 20, y); doc.text(`${(n.bruto||0).toLocaleString()} €`, 160, y); y+=8;
  doc.setTextColor(255,60,172);
  doc.text(`IRPF (${n.irpf||15}%)`, 20, y); doc.text(`-${Math.round((n.bruto||0)*(n.irpf||15)/100)} €`, 160, y); y+=8;
  doc.text('Seguridad Social', 20, y); doc.text(`-${n.ss||160} €`, 160, y);
  doc.setDrawColor(200); doc.line(20,y+5,190,y+5); y+=15;
  doc.setFontSize(12); doc.setTextColor(0,0,0); doc.text('NETO A PERCIBIR', 20, y);
  doc.setTextColor(200,255,0); doc.setFontSize(14); doc.text(`${(n.neto||0).toLocaleString()} €`, 160, y);
  doc.setFontSize(9); doc.setTextColor(150,150,150); doc.text('Generado por InOut Media Connect', 20, 280);
  doc.save(`nomina_${(n.mes||'').replace(/\s+/g,'_')}.pdf`);
  toast('PDF descargado ✓');
}
