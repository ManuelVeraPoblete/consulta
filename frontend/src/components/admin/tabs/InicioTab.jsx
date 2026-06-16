import React, { useEffect, useState } from 'react';
import { listarUsuarios } from '../../../services/adminService';
import { contarNoLeidas } from '../../../services/notificacionService';
import styles from './InicioTab.module.css';

const InicioTab = ({ onNavigate }) => {
  const [stats,    setStats]    = useState({ total: 0, medicos: 0, secretarias: 0, pacientes: 0, inactivos: 0 });
  const [noLeidas, setNoLeidas] = useState('…');

  useEffect(() => {
    listarUsuarios().then((usuarios) => {
      setStats({
        total:      usuarios.length,
        medicos:    usuarios.filter(u => u.rol === 'medico').length,
        secretarias:usuarios.filter(u => u.rol === 'secretaria').length,
        pacientes:  usuarios.filter(u => u.rol === 'paciente').length,
        inactivos:  usuarios.filter(u => !u.activo).length,
      });
    }).catch(() => {});
    contarNoLeidas().then(setNoLeidas).catch(() => setNoLeidas(0));
  }, []);

  const cards = [
    { label: 'Total usuarios',       value: stats.total,       color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
    { label: 'Médicos',              value: stats.medicos,     color: '#0891b2', bg: '#ecfeff', border: '#a5f3fc' },
    { label: 'Secretarias',          value: stats.secretarias, color: '#1a56db', bg: '#eff6ff', border: '#bfdbfe' },
    { label: 'Pacientes',            value: stats.pacientes,   color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0' },
    { label: 'Usuarios inactivos',   value: stats.inactivos,   color: '#b91c1c', bg: '#fef2f2', border: '#fecaca' },
    { label: 'Notificaciones sin leer', value: noLeidas,       color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  ];

  return (
    <div className={styles.wrapper}>
      <div className={styles.welcome}>
        <h2 className={styles.welcomeTitle}>Panel de Administración</h2>
        <p className={styles.welcomeSub}>Gestión completa de usuarios y accesos del sistema.</p>
      </div>

      <div className={styles.statsGrid}>
        {cards.map(c => (
          <div key={c.label} className={styles.statCard} style={{ borderColor: c.border, background: c.bg }}>
            <div className={styles.statVal} style={{ color: c.color }}>{c.value}</div>
            <div className={styles.statLabel}>{c.label}</div>
          </div>
        ))}
      </div>

      <div className={styles.actions}>
        <div className={styles.actionCard} onClick={() => onNavigate('usuarios')}>
          <div className={styles.actionIcon} style={{ background: '#f5f3ff' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <div className={styles.actionText}>
            <div className={styles.actionTitle}>Gestionar usuarios</div>
            <div className={styles.actionDesc}>Crear, activar o desactivar usuarios de cualquier rol</div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </div>

        <div className={styles.actionCard} onClick={() => onNavigate('medicos')}>
          <div className={styles.actionIcon} style={{ background: '#ecfeff' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0891b2" strokeWidth="2">
              <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/>
              <path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/>
              <circle cx="20" cy="10" r="2"/>
            </svg>
          </div>
          <div className={styles.actionText}>
            <div className={styles.actionTitle}>Gestionar médicos</div>
            <div className={styles.actionDesc}>Administrar perfiles médicos y especialidades</div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </div>
      </div>
    </div>
  );
};

export default InicioTab;
