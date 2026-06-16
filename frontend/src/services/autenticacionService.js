import api from './api';

const AutenticacionService = {
  /**
   * Envía las credenciales al backend (FastAPI) para obtener un token JWT.
   * FastAPI requiere el formato x-www-form-urlencoded debido a OAuth2PasswordRequestForm.
   *
   * @param {string} email - Se mapea al campo 'username' esperado por FastAPI
   * @param {string} password - Contraseña
   * @returns {Promise<string>} El token de acceso JWT
   */
  login: async (email, password) => {
    // Transformamos los datos a formato URL Encoded
    const formData = new URLSearchParams();
    formData.append('username', email); // FastAPI OAuth2 espera la variable "username"
    formData.append('password', password);

    const respuesta = await api.post('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    return respuesta.data.access_token;
  },
};

export default AutenticacionService;
