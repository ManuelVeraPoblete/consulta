import React, { useState, useEffect, useCallback } from 'react';
import { getMisOrdenes, crearOrden, actualizarEstadoOrden, getMisPacientes } from '../../../services/medicoService';
import { useAuth } from '../../../context/AuthContext';
import { esc } from '../../../utils/escapeHtml';
import styles from './OrdenesTab.module.css';

/* ── Helpers ──────────────────────────────────────────────── */

const fmtFecha = (iso) =>
  new Date(iso).toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' });

const TIPO_LABELS = {
  laboratorio:       'Laboratorio',
  imagen:            'Imagen',
  electrocardiograma:'ECG',
  otro:              'Otro',
};

const TIPO_COLORES = {
  laboratorio:        styles.tipoLab,
  imagen:             styles.tipoImg,
  electrocardiograma: styles.tipoEcg,
  otro:               styles.tipoOtro,
};

const URGENCIA_LABELS = { rutina: 'Rutina', urgente: 'Urgente', muy_urgente: 'Muy urgente' };
const ESTADO_LABELS   = { pendiente: 'Pendiente', realizado: 'Realizado', cancelado: 'Cancelado' };

/* ── Función de impresión ─────────────────────────────────── */

const imprimirOrden = (orden, doctor) => {
  const p      = orden.paciente;
  const items  = orden.items ?? [];
  const fecha  = orden.createdAt;
  const perfil = doctor?.perfil;

  const docNombre    = doctor ? `Dr./Dra. ${doctor.nombre} ${doctor.apellido}` : '';
  const docEsp       = perfil?.especialidad?.nombre ?? '';
  const docRegistro  = perfil?.numero_registro ? `Reg. N° ${perfil.numero_registro}` : '';
  const docDireccion = perfil?.direccion_consulta ?? '';
  const docTelefono  = perfil?.telefono_consulta ?? '';

  const urgenciaLabel = URGENCIA_LABELS[orden.urgencia] ?? orden.urgencia;

  const urgenciaColor = orden.urgencia === 'muy_urgente'
    ? '#dc2626' : orden.urgencia === 'urgente' ? '#d97706' : '#16a34a';

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Orden de Examen</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Segoe UI',Arial,sans-serif;color:#1e293b;padding:32px 40px;max-width:700px;margin:0 auto}
    .top{border-bottom:2px solid #1d4ed8;padding-bottom:14px;margin-bottom:18px;display:flex;justify-content:space-between;align-items:flex-start;gap:16px}
    .doc-nombre{font-size:17px;font-weight:800;color:#1d4ed8;margin-bottom:3px}
    .doc-sub{font-size:12px;color:#475569;margin-bottom:1px}
    .doc-reg{font-size:11px;color:#94a3b8}
    .doc-contacto{margin-top:6px;font-size:11.5px;color:#64748b;line-height:1.6}
    .fecha-box{text-align:right;font-size:12px;color:#64748b;flex-shrink:0}
    .fecha-box strong{display:block;font-weight:700;color:#334155;margin-bottom:2px}
    .titulo{font-size:20px;font-weight:900;color:#1d4ed8;margin-bottom:4px;letter-spacing:-0.02em}
    .urgencia-badge{display:inline-block;font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;border:1.5px solid;margin-bottom:14px}
    .pac{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px 16px;margin-bottom:20px}
    .pac-lbl{font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.04em;margin-bottom:4px}
    .pac-nombre{font-size:16px;font-weight:700;color:#0f172a}
    .pac-sub{font-size:12px;color:#64748b;margin-top:2px}
    .diag{background:#fefce8;border:1px solid #fde68a;border-radius:8px;padding:10px 14px;margin-bottom:18px;font-size:13px;color:#78350f}
    .diag-lbl{font-size:10px;font-weight:700;color:#92400e;text-transform:uppercase;letter-spacing:.04em;margin-bottom:4px}
    .examenes-titulo{font-size:11.5px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.04em;margin-bottom:10px}
    .item{display:flex;align-items:flex-start;gap:12px;padding:12px 14px;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:8px}
    .item-tipo{min-width:90px;font-size:10.5px;font-weight:700;padding:3px 9px;border-radius:20px;text-align:center;border:1px solid;flex-shrink:0}
    .item-body{flex:1}
    .item-nombre{font-size:14px;font-weight:700;color:#0f172a;margin-bottom:2px}
    .item-codigo{font-size:11px;color:#94a3b8;margin-bottom:3px}
    .item-instr{font-size:12px;color:#475569;line-height:1.5;padding:6px 10px;background:#f8fafc;border-radius:5px;margin-top:4px}
    .obs{margin-top:16px;padding:10px 14px;border:1px dashed #cbd5e1;border-radius:8px}
    .obs-lbl{font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.04em;margin-bottom:4px}
    .obs-txt{font-size:13px;color:#475569;line-height:1.5}
    .firma{margin-top:48px;padding-top:14px;border-top:1px solid #cbd5e1;display:flex;justify-content:space-between;align-items:flex-end}
    .firma-linea{font-size:12px;color:#64748b}
    .firma-nombre{font-size:11.5px;font-weight:700;color:#334155;margin-top:4px}
    .firma-reg{font-size:11px;color:#94a3b8}
    @media print{body{padding:16px}}
    .tipo-lab{color:#0369a1;border-color:#7dd3fc;background:#f0f9ff}
    .tipo-img{color:#7c3aed;border-color:#c4b5fd;background:#faf5ff}
    .tipo-ecg{color:#dc2626;border-color:#fca5a5;background:#fef2f2}
    .tipo-otro{color:#64748b;border-color:#cbd5e1;background:#f8fafc}
  </style>
</head>
<body>
  <div class="top">
    <div>
      <div class="doc-nombre">${esc(docNombre) || 'Consulta Médica Online'}</div>
      ${docEsp       ? `<div class="doc-sub">${esc(docEsp)}</div>` : ''}
      ${docRegistro  ? `<div class="doc-reg">${esc(docRegistro)}</div>` : ''}
      ${(docDireccion || docTelefono) ? `
        <div class="doc-contacto">
          ${docDireccion ? `📍 ${esc(docDireccion)}<br>` : ''}
          ${docTelefono  ? `📞 ${esc(docTelefono)}` : ''}
        </div>` : ''}
    </div>
    <div class="fecha-box">
      <strong>Fecha de emisión</strong>
      ${esc(fmtFecha(fecha))}
    </div>
  </div>

  <div class="titulo">Orden de Exámenes</div>
  <div class="urgencia-badge" style="color:${urgenciaColor};border-color:${urgenciaColor};background:${urgenciaColor}11">
    ${esc(urgenciaLabel)}
  </div>

  <div class="pac">
    <div class="pac-lbl">Paciente</div>
    <div class="pac-nombre">${esc(p?.nombre ?? '')} ${esc(p?.apellido ?? '')}</div>
    <div class="pac-sub">
      ${p?.rut ? `RUT: ${esc(p.rut)}` : ''}
      ${p?.prevision_salud ? ` &nbsp;·&nbsp; ${esc(p.prevision_salud.toUpperCase())}` : ''}
    </div>
  </div>

  ${orden.diagnostico_presuntivo ? `
  <div class="diag">
    <div class="diag-lbl">Diagnóstico presuntivo</div>
    ${esc(orden.diagnostico_presuntivo)}
  </div>` : ''}

  <div class="examenes-titulo">Exámenes solicitados</div>
  ${items.map((it) => {
    const tipoClass = it.tipo === 'laboratorio' ? 'tipo-lab'
      : it.tipo === 'imagen' ? 'tipo-img'
      : it.tipo === 'electrocardiograma' ? 'tipo-ecg' : 'tipo-otro';
    const tipoLabel = TIPO_LABELS[it.tipo] ?? it.tipo;
    return `
    <div class="item">
      <div class="item-tipo ${tipoClass}">${esc(tipoLabel)}</div>
      <div class="item-body">
        <div class="item-nombre">${esc(it.nombre_examen)}</div>
        ${it.codigo ? `<div class="item-codigo">Código: ${esc(it.codigo)}</div>` : ''}
        ${it.instrucciones ? `<div class="item-instr">${esc(it.instrucciones)}</div>` : ''}
      </div>
    </div>`;
  }).join('')}

  ${orden.instrucciones_generales ? `
  <div class="obs">
    <div class="obs-lbl">Instrucciones generales</div>
    <div class="obs-txt">${esc(orden.instrucciones_generales)}</div>
  </div>` : ''}

  <div class="firma">
    <div>
      <div class="firma-linea">_________________________________</div>
      <div class="firma-nombre">${esc(docNombre)}</div>
      ${docRegistro ? `<div class="firma-reg">${esc(docRegistro)}</div>` : ''}
    </div>
    ${docEsp ? `<div style="font-size:11.5px;color:#64748b;text-align:right">${esc(docEsp)}</div>` : ''}
  </div>

  <script>window.onload = function () { window.focus(); window.print(); };</script>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url  = URL.createObjectURL(blob);
  window.open(url, '_blank', 'width=750,height=960,noopener,noreferrer');
  setTimeout(() => URL.revokeObjectURL(url), 30000);
};

/* ── Modal de creación de orden ───────────────────────────── */

const ITEM_VACIO = () => ({ tipo: 'laboratorio', nombre_examen: '', codigo: '', instrucciones: '' });

const CrearOrdenModal = ({ onClose, onCreada }) => {
  const [pacienteBusqueda, setPacienteBusqueda] = useState('');
  const [pacientes,        setPacientes]        = useState([]);
  const [pacienteSelecto,  setPacienteSelecto]  = useState(null);
  const [showDropdown,     setShowDropdown]     = useState(false);

  const [urgencia,                setUrgencia]                = useState('rutina');
  const [diagnosticoPresuntivo,   setDiagnosticoPresuntivo]   = useState('');
  const [instruccionesGenerales,  setInstruccionesGenerales]  = useState('');
  const [items,                   setItems]                   = useState([ITEM_VACIO()]);
  const [guardando,               setGuardando]               = useState(false);
  const [error,                   setError]                   = useState('');

  /* Buscar pacientes con debounce */
  useEffect(() => {
    if (pacienteBusqueda.trim().length < 2) { setPacientes([]); return; }
    const t = setTimeout(async () => {
      try {
        const data = await getMisPacientes(pacienteBusqueda.trim());
        setPacientes(data);
        setShowDropdown(true);
      } catch { setPacientes([]); }
    }, 300);
    return () => clearTimeout(t);
  }, [pacienteBusqueda]);

  const seleccionarPaciente = (p) => {
    setPacienteSelecto(p);
    setPacienteBusqueda(`${p.nombre} ${p.apellido}`);
    setPacientes([]);
    setShowDropdown(false);
  };

  const actualizarItem = (idx, campo, valor) => {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, [campo]: valor } : it));
  };

  const agregarItem = () => setItems(prev => [...prev, ITEM_VACIO()]);

  const eliminarItem = (idx) => {
    if (items.length === 1) return;
    setItems(prev => prev.filter((_, i) => i !== idx));
  };

  const guardar = async () => {
    setError('');
    if (!pacienteSelecto) { setError('Selecciona un paciente.'); return; }
    const itemsValidos = items.filter(i => i.nombre_examen.trim());
    if (!itemsValidos.length) { setError('Agrega al menos un examen.'); return; }

    setGuardando(true);
    try {
      const nueva = await crearOrden({
        paciente_id:             pacienteSelecto.id,
        urgencia,
        diagnostico_presuntivo:  diagnosticoPresuntivo.trim() || null,
        instrucciones_generales: instruccionesGenerales.trim() || null,
        items:                   itemsValidos,
      });
      onCreada(nueva);
      onClose();
    } catch (e) {
      setError(e.response?.data?.message || 'Error al guardar la orden.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modalBox} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.modalHeaderLeft}>
            <div className={styles.modalIcon}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/>
              </svg>
            </div>
            <div className={styles.modalTitle}>Nueva orden de examen</div>
          </div>
          <button className={styles.modalClose} onClick={onClose} aria-label="Cerrar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className={styles.modalBody}>

          {/* Paciente */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Paciente</label>
            <div className={styles.autocompleteWrap}>
              <input
                className={styles.formInput}
                placeholder="Buscar por nombre o RUT…"
                value={pacienteBusqueda}
                onChange={e => { setPacienteBusqueda(e.target.value); setPacienteSelecto(null); }}
                onFocus={() => pacientes.length > 0 && setShowDropdown(true)}
                autoComplete="off"
              />
              {showDropdown && pacientes.length > 0 && (
                <div className={styles.dropdown}>
                  {pacientes.map(p => (
                    <button
                      key={p.id}
                      className={styles.dropdownItem}
                      onClick={() => seleccionarPaciente(p)}
                      type="button"
                    >
                      <span className={styles.dropNombre}>{p.nombre} {p.apellido}</span>
                      <span className={styles.dropMeta}>{p.rut} · {p.prevision_salud?.toUpperCase()}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Urgencia */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Urgencia</label>
            <div className={styles.urgRadios}>
              {[
                { val: 'rutina',     label: 'Rutina',      cls: styles.urgRutina  },
                { val: 'urgente',    label: 'Urgente',     cls: styles.urgUrgente },
                { val: 'muy_urgente',label: 'Muy urgente', cls: styles.urgMuy     },
              ].map(({ val, label, cls }) => (
                <button
                  key={val}
                  type="button"
                  className={`${styles.urgBtn} ${cls} ${urgencia === val ? styles.urgActive : ''}`}
                  onClick={() => setUrgencia(val)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Diagnóstico presuntivo */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Diagnóstico presuntivo <span className={styles.opcional}>(opcional)</span></label>
            <input
              className={styles.formInput}
              placeholder="Ej: Anemia ferropénica, HTA esencial…"
              value={diagnosticoPresuntivo}
              onChange={e => setDiagnosticoPresuntivo(e.target.value)}
            />
          </div>

          {/* Items de examen */}
          <div className={styles.formGroup}>
            <div className={styles.itemsHeader}>
              <label className={styles.formLabel}>Exámenes</label>
              <button type="button" className={styles.btnAgregarItem} onClick={agregarItem}>
                + Agregar examen
              </button>
            </div>

            <div className={styles.itemsList}>
              {items.map((item, idx) => (
                <div key={idx} className={styles.itemRow}>
                  <div className={styles.itemTop}>
                    <select
                      className={styles.tipoSelect}
                      value={item.tipo}
                      onChange={e => actualizarItem(idx, 'tipo', e.target.value)}
                    >
                      <option value="laboratorio">Laboratorio</option>
                      <option value="imagen">Imagen</option>
                      <option value="electrocardiograma">ECG</option>
                      <option value="otro">Otro</option>
                    </select>
                    <input
                      className={styles.formInput}
                      placeholder="Nombre del examen *"
                      value={item.nombre_examen}
                      onChange={e => actualizarItem(idx, 'nombre_examen', e.target.value)}
                    />
                    <input
                      className={`${styles.formInput} ${styles.inputCodigo}`}
                      placeholder="Código"
                      value={item.codigo}
                      onChange={e => actualizarItem(idx, 'codigo', e.target.value)}
                    />
                    {items.length > 1 && (
                      <button
                        type="button"
                        className={styles.btnEliminarItem}
                        onClick={() => eliminarItem(idx)}
                        aria-label="Eliminar examen"
                      >×</button>
                    )}
                  </div>
                  <input
                    className={`${styles.formInput} ${styles.inputInstrucciones}`}
                    placeholder="Instrucciones específicas (opcional)"
                    value={item.instrucciones}
                    onChange={e => actualizarItem(idx, 'instrucciones', e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Instrucciones generales */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Instrucciones generales <span className={styles.opcional}>(opcional)</span></label>
            <textarea
              className={styles.formTextarea}
              rows={2}
              placeholder="Ej: Ayuno de 8 horas, no tomar metformina 24h antes…"
              value={instruccionesGenerales}
              onChange={e => setInstruccionesGenerales(e.target.value)}
            />
          </div>

          {error && <div className={styles.errorMsg}>{error}</div>}
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          <button className={styles.btnCerrar} onClick={onClose} disabled={guardando}>Cancelar</button>
          <button className={styles.btnGuardar} onClick={guardar} disabled={guardando}>
            {guardando ? 'Guardando…' : 'Emitir orden'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Modal detalle ────────────────────────────────────────── */

const DetalleModal = ({ orden, onClose, doctor, onEstadoCambiado }) => {
  const p     = orden.paciente;
  const items = orden.items ?? [];
  const [cambiando, setCambiando] = useState(false);

  const cambiarEstado = async (nuevoEstado) => {
    setCambiando(true);
    try {
      await actualizarEstadoOrden(orden.id, nuevoEstado);
      onEstadoCambiado(orden.id, nuevoEstado);
      onClose();
    } catch { /* silently ignore — user stays in modal */ }
    finally { setCambiando(false); }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modalBox} onClick={e => e.stopPropagation()}>

        <div className={styles.modalHeader}>
          <div className={styles.modalHeaderLeft}>
            <div className={styles.modalAvatar}>{p?.nombre?.[0]}{p?.apellido?.[0]}</div>
            <div>
              <div className={styles.modalNombre}>{p?.nombre} {p?.apellido}</div>
              <div className={styles.modalMeta}>
                {p?.rut && <span>RUT {p.rut}</span>}
                {p?.prevision_salud && <span>· {p.prevision_salud.toUpperCase()}</span>}
              </div>
            </div>
          </div>
          <button className={styles.modalClose} onClick={onClose} aria-label="Cerrar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className={styles.modalSubHeader}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          Emitida el {fmtFecha(orden.createdAt)}
          <span className={`${styles.urgenciaBadge} ${styles['urg_' + orden.urgencia]}`}>
            {URGENCIA_LABELS[orden.urgencia]}
          </span>
          <span className={`${styles.estadoBadge} ${styles['est_' + orden.estado]}`}>
            {ESTADO_LABELS[orden.estado]}
          </span>
        </div>

        <div className={styles.modalBody}>
          {orden.diagnostico_presuntivo && (
            <div className={styles.diagBox}>
              <div className={styles.diagLbl}>Diagnóstico presuntivo</div>
              <div className={styles.diagTxt}>{orden.diagnostico_presuntivo}</div>
            </div>
          )}

          <div className={styles.examSection}>
            <div className={styles.examSectionTitle}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/>
              </svg>
              Exámenes solicitados ({items.length})
            </div>
            <div className={styles.examList}>
              {items.map((it, i) => (
                <div key={i} className={styles.examItem}>
                  <span className={`${styles.examTipo} ${TIPO_COLORES[it.tipo] ?? ''}`}>
                    {TIPO_LABELS[it.tipo] ?? it.tipo}
                  </span>
                  <div className={styles.examInfo}>
                    <div className={styles.examNombre}>{it.nombre_examen}</div>
                    {it.codigo && <div className={styles.examCodigo}>Código: {it.codigo}</div>}
                    {it.instrucciones && <div className={styles.examInstr}>{it.instrucciones}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {orden.instrucciones_generales && (
            <div className={styles.instruccionesBox}>
              <div className={styles.instruccionesLbl}>Instrucciones generales</div>
              <div className={styles.instruccionesTxt}>{orden.instrucciones_generales}</div>
            </div>
          )}
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.btnCerrar} onClick={onClose}>Cerrar</button>
          {orden.estado === 'pendiente' && (
            <button
              className={styles.btnRealizado}
              onClick={() => cambiarEstado('realizado')}
              disabled={cambiando}
            >
              Marcar como realizado
            </button>
          )}
          {orden.estado !== 'cancelado' && (
            <button
              className={styles.btnImprimir}
              onClick={() => imprimirOrden(orden, doctor)}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 6 2 18 2 18 9"/>
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                <rect x="6" y="14" width="12" height="8"/>
              </svg>
              Imprimir orden
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/* ── Componente principal ─────────────────────────────────── */

const OrdenesTab = () => {
  const { user } = useAuth();
  const [ordenes,   setOrdenes]   = useState([]);
  const [cargando,  setCargando]  = useState(true);
  const [error,     setError]     = useState(null);
  const [busqueda,  setBusqueda]  = useState('');
  const [filtroEst, setFiltroEst] = useState('');
  const [detalle,   setDetalle]   = useState(null);
  const [creando,   setCreando]   = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const data = await getMisOrdenes({ busqueda, estado: filtroEst });
      setOrdenes(data);
    } catch {
      setError('No se pudieron cargar las órdenes.');
    } finally {
      setCargando(false);
    }
  }, [busqueda, filtroEst]);

  useEffect(() => { cargar(); }, [cargar]);

  const handleCreada = (nueva) => {
    setOrdenes(prev => [nueva, ...prev]);
  };

  const handleEstadoCambiado = (id, nuevoEstado) => {
    setOrdenes(prev => prev.map(o => o.id === id ? { ...o, estado: nuevoEstado } : o));
  };

  return (
    <div className={styles.wrapper}>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            className={styles.searchInput}
            placeholder="Buscar por paciente o RUT…"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
          {busqueda && (
            <button className={styles.clearBtn} onClick={() => setBusqueda('')} aria-label="Limpiar">×</button>
          )}
        </div>

        <select
          className={styles.filtroSelect}
          value={filtroEst}
          onChange={e => setFiltroEst(e.target.value)}
        >
          <option value="">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="realizado">Realizado</option>
          <option value="cancelado">Cancelado</option>
        </select>

        {!cargando && !error && (
          <span className={styles.count}>{ordenes.length} orden{ordenes.length !== 1 ? 'es' : ''}</span>
        )}

        <button className={styles.btnNueva} onClick={() => setCreando(true)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Nueva orden
        </button>
      </div>

      {/* Estados */}
      {cargando && (
        <div className={styles.emptyState}>
          <div className={styles.spinner} />
          Cargando órdenes…
        </div>
      )}

      {!cargando && error && (
        <div className={styles.errorMsg}>{error}</div>
      )}

      {!cargando && !error && ordenes.length === 0 && (
        <div className={styles.emptyState}>
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5">
            <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/>
          </svg>
          <p>{busqueda || filtroEst ? 'Sin resultados para los filtros aplicados.' : 'No hay órdenes de examen emitidas aún.'}</p>
          {!busqueda && !filtroEst && (
            <button className={styles.btnNuevaEmpty} onClick={() => setCreando(true)}>
              Emitir primera orden
            </button>
          )}
        </div>
      )}

      {/* Lista */}
      {!cargando && !error && ordenes.length > 0 && (
        <div className={styles.list}>
          {ordenes.map(orden => {
            const p     = orden.paciente;
            const items = orden.items ?? [];

            return (
              <div key={orden.id} className={styles.card}>
                <div className={styles.cardTop}>
                  <div className={styles.cardLeft}>
                    <div className={styles.cardAvatar}>{p?.nombre?.[0]}{p?.apellido?.[0]}</div>
                    <div>
                      <div className={styles.cardPaciente}>{p?.nombre} {p?.apellido}</div>
                      <div className={styles.cardSub}>
                        {p?.rut && <span>{p.rut}</span>}
                        {p?.prevision_salud && (
                          <span className={styles.prevision}>{p.prevision_salud.toUpperCase()}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className={styles.cardRight}>
                    <span className={`${styles.urgenciaBadge} ${styles['urg_' + orden.urgencia]}`}>
                      {URGENCIA_LABELS[orden.urgencia]}
                    </span>
                    <span className={`${styles.estadoBadge} ${styles['est_' + orden.estado]}`}>
                      {ESTADO_LABELS[orden.estado]}
                    </span>
                    <div className={styles.cardFecha}>{fmtFecha(orden.createdAt)}</div>
                  </div>
                </div>

                {items.length > 0 && (
                  <div className={styles.exams}>
                    {items.slice(0, 5).map((it, i) => (
                      <span key={i} className={`${styles.exam} ${TIPO_COLORES[it.tipo] ?? ''}`}>
                        {it.nombre_examen}
                      </span>
                    ))}
                    {items.length > 5 && (
                      <span className={styles.examMore}>+{items.length - 5} más</span>
                    )}
                  </div>
                )}

                <div className={styles.actions}>
                  <button className={styles.btnVer} onClick={() => setDetalle(orden)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                    Ver detalle
                  </button>
                  <button className={styles.btnImpr} onClick={() => imprimirOrden(orden, user)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="6 9 6 2 18 2 18 9"/>
                      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                      <rect x="6" y="14" width="12" height="8"/>
                    </svg>
                    Imprimir
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {creando && (
        <CrearOrdenModal onClose={() => setCreando(false)} onCreada={handleCreada} />
      )}

      {detalle && (
        <DetalleModal
          orden={detalle}
          onClose={() => setDetalle(null)}
          doctor={user}
          onEstadoCambiado={handleEstadoCambiado}
        />
      )}
    </div>
  );
};

export default OrdenesTab;
