import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PrivateRoute, PublicOnlyRoute } from './routes/PrivateRoute';
import Login from './pages/Login';
import MedicoDashboard from './pages/MedicoDashboard';
import SecretariaDashboard from './pages/SecretariaDashboard';
import PacienteDashboard from './pages/PacienteDashboard';
import AdminDashboard from './pages/AdminDashboard';

const App = () => (
  <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <AuthProvider>
      <Routes>
        <Route
          path="/"
          element={
            <PublicOnlyRoute>
              <Login />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/medico/dashboard"
          element={
            <PrivateRoute allowedRoles={['medico']}>
              <MedicoDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/secretaria/dashboard"
          element={
            <PrivateRoute allowedRoles={['secretaria']}>
              <SecretariaDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/paciente/dashboard"
          element={
            <PrivateRoute allowedRoles={['paciente']}>
              <PacienteDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            <PrivateRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  </BrowserRouter>
);

export default App;
