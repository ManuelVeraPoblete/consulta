import React, { useState, useEffect } from 'react';
import { crearMedico, listarPrevisiones, listarEspecialidades } from '../../services/adminService';
import styles from './CrearMedicoForm.module.css';

// ── Utilidades ────────────────────────────────────────────────────────────────

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
  const cuerpo     = limpio.slice(0, -1);
  const dv         = limpio.slice(-1);
  const formateado = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return dv ? `${formateado}-${dv}` : formateado;
}

const cls = (...c) => c.filter(Boolean).join(' ');

const EMPTY = {
  nombres: '', apellidos: '', rut: '',
  numero_registro: '', fecha_registro_prestador: '',
  titulo_profesional: '', especialidad_id: '', subespecialidad_ids: [],
  entidad_certificadora: '', vigencia_especialidad: '',
  descripcion: '',
  email: '', password: '', confirmarPassword: '',
  modalidad_presencial: false, modalidad_telemedicina: false,
  prevision_ids: [],
  acepta_particular: false, valor_particular: '',
};

// ── Componente principal ──────────────────────────────────────────────────────

const CrearMedicoForm = ({ onSuccess, onCancel }) => {
  const [form, setForm]               = useState(EMPTY);
  const [errores, setErrores]         = useState({});
  const [saving, setSaving]           = useState(false);
  const [apiError, setApiError]       = useState('');
  const [previsiones, setPrevisiones] = useState([]);
  const [especialidades, setEspecialidades] = useState([]);

  useEffect(() => {
    listarPrevisiones()
      .then(setPrevisiones)
      .catch(() => setApiError('No se pudieron cargar las previsiones'));
    listarEspecialidades()
      .then(setEspecialidades)
      .catch(() => setApiError('No se pudieron cargar las especialidades'));
  }, []);

  const set = (campo, valor) => {
    setForm(f => ({ ...f, [campo]: valor }));
    setErrores(e => ({ ...e, [campo]: '' }));
    setApiError('');
  };

  const togglePrevision = (id) => {
    setForm(f => ({
      ...f,
      prevision_ids: f.prevision_ids.includes(id)
        ? f.prevision_ids.filter(x => x !== id)
        : [...f.prevision_ids, id],
    }));
    setErrores(e => ({ ...e, convenio: '' }));
  };

  // ── Validación ─────────────────────────────────────────────────────────────
  const validar = () => {
    const e = {};

    if (!form.nombres.trim() || form.nombres.trim().length < 2)
      e.nombres = 'Ingrese los nombres (mínimo 2 caracteres)';

    if (!form.apellidos.trim() || form.apellidos.trim().length < 2)
      e.apellidos = 'Ingrese los apellidos (mínimo 2 caracteres)';

    if (!form.rut.trim())
      e.rut = 'El RUT es requerido';
    else if (!validarRUT(form.rut))
      e.rut = 'RUT inválido — verifique el dígito verificador';

    if (!form.numero_registro.trim())
      e.numero_registro = 'El número de registro es requerido';
    else if (!/^\d{4,10}$/.test(form.numero_registro.trim()))
      e.numero_registro = 'Debe contener entre 4 y 10 dígitos';

    if (!form.fecha_registro_prestador)
      e.fecha_registro_prestador = 'La fecha de registro es requerida';

    if (!form.titulo_profesional.trim())
      e.titulo_profesional = 'El título profesional es requerido';

    if (!form.especialidad_id)
      e.especialidad_id = 'Seleccione una especialidad';

    if (!form.entidad_certificadora.trim())
      e.entidad_certificadora = 'La entidad certificadora es requerida';

    if (!form.vigencia_especialidad)
      e.vigencia_especialidad = 'La fecha de vigencia es requerida';

    if (!form.email.trim())
      e.email = 'El usuario (email) es requerido';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = 'Ingrese un email válido';

    if (!form.password)
      e.password = 'La contraseña es requerida';
    else if (form.password.length < 8)
      e.password = 'Mínimo 8 caracteres';

    if (!form.confirmarPassword)
      e.confirmarPassword = 'Confirme la contraseña';
    else if (form.password !== form.confirmarPassword)
      e.confirmarPassword = 'Las contraseñas no coinciden';

    if (!form.modalidad_presencial && !form.modalidad_telemedicina)
      e.modalidad = 'Seleccione al menos una modalidad de atención';

    if (!form.prevision_ids.length && !form.acepta_particular)
      e.convenio = 'Seleccione al menos un convenio o previsión';

    if (form.acepta_particular) {
      if (!form.valor_particular)
        e.valor_particular = 'Ingrese el valor de la consulta particular';
      else if (parseInt(form.valor_particular) <= 0)
        e.valor_particular = 'El valor debe ser mayor a 0';
    }

    setErrores(e);
    return Object.keys(e).length === 0;
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validar()) return;
    setSaving(true);
    setApiError('');
    try {
      await crearMedico({
        nombre:   form.nombres.trim(),
        apellido: form.apellidos.trim(),
        rut:      form.rut,
        email:    form.email,
        password: form.password,
        perfil: {
          numero_registro:          form.numero_registro.trim(),
          fecha_registro_prestador: form.fecha_registro_prestador,
          titulo_profesional:       form.titulo_profesional.trim(),
          especialidad_id:    Number(form.especialidad_id),
          subespecialidad_ids: form.subespecialidad_ids,
          entidad_certificadora:    form.entidad_certificadora.trim(),
          vigencia_especialidad:    form.vigencia_especialidad,
          descripcion:              form.descripcion.trim(),
          modalidad_presencial:     form.modalidad_presencial,
          modalidad_telemedicina:   form.modalidad_telemedicina,
          prevision_ids:            form.prevision_ids,
          acepta_particular:        form.acepta_particular,
          valor_particular:         form.acepta_particular ? parseInt(form.valor_particular) : null,
        },
      });
      onSuccess();
    } catch (err) {
      setApiError(err.response?.data?.message || 'Error al crear el médico');
    } finally {
      setSaving(false);
    }
  };

  const fonasa  = previsiones.filter(p => p.tipo === 'fonasa');
  const isapres = previsiones.filter(p => p.tipo === 'isapre');

  const espSeleccionada   = especialidades.find(e => e.id === Number(form.especialidad_id));
  const subespecialidades = espSeleccionada?.subespecialidades || [];

  const toggleSub = (id) => {
    setForm(f => ({
      ...f,
      subespecialidad_ids: f.subespecialidad_ids.includes(id)
        ? f.subespecialidad_ids.filter(x => x !== id)
        : [...f.subespecialidad_ids, id],
    }));
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.formTitle}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0891b2" strokeWidth="2">
          <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/>
          <path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/>
          <circle cx="20" cy="10" r="2"/>
        </svg>
        Nuevo médico
      </div>

      {apiError && <div className={styles.apiError}>{apiError}</div>}

      {/* ── 1. Datos personales ── */}
      <Section title="Datos personales">
        <div className={styles.row2}>
          <Field label="Nombres" error={errores.nombres} required>
            <input className={cls(styles.input, errores.nombres && styles.inputError)}
              placeholder="Ej: Carlos Andrés"
              value={form.nombres}
              onChange={e => set('nombres', e.target.value)} />
          </Field>

          <Field label="Apellidos" error={errores.apellidos} required>
            <input className={cls(styles.input, errores.apellidos && styles.inputError)}
              placeholder="Ej: Rodríguez Pérez"
              value={form.apellidos}
              onChange={e => set('apellidos', e.target.value)} />
          </Field>
        </div>

        <div className={styles.row2}>
          <Field label="RUT" error={errores.rut} required hint="Formato: 12.345.678-9">
            <input className={cls(styles.input, errores.rut && styles.inputError)}
              placeholder="12.345.678-9"
              value={form.rut}
              onChange={e => set('rut', formatearRUT(e.target.value))}
              maxLength={12} />
            {form.rut && !errores.rut && validarRUT(form.rut) &&
              <span className={styles.valid}>✓ RUT válido</span>}
          </Field>

          <Field label="N° Registro Prestador" error={errores.numero_registro} required>
            <input className={cls(styles.input, errores.numero_registro && styles.inputError)}
              placeholder="Ej: 12345"
              value={form.numero_registro}
              onChange={e => set('numero_registro', e.target.value.replace(/\D/g, ''))}
              maxLength={10} />
          </Field>
        </div>

        <div className={styles.row2}>
          <Field label="Fecha Registro Prestador" error={errores.fecha_registro_prestador} required>
            <input type="date"
              className={cls(styles.input, errores.fecha_registro_prestador && styles.inputError)}
              value={form.fecha_registro_prestador}
              onChange={e => set('fecha_registro_prestador', e.target.value)} />
          </Field>

          <Field label="Título Profesional" error={errores.titulo_profesional} required>
            <input className={cls(styles.input, errores.titulo_profesional && styles.inputError)}
              placeholder="Ej: Médico Cirujano"
              value={form.titulo_profesional}
              onChange={e => set('titulo_profesional', e.target.value)} />
          </Field>
        </div>
      </Section>

      {/* ── 2. Especialidad ── */}
      <Section title="Especialidad">
        <div className={styles.row2}>
          <Field label="Especialidad" error={errores.especialidad_id} required>
            <select
              className={cls(styles.input, errores.especialidad_id && styles.inputError)}
              value={form.especialidad_id}
              onChange={e => {
                set('especialidad_id', e.target.value);
                setForm(f => ({ ...f, especialidad_id: e.target.value, subespecialidad_ids: [] }));
              }}>
              <option value="">Seleccionar...</option>
              {especialidades.map(esp => (
                <option key={esp.id} value={esp.id}>{esp.nombre}</option>
              ))}
            </select>
          </Field>

          <Field label="Subespecialidad(es)" hint="opcional, selección múltiple">
            {subespecialidades.length === 0 ? (
              <p className={styles.subHint}>
                {form.especialidad_id ? 'Esta especialidad no tiene subespecialidades' : 'Seleccione primero una especialidad'}
              </p>
            ) : (
              <div className={styles.subGrid}>
                {subespecialidades.map(sub => {
                  const on = form.subespecialidad_ids.includes(sub.id);
                  return (
                    <button key={sub.id} type="button"
                      className={`${styles.subChip} ${on ? styles.subChipOn : ''}`}
                      onClick={() => toggleSub(sub.id)}>
                      {on && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                      {sub.nombre}
                    </button>
                  );
                })}
              </div>
            )}
          </Field>
        </div>

        <div className={styles.row2}>
          <Field label="Entidad Certificadora" error={errores.entidad_certificadora} required>
            <input className={cls(styles.input, errores.entidad_certificadora && styles.inputError)}
              placeholder="Ej: Universidad de Chile"
              value={form.entidad_certificadora}
              onChange={e => set('entidad_certificadora', e.target.value)} />
          </Field>

          <Field label="Vigencia Especialidad" error={errores.vigencia_especialidad} required hint="Fecha de vencimiento">
            <input type="date"
              className={cls(styles.input, errores.vigencia_especialidad && styles.inputError)}
              value={form.vigencia_especialidad}
              onChange={e => set('vigencia_especialidad', e.target.value)} />
          </Field>
        </div>

        <Field label="Descripción profesional">
          <input className={styles.input}
            placeholder="Breve descripción (opcional)"
            value={form.descripcion}
            onChange={e => set('descripcion', e.target.value)} />
        </Field>
      </Section>

      {/* ── 3. Acceso al sistema ── */}
      <Section title="Acceso al sistema">
        <Field label="Usuario (email)" error={errores.email} required>
          <input className={cls(styles.input, errores.email && styles.inputError)}
            type="email" placeholder="medico@ejemplo.com"
            value={form.email}
            onChange={e => set('email', e.target.value)} />
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

      {/* ── 4. Modalidad de atención ── */}
      <Section title="Modalidad de atención">
        <Field label="Modalidad" error={errores.modalidad} required>
          <div className={styles.toggleGroup}>
            <ToggleBtn
              checked={form.modalidad_presencial}
              onChange={v => { set('modalidad_presencial', v); setErrores(er => ({ ...er, modalidad: '' })); }}
              label="Presencial" color="#1d4ed8"
              icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>} />
            <ToggleBtn
              checked={form.modalidad_telemedicina}
              onChange={v => { set('modalidad_telemedicina', v); setErrores(er => ({ ...er, modalidad: '' })); }}
              label="Telemedicina" color="#0891b2"
              icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="15" rx="2"/><polyline points="17 2 12 7 7 2"/></svg>} />
          </div>
        </Field>
      </Section>

      {/* ── 5. Previsiones y convenios ── */}
      <Section title="Previsiones y convenios aceptados">
        {errores.convenio && <div className={styles.errorBanner}>{errores.convenio}</div>}

        <div className={styles.previsionTable}>
          <div className={styles.previsionHead}>
            <span>Previsión</span>
            <span>Tipo</span>
            <span className={styles.colAcepta}>Acepta</span>
          </div>

          {fonasa.map(p => (
            <PrevisionRow key={p.id} prevision={p}
              checked={form.prevision_ids.includes(p.id)}
              onToggle={() => togglePrevision(p.id)} />
          ))}

          {isapres.length > 0 && <div className={styles.previsionSep}>ISAPRES</div>}
          {isapres.map(p => (
            <PrevisionRow key={p.id} prevision={p}
              checked={form.prevision_ids.includes(p.id)}
              onToggle={() => togglePrevision(p.id)} />
          ))}

          <div className={styles.previsionSep}>ATENCIÓN PARTICULAR</div>
          <div
            className={`${styles.previsionRow} ${form.acepta_particular ? styles.previsionRowOn : ''}`}
            onClick={() => { set('acepta_particular', !form.acepta_particular); setErrores(er => ({ ...er, convenio: '' })); }}>
            <span className={styles.previsionNombre}>Particular</span>
            <span className={`${styles.tipoBadge} ${styles.tipoParticular}`}>Particular</span>
            <span className={styles.colAcepta}><Checkbox checked={form.acepta_particular} /></span>
          </div>
        </div>

        {form.acepta_particular && (
          <Field label="Valor consulta particular ($)" error={errores.valor_particular} required>
            <div className={styles.currencyInput}>
              <span className={styles.currencySymbol}>$</span>
              <input
                className={cls(styles.input, styles.inputCurrency, errores.valor_particular && styles.inputError)}
                type="number" min="1" placeholder="Ej: 45000"
                value={form.valor_particular}
                onChange={e => set('valor_particular', e.target.value)} />
            </div>
          </Field>
        )}
      </Section>

      {/* ── Acciones ── */}
      <div className={styles.actions}>
        <button type="button" className={styles.btnCancel} onClick={onCancel}>Cancelar</button>
        <button type="submit" className={styles.btnSubmit} disabled={saving}>
          {saving
            ? <><span className={styles.spinner} /> Guardando...</>
            : <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                  <polyline points="17 21 17 13 7 13 7 21"/>
                  <polyline points="7 3 7 8 15 8"/>
                </svg>
                Crear médico
              </>}
        </button>
      </div>
    </form>
  );
};

// ── Subcomponentes ────────────────────────────────────────────────────────────

const Section = ({ title, children }) => (
  <fieldset className={styles.section}>
    <legend className={styles.legend}>{title}</legend>
    {children}
  </fieldset>
);

const Field = ({ label, error, hint, required, children }) => (
  <div className={styles.field}>
    <label className={styles.label}>
      {label}
      {required && <span className={styles.req}> *</span>}
      {hint && <span className={styles.hint}> — {hint}</span>}
    </label>
    {children}
    {error && <span className={styles.errorMsg}>{error}</span>}
  </div>
);

const ToggleBtn = ({ checked, onChange, label, icon, color }) => (
  <button type="button"
    className={`${styles.toggleBtn} ${checked ? styles.toggleBtnOn : ''}`}
    style={checked ? { borderColor: color, background: color + '18', color } : {}}
    onClick={() => onChange(!checked)}>
    {icon}
    <span>{label}</span>
    {checked && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>}
  </button>
);

const Checkbox = ({ checked }) => (
  <span className={`${styles.checkbox} ${checked ? styles.checkboxOn : ''}`}>
    {checked && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
  </span>
);

const PrevisionRow = ({ prevision, checked, onToggle }) => (
  <div className={`${styles.previsionRow} ${checked ? styles.previsionRowOn : ''}`} onClick={onToggle}>
    <span className={styles.previsionNombre}>{prevision.nombre}</span>
    <span className={`${styles.tipoBadge} ${prevision.tipo === 'fonasa' ? styles.tipoFonasa : styles.tipoIsapre}`}>
      {prevision.tipo.toUpperCase()}
    </span>
    <span className={styles.colAcepta}><Checkbox checked={checked} /></span>
  </div>
);

export default CrearMedicoForm;
