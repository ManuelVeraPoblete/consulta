import api from './authService';

export const listarUsuarios = async (filtros = {}) => {
  const params = new URLSearchParams();
  if (filtros.rol) params.append('rol', filtros.rol);
  if (filtros.activo !== undefined) params.append('activo', filtros.activo);
  const { data } = await api.get(`/admin/usuarios?${params}`);
  return data.usuarios;
};

export const crearUsuario = async (payload) => {
  const { data } = await api.post('/admin/usuarios', payload);
  return data.usuario;
};

export const crearMedico = async (payload) => {
  const { data } = await api.post('/admin/medicos', payload);
  return data.usuario;
};

export const crearSecretaria = async (payload) => {
  const { data } = await api.post('/admin/secretarias', payload);
  return data.usuario;
};

export const listarMedicos = async () => {
  const { data } = await api.get('/admin/usuarios?rol=medico&activo=true');
  return data.usuarios;
};

export const listarPrevisiones = async () => {
  const { data } = await api.get('/admin/previsiones');
  return data.previsiones;
};

export const listarEspecialidades = async () => {
  const { data } = await api.get('/admin/especialidades');
  return data.especialidades;
};

export const actualizarUsuario = async (id, payload) => {
  const { data } = await api.put(`/admin/usuarios/${id}`, payload);
  return data.usuario;
};

export const actualizarMedicosSecretaria = async (id, medico_ids) => {
  const { data } = await api.put(`/admin/secretarias/${id}/medicos`, { medico_ids });
  return data.usuario;
};

export const desactivarUsuario = async (id) => {
  const { data } = await api.patch(`/admin/usuarios/${id}/desactivar`);
  return data;
};

export const reactivarUsuario = async (id) => {
  const { data } = await api.patch(`/admin/usuarios/${id}/reactivar`);
  return data;
};
