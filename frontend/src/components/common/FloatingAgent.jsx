import React, { useState } from 'react';
import AgentChatPanel from '../admin/tabs/AgentChatPanel';
import styles from './FloatingAgent.module.css';

const FloatingAgent = ({ endpoint, welcomeMessage, title = 'Asistente IA' }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Ventana de chat — siempre en el DOM para preservar la conversación */}
      <div className={`${styles.chatWindow} ${open ? styles.open : styles.closed}`}>
        <div className={styles.chatHeader}>
          <div className={styles.headerLeft}>
            <div className={styles.headerAvatar}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <rect x="3" y="11" width="18" height="10" rx="2"/>
                <path d="M12 11V7"/>
                <circle cx="12" cy="5" r="2"/>
                <line x1="8" y1="15" x2="8" y2="17"/>
                <line x1="16" y1="15" x2="16" y2="17"/>
              </svg>
            </div>
            <div>
              <div className={styles.headerTitle}>{title}</div>
              <div className={styles.headerSub}>En línea</div>
            </div>
          </div>
          <button className={styles.headerClose} onClick={() => setOpen(false)} title="Cerrar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className={styles.chatBody}>
          <AgentChatPanel endpoint={endpoint} welcomeMessage={welcomeMessage} />
        </div>
      </div>

      {/* Botón flotante estilo WhatsApp */}
      <button
        className={`${styles.fab} ${open ? styles.fabOpen : ''}`}
        onClick={() => setOpen((o) => !o)}
        title={open ? 'Cerrar asistente' : 'Abrir asistente IA'}
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        ) : (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <rect x="3" y="11" width="18" height="10" rx="2"/>
            <path d="M12 11V7"/>
            <circle cx="12" cy="5" r="2"/>
            <line x1="8" y1="15" x2="8" y2="17"/>
            <line x1="16" y1="15" x2="16" y2="17"/>
          </svg>
        )}
      </button>
    </>
  );
};

export default FloatingAgent;
