import React from 'react';
import { useAuth } from '../../context/AuthContext';
import styles from './AdminSidebar.module.css';

const NAV = [
  { id: 'inicio',      label: 'Inicio',       icon: HomeIcon },
  { id: 'usuarios',    label: 'Usuarios',     icon: UsersIcon },
  { id: 'medicos',     label: 'Médicos',      icon: StethIcon },
  { id: 'secretarias', label: 'Secretarias',  icon: SecretIcon },
];

const AdminSidebar = ({ active, onNavigate }) => {
  const { user } = useAuth();
  const initials = user ? `${user.nombre[0]}${user.apellido[0]}`.toUpperCase() : 'AD';

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <div className={styles.brandIcon}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
          </svg>
        </div>
        <div>
          <div className={styles.brandName}>Consulta Médica Online</div>
          <div className={styles.brandRole}>Panel Administrador</div>
        </div>
      </div>

      <nav className={styles.nav}>
        {NAV.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`${styles.navItem} ${active === id ? styles.navActive : ''}`}
            onClick={() => onNavigate(id)}
          >
            <Icon active={active === id} />
            <span>{label}</span>
            {active === id && <div className={styles.activeBar} />}
          </button>
        ))}
      </nav>

      <div className={styles.userCard}>
        <div className={styles.userAvatar}>{initials}</div>
        <div className={styles.userInfo}>
          <div className={styles.userName}>{user ? `${user.nombre} ${user.apellido}` : 'Admin'}</div>
          <div className={styles.userRole}>Administrador</div>
        </div>
      </div>
    </aside>
  );
};

function HomeIcon({ active }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke={active ? '#f9a8d4' : 'rgba(255,255,255,0.55)'} strokeWidth="2">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  );
}
function UsersIcon({ active }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke={active ? '#f9a8d4' : 'rgba(255,255,255,0.55)'} strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
}
function StethIcon({ active }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke={active ? '#f9a8d4' : 'rgba(255,255,255,0.55)'} strokeWidth="2">
      <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/>
      <path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/>
      <circle cx="20" cy="10" r="2"/>
    </svg>
  );
}
function SecretIcon({ active }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke={active ? '#f9a8d4' : 'rgba(255,255,255,0.55)'} strokeWidth="2">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <line x1="19" y1="8" x2="19" y2="14"/>
      <line x1="22" y1="11" x2="16" y2="11"/>
    </svg>
  );
}

export default AdminSidebar;
