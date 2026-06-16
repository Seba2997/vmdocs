import React, { useState, useEffect } from 'react';
import Button from '../ui/Button';

const ConfirmarEliminarDocumentoModal = ({ isOpen, onClose, onConfirm, documentoNombre }) => {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState(false);

  const accionRequerida = 'eliminar';
  const esConfirmacionValida = inputValue.toLowerCase() === accionRequerida;

  useEffect(() => {
    if (isOpen) {
      setInputValue('');
      setError(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = (e) => {
    e.preventDefault();
    if (esConfirmacionValida) {
      onConfirm();
    } else {
      setError(true);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-surface-container-lowest rounded-2xl shadow-xl border border-surface-variant w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
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
              Eliminar Documento
            </h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant">Esta acción no se puede deshacer</p>
          </div>
        </div>

        <form onSubmit={handleConfirm} className="p-6 space-y-4">
          <p className="font-body-md text-body-md text-on-surface">
            ¿Estás seguro que quieres <span className="font-bold text-error">eliminar</span> permanentemente el archivo:
            <span className="font-bold block mt-1 text-on-surface"> {documentoNombre}</span>?
          </p>

          <div className="space-y-2">
            <label className="font-label-md text-label-md text-on-surface-variant block">
              Escribe <span className="font-bold text-on-surface">"{accionRequerida}"</span> para continuar:
            </label>
            <input 
              autoFocus
              type="text"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                if (error) setError(false);
              }}
              placeholder={`Escribe ${accionRequerida}...`}
              className={`w-full px-4 py-2.5 bg-surface-container-lowest border rounded-lg font-body-md text-body-md focus:ring-2 focus:outline-none transition-all ${
                error 
                  ? 'border-error ring-error/20' 
                  : esConfirmacionValida 
                    ? 'border-error ring-error/20' 
                    : 'border-surface-variant focus:border-error focus:ring-error/20'
              }`}
            />
            {error && (
              <p className="text-error font-body-xs text-body-xs mt-1 animate-in slide-in-from-top-1">
                La palabra no coincide. Debes escribir exactamente "{accionRequerida}".
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!esConfirmacionValida}
              variant="error"
              className="flex-1"
            >
              Confirmar Eliminación
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConfirmarEliminarDocumentoModal;
