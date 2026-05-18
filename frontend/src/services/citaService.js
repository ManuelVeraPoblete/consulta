import api from './authService';

export const crearCita = async (payload) => {
  const { data } = await api.post('/citas', payload);
  return data;
};

export const listarCitas = async (filtros = {}) => {
  const params = new URLSearchParams();
  if (filtros.medico_id)    params.append('medico_id',    filtros.medico_id);
  if (filtros.fecha_inicio) params.append('fecha_inicio', filtros.fecha_inicio);
  if (filtros.fecha_fin)    params.append('fecha_fin',    filtros.fecha_fin);
  if (filtros.estado)       params.append('estado',       filtros.estado);
  const { data } = await api.get(`/citas?${params}`);
  return data;
};

export const reagendarCita = async (id, payload) => {
  const { data } = await api.patch(`/citas/${id}/reagendar`, payload);
  return data;
};

export const cancelarCita = async (id) => {
  const { data } = await api.patch(`/citas/${id}/cancelar`);
  return data;
};
