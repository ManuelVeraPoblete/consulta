import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getMisNotificaciones, contarNoLeidas, marcarLeida, marcarTodasLeidas } from '../../services/notificacionService';
import EnviarNotifModal from './EnviarNotifModal';
import styles from './NotifBell.module.css';

const POLL_INTERVAL = 30000;

const tiempoRelativo = (iso) => {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60)   return 'Ahora';
  if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400)return `Hace ${Math.floor(diff / 3600)} h`;
  return `Hace ${Math.floor(diff / 86400)} días`;
};

const NotifBell = ({ canSend = true }) => {
  const [open,         setOpen]         = useState(false);
  const [enviandoOpen, setEnviandoOpen] = useState(false);
  const [notifs,       setNotifs]       = useState([]);
  const [noLeidas,     setNoLeidas]     = useState(0);
  const [cargando,     setCargando]     = useState(false);
  const panelRef = useRef(null);

  /* Contador de no leídas — polling */
  const fetchCount = useCallback(async () => {
    try { setNoLeidas(await contarNoLeidas()); } catch { /* silently ignore */ }
  }, []);

  useEffect(() => {
    fetchCount();
    const t = setInterval(fetchCount, POLL_INTERVAL);
    return () => clearInterval(t);
  }, [fetchCount]);

  /* Cargar lista al abrir */
  useEffect(() => {
    if (!open) return;
    setCargando(true);
    getMisNotificaciones(30)
      .then(setNotifs)
      .catch(() => {})
      .finally(() => setCargando(false));
  }, [open]);

  /* Cerrar al click fuera */
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleClickNotif = async (notif) => {
    if (!notif.leida) {
      await marcarLeida(notif.id).catch(() => {});
      setNotifs(prev => prev.map(n => n.id === notif.id ? { ...n, leida: true } : n));
      setNoLeidas(prev => Math.max(0, prev - 1));
    }
  };

  const handleMarcarTodas = async () => {
    await marcarTodasLeidas().catch(() => {});
    setNotifs(prev => prev.map(n => ({ ...n, leida: true })));
    setNoLeidas(0);
  };

  return (
    <>
      <div className={styles.wrap} ref={panelRef}>
        <button
          className={styles.bell}
          onClick={() => setOpen(v => !v)}
          aria-label="Notificaciones"
        >
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          {noLeidas > 0 && (
            <span className={styles.badge}>{noLeidas > 99 ? '99+' : noLeidas}</span>
          )}
        </button>

        {open && (
          <div className={styles.panel}>
            {/* Header panel */}
            <div className={styles.panelHeader}>
              <span className={styles.panelTitle}>Notificaciones</span>
              <div className={styles.panelActions}>
                {noLeidas > 0 && (
                  <button className={styles.btnLeerTodas} onClick={handleMarcarTodas}>
                    Marcar todas leídas
                  </button>
                )}
                {canSend && (
                  <button
                    className={styles.btnEnviar}
                    onClick={() => { setOpen(false); setEnviandoOpen(true); }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="22" y1="2" x2="11" y2="13"/>
                      <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                    </svg>
                    Enviar
                  </button>
                )}
              </div>
            </div>

            {/* Lista */}
            <div className={styles.list}>
              {cargando && (
                <div className={styles.empty}>
                  <div className={styles.spinner} />
                </div>
              )}
              {!cargando && notifs.length === 0 && (
                <div className={styles.empty}>Sin notificaciones</div>
              )}
              {!cargando && notifs.map(n => (
                <button
                  key={n.id}
                  className={`${styles.item} ${!n.leida ? styles.itemNoLeida : ''}`}
                  onClick={() => handleClickNotif(n)}
                >
                  <div className={styles.itemLeft}>
                    <div className={styles.itemAvatar}>
                      {n.emisor?.nombre?.[0]}{n.emisor?.apellido?.[0]}
                    </div>
                    {!n.leida && <span className={styles.dot} />}
                  </div>
                  <div className={styles.itemBody}>
                    <div className={styles.itemTitulo}>{n.titulo}</div>
                    <div className={styles.itemMensaje}>{n.mensaje}</div>
                    <div className={styles.itemMeta}>
                      <span>{n.emisor?.nombre} {n.emisor?.apellido}</span>
                      <span>·</span>
                      <span>{tiempoRelativo(n.createdAt)}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {enviandoOpen && (
        <EnviarNotifModal
          onClose={() => setEnviandoOpen(false)}
          onEnviada={fetchCount}
        />
      )}
    </>
  );
};

export default NotifBell;
