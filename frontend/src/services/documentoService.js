import api from './api';

const documentoService = {
  /**
   * Lista los documentos activos de un caso específico.
   * El backend verifica que el usuario tenga acceso al caso.
   */
  listarPorCaso: (casoId) => {
    return api.get(`/documentos/caso/${casoId}`);
  },

  /**
   * Sube un documento asociado a un caso.
   * @param {number} casoId 
   * @param {File} archivo 
   */
  subir: (casoId, archivo) => {
    const formData = new FormData();
    formData.append('archivo', archivo);

    return api.post(`/documentos/subir/${casoId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  /**
   * Obtiene una URL firmada temporal para descargar o visualizar el documento.
   * @param {number} documentoId
   * @param {string} modo 'descargar' o 'ver'
   */
  obtenerSignedUrl: (documentoId, modo = 'descargar') => {
    return api.get(`/documentos/descargar/${documentoId}?modo=${modo}`);
  },

  /**
   * Cambia el estado activo/inactivo de un documento (toggle).
   * USER: solo puede gestionar documentos que él mismo subió y debe estar asignado al caso.
   * ADMIN: puede gestionar cualquier documento.
   */
  toggleEstado: (documentoId) => {
    return api.patch(`/documentos/switch/${documentoId}`);
  },

  /**
   * Obtiene la metadata de un documento por su ID.
   */
  obtenerPorId: (documentoId) => {
    return api.get(`/documentos/${documentoId}`);
  },

  /**
   * Lista los documentos inactivos (papelera) de un caso.
   */
  listarPapelera: (casoId) => {
    return api.get(`/documentos/caso/${casoId}/papelera`);
  },

  /**
   * Elimina permanentemente un documento de la papelera.
   */
  eliminarPermanente: (documentoId) => {
    return api.delete(`/documentos/${documentoId}/permanente`);
  }
};

export default documentoService;
