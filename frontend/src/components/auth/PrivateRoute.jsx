import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

/**
 * Protege rutas privadas verificando la existencia del token JWT.
 * Si no hay token, redirige al login.
 */
const PrivateRoute = () => {
  const token = localStorage.getItem('access_token');
  return token ? <Outlet /> : <Navigate to="/login" replace />;
};

export default PrivateRoute;
