import React, { useState } from 'react';
import styles from './ConfiguracionTab.module.css';

const ConfiguracionTab = () => {
  const [form, setForm] = useState({
    clinica: '',
    direccion: '',
    telefono: '',
    email: '',
    horarioIni: '08:00',
    horarioFin: '18:00',
    notifEmail: false,
    notifSms: false,
    duracionCita: '30',
  });
  const [saved, setSaved] = useState(false);

  const handle = (field) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm(f => ({ ...f, [field]: val }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.pageTitle}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1a56db" strokeWidth="2">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
        <div>
          <h2 className={styles.title}>Configuración</h2>
          <p className={styles.subtitle}>Ajustes del sistema y preferencias</p>
        </div>
      </div>

      {saved && <div className={styles.successMsg}>✓ Configuración guardada correctamente</div>}

      <form className={styles.form} onSubmit={handleSave}>
        {/* Datos clínica */}
        <section className={styles.card}>
          <div className={styles.cardTitle}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1a56db" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            Datos de la clínica
          </div>
          <div className={styles.fields}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Nombre de la clínica</label>
              <input className={styles.input} value={form.clinica} onChange={handle('clinica')} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Dirección</label>
              <input className={styles.input} value={form.direccion} onChange={handle('direccion')} />
            </div>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Teléfono</label>
                <input className={styles.input} value={form.telefono} onChange={handle('telefono')} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Email de contacto</label>
                <input className={styles.input} type="email" value={form.email} onChange={handle('email')} />
              </div>
            </div>
          </div>
        </section>

        {/* Horarios */}
        <section className={styles.card}>
          <div className={styles.cardTitle}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1a56db" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            Horario de atención
          </div>
          <div className={styles.fields}>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Apertura</label>
                <input className={styles.input} type="time" value={form.horarioIni} onChange={handle('horarioIni')} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Cierre</label>
                <input className={styles.input} type="time" value={form.horarioFin} onChange={handle('horarioFin')} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Duración cita (min)</label>
                <select className={styles.input} value={form.duracionCita} onChange={handle('duracionCita')}>
                  <option value="15">15 min</option>
                  <option value="20">20 min</option>
                  <option value="30">30 min</option>
                  <option value="45">45 min</option>
                  <option value="60">60 min</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Notificaciones */}
        <section className={styles.card}>
          <div className={styles.cardTitle}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1a56db" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            Notificaciones
          </div>
          <div className={styles.fields}>
            <label className={styles.toggle}>
              <input type="checkbox" checked={form.notifEmail} onChange={handle('notifEmail')} />
              <div className={styles.toggleTrack}>
                <div className={styles.toggleThumb} />
              </div>
              <div>
                <div className={styles.toggleLabel}>Notificaciones por email</div>
                <div className={styles.toggleDesc}>Enviar confirmaciones de cita al paciente por correo</div>
              </div>
            </label>
            <label className={styles.toggle}>
              <input type="checkbox" checked={form.notifSms} onChange={handle('notifSms')} />
              <div className={styles.toggleTrack}>
                <div className={styles.toggleThumb} />
              </div>
              <div>
                <div className={styles.toggleLabel}>Notificaciones por SMS</div>
                <div className={styles.toggleDesc}>Enviar recordatorios por mensaje de texto (requiere contrato)</div>
              </div>
            </label>
          </div>
        </section>

        <div className={styles.actions}>
          <button type="button" className={styles.cancelBtn} onClick={() => setSaved(false)}>Descartar cambios</button>
          <button type="submit" className={styles.saveBtn}>Guardar configuración</button>
        </div>
      </form>
    </div>
  );
};

export default ConfiguracionTab;
