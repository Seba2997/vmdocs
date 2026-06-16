import api from './api';

const iaService = {
  /**
   * Genera o recupera el resumen de un documento usando IA.
   * @param {number} documentoId
   * @param {boolean} forzar - Si es true, fuerza la regeneración ignorando la caché.
   */
  generarResumen: (documentoId, forzar = false) => {
    return api.post(`/documentos/${documentoId}/ia/resumen?forzar=${forzar}`);
  },

  /**
   * Genera o recupera la ficha estructurada de un documento usando IA.
   * @param {number} documentoId
   * @param {boolean} forzar - Si es true, fuerza la regeneración ignorando la caché.
   */
  generarFicha: (documentoId, forzar = false) => {
    return api.post(`/documentos/${documentoId}/ia/ficha?forzar=${forzar}`);
  },

  /**
   * Realiza una pregunta al documento usando IA. (No se cachea)
   * @param {number} documentoId
   * @param {string} pregunta - La pregunta a realizar.
   */
  preguntarDocumento: (documentoId, pregunta) => {
    return api.post(`/documentos/${documentoId}/ia/pregunta`, { pregunta });
  }
};

export default iaService;
