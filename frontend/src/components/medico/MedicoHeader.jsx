import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import NotifBell from '../common/NotifBell';
import styles from './MedicoHeader.module.css';

const MedicoHeader = () => {
  const { user, logout } = useAuth();
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
        <NotifBell canSend={true} />

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
