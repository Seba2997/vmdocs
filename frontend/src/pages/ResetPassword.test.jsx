import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import ResetPassword from './ResetPassword';
import passwordRecoveryService from '../services/passwordRecoveryService';

// Mock dependencias
vi.mock('../services/passwordRecoveryService', () => ({
  default: {
    getTokenInfo: vi.fn(),
    resetPassword: vi.fn()
  }
}));

const mockNavigate = vi.fn();
let mockSearchParams = new URLSearchParams('?token=valid-token');

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [mockSearchParams]
  };
});

vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

const renderWithRouter = (ui) => render(<BrowserRouter>{ui}</BrowserRouter>);

describe('ResetPassword Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams('?token=valid-token');
    passwordRecoveryService.getTokenInfo.mockResolvedValue({ status: 'valid', email: 'test@vmdocs.com', nombre: 'Test' });
  });

  it('1. Renderiza los campos de contraseña', async () => {
    renderWithRouter(<ResetPassword />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Nueva contraseña/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Confirmar contraseña/i)).toBeInTheDocument();
    });
  });

  it('2. Muestra error si las contraseñas no coinciden', async () => {
    renderWithRouter(<ResetPassword />);
    const user = userEvent.setup();

    await waitFor(() => expect(screen.getByLabelText(/Nueva contraseña/i)).toBeInTheDocument());

    await user.type(screen.getByLabelText(/Nueva contraseña/i), 'Password123!');
    await user.type(screen.getByLabelText(/Confirmar contraseña/i), 'DifferentPassword');
    await user.click(screen.getByRole('button', { name: /Cambiar contraseña/i }));

    await waitFor(() => {
      expect(screen.getByText('Las contraseñas no coinciden')).toBeInTheDocument();
    });
  });

  it('3. Valida la complejidad de la contraseña', async () => {
    renderWithRouter(<ResetPassword />);
    const user = userEvent.setup();

    await waitFor(() => expect(screen.getByLabelText(/Nueva contraseña/i)).toBeInTheDocument());

    await user.type(screen.getByLabelText(/Nueva contraseña/i), 'weak');
    await user.click(screen.getByRole('button', { name: /Cambiar contraseña/i }));

    await waitFor(() => {
      expect(screen.getByText('La contraseña debe tener al menos 8 caracteres')).toBeInTheDocument();
    });
  });

  it('4. Llama a resetPassword con éxito', async () => {
    passwordRecoveryService.resetPassword.mockResolvedValueOnce(true);
    renderWithRouter(<ResetPassword />);
    const user = userEvent.setup();

    await waitFor(() => expect(screen.getByLabelText(/Nueva contraseña/i)).toBeInTheDocument());

    await user.type(screen.getByLabelText(/Nueva contraseña/i), 'ValidPass123!');
    await user.type(screen.getByLabelText(/Confirmar contraseña/i), 'ValidPass123!');
    await user.click(screen.getByRole('button', { name: /Cambiar contraseña/i }));

    await waitFor(() => {
      expect(passwordRecoveryService.resetPassword).toHaveBeenCalledWith('valid-token', 'ValidPass123!', 'ValidPass123!');
    });
  });

  it('5. Muestra error si el enlace está expirado/inválido', async () => {
    passwordRecoveryService.getTokenInfo.mockResolvedValueOnce({ status: 'expired' });
    renderWithRouter(<ResetPassword />);

    await waitFor(() => {
      expect(screen.getByText('Enlace expirado')).toBeInTheDocument();
    });
  });
});
