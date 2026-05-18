import React, { useState, useEffect, useCallback } from 'react';
import { listarPacientes, desactivarPaciente, reactivarPaciente } from '../../../services/pacienteService';
import { getMisMedicos } from '../../../services/secretariaService';
import CrearPacienteModal from '../CrearPacienteModal';
import NuevaCitaModal from '../NuevaCitaModal';
import HistorialPacienteModal from '../../medico/HistorialPacienteModal';
import { PhoneDisplay } from '../../ui/PhoneInput';
import styles from './PacientesTab.module.css';

const GENERO_LABEL     = { masculino: 'Masculino', femenino: 'Femenino', otro: 'Otro' };
const PREVISION_LABEL  = { fonasa: 'FONASA', isapre: 'ISAPRE', particular: 'Particular' };
const PENSION_LABEL    = { afp: 'AFP', ips: 'IPS (ex INP)', ninguna: 'Ninguna' };

function calcularEdadCompleta(fechaStr) {
  if (!fechaStr) return null;
  const hoy = new Date();
  const nac = new Date(fechaStr + 'T00:00:00');
  let años  = hoy.getFullYear() - nac.getFullYear();
  let meses = hoy.getMonth()    - nac.getMonth();
  let dias  = hoy.getDate()     - nac.getDate();
  if (dias  < 0) { meses--; dias  += new Date(hoy.getFullYear(), hoy.getMonth(), 0).getDate(); }
  if (meses < 0) { años--;  meses += 12; }
  if (años  < 0) return null;
  const partes = [
    años  > 0 ? `${años} año${años  !== 1 ? 's' : ''}`    : null,
    meses > 0 ? `${meses} mes${meses !== 1 ? 'es' : ''}`  : null,
    dias  > 0 ? `${dias} día${dias  !== 1 ? 's' : ''}`    : null,
  ].filter(Boolean);
  return partes.length ? partes.join(', ') : '0 días';
}

function calcularSoloAños(fechaStr) {
  if (!fechaStr) return '—';
  const hoy = new Date();
  const nac = new Date(fechaStr + 'T00:00:00');
  let años = hoy.getFullYear() - nac.getFullYear();
  if (hoy.getMonth() < nac.getMonth() ||
     (hoy.getMonth() === nac.getMonth() && hoy.getDate() < nac.getDate())) años--;
  return `${años} años`;
}

function formatFecha(fechaStr) {
  if (!fechaStr) return '—';
  const [y, m, d] = fechaStr.split('-');
  return `${d}/${m}/${y}`;
}

function iniciales(nombre, apellido) {
  return ((nombre?.[0] ?? '') + (apellido?.[0] ?? '')).toUpperCase();
}

/* ─────────────────────────────────────────────
   Modal de detalle completo del paciente
───────────────────────────────────────────── */
const DetallePacienteModal = ({ paciente: p, onClose, onAgendar }) => {
  const edadCompleta = calcularEdadCompleta(p.fecha_nacimiento);

  return (
    <div className={styles.modalBackdrop} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={styles.modal}>

        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.modalAvatar}>{iniciales(p.nombre, p.apellido)}</div>
          <div className={styles.modalHeaderInfo}>
            <div className={styles.modalNombre}>{p.nombre} {p.apellido}</div>
            <div className={styles.modalMeta}>
              {p.rut || 'Sin RUT'}
              <span className={styles.modalBadge} style={
                p.activo
                  ? { color: '#15803d', background: '#f0fdf4', borderColor: '#bbf7d0' }
                  : { color: '#b91c1c', background: '#fef2f2', borderColor: '#fecaca' }
              }>
                {p.activo ? 'Activo' : 'Inactivo'}
              </span>
            </div>
          </div>
          <button className={styles.modalClose} onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className={styles.modalBody}>

          {/* Datos personales */}
          <div className={styles.modalSection}>
            <div className={styles.modalSectionTitle}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1a56db" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              Datos personales
            </div>
            <div className={styles.modalGrid}>
              <InfoField label="Fecha de nacimiento" val={formatFecha(p.fecha_nacimiento)} />
              <InfoField label="Edad" val={edadCompleta || '—'} />
              <InfoField label="Género" val={GENERO_LABEL[p.genero] ?? p.genero} />
              <InfoField label="Grupo sanguíneo" val={p.grupo_sanguineo !== 'desconocido' ? p.grupo_sanguineo : 'Desconocido'} />
            </div>
          </div>

          {/* Contacto */}
          <div className={styles.modalSection}>
            <div className={styles.modalSectionTitle}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1a56db" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.62 3.33 2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l.81-.81a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
              Contacto
            </div>
            <div className={styles.modalGrid}>
              <InfoFieldPhone label="Teléfono" number={p.telefono} />
              <InfoField label="Correo electrónico" val={p.email} />
            </div>
          </div>

          {/* Previsión de salud */}
          <div className={styles.modalSection}>
            <div className={styles.modalSectionTitle}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1a56db" strokeWidth="2">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
              </svg>
              Previsión de salud
            </div>
            <div className={styles.modalGrid}>
              <InfoField label="Tipo" val={PREVISION_LABEL[p.prevision_salud] ?? p.prevision_salud} />
              {p.prevision_salud === 'isapre' && <InfoField label="ISAPRE" val={p.nombre_isapre} />}
              {p.prevision_salud === 'fonasa' && p.numero_fonasa && <InfoField label="N° FONASA" val={p.numero_fonasa} />}
            </div>
          </div>

          {/* Datos clínicos */}
          {(p.alergias || p.antecedentes) && (
            <div className={styles.modalSection}>
              <div className={styles.modalSectionTitle}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1a56db" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
                Datos clínicos
              </div>
              <div className={styles.modalGridFull}>
                {p.alergias     && <InfoFieldFull label="Alergias conocidas"  val={p.alergias} />}
                {p.antecedentes && <InfoFieldFull label="Antecedentes médicos" val={p.antecedentes} />}
              </div>
            </div>
          )}

          {/* Contacto de emergencia */}
          {(p.contacto_emergencia_nombre || p.contacto_emergencia_telefono) && (
            <div className={styles.modalSection}>
              <div className={styles.modalSectionTitle}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1a56db" strokeWidth="2">
                  <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/>
                  <line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                Contacto de emergencia
              </div>
              <div className={styles.modalGrid}>
                <InfoField label="Nombre"   val={p.contacto_emergencia_nombre} />
                <InfoFieldPhone label="Teléfono" number={p.contacto_emergencia_telefono} />
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          <button className={styles.btnCerrar} onClick={onClose}>Cerrar</button>
          <button className={styles.btnAgendar} onClick={onAgendar}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              <line x1="12" y1="14" x2="12" y2="18"/><line x1="10" y1="16" x2="14" y2="16"/>
            </svg>
            Agendar cita
          </button>
        </div>
      </div>
    </div>
  );
};

const InfoField = ({ label, val }) => (
  <div className={styles.infoField}>
    <div className={styles.infoLabel}>{label}</div>
    <div className={styles.infoVal}>{val || '—'}</div>
  </div>
);

const InfoFieldFull = ({ label, val }) => (
  <div className={styles.infoFieldFull}>
    <div className={styles.infoLabel}>{label}</div>
    <div className={styles.infoVal}>{val}</div>
  </div>
);

const InfoFieldPhone = ({ label, number }) => (
  <div className={styles.infoField}>
    <div className={styles.infoLabel}>{label}</div>
    <div className={styles.infoVal}><PhoneDisplay number={number} /></div>
  </div>
);

/* ─────────────────────────────────────────────
   Tab principal
───────────────────────────────────────────── */
const PacientesTab = () => {
  const [pacientes, setPacientes]             = useState([]);
  const [medicos, setMedicos]                 = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [busqueda, setBusqueda]               = useState('');
  const [pagina, setPagina]                   = useState(1);
  const [showCrear, setShowCrear]             = useState(false);
  const [verPaciente, setVerPaciente]         = useState(null);
  const [verHistorial, setVerHistorial]       = useState(null);
  const [agendarPaciente, setAgendarPaciente] = useState(null);
  const [toggling, setToggling]               = useState(null);
  const [successMsg, setSuccessMsg]           = useState('');

  const POR_PAGINA = 10;

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const [pacs, meds] = await Promise.all([listarPacientes(), getMisMedicos()]);
      setPacientes(pacs);
      setMedicos(meds);
    } catch {
      setPacientes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const filtrados = pacientes.filter(p => {
    if (!busqueda.trim()) return true;
    const q = busqueda.toLowerCase();
    return (
      p.nombre.toLowerCase().includes(q)   ||
      p.apellido.toLowerCase().includes(q) ||
      (p.rut?.toLowerCase().includes(q))   ||
      (p.email?.toLowerCase().includes(q))
    );
  });

  const totalPaginas  = Math.ceil(filtrados.length / POR_PAGINA);
  const paginaActual  = Math.min(pagina, totalPaginas || 1);
  const paginados     = filtrados.slice((paginaActual - 1) * POR_PAGINA, paginaActual * POR_PAGINA);

  const irPagina = (n) => setPagina(Math.max(1, Math.min(n, totalPaginas)));

  const handleToggle = async (p, e) => {
    e.stopPropagation();
    setToggling(p.id);
    try {
      if (p.activo) await desactivarPaciente(p.id);
      else          await reactivarPaciente(p.id);
      await cargar();
      setSuccessMsg(p.activo ? 'Paciente desactivado' : 'Paciente reactivado');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch { /* ignore */ }
    finally { setToggling(null); }
  };

  const handleCrearSuccess = async () => {
    setShowCrear(false);
    await cargar();
    setSuccessMsg('Paciente registrado exitosamente');
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  return (
    <div className={styles.wrapper}>

      {showCrear && (
        <CrearPacienteModal
          onSuccess={handleCrearSuccess}
          onCancel={() => setShowCrear(false)}
        />
      )}

      {verPaciente && !agendarPaciente && (
        <DetallePacienteModal
          paciente={verPaciente}
          onClose={() => setVerPaciente(null)}
          onAgendar={() => { setAgendarPaciente(verPaciente); setVerPaciente(null); }}
        />
      )}

      {agendarPaciente && (
        <NuevaCitaModal
          medicos={medicos}
          initialPaciente={agendarPaciente}
          onSuccess={() => {
            setAgendarPaciente(null);
            setSuccessMsg('Cita agendada exitosamente');
            setTimeout(() => setSuccessMsg(''), 3500);
          }}
          onCancel={() => setAgendarPaciente(null)}
        />
      )}

      {verHistorial && (
        <HistorialPacienteModal
          paciente={verHistorial}
          onClose={() => setVerHistorial(null)}
        />
      )}

      {/* Title bar */}
      <div className={styles.pageTitle}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1a56db" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
        <div>
          <h2 className={styles.title}>Pacientes</h2>
          <p className={styles.subtitle}>Listado de pacientes registrados</p>
        </div>
        <button className={styles.newBtn} onClick={() => setShowCrear(true)}>
          + Nuevo paciente
        </button>
      </div>

      {successMsg && <div className={styles.successMsg}>{successMsg}</div>}

      {/* Search */}
      <div className={styles.searchBox}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input className={styles.searchInput} placeholder="Buscar por nombre, RUT o email…"
          value={busqueda} onChange={e => { setBusqueda(e.target.value); setPagina(1); }} />
      </div>

      {/* Lista */}
      <div className={styles.lista}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8', fontSize: 14 }}>
            Cargando pacientes…
          </div>
        ) : filtrados.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '50px 0', color: '#94a3b8' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <p style={{ margin: 0, fontSize: 14 }}>
              {busqueda ? 'No hay pacientes que coincidan con la búsqueda' : 'No hay pacientes registrados'}
            </p>
          </div>
        ) : paginados.map(p => (
          <div key={p.id} className={styles.pacienteRow}>
            <div className={styles.avatar}>{iniciales(p.nombre, p.apellido)}</div>
            <div className={styles.info}>
              <div className={styles.nombre}>{p.apellido}, {p.nombre}</div>
              <div className={styles.rut}>{p.rut || 'Sin RUT'} · {calcularSoloAños(p.fecha_nacimiento)}</div>
            </div>
            <span className={styles.badge} style={
              p.activo
                ? { color: '#15803d', background: '#f0fdf4', borderColor: '#bbf7d0' }
                : { color: '#b91c1c', background: '#fef2f2', borderColor: '#fecaca' }
            }>
              {p.activo ? 'Activo' : 'Inactivo'}
            </span>
            <div className={styles.acciones}>
              <button className={styles.btnVer} onClick={() => setVerPaciente(p)}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
                Ver
              </button>
              <button className={styles.btnHistorial} onClick={() => setVerHistorial(p)}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
                  <rect x="9" y="3" width="6" height="4" rx="1"/>
                  <line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/>
                </svg>
                Historial
              </button>
              <button
                className={styles.btnToggle}
                onClick={e => handleToggle(p, e)}
                disabled={toggling === p.id}
                style={{
                  borderColor: p.activo ? '#fca5a5' : '#86efac',
                  color:       p.activo ? '#dc2626' : '#15803d',
                }}
              >
                {toggling === p.id ? '…' : (p.activo ? 'Desactivar' : 'Activar')}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Paginación */}
      {!loading && totalPaginas > 1 && (
        <div className={styles.paginacion}>
          <button className={styles.pgBtn} onClick={() => irPagina(paginaActual - 1)} disabled={paginaActual === 1}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>

          {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(n => (
            <button
              key={n}
              className={`${styles.pgBtn} ${n === paginaActual ? styles.pgActivo : ''}`}
              onClick={() => irPagina(n)}
            >
              {n}
            </button>
          ))}

          <button className={styles.pgBtn} onClick={() => irPagina(paginaActual + 1)} disabled={paginaActual === totalPaginas}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>

          <span className={styles.pgInfo}>
            {(paginaActual - 1) * POR_PAGINA + 1}–{Math.min(paginaActual * POR_PAGINA, filtrados.length)} de {filtrados.length}
          </span>
        </div>
      )}
    </div>
  );
};

export default PacientesTab;
