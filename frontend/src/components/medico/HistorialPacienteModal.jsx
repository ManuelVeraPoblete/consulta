import React, { useEffect, useState } from 'react';
import { getHistorialPaciente } from '../../services/medicoService';
import styles from './HistorialPacienteModal.module.css';

const fmtFecha = (iso) =>
  new Date(iso).toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' });

const calcEdad = (fechaNac) => {
  if (!fechaNac) return null;
  const hoy = new Date();
  const nac = new Date(fechaNac);
  let edad = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
  return edad;
};

const Seccion = ({ icono, titulo, texto }) => {
  if (!texto?.trim()) return null;
  return (
    <div className={styles.seccion}>
      <div className={styles.seccionHeader}>
        <span className={styles.seccionIcono}>{icono}</span>
        <span className={styles.seccionTitulo}>{titulo}</span>
      </div>
      <p className={styles.seccionTexto}>{texto}</p>
    </div>
  );
};

const TarjetaAtencion = ({ atencion, index, total, abierta, onToggle }) => {
  const fecha = atencion.cita?.fecha_hora ?? atencion.createdAt;

  return (
    <div className={`${styles.tarjeta} ${index === 0 ? styles.tarjetaReciente : ''}`}>
      <button className={styles.tarjetaHeader} onClick={onToggle}>
        <div className={styles.tarjetaLeft}>
          <div className={styles.tarjetaNumero}>{total - index}</div>
          <div>
            <div className={styles.tarjetaFecha}>{fmtFecha(fecha)}</div>
            <div className={styles.tarjetaDiag}>{atencion.diagnostico}</div>
          </div>
        </div>
        <div className={styles.tarjetaRight}>
          {atencion.cie10 && (
            <span className={styles.cieBadge}>{atencion.cie10}</span>
          )}
          <svg
            className={`${styles.chevron} ${abierta ? styles.chevronAbierto : ''}`}
            width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5"
          >
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
      </button>

      {abierta && (
        <div className={styles.tarjetaBody}>
          <Seccion
            icono="🩺"
            titulo="Motivo de consulta"
            texto={atencion.motivo_consulta}
          />
          <Seccion
            icono="📋"
            titulo="Diagnóstico"
            texto={atencion.diagnostico}
          />
          <Seccion
            icono="💊"
            titulo="Plan de tratamiento"
            texto={atencion.plan_tratamiento}
          />
          <Seccion
            icono="📝"
            titulo="Indicaciones al paciente"
            texto={atencion.indicaciones}
          />
          {atencion.anamnesis && (
            <Seccion icono="📖" titulo="Anamnesis" texto={atencion.anamnesis} />
          )}
          {atencion.examen_fisico && (
            <Seccion icono="🔍" titulo="Examen físico" texto={atencion.examen_fisico} />
          )}
          <div className={styles.metaRow}>
            <span className={styles.metaMedico}>
              Dr. {atencion.medico?.nombre} {atencion.medico?.apellido}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

const HistorialPacienteModal = ({ paciente, onClose }) => {
  const [atenciones, setAtenciones] = useState([]);
  const [cargando, setCargando]     = useState(true);
  const [error, setError]           = useState(null);
  const [abiertaIndex, setAbiertaIndex] = useState(0);

  useEffect(() => {
    getHistorialPaciente(paciente.id)
      .then(data => { setAtenciones(data); setAbiertaIndex(0); })
      .catch(() => setError('No se pudo cargar el historial.'))
      .finally(() => setCargando(false));
  }, [paciente.id]);

  const edad = calcEdad(paciente.fecha_nacimiento);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>

        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.avatar}>
              {paciente.nombre?.[0]}{paciente.apellido?.[0]}
            </div>
            <div>
              <div className={styles.nombre}>{paciente.nombre} {paciente.apellido}</div>
              <div className={styles.meta}>
                {edad !== null && <span>{edad} años</span>}
                {paciente.rut && <span>· RUT {paciente.rut}</span>}
                {paciente.prevision_salud && (
                  <span>· {paciente.prevision_salud.toUpperCase()}</span>
                )}
              </div>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className={styles.subHeader}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
            <rect x="9" y="3" width="6" height="4" rx="1"/>
          </svg>
          Historial clínico
          {!cargando && !error && (
            <span className={styles.conteo}>{atenciones.length} atención{atenciones.length !== 1 ? 'es' : ''}</span>
          )}
        </div>

        <div className={styles.body}>
          {cargando && (
            <div className={styles.estado}>
              <div className={styles.spinner} />
              Cargando historial...
            </div>
          )}

          {!cargando && error && (
            <div className={`${styles.estado} ${styles.estadoError}`}>{error}</div>
          )}

          {!cargando && !error && atenciones.length === 0 && (
            <div className={styles.estado}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5">
                <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
                <rect x="9" y="3" width="6" height="4" rx="1"/>
              </svg>
              <p>Este paciente no tiene atenciones registradas.</p>
            </div>
          )}

          {!cargando && !error && atenciones.map((a, i) => (
            <TarjetaAtencion
              key={a.id}
              atencion={a}
              index={i}
              total={atenciones.length}
              abierta={abiertaIndex === i}
              onToggle={() => setAbiertaIndex(prev => prev === i ? null : i)}
            />
          ))}
        </div>

        <div className={styles.footer}>
          <button className={styles.btnCerrar} onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
};

export default HistorialPacienteModal;
