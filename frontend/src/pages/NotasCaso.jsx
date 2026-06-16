import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useForm } from 'react-hook-form';
import CasoService from '../services/casoService';

const getPerfil = () => {
  try { return JSON.parse(localStorage.getItem('user_profile') || '{}'); } catch { return {}; }
};

const formatFechaHora = (d) => {
  if (!d) return '';
  return new Date(d).toLocaleString('es-CL', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};

const Avatar = ({ nombre = '', apellido = '' }) => {
  const initials = `${nombre[0] || ''}${apellido?.[0] || ''}`.toUpperCase() || '?';
  return (
    <div className="w-10 h-10 rounded-full bg-primary-fixed text-primary-container flex items-center justify-center font-semibold text-sm border border-primary-fixed-dim shrink-0">
      {initials}
    </div>
  );
};

const NotasCaso = ({ casoId }) => {
  const [notas, setNotas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  
  const perfil = getPerfil();
  const esAdmin = perfil.rol === 'ADMIN';

  const cargarNotas = async () => {
    try {
      const resp = await CasoService.listarNotas(casoId);
      setNotas(resp.data);
    } catch (err) {
      toast.error('Error al cargar la bitácora de notas');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarNotas();
  }, [casoId]);

  const onCrearNota = async (data) => {
    setEnviando(true);
    try {
      await CasoService.crearNota(casoId, data);
      toast.success('Nota agregada a la bitácora');
      reset();
      await cargarNotas();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al agregar nota');
    } finally {
      setEnviando(false);
    }
  };

  const onEliminarNota = async (notaId) => {
    if (!window.confirm('¿Estás seguro de eliminar esta nota de forma permanente?')) return;
    try {
      await CasoService.eliminarNota(notaId);
      toast.success('Nota eliminada');
      await cargarNotas();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al eliminar nota');
    }
  };

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="material-symbols-outlined animate-spin text-[32px] text-primary-container">progress_activity</span>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-xl flex flex-col p-padding-card">
      <div className="border-b border-[#E5E7EB] pb-4 mb-6 flex justify-between items-center">
        <h3 className="font-title-sm text-title-sm text-on-surface flex items-center gap-2">
          <span className="material-symbols-outlined text-primary-container">history_edu</span>
          Bitácora del Caso
        </h3>
        <span className="bg-surface-container-high text-on-surface text-xs py-0.5 px-2 rounded-full font-medium">
          {notas.length} notas
        </span>
      </div>

      {/* Formulario Nueva Nota */}
      <div className="mb-8 bg-[#F8FAFC] border border-[#E2E8F0] focus-within:bg-white focus-within:border-primary-container focus-within:shadow-[0_0_0_3px_rgba(219,234,254,0.5)] rounded-xl p-4 transition-all duration-200">
        <form onSubmit={handleSubmit(onCrearNota)} className="flex flex-col gap-2">
          <textarea
            {...register('contenido', { required: 'La nota no puede estar vacía' })}
            rows={2}
            placeholder="Escribe una nueva nota, apunte de reunión o actualización..."
            className="w-full bg-transparent outline-none resize-none font-body-md text-sm text-on-surface placeholder:text-slate-400"
          ></textarea>
          
          <div className="flex justify-between items-center mt-2 pt-3 border-t border-[#E2E8F0]/80">
            <span className="text-error text-xs font-medium">{errors.contenido?.message}</span>
            <button
              type="submit"
              disabled={enviando}
              className="px-5 py-2 bg-primary-container text-on-primary rounded-lg font-title-sm text-sm font-semibold hover:bg-primary transition-colors disabled:opacity-60 flex items-center gap-2 shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">send</span>
              {enviando ? 'Guardando...' : 'Dejar nota'}
            </button>
          </div>
        </form>
      </div>

      {/* Lista de Notas (Timeline) */}
      <div className="flex flex-col gap-6 relative">
        {notas.length === 0 ? (
          <div className="text-center py-10 text-on-surface-variant flex flex-col items-center gap-2">
            <span className="material-symbols-outlined text-[48px] opacity-20">speaker_notes_off</span>
            <p className="font-body-md text-body-md">Aún no hay notas en la bitácora de este caso.</p>
          </div>
        ) : (
          <div className="pl-4 border-l-2 border-secondary-fixed space-y-8">
            {notas.map(nota => (
              <div key={nota.id} className="relative group">
                {/* Dot */}
                <div className="absolute -left-[25px] top-1 w-3 h-3 bg-primary-fixed border-2 border-white rounded-full"></div>
                
                <div className="flex gap-4">
                  <Avatar nombre={nota.usuario?.nombre} apellido={nota.usuario?.apellido} />
                  
                  <div className="flex-1 bg-surface-container-lowest border border-[#E5E7EB] rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex flex-col">
                        <span className="font-title-sm text-sm text-on-surface font-semibold">
                          {nota.usuario?.nombre} {nota.usuario?.apellido}
                        </span>
                        <span className="font-label-caps text-[10px] text-secondary">
                          {nota.usuario?.rol}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-on-surface-variant font-medium flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">schedule</span>
                          {formatFechaHora(nota.fecha_creacion)}
                        </span>
                        
                        {/* Botón de eliminar (Admin o dueño de la nota) */}
                        {(esAdmin || nota.usuario_id === perfil.id) && (
                          <button
                            onClick={() => onEliminarNota(nota.id)}
                            className="opacity-0 group-hover:opacity-100 text-outline hover:text-error transition-all p-1 rounded hover:bg-red-50"
                            title="Eliminar nota"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <p className="font-body-md text-sm text-on-surface whitespace-pre-wrap leading-relaxed">
                      {nota.contenido}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotasCaso;
