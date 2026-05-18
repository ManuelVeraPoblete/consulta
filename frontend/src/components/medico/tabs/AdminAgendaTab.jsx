import React, { useState, useEffect, useCallback } from 'react';
import { getEstadoAgenda, crearRegistroAgenda, eliminarRegistroAgenda } from '../../../services/medicoService';
import styles from './AdminAgendaTab.module.css';

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DIAS_CORTO = ['Lu','Ma','Mi','Ju','Vi','Sa','Do'];

const fmtFecha = (iso) => {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
};

// Retorna el lunes de la semana a la que pertenece el día d
const lunesDeSemana = (year, month, day) => {
  const date = new Date(year, month - 1, day);
  const dow = date.getDay(); // 0=dom
  const diff = dow === 0 ? -6 : 1 - dow;
  const lunes = new Date(date);
  lunes.setDate(date.getDate() + diff);
  return lunes;
};

const isoDate = (d) => d.toISOString().split('T')[0];

const AdminAgendaTab = () => {
  const today = new Date();
  const [year,  setYear]  = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);

  const [estadoMes, setEstadoMes] = useState(null); // { dias: {fecha: estado}, registros: [] }
  const [loading,   setLoading]   = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState('');

  const [modoAccion, setModoAccion] = useState('liberar'); // 'bloquear' | 'liberar'
  const [granularidad, setGranularidad] = useState('dia'); // 'dia' | 'semana' | 'mes'
  const [motivo, setMotivo] = useState('');
  const [selDia, setSelDia] = useState(null);

  const cargarEstado = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getEstadoAgenda(year, month);
      setEstadoMes(data);
    } catch {
      setError('Error al cargar el estado de la agenda');
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => { cargarEstado(); }, [cargarEstado]);

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
    setSelDia(null);
  };
  const nextMonth = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
    setSelDia(null);
  };

  const aplicarAccion = async () => {
    if (!selDia) return;
    setSaving(true);
    setError('');
    try {
      let fechaInicio, fechaFin;

      if (granularidad === 'dia') {
        fechaInicio = fechaFin = isoDate(new Date(year, month - 1, selDia));
      } else if (granularidad === 'semana') {
        const lunes = lunesDeSemana(year, month, selDia);
        fechaInicio = isoDate(lunes);
        const domingo = new Date(lunes);
        domingo.setDate(lunes.getDate() + 6);
        fechaFin = isoDate(domingo);
      } else {
        fechaInicio = `${year}-${String(month).padStart(2, '0')}-01`;
        const ultimo = new Date(year, month, 0);
        fechaFin = isoDate(ultimo);
      }

      await crearRegistroAgenda({
        fecha_inicio: fechaInicio,
        fecha_fin:    fechaFin,
        tipo:         modoAccion === 'bloquear' ? 'bloqueo' : 'liberacion',
        motivo:       motivo || null,
      });

      setMotivo('');
      setSelDia(null);
      await cargarEstado();
    } catch {
      setError('Error al aplicar la acción');
    } finally {
      setSaving(false);
    }
  };

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar este registro?')) return;
    try {
      await eliminarRegistroAgenda(id);
      await cargarEstado();
    } catch {
      setError('Error al eliminar el registro');
    }
  };

  // Construcción del calendario
  const diasEnMes = new Date(year, month, 0).getDate();
  const primerDow = new Date(year, month - 1, 1).getDay(); // 0=dom
  const blancos   = Array(primerDow === 0 ? 6 : primerDow - 1).fill(null);
  const dias      = Array.from({ length: diasEnMes }, (_, i) => i + 1);

  const estadoDia = (d) => {
    if (!estadoMes) return 'disponible';
    const key = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    return estadoMes.dias[key] ?? 'disponible';
  };

  // Semana del día seleccionado (para highlight)
  const semanaSelDia = selDia ? (() => {
    const lunes = lunesDeSemana(year, month, selDia);
    const ids = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(lunes);
      d.setDate(lunes.getDate() + i);
      if (d.getMonth() + 1 === month && d.getFullYear() === year) ids.push(d.getDate());
    }
    return ids;
  })() : [];

  const clasesDia = (d) => {
    const estado = estadoDia(d);
    const isHoy  = d === today.getDate() && month === today.getMonth() + 1 && year === today.getFullYear();
    const isSel  = d === selDia;
    const inSemana = granularidad === 'semana' && semanaSelDia.includes(d);
    const inMes    = granularidad === 'mes' && selDia !== null;

    return [
      styles.calDay,
      estado === 'bloqueado' ? styles.dayBloqueado : styles.dayDisponible,
      isHoy   ? styles.dayHoy : '',
      isSel   ? styles.daySelected : '',
      (inSemana || inMes) && !isSel ? styles.dayRango : '',
    ].filter(Boolean).join(' ');
  };

  const resumenAccion = () => {
    if (!selDia) return null;
    const accion = modoAccion === 'bloquear' ? 'Bloquear' : 'Liberar';
    if (granularidad === 'dia')    return `${accion} el ${selDia} de ${MESES[month - 1]} ${year}`;
    if (granularidad === 'semana') {
      const lunes   = lunesDeSemana(year, month, selDia);
      const domingo = new Date(lunes); domingo.setDate(lunes.getDate() + 6);
      return `${accion} semana del ${fmtFecha(isoDate(lunes))} al ${fmtFecha(isoDate(domingo))}`;
    }
    return `${accion} todo ${MESES[month - 1]} ${year}`;
  };

  return (
    <div className={styles.wrapper}>
      {/* Panel izquierdo: controles + calendario */}
      <div className={styles.left}>

        {/* Controles de acción */}
        <div className={styles.card}>
          <div className={styles.cardTitle}>Acción</div>

          <div className={styles.toggleRow}>
            <button
              className={`${styles.toggleBtn} ${modoAccion === 'liberar' ? styles.toggleActive : ''}`}
              onClick={() => setModoAccion('liberar')}
            >
              <span className={styles.dotVerde} /> Liberar
            </button>
            <button
              className={`${styles.toggleBtn} ${modoAccion === 'bloquear' ? styles.toggleActiveRed : ''}`}
              onClick={() => setModoAccion('bloquear')}
            >
              <span className={styles.dotRojo} /> Bloquear
            </button>
          </div>

          <div className={styles.granRow}>
            {['dia', 'semana', 'mes'].map(g => (
              <button
                key={g}
                className={`${styles.granBtn} ${granularidad === g ? styles.granActive : ''}`}
                onClick={() => setGranularidad(g)}
              >
                {g === 'dia' ? 'Día' : g === 'semana' ? 'Semana' : 'Mes'}
              </button>
            ))}
          </div>

          <input
            className={styles.motivoInput}
            placeholder="Motivo (opcional)"
            value={motivo}
            onChange={e => setMotivo(e.target.value)}
          />

          {selDia && (
            <div className={styles.resumenBox}>
              <span className={styles.resumenText}>{resumenAccion()}</span>
            </div>
          )}

          <button
            className={`${styles.btnAplicar} ${modoAccion === 'bloquear' ? styles.btnAplicarRed : ''}`}
            onClick={aplicarAccion}
            disabled={!selDia || saving}
          >
            {saving ? 'Aplicando…' : `Aplicar ${modoAccion === 'bloquear' ? 'bloqueo' : 'liberación'}`}
          </button>

          {error && <div className={styles.errorMsg}>{error}</div>}
        </div>

        {/* Calendario */}
        <div className={styles.card}>
          <div className={styles.calNav}>
            <button className={styles.calBtn} onClick={prevMonth}>‹</button>
            <span className={styles.calTitle}>{MESES[month - 1]} {year}</span>
            <button className={styles.calBtn} onClick={nextMonth}>›</button>
          </div>

          {loading ? (
            <div className={styles.loadingBox}><div className={styles.spinner} /></div>
          ) : (
            <div className={styles.calGrid}>
              {DIAS_CORTO.map(d => <div key={d} className={styles.calDow}>{d}</div>)}
              {blancos.map((_, i) => <div key={'b' + i} />)}
              {dias.map(d => (
                <button key={d} className={clasesDia(d)} onClick={() => setSelDia(d === selDia ? null : d)}>
                  {d}
                </button>
              ))}
            </div>
          )}

          {/* Leyenda */}
          <div className={styles.legend}>
            <span className={styles.legItem}><span className={styles.legDot} style={{ background: '#dcfce7', border: '1px solid #86efac' }} />Disponible</span>
            <span className={styles.legItem}><span className={styles.legDot} style={{ background: '#fee2e2', border: '1px solid #fca5a5' }} />Bloqueado</span>
          </div>
        </div>
      </div>

      {/* Panel derecho: registros */}
      <div className={styles.right}>
        <div className={styles.card}>
          <div className={styles.cardTitle}>Registros de agenda</div>

          {!estadoMes || estadoMes.registros.length === 0 ? (
            <div className={styles.emptyReg}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#e2e8f0" strokeWidth="1.5">
                <rect x="3" y="4" width="18" height="18" rx="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8"  y1="2" x2="8"  y2="6"/>
                <line x1="3"  y1="10" x2="21" y2="10"/>
              </svg>
              <p>Sin registros para este mes</p>
              <small>El mes siguiente está bloqueado por defecto.<br/>Usa el calendario para liberar días.</small>
            </div>
          ) : (
            <div className={styles.regList}>
              {estadoMes.registros.map(r => (
                <div key={r.id} className={`${styles.regRow} ${r.tipo === 'bloqueo' ? styles.regBloqueo : styles.regLiberacion}`}>
                  <div className={styles.regIcon}>
                    {r.tipo === 'bloqueo'
                      ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                      : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>
                    }
                  </div>
                  <div className={styles.regInfo}>
                    <div className={styles.regTipo}>{r.tipo === 'bloqueo' ? 'Bloqueo' : 'Liberación'}</div>
                    <div className={styles.regFechas}>{fmtFecha(r.fecha_inicio)} — {fmtFecha(r.fecha_fin)}</div>
                    {r.motivo && <div className={styles.regMotivo}>{r.motivo}</div>}
                  </div>
                  <button className={styles.btnElim} onClick={() => eliminar(r.id)} title="Eliminar">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info de reglas */}
        <div className={`${styles.card} ${styles.infoCard}`}>
          <div className={styles.cardTitle}>Reglas de la agenda</div>
          <ul className={styles.rulesList}>
            <li>El mes actual y anteriores están <strong>disponibles</strong> por defecto.</li>
            <li>El mes siguiente en adelante está <strong>bloqueado</strong> por defecto.</li>
            <li>Debes <strong>liberar</strong> explícitamente los períodos para que la secretaria pueda agendar citas.</li>
            <li>Puedes <strong>bloquear</strong> días puntuales dentro de períodos ya liberados.</li>
            <li>Los bloqueos tienen prioridad sobre las liberaciones en caso de conflicto.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdminAgendaTab;
