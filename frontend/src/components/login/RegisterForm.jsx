import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../common/Button';
import Input from '../common/Input';
import Alert from '../common/Alert';
import styles from './RegisterForm.module.css';

const ROLES = [
  { value: 'paciente', label: 'Paciente' },
  { value: 'secretaria', label: 'Secretaria' },
  { value: 'medico', label: 'Médico' },
];

const ROLE_PATHS = {
  medico: '/medico/dashboard',
  secretaria: '/secretaria/dashboard',
  paciente: '/paciente/dashboard',
};

const RegisterForm = ({ onBack }) => {
  const navigate = useNavigate();
  const { register, loading, error, clearError } = useAuth();
  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    rol: 'paciente',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (error) clearError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const user = await register(form);
      const path = ROLE_PATHS[user.rol] || '/';
      navigate(path, { replace: true });
    } catch {
      // error handled by context
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Crear <span className={styles.accent}>cuenta</span></h2>
        <p className={styles.subtitle}>Regístrate para acceder a la plataforma</p>
      </div>

      {error && <Alert type="error" message={error} onClose={clearError} />}

      <form onSubmit={handleSubmit} className={styles.form} noValidate>
        <div className={styles.row}>
          <Input
            label="Nombre"
            name="nombre"
            placeholder="Juan"
            value={form.nombre}
            onChange={handleChange}
            required
          />
          <Input
            label="Apellido"
            name="apellido"
            placeholder="Pérez"
            value={form.apellido}
            onChange={handleChange}
            required
          />
        </div>

        <Input
          label="Correo electrónico"
          type="email"
          name="email"
          placeholder="ejemplo@correo.com"
          value={form.email}
          onChange={handleChange}
          autoComplete="email"
          required
        />

        <Input
          label="Contraseña"
          type="password"
          name="password"
          placeholder="••••••••"
          value={form.password}
          onChange={handleChange}
          autoComplete="new-password"
          required
        />

        <div className={styles.roleGroup}>
          <label className={styles.roleLabel}>Tipo de usuario</label>
          <div className={styles.roles}>
            {ROLES.map((r) => (
              <label
                key={r.value}
                className={`${styles.roleOption} ${form.rol === r.value ? styles.roleSelected : ''}`}
              >
                <input
                  type="radio"
                  name="rol"
                  value={r.value}
                  checked={form.rol === r.value}
                  onChange={handleChange}
                  className={styles.radioHidden}
                />
                {r.label}
              </label>
            ))}
          </div>
        </div>

        <Button type="submit" fullWidth size="lg" loading={loading}>
          Registrarse
        </Button>
      </form>

      <button className={styles.backBtn} onClick={onBack} type="button">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Volver al inicio de sesión
      </button>
    </div>
  );
};

export default RegisterForm;
