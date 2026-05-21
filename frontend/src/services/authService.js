// frontend/src/services/authService.js

import axios from 'axios';

/**
 * URL base de la API.
 *
 * En producción Render usa:
 * VITE_API_URL=https://consulta-api-2g52.onrender.com/api
 *
 * En desarrollo local usa /api, útil si tienes proxy configurado en Vite.
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Cliente HTTP centralizado para toda la comunicación con el backend.
 */
const api = axios.create({
  baseURL: API_BASE_URL,
});

/**
 * Interceptor para agregar el token JWT en cada petición autenticada.
 */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

/**
 * Interceptor para limpiar sesión cuando el backend responde 401.
 */
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }

    return Promise.reject(err);
  }
);

/**
 * Inicia sesión contra el backend.
 */
export const login = async (email, password) => {
  const { data } = await api.post('/auth/login', {
    email,
    password,
  });

  return data;
};

/**
 * Registra un nuevo usuario.
 */
export const register = async (userData) => {
  const { data } = await api.post('/auth/register', userData);
  return data;
};

/**
 * Obtiene el perfil del usuario autenticado.
 */
export const getProfile = async () => {
  const { data } = await api.get('/auth/profile');
  return data;
};

export default api;