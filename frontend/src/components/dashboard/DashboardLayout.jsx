import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styles from './DashboardLayout.module.css';

const ROLE_LABELS = {
  medico: 'Médico',
  secretaria: 'Secretaria',
  paciente: 'Paciente',
};

const ROLE_COLORS = {
  medico: '#1a56db',
  secretaria: '#7c3aed',
  paciente: '#0d9488',
};

const DashboardLayout = ({ children, title, icon }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  const roleColor = ROLE_COLORS[user?.rol] || '#1a56db';

  return (
    <div className={styles.layout}>
      <header className={styles.header} style={{ borderBottomColor: roleColor + '30' }}>
        <div className={styles.headerLeft}>
          <div className={styles.logoMark} style={{ background: roleColor + '15', color: roleColor }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </div>
          <span className={styles.appName}>Consulta Médica</span>
        </div>

        <div className={styles.headerRight}>
          <div className={styles.userInfo}>
            <div className={styles.avatar} style={{ background: roleColor }}>
              {user?.nombre?.[0]}{user?.apellido?.[0]}
            </div>
            <div className={styles.userDetails}>
              <span className={styles.userName}>{user?.nombre} {user?.apellido}</span>
              <span className={styles.userRole} style={{ color: roleColor }}>
                {ROLE_LABELS[user?.rol]}
              </span>
            </div>
          </div>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Salir
          </button>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.pageHeader}>
          <div className={styles.pageIconWrap} style={{ background: roleColor + '15', color: roleColor }}>
            {icon}
          </div>
          <h1 className={styles.pageTitle}>{title}</h1>
        </div>
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
