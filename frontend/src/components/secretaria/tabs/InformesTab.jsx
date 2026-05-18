import React, { useState, useEffect } from 'react';
import { getInformeDiario, getMisMedicos } from '../../../services/secretariaService';
import styles from './InformesTab.module.css';

/* ── Utilidades ── */
const MESES      = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DIAS_CORTO = ['Lu','Ma','Mi','Ju','Vi','Sa','Do'];

const hoyStr = () => new Date().toISOString().split('T')[0];
const hoyParts = () => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth(), d: d.getDate() }; };

const toStr = (y, m, d) =>
  `${y}-${String(m + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;

const fmtCorta = (s) => {
  if (!s) return '—';
  const [y, m, d] = s.split('-');
  return `${d}/${m}/${y}`;
};

const fmtLarga = (s) => {
  if (!s) return '';
  const [y, m, d] = s.split('-');
  const nombres = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  return `${parseInt(d, 10)} de ${nombres[parseInt(m, 10) - 1]} de ${y}`;
};

const fmtMoneda = (v) =>
  Number(v).toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });

/* ── Calendario con selección de rango ── */
const Calendario = ({ inicio, fin, onSelect }) => {
  const h = hoyParts();
  const [vistaY, setVistaY] = useState(h.y);
  const [vistaM, setVistaM] = useState(h.m);

  const irMes = (delta) => {
    let nm = vistaM + delta, ny = vistaY;
    if (nm > 11) { nm = 0;  ny++; }
    if (nm < 0)  { nm = 11; ny--; }
    setVistaM(nm); setVistaY(ny);
  };

  const primerDia = (new Date(vistaY, vistaM, 1).getDay() + 6) % 7;
  const diasEnMes = new Date(vistaY, vistaM + 1, 0).getDate();
  const totalCeldas = Math.ceil((primerDia + diasEnMes) / 7) * 7;

  const esFuturo = (str) => str > hoyStr();

  const clasesDia = (dNum) => {
    const str = toStr(vistaY, vistaM, dNum);
    const futuro     = esFuturo(str);
    const esHoy      = str === hoyStr();
    const esInicio   = str === inicio;
    const esFin      = str === fin;
    const enRango    = inicio && fin && str > inicio && str < fin;
    const soloInicio = esInicio && !fin;

    return [
      styles.calDia,
      futuro      ? styles.calFuturo  : '',
      esHoy       ? styles.calHoy     : '',
      esInicio    ? styles.calExtremo : '',
      esFin       ? styles.calExtremo : '',
      soloInicio  ? styles.calExtremo : '',
      enRango     ? styles.calEnRango : '',
      esInicio && fin  ? styles.calInicioRango : '',
      esFin            ? styles.calFinRango    : '',
    ].filter(Boolean).join(' ');
  };

  const handleClick = (dNum) => {
    const str = toStr(vistaY, vistaM, dNum);
    if (esFuturo(str)) return;
    onSelect(str);
  };

  const noMasFuturo = vistaY === h.y && vistaM === h.m;

  return (
    <div className={styles.cal}>
      <div className={styles.calNav}>
        <button className={styles.calNavBtn} onClick={() => irMes(-1)}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <span className={styles.calTitulo}>{MESES[vistaM]} {vistaY}</span>
        <button className={styles.calNavBtn} onClick={() => irMes(1)} disabled={noMasFuturo}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      </div>

      <div className={styles.calGrid}>
        {DIAS_CORTO.map(d => <div key={d} className={styles.calDow}>{d}</div>)}
        {Array.from({ length: totalCeldas }, (_, i) => {
          const dNum = i - primerDia + 1;
          if (dNum < 1 || dNum > diasEnMes) return <div key={i} className={styles.calVacio} />;
          return (
            <button key={i} className={clasesDia(dNum)} onClick={() => handleClick(dNum)}>
              {dNum}
            </button>
          );
        })}
      </div>
    </div>
  );
};

/* ── Generador HTML del PDF ── */
const generarPDF = (informe, medico) => {
  const { fechaInicio, fechaFin, grupos, total_general, total_atenciones } = informe;

  const fonasaGrupos    = grupos.filter(g => g.tipo === 'fonasa');
  const isapreGrupos    = grupos.filter(g => g.tipo === 'isapre');
  const particularGrupos= grupos.filter(g => g.tipo === 'particular');

  const fila = (nombre, atenciones, total, cls = '') => `
    <tr class="${cls}">
      <td>${nombre}</td>
      <td class="center">${atenciones}</td>
      <td class="right">${fmtMoneda(total)}</td>
    </tr>`;

  let cuerpo = '';

  if (fonasaGrupos.length) {
    cuerpo += '<tr class="grp-head"><td colspan="3">FONASA</td></tr>';
    fonasaGrupos.forEach(g => { cuerpo += fila('FONASA', g.atenciones, g.total); });
  }
  if (isapreGrupos.length) {
    cuerpo += '<tr class="grp-head"><td colspan="3">ISAPRE</td></tr>';
    isapreGrupos.forEach(g => { cuerpo += fila(g.nombre, g.atenciones, g.total); });
    if (isapreGrupos.length > 1) {
      const st = isapreGrupos.reduce((s,g) => s + g.total, 0);
      const sa = isapreGrupos.reduce((s,g) => s + g.atenciones, 0);
      cuerpo += fila('Subtotal ISAPRE', sa, st, 'subtotal');
    }
  }
  if (particularGrupos.length) {
    cuerpo += '<tr class="grp-head"><td colspan="3">PARTICULAR</td></tr>';
    particularGrupos.forEach(g => { cuerpo += fila('Particular', g.atenciones, g.total); });
  }

  const medicoLinea = medico
    ? `Dr. ${medico.nombre} ${medico.apellido}${medico.especialidad ? ` — ${medico.especialidad}` : ''}`
    : 'Todos los médicos';

  const periodoLinea = fechaInicio === fechaFin
    ? fmtLarga(fechaInicio)
    : `Del ${fmtLarga(fechaInicio)} al ${fmtLarga(fechaFin)}`;

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>Informe — ${fechaInicio} al ${fechaFin}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; color: #1a1a2e; padding: 40px 50px; }
    .enc  { text-align: center; border-bottom: 2.5px solid #1a56db; padding-bottom: 18px; margin-bottom: 28px; }
    .logo { font-size: 22px; font-weight: 800; color: #1a56db; }
    .tit  { font-size: 16px; font-weight: 700; color: #0f172a; margin-top: 6px; }
    .med  { font-size: 14px; font-weight: 600; color: #475569; margin-top: 5px; }
    .per  { font-size: 13px; color: #64748b; margin-top: 3px; }
    .gen  { font-size: 11px; color: #94a3b8; margin-top: 3px; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    thead th { background: #1a56db; color: white; padding: 10px 14px;
               font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
    thead th:nth-child(2) { text-align: center; }
    thead th:nth-child(3) { text-align: right; }
    tbody td { padding: 9px 14px; border-bottom: 1px solid #e2e8f0; }
    tr.grp-head td { background: #f1f5f9; color: #1a56db; font-size: 11px;
                     font-weight: 800; text-transform: uppercase; letter-spacing: 0.07em;
                     padding: 6px 14px; border-bottom: 1px solid #e2e8f0; }
    tr.subtotal td { font-weight: 700; background: #eff6ff; font-style: italic;
                     color: #1e40af; border-top: 1px solid #bfdbfe; }
    .center { text-align: center; }
    .right  { text-align: right; font-variant-numeric: tabular-nums; }
    .total-row   { margin-top: 20px; border-top: 2.5px solid #1a56db; }
    .total-table { width: 100%; border-collapse: collapse; }
    .total-table td { padding: 14px; font-size: 15px; font-weight: 800; }
    .t-lbl  { color: #0f172a; }
    .t-cnt  { text-align: center; color: #475569; font-size: 13px; }
    .t-val  { text-align: right; color: #1a56db; font-size: 17px; font-variant-numeric: tabular-nums; }
    .pie    { margin-top: 40px; padding-top: 14px; border-top: 1px solid #e2e8f0;
              text-align: center; font-size: 11px; color: #94a3b8; }
    @media print { body { padding: 20px 30px; } @page { margin: 15mm; } }
  </style>
</head>
<body>
  <div class="enc">
    <div class="logo">Sistema de Consulta Médica</div>
    <div class="tit">Informe de Atenciones</div>
    <div class="med">${medicoLinea}</div>
    <div class="per">${periodoLinea}</div>
    <div class="gen">Generado el ${new Date().toLocaleString('es-CL', { dateStyle: 'long', timeStyle: 'short' })}</div>
  </div>
  <table>
    <thead>
      <tr>
        <th style="text-align:left">Previsión</th>
        <th>Atenciones</th>
        <th style="text-align:right">Recaudado</th>
      </tr>
    </thead>
    <tbody>
      ${cuerpo || '<tr><td colspan="3" style="text-align:center;padding:30px;color:#94a3b8">Sin atenciones para el período seleccionado</td></tr>'}
    </tbody>
  </table>
  <div class="total-row">
    <table class="total-table">
      <tr>
        <td class="t-lbl">TOTAL GENERAL</td>
        <td class="t-cnt">${total_atenciones} atención${total_atenciones !== 1 ? 'es' : ''}</td>
        <td class="t-val">${fmtMoneda(total_general)}</td>
      </tr>
    </table>
  </div>
  <div class="pie">Documento generado automáticamente — Sistema de Consulta Médica</div>
  <script>window.onload = () => { window.print(); }</script>
</body>
</html>`;

  const w = window.open('', '_blank', 'width=820,height=700');
  w.document.write(html);
  w.document.close();
};

/* ── Componente principal ── */
const InformesTab = () => {
  const [medicos, setMedicos]         = useState([]);
  const [medicoId, setMedicoId]       = useState(null);
  const [rangoInicio, setRangoInicio] = useState(hoyStr());
  const [rangoFin, setRangoFin]       = useState(null);
  const [cargando, setCargando]       = useState(false);
  const [cargandoMed, setCargandoMed] = useState(true);
  const [error, setError]             = useState(null);

  useEffect(() => {
    getMisMedicos()
      .then(data => { setMedicos(data); if (data.length === 1) setMedicoId(data[0].id); })
      .catch(() => {})
      .finally(() => setCargandoMed(false));
  }, []);

  /* Lógica de selección de rango */
  const handleSelectFecha = (str) => {
    if (!rangoInicio || (rangoInicio && rangoFin)) {
      setRangoInicio(str);
      setRangoFin(null);
    } else {
      if (str < rangoInicio) {
        setRangoFin(rangoInicio);
        setRangoInicio(str);
      } else if (str === rangoInicio) {
        setRangoFin(str);
      } else {
        setRangoFin(str);
      }
    }
  };

  const limpiarRango = () => { setRangoInicio(hoyStr()); setRangoFin(null); };

  const fechaFin = rangoFin || rangoInicio;
  const medicoSeleccionado = medicos.find(m => m.id === medicoId) ?? null;

  const estadoRango = !rangoFin
    ? `Inicio: ${fmtCorta(rangoInicio)} · Haga clic en otra fecha para definir el fin`
    : rangoInicio === rangoFin
      ? `Día único: ${fmtCorta(rangoInicio)}`
      : `${fmtCorta(rangoInicio)} → ${fmtCorta(rangoFin)}`;

  const handleGenerar = async () => {
    if (!medicoId) { setError('Seleccione un médico antes de generar el informe.'); return; }
    setCargando(true);
    setError(null);
    try {
      const informe = await getInformeDiario(rangoInicio, fechaFin, medicoId);
      generarPDF(informe, informe.medico);
    } catch {
      setError('No se pudo generar el informe. Intente nuevamente.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className={styles.wrapper}>

      <div className={styles.pageTitle}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1a56db" strokeWidth="2">
          <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/>
        </svg>
        <div>
          <h2 className={styles.title}>Informes</h2>
          <p className={styles.subtitle}>Resumen de atenciones por médico y período</p>
        </div>
      </div>

      <div className={styles.panelGrid}>

        {/* ── Calendario ── */}
        <div className={styles.panelCal}>
          <div className={styles.panelLabel}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1a56db" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            Seleccione el período
          </div>

          <Calendario inicio={rangoInicio} fin={rangoFin} onSelect={handleSelectFecha} />

          <div className={styles.rangoInfo}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={rangoFin ? '#15803d' : '#1a56db'} strokeWidth="2">
              {rangoFin
                ? <><polyline points="20 6 9 17 4 12"/></>
                : <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>
              }
            </svg>
            <span>{estadoRango}</span>
          </div>

          <button className={styles.limpiarBtn} onClick={limpiarRango}>
            Limpiar selección
          </button>
        </div>

        {/* ── Config ── */}
        <div className={styles.panelConfig}>

          <div className={styles.panelLabel}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1a56db" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            Seleccione el médico
          </div>

          {cargandoMed ? (
            <p className={styles.cargandoTxt}>Cargando médicos…</p>
          ) : medicos.length === 0 ? (
            <p className={styles.sinMedicos}>No hay médicos asignados</p>
          ) : (
            <div className={styles.medicosList}>
              {medicos.map(m => (
                <button
                  key={m.id}
                  className={`${styles.medicoCard} ${m.id === medicoId ? styles.medicoActivo : ''}`}
                  onClick={() => { setMedicoId(m.id); setError(null); }}
                >
                  <div className={styles.medicoAvatar}>
                    {(m.nombre?.[0] ?? '') + (m.apellido?.[0] ?? '')}
                  </div>
                  <div className={styles.medicoInfo}>
                    <div className={styles.medicoNombre}>Dr. {m.nombre} {m.apellido}</div>
                    <div className={styles.medicoEsp}>
                      {m.perfil?.especialidad?.nombre ?? 'Sin especialidad'}
                    </div>
                  </div>
                  {m.id === medicoId && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1a56db" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Resumen */}
          {medicoSeleccionado && (
            <div className={styles.resumenSel}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              <div>
                <div><strong>Dr. {medicoSeleccionado.nombre} {medicoSeleccionado.apellido}</strong></div>
                <div style={{ marginTop: 3 }}>
                  {rangoInicio === fechaFin
                    ? <>Fecha: <strong>{fmtCorta(rangoInicio)}</strong></>
                    : <>Del <strong>{fmtCorta(rangoInicio)}</strong> al <strong>{fmtCorta(fechaFin)}</strong></>
                  }
                </div>
              </div>
            </div>
          )}

          {error && <div className={styles.errorMsg}>{error}</div>}

          <button
            className={styles.generarBtn}
            onClick={handleGenerar}
            disabled={cargando || !medicoId}
          >
            {cargando ? (
              <><span className={styles.spinner} /> Generando…</>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Generar PDF
              </>
            )}
          </button>

        </div>
      </div>
    </div>
  );
};

export default InformesTab;
