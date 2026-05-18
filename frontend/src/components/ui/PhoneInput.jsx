import React from 'react';
import styles from './PhoneInput.module.css';

/**
 * Input de teléfono con prefijo chileno visual.
 * value / onChange trabajan sobre el número completo (ej: "9 1234 5678").
 */
export const PhoneInput = ({ value, onChange, placeholder = '9 1234 5678', className, error, ...rest }) => (
  <div className={`${styles.wrapper} ${error ? styles.wrapperError : ''} ${className ?? ''}`}>
    <div className={styles.prefix}>
      <span className={styles.flag}>🇨🇱</span>
      <span className={styles.code}>+56</span>
    </div>
    <input
      className={styles.input}
      type="tel"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      {...rest}
    />
  </div>
);

/**
 * Muestra un número de teléfono con la bandera chilena.
 * Si el número ya incluye +56 lo respeta; si no, lo muestra igual.
 */
export const PhoneDisplay = ({ number }) => {
  if (!number) return <span>—</span>;
  return (
    <span className={styles.display}>
      <span className={styles.displayFlag}>🇨🇱</span>
      {number}
    </span>
  );
};
