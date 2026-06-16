import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { buscarMedicos } from '../../../services/medicoService';
import { contarNoLeidas } from '../../../services/notificacionService';
import MedicoAgenda from '../MedicoAgenda';
import styles from './InicioTab.module.css';

const InicioTab = ({ onIrMedicos, onIrHistorial }) => {
  const { user } = useAuth();
  const [medicos,   setMedicos]   = useState([]);
  const [medicoSel, setMedicoSel] = useState(null);
  const [noLeidas,  setNoLeidas]  = useState(null);

  useEffect(() => {
    buscarMedicos({}).then((d) => setMedicos(d.medicos.slice(0, 3))).catch(() => {});
    contarNoLeidas().then(setNoLeidas).catch(() => setNoLeidas(0));
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

      {/* Notificaciones */}
      {noLeidas !== null && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 14,
          background: noLeidas > 0 ? '#fffbeb' : '#f8fafc',
          border: `1.5px solid ${noLeidas > 0 ? '#fde68a' : '#e2e8f0'}`,
          borderRadius: 14, padding: '14px 20px', marginBottom: 4,
        }}>
          <div style={{
            width: 42, height: 42, borderRadius: 10, flexShrink: 0,
            background: noLeidas > 0 ? '#fef3c7' : '#f1f5f9',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke={noLeidas > 0 ? '#d97706' : '#94a3b8'} strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: noLeidas > 0 ? '#d97706' : '#64748b', lineHeight: 1 }}>
              {noLeidas}
            </div>
            <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
              Notificacion{noLeidas !== 1 ? 'es' : ''} sin leer
            </div>
          </div>
        </div>
      )}

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
