import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import PapeleraReciclajeModal from '../components/documentos/PapeleraReciclajeModal';
import AnalisisIAModal from '../components/documentos/AnalisisIAModal';
import { useDocumentos } from '../hooks/useDocumentos';
import CasoService from '../services/casoService';

const getFileIcon = (fileName) => {
  const ext = fileName?.split('.').pop().toLowerCase();
  if (['pdf'].includes(ext)) return { icon: 'picture_as_pdf', color: '#E53935', type: 'PDF' };
  if (['doc', 'docx'].includes(ext)) return { icon: 'description', color: '#1E88E5', type: 'DOCX' };
  if (['csv', 'xlsx', 'xls'].includes(ext)) return { icon: 'table', color: '#43A047', type: 'EXCEL' };
  if (['zip', 'rar'].includes(ext)) return { icon: 'folder_zip', color: '#FFA000', type: 'COMPRESSED' };
  if (['jpg', 'png', 'jpeg'].includes(ext)) return { icon: 'image', color: '#8E24AA', type: 'IMAGE' };
  return { icon: 'insert_drive_file', color: '#757575', type: 'FILE' };
};

const formatSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });
};


const Documentos = ({ isEmbedded = false, caseTitle = '', casoId = null, isPapeleraOpen: externalIsPapeleraOpen, setIsPapeleraOpen: externalSetIsPapeleraOpen }) => {
  const [selectedCasoId, setSelectedCasoId] = useState(casoId);
  const [casos, setCasos] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('fecha_subida');
  const [sortOrder, setSortOrder] = useState('desc');
  const [internalIsPapeleraOpen, setInternalIsPapeleraOpen] = useState(false);
  const isPapeleraOpen = externalIsPapeleraOpen !== undefined ? externalIsPapeleraOpen : internalIsPapeleraOpen;
  const setIsPapeleraOpen = externalSetIsPapeleraOpen !== undefined ? externalSetIsPapeleraOpen : setInternalIsPapeleraOpen;
  const [isIAModalOpen, setIsIAModalOpen] = useState(false);
  const [iaDocumentoSelected, setIaDocumentoSelected] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loadingAction, setLoadingAction] = useState(null); // 'view', 'download', 'delete'
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef(null);

  const {
    documentos,
    papelera,
    cargando,
    subiendo,
    fetchDocumentos,
    fetchPapelera,
    subirDocumento,
    eliminarDocumento,
    restaurarDocumento,
    eliminarDefinitivamente,
    obtenerUrlTemporal,
    descargarDocumento,
  } = useDocumentos(selectedCasoId);

  useEffect(() => {
    if (!isEmbedded) {
      const cargarCasos = async () => {
        try {
          const resp = await CasoService.listar();
          setCasos(resp.data);
          if (resp.data.length > 0 && !selectedCasoId) {
            setSelectedCasoId(resp.data[0].id);
          }
        } catch (error) {
          toast.error('Error al cargar la lista de casos');
        }
      };
      cargarCasos();
    }
  }, [isEmbedded]);

  useEffect(() => {
    if (casoId) setSelectedCasoId(casoId);
  }, [casoId]);

  useEffect(() => {
    // Seleccionar automáticamente el primer documento cuando se carga la lista
    if (documentos.length > 0 && !selectedDoc) {
      setSelectedDoc(documentos[0]);
    } else if (documentos.length === 0) {
      setSelectedDoc(null);
      setPreviewUrl(null);
    }
  }, [documentos]);

  useEffect(() => {
    let active = true;
    const cargarPreview = async () => {
      if (selectedDoc) {
        setPreviewUrl(null); // Limpiar previa anterior inmediatamente
        try {
          const url = await obtenerUrlTemporal(selectedDoc.id);
          if (active) setPreviewUrl(url);
        } catch (error) {
          if (active) setPreviewUrl('error');
        }
      } else {
        setPreviewUrl(null);
      }
    };
    cargarPreview();
    return () => { active = false; };
  }, [selectedDoc]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const filteredDocuments = documentos.filter(doc =>
    doc.nombre_original.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.tipo_mime.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedDocuments = [...filteredDocuments].sort((a, b) => {
    let valA = a[sortBy];
    let valB = b[sortBy];

    if (sortBy === 'nombre_original') {
      valA = a.nombre_original.toLowerCase();
      valB = b.nombre_original.toLowerCase();
    } else if (sortBy === 'fecha_subida') {
      valA = new Date(a.fecha_subida || 0).getTime();
      valB = new Date(b.fecha_subida || 0).getTime();
    }

    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const renderSortIndicator = (field) => {
    if (sortBy !== field) return <span className="material-symbols-outlined text-[14px] opacity-30 ml-1 align-middle">unfold_more</span>;
    return <span className="material-symbols-outlined text-[14px] ml-1 align-middle">{sortOrder === 'asc' ? 'arrow_downward' : 'arrow_upward'}</span>;
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      await subirDocumento(file);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      // Error ya manejado en el hook
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!subiendo) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (subiendo) return;
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0]; // Solo procesamos el primero por ahora
      try {
        await subirDocumento(file);
      } catch (error) {
        // Error ya manejado en el hook
      }
    }
  };

  const handleDeleteClick = async (e, doc) => {
    e.stopPropagation();
    try {
      await eliminarDocumento(doc.id);
      if (selectedDoc?.id === doc.id) {
        setSelectedDoc(null);
        setPreviewUrl(null);
      }
    } catch (error) {
      // Error ya manejado en el hook
    }
  };

  const handleOpenIA = (e, doc) => {
    e.stopPropagation();
    setIaDocumentoSelected(doc);
    setIsIAModalOpen(true);
  };

  const handleDownload = async (doc, forceDownload = false) => {
    if (!doc || loadingAction) return;
    setLoadingAction(forceDownload ? 'download' : 'view');
    try {
      await descargarDocumento(doc.id, doc.nombre_original, forceDownload);
    } catch (error) {
      console.error('Error al procesar acción de documento:', error);
    } finally {
      setLoadingAction(null);
    }
  };


  return (
    <div className={isEmbedded ? "" : "p-margin-page max-w-7xl mx-auto"}>
      {/* Page Header - Removed */}

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter-table">
        {/* Left Column (Upload & Table) */}
        <div className="lg:col-span-8 space-y-gutter-table flex flex-col">
          {/* Upload Area */}
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 mb-gutter-table shadow-sm">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              accept=".pdf,.docx,.doc,.csv,.xlsx,.xls,.png,.jpg,.jpeg,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv,image/png,image/jpeg"
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center transition-all cursor-pointer group ${
                subiendo 
                  ? 'opacity-50 cursor-wait border-outline-variant' 
                  : isDragging 
                    ? 'bg-primary-container/20 border-primary shadow-inner scale-[0.99]' 
                    : 'border-outline-variant hover:bg-surface-container-low hover:border-primary-container'
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-stack-sm transition-colors ${
                isDragging 
                  ? 'bg-primary text-on-primary scale-110' 
                  : 'bg-surface-container-high text-on-surface-variant group-hover:bg-primary-fixed group-hover:text-primary'
              }`}>
                <span className={`material-symbols-outlined text-xl ${subiendo ? 'animate-spin' : ''}`}>
                  {subiendo ? 'progress_activity' : isDragging ? 'download' : 'cloud_upload'}
                </span>
              </div>
              <h3 className={`font-title-sm text-title-sm mb-stack-xs transition-colors ${isDragging ? 'text-primary' : 'text-on-surface-variant opacity-70'}`}>
                {subiendo ? 'Subiendo archivo...' : isDragging ? '¡Suelta el archivo aquí!' : 'Haz clic para buscar o arrastra tus documentos aquí'}
              </h3>
              <p className="font-body-sm text-[12px] text-on-surface-variant max-w-md">
                PDF, Word, Excel, CSV, Imágenes (Max 50MB)
              </p>
            </div>
          </div>


          {/* Data Table Container */}
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden flex flex-col flex-1 shadow-sm">
            {/* Table Header with Search and FIXED Case Label */}
            <div className="p-4 border-b border-surface-variant bg-surface-container-low flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="flex items-center gap-2 px-1">
                  <span className="material-symbols-outlined text-primary text-[18px]">gavel</span>
                  <span className="font-title-sm text-body-sm text-on-surface font-bold tracking-tight">
                    {isEmbedded ? `Documentos ${caseTitle}` : 'Gestión de Documentos'}
                  </span>
                </div>
                {!isEmbedded && (
                  <select
                    value={selectedCasoId || ''}
                    onChange={(e) => setSelectedCasoId(e.target.value)}
                    className="ml-2 bg-surface-container-lowest border border-outline-variant rounded px-2 py-1 text-xs font-medium focus:outline-none"
                  >
                    {casos.map(c => (
                      <option key={c.id} value={c.id}>{c.titulo}</option>
                    ))}
                  </select>
                )}
              </div>


              <div className="relative w-full md:w-72">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-[20px]">search</span>
                <input
                  type="text"
                  placeholder="Buscar documentos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-sm text-body-sm focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>

          {/* ── Vista Cards (móvil) ── */}
          <div className="lg:hidden flex flex-col gap-3 p-4">
            {cargando ? (
              <div className="text-center py-12 text-on-surface-variant">
                <span className="material-symbols-outlined animate-spin text-2xl inline-block">progress_activity</span>
                <p className="mt-2 text-sm">Cargando documentos...</p>
              </div>
            ) : sortedDocuments.length === 0 ? (
              <div className="text-center py-12 text-on-surface-variant">
                <span className="material-symbols-outlined text-4xl mb-2 block">folder_open</span>
                <p className="text-sm">{selectedCasoId ? 'No hay documentos en este caso' : 'Selecciona un caso'}</p>
              </div>
            ) : (
              sortedDocuments.map((doc) => {
                const fileInfo = getFileIcon(doc.nombre_original);
                return (
                  <div key={doc.id} className="bg-white border border-outline-variant rounded-xl p-4 flex flex-col gap-3 shadow-sm">
                    <div className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-3xl shrink-0" style={{ color: fileInfo.color, fontVariationSettings: "'FILL' 1" }}>
                        {fileInfo.icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-on-surface text-sm leading-snug break-words">{doc.nombre_original}</p>
                        <p className="text-xs text-on-surface-variant mt-0.5">{fileInfo.type} · {formatSize(doc.tamano)} · {formatDate(doc.fecha_subida)}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 border-t border-outline-variant pt-3">
                      <button
                        onClick={() => handleDownload(doc, false)}
                        className="flex-1 py-1.5 bg-surface-container-lowest border border-outline-variant rounded text-xs text-on-surface flex justify-center items-center gap-1 hover:bg-surface-container transition-colors"
                      >
                        <span className="material-symbols-outlined text-[16px]">visibility</span> Ver
                      </button>
                      <button
                        onClick={() => handleDownload(doc, true)}
                        className="flex-1 py-1.5 bg-surface-container-lowest border border-outline-variant rounded text-xs text-on-surface flex justify-center items-center gap-1 hover:bg-surface-container transition-colors"
                      >
                        <span className="material-symbols-outlined text-[16px]">download</span> Bajar
                      </button>
                      <button
                        onClick={(e) => handleOpenIA(e, doc)}
                        className="px-3 py-1.5 bg-surface-container-lowest border border-outline-variant rounded text-primary flex justify-center items-center hover:bg-primary/10 transition-colors"
                        title="Análisis IA"
                      >
                        <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                      </button>
                      <button
                        onClick={(e) => handleDeleteClick(e, doc)}
                        className="px-3 py-1.5 bg-surface-container-lowest border border-outline-variant rounded text-on-surface-variant flex justify-center items-center hover:bg-red-50 hover:text-error transition-colors"
                        title="Eliminar"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* ── Vista Tabla (desktop) ── */}
          <div className="hidden lg:block">

            {/* Fixed Table Header */}
            <div className="bg-surface-container-low border-b border-surface-variant z-10">
              <table className="w-full text-left border-collapse table-fixed">
                <thead>
                  <tr>
                    <th className="w-[40%] px-6 py-3 font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider cursor-pointer hover:bg-surface-variant/50 transition-colors" onClick={() => handleSort('nombre_original')}>
                      <div className="flex items-center">Nombre {renderSortIndicator('nombre_original')}</div>
                    </th>
                    <th className="w-[15%] px-6 py-3 font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider cursor-pointer hover:bg-surface-variant/50 transition-colors" onClick={() => handleSort('tipo_mime')}>
                      <div className="flex items-center">Tipo {renderSortIndicator('tipo_mime')}</div>
                    </th>
                    <th className="w-[15%] px-6 py-3 font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider cursor-pointer hover:bg-surface-variant/50 transition-colors" onClick={() => handleSort('fecha_subida')}>
                      <div className="flex items-center">Fecha {renderSortIndicator('fecha_subida')}</div>
                    </th>
                    <th className="w-[15%] px-6 py-3 font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider text-right cursor-pointer hover:bg-surface-variant/50 transition-colors" onClick={() => handleSort('tamano')}>
                      <div className="flex items-center justify-end">Tamaño {renderSortIndicator('tamano')}</div>
                    </th>
                    <th className="w-[15%] pl-6 pr-[34px] py-3 font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">
                      <div className="flex justify-center items-center">IA</div>
                    </th>
                  </tr>
                </thead>
              </table>
            </div>

            {/* Scrollable Table Body */}
            <div className="flex-1 max-h-[440px] overflow-y-auto relative scrollbar-slim">
              <div className="relative min-h-full">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary z-10"></div>
                <table className="w-full text-left border-collapse table-fixed relative">
                  <tbody className="font-table-cell text-table-cell text-on-surface divide-y divide-surface-variant">
                    {cargando ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-12 text-center text-on-surface-variant">
                          <span className="material-symbols-outlined animate-spin text-2xl inline-block">progress_activity</span>
                          <p className="mt-2">Cargando documentos...</p>
                        </td>
                      </tr>
                    ) : sortedDocuments.length > 0 ? (
                      sortedDocuments.map((doc) => {
                        const fileInfo = getFileIcon(doc.nombre_original);
                        return (
                          <tr key={doc.id} onClick={() => setSelectedDoc(doc)} className={`hover:bg-[#F0F7FF] transition-colors cursor-pointer group relative ${selectedDoc?.id === doc.id ? 'bg-[#F0F7FF]' : ''}`}>
                            <td className="w-[40%] px-6 py-4">
                              {selectedDoc?.id === doc.id && (
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#F0F7FF] z-20"></div>
                              )}
                              <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined flex-shrink-0" style={{ color: fileInfo.color, fontVariationSettings: "'FILL' 1" }}>{fileInfo.icon}</span>
                                <span className={`font-medium truncate ${selectedDoc?.id === doc.id ? 'text-primary' : ''}`}>{doc.nombre_original}</span>
                              </div>
                            </td>
                            <td className="w-[15%] px-6 py-4 text-on-surface-variant truncate">{fileInfo.type}</td>
                            <td className="w-[15%] px-6 py-4 text-on-surface-variant whitespace-nowrap">{formatDate(doc.fecha_subida)}</td>
                            <td className="w-[15%] px-6 py-4 text-right text-on-surface-variant">{formatSize(doc.tamano)}</td>
                            <td className="w-[15%] px-6 py-4 text-center">
                              <button
                                onClick={(e) => handleOpenIA(e, doc)}
                                className="text-primary hover:text-primary-container transition-colors w-8 h-8 rounded-full hover:bg-primary/10 flex items-center justify-center mx-auto"
                                title="Análisis de IA"
                              >
                                <span className="material-symbols-outlined text-[22px]">auto_awesome</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="5" className="h-[400px] text-center text-on-surface-variant opacity-60">
                          <div className="flex flex-col items-center justify-center h-full py-12">
                            <span className="material-symbols-outlined text-4xl mb-2">folder_open</span>
                            <p className="font-body-sm">{selectedCasoId ? 'No hay documentos en este caso' : 'Selecciona un caso para ver sus documentos'}</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div> {/* fin tabla desktop */}

          {/* Table Footer */}
          <div className="p-3 border-t border-surface-variant bg-surface-container-low flex justify-between items-center px-6">
            <span className="font-body-sm text-[12px] text-on-surface-variant">Mostrando {sortedDocuments.length} de {documentos.length} documentos</span>
            {!isEmbedded && (
              <button 
                onClick={() => setIsPapeleraOpen(true)}
                className="text-on-surface-variant hover:text-error transition-colors cursor-pointer flex items-center justify-center p-1 rounded-full hover:bg-surface-variant/20" 
                title="Papelera de reciclaje"
              >
                <span className="material-symbols-outlined text-[26px]">delete_sweep</span>
              </button>
            )}
          </div>
          </div> {/* fin Data Table Container */}
        </div> {/* fin Left Column */}

        {/* Right Column (Preview Panel) — solo en desktop */}
        <div className="hidden lg:block lg:col-span-4">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl flex flex-col h-[calc(100vh-8rem)] sticky top-24 overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
            <div className="p-4 border-b border-surface-variant bg-surface-container-lowest flex justify-between items-start min-h-[140px]">
              {selectedDoc ? (
                <div className="flex gap-3">
                  <div className="mt-1">
                    <span className="material-symbols-outlined text-3xl" style={{ color: getFileIcon(selectedDoc.nombre_original).color, fontVariationSettings: "'FILL' 1" }}>
                      {getFileIcon(selectedDoc.nombre_original).icon}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-title-sm text-title-sm text-on-surface break-words pr-4 leading-tight">{selectedDoc.nombre_original}</h4>
                    <p className="font-body-sm text-[13px] text-on-surface-variant mt-1">
                      Subido por Usuario #{selectedDoc.usuario_id} • {formatDate(selectedDoc.fecha_subida)}
                    </p>
                    <div className="flex gap-2 mt-3">
                      <span className="px-2 py-1 bg-surface-container-low rounded-DEFAULT font-label-caps text-[10px] text-on-surface-variant uppercase">
                        {getFileIcon(selectedDoc.nombre_original).type}
                      </span>
                      <span className="px-2 py-1 bg-[#F0F7FF] rounded-DEFAULT font-label-caps text-[10px] text-primary-container uppercase">
                        Caso #{selectedDoc.caso_id}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center w-full py-4 text-on-surface-variant opacity-60">
                  <span className="material-symbols-outlined text-4xl mb-2">find_in_page</span>
                  <p className="text-sm">Selecciona un archivo para ver detalles</p>
                </div>
              )}
            </div>

            {/* Action Bar for Preview */}
            <div className="px-4 py-2 bg-surface flex gap-2 border-b border-surface-variant">
              <button
                onClick={() => handleDownload(selectedDoc, false)}
                className="flex-1 py-1.5 bg-surface-container-lowest border border-outline-variant rounded-DEFAULT font-title-sm text-[13px] text-on-surface flex justify-center items-center gap-1 hover:bg-surface-container transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!selectedDoc || !!loadingAction}
              >
                {loadingAction === 'view' ? (
                  <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                ) : (
                  <span className="material-symbols-outlined text-[16px]">visibility</span>
                )}
                {loadingAction === 'view' ? 'Abriendo...' : 'Ver archivo'}
              </button>
              <button
                onClick={() => handleDownload(selectedDoc, true)}
                className="flex-1 py-1.5 bg-surface-container-lowest border border-outline-variant rounded-DEFAULT font-title-sm text-[13px] text-on-surface flex justify-center items-center gap-1 hover:bg-surface-container transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!selectedDoc || !!loadingAction}
              >
                {loadingAction === 'download' ? (
                  <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                ) : (
                  <span className="material-symbols-outlined text-[16px]">download</span>
                )}
                {loadingAction === 'download' ? 'Bajando...' : 'Bajar'}
              </button>
              <button
                onClick={(e) => handleDeleteClick(e, selectedDoc)}
                className="w-10 py-1.5 bg-surface-container-lowest border border-outline-variant rounded-DEFAULT text-on-surface-variant flex justify-center items-center hover:bg-surface-container hover:text-error transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!selectedDoc || !!loadingAction}
                title="Eliminar"
              >
                <span className="material-symbols-outlined text-[20px]">delete</span>
              </button>
            </div>

            {/* Preview Canvas Area (Real or Simulated) */}
            <div className="flex-1 bg-surface-container p-4 overflow-y-auto flex justify-center relative">
              {selectedDoc ? (
                previewUrl === 'error' ? (
                  <div className="flex flex-col items-center justify-center w-full h-full border border-dashed border-error/30 bg-error/5 rounded-lg p-6 text-center">
                    <span className="material-symbols-outlined text-error text-4xl mb-2">error</span>
                    <p className="text-on-surface font-medium text-sm">Error al cargar la vista previa</p>
                    <p className="text-on-surface-variant text-xs mt-1">El archivo podría no estar disponible o el enlace ha expirado.</p>
                    <button
                      onClick={() => setSelectedDoc({ ...selectedDoc })}
                      className="mt-4 px-3 py-1.5 bg-surface rounded border border-outline-variant text-xs hover:bg-surface-container transition-colors"
                    >
                      Reintentar
                    </button>
                  </div>
                ) : previewUrl ? (
                  <div className="w-full h-full bg-white border border-outline-variant shadow-sm relative overflow-hidden rounded-lg">
                    {selectedDoc.nombre_original.toLowerCase().endsWith('.pdf') ? (
                      <iframe
                        src={`${previewUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                        className="w-full h-full border-none"
                        title="PDF Preview"
                      />
                    ) : ['jpg', 'jpeg', 'png', 'gif', 'webp'].some(ext => selectedDoc.nombre_original.toLowerCase().endsWith(ext)) ? (
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-full h-full object-contain"
                      />
                    ) : ['doc', 'docx', 'xls', 'xlsx'].some(ext => selectedDoc.nombre_original.toLowerCase().endsWith(ext)) ? (
                      <iframe
                        src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(previewUrl)}`}
                        className="w-full h-full border-none"
                        title="Office Preview"
                      />
                    ) : (
                      /* Fallback simulation for non-viewable files */
                      <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-white">
                        <span className="material-symbols-outlined text-6xl text-outline-variant mb-4" style={{ color: getFileIcon(selectedDoc.nombre_original).color }}>
                          {getFileIcon(selectedDoc.nombre_original).icon}
                        </span>
                        <p className="font-title-sm text-on-surface mb-2">{selectedDoc.nombre_original}</p>
                        <p className="font-body-sm text-on-surface-variant">Vista previa no disponible para este tipo de archivo</p>
                        <button
                          onClick={() => handleDownload(selectedDoc, true)}
                          className="mt-6 px-4 py-2 bg-surface-container-high border border-outline-variant rounded-lg text-sm font-medium hover:bg-surface-variant transition-colors"
                        >
                          Descargar archivo
                        </button>
                      </div>
                    )
                    }
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center w-full h-full border border-dashed border-outline-variant bg-surface-container-low/50 rounded-lg">
                    <span className="material-symbols-outlined animate-spin text-2xl mb-2 text-outline">progress_activity</span>
                    <p className="text-on-surface-variant text-sm">Generando vista previa...</p>
                  </div>
                )
              ) : (
                <div className="flex items-center justify-center h-full w-full border border-dashed border-outline-variant bg-surface-container-low/50 rounded-lg">
                  <p className="text-on-surface-variant text-sm">Vista previa no disponible</p>
                </div>
              )}
            </div>
            {/* Metadata footer */}
            <div className="p-3 bg-surface-container-lowest border-t border-surface-variant flex justify-end items-center text-[11px] text-on-surface-variant font-body-sm">
              {selectedDoc ? (
                <span>{formatSize(selectedDoc.tamano)} • {formatDate(selectedDoc.fecha_subida)}</span>
              ) : (
                <span>Sin archivos seleccionados</span>
              )}
            </div>

          </div>
        </div>
      </div>

      <PapeleraReciclajeModal
        isOpen={isPapeleraOpen}
        onClose={() => setIsPapeleraOpen(false)}
        papelera={papelera}
        fetchPapelera={fetchPapelera}
        restaurarDocumento={restaurarDocumento}
        eliminarDefinitivamente={eliminarDefinitivamente}
      />

      <AnalisisIAModal 
        isOpen={isIAModalOpen}
        onClose={() => setIsIAModalOpen(false)}
        documento={iaDocumentoSelected}
      />
    </div>


  );
};

export default Documentos;
