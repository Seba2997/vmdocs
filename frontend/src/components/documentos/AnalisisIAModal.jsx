import React, { useEffect, useState, useRef } from 'react';
import { useIA } from '../../hooks/useIA';
import Button from '../ui/Button';

const AnalisisIAModal = ({ isOpen, onClose, documento }) => {
  const {
    resumen,
    ficha,
    chatHistory,
    loadingAnalisis,
    loadingPregunta,
    cargarAnalisisBasico,
    preguntar,
    limpiarChat
  } = useIA();

  const [preguntaTexto, setPreguntaTexto] = useState('');
  const [tabMovil, setTabMovil] = useState('resumen'); // 'resumen' | 'chat'
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (isOpen && documento) {
      limpiarChat();
      setTabMovil('resumen');
      cargarAnalisisBasico(documento.id);
    }
  }, [isOpen, documento, cargarAnalisisBasico, limpiarChat]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, loadingPregunta]);

  if (!isOpen || !documento) return null;

  const handlePreguntar = async (e) => {
    e.preventDefault();
    if (!preguntaTexto.trim() || loadingPregunta) return;
    const preguntaEnviada = preguntaTexto;
    setPreguntaTexto('');
    await preguntar(documento.id, preguntaEnviada);
  };

  const handleRegenerar = () => {
    cargarAnalisisBasico(documento.id, true);
  };

  /* ── Panel: Resumen + Ficha ── */
  const renderPanelResumen = () => (
    <div className="flex flex-col space-y-6 p-4 md:p-6 overflow-y-auto scrollbar-slim flex-1">
      {loadingAnalisis ? (
        <div className="flex flex-col items-center justify-center text-center opacity-70 space-y-4 py-12">
          <span className="material-symbols-outlined text-5xl animate-spin text-primary">progress_activity</span>
          <p className="font-title-md text-on-surface">Analizando documento...</p>
          <p className="font-body-sm text-on-surface-variant max-w-xs">
            La IA está leyendo y extrayendo los puntos clave. Esto tomará unos segundos.
          </p>
        </div>
      ) : (
        <>
          <section>
            <h4 className="font-title-md text-primary flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-[20px]">summarize</span>
              Resumen del Documento
            </h4>
            <div className="bg-surface-container-low p-4 rounded-xl border border-surface-variant/50 shadow-sm">
              {resumen?.resumen_ia ? (
                <p className="font-body-md text-on-surface leading-relaxed whitespace-pre-wrap">{resumen.resumen_ia}</p>
              ) : (
                <p className="text-on-surface-variant italic text-sm">No se pudo generar el resumen.</p>
              )}
            </div>
          </section>

          {ficha && (
            <section className="space-y-4">
              <h4 className="font-title-md text-primary flex items-center gap-2 border-b border-surface-variant pb-2">
                <span className="material-symbols-outlined text-[20px]">fact_check</span>
                Datos Clave Extraídos
              </h4>

              {ficha.tipo_documento && (
                <div>
                  <span className="block text-[11px] uppercase tracking-wider text-on-surface-variant font-bold mb-1">Tipo de Documento</span>
                  <div className="inline-block px-3 py-1 bg-secondary-container/50 text-on-secondary-container rounded-lg font-medium text-sm border border-secondary/20">
                    {ficha.tipo_documento}
                  </div>
                </div>
              )}

              {ficha.partes_involucradas?.length > 0 && (
                <div>
                  <span className="block text-[11px] uppercase tracking-wider text-on-surface-variant font-bold mb-2">Partes Involucradas</span>
                  <div className="flex flex-wrap gap-2">
                    {ficha.partes_involucradas.map((parte, idx) => (
                      <span key={idx} className="px-2.5 py-1 bg-surface-variant/30 border border-outline-variant rounded-md text-sm text-on-surface flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[14px] text-primary">person</span>
                        {parte}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {ficha.fechas_importantes?.length > 0 && (
                <div>
                  <span className="block text-[11px] uppercase tracking-wider text-on-surface-variant font-bold mb-2">Fechas Clave</span>
                  <div className="flex flex-wrap gap-2">
                    {ficha.fechas_importantes.map((fecha, idx) => (
                      <span key={idx} className="px-2.5 py-1 bg-tertiary-container/30 border border-tertiary/20 rounded-md text-sm text-on-tertiary-container flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                        {fecha}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {ficha.montos_detectados?.length > 0 && (
                <div>
                  <span className="block text-[11px] uppercase tracking-wider text-on-surface-variant font-bold mb-2">Montos Detectados</span>
                  <div className="flex flex-wrap gap-2">
                    {ficha.montos_detectados.map((monto, idx) => (
                      <span key={idx} className="px-2.5 py-1 bg-[#F0FDF4] border border-[#BBF7D0] rounded-md text-sm text-[#166534] font-medium flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[14px]">payments</span>
                        {monto}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );

  /* ── Panel: Chat ── */
  const renderPanelChat = () => (
    <div className="flex flex-col flex-1 bg-surface-container-lowest relative overflow-hidden">
      <div className="px-4 py-2 bg-surface-container border-b border-surface-variant/50 text-xs text-on-surface-variant flex items-center gap-2 shrink-0">
        <span className="material-symbols-outlined text-[16px]">info</span>
        La IA solo responde basándose en el contenido de este documento.
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 scrollbar-slim">
        {/* Bienvenida */}
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
            <span className="material-symbols-outlined text-primary text-[18px]">smart_toy</span>
          </div>
          <div className="bg-surface-container-low rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%] border border-surface-variant/50 shadow-sm">
            <p className="text-on-surface text-sm leading-relaxed">
              ¡Hola! Soy tu asistente de IA para este documento. Puedes hacerme preguntas específicas sobre su contenido.
            </p>
          </div>
        </div>

        {/* Historial */}
        {chatHistory.map((msg, idx) => (
          <div key={idx} className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${
              msg.role === 'user' ? 'bg-secondary text-on-secondary' : 'bg-primary/10 text-primary'
            }`}>
              <span className="material-symbols-outlined text-[18px]">
                {msg.role === 'user' ? 'person' : 'smart_toy'}
              </span>
            </div>
            <div className={`px-4 py-3 max-w-[85%] shadow-sm ${
              msg.role === 'user'
                ? 'bg-secondary text-on-secondary rounded-2xl rounded-tr-sm'
                : `rounded-2xl rounded-tl-sm border border-surface-variant/50 ${msg.isError ? 'bg-error-container/30 text-error' : 'bg-surface-container-low text-on-surface'}`
            }`}>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}

        {/* Loading */}
        {loadingPregunta && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
              <span className="material-symbols-outlined text-primary text-[18px] animate-spin">autorenew</span>
            </div>
            <div className="bg-surface-container-low rounded-2xl rounded-tl-sm px-4 py-3 border border-surface-variant/50 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary/50 animate-bounce"></div>
              <div className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 md:p-4 bg-surface-container-lowest border-t border-surface-variant/50 shrink-0">
        <form onSubmit={handlePreguntar} className="relative flex items-center">
          <input
            type="text"
            value={preguntaTexto}
            onChange={(e) => setPreguntaTexto(e.target.value)}
            placeholder={loadingAnalisis ? 'Espera a que termine el análisis...' : 'Pregunta algo sobre el documento...'}
            disabled={loadingPregunta || loadingAnalisis}
            className="w-full pl-4 pr-12 py-3 bg-surface-container border border-outline-variant rounded-full text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!preguntaTexto.trim() || loadingPregunta || loadingAnalisis}
            className="absolute right-2 w-9 h-9 rounded-full flex items-center justify-center text-primary hover:bg-primary/10 disabled:opacity-30 transition-colors"
          >
            <span className="material-symbols-outlined transform -rotate-45 ml-1">send</span>
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 md:p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
      <div
        className="bg-surface-container-lowest/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 w-full max-w-6xl h-[95vh] md:h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 md:px-6 py-3 md:py-4 border-b border-surface-variant/50 flex items-center justify-between gap-2 bg-gradient-to-r from-primary/10 to-transparent shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-primary to-primary-container flex items-center justify-center shadow-inner shrink-0">
              <span className="material-symbols-outlined text-on-primary text-[20px] md:text-[28px] animate-pulse">auto_awesome</span>
            </div>
            <div className="min-w-0">
              <h3 className="font-headline-sm text-on-surface text-sm md:text-base font-bold">Análisis Inteligente</h3>
              <p className="text-on-surface-variant text-xs truncate max-w-[180px] md:max-w-md">{documento.nombre_original}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={handleRegenerar}
              disabled={loadingAnalisis}
              className="px-2 md:px-3 py-1.5 flex items-center gap-1 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors disabled:opacity-50"
              title="Regenerar análisis"
            >
              <span className={`material-symbols-outlined text-[20px] ${loadingAnalisis ? 'animate-spin' : ''}`}>sync</span>
              <span className="hidden md:inline">Regenerar</span>
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-surface-variant transition-colors text-on-surface-variant"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        {/* Tabs (solo móvil) */}
        <div className="md:hidden flex border-b border-surface-variant/50 shrink-0">
          <button
            onClick={() => setTabMovil('resumen')}
            className={`flex-1 py-2.5 text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors ${
              tabMovil === 'resumen'
                ? 'text-primary border-b-2 border-primary bg-primary/5'
                : 'text-on-surface-variant hover:bg-surface-container-low'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">summarize</span>
            Resumen
          </button>
          <button
            onClick={() => setTabMovil('chat')}
            className={`flex-1 py-2.5 text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors ${
              tabMovil === 'chat'
                ? 'text-primary border-b-2 border-primary bg-primary/5'
                : 'text-on-surface-variant hover:bg-surface-container-low'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">chat</span>
            Chat IA
            {chatHistory.length > 0 && (
              <span className="text-[10px] bg-primary text-on-primary rounded-full px-1.5 py-0.5 leading-none">
                {chatHistory.length}
              </span>
            )}
          </button>
        </div>

        {/* Contenido principal */}
        <div className="flex-1 flex overflow-hidden">

          {/* Móvil: una sección a la vez */}
          <div className="md:hidden flex flex-col flex-1 overflow-hidden">
            {tabMovil === 'resumen' ? renderPanelResumen() : renderPanelChat()}
          </div>

          {/* Desktop: dos columnas lado a lado */}
          <div className="hidden md:flex flex-1 overflow-hidden">
            <div className="w-1/2 lg:w-[45%] border-r border-surface-variant/50 bg-surface-container-lowest/50 flex flex-col overflow-hidden">
              {renderPanelResumen()}
            </div>
            <div className="w-1/2 lg:w-[55%] flex flex-col overflow-hidden">
              {renderPanelChat()}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AnalisisIAModal;
