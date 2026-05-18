import React, { useState, useEffect } from 'react';
import { getAtenciones } from '../../../services/secretariaService';
import styles from './AtencionesTab.module.css';

const fmtFecha = (iso) =>
  new Date(iso).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });

const fmtHora = (iso) =>
  new Date(iso).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });

const PREVISION_LABEL = { fonasa: 'FONASA', isapre: 'ISAPRE', particular: 'Particular' };

/* ── Modal detalle de atención ── */
const DetalleAtencionModal = ({ atencion: a, onClose }) => {
  const fecha = a.cita?.fecha_hora ?? a.createdAt;

  const Campo = ({ label, valor }) => valor ? (
    <div className={styles.detCampo}>
      <div className={styles.detLabel}>{label}</div>
      <div className={styles.detValor}>{valor}</div>
    </div>
  ) : null;

  const tieneSignos = a.presion_sistolica || a.frecuencia_cardiaca ||
    a.temperatura || a.peso || a.saturacion_oxigeno;

  return (
    <div className={styles.backdrop} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={styles.modalDet}>

        <div className={styles.modalHeader}>
          <div className={styles.modalHeaderInfo}>
            <div className={styles.modalTitulo}>Detalle de atención</div>
            <div className={styles.modalSubtitulo}>
              {fmtFecha(fecha)} · {a.paciente?.nombre} {a.paciente?.apellido}
              {' · '}Dr. {a.medico?.nombre} {a.medico?.apellido}
            </div>
          </div>
          <button className={styles.modalClose} onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className={styles.modalBody}>
          <Campo label="Motivo de consulta"  valor={a.motivo_consulta} />
          <Campo label="Diagnóstico"         valor={a.cie10 ? `${a.diagnostico} (${a.cie10})` : a.diagnostico} />
          <Campo label="Plan de tratamiento" valor={a.plan_tratamiento} />
          <Campo label="Indicaciones"        valor={a.indicaciones} />
          <Campo label="Anamnesis"           valor={a.anamnesis} />
          <Campo label="Examen físico"       valor={a.examen_fisico} />

          {tieneSignos && (
            <div className={styles.signosGrid}>
              {a.presion_sistolica && (
                <div className={styles.signo}>
                  <div className={styles.signoVal}>{a.presion_sistolica}/{a.presion_diastolica}</div>
                  <div className={styles.signoLabel}>Presión (mmHg)</div>
                </div>
              )}
              {a.frecuencia_cardiaca && (
                <div className={styles.signo}>
                  <div className={styles.signoVal}>{a.frecuencia_cardiaca}</div>
                  <div className={styles.signoLabel}>FC (lpm)</div>
                </div>
              )}
              {a.temperatura && (
                <div className={styles.signo}>
                  <div className={styles.signoVal}>{a.temperatura}°C</div>
                  <div className={styles.signoLabel}>Temperatura</div>
                </div>
              )}
              {a.peso && (
                <div className={styles.signo}>
                  <div className={styles.signoVal}>{a.peso} kg</div>
                  <div className={styles.signoLabel}>Peso</div>
                </div>
              )}
              {a.saturacion_oxigeno && (
                <div className={styles.signo}>
                  <div className={styles.signoVal}>{a.saturacion_oxigeno}%</div>
                  <div className={styles.signoLabel}>SpO₂</div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.btnCerrar} onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
};

/* ── Tab principal ── */
const AtencionesTab = () => {
  const [atenciones, setAtenciones] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [busqueda, setBusqueda]     = useState('');
  const [verAtencion, setVerAtencion] = useState(null);

  useEffect(() => {
    getAtenciones()
      .then(data => setAtenciones(data))
      .catch(() => setError('No se pudieron cargar las atenciones'))
      .finally(() => setLoading(false));
  }, []);

  const filtradas = atenciones.filter(a => {
    if (!busqueda.trim()) return true;
    const q = busqueda.toLowerCase();
    return (
      a.paciente?.nombre?.toLowerCase().includes(q)    ||
      a.paciente?.apellido?.toLowerCase().includes(q)  ||
      a.paciente?.rut?.toLowerCase().includes(q)       ||
      a.medico?.nombre?.toLowerCase().includes(q)      ||
      a.medico?.apellido?.toLowerCase().includes(q)    ||
      a.diagnostico?.toLowerCase().includes(q)
    );
  });

  return (
    <div className={styles.wrapper}>

      {verAtencion && (
        <DetalleAtencionModal atencion={verAtencion} onClose={() => setVerAtencion(null)} />
      )}

      <div className={styles.pageTitle}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1a56db" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
        </svg>
        <div>
          <h2 className={styles.title}>Atenciones</h2>
          <p className={styles.subtitle}>Registro de atenciones médicas — más recientes primero</p>
        </div>
        {!loading && !error && (
          <span className={styles.contador}>{atenciones.length} atención{atenciones.length !== 1 ? 'es' : ''}</span>
        )}
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input className={styles.searchInput}
            placeholder="Buscar por paciente, médico o diagnóstico…"
            value={busqueda} onChange={e => setBusqueda(e.target.value)} />
        </div>
      </div>

      <div className={styles.tabla}>
        <div className={styles.tablaHead}>
          <span>Fecha</span>
          <span>Paciente</span>
          <span>Médico</span>
          <span>Diagnóstico</span>
          <span>Acción</span>
        </div>

        {loading ? (
          <div className={styles.emptyState}>
            <p style={{ color: '#94a3b8' }}>Cargando atenciones…</p>
          </div>
        ) : error ? (
          <div className={styles.emptyState}>
            <p style={{ color: '#dc2626' }}>{error}</p>
          </div>
        ) : filtradas.length === 0 ? (
          <div className={styles.emptyState}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            <p>{busqueda ? 'Sin resultados para la búsqueda' : 'No hay atenciones registradas'}</p>
          </div>
        ) : (
          <div className={styles.tablaBody}>
            {filtradas.map(a => {
              const fecha = a.cita?.fecha_hora ?? a.createdAt;
              return (
                <div key={a.id} className={styles.tablaRow}>
                  <div>
                    <div className={styles.fecha}>{fmtFecha(fecha)}</div>
                    <div className={styles.hora}>{fmtHora(fecha)}</div>
                  </div>
                  <div>
                    <div className={styles.paciente}>{a.paciente?.apellido}, {a.paciente?.nombre}</div>
                    <div className={styles.prev}>{PREVISION_LABEL[a.paciente?.prevision_salud] ?? a.paciente?.prevision_salud}</div>
                  </div>
                  <div>
                    <div className={styles.medico}>Dr. {a.medico?.nombre} {a.medico?.apellido}</div>
                    <div className={styles.esp}>{a.medico?.perfil?.especialidad?.nombre ?? '—'}</div>
                  </div>
                  <div className={styles.diagnostico} title={a.diagnostico}>
                    {a.diagnostico}
                    {a.cie10 && <span className={styles.cie}> ({a.cie10})</span>}
                  </div>
                  <div>
                    <button className={styles.btnVer} onClick={() => setVerAtencion(a)}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                      Ver
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AtencionesTab;
