import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import styles from './ConfiguracionTab.module.css';

const ConfiguracionTab = () => {
  const { user } = useAuth();
  const [form, setForm] = useState({
    nombre: user?.nombre || '',
    apellido: user?.apellido || '',
    email: user?.email || '',
    especialidad: user?.perfil?.especialidad || '',
    descripcion: user?.perfil?.descripcion || '',
    passwordActual: '',
    passwordNuevo: '',
    passwordConfirm: '',
  });
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.grid}>
        <div className={styles.card}>
          <div className={styles.cardTitle}>Información personal</div>
          {saved && <div className={styles.successMsg}>✓ Cambios guardados correctamente</div>}
          <form className={styles.form} onSubmit={handleSave}>
            <div className={styles.row2}>
              <div className={styles.group}>
                <label className={styles.label}>Nombre</label>
                <input className={styles.input} value={form.nombre}
                  onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
              </div>
              <div className={styles.group}>
                <label className={styles.label}>Apellido</label>
                <input className={styles.input} value={form.apellido}
                  onChange={e => setForm(f => ({ ...f, apellido: e.target.value }))} />
              </div>
            </div>
            <div className={styles.group}>
              <label className={styles.label}>Email</label>
              <input className={styles.input} type="email" value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div className={styles.group}>
              <label className={styles.label}>Especialidad</label>
              <input className={styles.input} value={form.especialidad}
                onChange={e => setForm(f => ({ ...f, especialidad: e.target.value }))} />
            </div>
            <div className={styles.group}>
              <label className={styles.label}>Descripción profesional</label>
              <textarea className={styles.area} rows={3} value={form.descripcion}
                onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} />
            </div>
            <button type="submit" className={styles.btnSave}>Guardar cambios</button>
          </form>
        </div>

        <div className={styles.card}>
          <div className={styles.cardTitle}>Cambiar contraseña</div>
          <form className={styles.form} onSubmit={handleSave}>
            <div className={styles.group}>
              <label className={styles.label}>Contraseña actual</label>
              <input className={styles.input} type="password" value={form.passwordActual}
                onChange={e => setForm(f => ({ ...f, passwordActual: e.target.value }))} />
            </div>
            <div className={styles.group}>
              <label className={styles.label}>Nueva contraseña</label>
              <input className={styles.input} type="password" value={form.passwordNuevo}
                onChange={e => setForm(f => ({ ...f, passwordNuevo: e.target.value }))} />
            </div>
            <div className={styles.group}>
              <label className={styles.label}>Confirmar nueva contraseña</label>
              <input className={styles.input} type="password" value={form.passwordConfirm}
                onChange={e => setForm(f => ({ ...f, passwordConfirm: e.target.value }))} />
            </div>
            <button type="submit" className={styles.btnSave}>Actualizar contraseña</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ConfiguracionTab;
