import React, { useState, useEffect, useCallback } from 'react';
import { buscarMedicos } from '../../../services/medicoService';
import { listarEspecialidades } from '../../../services/adminService';
import MedicoAgenda from '../MedicoAgenda';
import styles from './MedicosTab.module.css';

const MODALIDADES = [
  { key: 'fonasa',      label: 'FONASA',     color: '#0d9488', bg: '#f0fdfa', border: '#99f6e4' },
  { key: 'isapre',     label: 'ISAPRE',     color: '#1a56db', bg: '#eff6ff', border: '#bfdbfe' },
  { key: 'particular', label: 'PARTICULAR', color: '#7c3aed', bg: '#faf5ff', border: '#ddd6fe' },
];

const formatPrecio = (v) =>
  v ? new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(v) : null;

const MedicosTab = () => {
  const [especialidad, setEspecialidad] = useState('');
  const [nombre, setNombre]             = useState('');
  const [modalidad, setModalidad]       = useState('');
  const [medicos, setMedicos]           = useState([]);
  const [especialidades, setEspecialidades] = useState([]);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState(null);
  const [medicoSel, setMedicoSel]       = useState(null);

  useEffect(() => {
    listarEspecialidades().then(setEspecialidades).catch(() => {});
  }, []);

  const buscar = useCallback(async (esp, nom, mod) => {
    setLoading(true);
    setError(null);
    setMedicoSel(null);
    try {
      const data = await buscarMedicos({ especialidad: esp, nombre: nom, modalidad: mod });
      setMedicos(data.medicos);
    } catch {
      setError('No se pudo conectar con el servidor.');
      setMedicos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { buscar(especialidad, nombre, modalidad); }, [especialidad, modalidad]);

  const handleBuscar = (e) => { e.preventDefault(); buscar(especialidad, nombre, modalidad); };
  const handleLimpiar = () => { setEspecialidad(''); setNombre(''); setModalidad(''); buscar('', '', ''); };
  const toggleModalidad = (key) => setModalidad((prev) => (prev === key ? '' : key));

  return (
    <div className={styles.wrapper}>
      <div className={styles.pageTitle}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1a56db" strokeWidth="2">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
        <div>
          <h2 className={styles.title}>Buscar médico</h2>
          <p className={styles.subtitle}>Filtra por especialidad, nombre o modalidad de atención</p>
        </div>
      </div>

      <div className={styles.filtrosBox}>
        <form className={styles.filtrosRow} onSubmit={handleBuscar}>
          <div className={styles.fieldWrap}>
            <label className={styles.fieldLabel}>Especialidad</label>
            <select className={styles.select} value={especialidad} onChange={(e) => setEspecialidad(e.target.value)}>
              <option value="">Todas</option>
              {especialidades.map((e) => <option key={e.id} value={e.nombre}>{e.nombre}</option>)}
            </select>
          </div>

          <div className={styles.fieldWrap} style={{ flex: 2 }}>
            <label className={styles.fieldLabel}>Nombre del médico</label>
            <div className={styles.inputWrap}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input className={styles.input} placeholder="Buscar por nombre..."
                value={nombre} onChange={(e) => setNombre(e.target.value)} />
            </div>
          </div>

          <div className={styles.btnRow}>
            <button type="submit" className={styles.btnBuscar}>Buscar</button>
            {(especialidad || nombre || modalidad) && (
              <button type="button" className={styles.btnLimpiar} onClick={handleLimpiar}>Limpiar</button>
            )}
          </div>
        </form>

        <div className={styles.modalidadRow}>
          <span className={styles.fieldLabel}>Modalidad de atención:</span>
          <div className={styles.modalidadBtns}>
            {MODALIDADES.map((m) => (
              <button key={m.key} type="button"
                className={`${styles.modBtn} ${modalidad === m.key ? styles.modBtnActive : ''}`}
                style={modalidad === m.key ? { background: m.bg, color: m.color, borderColor: m.border } : {}}
                onClick={() => toggleModalidad(m.key)}>
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.contentArea}>
        <div className={styles.listaWrap}>
          {loading && (
            <div className={styles.estado}>
              <div className={styles.spinner} />
              <span>Buscando médicos...</span>
            </div>
          )}
          {error && !loading && <div className={styles.errorBox}>{error}</div>}
          {!loading && !error && medicos.length === 0 && (
            <div className={styles.estado}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <p>No se encontraron médicos con los filtros seleccionados.</p>
            </div>
          )}
          {!loading && medicos.length > 0 && (
            <>
              <p className={styles.resultCount}>
                {medicos.length} médico{medicos.length !== 1 ? 's' : ''} encontrado{medicos.length !== 1 ? 's' : ''}
              </p>
              <div className={styles.lista}>
                {medicos.map((m) => {
                  const isSelected = medicoSel?.id === m.id;
                  return (
                    <div key={m.id}
                      className={`${styles.medicoCard} ${isSelected ? styles.medicoCardSel : ''}`}
                      onClick={() => setMedicoSel(isSelected ? null : m)}>
                      <div className={styles.mAvatar}>{m.usuario.nombre[0]}{m.usuario.apellido[0]}</div>
                      <div className={styles.mBody}>
                        <div className={styles.mNombre}>Dr. {m.usuario.nombre} {m.usuario.apellido}</div>
                        <div className={styles.mEsp}>{m.especialidad}</div>
                        <div className={styles.mModalidades}>
                          {m.acepta_fonasa     && <span className={styles.mTag} style={{ color:'#0d9488', background:'#f0fdfa', borderColor:'#99f6e4' }}>FONASA</span>}
                          {m.acepta_isapre     && <span className={styles.mTag} style={{ color:'#1a56db', background:'#eff6ff', borderColor:'#bfdbfe' }}>ISAPRE</span>}
                          {m.acepta_particular && <span className={styles.mTag} style={{ color:'#7c3aed', background:'#faf5ff', borderColor:'#ddd6fe' }}>PARTICULAR {formatPrecio(m.valor_particular)}</span>}
                        </div>
                      </div>
                      <div className={styles.mArrow}>
                        {isSelected
                          ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1a56db" strokeWidth="2.5"><polyline points="18 15 12 9 6 15"/></svg>
                          : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                        }
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {medicoSel && (
          <div className={styles.agendaPanel}>
            <MedicoAgenda medico={medicoSel} onClose={() => setMedicoSel(null)} />
          </div>
        )}
      </div>
    </div>
  );
};

export default MedicosTab;
