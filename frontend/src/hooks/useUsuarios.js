import { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';

export const useUsuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);

  // Get logged-in user ID
  const loggedUserId = useMemo(() => {
    try {
      const perfil = JSON.parse(localStorage.getItem('user_profile') || '{}');
      return perfil.id;
    } catch {
      return null;
    }
  }, []);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUsuario, setSelectedUsuario] = useState(null);

  // Confirm Status Modal State
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [usuarioToToggle, setUsuarioToToggle] = useState(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Filtering & Sorting State
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('nombre');
  const [sortOrder, setSortOrder] = useState('asc');

  const fetchUsuarios = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/usuarios/obtenertodos/');
      setUsuarios(response.data);
    } catch (error) {
      console.error("Error al obtener usuarios:", error);
      toast.error(error.response?.data?.detail || "Error al cargar los usuarios");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsuarios();
  }, [fetchUsuarios]);

  // Handlers
  const handleOpenCreate = () => {
    setSelectedUsuario(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (usuario) => {
    setSelectedUsuario(usuario);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUsuario(null);
  };

  const handleOpenConfirm = (usuario) => {
    setUsuarioToToggle(usuario);
    setIsConfirmModalOpen(true);
  };

  const handleCloseConfirm = () => {
    setIsConfirmModalOpen(false);
    setUsuarioToToggle(null);
  };

  const handleSubmitForm = async (data, isEditing) => {
    try {
      if (isEditing && selectedUsuario) {
        // Edit Basic Info
        await api.patch(`/usuarios/editarusuario/${selectedUsuario.id}`, {
          nombre: data.nombre,
          apellido: data.apellido,
          email: data.email
        });

        // Edit Role if changed
        if (data.rol !== selectedUsuario.rol) {
          await api.patch(`/usuarios/cambiarrol/${selectedUsuario.id}`, { rol: data.rol });
        }
        toast.success("Usuario actualizado correctamente");
      } else {
        // Create User
        await api.post('/usuarios/crearusuario/', {
          nombre: data.nombre,
          apellido: data.apellido,
          email: data.email,
          password: data.password,
          rol: data.rol,
          estado: true
        });
        toast.success("Usuario creado correctamente");
      }
      handleCloseModal();
      fetchUsuarios();
    } catch (error) {
      console.error("Error al guardar usuario:", error);
      toast.error(error.response?.data?.detail || "Error al guardar el usuario");
      // Importante: No cerramos el modal si hay error, para que el usuario pueda corregirlo
    }
  };

  const handleToggleEstado = async () => {
    if (!usuarioToToggle) return;

    try {
      await api.patch(`/usuarios/cambiarestado/${usuarioToToggle.id}`);
      toast.success(`Usuario ${usuarioToToggle.estado ? 'desactivado' : 'activado'} correctamente`, { autoClose: 1500 });
      handleCloseConfirm();
      fetchUsuarios();
    } catch (error) {
      console.error("Error al cambiar estado:", error);
      toast.error(error.response?.data?.detail || "Error al cambiar estado");
    }
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Derived State (Filter, Sort, Paginate)
  const filteredAndSortedUsuarios = useMemo(() => {
    if (!Array.isArray(usuarios)) return []; // Safely return if not an array

    let filtered = usuarios.filter(u => {
      const nombre = u?.nombre || '';
      const apellido = u?.apellido || '';
      const email = u?.email || '';
      const rol = u?.rol || '';

      const fullName = `${nombre} ${apellido}`.toLowerCase();
      const search = (searchTerm || '').toLowerCase();

      return fullName.includes(search) ||
        email.toLowerCase().includes(search) ||
        rol.toLowerCase().includes(search);
    });

    return filtered.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];

      if (sortBy === 'nombre') {
        aVal = `${a.nombre || ''} ${a.apellido || ''}`.toLowerCase();
        bVal = `${b.nombre || ''} ${b.apellido || ''}`.toLowerCase();
      }

      // Safe comparison for potentially undefined values
      aVal = aVal || '';
      bVal = bVal || '';

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [usuarios, searchTerm, sortBy, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedUsuarios.length / itemsPerPage));

  // Ensure current page is valid after filtering
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const currentUsuarios = filteredAndSortedUsuarios.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalUsuarios = Array.isArray(usuarios) ? usuarios.length : 0;
  const totalActivos = Array.isArray(usuarios) ? usuarios.filter(u => u.estado).length : 0;

  return {
    usuarios: currentUsuarios,
    totalFiltrados: filteredAndSortedUsuarios.length,
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
  };
};
