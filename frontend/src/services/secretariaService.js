import api from './authService';

export const getDashboardStats = async () => {
  const { data } = await api.get('/secretaria/stats');
  return data;
};

export const getMisMedicos = async () => {
  const { data } = await api.get('/secretaria/mis-medicos');
  return data;
};

export const getAtencionByCita = async (citaId) => {
  const { data } = await api.get(`/atenciones/cita/${citaId}`);
  return data;
};

export const getAtenciones = async () => {
  const { data } = await api.get('/secretaria/atenciones');
  return data;
};

export const getInformeDiario = async (fechaInicio, fechaFin, medicoId) => {
  const params = new URLSearchParams({ fechaInicio, fechaFin: fechaFin || fechaInicio });
  if (medicoId) params.append('medicoId', medicoId);
  const { data } = await api.get(`/secretaria/informe-diario?${params}`);
  return data;
};
