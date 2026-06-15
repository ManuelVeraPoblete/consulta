import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import styles from './MedicoHeader.module.css';

const MedicoHeader = () => {
  const { user, logout } = useAuth();
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const initials = user ? `${user.nombre[0]}${user.apellido[0]}`.toUpperCase() : 'MD';
  const especialidad = user?.perfil?.especialidad?.nombre || 'Medicina General';

  return (
    <header className={styles.header}>
      <div className={styles.searchBox}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          className={styles.searchInput}
          placeholder="Buscar pacientes, RUT o atenciones..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      <div className={styles.right}>
        <div className={styles.notifWrap}>
          <button className={styles.notifBtn} onClick={() => setNotifOpen(v => !v)}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <span className={styles.notifBadge}>6</span>
          </button>
          {notifOpen && (
            <div className={styles.notifPanel}>
              <div className={styles.notifTitle}>Notificaciones</div>
              {[
                { text: 'Lucas Godoy llegó a recepción', time: 'Hace 5 min', type: 'ok' },
                { text: 'Resultado examen de Valentina Parra', time: 'Hace 20 min', type: 'info' },
                { text: 'Alergia a penicilina — María Fuentes', time: 'Hace 1 h', type: 'warn' },
              ].map((n, i) => (
                <div key={i} className={styles.notifItem}>
                  <span className={`${styles.notifDot} ${styles['notifDot_' + n.type]}`} />
                  <div>
                    <div className={styles.notifText}>{n.text}</div>
                    <div className={styles.notifTime}>{n.time}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.userCard}>
          <div className={styles.avatar}>{initials}</div>
          <div className={styles.userInfo}>
            <div className={styles.userName}>Dr. {user ? `${user.nombre} ${user.apellido}` : 'Médico'}</div>
            <div className={styles.userSpec}>{especialidad}</div>
          </div>
          <button className={styles.logoutBtn} onClick={logout} title="Cerrar sesión">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
};

export default MedicoHeader;
