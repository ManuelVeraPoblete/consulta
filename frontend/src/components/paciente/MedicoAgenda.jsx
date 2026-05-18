import React, { useState } from 'react';
import styles from './MedicoAgenda.module.css';

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
const HORAS = ['09:00','09:30','10:00','10:30','11:00','11:30','14:00','14:30','15:00','15:30','16:00','16:30'];

// Genera disponibilidad pseudo-aleatoria estable según día + hora
const disponible = (diaIdx, hora) => {
  const seed = (diaIdx + 1) * hora.replace(':', '');
  return parseInt(seed) % 3 !== 0;
};

const formatPrecio = (v) =>
  v ? new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(v) : null;

const MODALIDAD_INFO = {
  fonasa:     { label: 'FONASA',     color: '#0d9488', bg: '#f0fdfa', nota: 'Bono se compra en consulta el día de atención' },
  isapre:     { label: 'ISAPRE',     color: '#1a56db', bg: '#eff6ff', nota: 'Bono se compra en consulta el día de atención' },
  particular: { label: 'PARTICULAR', color: '#7c3aed', bg: '#faf5ff', nota: null },
};

const MedicoAgenda = ({ medico, onClose }) => {
  const [diaActivo, setDiaActivo] = useState(0);
  const [slotSel, setSlotSel]     = useState(null);
  const [confirmado, setConfirmado] = useState(false);

  const { usuario, especialidad, acepta_fonasa, acepta_isapre, acepta_particular, valor_particular } = medico;

  const modalidades = [
    acepta_fonasa     && 'fonasa',
    acepta_isapre     && 'isapre',
    acepta_particular && 'particular',
  ].filter(Boolean);

  const handleAgendar = () => {
    if (!slotSel) return;
    setConfirmado(true);
    setTimeout(() => { setConfirmado(false); setSlotSel(null); }, 3000);
  };

  return (
    <div className={styles.panel}>
      {/* Cabecera del médico */}
      <div className={styles.panelHeader}>
        <div className={styles.medicInfo}>
          <div className={styles.avatar}>
            {usuario.nombre[0]}{usuario.apellido[0]}
          </div>
          <div>
            <div className={styles.medicName}>Dr. {usuario.nombre} {usuario.apellido}</div>
            <div className={styles.medicSpec}>{especialidad}</div>
          </div>
        </div>
        <button className={styles.closeBtn} onClick={onClose}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      {/* Modalidades de cobro */}
      <div className={styles.modalidades}>
        {modalidades.map((m) => {
          const info = MODALIDAD_INFO[m];
          return (
            <div key={m} className={styles.modalidadRow} style={{ background: info.bg }}>
              <span className={styles.modalidadLabel} style={{ color: info.color }}>{info.label}</span>
              <span className={styles.modalidadNota}>
                {m === 'particular' ? formatPrecio(valor_particular) + ' por consulta' : info.nota}
              </span>
            </div>
          );
        })}
      </div>

      <div className={styles.agendaTitle}>Agenda disponible</div>

      {/* Selector de día */}
      <div className={styles.dias}>
        {DIAS.map((d, i) => (
          <button
            key={d}
            className={`${styles.diaBtn} ${diaActivo === i ? styles.diaActivo : ''}`}
            onClick={() => { setDiaActivo(i); setSlotSel(null); }}
          >
            {d}
          </button>
        ))}
      </div>

      {/* Slots horarios */}
      <div className={styles.slots}>
        {HORAS.map((hora) => {
          const libre = disponible(diaActivo, hora);
          const sel   = slotSel === hora;
          return (
            <button
              key={hora}
              disabled={!libre}
              onClick={() => setSlotSel(hora)}
              className={`${styles.slot} ${!libre ? styles.slotOcupado : ''} ${sel ? styles.slotSel : ''}`}
            >
              {hora}
              {!libre && <span className={styles.slotDot} />}
            </button>
          );
        })}
      </div>

      {/* Confirmación */}
      {confirmado ? (
        <div className={styles.confirmado}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2.5">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          Cita agendada para las {slotSel || '–'}
        </div>
      ) : (
        <button
          className={styles.agendarBtn}
          disabled={!slotSel}
          onClick={handleAgendar}
        >
          {slotSel ? `Agendar las ${slotSel}` : 'Selecciona un horario'}
        </button>
      )}
    </div>
  );
};

export default MedicoAgenda;
