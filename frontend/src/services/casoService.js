import api from './api';

const CasoService = {
  listar: () => api.get('/casos/obtener_todos'),
  listarInactivos: () => api.get('/casos/obtener_inactivos'),
  obtener: (id) => api.get(`/casos/obtener_caso/${id}`),
  listarPorCliente: (clienteId) => api.get(`/casos/obtener_por_cliente/${clienteId}`),
  crear: (data) => api.post('/casos/crear_caso', data),
  actualizar: (id, data) => api.put(`/casos/actualizar_caso/${id}`, data),
  cambiarFase: (id, estado) => api.patch(`/casos/fase_caso/${id}`, { estado }),
  toggleActivo: (id) => api.patch(`/casos/switch_caso/${id}`),
  // Asignaciones N:M
  listarUsuarios: (casoId) => api.get(`/casos/${casoId}/usuarios`),
  asignarUsuario: (casoId, usuarioId) => api.post(`/casos/${casoId}/usuarios/${usuarioId}`),
  desasignarUsuario: (casoId, usuarioId) => api.delete(`/casos/${casoId}/usuarios/${usuarioId}`),
  // Notas / Bitácora
  listarNotas: (casoId) => api.get(`/casos/${casoId}/notas`),
  crearNota: (casoId, data) => api.post(`/casos/${casoId}/notas`, data),
  actualizarNota: (notaId, data) => api.put(`/casos/notas/${notaId}`, data),
  eliminarNota: (notaId) => api.delete(`/casos/notas/${notaId}`),
};

export default CasoService;
