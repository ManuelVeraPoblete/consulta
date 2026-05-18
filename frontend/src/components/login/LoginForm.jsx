import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../common/Button';
import Input from '../common/Input';
import Alert from '../common/Alert';
import RegisterForm from './RegisterForm';
import styles from './LoginForm.module.css';

const ROLE_PATHS = {
  medico: '/medico/dashboard',
  secretaria: '/secretaria/dashboard',
  paciente: '/paciente/dashboard',
};

const MailIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

const LockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const ArrowIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const UserPlusIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="8.5" cy="7" r="4" />
    <line x1="20" y1="8" x2="20" y2="14" />
    <line x1="23" y1="11" x2="17" y2="11" />
  </svg>
);

const LoginForm = () => {
  const navigate = useNavigate();
  const { login, loading, error, clearError } = useAuth();
  const [showRegister, setShowRegister] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', remember: false });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (error) clearError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const user = await login(form.email, form.password);
      const path = ROLE_PATHS[user.rol] || '/';
      navigate(path, { replace: true });
    } catch {
      // error handled by context
    }
  };

  if (showRegister) {
    return <RegisterForm onBack={() => setShowRegister(false)} />;
  }

  return (
    <div className={styles.formContainer}>
      <div className={styles.logo}>
        <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
          <circle cx="26" cy="26" r="26" fill="#eff6ff" />
          <path
            d="M26 14c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12z"
            fill="none"
            stroke="#1a56db"
            strokeWidth="2"
          />
          <path
            d="M26 10c-8.837 0-16 7.163-16 16s7.163 16 16 16 16-7.163 16-16S34.837 10 26 10z"
            fill="none"
            stroke="#1a56db"
            strokeWidth="0"
          />
          <path
            d="M26 16c5.523 0 10 4.477 10 10s-4.477 10-10 10S16 31.523 16 26s4.477-10 10-10z"
            fill="none"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M26 12C18.268 12 12 18.268 12 26s6.268 14 14 14 14-6.268 14-14S33.732 12 26 12zm0 2c6.627 0 12 5.373 12 12S32.627 38 26 38 14 32.627 14 26s5.373-12 12-12z"
            fill="#1a56db"
          />
          <path d="M26 20v12M20 26h12" stroke="#1a56db" strokeWidth="2.5" strokeLinecap="round" />
          <path
            d="M26 14c6.627 0 12 5.373 12 12s-5.373 12-12 12S14 32.627 14 26s5.373-12 12-12z"
            fill="none"
            stroke="#1a56db"
            strokeWidth="2"
          />
        </svg>
      </div>

      <div className={styles.header}>
        <h2 className={styles.title}>
          Consulta <span className={styles.titleAccent}>Médica</span>
        </h2>
        <p className={styles.subtitle}>Accede a tu portal de salud</p>
      </div>

      {error && (
        <Alert type="error" message={error} onClose={clearError} />
      )}

      <form onSubmit={handleSubmit} className={styles.form} noValidate>
        <Input
          label="Correo electrónico"
          type="email"
          name="email"
          id="email"
          placeholder="ejemplo@correo.com"
          value={form.email}
          onChange={handleChange}
          icon={<MailIcon />}
          autoComplete="email"
          required
        />

        <Input
          label="Contraseña"
          type="password"
          name="password"
          id="password"
          placeholder="••••••••"
          value={form.password}
          onChange={handleChange}
          icon={<LockIcon />}
          autoComplete="current-password"
          required
        />

        <div className={styles.options}>
          <label className={styles.remember}>
            <input
              type="checkbox"
              name="remember"
              checked={form.remember}
              onChange={handleChange}
              className={styles.checkbox}
            />
            <span>Recordarme</span>
          </label>
          <button type="button" className={styles.forgotLink}>
            ¿Olvidaste tu contraseña?
          </button>
        </div>

        <Button
          type="submit"
          fullWidth
          size="lg"
          loading={loading}
          icon={<ArrowIcon />}
        >
          Iniciar sesión
        </Button>
      </form>

      <div className={styles.divider}>
        <span />
        <span className={styles.dividerText}>o</span>
        <span />
      </div>

      <Button
        variant="secondary"
        fullWidth
        size="lg"
        icon={<UserPlusIcon />}
        iconPosition="right"
        onClick={() => setShowRegister(true)}
      >
        Crear cuenta
      </Button>

      <div className={styles.securityNote}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" strokeWidth="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        <p>
          Tu privacidad es importante para nosotros.<br />
          Protegemos tus datos con tecnología de nivel hospitalario.
        </p>
      </div>
    </div>
  );
};

export default LoginForm;
