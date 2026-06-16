import React from 'react';
import { useAuth } from '../../context/AuthContext';
import NotifBell from '../common/NotifBell';
import styles from './AdminHeader.module.css';

const AdminHeader = ({ title }) => {
  const { user, logout } = useAuth();

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <h1 className={styles.title}>{title}</h1>
      </div>

      <div className={styles.right}>
        <div className={styles.dateChip}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <span>{new Date().toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
        </div>

        <NotifBell canSend={true} />

        <div className={styles.userInfo}>
          <div className={styles.avatar}>
            {user ? `${user.nombre[0]}${user.apellido[0]}`.toUpperCase() : 'AD'}
          </div>
          <div className={styles.meta}>
            <div className={styles.name}>{user ? `${user.nombre} ${user.apellido}` : 'Admin'}</div>
            <div className={styles.role}>Administrador</div>
          </div>
        </div>

        <button className={styles.logoutBtn} onClick={logout}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Salir
        </button>
      </div>
    </header>
  );
};

export default AdminHeader;
