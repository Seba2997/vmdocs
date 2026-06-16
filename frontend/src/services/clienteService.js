import api from './api';

const ClienteService = {
  listar: ()             => api.get('/clientes/obtener_todos'),
  listarInactivos: ()    => api.get('/clientes/obtener_inactivos'),
  obtener: (id)          => api.get(`/clientes/obtener_cliente/${id}`),
  crear:  (data)         => api.post('/clientes/crear_cliente', data),
  actualizar: (id, data) => api.put(`/clientes/actualizar_cliente/${id}`, data),
  toggleActivo: (id)     => api.patch(`/clientes/switch_cliente/${id}`),
};

export default ClienteService;
