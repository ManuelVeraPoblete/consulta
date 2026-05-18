import React from 'react';
import styles from './HistorialTab.module.css';

const HistorialTab = () => (
  <div className={styles.wrapper}>
    <div className={styles.pageTitle}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1a56db" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
      <div>
        <h2 className={styles.title}>Mi historial médico</h2>
        <p className={styles.subtitle}>Haz clic en un registro para ver el detalle completo</p>
      </div>
    </div>

    <div className={styles.emptyState}>
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
      <p>No hay registros en tu historial médico</p>
    </div>
  </div>
);

export default HistorialTab;
