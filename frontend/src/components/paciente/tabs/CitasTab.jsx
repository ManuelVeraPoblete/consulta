import React from 'react';
import styles from './CitasTab.module.css';

const CitasTab = () => (
  <div className={styles.wrapper}>
    <div className={styles.pageTitle}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1a56db" strokeWidth="2">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
      <div>
        <h2 className={styles.title}>Mis citas</h2>
        <p className={styles.subtitle}>Historial de citas confirmadas y pendientes</p>
      </div>
    </div>

    <div className={styles.emptyState}>
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5">
        <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
      <p>No tienes citas registradas</p>
    </div>
  </div>
);

export default CitasTab;
