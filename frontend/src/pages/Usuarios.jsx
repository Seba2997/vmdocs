import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import EditarUsuariosModal from '../components/usuarios/EditarUsuariosModal';
import ConfirmarEstadoModal from '../components/usuarios/ConfirmarEstadoModal';
import { useUsuarios } from '../hooks/useUsuarios';

const Usuarios = () => {
  const navigate = useNavigate();
  
  // Check user role
  const isUserAdmin = React.useMemo(() => {
    try {
      const perfil = JSON.parse(localStorage.getItem('user_profile') || '{}');
      return perfil.rol === 'ADMIN';
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    if (!isUserAdmin) {
      toast.error("Acceso denegado: Se requieren permisos de administrador.");
      navigate("/dashboard", { replace: true });
    }
  }, [isUserAdmin, navigate]);
  const {
    usuarios: currentUsuarios,
    totalFiltrados,
    totalUsuarios,
    totalActivos,
    loading,
    isModalOpen,
    selectedUsuario,
    currentPage,
    itemsPerPage,
    searchTerm,
    sortBy,
    sortOrder,
    totalPages,
    setItemsPerPage,
    setSearchTerm,
    setCurrentPage,
    handleOpenCreate,
    handleOpenEdit,
    handleCloseModal,
    handleSubmitForm,
    handleToggleEstado,
    handleSort,
    isConfirmModalOpen,
    usuarioToToggle,
    handleOpenConfirm,
    handleCloseConfirm,
    loggedUserId
  } = useUsuarios();

  if (!isUserAdmin) return null; // Avoid rendering while redirecting

  const getInitials = (nombre, apellido) => {
    const first = nombre ? nombre.charAt(0).toUpperCase() : '';
    const second = apellido ? apellido.charAt(0).toUpperCase() : '';
    return `${first}${second}`;
  };

  const renderSortIndicator = (field) => {
    if (sortBy !== field) return <span className="material-symbols-outlined text-[14px] opacity-30 ml-1 align-middle">unfold_more</span>;
    return <span className="material-symbols-outlined text-[14px] ml-1 align-middle">{sortOrder === 'asc' ? 'arrow_downward' : 'arrow_upward'}</span>;
  };

  return (
    <div className="flex-1 p-margin-page bg-surface">
      {/* Page Header */}
      <div className="flex justify-between items-end mb-stack-lg">
        <div>
          <h2 className="font-display-lg text-display-lg text-primary-container">Gestión de Usuarios</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">Administra los accesos y roles del sistema.</p>
        </div>
        <button 
          onClick={handleOpenCreate}
          className="px-5 py-2.5 bg-surface border border-secondary-fixed text-primary-container font-title-sm text-sm font-bold rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-2 shadow-sm"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          Crear usuario
        </button>
      </div>

      {/* Table Container */}
      <div className="bg-surface-container-lowest rounded-xl border border-surface-variant overflow-hidden shadow-sm">
        {/* Table Controls */}
        <div className="p-4 border-b border-surface-variant flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface-container-low/50">
          <div className="flex items-center gap-2">
            <span className="font-body-sm text-body-sm text-on-surface-variant">Mostrar</span>
            <select 
              value={itemsPerPage}
              onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
              className="border-outline-variant rounded text-sm py-1 pl-2 pr-8 bg-surface-container-lowest focus:border-primary-container focus:ring-0"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span className="font-body-sm text-body-sm text-on-surface-variant">registros</span>
          </div>
          
          {/* Búsqueda */}
          <div className="relative w-full sm:w-64">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-[18px]">search</span>
            <input 
              type="text" 
              placeholder="Buscar por nombre, email o rol..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-surface-container-lowest border border-surface-variant rounded font-body-sm text-body-sm focus:border-primary-container focus:ring-1 focus:ring-primary-container/20 transition-colors"
            />
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-surface-variant">
                <th 
                  onClick={() => handleSort('nombre')}
                  className="font-label-caps text-label-caps text-on-surface-variant py-3 px-gutter-table uppercase tracking-wider cursor-pointer hover:bg-surface-variant/50 transition-colors"
                >
                  Nombre {renderSortIndicator('nombre')}
                </th>
                <th 
                  onClick={() => handleSort('email')}
                  className="font-label-caps text-label-caps text-on-surface-variant py-3 px-gutter-table uppercase tracking-wider cursor-pointer hover:bg-surface-variant/50 transition-colors"
                >
                  Email {renderSortIndicator('email')}
                </th>
                <th 
                  onClick={() => handleSort('rol')}
                  className="font-label-caps text-label-caps text-on-surface-variant py-3 px-gutter-table uppercase tracking-wider cursor-pointer hover:bg-surface-variant/50 transition-colors"
                >
                  Rol {renderSortIndicator('rol')}
                </th>
                <th 
                  onClick={() => handleSort('estado')}
                  className="font-label-caps text-label-caps text-on-surface-variant py-3 px-gutter-table uppercase tracking-wider cursor-pointer hover:bg-surface-variant/50 transition-colors"
                >
                  Estado {renderSortIndicator('estado')}
                </th>
                <th className="font-label-caps text-label-caps text-on-surface-variant py-3 px-gutter-table uppercase tracking-wider text-right">
                  Editar
                </th>
              </tr>
            </thead>
            <tbody className="font-table-cell text-table-cell text-on-surface">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-on-surface-variant">
                    <span className="material-symbols-outlined animate-spin text-3xl inline-block" style={{animation: 'spin 1s linear infinite'}}>sync</span>
                    <p className="mt-2">Cargando usuarios...</p>
                  </td>
                </tr>
              ) : currentUsuarios.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-on-surface-variant">No se encontraron usuarios.</td>
                </tr>
              ) : (
                currentUsuarios.map((usuario) => (
                  <tr key={usuario.id} className="border-b border-surface-variant hover:bg-[#F0F7FF] transition-colors group">
                    <td className="py-3 px-gutter-table">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-title-sm text-title-sm shrink-0">
                          {getInitials(usuario.nombre, usuario.apellido)}
                        </div>
                        <span className="font-medium truncate max-w-[200px]">{`${usuario.nombre} ${usuario.apellido || ''}`}</span>
                      </div>
                    </td>
                    <td className="py-3 px-gutter-table text-on-surface-variant truncate max-w-[200px]">{usuario.email}</td>
                    <td className="py-3 px-gutter-table">{usuario.rol}</td>
                    <td className="py-3 px-gutter-table">
                      <div className="flex items-center gap-2">
                        {usuario.id === loggedUserId || usuario.id === 1 ? (
                          <div className="flex items-center gap-1.5" title={usuario.id === 1 ? "El Administrador Maestro no puede ser desactivado" : "Por seguridad, no puedes cambiar tu propio estado de acceso"}>
                            <span 
                              className={`inline-flex items-center px-2 py-0.5 rounded font-body-sm text-body-sm font-medium opacity-80 cursor-not-allowed ${
                                usuario.estado 
                                  ? 'bg-[#E8F5E9] text-[#2E7D32] border border-[#A5D6A7]' 
                                  : 'bg-surface-container text-on-surface-variant border border-outline-variant'
                              }`}
                            >
                              {usuario.estado ? 'Activo' : 'Inactivo'}
                            </span>
                            <span className="material-symbols-outlined text-[16px] text-on-surface-variant/60 cursor-not-allowed">lock</span>
                          </div>
                        ) : (
                          <button 
                            onClick={() => handleOpenConfirm(usuario)}
                            className={`inline-flex items-center px-2 py-0.5 rounded font-body-sm text-body-sm font-medium hover:opacity-80 transition-opacity ${
                              usuario.estado 
                                ? 'bg-[#E8F5E9] text-[#2E7D32] border border-[#A5D6A7]' 
                                : 'bg-surface-container text-on-surface-variant border border-outline-variant'
                            }`}
                            title="Clic para cambiar estado"
                          >
                            {usuario.estado ? 'Activo' : 'Inactivo'}
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-gutter-table text-right">
                      {usuario.id === 1 ? (
                        <div className="flex justify-end gap-2 text-on-surface-variant/40 cursor-not-allowed" title="El Administrador Maestro no puede ser modificado por otros">
                          <span className="material-symbols-outlined text-[20px]">lock</span>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity focus-within:opacity-100">
                          <button 
                            onClick={() => handleOpenEdit(usuario)}
                            className="text-on-surface-variant hover:text-primary-container p-1 rounded-full hover:bg-surface-variant/50 transition-colors" 
                            title="Editar usuario"
                          >
                            <span className="material-symbols-outlined text-[20px]">edit</span>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-4 border-t border-surface-variant flex items-center justify-between bg-surface-container-lowest">
          <div className="font-body-sm text-body-sm text-on-surface-variant flex items-center">
            <span className="font-semibold text-on-surface">Usuarios Registrados:</span> 
            <span className="ml-1 mr-3">{totalUsuarios}</span>
            <span className="text-outline-variant mr-3">|</span> 
            <span className="font-semibold text-[#2E7D32]">Usuarios Activos:</span> 
            <span className="ml-1">{totalActivos}</span>
          </div>
          <div className="flex gap-1">
            <button 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`px-3 py-1 border border-surface-variant rounded flex items-center justify-center transition-colors ${
                currentPage === 1 
                  ? 'text-outline-variant opacity-50 cursor-not-allowed' 
                  : 'text-on-surface-variant hover:bg-surface-container-low cursor-pointer'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            
            <button className="px-3 py-1 border border-primary-container bg-primary-container/10 text-primary-container rounded font-medium">
              {currentPage}
            </button>
            
            <button 
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages || totalPages === 0}
              className={`px-3 py-1 border border-surface-variant rounded flex items-center justify-center transition-colors ${
                currentPage === totalPages || totalPages === 0
                  ? 'text-outline-variant opacity-50 cursor-not-allowed' 
                  : 'text-on-surface-variant hover:bg-surface-container-low cursor-pointer'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      <EditarUsuariosModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        usuario={selectedUsuario}
        onSubmit={handleSubmitForm}
      />

      <ConfirmarEstadoModal 
        isOpen={isConfirmModalOpen}
        onClose={handleCloseConfirm}
        usuario={usuarioToToggle}
        onConfirm={handleToggleEstado}
      />
    </div>
  );
};

export default Usuarios;
