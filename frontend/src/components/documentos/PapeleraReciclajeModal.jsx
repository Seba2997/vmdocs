import React, { useState, useEffect } from 'react';
import Button from '../ui/Button';
import { useDocumentos } from '../../hooks/useDocumentos';

const PapeleraReciclajeModal = ({ 
  isOpen, 
  onClose, 
  papelera, 
  fetchPapelera, 
  restaurarDocumento, 
  eliminarDefinitivamente 
}) => {

  const [selectedIds, setSelectedIds] = useState([]);
  const [showConfirmPermanente, setShowConfirmPermanente] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmInput, setConfirmInput] = useState('');
  const [confirmError, setConfirmError] = useState(false);

  const accionRequerida = 'eliminar';
  const esConfirmacionValida = confirmInput.toLowerCase() === accionRequerida;

  useEffect(() => {
    if (isOpen) {
      fetchPapelera();
      setSelectedIds([]);
      setShowConfirmPermanente(false);
      setConfirmInput('');
      setConfirmError(false);
    }
  }, [isOpen, fetchPapelera]);

  if (!isOpen) return null;

  const handleToggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === papelera.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(papelera.map(doc => doc.id));
    }
  };

  const handleRestaurar = async () => {
    setIsProcessing(true);
    try {
      for (const id of selectedIds) {
        await restaurarDocumento(id);
      }
      setSelectedIds([]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEliminarDefinitivamente = async (e) => {
    if (e) e.preventDefault();
    if (!esConfirmacionValida) {
      setConfirmError(true);
      return;
    }

    setIsProcessing(true);
    try {
      for (const id of selectedIds) {
        await eliminarDefinitivamente(id);
      }
      setSelectedIds([]);
      setShowConfirmPermanente(false);
      setConfirmInput('');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVaciarPapelera = () => {
    if (papelera.length === 0) return;
    setSelectedIds(papelera.map(doc => doc.id));
    setShowConfirmPermanente(true);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('es-CL', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Modal Principal */}
      <div 
        className="bg-surface-container-lowest rounded-2xl shadow-xl border border-surface-variant w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 md:p-6 flex items-center justify-between border-b border-surface-variant bg-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 bg-error-container/10 text-error">
              <span className="material-symbols-outlined text-[32px] font-bold">
                delete_sweep
              </span>
            </div>
            <div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface">
                Papelera de Reciclaje
              </h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Gestiona los documentos eliminados temporalmente
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {selectedIds.length > 0 ? (
              <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2 duration-200">
                <button 
                  onClick={handleRestaurar}
                  disabled={isProcessing}
                  className="px-4 py-2 text-primary hover:bg-primary/5 rounded-lg transition-colors font-title-sm text-sm flex items-center gap-2 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[20px]">restore</span>
                  Restaurar seleccionados
                </button>
                <button 
                  onClick={() => setShowConfirmPermanente(true)}
                  disabled={isProcessing}
                  className="px-4 py-2 text-error hover:bg-error/5 rounded-lg transition-colors font-title-sm text-sm flex items-center gap-2 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[20px]">delete</span>
                  Eliminar seleccionados
                </button>
              </div>
            ) : papelera.length > 0 ? (
              <button 
                onClick={handleVaciarPapelera}
                className="px-4 py-2 text-error hover:bg-error/5 rounded-lg transition-colors font-title-sm text-sm flex items-center gap-2 animate-in fade-in duration-200"
              >
                <span className="material-symbols-outlined text-[20px]">delete_forever</span>
                Vaciar papelera
              </button>
            ) : null}
            <button 
              onClick={onClose}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-container transition-colors text-on-surface-variant"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-surface-container-low/30">
          {papelera.length > 0 ? (
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-surface-container-low z-10 border-b border-surface-variant">
                <tr>
                  <th className="px-6 py-3 w-12 text-center">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary/20"
                      checked={selectedIds.length === papelera.length && papelera.length > 0}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th className="px-6 py-3 font-label-caps text-label-caps text-on-surface-variant">Nombre</th>
                  <th className="px-6 py-3 font-label-caps text-label-caps text-on-surface-variant">Fecha Eliminación</th>
                  <th className="px-6 py-3 font-label-caps text-label-caps text-on-surface-variant text-right">Tamaño</th>
                  <th className="px-6 py-3 font-label-caps text-label-caps text-on-surface-variant text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-variant/50">
                {papelera.map((doc) => (
                  <tr 
                    key={doc.id} 
                    className={`hover:bg-surface-container-high/50 transition-colors cursor-pointer ${selectedIds.includes(doc.id) ? 'bg-primary/5' : ''}`}
                    onClick={() => handleToggleSelect(doc.id)}
                  >
                    <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary/20"
                        checked={selectedIds.includes(doc.id)}
                        onChange={() => handleToggleSelect(doc.id)}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-on-surface-variant/60">insert_drive_file</span>
                        <span className="font-body-md text-on-surface font-medium">{doc.nombre_original}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-on-surface-variant text-sm">
                      {formatDate(doc.fecha_subida)}
                    </td>
                    <td className="px-6 py-4 text-right text-on-surface-variant text-sm font-mono">
                      {(doc.tamano / 1024 / 1024).toFixed(2)} MB
                    </td>
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-4">
                        <button 
                          onClick={async () => {
                            setIsProcessing(true);
                            try {
                              await restaurarDocumento(doc.id);
                            } finally {
                              setIsProcessing(false);
                            }
                          }}
                          className="text-on-surface-variant hover:text-primary transition-colors p-1 rounded-full hover:bg-primary/5"
                          title="Restaurar archivo"
                          disabled={isProcessing}
                        >
                          <span className="material-symbols-outlined text-[24px]">restore</span>
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedIds([doc.id]);
                            setShowConfirmPermanente(true);
                          }}
                          className="text-on-surface-variant hover:text-error transition-colors p-1 rounded-full hover:bg-error/5"
                          title="Eliminar definitivamente"
                          disabled={isProcessing}
                        >
                          <span className="material-symbols-outlined text-[24px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center px-6">
              <div className="w-20 h-20 rounded-full bg-surface-container-high flex items-center justify-center mb-4 text-on-surface-variant/20">
                <span className="material-symbols-outlined text-5xl">delete_sweep</span>
              </div>
              <h4 className="font-title-md text-on-surface">La papelera está vacía</h4>
              <p className="text-on-surface-variant text-sm mt-1 max-w-xs">
                Los archivos que elimines de tus casos aparecerán aquí temporalmente.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-surface-container border-t border-surface-variant flex items-center justify-between">
          <div className="text-sm text-on-surface-variant">
            {selectedIds.length > 0 ? (
              <span className="font-medium text-primary">{selectedIds.length} seleccionados</span>
            ) : (
              <span>{papelera.length} documentos en papelera</span>
            )}
          </div>
        </div>
      </div>

      {/* Burbuja de confirmación definitiva - MOVIDA AFUERA DEL CONTENEDOR CON OVERFLOW */}
      {showConfirmPermanente && (
        <div 
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-300"
          onClick={() => setShowConfirmPermanente(false)}
        >
          <div 
            className="bg-surface-container-lowest rounded-2xl shadow-2xl border border-surface-variant w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header con color de error */}
            <div className="p-6 flex items-center gap-4 bg-error-container/10">
              <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 bg-error-container text-on-error-container">
                <span className="material-symbols-outlined text-[28px]">
                  delete_forever
                </span>
              </div>
              <div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface">
                  Eliminar definitivamente
                </h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Esta acción no se puede deshacer</p>
              </div>
            </div>

            <form onSubmit={handleEliminarDefinitivamente} className="p-6 space-y-4">
              <p className="font-body-md text-body-md text-on-surface">
                ¿Estás seguro que quieres <span className="font-bold text-error">eliminar</span> permanentemente {selectedIds.length} {selectedIds.length === 1 ? 'archivo' : 'archivos'}?
                {selectedIds.length === 1 && (
                    <span className="font-bold block mt-1 text-on-surface text-sm truncate"> 
                        {papelera.find(d => d.id === selectedIds[0])?.nombre_original}
                    </span>
                )}
              </p>

              <div className="space-y-2">
                <label className="font-label-md text-label-md text-on-surface-variant block">
                  Escribe <span className="font-bold text-on-surface">"{accionRequerida}"</span> para continuar:
                </label>
                <input 
                  autoFocus
                  type="text"
                  value={confirmInput}
                  onChange={(e) => {
                    setConfirmInput(e.target.value);
                    if (confirmError) setConfirmError(false);
                  }}
                  placeholder={`Escribe ${accionRequerida}...`}
                  className={`w-full px-4 py-2.5 bg-surface-container-lowest border rounded-lg font-body-md text-body-md focus:ring-2 focus:outline-none transition-all ${
                    confirmError 
                      ? 'border-error ring-error/20' 
                      : esConfirmacionValida 
                        ? 'border-error ring-error/20' 
                        : 'border-surface-variant focus:border-error focus:ring-error/20'
                  }`}
                />
                {confirmError && (
                  <p className="text-error font-body-xs text-body-xs mt-1 animate-in slide-in-from-top-1">
                    La palabra no coincide. Debes escribir exactamente "{accionRequerida}".
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowConfirmPermanente(false)}
                  className="flex-1"
                  disabled={isProcessing}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={!esConfirmacionValida || isProcessing}
                  variant="error"
                  className="flex-1"
                  loading={isProcessing}
                >
                  Confirmar Eliminación
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PapeleraReciclajeModal;
