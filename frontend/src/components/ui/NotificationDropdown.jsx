import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import notificacionService from '../../services/notificacionService';

const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notificaciones, setNotificaciones] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const fetchNotificaciones = async () => {
    try {
      const data = await notificacionService.getNotificaciones();
      setNotificaciones(data.notificaciones);
      setTotal(data.total);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchNotificaciones();
    // Polling cada 30 segundos
    const interval = setInterval(fetchNotificaciones, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => setIsOpen(!isOpen);

  const handleNotificationClick = async (notif) => {
    try {
      if (!notif.leida) {
        await notificacionService.marcarComoLeida(notif.id);
        // Actualizar estado local
        setNotificaciones(prev => 
          prev.map(n => n.id === notif.id ? { ...n, leida: true } : n)
        );
      }
      
      setIsOpen(false);

      // Redirección
      if (notif.tipo === 'CLIENTE') {
        navigate('/clientes');
      } else if (notif.tipo === 'CASO') {
        navigate(`/casos?id=${notif.referencia_id}`);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificacionService.marcarTodasComoLeidas();
      setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })));
    } catch (error) {
      console.error(error);
    }
  };

  const unreadCount = notificaciones.filter(n => !n.leida).length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={handleToggle}
        className="hover:text-primary transition-colors relative flex items-center"
      >
        <span className="material-symbols-outlined text-[24px]">notifications</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-error text-white text-[10px] font-bold flex items-center justify-center rounded-full animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed top-16 right-0 left-0 mx-3 sm:absolute sm:left-auto sm:top-auto sm:right-0 sm:mx-0 sm:mt-4 sm:w-80 w-auto bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
            <div className="flex items-center gap-3">
              <h3 className="font-bold text-slate-800 text-base">Notificaciones</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-error/10 text-error text-[11px] font-bold rounded-full border border-error/20 flex items-center justify-center min-w-[20px]">
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllRead}
                className="text-[12px] text-primary hover:text-primary-container transition-colors font-semibold"
              >
                Marcar todas como leídas
              </button>
            )}
          </div>

          <div className="max-h-[320px] overflow-y-auto scrollbar-slim">
            {notificaciones.length === 0 ? (
              <div className="p-10 text-center">
                <span className="material-symbols-outlined text-slate-300 text-5xl mb-2">notifications_off</span>
                <p className="text-slate-400 text-sm">No tienes notificaciones</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {notificaciones.map((notif) => (
                  <li 
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-4 hover:bg-slate-50 cursor-pointer transition-colors flex gap-3 group ${!notif.leida ? 'bg-blue-50/30' : ''}`}
                  >
                    <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center transition-transform duration-200 group-hover:scale-110 ${
                      notif.tipo === 'CLIENTE' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      <span className="material-symbols-outlined text-[20px]">
                        {notif.tipo === 'CLIENTE' ? 'person_add' : 'folder_shared'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[13px] leading-snug ${!notif.leida ? 'font-bold text-slate-900' : 'text-slate-500'}`}>
                        {notif.mensaje}
                      </p>
                      <span className="text-[10px] font-medium text-slate-400 mt-1 block">
                        {new Date(notif.fecha_creacion).toLocaleString()}
                      </span>
                    </div>
                    {!notif.leida && (
                      <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0 shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]"></div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="p-2 bg-slate-50/50 border-t border-slate-100 text-center">
            <button 
              className="w-full py-2 text-[11px] uppercase tracking-wider text-slate-500 hover:text-slate-800 transition-colors font-bold"
              onClick={() => setIsOpen(false)}
            >
              Cerrar Panel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
