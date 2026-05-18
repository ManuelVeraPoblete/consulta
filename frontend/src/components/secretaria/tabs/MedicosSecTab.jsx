import React, { useState, useEffect, useCallback } from 'react';
import { getMisMedicos } from '../../../services/secretariaService';
import { PhoneDisplay } from '../../ui/PhoneInput';
import styles from './MedicosSecTab.module.css';

const COLORS = [
  'linear-gradient(135deg,#1a56db,#0ea5e9)',
  'linear-gradient(135deg,#7c3aed,#9333ea)',
  'linear-gradient(135deg,#0891b2,#06b6d4)',
  'linear-gradient(135deg,#15803d,#16a34a)',
  'linear-gradient(135deg,#b45309,#d97706)',
];

function iniciales(nombre, apellido) {
  return ((nombre?.[0] ?? '') + (apellido?.[0] ?? '')).toUpperCase();
}

const MedicosSecTab = () => {
  const [medicos, setMedicos]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [busqueda, setBusqueda]   = useState('');
  const [selected, setSelected]   = useState(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMisMedicos();
      setMedicos(data);
    } catch {
      setMedicos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const filtrados = medicos.filter(m => {
    if (!busqueda.trim()) return true;
    const q = busqueda.toLowerCase();
    return (
      m.nombre.toLowerCase().includes(q)   ||
      m.apellido.toLowerCase().includes(q) ||
      m.perfil?.especialidad?.nombre?.toLowerCase().includes(q)
    );
  });

  return (
    <div className={styles.wrapper}>

      {/* Title */}
      <div className={styles.pageTitle}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1a56db" strokeWidth="2">
          <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1"/>
          <path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/>
          <circle cx="20" cy="10" r="2"/>
        </svg>
        <div>
          <h2 className={styles.title}>Médicos asignados</h2>
          <p className={styles.subtitle}>
            {loading ? 'Cargando…' : `${medicos.length} médico${medicos.length !== 1 ? 's' : ''} asignado${medicos.length !== 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input className={styles.searchInput} placeholder="Buscar médico o especialidad…"
            value={busqueda} onChange={e => setBusqueda(e.target.value)} />
        </div>
      </div>

      <div className={styles.contentArea}>
        {/* Lista */}
        <div className={styles.lista}>
          {loading ? (
            <div className={styles.emptyState}>
              <p>Cargando médicos…</p>
            </div>
          ) : filtrados.length === 0 ? (
            <div className={styles.emptyState}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5">
                <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1"/>
                <path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/>
                <circle cx="20" cy="10" r="2"/>
              </svg>
              <p>{busqueda ? 'No hay médicos que coincidan' : 'No hay médicos asignados'}</p>
            </div>
          ) : filtrados.map((m, i) => {
            const color = COLORS[i % COLORS.length];
            const perfil = m.perfil;
            const esp = perfil?.especialidad?.nombre ?? '—';
            const previsiones = perfil?.previsiones ?? [];
            const isSelected = selected?.id === m.id;

            return (
              <div
                key={m.id}
                className={`${styles.medicoCard} ${isSelected ? styles.selected : ''}`}
                onClick={() => setSelected(sel => sel?.id === m.id ? null : m)}
              >
                <div className={styles.avatar} style={{ background: color }}>
                  {iniciales(m.nombre, m.apellido)}
                </div>

                <div className={styles.info}>
                  <div className={styles.nombre}>Dr. {m.nombre} {m.apellido}</div>
                  <div className={styles.esp}>{esp}</div>
                  {previsiones.length > 0 && (
                    <div className={styles.acepts}>
                      {previsiones.map(p => (
                        <span key={p.id} className={styles.prevBadge}
                          style={{ background: '#f0f9ff', color: '#0369a1', borderColor: '#bae6fd' }}>
                          {p.nombre}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <span className={`${styles.estado} ${m.activo ? styles.activo : styles.inactivo}`}>
                  {m.activo ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            );
          })}
        </div>

        {/* Detalle lateral */}
        {selected && (() => {
          const perfil  = selected.perfil;
          const color   = COLORS[medicos.findIndex(m => m.id === selected.id) % COLORS.length];
          const previsiones = perfil?.previsiones ?? [];

          return (
            <div className={styles.detalle}>
              <div className={styles.detalleHeader} style={{ background: color }}>
                <div className={styles.detalleAvatar}>{iniciales(selected.nombre, selected.apellido)}</div>
                <div className={styles.detalleInfo}>
                  <div className={styles.detalleName}>Dr. {selected.nombre} {selected.apellido}</div>
                  <div className={styles.detalleEsp}>{perfil?.especialidad?.nombre ?? '—'}</div>
                </div>
                <button className={styles.closeDet} onClick={() => setSelected(null)}>✕</button>
              </div>

              <div className={styles.detalleBody}>

                {/* Contacto */}
                {(selected.email || selected.telefono) && (
                  <div className={styles.section}>
                    <div className={styles.sectionTitle}>Contacto</div>
                    {selected.email && (
                      <div className={styles.turnoChip} style={{ fontSize: 12 }}>{selected.email}</div>
                    )}
                    {selected.telefono && (
                      <div className={styles.turnoChip} style={{ fontSize: 12 }}>
                        <PhoneDisplay number={selected.telefono} />
                      </div>
                    )}
                  </div>
                )}

                {/* Previsiones */}
                {previsiones.length > 0 && (
                  <div className={styles.section}>
                    <div className={styles.sectionTitle}>Previsiones aceptadas</div>
                    <div className={styles.prevRow}>
                      {previsiones.map(p => (
                        <span key={p.id} className={styles.prevBadge}
                          style={{ background: '#f0f9ff', color: '#0369a1', borderColor: '#bae6fd' }}>
                          {p.nombre}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Turno / modalidad */}
                {(perfil?.modalidad || perfil?.dias_atencion) && (
                  <div className={styles.section}>
                    <div className={styles.sectionTitle}>Atención</div>
                    {perfil.modalidad && (
                      <div className={styles.turnoChip}>{perfil.modalidad}</div>
                    )}
                    {perfil.dias_atencion && (
                      <div className={styles.turnoChip}>{perfil.dias_atencion}</div>
                    )}
                  </div>
                )}

                <button className={styles.agendarBtn}>Agendar cita</button>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};

export default MedicosSecTab;
