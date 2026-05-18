import React, { useState, useEffect, useCallback } from 'react';
import { getMisPacientes } from '../../../services/medicoService';
import HistorialPacienteModal from '../HistorialPacienteModal';
import styles from './PacientesTab.module.css';

const POR_PAGINA = 10;

const calcularEdad = (fechaNacimiento) => {
  if (!fechaNacimiento) return '—';
  const hoy = new Date();
  const nac = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
  return `${edad} años`;
};

const formatFecha = (fecha) => {
  if (!fecha) return '—';
  return new Date(fecha).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });
};

const initiales = (nombre, apellido) =>
  `${nombre?.[0] ?? ''}${apellido?.[0] ?? ''}`.toUpperCase();

const PacientesTab = () => {
  const [busqueda, setBusqueda]   = useState('');
  const [pacientes, setPacientes] = useState([]);
  const [cargando, setCargando]   = useState(true);
  const [error, setError]         = useState(null);
  const [pagina, setPagina]       = useState(1);
  const [pacienteHistorial, setPacienteHistorial] = useState(null);

  const cargarPacientes = useCallback(async (q) => {
    setCargando(true);
    setError(null);
    try {
      const { pacientes: data } = await getMisPacientes(q);
      setPacientes(data);
      setPagina(1);
    } catch {
      setError('No se pudieron cargar los pacientes.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargarPacientes(''); }, [cargarPacientes]);

  useEffect(() => {
    const timer = setTimeout(() => cargarPacientes(busqueda), 350);
    return () => clearTimeout(timer);
  }, [busqueda, cargarPacientes]);

  const totalPaginas = Math.max(1, Math.ceil(pacientes.length / POR_PAGINA));
  const paginados    = pacientes.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);

  return (
    <>
      <div className={styles.wrapper}>
        <div className={styles.toolbar}>
          <div className={styles.searchBox}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              className={styles.searchInput}
              placeholder="Buscar por nombre o RUT..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
            />
          </div>
          {!cargando && (
            <span className={styles.count}>
              {pacientes.length} paciente{pacientes.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        <div className={styles.tableCard}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Paciente</th>
                <th>RUT</th>
                <th>Edad</th>
                <th>Diagnóstico</th>
                <th>Última atención</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {!cargando && paginados.map(p => (
                <tr key={p.id}>
                  <td>
                    <div className={styles.pCell}>
                      <div className={styles.pAvatar}>{initiales(p.nombre, p.apellido)}</div>
                      <span className={styles.pNombre}>{p.nombre} {p.apellido}</span>
                    </div>
                  </td>
                  <td className={styles.rut}>{p.rut ?? '—'}</td>
                  <td>{calcularEdad(p.fecha_nacimiento)}</td>
                  <td className={styles.diag}>{p.diagnostico ?? '—'}</td>
                  <td className={styles.ult}>{formatFecha(p.ultimaAtencion)}</td>
                  <td>
                    <span
                      className={styles.estado}
                      style={p.activo
                        ? { color: '#16a34a', borderColor: '#bbf7d0', background: '#f0fdf4' }
                        : { color: '#dc2626', borderColor: '#fecaca', background: '#fef2f2' }}
                    >
                      {p.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    <button
                      className={styles.btnHistorial}
                      onClick={() => setPacienteHistorial(p)}
                    >
                      Historial
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {cargando && (
            <div className={styles.emptyState}>
              <p style={{ color: '#94a3b8' }}>Cargando pacientes...</p>
            </div>
          )}

          {!cargando && error && (
            <div className={styles.emptyState}>
              <p style={{ color: '#dc2626' }}>{error}</p>
            </div>
          )}

          {!cargando && !error && pacientes.length === 0 && (
            <div className={styles.emptyState}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              <p>{busqueda ? 'No se encontraron pacientes con esa búsqueda.' : 'Aún no hay atenciones registradas.'}</p>
            </div>
          )}
        </div>

        {!cargando && !error && totalPaginas > 1 && (
          <div className={styles.pagination}>
            <button
              className={styles.pageBtn}
              onClick={() => setPagina(p => Math.max(1, p - 1))}
              disabled={pagina === 1}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
            </button>

            {Array.from({ length: totalPaginas }, (_, i) => i + 1)
              .filter(n => n === 1 || n === totalPaginas || Math.abs(n - pagina) <= 1)
              .reduce((acc, n, idx, arr) => {
                if (idx > 0 && n - arr[idx - 1] > 1) acc.push('...');
                acc.push(n);
                return acc;
              }, [])
              .map((item, idx) =>
                item === '...'
                  ? <span key={'e' + idx} className={styles.pageEllipsis}>…</span>
                  : <button
                      key={item}
                      className={[styles.pageBtn, item === pagina ? styles.pageBtnActive : ''].join(' ')}
                      onClick={() => setPagina(item)}
                    >
                      {item}
                    </button>
              )
            }

            <button
              className={styles.pageBtn}
              onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
              disabled={pagina === totalPaginas}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </button>

            <span className={styles.pageInfo}>
              {(pagina - 1) * POR_PAGINA + 1}–{Math.min(pagina * POR_PAGINA, pacientes.length)} de {pacientes.length}
            </span>
          </div>
        )}
      </div>

      {pacienteHistorial && (
        <HistorialPacienteModal
          paciente={pacienteHistorial}
          onClose={() => setPacienteHistorial(null)}
        />
      )}
    </>
  );
};

export default PacientesTab;
