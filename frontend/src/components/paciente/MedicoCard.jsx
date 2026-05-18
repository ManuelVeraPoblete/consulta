import React from 'react';
import styles from './MedicoCard.module.css';

const formatPrecio = (valor) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(valor);

const MODALIDADES = [
  {
    key: 'acepta_fonasa',
    label: 'FONASA',
    color: '#0d9488',
    bg: '#f0fdfa',
    border: '#99f6e4',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    info: (valor) => 'Bono se compra en consulta el día de atención',
  },
  {
    key: 'acepta_isapre',
    label: 'ISAPRE',
    color: '#1a56db',
    bg: '#eff6ff',
    border: '#bfdbfe',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    info: (valor) => 'Bono se compra en consulta el día de atención',
  },
  {
    key: 'acepta_particular',
    label: 'PARTICULAR',
    color: '#7c3aed',
    bg: '#faf5ff',
    border: '#ddd6fe',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
    info: (valor) => `${formatPrecio(valor)} por consulta`,
  },
];

const MedicoCard = ({ medico }) => {
  const { usuario, especialidad, descripcion, valor_particular } = medico;

  const iniciales = `${usuario.nombre[0]}${usuario.apellido[0]}`.toUpperCase();

  const modalidadesActivas = MODALIDADES.filter((m) => medico[m.key]);

  return (
    <div className={styles.card}>
      {/* Cabecera */}
      <div className={styles.header}>
        <div className={styles.avatar}>{iniciales}</div>
        <div className={styles.identity}>
          <h3 className={styles.nombre}>
            Dr. {usuario.nombre} {usuario.apellido}
          </h3>
          <span className={styles.especialidadBadge}>{especialidad}</span>
        </div>
      </div>

      {/* Descripción */}
      {descripcion && <p className={styles.descripcion}>{descripcion}</p>}

      {/* Modalidades de cobro */}
      <div className={styles.modalidades}>
        <p className={styles.modalidadesTitle}>Modalidades de atención</p>
        <div className={styles.modalidadesList}>
          {modalidadesActivas.map((m) => (
            <div key={m.key} className={styles.modalidadItem}>
              <span
                className={styles.modalidadBadge}
                style={{ color: m.color, background: m.bg, borderColor: m.border }}
              >
                {m.icon}
                {m.label}
              </span>
              <span className={styles.modalidadInfo}>
                {m.info(valor_particular)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Acción */}
      <button className={styles.agendarBtn}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        Agendar cita
      </button>
    </div>
  );
};

export default MedicoCard;
