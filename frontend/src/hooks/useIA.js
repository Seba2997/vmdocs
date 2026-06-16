import { useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import iaService from '../services/iaService';

export const useIA = () => {
  const [resumen, setResumen] = useState(null);
  const [ficha, setFicha] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  
  const [loadingAnalisis, setLoadingAnalisis] = useState(false);
  const [loadingPregunta, setLoadingPregunta] = useState(false);

  /**
   * Obtiene el resumen y la ficha del documento en paralelo
   */
  const cargarAnalisisBasico = useCallback(async (documentoId, forzar = false) => {
    if (!documentoId) return;
    
    setLoadingAnalisis(true);
    setResumen(null);
    setFicha(null);
    
    try {
      // Ejecutar ambas peticiones en paralelo para mayor rapidez
      const [resResumen, resFicha] = await Promise.all([
        iaService.generarResumen(documentoId, forzar),
        iaService.generarFicha(documentoId, forzar)
      ]);
      
      setResumen(resResumen.data);
      setFicha(resFicha.data);
    } catch (error) {
      console.error('Error al cargar análisis IA:', error);
      const msg = error.response?.data?.detail || 'Error al conectar con la IA. El documento puede no ser compatible.';
      toast.error(msg);
    } finally {
      setLoadingAnalisis(false);
    }
  }, []);

  /**
   * Envía una pregunta a la IA y actualiza el historial del chat
   */
  const preguntar = useCallback(async (documentoId, preguntaTexto) => {
    if (!documentoId || !preguntaTexto.trim()) return;
    
    const preguntaId = Date.now();
    const nuevaPregunta = { id: preguntaId, role: 'user', content: preguntaTexto };
    
    // Agregamos la pregunta inmediatamente al historial
    setChatHistory(prev => [...prev, nuevaPregunta]);
    setLoadingPregunta(true);
    
    try {
      const response = await iaService.preguntarDocumento(documentoId, preguntaTexto);
      
      const respuestaIA = { 
        id: Date.now() + 1, 
        role: 'assistant', 
        content: response.data.respuesta 
      };
      
      setChatHistory(prev => [...prev, respuestaIA]);
      return respuestaIA;
    } catch (error) {
      console.error('Error al preguntar a IA:', error);
      const msg = error.response?.data?.detail || 'Error al obtener respuesta de la IA.';
      toast.error(msg);
      
      // Agregar un mensaje de error al chat
      setChatHistory(prev => [...prev, { 
        id: Date.now() + 1, 
        role: 'assistant', 
        content: '⚠️ Lo siento, ha ocurrido un error al procesar tu pregunta.',
        isError: true
      }]);
    } finally {
      setLoadingPregunta(false);
    }
  }, []);

  const limpiarChat = useCallback(() => {
    setChatHistory([]);
  }, []);

  return {
    resumen,
    ficha,
    chatHistory,
    loadingAnalisis,
    loadingPregunta,
    cargarAnalisisBasico,
    preguntar,
    limpiarChat
  };
};
