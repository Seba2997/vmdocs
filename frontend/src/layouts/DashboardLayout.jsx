import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import EditarPerfil from '../components/usuarios/EditarPerfil';

import NotificationDropdown from '../components/ui/NotificationDropdown';

const navItems = [
  { to: '/dashboard', icon: 'dashboard', label: 'Dashboard', end: true },
  { to: '/clientes', icon: 'groups', label: 'Clientes' },
  { to: '/casos', icon: 'folder_open', label: 'Casos' },
  { to: '/usuarios', icon: 'person', label: 'Usuarios' },
];

const getUsuarioNombre = () => {
  try {
    const perfil = JSON.parse(localStorage.getItem('user_profile') || '{}');
    return perfil.nombre ? `${perfil.nombre} ${perfil.apellido || ''}`.trim() : 'Usuario';
  } catch {
    return 'Usuario';
  }
};

const getUsuarioRol = () => {
  try {
    const perfil = JSON.parse(localStorage.getItem('user_profile') || '{}');
    return perfil.rol || 'USER';
  } catch {
    return 'USER';
  }
};

const DashboardLayout = () => {
  const { cerrarSesion } = useAuth();
  const [nombreUsuario, setNombreUsuario] = useState(getUsuarioNombre());
  const [isPerfilModalOpen, setIsPerfilModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const rolUsuario = getUsuarioRol();

  const handleProfileUpdated = () => {
    setNombreUsuario(getUsuarioNombre());
  };

  const filteredNavItems = navItems.filter(item => {
    if (item.to === '/usuarios' && rolUsuario !== 'ADMIN') return false;
    return true;
  });

  return (
    <div className="bg-background text-on-background antialiased font-body-md">
      {/* ── Overlay ── */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <nav className={`h-screen w-64 border-r border-slate-200 bg-slate-50 fixed left-0 top-0 flex flex-col py-6 z-50 transition-transform duration-300 ease-in-out lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="px-6 mb-8 flex justify-between items-center">
          <h1 className="text-2xl font-black text-primary-container tracking-tighter">VMDocs</h1>
          <button className="lg:hidden text-slate-600" onClick={() => setIsSidebarOpen(false)}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <ul className="flex-1 space-y-1">
          {filteredNavItems.map(({ to, icon, label, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                onClick={() => setIsSidebarOpen(false)}
                className={({ isActive }) =>
                  isActive
                    ? 'flex items-center gap-3 px-6 py-3 text-primary-container font-bold border-r-4 border-primary-container bg-blue-50/50 font-body-md text-body-md transition-colors duration-200'
                    : 'flex items-center gap-3 px-6 py-3 text-slate-600 hover:text-primary-container hover:bg-slate-100 font-body-md text-body-md transition-colors duration-200'
                }
              >
                {({ isActive }) => (
                  <>
                    <span 
                      className="material-symbols-outlined"
                      style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
                    >
                      {icon}
                    </span>
                    {label}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* ── Top Header ── */}
      <header className="fixed top-0 right-0 w-full lg:w-[calc(100%-16rem)] h-16 z-30 border-b border-slate-200 shadow-sm bg-white flex items-center justify-between px-4 lg:px-8">
        <button className="lg:hidden text-slate-600" onClick={() => setIsSidebarOpen(true)}>
          <span className="material-symbols-outlined">menu</span>
        </button>

        {/* Actions Placeholder */}
        <div className="flex-1"></div>

        {/* Actions */}
        <div className="flex items-center gap-4 lg:gap-6">
          <div className="flex items-center gap-2 lg:gap-4 text-primary-container opacity-90 hover:opacity-100 transition-all">
            <NotificationDropdown />
            <button
              className="hover:text-primary transition-colors"
              onClick={() => setIsPerfilModalOpen(true)}
              title="Editar Perfil"
            >
              <span className="material-symbols-outlined">settings</span>
            </button>
          </div>

          <div className="h-8 w-px bg-slate-200"></div>

          <div className="flex items-center gap-2 lg:gap-4">
            <div className="hidden sm:flex flex-col items-end">
              <span className="font-body-sm text-body-sm font-medium text-on-surface">{nombreUsuario}</span>
              <span className="text-on-surface-variant" style={{ fontSize: '11px' }}>Perfil</span>
            </div>
            <button
              onClick={cerrarSesion}
              className="font-label-caps text-label-caps uppercase text-error hover:text-on-error-container transition-colors ml-0 lg:ml-2"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="lg:ml-64 pt-16 min-h-screen bg-background">
        <Outlet />
      </main>

      {/* ── Modals ── */}
      <EditarPerfil
        isOpen={isPerfilModalOpen}
        onClose={() => setIsPerfilModalOpen(false)}
        onProfileUpdated={handleProfileUpdated}
      />
    </div>
  );
};

export default DashboardLayout;
