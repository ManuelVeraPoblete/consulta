import React, { useState, useEffect, useCallback } from 'react';
import { crearPaciente } from '../../services/pacienteService';
import { PhoneInput } from '../ui/PhoneInput';
import styles from './CrearPacienteModal.module.css';

/* ── RUT helpers ── */
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

/* ── Age calculation ── */
function calcularEdad(fechaStr) {
  if (!fechaStr) return null;
  const hoy = new Date();
  const nac = new Date(fechaStr + 'T00:00:00');
  if (isNaN(nac)) return null;
  let años  = hoy.getFullYear() - nac.getFullYear();
  let meses = hoy.getMonth()    - nac.getMonth();
  let dias  = hoy.getDate()     - nac.getDate();
  if (dias < 0) {
    meses--;
    dias += new Date(hoy.getFullYear(), hoy.getMonth(), 0).getDate();
  }
  if (meses < 0) { años--; meses += 12; }
  if (años < 0)  return null;
  return { años, meses, dias };
}

const cls = (...c) => c.filter(Boolean).join(' ');

const EMPTY = {
  nombre: '', apellido: '', rut: '', fecha_nacimiento: '', genero: '',
  telefono: '', email: '',
  prevision_salud: 'fonasa', nombre_isapre: '', numero_fonasa: '',
  grupo_sanguineo: 'desconocido',
  alergias: '', antecedentes: '',
  contacto_emergencia_nombre: '', contacto_emergencia_telefono: '',
};

const CrearPacienteModal = ({ onSuccess, onCancel }) => {
  const [form, setForm]         = useState(EMPTY);
  const [errores, setErrores]   = useState({});
  const [saving, setSaving]     = useState(false);
  const [apiError, setApiError] = useState('');
  const [edad, setEdad]         = useState(null);

  useEffect(() => {
    setEdad(calcularEdad(form.fecha_nacimiento));
  }, [form.fecha_nacimiento]);

  /* Close on Escape */
  const handleKey = useCallback((e) => { if (e.key === 'Escape') onCancel(); }, [onCancel]);
  useEffect(() => {
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  const set = (campo, valor) => {
    setForm(f => ({ ...f, [campo]: valor }));
    setErrores(e => ({ ...e, [campo]: '' }));
    setApiError('');
  };

  const validar = () => {
    const e = {};
    if (!form.nombre.trim()  || form.nombre.trim().length < 2)  e.nombre  = 'Mínimo 2 caracteres';
    if (!form.apellido.trim()|| form.apellido.trim().length < 2) e.apellido = 'Mínimo 2 caracteres';
    if (form.rut.trim() && !validarRUT(form.rut)) e.rut = 'RUT inválido';
    if (!form.fecha_nacimiento) e.fecha_nacimiento = 'La fecha de nacimiento es requerida';
    else if (!calcularEdad(form.fecha_nacimiento)) e.fecha_nacimiento = 'Fecha inválida';
    if (!form.genero) e.genero = 'Seleccione un género';
    if (form.prevision_salud === 'isapre' && !form.nombre_isapre.trim())
      e.nombre_isapre = 'Ingrese el nombre de la ISAPRE';
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validar()) return;
    setSaving(true);
    setApiError('');
    try {
      await crearPaciente({
        nombre:    form.nombre.trim(),
        apellido:  form.apellido.trim(),
        rut:       form.rut.trim() || undefined,
        fecha_nacimiento: form.fecha_nacimiento,
        genero:    form.genero,
        telefono:  form.telefono.trim()  || undefined,
        email:     form.email.trim()     || undefined,
        prevision_salud:  form.prevision_salud,
        nombre_isapre:    form.nombre_isapre.trim()  || undefined,
        numero_fonasa:    form.numero_fonasa.trim()  || undefined,
        grupo_sanguineo:  form.grupo_sanguineo || 'desconocido',
        alergias:         form.alergias.trim()        || undefined,
        antecedentes:     form.antecedentes.trim()    || undefined,
        contacto_emergencia_nombre:   form.contacto_emergencia_nombre.trim()   || undefined,
        contacto_emergencia_telefono: form.contacto_emergencia_telefono.trim() || undefined,
      });
      onSuccess();
    } catch (err) {
      setApiError(err.response?.data?.message || 'Error al crear el paciente');
    } finally {
      setSaving(false);
    }
  };

  const edadTexto = edad
    ? [
        edad.años  > 0 ? `${edad.años} año${edad.años !== 1 ? 's' : ''}`    : null,
        edad.meses > 0 ? `${edad.meses} mes${edad.meses !== 1 ? 'es' : ''}` : null,
        edad.dias  > 0 ? `${edad.dias} día${edad.dias !== 1 ? 's' : ''}`    : null,
      ].filter(Boolean).join(', ') || '0 días'
    : null;

  return (
    <div className={styles.backdrop} onClick={e => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className={styles.modal}>

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerIcon}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <line x1="21" y1="11" x2="15" y2="11"/><line x1="18" y1="8" x2="18" y2="14"/>
            </svg>
          </div>
          <div>
            <h2 className={styles.headerTitle}>Nuevo paciente</h2>
            <p className={styles.headerSub}>Complete los datos para registrar el paciente</p>
          </div>
          <button className={styles.closeBtn} type="button" onClick={onCancel}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Form body */}
        <form id="paciente-form" className={styles.body} onSubmit={handleSubmit} noValidate>

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
              <Field label="Nombre" error={errores.nombre} required>
                <input className={cls(styles.input, errores.nombre && styles.inputError)}
                  placeholder="Ingrese nombres"
                  value={form.nombre}
                  onChange={e => set('nombre', e.target.value)} />
              </Field>
              <Field label="Apellido" error={errores.apellido} required>
                <input className={cls(styles.input, errores.apellido && styles.inputError)}
                  placeholder="Ingrese apellidos"
                  value={form.apellido}
                  onChange={e => set('apellido', e.target.value)} />
              </Field>
            </div>

            <div className={styles.row3}>
              <Field label="RUT" error={errores.rut} tag="Opcional">
                <input className={cls(styles.input, errores.rut && styles.inputError)}
                  placeholder="Ej: 12.345.678-9"
                  value={form.rut}
                  onChange={e => set('rut', formatearRUT(e.target.value))}
                  maxLength={12} />
                {form.rut && !errores.rut && validarRUT(form.rut) &&
                  <span className={styles.validMsg}>✓ Válido</span>}
              </Field>
              <Field label="Fecha de nacimiento" error={errores.fecha_nacimiento} required>
                <input className={cls(styles.input, errores.fecha_nacimiento && styles.inputError)}
                  type="date"
                  value={form.fecha_nacimiento}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={e => set('fecha_nacimiento', e.target.value)} />
                {edadTexto && !errores.fecha_nacimiento && (
                  <span className={styles.agePill}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                    </svg>
                    {edadTexto}
                  </span>
                )}
              </Field>
              <Field label="Género" error={errores.genero} required>
                <select className={cls(styles.select, errores.genero && styles.inputError)}
                  value={form.genero}
                  onChange={e => set('genero', e.target.value)}>
                  <option value="">Seleccionar…</option>
                  <option value="femenino">Femenino</option>
                  <option value="masculino">Masculino</option>
                  <option value="otro">Otro</option>
                </select>
              </Field>
            </div>
          </Section>

          {/* ── Contacto ── */}
          <Section label="Contacto" tag="Opcional">
            <div className={styles.row2}>
              <Field label="Teléfono">
                <PhoneInput
                  value={form.telefono}
                  onChange={e => set('telefono', e.target.value)} />
              </Field>
              <Field label="Correo electrónico">
                <input className={styles.input}
                  type="email" placeholder="correo@ejemplo.cl"
                  value={form.email}
                  onChange={e => set('email', e.target.value)} />
              </Field>
            </div>
          </Section>

          {/* ── Previsión salud ── */}
          <Section label="Previsión de salud">
            <div className={styles.row2}>
              <Field label="Tipo de previsión" required>
                <select className={styles.select}
                  value={form.prevision_salud}
                  onChange={e => set('prevision_salud', e.target.value)}>
                  <option value="fonasa">FONASA</option>
                  <option value="isapre">ISAPRE</option>
                  <option value="particular">Particular</option>
                </select>
              </Field>
              {form.prevision_salud === 'isapre' && (
                <Field label="Nombre ISAPRE" error={errores.nombre_isapre} required>
                  <input className={cls(styles.input, errores.nombre_isapre && styles.inputError)}
                    placeholder="Ej: Banmédica, Cruz Blanca…"
                    value={form.nombre_isapre}
                    onChange={e => set('nombre_isapre', e.target.value)} />
                </Field>
              )}
              {form.prevision_salud === 'fonasa' && (
                <Field label="N° FONASA" tag="Opcional">
                  <input className={styles.input}
                    placeholder="Número de afiliado"
                    value={form.numero_fonasa}
                    onChange={e => set('numero_fonasa', e.target.value)} />
                </Field>
              )}
            </div>
          </Section>

          {/* ── Datos clínicos ── */}
          <Section label="Datos clínicos" tag="Opcional">
            <Field label="Grupo sanguíneo" tag="Opcional">
              <select className={styles.select}
                value={form.grupo_sanguineo}
                onChange={e => set('grupo_sanguineo', e.target.value)}>
                <option value="desconocido">Desconocido</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </Field>
            <Field label="Alergias conocidas">
              <textarea className={styles.textarea}
                placeholder="Describa alergias a medicamentos, alimentos, materiales…"
                value={form.alergias}
                onChange={e => set('alergias', e.target.value)} />
            </Field>
            <Field label="Antecedentes médicos">
              <textarea className={styles.textarea}
                placeholder="Enfermedades crónicas, cirugías, hospitalizaciones previas…"
                value={form.antecedentes}
                onChange={e => set('antecedentes', e.target.value)} />
            </Field>
          </Section>

          {/* ── Contacto emergencia ── */}
          <Section label="Contacto de emergencia" tag="Opcional">
            <div className={styles.row2}>
              <Field label="Nombre">
                <input className={styles.input}
                  placeholder="Nombre completo"
                  value={form.contacto_emergencia_nombre}
                  onChange={e => set('contacto_emergencia_nombre', e.target.value)} />
              </Field>
              <Field label="Teléfono">
                <PhoneInput
                  value={form.contacto_emergencia_telefono}
                  onChange={e => set('contacto_emergencia_telefono', e.target.value)} />
              </Field>
            </div>
          </Section>

        </form>

        {/* Footer */}
        <div className={styles.footer}>
          <button type="button" className={styles.btnCancel} onClick={onCancel}>
            Cancelar
          </button>
          <button type="submit" form="paciente-form" className={styles.btnSubmit} disabled={saving}>
            {saving ? (
              <><span className={styles.spinner} /> Guardando…</>
            ) : (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                  <polyline points="17 21 17 13 7 13 7 21"/>
                  <polyline points="7 3 7 8 15 8"/>
                </svg>
                Registrar paciente
              </>
            )}
          </button>
        </div>
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

export default CrearPacienteModal;
