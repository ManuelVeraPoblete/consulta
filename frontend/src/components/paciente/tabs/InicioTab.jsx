import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { buscarMedicos } from '../../../services/medicoService';
import MedicoAgenda from '../MedicoAgenda';
import styles from './InicioTab.module.css';

const InicioTab = ({ onIrMedicos, onIrHistorial }) => {
  const { user } = useAuth();
  const [medicos, setMedicos]     = useState([]);
  const [medicoSel, setMedicoSel] = useState(null);

  useEffect(() => {
    buscarMedicos({}).then((d) => setMedicos(d.medicos.slice(0, 3))).catch(() => {});
  }, []);

  return (
    <div className={styles.wrapper}>
      {/* Banner de bienvenida */}
      <div className={styles.banner}>
        <div className={styles.bannerLeft}>
          <h1 className={styles.bannerTitle}>¡Bienvenido, {user?.nombre}!</h1>
          <p className={styles.bannerSub}>Estamos aquí para cuidar tu salud y bienestar.</p>
          <div className={styles.bannerStats}>
            <div className={styles.stat}>
              <span className={styles.statNum}>0</span>
              <span className={styles.statLabel}>Historial médico</span>
            </div>
            <div className={styles.statDiv} />
            <div className={styles.stat}>
              <span className={styles.statNum}>0</span>
              <span className={styles.statLabel}>Consultas pendientes</span>
            </div>
          </div>
        </div>
        <div className={styles.bannerRight}>
          <svg width="90" height="90" viewBox="0 0 100 100" fill="none">
            <circle cx="50" cy="50" r="48" fill="rgba(255,255,255,0.12)" />
            <line x1="50" y1="38" x2="50" y2="62" stroke="white" strokeWidth="3" strokeLinecap="round"/>
            <line x1="38" y1="50" x2="62" y2="50" stroke="white" strokeWidth="3" strokeLinecap="round"/>
          </svg>
        </div>
      </div>

      {/* Próxima cita */}
      <div className={styles.proximaCita}>
        <div className={styles.citaHeader}>
          <span className={styles.citaTag}>Próxima cita</span>
        </div>
        <div className={styles.emptyMsg}>No hay citas próximas agendadas</div>
      </div>

      {/* Contenido inferior: 2 columnas */}
      <div className={styles.bottomGrid}>
        <div className={styles.card}>
          <div className={styles.cardHead}>
            <span className={styles.cardTitle}>Historial médico</span>
            <button className={styles.linkBtn} onClick={onIrHistorial}>Ver todo →</button>
          </div>
          <div className={styles.emptyMsg}>Sin registros en el historial médico</div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHead}>
            <span className={styles.cardTitle}>Médicos disponibles</span>
            <button className={styles.linkBtn} onClick={onIrMedicos}>Ver más →</button>
          </div>
          <div className={styles.medicosList}>
            {medicos.length === 0 ? (
              <p className={styles.emptyMsg}>No hay médicos disponibles aún</p>
            ) : medicos.map((m) => (
              <div key={m.id} className={styles.medicoRow}>
                <div className={styles.mAvatar}>
                  {m.usuario.nombre[0]}{m.usuario.apellido[0]}
                </div>
                <div className={styles.mInfo}>
                  <div className={styles.mNombre}>Dr. {m.usuario.nombre} {m.usuario.apellido}</div>
                  <div className={styles.mEsp}>{m.especialidad}</div>
                </div>
                <button className={styles.agendarMiniBtn}
                  onClick={() => setMedicoSel(medicoSel?.id === m.id ? null : m)}>
                  {medicoSel?.id === m.id ? 'Cerrar' : 'Agendar'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {medicoSel && (
        <div className={styles.agendaInline}>
          <MedicoAgenda medico={medicoSel} onClose={() => setMedicoSel(null)} />
        </div>
      )}
    </div>
  );
};

export default InicioTab;
