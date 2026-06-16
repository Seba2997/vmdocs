import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

const Modal = ({ isOpen, onClose, title, children, maxWidth = 'max-w-md' }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity p-4">
      <div
        className={`bg-surface-container-lowest w-full ${maxWidth} rounded-xl shadow-lg border border-surface-variant overflow-hidden flex flex-col max-h-[90vh]`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-variant bg-surface-container-low/50">
          <h3 className="font-title-sm text-title-sm text-on-surface">{title}</h3>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-error transition-colors p-1 rounded-full hover:bg-surface-variant/50 flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default Modal;
