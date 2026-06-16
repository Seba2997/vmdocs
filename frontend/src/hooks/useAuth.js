import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AutenticacionService from '../services/autenticacionService';
import api from '../services/api';

export const useAuth = () => {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const iniciarSesion = async (email, password) => {
    setCargando(true);
    setError(null);
    try {
      const token = await AutenticacionService.login(email, password);
      localStorage.setItem('access_token', token);

      // Decodificar user_id del JWT (sub) y obtener perfil completo (con rol)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userId = payload.sub;
      const perfilResp = await api.get(`/usuarios/obtenerusuario/${userId}`);
      localStorage.setItem('user_profile', JSON.stringify(perfilResp.data));

      navigate('/dashboard');
      return true;
    } catch (err) {
      const mensajeError = err.response?.data?.detail || 'Error al iniciar sesión. Intenta de nuevo.';
      setError(mensajeError);
      return false;
    } finally {
      setCargando(false);
    }
  };

  const cerrarSesion = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_profile');
    navigate('/login', { replace: true });
  };

  return {
    iniciarSesion,
    cerrarSesion,
    cargando,
    error
  };
};
