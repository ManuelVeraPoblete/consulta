import React from 'react';
import styles from './LoginLeft.module.css';

const FEATURES = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
    title: 'Agenda citas',
    desc: 'Rápido y sencillo',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <polyline points="9 12 11 14 15 10" />
      </svg>
    ),
    title: 'Historial médico',
    desc: 'Todo en un lugar',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
    title: 'Cuida tu salud',
    desc: 'Nosotros te ayudamos',
  },
];

const LoginLeft = () => (
  <div className={styles.left}>
    <div className={styles.overlay} />
    <div className={styles.content}>
      <div className={styles.floatingCard}>
        <div className={styles.cardHeader}>
          <div className={styles.avatar} />
          <div className={styles.cardLines}>
            <div className={styles.line} style={{ width: '70%' }} />
            <div className={styles.line} style={{ width: '50%' }} />
          </div>
        </div>
        <div className={styles.cardLabel}>Historial médico</div>
        <div className={styles.ecgLine}>
          <svg viewBox="0 0 200 50" fill="none" stroke="#14b8a6" strokeWidth="2">
            <polyline points="0,25 30,25 40,10 50,40 60,25 80,25 90,15 100,35 110,25 140,25 150,5 160,45 170,25 200,25" />
          </svg>
        </div>
      </div>

      <div className={styles.floatingIcon} style={{ top: '8%', right: '18%' }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </div>
      <div className={styles.floatingIcon} style={{ top: '30%', right: '8%', background: 'rgba(14,165,233,0.9)' }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      </div>

      <div className={styles.headline}>
        <h1>
          Tu salud,<br />
          <span className={styles.accent}>nuestra prioridad</span>
        </h1>
        <p className={styles.subtitle}>
          Accede a tu información médica, agenda tus citas y gestiona tu salud de forma fácil y segura.
        </p>
      </div>

      <ul className={styles.features}>
        {FEATURES.map((f) => (
          <li key={f.title} className={styles.featureItem}>
            <div className={styles.featureIcon}>{f.icon}</div>
            <div>
              <div className={styles.featureTitle}>{f.title}</div>
              <div className={styles.featureDesc}>{f.desc}</div>
            </div>
          </li>
        ))}
      </ul>

      <div className={styles.badge}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" strokeWidth="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        <div>
          <div className={styles.badgeTitle}>Plataforma segura y confiable</div>
          <div className={styles.badgeDesc}>Tus datos están protegidos</div>
        </div>
      </div>
    </div>
  </div>
);

export default LoginLeft;
