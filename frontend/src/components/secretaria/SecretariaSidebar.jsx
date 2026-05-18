import React from 'react';
import { useAuth } from '../../context/AuthContext';
import styles from './SecretariaSidebar.module.css';

const NAV = [
  { id: 'inicio',      label: 'Inicio',        icon: HomeIcon },
  { id: 'agenda',      label: 'Agenda',         icon: CalIcon },
  { id: 'pacientes',   label: 'Pacientes',      icon: UsersIcon },
  { id: 'medicos',     label: 'Médicos',        icon: StethIcon },
  { id: 'atenciones',  label: 'Atenciones',     icon: ClipIcon },
  { id: 'informes',    label: 'Informes PDF',   icon: FileIcon },
  { id: 'config',      label: 'Configuración',  icon: GearIcon },
];

const SecretariaSidebar = ({ active, onNavigate }) => {
  const { user } = useAuth();
  const nombre    = user ? `${user.nombre} ${user.apellido}` : 'Secretaria';
  const iniciales = user ? `${user.nombre?.[0] ?? ''}${user.apellido?.[0] ?? ''}`.toUpperCase() : 'S';

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
        <div className={styles.brandRole}>Portal Secretaria</div>
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
      <div className={styles.userAvatar}>{iniciales}</div>
      <div className={styles.userInfo}>
        <div className={styles.userName}>{nombre}</div>
        <div className={styles.userRole}>Secretaria</div>
      </div>
    </div>
  </aside>
  );
};

function HomeIcon({ active }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke={active ? '#60a5fa' : 'rgba(255,255,255,0.55)'} strokeWidth="2">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  );
}
function CalIcon({ active }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke={active ? '#60a5fa' : 'rgba(255,255,255,0.55)'} strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  );
}
function UsersIcon({ active }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke={active ? '#60a5fa' : 'rgba(255,255,255,0.55)'} strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
}
function StethIcon({ active }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke={active ? '#60a5fa' : 'rgba(255,255,255,0.55)'} strokeWidth="2">
      <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/>
      <path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/>
      <circle cx="20" cy="10" r="2"/>
    </svg>
  );
}
function ClipIcon({ active }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke={active ? '#60a5fa' : 'rgba(255,255,255,0.55)'} strokeWidth="2">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
      <line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="15" y2="16"/>
    </svg>
  );
}
function FileIcon({ active }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke={active ? '#60a5fa' : 'rgba(255,255,255,0.55)'} strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/>
      <polyline points="9 9 10 9"/>
    </svg>
  );
}
function GearIcon({ active }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke={active ? '#60a5fa' : 'rgba(255,255,255,0.55)'} strokeWidth="2">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  );
}

export default SecretariaSidebar;
