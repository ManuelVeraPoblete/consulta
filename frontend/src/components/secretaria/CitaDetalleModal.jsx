import React, { useState } from 'react';
import { reagendarCita, cancelarCita } from '../../services/citaService';
import styles from './CitaDetalleModal.module.css';

const PREVISION_LABEL = { fonasa: 'FONASA', isapre: 'ISAPRE', particular: 'Particular' };

const ESTADO_STYLE = {
  programada:  { color: '#1d4ed8', background: '#eff6ff', borderColor: '#bfdbfe' },
  confirmada:  { color: '#15803d', background: '#f0fdf4', borderColor: '#bbf7d0' },
  cancelada:   { color: '#b91c1c', background: '#fef2f2', borderColor: '#fecaca' },
  completada:  { color: '#475569', background: '#f8fafc', borderColor: '#e2e8f0' },
};

const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];

function formatFechaHora(iso) {
  const d = new Date(iso);
  const dia  = d.toLocaleDateString('es-CL', { weekday: 'long' });
  const fecha = `${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`;
  const hora  = d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
  return { dia: dia.charAt(0).toUpperCase() + dia.slice(1), fecha, hora };
}

function iniciales(nombre, apellido) {
  return ((nombre?.[0] ?? '') + (apellido?.[0] ?? '')).toUpperCase();
}

const CitaDetalleModal = ({ cita, accentColor, onClose, onActualizada }) => {
  const [reagendando, setReagendando]   = useState(false);
  const [nuevaFecha, setNuevaFecha]     = useState(() => new Date(cita.fecha_hora).toISOString().split('T')[0]);
  const [nuevaHora, setNuevaHora]       = useState(() => {
    const d = new Date(cita.fecha_hora);
    return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  });
  const [guardando, setGuardando]       = useState(false);
  const [cancelando, setCancelando]     = useState(false);

  const p   = cita.paciente;
  const m   = cita.medico;
  const esp = m?.perfil?.especialidad?.nombre;
  const { dia, fecha, hora } = formatFechaHora(cita.fecha_hora);
  const estadoStyle = ESTADO_STYLE[cita.estado] ?? ESTADO_STYLE.programada;

  const previsionLabel = () => {
    const base = PREVISION_LABEL[p?.prevision_salud] ?? p?.prevision_salud ?? '—';
    if (p?.prevision_salud === 'isapre' && p?.nombre_isapre) return `ISAPRE ${p.nombre_isapre}`;
    if (p?.prevision_salud === 'fonasa' && p?.numero_fonasa) return `FONASA — N° ${p.numero_fonasa}`;
    return base;
  };

  const handleReagendar = async () => {
    if (!nuevaFecha || !nuevaHora) return;
    setGuardando(true);
    try {
      const fecha_hora = new Date(`${nuevaFecha}T${nuevaHora}:00`).toISOString();
      const updated = await reagendarCita(cita.id, { fecha_hora });
      onActualizada(updated);
      setReagendando(false);
    } catch { /* ignore */ }
    finally { setGuardando(false); }
  };

  const handleCancelar = async () => {
    setCancelando(true);
    try {
      await cancelarCita(cita.id);
      onActualizada({ ...cita, estado: 'cancelada' });
    } catch { /* ignore */ }
    finally { setCancelando(false); }
  };

  return (
    <div className={styles.backdrop} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={styles.modal}>

        {/* Header */}
        <div className={styles.header} style={{ borderLeftColor: accentColor ?? '#1a56db' }}>
          <div className={styles.avatar}
            style={{ background: `linear-gradient(135deg, ${accentColor ?? '#1a56db'}, #0ea5e9)` }}>
            {iniciales(p?.nombre, p?.apellido)}
          </div>
          <div className={styles.headerInfo}>
            <div className={styles.pacienteNombre}>{p?.nombre} {p?.apellido}</div>
            <div className={styles.pacienteRut}>{p?.rut || 'Sin RUT'}</div>
          </div>
          <span className={styles.estadoBadge} style={estadoStyle}>
            {cita.estado.charAt(0).toUpperCase() + cita.estado.slice(1)}
          </span>
          <button className={styles.closeBtn} onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className={styles.body}>

          {/* Paciente */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Paciente</div>
            <div className={styles.row}>
              <span className={styles.rowLabel}>Previsión</span>
              <span className={styles.rowVal}>{previsionLabel()}</span>
            </div>
            {p?.telefono && (
              <div className={styles.row}>
                <span className={styles.rowLabel}>Teléfono</span>
                <span className={styles.rowVal}>🇨🇱 {p.telefono}</span>
              </div>
            )}
          </div>

          {/* Médico */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Médico tratante</div>
            <div className={styles.row}>
              <span className={styles.rowLabel}>Doctor</span>
              <span className={styles.rowVal}>Dr. {m?.nombre} {m?.apellido}</span>
            </div>
            {esp && (
              <div className={styles.row}>
                <span className={styles.rowLabel}>Especialidad</span>
                <span className={styles.rowVal}>{esp}</span>
              </div>
            )}
          </div>

          {/* Cita */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Detalles de la cita</div>
            <div className={styles.row}>
              <span className={styles.rowLabel}>Fecha</span>
              <span className={styles.rowVal}>{dia}, {fecha}</span>
            </div>
            <div className={styles.row}>
              <span className={styles.rowLabel}>Hora</span>
              <span className={styles.rowVal}>{hora}</span>
            </div>
            <div className={styles.row}>
              <span className={styles.rowLabel}>Duración</span>
              <span className={styles.rowVal}>{cita.duracion_min} min</span>
            </div>
            {cita.motivo && (
              <div className={styles.row}>
                <span className={styles.rowLabel}>Motivo</span>
                <span className={styles.rowVal}>{cita.motivo}</span>
              </div>
            )}
          </div>

          {/* Formulario reagendar */}
          {reagendando && (
            <div className={styles.reagendarBox}>
              <div className={styles.reagendarTitle}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                Nueva fecha y hora
              </div>
              <div className={styles.inputRow}>
                <div>
                  <div className={styles.fieldLabel}>Fecha</div>
                  <input className={styles.input} type="date"
                    value={nuevaFecha}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={e => setNuevaFecha(e.target.value)} />
                </div>
                <div>
                  <div className={styles.fieldLabel}>Hora</div>
                  <input className={styles.input} type="time"
                    value={nuevaHora} min="08:00" max="20:00" step="900"
                    onChange={e => setNuevaHora(e.target.value)} />
                </div>
              </div>
              <div className={styles.reagendarActions}>
                <button className={styles.btnNoReagendar} onClick={() => setReagendando(false)}>
                  Cancelar
                </button>
                <button className={styles.btnConfirmar} onClick={handleReagendar} disabled={guardando}>
                  {guardando ? <><span className={styles.spinner} /> Guardando…</> : 'Confirmar reagendo'}
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button className={styles.btnCerrar} onClick={onClose}>Cerrar</button>
          {cita.estado !== 'cancelada' && cita.estado !== 'completada' && !reagendando && (
            <button className={styles.btnReagendar} onClick={() => setReagendando(true)}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              Reagendar
            </button>
          )}
          {cita.estado !== 'cancelada' && cita.estado !== 'completada' && (
            <button className={styles.btnCancelarCita} onClick={handleCancelar} disabled={cancelando}>
              {cancelando ? 'Cancelando…' : 'Cancelar cita'}
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default CitaDetalleModal;
