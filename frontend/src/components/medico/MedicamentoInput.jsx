import React, { useState, useEffect, useRef, useCallback } from 'react';
import { buscarMedicamentos } from '../../services/medicoService';
import styles from './MedicamentoInput.module.css';

const MedicamentoInput = ({ value, onChange, placeholder }) => {
  const [query, setQuery]         = useState(value || '');
  const [sugerencias, setSuger]   = useState([]);
  const [abierto, setAbierto]     = useState(false);
  const [activo, setActivo]       = useState(-1);
  const [buscando, setBuscando]   = useState(false);
  const inputRef  = useRef(null);
  const listaRef  = useRef(null);
  const timerRef  = useRef(null);

  // Sincronizar si el valor externo cambia (ej: al limpiar el formulario)
  useEffect(() => { setQuery(value || ''); }, [value]);

  const buscar = useCallback(async (q) => {
    if (q.length < 2) { setSuger([]); setAbierto(false); return; }
    setBuscando(true);
    try {
      const data = await buscarMedicamentos(q);
      setSuger(data);
      setAbierto(data.length > 0);
      setActivo(-1);
    } catch {
      setSuger([]);
    } finally {
      setBuscando(false);
    }
  }, []);

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    onChange(val);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => buscar(val), 250);
  };

  const seleccionar = (med) => {
    setQuery(med.nombre);
    onChange(med.nombre);
    setSuger([]);
    setAbierto(false);
    setActivo(-1);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (!abierto) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActivo(a => Math.min(a + 1, sugerencias.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActivo(a => Math.max(a - 1, 0));
    } else if (e.key === 'Enter' && activo >= 0) {
      e.preventDefault();
      seleccionar(sugerencias[activo]);
    } else if (e.key === 'Escape') {
      setAbierto(false);
    }
  };

  // Scroll al ítem activo
  useEffect(() => {
    if (activo >= 0 && listaRef.current) {
      const item = listaRef.current.children[activo];
      item?.scrollIntoView({ block: 'nearest' });
    }
  }, [activo]);

  // Cerrar al click fuera
  useEffect(() => {
    const handler = (e) => {
      if (!inputRef.current?.closest(`.${styles.wrapper}`)?.contains(e.target)) {
        setAbierto(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Resaltar la parte que coincide con la búsqueda
  const resaltar = (texto) => {
    if (!query.trim()) return texto;
    const re  = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = texto.split(re);
    return parts.map((p, i) =>
      re.test(p) ? <mark key={i} className={styles.mark}>{p}</mark> : p
    );
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.inputBox}>
        <input
          ref={inputRef}
          className={styles.input}
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => sugerencias.length > 0 && setAbierto(true)}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
        />
        {buscando && <span className={styles.spinner} />}
        {query && !buscando && (
          <button
            type="button"
            className={styles.clearBtn}
            onClick={() => { setQuery(''); onChange(''); setSuger([]); setAbierto(false); inputRef.current?.focus(); }}
            tabIndex={-1}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        )}
      </div>

      {abierto && sugerencias.length > 0 && (
        <ul className={styles.lista} ref={listaRef}>
          {sugerencias.map((med, i) => (
            <li
              key={med.id}
              className={`${styles.item} ${i === activo ? styles.itemActivo : ''}`}
              onMouseDown={() => seleccionar(med)}
              onMouseEnter={() => setActivo(i)}
            >
              <span className={styles.itemNombre}>{resaltar(med.nombre)}</span>
              <span className={styles.itemReg}>{med.numero_registro}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default MedicamentoInput;
