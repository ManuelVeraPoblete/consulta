import React, { useState, useEffect } from 'react';
import { getDashboardStats, getAtencionByCita } from '../../../services/secretariaService';
import styles from './InicioTab.module.css';

const fmt = (fechaHora) => {
  const d = new Date(fechaHora);
  return d.toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' });
};

/* ── Modal resultado de atención ── */
const AtencionModal = ({ citaId, onClose }) => {
  const [atencion, setAtencion] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError]       = useState(null);

  useEffect(() => {
    getAtencionByCita(citaId)
      .then(setAtencion)
      .catch(() => setError('No se pudo cargar la atención.'))
      .finally(() => setCargando(false));
  }, [citaId]);

  const Campo = ({ label, valor }) => valor ? (
    <div className={styles.atencionCampo}>
      <div className={styles.atencionLabel}>{label}</div>
      <div className={styles.atencionValor}>{valor}</div>
    </div>
  ) : null;

  const tieneSignos = atencion && (
    atencion.presion_sistolica || atencion.frecuencia_cardiaca ||
    atencion.temperatura || atencion.peso || atencion.saturacion_oxigeno
  );

  return (
    <div className={styles.modalBackdrop} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={styles.modalAtencion}>

        <div className={styles.modalHeader}>
          <div className={styles.modalHeaderInfo}>
            <div className={styles.modalTitulo}>Resultado de atención</div>
            {atencion && (
              <div className={styles.modalSubtitulo}>
                {atencion.paciente?.nombre} {atencion.paciente?.apellido}
                {' · '}Dr. {atencion.medico?.nombre} {atencion.medico?.apellido}
              </div>
            )}
          </div>
          <button className={styles.modalClose} onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className={styles.modalBody}>
          {cargando && <div className={styles.modalEstado}>Cargando...</div>}
          {error    && <div className={`${styles.modalEstado} ${styles.modalError}`}>{error}</div>}

          {atencion && (
            <>
              <Campo label="Motivo de consulta"    valor={atencion.motivo_consulta} />
              <Campo label="Diagnóstico"           valor={atencion.cie10 ? `${atencion.diagnostico} (${atencion.cie10})` : atencion.diagnostico} />
              <Campo label="Plan de tratamiento"   valor={atencion.plan_tratamiento} />
              <Campo label="Indicaciones"          valor={atencion.indicaciones} />
              <Campo label="Anamnesis"             valor={atencion.anamnesis} />
              <Campo label="Examen físico"         valor={atencion.examen_fisico} />

              {tieneSignos && (
                <div className={styles.signosGrid}>
                  {atencion.presion_sistolica && (
                    <div className={styles.signo}>
                      <div className={styles.signoVal}>{atencion.presion_sistolica}/{atencion.presion_diastolica}</div>
                      <div className={styles.signoLabel}>Presión (mmHg)</div>
                    </div>
                  )}
                  {atencion.frecuencia_cardiaca && (
                    <div className={styles.signo}>
                      <div className={styles.signoVal}>{atencion.frecuencia_cardiaca}</div>
                      <div className={styles.signoLabel}>FC (lpm)</div>
                    </div>
                  )}
                  {atencion.temperatura && (
                    <div className={styles.signo}>
                      <div className={styles.signoVal}>{atencion.temperatura}°C</div>
                      <div className={styles.signoLabel}>Temperatura</div>
                    </div>
                  )}
                  {atencion.peso && (
                    <div className={styles.signo}>
                      <div className={styles.signoVal}>{atencion.peso} kg</div>
                      <div className={styles.signoLabel}>Peso</div>
                    </div>
                  )}
                  {atencion.saturacion_oxigeno && (
                    <div className={styles.signo}>
                      <div className={styles.signoVal}>{atencion.saturacion_oxigeno}%</div>
                      <div className={styles.signoLabel}>SpO₂</div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.btnCerrar} onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
};

const InicioTab = () => {
  const [stats, setStats]             = useState(null);
  const [error, setError]             = useState(null);
  const [verAtencion, setVerAtencion] = useState(null);

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .catch(() => setError('No se pudieron cargar las estadísticas'));
  }, []);

  const cards = [
    { label: 'Citas hoy',             value: stats?.citasHoy             ?? '…', color: '#1a56db', bg: '#eff6ff', border: '#bfdbfe' },
    { label: 'Pacientes nuevos',       value: stats?.pacientesNuevos      ?? '…', color: '#0891b2', bg: '#ecfeff', border: '#a5f3fc' },
    { label: 'Atenciones completadas', value: stats?.atencionesCompletadas ?? '…', color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0' },
    { label: 'Médicos activos',        value: stats?.medicosActivos        ?? '…', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
  ];

  return (
    <div className={styles.wrapper}>
      {verAtencion && (
        <AtencionModal citaId={verAtencion} onClose={() => setVerAtencion(null)} />
      )}
      {error && <p style={{ color: '#dc2626', marginBottom: '1rem' }}>{error}</p>}

      <div className={styles.statsRow}>
        {cards.map(s => (
          <div key={s.label} className={styles.statCard} style={{ background: s.bg, borderColor: s.border }}>
            <div className={styles.statVal} style={{ color: s.color }}>{s.value}</div>
            <div className={styles.statLabel}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className={styles.grid}>
        <div className={styles.colLeft}>
          <div className={styles.card}>
            <div className={styles.cardHead}>
              <div className={styles.cardTitle}>Próximas citas</div>
            </div>
            {stats?.proximasCitas?.length ? (
              <ul className={styles.itemList}>
                {stats.proximasCitas.map(c => (
                  <li key={c.id} className={styles.item}>
                    <span className={styles.itemDate}>{fmt(c.fecha_hora)}</span>
                    <span className={styles.itemName}>
                      {c.paciente?.nombre} {c.paciente?.apellido}
                    </span>
                    <span className={styles.itemSub}>
                      Dr. {c.medico?.nombre} {c.medico?.apellido}
                    </span>
                    <span className={`${styles.badge} ${styles[c.estado]}`}>{c.estado}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className={styles.emptyState}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#e2e8f0" strokeWidth="1.5">
                  <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <p>No hay citas programadas</p>
              </div>
            )}
          </div>
        </div>

        <div className={styles.colRight}>
          <div className={styles.card}>
            <div className={styles.cardHead}>
              <div className={styles.cardTitle}>Últimas atenciones</div>
            </div>
            {stats?.ultimasAtenciones?.length ? (
              <ul className={styles.itemList}>
                {stats.ultimasAtenciones.map(c => (
                  <li key={c.id} className={styles.itemAtencion}>
                    <span className={styles.itemDate}>{fmt(c.fecha_hora)}</span>
                    <span className={styles.itemName}>
                      {c.paciente?.nombre} {c.paciente?.apellido}
                    </span>
                    <span className={styles.itemSub}>
                      Dr. {c.medico?.nombre} {c.medico?.apellido}
                    </span>
                    <span className={`${styles.badge} ${styles.completada}`}>completada</span>
                    <button className={styles.btnVerAtencion} onClick={() => setVerAtencion(c.id)}>
                      Ver
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className={styles.emptyState}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#e2e8f0" strokeWidth="1.5">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                <p>No hay atenciones registradas</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InicioTab;
