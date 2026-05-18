import React, { useState, useEffect, useCallback, useRef } from 'react';
import { crearCita } from '../../services/citaService';
import { listarPacientes } from '../../services/pacienteService';
import { verificarDisponibilidadAgenda } from '../../services/medicoService';
import CrearPacienteModal from './CrearPacienteModal';
import styles from './NuevaCitaModal.module.css';

function iniciales(nombre, apellido) {
  return ((nombre?.[0] ?? '') + (apellido?.[0] ?? '')).toUpperCase();
}

const DURACIONES = [
  { val: 15,  label: '15 minutos' },
  { val: 30,  label: '30 minutos' },
  { val: 45,  label: '45 minutos' },
  { val: 60,  label: '1 hora' },
  { val: 90,  label: '1 hora 30 min' },
  { val: 120, label: '2 horas' },
];

const NuevaCitaModal = ({ medicos, initialFecha, initialHora, initialMedicoId, initialPaciente, onSuccess, onCancel }) => {
  const [paciente, setPaciente]       = useState(initialPaciente ?? null);
  const [busqueda, setBusqueda]       = useState('');
  const [resultados, setResultados]   = useState([]);
  const [dropOpen, setDropOpen]       = useState(false);
  const [buscando, setBuscando]       = useState(false);
  const [showCrearPac, setShowCrearPac] = useState(false);

  const [medicoId, setMedicoId]       = useState(initialMedicoId ?? medicos[0]?.id ?? '');
  const [fecha, setFecha]             = useState(initialFecha ?? new Date().toISOString().split('T')[0]);
  const [hora, setHora]               = useState(initialHora ?? '09:00');
  const [duracion, setDuracion]       = useState(30);
  const [motivo, setMotivo]           = useState('');

  const [errores, setErrores]         = useState({});
  const [saving, setSaving]           = useState(false);
  const [apiError, setApiError]       = useState('');
  const [fechaBloqueada, setFechaBloqueada] = useState(false);
  const [verificando, setVerificando] = useState(false);

  const dropRef = useRef(null);

  /* Cerrar dropdown al click fuera */
  useEffect(() => {
    const fn = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  /* Cerrar con Escape */
  useEffect(() => {
    const fn = (e) => { if (e.key === 'Escape' && !showCrearPac) onCancel(); };
    document.addEventListener('keydown', fn);
    return () => document.removeEventListener('keydown', fn);
  }, [onCancel, showCrearPac]);

  /* Verificar disponibilidad de la fecha para el médico seleccionado */
  useEffect(() => {
    if (!medicoId || !fecha) { setFechaBloqueada(false); return; }
    let cancelled = false;
    setVerificando(true);
    verificarDisponibilidadAgenda(medicoId, fecha)
      .then(({ disponible }) => { if (!cancelled) setFechaBloqueada(!disponible); })
      .catch(() => { if (!cancelled) setFechaBloqueada(false); })
      .finally(() => { if (!cancelled) setVerificando(false); });
    return () => { cancelled = true; };
  }, [medicoId, fecha]);

  /* Búsqueda de pacientes con debounce */
  useEffect(() => {
    if (busqueda.trim().length < 2) { setResultados([]); setDropOpen(false); return; }
    const timer = setTimeout(async () => {
      setBuscando(true);
      try {
        const data = await listarPacientes({ busqueda: busqueda.trim() });
        setResultados(data.filter(p => p.activo));
        setDropOpen(true);
      } catch { setResultados([]); }
      finally { setBuscando(false); }
    }, 300);
    return () => clearTimeout(timer);
  }, [busqueda]);

  const seleccionarPaciente = (p) => {
    setPaciente(p);
    setBusqueda('');
    setResultados([]);
    setDropOpen(false);
    setErrores(e => ({ ...e, paciente: '' }));
  };

  const handlePacienteCreado = async () => {
    setShowCrearPac(false);
    /* Recargar la búsqueda para encontrar el recién creado */
    try {
      const data = await listarPacientes();
      if (data.length > 0) seleccionarPaciente(data[0]);
    } catch { /* ignore */ }
  };

  const validar = () => {
    const e = {};
    if (!paciente)  e.paciente  = 'Seleccione un paciente';
    if (!medicoId)  e.medicoId  = 'Seleccione un médico';
    if (!fecha)     e.fecha     = 'La fecha es requerida';
    if (!hora)      e.hora      = 'La hora es requerida';
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validar()) return;
    setSaving(true);
    setApiError('');
    try {
      const fecha_hora = new Date(`${fecha}T${hora}:00`).toISOString();
      await crearCita({ paciente_id: paciente.id, medico_id: medicoId, fecha_hora, duracion_min: duracion, motivo: motivo || undefined });
      onSuccess();
    } catch (err) {
      setApiError(err.response?.data?.message || 'Error al guardar la cita');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {showCrearPac && (
        <CrearPacienteModal
          onSuccess={handlePacienteCreado}
          onCancel={() => setShowCrearPac(false)}
        />
      )}

      <div className={styles.backdrop} onClick={e => { if (e.target === e.currentTarget && !showCrearPac) onCancel(); }}>
        <div className={styles.modal}>

          {/* Header */}
          <div className={styles.header}>
            <div className={styles.headerIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
                <line x1="12" y1="14" x2="12" y2="18"/><line x1="10" y1="16" x2="14" y2="16"/>
              </svg>
            </div>
            <div>
              <h2 className={styles.headerTitle}>Nueva cita</h2>
              <p className={styles.headerSub}>Complete los datos para agendar la consulta</p>
            </div>
            <button className={styles.closeBtn} onClick={onCancel} type="button">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          {/* Form */}
          <form id="cita-form" className={styles.body} onSubmit={handleSubmit} noValidate>

            {apiError && (
              <div className={styles.apiError}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {apiError}
              </div>
            )}

            {fechaBloqueada && !verificando && (
              <div className={styles.bloqueadoAlert}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <rect x="3" y="11" width="18" height="11" rx="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <div>
                  <strong>Fecha bloqueada</strong>
                  <span>El médico no ha liberado este día. Contacte al médico para que habilite la agenda.</span>
                </div>
              </div>
            )}

            {/* ── Paciente ── */}
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionLabel}>Paciente</span>
              </div>
              <div className={styles.sectionBody}>
                {paciente ? (
                  <div className={styles.pacienteChip}>
                    <div className={styles.chipAvatar}>{iniciales(paciente.nombre, paciente.apellido)}</div>
                    <div>
                      <div className={styles.chipNombre}>{paciente.nombre} {paciente.apellido}</div>
                      <div className={styles.chipRut}>{paciente.rut || 'Sin RUT'}</div>
                    </div>
                    <button type="button" className={styles.chipClear} onClick={() => setPaciente(null)}>×</button>
                  </div>
                ) : (
                  <div className={styles.searchRow}>
                    <div className={styles.searchWrap} ref={dropRef} style={{ flex: 1 }}>
                      <input
                        className={`${styles.input} ${errores.paciente ? styles.inputError : ''}`}
                        placeholder="Buscar por nombre o RUT…"
                        value={busqueda}
                        onChange={e => setBusqueda(e.target.value)}
                        onFocus={() => resultados.length > 0 && setDropOpen(true)}
                      />
                      {dropOpen && (
                        <div className={styles.dropdown}>
                          {buscando ? (
                            <div className={styles.noResults}>Buscando…</div>
                          ) : resultados.length === 0 ? (
                            <div className={styles.noResults}>Sin resultados</div>
                          ) : resultados.map(p => (
                            <div key={p.id} className={styles.dropdownItem}
                              onMouseDown={() => seleccionarPaciente(p)}>
                              <div className={styles.diAvatar}>{iniciales(p.nombre, p.apellido)}</div>
                              <div>
                                <div className={styles.diNombre}>{p.nombre} {p.apellido}</div>
                                <div className={styles.diRut}>{p.rut || 'Sin RUT'}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <button type="button" className={styles.btnNuevoPaciente}
                      onClick={() => setShowCrearPac(true)}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                        <line x1="19" y1="8" x2="19" y2="14"/><line x1="16" y1="11" x2="22" y2="11"/>
                      </svg>
                      Nuevo paciente
                    </button>
                  </div>
                )}
                {errores.paciente && <span className={styles.errorMsg}>{errores.paciente}</span>}
              </div>
            </div>

            {/* ── Médico ── */}
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionLabel}>Médico</span>
              </div>
              <div className={styles.sectionBody}>
                <div className={styles.field}>
                  <select
                    className={`${styles.select} ${errores.medicoId ? styles.inputError : ''}`}
                    value={medicoId}
                    onChange={e => { setMedicoId(Number(e.target.value)); setErrores(er => ({ ...er, medicoId: '' })); }}
                  >
                    <option value="">Seleccionar médico…</option>
                    {medicos.map(m => (
                      <option key={m.id} value={m.id}>
                        Dr. {m.nombre} {m.apellido}
                        {m.perfil?.especialidad ? ` — ${m.perfil.especialidad.nombre}` : ''}
                      </option>
                    ))}
                  </select>
                  {errores.medicoId && <span className={styles.errorMsg}>{errores.medicoId}</span>}
                </div>
              </div>
            </div>

            {/* ── Fecha y hora ── */}
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionLabel}>Fecha y hora</span>
              </div>
              <div className={styles.sectionBody}>
                <div className={styles.row2}>
                  <div className={styles.field}>
                    <label className={styles.label}>Fecha <span className={styles.req}>*</span></label>
                    <input
                      className={`${styles.input} ${errores.fecha ? styles.inputError : ''}`}
                      type="date"
                      value={fecha}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={e => { setFecha(e.target.value); setErrores(er => ({ ...er, fecha: '' })); }}
                    />
                    {errores.fecha && <span className={styles.errorMsg}>{errores.fecha}</span>}
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Hora <span className={styles.req}>*</span></label>
                    <input
                      className={`${styles.input} ${errores.hora ? styles.inputError : ''}`}
                      type="time"
                      value={hora}
                      min="08:00" max="20:00" step="900"
                      onChange={e => { setHora(e.target.value); setErrores(er => ({ ...er, hora: '' })); }}
                    />
                    {errores.hora && <span className={styles.errorMsg}>{errores.hora}</span>}
                  </div>
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Duración</label>
                  <select className={styles.select} value={duracion}
                    onChange={e => setDuracion(Number(e.target.value))}>
                    {DURACIONES.map(d => <option key={d.val} value={d.val}>{d.label}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* ── Motivo ── */}
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionLabel}>Motivo</span>
                <span className={styles.sectionTag}>Opcional</span>
              </div>
              <div className={styles.sectionBody}>
                <input
                  className={styles.input}
                  placeholder="Ej: Control de presión, dolor de cabeza…"
                  value={motivo}
                  onChange={e => setMotivo(e.target.value)}
                />
              </div>
            </div>

          </form>

          {/* Footer */}
          <div className={styles.footer}>
            <button type="button" className={styles.btnCancel} onClick={onCancel}>Cancelar</button>
            <button type="submit" form="cita-form" className={`${styles.btnSave} ${fechaBloqueada ? styles.btnSaveBlocked : ''}`} disabled={saving || fechaBloqueada || verificando}>
              {saving ? (
                <><span className={styles.spinner} /> Guardando…</>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <rect x="3" y="4" width="18" height="18" rx="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  Guardar cita
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default NuevaCitaModal;
