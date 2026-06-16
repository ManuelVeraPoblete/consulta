import api from './authService';

export const getMedicoDashboard = async () => {
  const { data } = await api.get('/medicos/dashboard');
  return data;
};

export const getMisCitas = async (fecha) => {
  const params = new URLSearchParams();
  if (fecha) params.append('fecha', fecha);
  const { data } = await api.get(`/medicos/citas?${params}`);
  return data;
};

export const crearAtencion = async (payload) => {
  const { data } = await api.post('/atenciones', payload);
  return data;
};

export const getAtencionByCita = async (citaId) => {
  const { data } = await api.get(`/atenciones/cita/${citaId}`);
  return data;
};

export const buscarMedicos = async ({ especialidad = '', nombre = '', modalidad = '' } = {}) => {
  const params = new URLSearchParams();
  if (especialidad) params.append('especialidad', especialidad);
  if (nombre)       params.append('nombre', nombre);
  if (modalidad)    params.append('modalidad', modalidad);

  const { data } = await api.get(`/medicos/buscar?${params.toString()}`);
  return data;
};

export const getEspecialidades = async () => {
  const { data } = await api.get('/medicos/especialidades');
  return data;
};

export const getHistorialPaciente = async (pacienteId) => {
  const { data } = await api.get(`/atenciones/paciente/${pacienteId}`);
  return data;
};

export const buscarMedicamentos = async (q) => {
  const { data } = await api.get(`/medicamentos/buscar?q=${encodeURIComponent(q)}`);
  return data;
};

export const getMisPacientes = async (busqueda = '') => {
  const params = new URLSearchParams();
  if (busqueda) params.append('busqueda', busqueda);
  const { data } = await api.get(`/medicos/pacientes?${params}`);
  return data;
};

export const getEstadoAgenda = async (year, month) => {
  const { data } = await api.get(`/medicos/agenda/estado?year=${year}&month=${month}`);
  return data;
};

export const crearRegistroAgenda = async (payload) => {
  const { data } = await api.post('/medicos/agenda/registro', payload);
  return data;
};

export const eliminarRegistroAgenda = async (id) => {
  const { data } = await api.delete(`/medicos/agenda/registro/${id}`);
  return data;
};

export const verificarDisponibilidadAgenda = async (medicoId, fecha) => {
  const { data } = await api.get(`/medicos/agenda/disponibilidad?medicoId=${medicoId}&fecha=${fecha}`);
  return data;
};

export const getMisRecetas = async (busqueda = '') => {
  const params = new URLSearchParams();
  if (busqueda) params.append('busqueda', busqueda);
  const { data } = await api.get(`/medicos/recetas?${params}`);
  return data;
};

export const getMisOrdenes = async ({ busqueda = '', estado = '' } = {}) => {
  const params = new URLSearchParams();
  if (busqueda) params.append('busqueda', busqueda);
  if (estado)   params.append('estado', estado);
  const { data } = await api.get(`/ordenes/mis-ordenes?${params}`);
  return data;
};

export const crearOrden = async (payload) => {
  const { data } = await api.post('/ordenes', payload);
  return data;
};

export const actualizarEstadoOrden = async (id, estado) => {
  const { data } = await api.patch(`/ordenes/${id}/estado`, { estado });
  return data;
};
