import api from './authService';

export const listarPacientes = async (filtros = {}) => {
  const params = new URLSearchParams();
  if (filtros.busqueda) params.append('busqueda', filtros.busqueda);
  if (filtros.activo !== undefined) params.append('activo', filtros.activo);
  const { data } = await api.get(`/pacientes?${params}`);
  return data;
};

export const crearPaciente = async (payload) => {
  const { data } = await api.post('/pacientes', payload);
  return data;
};

export const actualizarPaciente = async (id, payload) => {
  const { data } = await api.put(`/pacientes/${id}`, payload);
  return data;
};

export const desactivarPaciente = async (id) => {
  const { data } = await api.patch(`/pacientes/${id}/off`);
  return data;
};

export const reactivarPaciente = async (id) => {
  const { data } = await api.patch(`/pacientes/${id}/on`);
  return data;
};
