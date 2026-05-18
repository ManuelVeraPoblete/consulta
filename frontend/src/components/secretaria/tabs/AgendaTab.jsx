import React, { useState, useEffect, useCallback } from 'react';
import { getMisMedicos } from '../../../services/secretariaService';
import { listarCitas } from '../../../services/citaService';
import { verificarDisponibilidadAgenda } from '../../../services/medicoService';
import NuevaCitaModal from '../NuevaCitaModal';
import CitaDetalleModal from '../CitaDetalleModal';
import styles from './AgendaTab.module.css';

const DIAS  = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const HORAS = Array.from({ length: 13 }, (_, i) => i + 8); // 8..20

const COLORS = [
  { bg: '#eff6ff', border: '#1a56db', dot: '#1a56db', text: '#1d4ed8', citaBg: '#dbeafe' },
  { bg: '#f5f3ff', border: '#7c3aed', dot: '#7c3aed', text: '#6d28d9', citaBg: '#ede9fe' },
  { bg: '#f0fdf4', border: '#15803d', dot: '#15803d', text: '#166534', citaBg: '#dcfce7' },
  { bg: '#fff7ed', border: '#b45309', dot: '#b45309', text: '#92400e', citaBg: '#fef3c7' },
  { bg: '#fdf2f8', border: '#a21caf', dot: '#a21caf', text: '#86198f', citaBg: '#fce7f3' },
];

function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekDays(start) {
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

function dateKey(date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

const AgendaTab = () => {
  const [medicos, setMedicos]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [activoId, setActivoId]   = useState(null);
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [citas, setCitas]         = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalInit, setModalInit] = useState({});
  const [detalleCita, setDetalleCita] = useState(null);
  const [diasBloqueados, setDiasBloqueados] = useState({}); // { 'YYYY-MM-DD': true }

  const cargarMedicos = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMisMedicos();
      setMedicos(data);
      if (data.length > 0) setActivoId(data[0].id);
    } catch { setMedicos([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { cargarMedicos(); }, [cargarMedicos]);

  const cargarCitas = useCallback(async () => {
    if (!activoId) return;
    const inicio = new Date(weekStart);
    const fin    = new Date(weekStart); fin.setDate(fin.getDate() + 4); fin.setHours(23,59,59);
    try {
      const data = await listarCitas({
        medico_id:    activoId,
        fecha_inicio: inicio.toISOString(),
        fecha_fin:    fin.toISOString(),
      });
      setCitas(data);
    } catch { setCitas([]); }
  }, [weekStart, activoId]);

  useEffect(() => { cargarCitas(); }, [cargarCitas]);

  // Verificar disponibilidad de cada día de la semana para el médico activo
  useEffect(() => {
    if (!activoId) return;
    const dias = getWeekDays(weekStart);
    setDiasBloqueados({});
    Promise.all(
      dias.map(d => {
        const fecha = d.toISOString().split('T')[0];
        return verificarDisponibilidadAgenda(activoId, fecha)
          .then(({ disponible }) => [fecha, !disponible])
          .catch(() => [fecha, false]);
      })
    ).then(resultados => {
      const mapa = {};
      resultados.forEach(([f, bloqueado]) => { if (bloqueado) mapa[f] = true; });
      setDiasBloqueados(mapa);
    });
  }, [weekStart, activoId]);

  const weekDays = getWeekDays(weekStart);
  const today    = new Date(); today.setHours(0, 0, 0, 0);

  const prevWeek = () => { const d = new Date(weekStart); d.setDate(d.getDate() - 7); setWeekStart(d); };
  const nextWeek = () => { const d = new Date(weekStart); d.setDate(d.getDate() + 7); setWeekStart(d); };
  const goToday  = () => setWeekStart(getWeekStart(new Date()));

  const d0 = weekDays[0], d4 = weekDays[4];
  const weekLabel = d0.getMonth() === d4.getMonth()
    ? `${d0.getDate()} – ${d4.getDate()} de ${MESES[d0.getMonth()]} ${d4.getFullYear()}`
    : `${d0.getDate()} ${MESES[d0.getMonth()].slice(0,3)} – ${d4.getDate()} ${MESES[d4.getMonth()].slice(0,3)} ${d4.getFullYear()}`;

  /* Mapa de citas por día-hora */
  const citaMap = {};
  citas.forEach(c => {
    const d = new Date(c.fecha_hora);
    const k = `${dateKey(d)}_${d.getHours()}`;
    if (!citaMap[k]) citaMap[k] = [];
    citaMap[k].push(c);
  });

  /* Color de médico */
  const colorPorMedico = {};
  medicos.forEach((m, i) => { colorPorMedico[m.id] = COLORS[i % COLORS.length]; });

  const esDiaBloqueado = (fecha) => !!diasBloqueados[fecha.toISOString().split('T')[0]];

  const abrirModalSlot = (fecha, horaNum) => {
    if (esDiaBloqueado(fecha)) return;
    const horaStr = `${String(horaNum).padStart(2,'0')}:00`;
    setModalInit({ initialFecha: fecha.toISOString().split('T')[0], initialHora: horaStr, initialMedicoId: activoId });
    setShowModal(true);
  };

  const handleModalSuccess = async () => {
    setShowModal(false);
    await cargarCitas();
  };

  const handleCitaActualizada = async (citaActualizada) => {
    setCitas(prev => prev.map(c => c.id === citaActualizada.id ? citaActualizada : c));
    setDetalleCita(citaActualizada);
  };

  return (
    <div className={styles.wrapper}>

      {showModal && (
        <NuevaCitaModal
          medicos={medicos}
          {...modalInit}
          onSuccess={handleModalSuccess}
          onCancel={() => setShowModal(false)}
        />
      )}

      {/* Detalle de cita */}
      {detalleCita && (
        <CitaDetalleModal
          cita={detalleCita}
          accentColor={colorPorMedico[detalleCita.medico_id]?.border}
          onClose={() => setDetalleCita(null)}
          onActualizada={handleCitaActualizada}
        />
      )}

      {/* Tabs de médicos */}
      <div className={styles.medicoTabs}>
        {loading ? (
          <span style={{ fontSize: 13, color: '#94a3b8' }}>Cargando médicos…</span>
        ) : medicos.length === 0 ? (
          <span style={{ fontSize: 13, color: '#94a3b8' }}>No hay médicos asignados</span>
        ) : medicos.map((m, i) => {
          const c = COLORS[i % COLORS.length];
          const on = activoId === m.id;
          return (
            <button key={m.id}
              className={`${styles.medicoTab} ${on ? styles.medicoTabActive : ''}`}
              style={on ? { borderColor: c.border, color: c.text, background: c.bg } : {}}
              onClick={() => setActivoId(m.id)}
            >
              <div className={styles.medicoTabDot} style={{ background: c.dot }} />
              Dr. {m.nombre} {m.apellido}
            </button>
          );
        })}
      </div>

      {/* Navegación semana + botón nueva cita */}
      <div className={styles.weekNav}>
        <button className={styles.weekBtn} onClick={prevWeek}>← Anterior</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className={styles.weekLabel}>{weekLabel}</span>
          <button className={styles.todayBtn} onClick={goToday}>Hoy</button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className={styles.weekBtn} onClick={nextWeek}>Siguiente →</button>
          <button
            className={styles.confirmBtn}
            style={{ flex: 'none', padding: '7px 16px', fontSize: 12, borderRadius: 8 }}
            onClick={() => { setModalInit({ initialMedicoId: activoId }); setShowModal(true); }}
          >
            + Nueva cita
          </button>
        </div>
      </div>

      {/* Calendario */}
      <div className={styles.calWrapper}>
        {/* Cabecera */}
        <div className={styles.calGrid}>
          <div className={styles.timeCol} />
          {weekDays.map((d, i) => {
            const isToday    = d.getTime() === today.getTime();
            const bloqueado  = esDiaBloqueado(d);
            return (
              <div key={i}
                className={`${styles.dayHeader} ${bloqueado ? styles.dayHeaderBloqueado : ''}`}
                style={!bloqueado && isToday ? { background: '#eff6ff' } : {}}
              >
                <div className={styles.dayName}>{DIAS[i]}</div>
                <div className={`${styles.dayNum} ${bloqueado ? styles.dayNumBloqueado : ''}`}
                  style={!bloqueado && isToday ? { color: '#1a56db', fontWeight: 800 } : {}}>
                  {d.getDate()}
                </div>
                {bloqueado && (
                  <div className={styles.bloqueadoBadge}>
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                    Bloqueado
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Filas de horas */}
        <div className={styles.calBody}>
          {HORAS.map(h => (
            <div key={h} className={styles.horaRow}>
              <div className={styles.horaLabel}>{String(h).padStart(2,'0')}:00</div>
              {weekDays.map((d, i) => {
                const isToday   = d.getTime() === today.getTime();
                const bloqueado = esDiaBloqueado(d);
                const slotCitas = citaMap[`${dateKey(d)}_${h}`] ?? [];
                return (
                  <div key={i}
                    className={`${styles.slot} ${bloqueado ? styles.slotBloqueado : ''}`}
                    style={!bloqueado && isToday ? { background: '#fafcff' } : {}}
                    onClick={() => { if (!bloqueado && slotCitas.length === 0) abrirModalSlot(d, h); }}
                  >
                    {slotCitas.map(c => {
                      const col = colorPorMedico[c.medico_id] ?? COLORS[0];
                      const cancelada = c.estado === 'cancelada';
                      return (
                        <div key={c.id} className={styles.citaBlock}
                          style={{
                            background: cancelada ? '#f1f5f9' : col.citaBg,
                            borderLeftColor: cancelada ? '#94a3b8' : col.border,
                            opacity: cancelada ? 0.6 : 1,
                          }}
                          onClick={e => { e.stopPropagation(); setDetalleCita(c); }}
                        >
                          <div className={styles.citaNombre}
                            style={{ color: cancelada ? '#94a3b8' : col.text }}>
                            {c.paciente?.nombre} {c.paciente?.apellido}
                          </div>
                          {c.motivo && (
                            <div className={styles.citaMed} style={{ color: cancelada ? '#94a3b8' : col.text }}>
                              {c.motivo}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Leyenda */}
      {medicos.length > 0 && (
        <div className={styles.leyenda}>
          {medicos.map((m, i) => {
            const c = COLORS[i % COLORS.length];
            return (
              <div key={m.id} className={styles.leyendaItem}>
                <div className={styles.leyendaDot} style={{ background: c.dot }} />
                <span className={styles.leyendaLabel}>Dr. {m.nombre} {m.apellido}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AgendaTab;
