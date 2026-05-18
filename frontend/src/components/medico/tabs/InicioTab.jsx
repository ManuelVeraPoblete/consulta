import React, { useState, useEffect } from 'react';
import { getMedicoDashboard } from '../../../services/medicoService';
import styles from './InicioTab.module.css';

const fmtHora = (iso) =>
  new Date(iso).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });

const ESTADO_STYLE = {
  programada:  { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
  confirmada:  { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
  completada:  { bg: '#f5f3ff', color: '#7c3aed', border: '#ddd6fe' },
  cancelada:   { bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' },
};

const InicioTab = () => {
  const [data, setData]   = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getMedicoDashboard()
      .then(setData)
      .catch(() => setError('No se pudieron cargar las estadísticas'));
  }, []);

  const stats = [
    {
      label: 'Atenciones hoy',
      value: data ? data.atencionesHoy : '…',
      color: '#1d4ed8', bg: '#eff6ff',
    },
    {
      label: 'Próximo paciente',
      value: data ? (data.proximoPaciente ?? '—') : '…',
      color: '#0891b2', bg: '#ecfeff',
      small: true,
    },
    {
      label: 'Recetas emitidas',
      value: data ? data.recetasEmitidas : '…',
      color: '#16a34a', bg: '#f0fdf4',
    },
    {
      label: 'Órdenes de examen',
      value: data ? data.ordenesExamen : '…',
      color: '#7c3aed', bg: '#faf5ff',
    },
  ];

  const agendaHoy   = data?.agendaHoy   ?? [];
  const enAtencion  = data?.enAtencion  ?? null;

  return (
    <div className={styles.wrapper}>
      {error && <p style={{ color: '#dc2626', fontSize: 13 }}>{error}</p>}

      {/* Stats */}
      <div className={styles.statsRow}>
        {stats.map(s => (
          <div key={s.label} className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: s.bg }} />
            <div className={styles.statBody}>
              <div className={styles.statLabel}>{s.label}</div>
              <div
                className={styles.statVal}
                style={{ color: s.color, fontSize: s.small ? 15 : undefined }}
              >
                {s.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.mainGrid}>

        {/* Agenda del día */}
        <div className={styles.colLeft}>
          <div className={styles.card}>
            <div className={styles.cardHead}>
              <div className={styles.cardTitle}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8"  y1="2" x2="8"  y2="6"/>
                  <line x1="3"  y1="10" x2="21" y2="10"/>
                </svg>
                Agenda del día
              </div>
              <span className={styles.cardDate}>
                {new Date().toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>

            {agendaHoy.length === 0 ? (
              <div className={styles.emptyState}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#e2e8f0" strokeWidth="1.5">
                  <rect x="3" y="4" width="18" height="18" rx="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8"  y1="2" x2="8"  y2="6"/>
                  <line x1="3"  y1="10" x2="21" y2="10"/>
                </svg>
                <p>No hay citas agendadas para hoy</p>
              </div>
            ) : (
              <table className={styles.agTable}>
                <thead>
                  <tr>
                    <th>Hora</th>
                    <th>Paciente</th>
                    <th>Motivo</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {agendaHoy.map(c => {
                    const esActual = enAtencion?.id === c.id;
                    const estilo   = ESTADO_STYLE[c.estado] ?? ESTADO_STYLE.programada;
                    return (
                      <tr key={c.id} className={esActual ? styles.agRowActivo : ''}>
                        <td>
                          <span className={esActual ? styles.horaActiva : styles.hora}>
                            {fmtHora(c.fecha_hora)}
                          </span>
                        </td>
                        <td>
                          <div className={styles.pacienteCell}>
                            <div className={styles.pacienteAvatar}>
                              {c.paciente?.nombre?.[0]}{c.paciente?.apellido?.[0]}
                            </div>
                            <span className={styles.pacienteNombre}>
                              {c.paciente?.nombre} {c.paciente?.apellido}
                            </span>
                          </div>
                        </td>
                        <td className={styles.motivo}>{c.motivo || '—'}</td>
                        <td>
                          <span
                            className={styles.estadoBadge}
                            style={{ background: estilo.bg, color: estilo.color, borderColor: estilo.border }}
                          >
                            {c.estado}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Paciente en atención */}
        <div className={styles.colCenter}>
          <div className={styles.card}>
            <div className={styles.cardTitle} style={{ marginBottom: 14 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              Paciente en atención
            </div>

            {enAtencion ? (
              <div>
                <div className={styles.fichaTop}>
                  <div className={styles.fichaAvatar}>
                    {enAtencion.paciente?.nombre?.[0]}{enAtencion.paciente?.apellido?.[0]}
                  </div>
                  <div className={styles.fichaInfo}>
                    <div className={styles.fichaNombre}>
                      {enAtencion.paciente?.nombre} {enAtencion.paciente?.apellido}
                      <span className={styles.fichaActualBadge}>En atención</span>
                    </div>
                    {enAtencion.paciente?.rut && (
                      <div className={styles.fichaMeta}>RUT {enAtencion.paciente.rut}</div>
                    )}
                    <div className={styles.fichaMeta}>
                      {fmtHora(enAtencion.fecha_hora)} · {enAtencion.motivo || 'Sin motivo'}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className={styles.emptyState}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#e2e8f0" strokeWidth="1.5">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                <p>Ningún paciente en atención activa</p>
              </div>
            )}
          </div>
        </div>

        {/* Accesos rápidos */}
        <div className={styles.colRight}>
          <div className={styles.card}>
            <div className={styles.cardTitle} style={{ marginBottom: 12 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0891b2" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              Receta médica
            </div>
            <div className={styles.emptyState}>
              <p>Seleccione un paciente para emitir receta</p>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardTitle} style={{ marginBottom: 12 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2">
                <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/>
              </svg>
              Órdenes de examen
            </div>
            <div className={styles.emptyState}>
              <p>Seleccione un paciente para generar una orden</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default InicioTab;
