import axios from 'axios';
import { toast } from 'react-toastify';

// Creamos una instancia de axios preconfigurada
const api = axios.create({
  // Lee la variable de entorno de Vite o usa localhost como respaldo seguro
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para inyectar el Token JWT en cada petición futura
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor de respuesta para manejar errores globales (como sesión expirada)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Si el servidor responde con 401 (No autorizado / Token expirado)
    if (error.response && error.response.status === 401) {
      // Solo actuar si no estamos ya en la página de login
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_profile');
        
        // Mostrar mensaje al usuario (solo una vez)
        if (!toast.isActive('session-expired')) {
          toast.error('Su sesión ha expirado. Por favor, inicie sesión nuevamente.', {
            toastId: 'session-expired',
            position: "bottom-center",
            autoClose: 4000
          });
        }

        // Redirigir después de un delay suficiente para leer el mensaje
        setTimeout(() => {
          window.location.href = '/login';
        }, 4500);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
