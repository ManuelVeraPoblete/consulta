import React, { useState, useEffect } from 'react';
import api from '../../services/authService';
import styles from './MedicoAgenda.module.css';

const DIAS_CORTO  = ['dom','lun','mar','mié','jue','vie','sáb'];
const MESES_CORTO = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];

function getNextBusinessDays(n) {
  const days = [];
  const cursor = new Date();
  cursor.setDate(cursor.getDate() + 1);
  while (days.length < n) {
    if (cursor.getDay() !== 0 && cursor.getDay() !== 6) {
      days.push(new Date(cursor));
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

function toDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const formatPrecio = (v) =>
  v ? new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(v) : null;

const MODALIDAD_INFO = {
  fonasa:     { label: 'FONASA',     color: '#0d9488', bg: '#f0fdfa', nota: 'Bono se compra en consulta el día de atención' },
  isapre:     { label: 'ISAPRE',     color: '#1a56db', bg: '#eff6ff', nota: 'Bono se compra en consulta el día de atención' },
  particular: { label: 'PARTICULAR', color: '#7c3aed', bg: '#faf5ff', nota: null },
};

const MedicoAgenda = ({ medico, onClose }) => {
  // medico.usuario_id = User.id (medico_id en Cita, AgendaBloqueo)
  const medicoId = medico.usuario_id;
  const { usuario, acepta_fonasa, acepta_isapre, acepta_particular, valor_particular } = medico;

  const [dias,         setDias]        = useState([]);
  const [diaActivo,    setDiaActivo]   = useState(null);
  const [slots,        setSlots]       = useState([]);
  const [loadingDias,  setLoadingDias] = useState(true);
  const [loadingSlots, setLoadingSlots]= useState(false);
  const [slotSel,      setSlotSel]     = useState(null);
  const [motivo,       setMotivo]      = useState('');
  const [booking,      setBooking]     = useState(false);
  const [booked,       setBooked]      = useState(null);
  const [error,        setError]       = useState(null);

  // Calcular próximos 10 días hábiles y cargar disponibilidad
  useEffect(() => {
    const businessDays = getNextBusinessDays(10);
    setDias(businessDays.map((d) => ({ date: d, fechaStr: toDateStr(d), disponible: null })));
    setLoadingDias(true);

    Promise.all(
      businessDays.map((d) =>
        api.get(`/medicos/agenda/disponibilidad?medicoId=${medicoId}&fecha=${toDateStr(d)}`)
          .then((res) => ({ fechaStr: toDateStr(d), disponible: res.data.disponible }))
          .catch(() => ({ fechaStr: toDateStr(d), disponible: false }))
      )
    ).then((results) => {
      setDias((prev) =>
        prev.map((d) => {
          const r = results.find((r) => r.fechaStr === d.fechaStr);
          return r ? { ...d, disponible: r.disponible } : d;
        })
      );
      setLoadingDias(false);
    });
  }, [medicoId]);

  const selectDia = async (dia) => {
    if (!dia.disponible) return;
    setDiaActivo(dia);
    setSlotSel(null);
    setSlots([]);
    setError(null);
    setBooked(null);
    setLoadingSlots(true);
    try {
      const { data } = await api.get(`/medicos/slots?medicoId=${medicoId}&fecha=${dia.fechaStr}`);
      setSlots(data.slots || []);
    } catch {
      setError('No se pudo cargar los horarios. Intenta de nuevo.');
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleAgendar = async () => {
    if (!slotSel || !diaActivo || booking) return;
    setBooking(true);
    setError(null);
    const fechaHora = `${diaActivo.fechaStr}T${slotSel}:00`;
    try {
      await api.post('/citas/solicitud', {
        medico_id: medicoId,
        fecha_hora: fechaHora,
        motivo: motivo.trim() || null,
      });
      setBooked({ fecha: diaActivo.fechaStr, hora: slotSel });
      setSlotSel(null);
      setMotivo('');
    } catch (err) {
      setError(err.response?.data?.message || 'Error al solicitar la cita. Intenta de nuevo.');
    } finally {
      setBooking(false);
    }
  };

  const modalidades = [
    acepta_fonasa     && 'fonasa',
    acepta_isapre     && 'isapre',
    acepta_particular && 'particular',
  ].filter(Boolean);

  return (
    <div className={styles.panel}>
      {/* Cabecera */}
      <div className={styles.panelHeader}>
        <div className={styles.medicInfo}>
          <div className={styles.avatar}>{usuario.nombre[0]}{usuario.apellido[0]}</div>
          <div>
            <div className={styles.medicName}>Dr. {usuario.nombre} {usuario.apellido}</div>
            <div className={styles.medicSpec}>{medico.especialidad?.nombre || medico.especialidad || ''}</div>
          </div>
        </div>
        <button className={styles.closeBtn} onClick={onClose}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      {/* Modalidades */}
      {modalidades.length > 0 && (
        <div className={styles.modalidades}>
          {modalidades.map((m) => {
            const info = MODALIDAD_INFO[m];
            return (
              <div key={m} className={styles.modalidadRow} style={{ background: info.bg }}>
                <span className={styles.modalidadLabel} style={{ color: info.color }}>{info.label}</span>
                <span className={styles.modalidadNota}>
                  {m === 'particular' ? `${formatPrecio(valor_particular)} por consulta` : info.nota}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <div className={styles.agendaTitle}>Selecciona un día</div>

      {/* Selector de día */}
      {loadingDias ? (
        <div className={styles.loadingArea}>Cargando disponibilidad…</div>
      ) : (
        <div className={styles.dias}>
          {dias.map((d) => {
            const dow = DIAS_CORTO[d.date.getDay()];
            const num = d.date.getDate();
            const mon = MESES_CORTO[d.date.getMonth()];
            const isActive = diaActivo?.fechaStr === d.fechaStr;
            return (
              <button
                key={d.fechaStr}
                disabled={!d.disponible}
                onClick={() => selectDia(d)}
                className={`${styles.diaBtn} ${isActive ? styles.diaActivo : ''} ${d.disponible === false ? styles.diaNoDisponible : ''}`}
              >
                <div className={styles.diaLabel}>
                  <span className={styles.diaDow}>{dow}</span>
                  <span className={styles.diaNum}>{num}</span>
                  <span className={styles.diaMon}>{mon}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Slots */}
      {diaActivo && (
        <>
          <div className={styles.agendaTitle}>Horarios disponibles</div>
          {loadingSlots ? (
            <div className={styles.loadingArea}>Cargando horarios…</div>
          ) : slots.length === 0 ? (
            <div className={styles.loadingArea}>No hay horarios disponibles este día.</div>
          ) : (
            <div className={styles.slots}>
              {slots.map(({ hora, libre }) => (
                <button
                  key={hora}
                  disabled={!libre}
                  onClick={() => setSlotSel(hora)}
                  className={`${styles.slot} ${!libre ? styles.slotOcupado : ''} ${slotSel === hora ? styles.slotSel : ''}`}
                >
                  {hora}
                  {!libre && <span className={styles.slotDot} />}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* Motivo (opcional) */}
      {slotSel && !booked && (
        <input
          className={styles.motivoInput}
          type="text"
          placeholder="Motivo de la consulta (opcional)"
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          maxLength={200}
        />
      )}

      {/* Error */}
      {error && (
        <div className={styles.errorMsg}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><circle cx="12" cy="16" r="1" fill="currentColor"/>
          </svg>
          {error}
        </div>
      )}

      {/* Confirmación o botón */}
      {booked ? (
        <div className={styles.confirmado}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2.5">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          Solicitud enviada para el {booked.fecha} a las {booked.hora}. La secretaría confirmará tu hora.
        </div>
      ) : diaActivo ? (
        <button
          className={styles.agendarBtn}
          disabled={!slotSel || booking}
          onClick={handleAgendar}
        >
          {booking ? 'Enviando solicitud…' : slotSel ? `Solicitar las ${slotSel}` : 'Selecciona un horario'}
        </button>
      ) : null}
    </div>
  );
};

export default MedicoAgenda;
