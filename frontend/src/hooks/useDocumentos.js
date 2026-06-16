import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import documentoService from '../services/documentoService';

export const useDocumentos = (casoId) => {
  const [documentos, setDocumentos] = useState([]);
  const [papelera, setPapelera] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const fetchDocumentos = useCallback(async () => {
    if (!casoId) return;
    setLoading(true);
    try {
      const response = await documentoService.listarPorCaso(casoId);
      setDocumentos(response.data);
    } catch (error) {
      console.error('Error al cargar documentos:', error);
      toast.error('No se pudieron cargar los documentos del caso.');
    } finally {
      setLoading(false);
    }
  }, [casoId]);

  const fetchPapelera = useCallback(async () => {
    if (!casoId) return;
    try {
      const response = await documentoService.listarPapelera(casoId);
      setPapelera(response.data);
    } catch (error) {
      console.error('Error al cargar papelera:', error);
      toast.error('No se pudo cargar la papelera de reciclaje.');
    }
  }, [casoId]);

  const uploadDocumento = async (archivo) => {
    if (!casoId || !archivo) return;
    setIsUploading(true);
    try {
      const response = await documentoService.subir(casoId, archivo);
      toast.success('Documento subido correctamente.');
      setDocumentos(prev => [response.data, ...prev]);
      return response.data;
    } catch (error) {
      const msg = error.response?.data?.detail || 'Error al subir el documento.';
      toast.error(msg);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const toggleDocumento = async (documentoId) => {
    try {
      const docToDelete = documentos.find(d => d.id === documentoId);
      await documentoService.toggleEstado(documentoId);
      
      // Actualización optimista
      setDocumentos(prev => prev.filter(doc => doc.id !== documentoId));
      if (docToDelete) {
        setPapelera(prev => [docToDelete, ...prev]);
      }
      
      toast.success('Documento enviado a la papelera.');
      fetchPapelera(); // Sincronizar papelera de fondo
    } catch (error) {
      const msg = error.response?.data?.detail || 'Error al procesar la acción.';
      toast.error(msg);
      throw error;
    }
  };

  const restaurarDocumento = async (documentoId) => {
    try {
      const docToRestore = papelera.find(d => d.id === documentoId);
      await documentoService.toggleEstado(documentoId);
      
      // Actualización optimista de los estados
      setPapelera(prev => prev.filter(doc => doc.id !== documentoId));
      if (docToRestore) {
        setDocumentos(prev => [docToRestore, ...prev]);
      }
      
      toast.success('Documento restaurado.');
      // Refrescar de fondo para sincronizar con el servidor
      fetchDocumentos();
    } catch (error) {
      const msg = error.response?.data?.detail || 'Error al restaurar el documento.';
      toast.error(msg);
      throw error;
    }
  };

  const eliminarPermanente = async (documentoId) => {
    try {
      await documentoService.eliminarPermanente(documentoId);
      setPapelera(prev => prev.filter(doc => doc.id !== documentoId));
      toast.success('Documento eliminado permanentemente.');
    } catch (error) {
      const msg = error.response?.data?.detail || 'Error al eliminar definitivamente.';
      toast.error(msg);
      throw error;
    }
  };

  const descargarDocumento = async (documentoId, nombreArchivo, forzarDescarga = true) => {
    try {
      const modo = forzarDescarga ? 'descargar' : 'ver';
      const response = await documentoService.obtenerSignedUrl(documentoId, modo);
      const { signed_url } = response.data;
      
      if (forzarDescarga) {
        const link = document.createElement('a');
        link.href = signed_url;
        link.setAttribute('download', nombreArchivo);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        const ext = nombreArchivo.split('.').pop().toLowerCase();
        if (['doc', 'docx', 'xls', 'xlsx'].includes(ext)) {
          window.open(`https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(signed_url)}`, '_blank');
        } else {
          window.open(signed_url, '_blank');
        }
      }
    } catch (error) {
      const msg = error.response?.data?.detail || 'Error al obtener el enlace de descarga.';
      toast.error(msg);
    }
  };

  useEffect(() => {
    fetchDocumentos();
    fetchPapelera();
  }, [fetchDocumentos, fetchPapelera]);

  return {
    documentos,
    papelera,
    cargando: loading,
    subiendo: isUploading,
    fetchDocumentos,
    fetchPapelera,
    subirDocumento: uploadDocumento,
    eliminarDocumento: toggleDocumento,
    restaurarDocumento,
    eliminarDefinitivamente: eliminarPermanente,
    obtenerUrlTemporal: (documentoId) => {
      return documentoService.obtenerSignedUrl(documentoId, 'ver').then(resp => resp.data.signed_url);
    },
    descargarDocumento
  };
};
