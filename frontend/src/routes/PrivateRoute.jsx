import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLE_PATHS = {
  admin:      '/admin/dashboard',
  medico:     '/medico/dashboard',
  secretaria: '/secretaria/dashboard',
  paciente:   '/paciente/dashboard',
};

export const PrivateRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/" replace />;

  if (allowedRoles && !allowedRoles.includes(user.rol)) {
    const redirect = ROLE_PATHS[user.rol] || '/';
    return <Navigate to={redirect} replace />;
  }

  return children;
};

export const PublicOnlyRoute = ({ children }) => {
  const { user, logout } = useAuth();

  if (user) {
    const redirect = ROLE_PATHS[user.rol];
    // Si el rol almacenado no es válido, limpiar sesión y mostrar login
    if (!redirect) {
      logout();
      return children;
    }
    return <Navigate to={redirect} replace />;
  }

  return children;
};
