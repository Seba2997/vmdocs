import api from './api';

const passwordRecoveryService = {
  forgotPassword: async (email) => {
    try {
      const response = await api.post('/auth/forgot-password', { email });
      return response.data;
    } catch (error) {
      throw error.response?.data?.detail || 'Error al procesar la solicitud';
    }
  },

  getTokenInfo: async (token) => {
    try {
      const response = await api.get(`/auth/token-info/${token}`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.detail || 'Error al obtener información del token';
    }
  },

  resetPassword: async (token, newPassword, confirmPassword) => {
    try {
      const response = await api.post('/auth/reset-password', {
        token,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data?.detail || 'Error al restablecer la contraseña';
    }
  },
};

export default passwordRecoveryService;
