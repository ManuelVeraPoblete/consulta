// frontend/src/services/authService.js

import axios from 'axios';

/**
 * En producción Render usa VITE_API_URL.
 * En desarrollo local usa /api y Vite lo redirige mediante proxy a localhost:5000.
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Cliente HTTP centralizado para comunicar el frontend con el backend.
 */
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

/**
 * Si el backend responde 401, limpia la sesión local.
 */
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('user');
      window.location.href = '/';
    }

    return Promise.reject(err);
  }
);

export const login = async (email, password) => {
  const { data } = await api.post('/auth/login', {
    email,
    password,
  });

  return data;
};

export const register = async (userData) => {
  const { data } = await api.post('/auth/register', userData);
  return data;
};

export const getProfile = async () => {
  const { data } = await api.get('/auth/profile');
  return data;
};

export const logoutApi = async () => {
  await api.post('/auth/logout');
};

export default api;