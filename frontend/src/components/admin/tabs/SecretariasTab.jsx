import React, { useEffect, useState, useCallback } from 'react';
import {
  listarUsuarios, listarMedicos,
  actualizarUsuario, actualizarMedicosSecretaria,
  desactivarUsuario, reactivarUsuario,
} from '../../../services/adminService';
import CrearSecretariaForm from '../CrearSecretariaForm';
import { PhoneDisplay } from '../../ui/PhoneInput';
import styles from './SecretariasTab.module.css';

/* ─── Tab principal ─── */
const SecretariasTab = () => {
  const [showForm, setShowForm]         = useState(false);
  const [secretarias, setSecretarias]   = useState([]);
  const [loading, setLoading]           = useState(true);
  const [busqueda, setBusqueda]         = useState('');
  const [filtroActivo, setFiltroActivo] = useState('');
  const [msg, setMsg]                   = useState(null);
  const [toggling, setToggling]         = useState(null);
  const [editando, setEditando]         = useState(null);
  const [gestionandoMedicos, setGestionandoMedicos] = useState(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const filtros = { rol: 'secretaria' };
      if (filtroActivo !== '') filtros.activo = filtroActivo;
      setSecretarias(await listarUsuarios(filtros));
    } catch {
      setMsg({ type: 'error', text: 'Error al cargar secretarias' });
    } finally {
      setLoading(false);
    }
  }, [filtroActivo]);

  useEffect(() => { cargar(); }, [cargar]);

  const handleToggle = async (s) => {
    setToggling(s.id);
    try {
      if (s.activo) await desactivarUsuario(s.id);
      else await reactivarUsuario(s.id);
      setMsg({ type: 'ok', text: s.activo ? 'Secretaria desactivada' : 'Secretaria reactivada' });
      cargar();
    } catch (e) {
      setMsg({ type: 'error', text: e.response?.data?.message || 'Error al actualizar' });
    } finally {
      setToggling(null);
    }
    setTimeout(() => setMsg(null), 3000);
  };

  const handleEditSaved = (updated) => {
    setSecretarias(prev => prev.map(s => s.id === updated.id ? { ...s, ...updated } : s));
    setEditando(null);
    setMsg({ type: 'ok', text: 'Datos actualizados correctamente' });
    setTimeout(() => setMsg(null), 3000);
  };

  const handleMedicosSaved = (updated) => {
    setSecretarias(prev => prev.map(s => s.id === updated.id ? { ...s, medicosAsignados: updated.medicosAsignados } : s));
    setGestionandoMedicos(null);
    setMsg({ type: 'ok', text: 'Médicos actualizados correctamente' });
    setTimeout(() => setMsg(null), 3000);
  };

  const visibles = secretarias.filter(s => {
    if (!busqueda) return true;
    const q = busqueda.toLowerCase();
    return `${s.nombre} ${s.apellido} ${s.email} ${s.telefono || ''}`.toLowerCase().includes(q);
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
            <input className={styles.searchInput}
              placeholder="Buscar por nombre, email o teléfono…"
              value={busqueda} onChange={e => setBusqueda(e.target.value)} />
            {busqueda && (
              <button className={styles.clearBtn} onClick={() => setBusqueda('')}>✕</button>
            )}
          </div>
          <select className={styles.select} value={filtroActivo} onChange={e => setFiltroActivo(e.target.value)}>
            <option value="">Todas</option>
            <option value="true">Activas</option>
            <option value="false">Inactivas</option>
          </select>
        </div>
        <button className={styles.btnPrimary} onClick={() => setShowForm(true)}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Nueva secretaria
        </button>
      </div>

      {/* Toast */}
      {msg && (
        <div className={`${styles.toast} ${msg.type === 'ok' ? styles.toastOk : styles.toastErr}`}>
          {msg.type === 'ok'
            ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>}
          {msg.text}
        </div>
      )}

      {/* Tabla */}
      <div className={styles.tableWrap}>
        {loading ? (
          <div className={styles.emptyState}>
            <div className={styles.spinner} />
            <span>Cargando secretarias…</span>
          </div>
        ) : visibles.length === 0 ? (
          <div className={styles.emptyState}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <line x1="23" y1="11" x2="17" y2="11"/>
            </svg>
            <p>{busqueda ? 'Sin resultados para la búsqueda' : 'No hay secretarias registradas'}</p>
            {!busqueda && (
              <button className={styles.btnEmptyAdd} onClick={() => setShowForm(true)}>
                + Agregar primera secretaria
              </button>
            )}
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Secretaria</th>
                <th>Contacto</th>
                <th>Médicos asignados</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {visibles.map(s => (
                <tr key={s.id} className={!s.activo ? styles.rowInactivo : ''}>

                  <td>
                    <div className={styles.personCell}>
                      <div className={styles.avatar}
                        style={{ background: s.activo
                          ? 'linear-gradient(135deg,#7c3aed,#9333ea)'
                          : '#cbd5e1' }}>
                        {s.nombre[0]}{s.apellido[0]}
                      </div>
                      <div>
                        <div className={styles.personNombre}>{s.nombre} {s.apellido}</div>
                        {s.rut && <div className={styles.personSub}>RUT {s.rut}</div>}
                      </div>
                    </div>
                  </td>

                  <td>
                    <div className={styles.contactCell}>
                      <div className={styles.contactRow}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                          <polyline points="22,6 12,13 2,6"/>
                        </svg>
                        <span>{s.email}</span>
                      </div>
                      {s.telefono && (
                        <div className={styles.contactRow}>
                          <PhoneDisplay number={s.telefono} />
                        </div>
                      )}
                    </div>
                  </td>

                  <td>
                    {(s.medicosAsignados || []).length === 0 ? (
                      <span className={styles.sinAsignar}>— sin asignar —</span>
                    ) : (
                      <div className={styles.medicosCell}>
                        {s.medicosAsignados.map(m => (
                          <div key={m.id} className={styles.medicoRow}>
                            <div className={styles.medicoMini}>{m.nombre[0]}{m.apellido[0]}</div>
                            <div>
                              <span className={styles.medicoNombre}>Dr. {m.nombre} {m.apellido}</span>
                              {m.perfil?.especialidad && (
                                <span className={styles.medicoEsp}> · {m.perfil.especialidad.nombre}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </td>

                  <td>
                    <span className={`${styles.badge} ${s.activo ? styles.badgeActivo : styles.badgeInactivo}`}>
                      <span className={styles.badgeDot} />
                      {s.activo ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>

                  <td>
                    <div className={styles.actions}>
                      <button className={styles.btnEditar} onClick={() => setEditando(s)}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                        Editar
                      </button>
                      <button className={styles.btnMedicos} onClick={() => setGestionandoMedicos(s)}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                          <circle cx="9" cy="7" r="4"/>
                          <line x1="23" y1="11" x2="17" y2="11"/>
                          <line x1="20" y1="8" x2="20" y2="14"/>
                        </svg>
                        Médicos
                      </button>
                      <button
                        className={`${styles.btnToggle} ${s.activo ? styles.btnToggleOff : styles.btnToggleOn}`}
                        onClick={() => handleToggle(s)}
                        disabled={toggling === s.id}>
                        {toggling === s.id ? '…' : s.activo ? 'Desactivar' : 'Reactivar'}
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
        <div className={styles.count}>
          {visibles.length} secretaria{visibles.length !== 1 ? 's' : ''}
          {filtroActivo === 'true' ? ' activas' : filtroActivo === 'false' ? ' inactivas' : ' en total'}
        </div>
      )}

      {/* Modales */}
      {editando && (
        <EditarSecretariaModal
          secretaria={editando}
          onClose={() => setEditando(null)}
          onSaved={handleEditSaved}
        />
      )}
      {gestionandoMedicos && (
        <GestionarMedicosModal
          secretaria={gestionandoMedicos}
          onClose={() => setGestionandoMedicos(null)}
          onSaved={handleMedicosSaved}
        />
      )}

      {/* Drawer nueva secretaria */}
      {showForm && <div className={styles.backdrop} onClick={() => setShowForm(false)} />}
      <div className={`${styles.drawer} ${showForm ? styles.drawerOpen : ''}`}>
        <CrearSecretariaForm
          onSuccess={() => {
            setShowForm(false);
            setMsg({ type: 'ok', text: 'Secretaria creada exitosamente' });
            cargar();
            setTimeout(() => setMsg(null), 4000);
          }}
          onCancel={() => setShowForm(false)}
        />
      </div>
    </div>
  );
};

export default SecretariasTab;

/* ─── Modal: Editar datos de secretaria ─── */
const EditarSecretariaModal = ({ secretaria: s, onClose, onSaved }) => {
  const [form, setForm] = useState({
    nombre:   s.nombre   || '',
    apellido: s.apellido || '',
    email:    s.email    || '',
    rut:      s.rut      || '',
    telefono: s.telefono || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const updated = await actualizarUsuario(s.id, {
        nombre:   form.nombre,
        apellido: form.apellido,
        email:    form.email,
        rut:      form.rut,
        telefono: form.telefono,
      });
      onSaved(updated);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar cambios');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className={styles.modalBackdrop} onClick={onClose} />
      <div className={styles.modal} role="dialog" aria-modal="true">

        <div className={styles.modalHeader}>
          <div className={styles.modalAvatar}
            style={{ background: 'linear-gradient(135deg,#7c3aed,#9333ea)' }}>
            {s.nombre[0]}{s.apellido[0]}
          </div>
          <div className={styles.modalHeaderInfo}>
            <h2 className={styles.modalNombre}>Editar secretaria</h2>
            <div className={styles.modalSub}>{s.nombre} {s.apellido}</div>
          </div>
          <button className={styles.modalClose} onClick={onClose} aria-label="Cerrar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            {error && (
              <div className={styles.formError}>{error}</div>
            )}
            <div className={styles.modalSection}>
              <div className={styles.modalSectionTitle}>Datos personales</div>
              <div className={styles.editGrid}>
                <div className={styles.editGroup}>
                  <label className={styles.editLabel}>Nombre</label>
                  <input className={styles.editInput} required value={form.nombre}
                    onChange={e => set('nombre', e.target.value)} />
                </div>
                <div className={styles.editGroup}>
                  <label className={styles.editLabel}>Apellido</label>
                  <input className={styles.editInput} required value={form.apellido}
                    onChange={e => set('apellido', e.target.value)} />
                </div>
                <div className={styles.editGroup}>
                  <label className={styles.editLabel}>Email</label>
                  <input className={styles.editInput} type="email" required value={form.email}
                    onChange={e => set('email', e.target.value)} />
                </div>
                <div className={styles.editGroup}>
                  <label className={styles.editLabel}>RUT</label>
                  <input className={styles.editInput} value={form.rut}
                    placeholder="Ej: 12345678-9"
                    onChange={e => set('rut', e.target.value)} />
                </div>
                <div className={`${styles.editGroup} ${styles.editColSpan2}`}>
                  <label className={styles.editLabel}>Teléfono</label>
                  <input className={styles.editInput} value={form.telefono}
                    placeholder="+56 9 1234 5678"
                    onChange={e => set('telefono', e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button type="submit" className={styles.btnPrimary} disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar cambios'}
            </button>
            <button type="button" className={styles.btnCerrar} onClick={onClose}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

/* ─── Modal: Gestionar médicos asignados ─── */
const GestionarMedicosModal = ({ secretaria: s, onClose, onSaved }) => {
  const [medicos, setMedicos]     = useState([]);
  const [selected, setSelected]   = useState(new Set((s.medicosAsignados || []).map(m => m.id)));
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState(null);
  const [busqueda, setBusqueda]   = useState('');

  useEffect(() => {
    listarMedicos()
      .then(setMedicos)
      .catch(() => setError('No se pudieron cargar los médicos'))
      .finally(() => setLoading(false));
  }, []);

  const toggle = (id) => setSelected(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const updated = await actualizarMedicosSecretaria(s.id, [...selected]);
      onSaved(updated);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar médicos');
    } finally {
      setSaving(false);
    }
  };

  const visibles = medicos.filter(m => {
    if (!busqueda) return true;
    const q = busqueda.toLowerCase();
    return `${m.nombre} ${m.apellido} ${m.perfil?.especialidad?.nombre || ''}`.toLowerCase().includes(q);
  });

  return (
    <>
      <div className={styles.modalBackdrop} onClick={onClose} />
      <div className={styles.modal} role="dialog" aria-modal="true">

        <div className={styles.modalHeader}>
          <div className={styles.modalAvatar}
            style={{ background: 'linear-gradient(135deg,#0891b2,#0ea5e9)' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <line x1="23" y1="11" x2="17" y2="11"/>
              <line x1="20" y1="8" x2="20" y2="14"/>
            </svg>
          </div>
          <div className={styles.modalHeaderInfo}>
            <h2 className={styles.modalNombre}>Agregar médicos</h2>
            <div className={styles.modalSub}>{s.nombre} {s.apellido} · {selected.size} seleccionado{selected.size !== 1 ? 's' : ''}</div>
          </div>
          <button className={styles.modalClose} onClick={onClose} aria-label="Cerrar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            {error && <div className={styles.formError}>{error}</div>}

            <div className={styles.modalSection}>
              <div className={styles.medicoSearch}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input
                  className={styles.medicoSearchInput}
                  placeholder="Buscar médico…"
                  value={busqueda}
                  onChange={e => setBusqueda(e.target.value)}
                />
              </div>

              {loading ? (
                <div className={styles.medicoLoadingRow}>
                  <div className={styles.spinner} style={{ width: 20, height: 20, borderWidth: 2 }} />
                  <span>Cargando médicos…</span>
                </div>
              ) : visibles.length === 0 ? (
                <div className={styles.medicoEmpty}>No se encontraron médicos</div>
              ) : (
                <div className={styles.medicoList}>
                  {visibles.map(m => {
                    const checked = selected.has(m.id);
                    return (
                      <label key={m.id} className={`${styles.medicoItem} ${checked ? styles.medicoItemChecked : ''}`}>
                        <input
                          type="checkbox"
                          className={styles.medicoCheckbox}
                          checked={checked}
                          onChange={() => toggle(m.id)}
                        />
                        <div className={styles.medicoMini}>{m.nombre[0]}{m.apellido[0]}</div>
                        <div className={styles.medicoInfo}>
                          <span className={styles.medicoNombre}>Dr. {m.nombre} {m.apellido}</span>
                          {m.perfil?.especialidad && (
                            <span className={styles.medicoEsp}>{m.perfil.especialidad.nombre}</span>
                          )}
                        </div>
                        {checked && (
                          <svg className={styles.medicoCheck} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0891b2" strokeWidth="2.5">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        )}
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button type="submit" className={styles.btnPrimary} disabled={saving || loading}>
              {saving ? 'Guardando…' : `Guardar (${selected.size} médico${selected.size !== 1 ? 's' : ''})`}
            </button>
            <button type="button" className={styles.btnCerrar} onClick={onClose}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </>
  );
};
