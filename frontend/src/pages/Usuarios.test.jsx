import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Usuarios from './Usuarios';

// Mocks
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

vi.mock('react-toastify', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn()
  }
}));

const mockHandleOpenCreate = vi.fn();
const mockSetSearchTerm = vi.fn();

vi.mock('../hooks/useUsuarios', () => ({
  useUsuarios: () => ({
    usuarios: [
      { id: 1, nombre: 'Admin', apellido: 'Test', email: 'admin@test.com', rol: 'ADMIN', estado: true },
      { id: 2, nombre: 'User', apellido: 'Normal', email: 'user@test.com', rol: 'USUARIO', estado: false }
    ],
    totalFiltrados: 2,
    totalUsuarios: 2,
    totalActivos: 1,
    loading: false,
    isModalOpen: false,
    selectedUsuario: null,
    currentPage: 1,
    itemsPerPage: 10,
    searchTerm: '',
    sortBy: 'nombre',
    sortOrder: 'asc',
    totalPages: 1,
    setItemsPerPage: vi.fn(),
    setSearchTerm: mockSetSearchTerm,
    setCurrentPage: vi.fn(),
    handleOpenCreate: mockHandleOpenCreate,
    handleOpenEdit: vi.fn(),
    handleCloseModal: vi.fn(),
    handleSubmitForm: vi.fn(),
    handleToggleEstado: vi.fn(),
    handleSort: vi.fn(),
    isConfirmModalOpen: false,
    usuarioToToggle: null,
    handleOpenConfirm: vi.fn(),
    handleCloseConfirm: vi.fn(),
    loggedUserId: 1
  })
}));

const renderWithRouter = (ui) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('Usuarios Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    // Simulate admin logged in by default for most tests
    localStorage.setItem('user_profile', JSON.stringify({ rol: 'ADMIN' }));
  });

  it('1. Renderiza la lista de usuarios correctamente', () => {
    renderWithRouter(<Usuarios />);
    expect(screen.getByText('Gestión de Usuarios')).toBeInTheDocument();
    expect(screen.getByText('admin@test.com')).toBeInTheDocument();
    expect(screen.getByText('user@test.com')).toBeInTheDocument();
  });

  it('2. Redirige si el usuario no es administrador', async () => {
    localStorage.setItem('user_profile', JSON.stringify({ rol: 'USUARIO' }));
    renderWithRouter(<Usuarios />);
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
    });
  });

  it('3. Muestra el input de búsqueda y permite filtrar', async () => {
    renderWithRouter(<Usuarios />);
    const user = userEvent.setup();
    const searchInput = screen.getByPlaceholderText(/Buscar por nombre/i);
    
    await user.type(searchInput, 'admin');
    
    await waitFor(() => {
      expect(mockSetSearchTerm).toHaveBeenCalled();
    });
  });

  it('4. Muestra datos de paginación o totales correctamente', () => {
    renderWithRouter(<Usuarios />);
    expect(screen.getByText('Usuarios Registrados:')).toBeInTheDocument();
    // There are 2 total users mockeados
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('5. Abre el modal de creación al hacer clic en Crear usuario', async () => {
    renderWithRouter(<Usuarios />);
    const user = userEvent.setup();
    const createBtn = screen.getByRole('button', { name: /Crear usuario/i });
    
    await user.click(createBtn);
    
    expect(mockHandleOpenCreate).toHaveBeenCalled();
  });
});
