import React, { useState, useEffect, useCallback } from 'react';
import { getMisCitas } from '../../../services/medicoService';
import AtenderModal from '../AtenderModal';
import styles from './AgendaTab.module.css';

const DIAS  = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

const ESTADO_STYLE = {
  programada: { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
  confirmada: { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
  completada: { bg: '#f5f3ff', color: '#7c3aed', border: '#ddd6fe' },
  cancelada:  { bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' },
};

const fmtHora = (iso) =>
  new Date(iso).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });

const toISODate = (y, m, d) =>
  `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

const AgendaTab = () => {
  const today = new Date();
  const [year,   setYear]   = useState(today.getFullYear());
  const [month,  setMonth]  = useState(today.getMonth());
  const [selDay, setSelDay] = useState(today.getDate());
  const [citas,   setCitas]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [atendiendo, setAtendiendo] = useState(null);

  const cargarCitas = useCallback(async () => {
    setLoading(true);
    try {
      const fecha = toISODate(year, month, selDay);
      const data  = await getMisCitas(fecha);
      setCitas(data);
    } catch {
      setCitas([]);
    } finally {
      setLoading(false);
    }
  }, [year, month, selDay]);

  useEffect(() => { cargarCitas(); }, [cargarCitas]);

  const firstDay  = new Date(year, month, 1).getDay();
  const daysInMon = new Date(year, month + 1, 0).getDate();
  const blanks    = Array((firstDay === 0 ? 6 : firstDay - 1)).fill(null);
  const days      = Array.from({ length: daysInMon }, (_, i) => i + 1);

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
    setSelDay(1);
  };
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
    setSelDay(1);
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.grid}>

        {/* Calendario */}
        <div className={styles.calCard}>
          <div className={styles.calNav}>
            <button className={styles.calBtn} onClick={prevMonth}>‹</button>
            <span className={styles.calTitle}>{MESES[month]} {year}</span>
            <button className={styles.calBtn} onClick={nextMonth}>›</button>
          </div>
          <div className={styles.calGrid}>
            {DIAS.map(d => <div key={d} className={styles.calDow}>{d}</div>)}
            {blanks.map((_, i) => <div key={'b' + i} />)}
            {days.map(d => (
              <button key={d} onClick={() => setSelDay(d)}
                className={[
                  styles.calDay,
                  d === selDay ? styles.calSelected : '',
                  d === today.getDate() && month === today.getMonth() && year === today.getFullYear()
                    ? styles.calToday : '',
                ].join(' ')}>
                {d}
              </button>
            ))}
          </div>
          <div className={styles.selFecha}>
            {selDay} de {MESES[month]} de {year}
          </div>
        </div>

        {/* Lista de citas */}
        <div className={styles.listCard}>
          <div className={styles.listHead}>
            <div className={styles.listTitle}>
              Citas del día
              {!loading && citas.length > 0 && (
                <span className={styles.citasCount}>{citas.length}</span>
              )}
            </div>
          </div>

          {/* Renderizar modal antes de la lista */}
          {atendiendo && (
            <AtenderModal
              cita={atendiendo}
              onClose={() => setAtendiendo(null)}
              onAtendida={() => { setAtendiendo(null); cargarCitas(); }}
            />
          )}

          {loading ? (
            <div className={styles.emptyState}>
              <div className={styles.spinner} />
              <span>Cargando citas…</span>
            </div>
          ) : citas.length === 0 ? (
            <div className={styles.emptyState}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#e2e8f0" strokeWidth="1.5">
                <rect x="3" y="4" width="18" height="18" rx="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8"  y1="2" x2="8"  y2="6"/>
                <line x1="3"  y1="10" x2="21" y2="10"/>
              </svg>
              <p>No hay citas para este día</p>
            </div>
          ) : (
            <div className={styles.citasList}>
              {citas.map(c => {
                const estilo = ESTADO_STYLE[c.estado] ?? ESTADO_STYLE.programada;
                return (
                  <div key={c.id} className={styles.citaRow}>
                    <span className={styles.citaHora}>{fmtHora(c.fecha_hora)}</span>
                    <div className={styles.citaAvatar}>
                      {c.paciente?.nombre?.[0]}{c.paciente?.apellido?.[0]}
                    </div>
                    <div className={styles.citaInfo}>
                      <div className={styles.citaNombre}>
                        {c.paciente?.nombre} {c.paciente?.apellido}
                      </div>
                      {c.motivo && (
                        <div className={styles.citaMotivo}>{c.motivo}</div>
                      )}
                    </div>
                    <span
                      className={styles.citaBadge}
                      style={{ background: estilo.bg, color: estilo.color, borderColor: estilo.border }}
                    >
                      {c.estado}
                    </span>
                    {c.estado !== 'completada' && c.estado !== 'cancelada' && (
                      <button
                        className={styles.btnAtender}
                        onClick={() => setAtendiendo(c)}
                      >
                        Atender
                      </button>
                    )}
                    {c.estado === 'completada' && (
                      <span className={styles.atendidaTag}>✓ Atendida</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default AgendaTab;
