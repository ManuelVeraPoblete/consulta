import React, { useEffect, useState, useCallback } from 'react';
import {
  listarUsuarios, crearUsuario, actualizarUsuario,
  desactivarUsuario, reactivarUsuario, listarEspecialidades,
} from '../../../services/adminService';
import styles from './UsuariosTab.module.css';

const ROLES_LABEL = { admin: 'Admin', medico: 'Médico', secretaria: 'Secretaria', paciente: 'Paciente' };
const ROLES_COLOR = {
  admin:      { bg: '#f5f3ff', color: '#7c3aed', border: '#ddd6fe' },
  medico:     { bg: '#ecfeff', color: '#0891b2', border: '#a5f3fc' },
  secretaria: { bg: '#eff6ff', color: '#1a56db', border: '#bfdbfe' },
  paciente:   { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
};

const EMPTY_FORM = {
  nombre: '', apellido: '', email: '', password: '', rol: 'paciente',
  especialidad: '', descripcion: '', acepta_isapre: false, acepta_fonasa: false,
  acepta_particular: false, valor_particular: '',
};

const POR_PAGINA = 10;

/* ── Modal de edición ── */
const EditModal = ({ usuario, especialidades, onClose, onSaved }) => {
  const [form, setForm] = useState({
    nombre:    usuario.nombre    || '',
    apellido:  usuario.apellido  || '',
    email:     usuario.email     || '',
    rut:       usuario.rut       || '',
    telefono:  usuario.telefono  || '',
    // perfil médico
    especialidad_id:        usuario.perfil?.especialidad_id        ?? '',
    descripcion:            usuario.perfil?.descripcion            ?? '',
    acepta_isapre:          usuario.perfil?.acepta_isapre          ?? false,
    acepta_fonasa:          usuario.perfil?.acepta_fonasa          ?? false,
    acepta_particular:      usuario.perfil?.acepta_particular      ?? false,
    valor_particular:       usuario.perfil?.valor_particular       ?? '',
    modalidad_presencial:   usuario.perfil?.modalidad_presencial   ?? false,
    modalidad_telemedicina: usuario.perfil?.modalidad_telemedicina ?? false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        nombre:   form.nombre,
        apellido: form.apellido,
        email:    form.email,
        rut:      form.rut,
        telefono: form.telefono,
      };
      if (usuario.rol === 'medico') {
        payload.perfil = {
          especialidad_id:        form.especialidad_id ? parseInt(form.especialidad_id) : null,
          descripcion:            form.descripcion,
          acepta_isapre:          form.acepta_isapre,
          acepta_fonasa:          form.acepta_fonasa,
          acepta_particular:      form.acepta_particular,
          valor_particular:       form.acepta_particular ? parseInt(form.valor_particular) || null : null,
          modalidad_presencial:   form.modalidad_presencial,
          modalidad_telemedicina: form.modalidad_telemedicina,
        };
      }
      const updated = await actualizarUsuario(usuario.id, payload);
      onSaved(updated);
    } catch (e) {
      setError(e.response?.data?.message || 'Error al guardar cambios');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalBox} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.modalTitle}>
            Editar {ROLES_LABEL[usuario.rol]} — {usuario.nombre} {usuario.apellido}
          </div>
          <button className={styles.modalClose} onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div className={`${styles.msg} ${styles.msgErr}`}>{error}</div>}

          <div className={styles.modalSection}>
            <div className={styles.modalSectionTitle}>Datos personales</div>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Nombre</label>
                <input className={styles.input} required value={form.nombre}
                  onChange={e => set('nombre', e.target.value)} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Apellido</label>
                <input className={styles.input} required value={form.apellido}
                  onChange={e => set('apellido', e.target.value)} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Email</label>
                <input className={styles.input} type="email" required value={form.email}
                  onChange={e => set('email', e.target.value)} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>RUT</label>
                <input className={styles.input} value={form.rut}
                  onChange={e => set('rut', e.target.value)} placeholder="Ej: 12345678-9" />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Teléfono</label>
                <input className={styles.input} value={form.telefono}
                  onChange={e => set('telefono', e.target.value)} placeholder="+56 9 1234 5678" />
              </div>
            </div>
          </div>

          {usuario.rol === 'medico' && (
            <div className={styles.modalSection}>
              <div className={styles.modalSectionTitle}>Perfil médico</div>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Especialidad</label>
                  <select className={styles.input} value={form.especialidad_id}
                    onChange={e => set('especialidad_id', e.target.value)}>
                    <option value="">Sin especialidad</option>
                    {especialidades.map(e => (
                      <option key={e.id} value={e.id}>{e.nombre}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Valor particular ($)</label>
                  <input className={styles.input} type="number" placeholder="Ej: 45000"
                    value={form.valor_particular}
                    disabled={!form.acepta_particular}
                    onChange={e => set('valor_particular', e.target.value)} />
                </div>
                <div className={`${styles.formGroup} ${styles.colSpan2}`}>
                  <label className={styles.label}>Descripción</label>
                  <input className={styles.input} value={form.descripcion}
                    onChange={e => set('descripcion', e.target.value)} />
                </div>
              </div>
              <div className={styles.checkRow}>
                {[
                  ['acepta_fonasa',         'Acepta FONASA'],
                  ['acepta_isapre',         'Acepta ISAPRE'],
                  ['acepta_particular',     'Acepta Particular'],
                  ['modalidad_presencial',  'Presencial'],
                  ['modalidad_telemedicina','Telemedicina'],
                ].map(([key, lbl]) => (
                  <label key={key} className={styles.checkLabel}>
                    <input type="checkbox" checked={form[key]}
                      onChange={e => set(key, e.target.checked)} />
                    {lbl}
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className={styles.modalFooter}>
            <button type="submit" className={styles.btnPrimary} disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
            <button type="button" className={styles.btnSecondary} onClick={onClose}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ── Tab principal ── */
const UsuariosTab = () => {
  const [usuarios, setUsuarios]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filtroRol, setFiltroRol] = useState('');
  const [filtroActivo, setFiltroActivo] = useState('');
  const [busqueda, setBusqueda]   = useState('');
  const [pagina, setPagina]       = useState(1);
  const [showForm, setShowForm]   = useState(false);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);
  const [msg, setMsg]             = useState(null);
  const [especialidades, setEspecialidades] = useState([]);
  const [editando, setEditando]   = useState(null);

  useEffect(() => { listarEspecialidades().then(setEspecialidades).catch(() => {}); }, []);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const filtros = {};
      if (filtroRol) filtros.rol = filtroRol;
      if (filtroActivo !== '') filtros.activo = filtroActivo;
      const data = await listarUsuarios(filtros);
      setUsuarios(data);
    } catch {
      setMsg({ type: 'error', text: 'Error al cargar usuarios' });
    } finally {
      setLoading(false);
    }
  }, [filtroRol, filtroActivo]);

  useEffect(() => { cargar(); }, [cargar]);

  const handleToggle = async (u) => {
    try {
      if (u.activo) await desactivarUsuario(u.id);
      else await reactivarUsuario(u.id);
      setMsg({ type: 'ok', text: u.activo ? 'Usuario desactivado' : 'Usuario reactivado' });
      cargar();
    } catch (e) {
      setMsg({ type: 'error', text: e.response?.data?.message || 'Error al actualizar' });
    }
    setTimeout(() => setMsg(null), 3000);
  };

  const handleCrear = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        nombre: form.nombre, apellido: form.apellido,
        email: form.email, password: form.password, rol: form.rol,
      };
      if (form.rol === 'medico') {
        payload.perfil = {
          especialidad: form.especialidad,
          descripcion: form.descripcion,
          acepta_isapre: form.acepta_isapre,
          acepta_fonasa: form.acepta_fonasa,
          acepta_particular: form.acepta_particular,
          valor_particular: form.valor_particular ? parseInt(form.valor_particular) : null,
        };
      }
      await crearUsuario(payload);
      setMsg({ type: 'ok', text: 'Usuario creado exitosamente' });
      setForm(EMPTY_FORM);
      setShowForm(false);
      cargar();
    } catch (e) {
      setMsg({ type: 'error', text: e.response?.data?.message || 'Error al crear usuario' });
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(null), 4000);
    }
  };

  const handleEditSaved = (updated) => {
    setUsuarios(prev => prev.map(u => u.id === updated.id ? updated : u));
    setEditando(null);
    setMsg({ type: 'ok', text: 'Usuario actualizado correctamente' });
    setTimeout(() => setMsg(null), 3000);
  };

  useEffect(() => { setPagina(1); }, [busqueda, filtroRol, filtroActivo]);

  const visibles = usuarios.filter(u => {
    if (!busqueda) return true;
    const q = busqueda.toLowerCase();
    return `${u.nombre} ${u.apellido} ${u.email}`.toLowerCase().includes(q);
  });

  const totalPaginas = Math.max(1, Math.ceil(visibles.length / POR_PAGINA));
  const paginados    = visibles.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);

  return (
    <div className={styles.wrapper}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <div className={styles.searchBox}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input className={styles.searchInput} placeholder="Buscar por nombre o email..."
              value={busqueda} onChange={e => setBusqueda(e.target.value)} />
          </div>
          <select className={styles.select} value={filtroRol} onChange={e => setFiltroRol(e.target.value)}>
            <option value="">Todos los roles</option>
            <option value="admin">Admin</option>
            <option value="medico">Médico</option>
            <option value="secretaria">Secretaria</option>
            <option value="paciente">Paciente</option>
          </select>
          <select className={styles.select} value={filtroActivo} onChange={e => setFiltroActivo(e.target.value)}>
            <option value="">Todos</option>
            <option value="true">Activos</option>
            <option value="false">Inactivos</option>
          </select>
        </div>
        <button className={styles.btnPrimary} onClick={() => setShowForm(v => !v)}>
          {showForm ? 'Cancelar' : '+ Nuevo usuario'}
        </button>
      </div>

      {msg && (
        <div className={`${styles.msg} ${msg.type === 'ok' ? styles.msgOk : styles.msgErr}`}>
          {msg.text}
        </div>
      )}

      {/* Formulario crear */}
      {showForm && (
        <form className={styles.formCard} onSubmit={handleCrear}>
          <div className={styles.formTitle}>Crear nuevo usuario</div>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Nombre</label>
              <input className={styles.input} required value={form.nombre}
                onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Apellido</label>
              <input className={styles.input} required value={form.apellido}
                onChange={e => setForm(f => ({ ...f, apellido: e.target.value }))} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Email</label>
              <input className={styles.input} type="email" required value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Contraseña</label>
              <input className={styles.input} type="password" required value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Rol</label>
              <select className={styles.input} value={form.rol}
                onChange={e => setForm(f => ({ ...f, rol: e.target.value }))}>
                <option value="paciente">Paciente</option>
                <option value="secretaria">Secretaria</option>
                <option value="medico">Médico</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          {form.rol === 'medico' && (
            <div className={styles.medicoSection}>
              <div className={styles.medicoSectionTitle}>Perfil médico</div>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Especialidad</label>
                  <select className={styles.input} required value={form.especialidad}
                    onChange={e => setForm(f => ({ ...f, especialidad: e.target.value }))}>
                    <option value="">Seleccionar...</option>
                    {especialidades.map(e => <option key={e.id} value={e.nombre}>{e.nombre}</option>)}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Valor particular ($)</label>
                  <input className={styles.input} type="number" placeholder="Ej: 45000"
                    value={form.valor_particular}
                    onChange={e => setForm(f => ({ ...f, valor_particular: e.target.value }))} />
                </div>
                <div className={`${styles.formGroup} ${styles.colSpan2}`}>
                  <label className={styles.label}>Descripción</label>
                  <input className={styles.input} placeholder="Breve descripción del médico"
                    value={form.descripcion}
                    onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} />
                </div>
              </div>
              <div className={styles.checkRow}>
                {[
                  ['acepta_fonasa', 'Acepta FONASA'],
                  ['acepta_isapre', 'Acepta ISAPRE'],
                  ['acepta_particular', 'Acepta Particular'],
                ].map(([key, lbl]) => (
                  <label key={key} className={styles.checkLabel}>
                    <input type="checkbox" checked={form[key]}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))} />
                    {lbl}
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className={styles.formActions}>
            <button type="submit" className={styles.btnPrimary} disabled={saving}>
              {saving ? 'Guardando...' : 'Crear usuario'}
            </button>
            <button type="button" className={styles.btnSecondary}
              onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Tabla */}
      <div className={styles.tableCard}>
        {loading ? (
          <div className={styles.empty}>Cargando usuarios...</div>
        ) : visibles.length === 0 ? (
          <div className={styles.empty}>No se encontraron usuarios</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paginados.map(u => {
                const rc = ROLES_COLOR[u.rol] || ROLES_COLOR.paciente;
                return (
                  <tr key={u.id} className={!u.activo ? styles.rowInactivo : ''}>
                    <td>
                      <div className={styles.userCell}>
                        <div className={styles.avatar}
                          style={{ background: u.activo ? 'linear-gradient(135deg,#9333ea,#db2777)' : '#e2e8f0' }}>
                          {u.nombre[0]}{u.apellido[0]}
                        </div>
                        <div>
                          <div className={styles.userName}>{u.nombre} {u.apellido}</div>
                          {u.perfil?.especialidad && <div className={styles.userSub}>{u.perfil.especialidad.nombre}</div>}
                        </div>
                      </div>
                    </td>
                    <td className={styles.email}>{u.email}</td>
                    <td>
                      <span className={styles.badge} style={{ background: rc.bg, color: rc.color, borderColor: rc.border }}>
                        {ROLES_LABEL[u.rol]}
                      </span>
                    </td>
                    <td>
                      <span className={styles.badge} style={u.activo
                        ? { background: '#f0fdf4', color: '#15803d', borderColor: '#bbf7d0' }
                        : { background: '#fef2f2', color: '#b91c1c', borderColor: '#fecaca' }}>
                        {u.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actionBtns}>
                        {(u.rol === 'medico' || u.rol === 'secretaria') && (
                          <button className={styles.btnEditar} onClick={() => setEditando(u)}>
                            Editar
                          </button>
                        )}
                        <button
                          className={u.activo ? styles.btnDesactivar : styles.btnActivar}
                          onClick={() => handleToggle(u)}>
                          {u.activo ? 'Desactivar' : 'Reactivar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Paginación */}
      {!loading && visibles.length > POR_PAGINA && (
        <div className={styles.pagination}>
          <span className={styles.pageInfo}>
            {(pagina - 1) * POR_PAGINA + 1}–{Math.min(pagina * POR_PAGINA, visibles.length)} de {visibles.length} usuarios
          </span>

          <div className={styles.pageControls}>
            <button className={styles.pageBtn} onClick={() => setPagina(1)} disabled={pagina === 1} title="Primera">«</button>
            <button className={styles.pageBtn} onClick={() => setPagina(p => p - 1)} disabled={pagina === 1} title="Anterior">‹</button>

            {Array.from({ length: totalPaginas }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPaginas || Math.abs(p - pagina) <= 1)
              .reduce((acc, p, idx, arr) => {
                if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
                acc.push(p);
                return acc;
              }, [])
              .map((item, idx) =>
                item === '...'
                  ? <span key={`sep-${idx}`} className={styles.pageSep}>…</span>
                  : <button key={item}
                      className={`${styles.pageBtn} ${item === pagina ? styles.pageBtnActive : ''}`}
                      onClick={() => setPagina(item)}>
                      {item}
                    </button>
              )}

            <button className={styles.pageBtn} onClick={() => setPagina(p => p + 1)} disabled={pagina === totalPaginas} title="Siguiente">›</button>
            <button className={styles.pageBtn} onClick={() => setPagina(totalPaginas)} disabled={pagina === totalPaginas} title="Última">»</button>
          </div>
        </div>
      )}

      {/* Modal edición */}
      {editando && (
        <EditModal
          usuario={editando}
          especialidades={especialidades}
          onClose={() => setEditando(null)}
          onSaved={handleEditSaved}
        />
      )}
    </div>
  );
};

export default UsuariosTab;
