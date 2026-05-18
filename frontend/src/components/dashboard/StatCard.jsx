import React from 'react';
import styles from './StatCard.module.css';

const StatCard = ({ title, value, subtitle, icon, color = '#1a56db' }) => (
  <div className={styles.card}>
    <div className={styles.iconWrap} style={{ background: color + '15', color }}>
      {icon}
    </div>
    <div className={styles.info}>
      <div className={styles.value} style={{ color }}>{value}</div>
      <div className={styles.title}>{title}</div>
      {subtitle && <div className={styles.subtitle}>{subtitle}</div>}
    </div>
  </div>
);

export default StatCard;
