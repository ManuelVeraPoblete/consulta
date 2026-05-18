import React, { useState, useEffect, useCallback } from 'react';
import { buscarMedicos } from '../../services/medicoService';
import MedicoCard from './MedicoCard';
import styles from './BuscadorMedicos.module.css';

const ESPECIALIDADES = [
  'Medicina General', 'Cardiología', 'Pediatría',   'Dermatología',
  'Ginecología',      'Traumatología','Neurología',  'Oftalmología',
  'Psiquiatría',      'Urología',
];

const SearchIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const BuscadorMedicos = () => {
  const [especialidad, setEspecialidad] = useState('');
  const [nombre, setNombre]             = useState('');
  const [medicos, setMedicos]           = useState([]);
  const [loading, setLoading]           = useState(false);
  const [buscado, setBuscado]           = useState(false);
  const [error, setError]               = useState(null);

  const ejecutarBusqueda = useCallback(async (esp, nom) => {
    setLoading(true);
    setError(null);
    setBuscado(true);
    try {
      const data = await buscarMedicos({ especialidad: esp, nombre: nom });
      setMedicos(data.medicos);
    } catch {
      setError('No se pudo conectar con el servidor. Asegúrate de que el backend esté corriendo.');
      setMedicos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Busca automáticamente al cambiar especialidad
  useEffect(() => {
    ejecutarBusqueda(especialidad, nombre);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [especialidad]);

  const handleBuscar = (e) => {
    e.preventDefault();
    ejecutarBusqueda(especialidad, nombre);
  };

  const handleLimpiar = () => {
    setEspecialidad('');
    setNombre('');
    ejecutarBusqueda('', '');
  };

  return (
    <div className={styles.wrapper}>
      {/* Filtros */}
      <form className={styles.filtros} onSubmit={handleBuscar}>
        <div className={styles.selectWrap}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
          </svg>
          <select
            className={styles.select}
            value={especialidad}
            onChange={(e) => setEspecialidad(e.target.value)}
          >
            <option value="">Todas las especialidades</option>
            {ESPECIALIDADES.map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
        </div>

        <div className={styles.inputWrap}>
          <SearchIcon />
          <input
            className={styles.input}
            type="text"
            placeholder="Buscar por nombre..."
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
          {nombre && (
            <button type="button" className={styles.clearInput} onClick={() => setNombre('')}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        <button type="submit" className={styles.btnBuscar}>
          <SearchIcon /> Buscar
        </button>

        {(especialidad || nombre) && (
          <button type="button" className={styles.btnLimpiar} onClick={handleLimpiar}>
            Limpiar filtros
          </button>
        )}
      </form>

      {/* Chips de filtros activos */}
      {(especialidad || nombre) && (
        <div className={styles.chips}>
          {especialidad && (
            <span className={styles.chip}>
              {especialidad}
              <button onClick={() => setEspecialidad('')}>×</button>
            </span>
          )}
          {nombre && (
            <span className={styles.chip}>
              "{nombre}"
              <button onClick={() => setNombre('')}>×</button>
            </span>
          )}
        </div>
      )}

      {/* Resultados */}
      {loading && (
        <div className={styles.estado}>
          <div className={styles.spinner} />
          <span>Buscando médicos...</span>
        </div>
      )}

      {error && !loading && (
        <div className={styles.errorBox}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {error}
        </div>
      )}

      {!loading && !error && buscado && medicos.length === 0 && (
        <div className={styles.estado}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <p>No se encontraron médicos con los filtros seleccionados.</p>
        </div>
      )}

      {!loading && !error && medicos.length > 0 && (
        <>
          <p className={styles.resultCount}>
            {medicos.length} médico{medicos.length !== 1 ? 's' : ''} encontrado{medicos.length !== 1 ? 's' : ''}
          </p>
          <div className={styles.grid}>
            {medicos.map((m) => (
              <MedicoCard key={m.id} medico={m} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default BuscadorMedicos;
