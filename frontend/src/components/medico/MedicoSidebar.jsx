import React from 'react';
import { useAuth } from '../../context/AuthContext';
import styles from './MedicoSidebar.module.css';

const NAV = [
  { id: 'inicio',      label: 'Inicio',              icon: HomeIcon },
  { id: 'agenda',      label: 'Agenda',               icon: CalIcon },
  { id: 'adminAgenda', label: 'Admin. Agenda',        icon: LockCalIcon },
  { id: 'pacientes',   label: 'Pacientes',            icon: UsersIcon },
  { id: 'recetas',     label: 'Recetas',              icon: RecetaIcon },
  { id: 'ordenes',     label: 'Órdenes de examen',    icon: FlaskIcon },
  { id: 'config',      label: 'Configuración',        icon: GearIcon },
];

const MedicoSidebar = ({ active, onNavigate }) => {
  const { user } = useAuth();
  const initials = user ? `${user.nombre[0]}${user.apellido[0]}`.toUpperCase() : 'MD';

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <div className={styles.brandIcon}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
          </svg>
        </div>
        <div>
          <div className={styles.brandName}>Consulta Médica Online</div>
          <div className={styles.brandRole}>Portal Médico</div>
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
          </button>
        ))}
      </nav>

      <div className={styles.helpBox}>
        <div className={styles.helpIcon}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
        <div>
          <div className={styles.helpTitle}>¿Necesitas ayuda?</div>
          <div className={styles.helpSub}>Soporte clínico 24/7</div>
          <div className={styles.helpPhone}>+56 2 2345 6789</div>
        </div>
      </div>

      <div className={styles.clinicInfo}>
        <div className={styles.clinicName}>Consulta Médica Online</div>
        <div className={styles.clinicAddr}>Av. Providencia 1234</div>
        <div className={styles.clinicAddr}>Providencia, Santiago</div>
        <div className={styles.clinicWeb}>www.consultamedicaonline.cl</div>
      </div>

      <div className={styles.footer}>© 2024 Consulta Médica Online<br/>Todos los derechos reservados</div>
    </aside>
  );
};

function HomeIcon({ active }) {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={active ? 'white' : 'rgba(255,255,255,0.5)'} strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
}
function CalIcon({ active }) {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={active ? 'white' : 'rgba(255,255,255,0.5)'} strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
}
function UsersIcon({ active }) {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={active ? 'white' : 'rgba(255,255,255,0.5)'} strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
}
function ClipIcon({ active }) {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={active ? 'white' : 'rgba(255,255,255,0.5)'} strokeWidth="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="15" y2="16"/></svg>;
}
function RecetaIcon({ active }) {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={active ? 'white' : 'rgba(255,255,255,0.5)'} strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>;
}
function FlaskIcon({ active }) {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={active ? 'white' : 'rgba(255,255,255,0.5)'} strokeWidth="2"><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/></svg>;
}
function LockCalIcon({ active }) {
  const c = active ? 'white' : 'rgba(255,255,255,0.5)';
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8"  y1="2" x2="8"  y2="6"/>
      <line x1="3"  y1="10" x2="21" y2="10"/>
      <rect x="8" y="14" width="8" height="5" rx="1"/>
      <path d="M10 14v-1a2 2 0 0 1 4 0v1"/>
    </svg>
  );
}
function GearIcon({ active }) {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={active ? 'white' : 'rgba(255,255,255,0.5)'} strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;
}

export default MedicoSidebar;
