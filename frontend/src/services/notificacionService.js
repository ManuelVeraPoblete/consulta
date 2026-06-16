import api from './authService';

export const getDestinatarios = async () => {
  const { data } = await api.get('/notificaciones/destinatarios');
  return data;
};

export const enviarNotificacion = async ({ receptor_ids, titulo, mensaje }) => {
  const { data } = await api.post('/notificaciones/enviar', { receptor_ids, titulo, mensaje });
  return data;
};

export const getMisNotificaciones = async (limit = 30) => {
  const { data } = await api.get(`/notificaciones/mis-notificaciones?limit=${limit}`);
  return data;
};

export const contarNoLeidas = async () => {
  const { data } = await api.get('/notificaciones/no-leidas/count');
  return data.count;
};

export const marcarLeida = async (id) => {
  await api.patch(`/notificaciones/${id}/leer`);
};

export const marcarTodasLeidas = async () => {
  await api.patch('/notificaciones/leer-todas');
};
