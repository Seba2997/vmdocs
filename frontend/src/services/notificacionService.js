import api from './api';

const notificacionService = {
  getNotificaciones: async () => {
    try {
      const response = await api.get('/notificaciones/');
      return response.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error.response?.data?.detail || 'Error al obtener notificaciones';
    }
  },

  marcarComoLeida: async (id) => {
    try {
      const response = await api.patch(`/notificaciones/${id}/leer`);
      return response.data;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error.response?.data?.detail || 'Error al marcar notificación como leída';
    }
  },

  marcarTodasComoLeidas: async () => {
    try {
      const response = await api.patch('/notificaciones/leer_todas');
      return response.data;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error.response?.data?.detail || 'Error al marcar todas las notificaciones como leídas';
    }
  },
};

export default notificacionService;
