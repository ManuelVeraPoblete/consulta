import React, { useState, useEffect } from 'react';
import { crearSecretaria, listarMedicos } from '../../services/adminService';
import { PhoneInput } from '../ui/PhoneInput';
import styles from './CrearSecretariaForm.module.css';

function validarRUT(rut) {
  const limpio = rut.replace(/\./g, '').replace(/-/g, '').toUpperCase().trim();
  if (limpio.length < 8) return false;
  const cuerpo = limpio.slice(0, -1);
  const dv     = limpio.slice(-1);
  if (!/^\d+$/.test(cuerpo)) return false;
  let suma = 0, mult = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpo[i]) * mult;
    mult  = mult < 7 ? mult + 1 : 2;
  }
  const resto = 11 - (suma % 11);
  const dvEsp = resto === 11 ? '0' : resto === 10 ? 'K' : String(resto);
  return dv === dvEsp;
}

function formatearRUT(valor) {
  const limpio = valor.replace(/[^0-9kK]/g, '').toUpperCase();
  if (!limpio) return '';
  const cuerpo = limpio.slice(0, -1);
  const dv     = limpio.slice(-1);
  return dv ? `${cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}-${dv}` : cuerpo;
}

const cls = (...c) => c.filter(Boolean).join(' ');

const EMPTY = {
  nombres: '', apellidos: '', rut: '', telefono: '',
  email: '', password: '', confirmarPassword: '',
  medico_ids: [],
};

const CrearSecretariaForm = ({ onSuccess, onCancel }) => {
  const [form, setForm]         = useState(EMPTY);
  const [errores, setErrores]   = useState({});
  const [saving, setSaving]     = useState(false);
  const [apiError, setApiError] = useState('');
  const [medicos, setMedicos]   = useState([]);
  const [loadingMed, setLoadingMed] = useState(true);

  useEffect(() => {
    listarMedicos()
      .then(data => { setMedicos(data); setLoadingMed(false); })
      .catch(() => { setApiError('No se pudieron cargar los médicos'); setLoadingMed(false); });
  }, []);

  const set = (campo, valor) => {
    setForm(f => ({ ...f, [campo]: valor }));
    setErrores(e => ({ ...e, [campo]: '' }));
    setApiError('');
  };

  const toggleMedico = (id) =>
    setForm(f => ({
      ...f,
      medico_ids: f.medico_ids.includes(id)
        ? f.medico_ids.filter(x => x !== id)
        : [...f.medico_ids, id],
    }));

  const validar = () => {
    const e = {};
    if (!form.nombres.trim() || form.nombres.trim().length < 2)
      e.nombres = 'Mínimo 2 caracteres';
    if (!form.apellidos.trim() || form.apellidos.trim().length < 2)
      e.apellidos = 'Mínimo 2 caracteres';
    if (form.rut.trim() && !validarRUT(form.rut))
      e.rut = 'RUT inválido — verifique el dígito verificador';
    if (!form.telefono.trim())
      e.telefono = 'El teléfono es requerido';
    else if (!/^\+?[\d\s\-()]{7,20}$/.test(form.telefono.trim()))
      e.telefono = 'Formato inválido';
    if (!form.email.trim())
      e.email = 'El email es requerido';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = 'Email inválido';
    if (!form.password)
      e.password = 'La contraseña es requerida';
    else if (form.password.length < 8)
      e.password = 'Mínimo 8 caracteres';
    if (!form.confirmarPassword)
      e.confirmarPassword = 'Confirme la contraseña';
    else if (form.password !== form.confirmarPassword)
      e.confirmarPassword = 'Las contraseñas no coinciden';
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validar()) return;
    setSaving(true);
    setApiError('');
    try {
      await crearSecretaria({
        nombre:     form.nombres.trim(),
        apellido:   form.apellidos.trim(),
        rut:        form.rut || undefined,
        telefono:   form.telefono.trim(),
        email:      form.email,
        password:   form.password,
        medico_ids: form.medico_ids,
      });
      onSuccess();
    } catch (err) {
      setApiError(err.response?.data?.message || 'Error al crear la secretaria');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.panel}>

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerIcon}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </div>
        <div>
          <h2 className={styles.headerTitle}>Nueva secretaria</h2>
          <p className={styles.headerSub}>Complete los datos para registrar la cuenta</p>
        </div>
        <button className={styles.closeBtn} type="button" onClick={onCancel} aria-label="Cerrar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      {/* Body */}
      <form id="secretaria-form" className={styles.body} onSubmit={handleSubmit} noValidate>

        {apiError && (
          <div className={styles.apiError}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {apiError}
          </div>
        )}

        {/* ── Datos personales ── */}
        <Section label="Datos personales">
          <div className={styles.row2}>
            <Field label="Nombres" error={errores.nombres} required>
              <input className={cls(styles.input, errores.nombres && styles.inputError)}
                placeholder="Ingrese nombres"
                value={form.nombres}
                onChange={e => set('nombres', e.target.value)} />
            </Field>
            <Field label="Apellidos" error={errores.apellidos} required>
              <input className={cls(styles.input, errores.apellidos && styles.inputError)}
                placeholder="Ingrese apellidos"
                value={form.apellidos}
                onChange={e => set('apellidos', e.target.value)} />
            </Field>
          </div>

          <div className={styles.row2}>
            <Field label="RUT" error={errores.rut} tag="Opcional">
              <input className={cls(styles.input, errores.rut && styles.inputError)}
                placeholder="Ej: 12.345.678-9"
                value={form.rut}
                onChange={e => set('rut', formatearRUT(e.target.value))}
                maxLength={12} />
              {form.rut && !errores.rut && validarRUT(form.rut) &&
                <span className={styles.validMsg}>✓ Válido</span>}
            </Field>
            <Field label="Teléfono" error={errores.telefono} required>
              <PhoneInput
                value={form.telefono}
                onChange={e => set('telefono', e.target.value)}
                error={errores.telefono} />
            </Field>
          </div>
        </Section>

        {/* ── Acceso al sistema ── */}
        <Section label="Acceso al sistema">
          <Field label="Correo electrónico" error={errores.email} required>
            <div className={styles.inputWithIcon}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              <input className={cls(styles.input, styles.inputIconed, errores.email && styles.inputError)}
                type="email" placeholder="correo@ejemplo.cl"
                value={form.email}
                onChange={e => set('email', e.target.value)} />
            </div>
          </Field>
          <div className={styles.row2}>
            <Field label="Contraseña" error={errores.password} required hint="Mínimo 8 caracteres">
              <input className={cls(styles.input, errores.password && styles.inputError)}
                type="password" placeholder="••••••••"
                value={form.password}
                onChange={e => set('password', e.target.value)} />
            </Field>
            <Field label="Confirmar contraseña" error={errores.confirmarPassword} required>
              <input className={cls(styles.input, errores.confirmarPassword && styles.inputError)}
                type="password" placeholder="••••••••"
                value={form.confirmarPassword}
                onChange={e => set('confirmarPassword', e.target.value)} />
            </Field>
          </div>
        </Section>

        {/* ── Médicos asignados ── */}
        <Section label="Médicos asignados" tag="Opcional">
          {loadingMed ? (
            <div className={styles.loadingMed}>Cargando médicos…</div>
          ) : medicos.length === 0 ? (
            <div className={styles.noMedicos}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#e2e8f0" strokeWidth="1.5">
                <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1"/>
                <path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/>
                <circle cx="20" cy="10" r="2"/>
              </svg>
              <span>No hay médicos activos registrados aún</span>
            </div>
          ) : (
            <>
              <div className={styles.medicoList}>
                {medicos.map(m => {
                  const on = form.medico_ids.includes(m.id);
                  return (
                    <label key={m.id} className={`${styles.medicoItem} ${on ? styles.medicoItemOn : ''}`}>
                      <input type="checkbox" className={styles.hiddenCheck}
                        checked={on} onChange={() => toggleMedico(m.id)} />
                      <div className={styles.medicoAvatar}
                        style={{ background: on ? 'linear-gradient(135deg,#7c3aed,#9333ea)' : 'linear-gradient(135deg,#0891b2,#0ea5e9)' }}>
                        {m.nombre[0]}{m.apellido[0]}
                      </div>
                      <div className={styles.medicoText}>
                        <span className={styles.medicoNombre}>Dr. {m.nombre} {m.apellido}</span>
                        {m.perfil?.especialidad && (
                          <span className={styles.medicoEsp}>{m.perfil.especialidad.nombre}</span>
                        )}
                      </div>
                      <div className={`${styles.check} ${on ? styles.checkOn : ''}`}>
                        {on && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5"><polyline points="20 6 9 17 4 12"/></svg>}
                      </div>
                    </label>
                  );
                })}
              </div>
              {form.medico_ids.length > 0 && (
                <div className={styles.selSummary}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  {form.medico_ids.length} médico{form.medico_ids.length !== 1 ? 's' : ''} seleccionado{form.medico_ids.length !== 1 ? 's' : ''}
                </div>
              )}
            </>
          )}
        </Section>
      </form>

      {/* Footer */}
      <div className={styles.footer}>
        <button type="button" className={styles.btnCancel} onClick={onCancel}>
          Cancelar
        </button>
        <button type="submit" form="secretaria-form" className={styles.btnSubmit} disabled={saving}>
          {saving ? (
            <><span className={styles.spinner} /> Guardando…</>
          ) : (
            <>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                <polyline points="17 21 17 13 7 13 7 21"/>
                <polyline points="7 3 7 8 15 8"/>
              </svg>
              Crear secretaria
            </>
          )}
        </button>
      </div>
    </div>
  );
};

/* ── Sub-components ── */

const Section = ({ label, tag, children }) => (
  <div className={styles.section}>
    <div className={styles.sectionHeader}>
      <span className={styles.sectionLabel}>{label}</span>
      {tag && <span className={styles.sectionTag}>{tag}</span>}
    </div>
    <div className={styles.sectionBody}>{children}</div>
  </div>
);

const Field = ({ label, error, hint, tag, required, children }) => (
  <div className={styles.field}>
    <label className={styles.label}>
      {label}
      {required && <span className={styles.req}> *</span>}
      {tag && <span className={styles.fieldTag}>{tag}</span>}
      {hint && <span className={styles.hint}> — {hint}</span>}
    </label>
    {children}
    {error && <span className={styles.errorMsg}>{error}</span>}
  </div>
);

export default CrearSecretariaForm;
