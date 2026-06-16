import api from './api';

const UsuarioService = {
  listarTodos: () => api.get('/usuarios/obtenertodos/'),
  obtener: (id) => api.get(`/usuarios/obtenerusuario/${id}`),
};

export default UsuarioService;
