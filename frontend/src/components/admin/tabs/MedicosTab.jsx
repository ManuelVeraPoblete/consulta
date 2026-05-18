import React, { useEffect, useState, useCallback } from 'react';
import { listarUsuarios, desactivarUsuario, reactivarUsuario } from '../../../services/adminService';
import CrearMedicoForm from '../CrearMedicoForm';
import { PhoneDisplay } from '../../ui/PhoneInput';
import styles from './MedicosTab.module.css';

const MedicosTab = () => {
  const [showForm, setShowForm]         = useState(false);
  const [medicos, setMedicos]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [busqueda, setBusqueda]         = useState('');
  const [filtroActivo, setFiltroActivo] = useState('');
  const [msg, setMsg]                   = useState(null);
  const [detalle, setDetalle]           = useState(null);
  const [toggling, setToggling]         = useState(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const filtros = { rol: 'medico' };
      if (filtroActivo !== '') filtros.activo = filtroActivo;
      setMedicos(await listarUsuarios(filtros));
    } catch {
      setMsg({ type: 'error', text: 'Error al cargar médicos' });
    } finally {
      setLoading(false);
    }
  }, [filtroActivo]);

  useEffect(() => { cargar(); }, [cargar]);

  const handleToggle = async (m) => {
    setToggling(m.id);
    try {
      if (m.activo) await desactivarUsuario(m.id);
      else await reactivarUsuario(m.id);
      setMsg({ type: 'ok', text: m.activo ? 'Médico desactivado' : 'Médico reactivado' });
      if (detalle?.id === m.id) setDetalle(d => ({ ...d, activo: !d.activo }));
      cargar();
    } catch (e) {
      setMsg({ type: 'error', text: e.response?.data?.message || 'Error al actualizar' });
    } finally {
      setToggling(null);
    }
    setTimeout(() => setMsg(null), 3000);
  };

  const visibles = medicos.filter(m => {
    if (!busqueda) return true;
    const q = busqueda.toLowerCase();
    return `${m.nombre} ${m.apellido} ${m.email} ${m.perfil?.especialidad?.nombre || ''}`.toLowerCase().includes(q);
  });

  return (
    <div className={styles.wrapper}>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <div className={styles.searchBox}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input className={styles.searchInput} placeholder="Buscar por nombre o especialidad..."
              value={busqueda} onChange={e => setBusqueda(e.target.value)} />
            {busqueda && <button className={styles.clearBtn} onClick={() => setBusqueda('')}>✕</button>}
          </div>
          <select className={styles.select} value={filtroActivo} onChange={e => setFiltroActivo(e.target.value)}>
            <option value="">Todos</option>
            <option value="true">Activos</option>
            <option value="false">Inactivos</option>
          </select>
        </div>
        <button className={styles.btnPrimary} onClick={() => setShowForm(true)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Nuevo médico
        </button>
      </div>

      {/* Form (inline) */}
      {showForm && (
        <CrearMedicoForm
          onSuccess={() => { setShowForm(false); setMsg({ type: 'ok', text: 'Médico creado exitosamente' }); cargar(); setTimeout(() => setMsg(null), 4000); }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Toast */}
      {msg && (
        <div className={`${styles.toast} ${msg.type === 'ok' ? styles.toastOk : styles.toastErr}`}>
          {msg.type === 'ok'
            ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>}
          {msg.text}
        </div>
      )}

      {/* Table */}
      <div className={styles.tableWrap}>
        {loading ? (
          <div className={styles.emptyState}>
            <div className={styles.spinner} />
            <span>Cargando médicos…</span>
          </div>
        ) : visibles.length === 0 ? (
          <div className={styles.emptyState}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5">
              <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1"/>
              <path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/>
              <circle cx="20" cy="10" r="2"/>
            </svg>
            <p>{busqueda ? 'Sin resultados para la búsqueda' : 'No hay médicos registrados'}</p>
            {!busqueda && (
              <button className={styles.btnEmptyAdd} onClick={() => setShowForm(true)}>
                + Registrar primer médico
              </button>
            )}
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Médico</th>
                <th>Especialidad</th>
                <th>Modalidad</th>
                <th>Registro</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {visibles.map(m => (
                <tr key={m.id} className={!m.activo ? styles.rowInactivo : ''}>

                  {/* Médico */}
                  <td>
                    <div className={styles.personCell}>
                      <div className={styles.avatar}
                        style={{ background: m.activo ? 'linear-gradient(135deg,#0891b2,#0ea5e9)' : '#cbd5e1' }}>
                        {m.nombre[0]}{m.apellido[0]}
                      </div>
                      <div>
                        <div className={styles.personNombre}>Dr. {m.nombre} {m.apellido}</div>
                        <div className={styles.personEmail}>{m.email}</div>
                      </div>
                    </div>
                  </td>

                  {/* Especialidad */}
                  <td>
                    <div className={styles.espCell}>
                      <span className={styles.espNombre}>{m.perfil?.especialidad?.nombre || '—'}</span>
                      {(m.perfil?.subespecialidades || []).length > 0 && (
                        <div className={styles.subList}>
                          {m.perfil.subespecialidades.slice(0, 2).map(s => (
                            <span key={s.id} className={styles.subBadge}>{s.nombre}</span>
                          ))}
                          {m.perfil.subespecialidades.length > 2 && (
                            <span className={styles.subMore}>+{m.perfil.subespecialidades.length - 2}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Modalidad */}
                  <td>
                    <div className={styles.modalidades}>
                      {m.perfil?.modalidad_presencial && (
                        <span className={styles.modBadge} style={{ background: '#eff6ff', color: '#1d4ed8', borderColor: '#bfdbfe' }}>Presencial</span>
                      )}
                      {m.perfil?.modalidad_telemedicina && (
                        <span className={styles.modBadge} style={{ background: '#ecfeff', color: '#0891b2', borderColor: '#a5f3fc' }}>Telemedicina</span>
                      )}
                      {!m.perfil?.modalidad_presencial && !m.perfil?.modalidad_telemedicina && (
                        <span className={styles.noData}>—</span>
                      )}
                    </div>
                  </td>

                  {/* Registro */}
                  <td>
                    <span className={styles.registro}>
                      {m.perfil?.numero_registro ? `N° ${m.perfil.numero_registro}` : <span className={styles.noData}>—</span>}
                    </span>
                  </td>

                  {/* Estado */}
                  <td>
                    <span className={`${styles.statusBadge} ${m.activo ? styles.badgeActivo : styles.badgeInactivo}`}>
                      <span className={styles.badgeDot} />
                      {m.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>

                  {/* Acciones */}
                  <td>
                    <div className={styles.actions}>
                      <button className={styles.btnVer} onClick={() => setDetalle(m)}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                        Ver
                      </button>
                      <button
                        className={m.activo ? styles.btnOff : styles.btnOn}
                        onClick={() => handleToggle(m)}
                        disabled={toggling === m.id}>
                        {toggling === m.id ? '…' : m.activo ? 'Desactivar' : 'Reactivar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {!loading && visibles.length > 0 && (
        <div className={styles.count}>{visibles.length} médico{visibles.length !== 1 ? 's' : ''}</div>
      )}

      {/* Modal detalle */}
      {detalle && (
        <DetalleModal
          medico={detalle}
          onClose={() => setDetalle(null)}
          onToggle={() => handleToggle(detalle)}
          toggling={toggling === detalle.id}
        />
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────────────── Modal ── */

const DetalleModal = ({ medico: m, onClose, onToggle, toggling }) => {
  const p = m.perfil || {};

  const fmt = (fecha) => {
    if (!fecha) return null;
    const [y, mo, d] = fecha.split('-');
    return `${d}/${mo}/${y}`;
  };

  const fmtMonto = (v) => v ? `$${Number(v).toLocaleString('es-CL')}` : null;

  return (
    <>
      <div className={styles.modalBackdrop} onClick={onClose} />
      <div className={styles.modal} role="dialog" aria-modal="true">

        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.modalAvatar}
            style={{ background: m.activo ? 'linear-gradient(135deg,#0891b2,#0ea5e9)' : '#cbd5e1' }}>
            {m.nombre[0]}{m.apellido[0]}
          </div>
          <div className={styles.modalHeaderInfo}>
            <h2 className={styles.modalNombre}>Dr. {m.nombre} {m.apellido}</h2>
            <div className={styles.modalEmail}>{m.email}</div>
            {m.telefono && <div className={styles.modalEmail}><PhoneDisplay number={m.telefono} /></div>}
          </div>
          <span className={`${styles.statusBadge} ${m.activo ? styles.badgeActivo : styles.badgeInactivo}`} style={{ marginLeft: 'auto', alignSelf: 'flex-start' }}>
            <span className={styles.badgeDot} />{m.activo ? 'Activo' : 'Inactivo'}
          </span>
          <button className={styles.modalClose} onClick={onClose} aria-label="Cerrar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className={styles.modalBody}>

          {/* Formación */}
          <ModalSection title="Formación profesional">
            <InfoGrid>
              <InfoItem label="Título profesional"   value={p.titulo_profesional} />
              <InfoItem label="Entidad certificadora" value={p.entidad_certificadora} />
              <InfoItem label="N° Registro prestador" value={p.numero_registro} />
              <InfoItem label="Fecha registro"        value={fmt(p.fecha_registro_prestador)} />
              <InfoItem label="Vigencia especialidad" value={fmt(p.vigencia_especialidad)} />
            </InfoGrid>
          </ModalSection>

          {/* Especialidad */}
          <ModalSection title="Especialidad">
            <div className={styles.espDestacada}>
              {p.especialidad?.nombre || <span className={styles.noData}>No especificada</span>}
            </div>
            {(p.subespecialidades || []).length > 0 && (
              <div className={styles.subGrid}>
                {p.subespecialidades.map(s => (
                  <span key={s.id} className={styles.subChip}>{s.nombre}</span>
                ))}
              </div>
            )}
            {p.descripcion && <p className={styles.descripcion}>{p.descripcion}</p>}
          </ModalSection>

          {/* Modalidad y convenios */}
          <ModalSection title="Atención y convenios">
            <div className={styles.modalRow}>
              <div className={styles.modalSubLabel}>Modalidad</div>
              <div className={styles.modalidades}>
                {p.modalidad_presencial && (
                  <span className={styles.modBadge} style={{ background: '#eff6ff', color: '#1d4ed8', borderColor: '#bfdbfe' }}>Presencial</span>
                )}
                {p.modalidad_telemedicina && (
                  <span className={styles.modBadge} style={{ background: '#ecfeff', color: '#0891b2', borderColor: '#a5f3fc' }}>Telemedicina</span>
                )}
                {!p.modalidad_presencial && !p.modalidad_telemedicina && <span className={styles.noData}>No especificada</span>}
              </div>
            </div>

            <div className={styles.modalRow}>
              <div className={styles.modalSubLabel}>Previsiones</div>
              <div className={styles.convList}>
                {(p.previsiones || []).map(pr => (
                  <span key={pr.id} className={`${styles.conv} ${pr.tipo === 'fonasa' ? styles.convFonasa : styles.convIsapre}`}>
                    {pr.nombre}
                  </span>
                ))}
                {p.acepta_particular && (
                  <span className={`${styles.conv} ${styles.convParticular}`}>
                    Particular {fmtMonto(p.valor_particular) || ''}
                  </span>
                )}
                {!(p.previsiones || []).length && !p.acepta_particular && (
                  <span className={styles.noData}>Sin convenios registrados</span>
                )}
              </div>
            </div>
          </ModalSection>
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          <button className={styles.btnCerrar} onClick={onClose}>Cerrar</button>
          <button
            className={m.activo ? styles.btnOff : styles.btnOn}
            onClick={onToggle}
            disabled={toggling}>
            {toggling ? '…' : m.activo ? 'Desactivar médico' : 'Reactivar médico'}
          </button>
        </div>
      </div>
    </>
  );
};

const ModalSection = ({ title, children }) => (
  <div className={styles.modalSection}>
    <div className={styles.modalSectionTitle}>{title}</div>
    {children}
  </div>
);

const InfoGrid = ({ children }) => (
  <div className={styles.infoGrid}>{children}</div>
);

const InfoItem = ({ label, value }) => (
  <div className={styles.infoItem}>
    <span className={styles.infoLabel}>{label}</span>
    <span className={styles.infoValue}>{value || <span className={styles.noData}>—</span>}</span>
  </div>
);

export default MedicosTab;
