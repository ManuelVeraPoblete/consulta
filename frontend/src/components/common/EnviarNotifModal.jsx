import React, { useState, useEffect } from 'react';
import { getDestinatarios, enviarNotificacion } from '../../services/notificacionService';
import { useAuth } from '../../context/AuthContext';
import styles from './EnviarNotifModal.module.css';

const ROL_LABEL = { medico: 'Médico', secretaria: 'Secretaria' };

const EnviarNotifModal = ({ onClose, onEnviada }) => {
  const { user } = useAuth();
  const isAdmin = user?.rol === 'admin';

  const [destinatarios,  setDestinatarios]  = useState([]);
  const [seleccionados,  setSeleccionados]  = useState([]);
  const [todosChecked,   setTodosChecked]   = useState(false);
  const [filtroRol,      setFiltroRol]      = useState('');
  const [titulo,         setTitulo]         = useState('');
  const [mensaje,        setMensaje]        = useState('');
  const [enviando,       setEnviando]       = useState(false);
  const [error,          setError]          = useState('');
  const [exito,          setExito]          = useState('');

  useEffect(() => {
    getDestinatarios().then(setDestinatarios).catch(() => {});
  }, []);

  const listaFiltrada = filtroRol
    ? destinatarios.filter(d => d.rol === filtroRol)
    : destinatarios;

  const toggleSeleccionado = (id) => {
    setSeleccionados(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleTodos = (checked) => {
    setTodosChecked(checked);
    if (checked) setSeleccionados([]);
  };

  const handleEnviar = async () => {
    setError('');
    setExito('');
    if (!titulo.trim())  { setError('Escribe un título.'); return; }
    if (!mensaje.trim()) { setError('Escribe un mensaje.'); return; }
    if (!todosChecked && !seleccionados.length) { setError('Selecciona al menos un destinatario.'); return; }

    setEnviando(true);
    try {
      const receptor_ids = todosChecked ? 'todos' : seleccionados;
      const { enviadas } = await enviarNotificacion({ receptor_ids, titulo, mensaje });
      setExito(`Notificación enviada a ${enviadas} destinatario${enviadas !== 1 ? 's' : ''}.`);
      onEnviada?.();
      setTimeout(onClose, 1600);
    } catch (e) {
      setError(e.response?.data?.message || 'Error al enviar.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>

        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </div>
            <span className={styles.headerTitle}>Enviar notificación</span>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Cerrar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className={styles.body}>
          {/* Destinatarios */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <label className={styles.label}>Destinatarios</label>
              {isAdmin && (
                <div className={styles.filtros}>
                  {['', 'medico', 'secretaria'].map(rol => (
                    <button
                      key={rol}
                      className={`${styles.filtroBtn} ${filtroRol === rol ? styles.filtroBtnActive : ''}`}
                      onClick={() => setFiltroRol(rol)}
                      type="button"
                    >
                      {rol === '' ? 'Todos los roles' : ROL_LABEL[rol]}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {isAdmin && (
              <label className={styles.todosRow}>
                <input
                  type="checkbox"
                  checked={todosChecked}
                  onChange={e => handleTodos(e.target.checked)}
                  className={styles.checkbox}
                />
                <span className={styles.todosLabel}>
                  Enviar a todos los médicos y secretarias
                </span>
              </label>
            )}

            {!todosChecked && (
              <div className={styles.userList}>
                {listaFiltrada.length === 0 && (
                  <div className={styles.emptyList}>No hay destinatarios disponibles.</div>
                )}
                {listaFiltrada.map(d => {
                  const selec = seleccionados.includes(d.id);
                  const esp   = d.perfil?.especialidad?.nombre;
                  return (
                    <label key={d.id} className={`${styles.userRow} ${selec ? styles.userRowSelec : ''}`}>
                      <input
                        type="checkbox"
                        checked={selec}
                        onChange={() => toggleSeleccionado(d.id)}
                        className={styles.checkbox}
                      />
                      <div className={styles.userAvatar}>
                        {d.nombre[0]}{d.apellido[0]}
                      </div>
                      <div className={styles.userMeta}>
                        <span className={styles.userName}>{d.nombre} {d.apellido}</span>
                        <span className={styles.userSub}>
                          {ROL_LABEL[d.rol] ?? d.rol}
                          {esp ? ` · ${esp}` : ''}
                        </span>
                      </div>
                      {selec && (
                        <svg className={styles.checkIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      )}
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Título */}
          <div className={styles.section}>
            <label className={styles.label}>Título</label>
            <input
              className={styles.input}
              placeholder="Ej: Reunión de coordinación"
              value={titulo}
              maxLength={200}
              onChange={e => setTitulo(e.target.value)}
            />
          </div>

          {/* Mensaje */}
          <div className={styles.section}>
            <label className={styles.label}>Mensaje</label>
            <textarea
              className={styles.textarea}
              rows={4}
              placeholder="Escribe el mensaje aquí…"
              value={mensaje}
              onChange={e => setMensaje(e.target.value)}
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}
          {exito && <div className={styles.exito}>{exito}</div>}
        </div>

        <div className={styles.footer}>
          <button className={styles.btnCancel} onClick={onClose} disabled={enviando}>Cancelar</button>
          <button className={styles.btnEnviar} onClick={handleEnviar} disabled={enviando}>
            {enviando ? 'Enviando…' : (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
                Enviar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EnviarNotifModal;
