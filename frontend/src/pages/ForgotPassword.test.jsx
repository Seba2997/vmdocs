import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import ForgotPassword from './ForgotPassword';
import passwordRecoveryService from '../services/passwordRecoveryService';
import { toast } from 'react-toastify';

vi.mock('../services/passwordRecoveryService', () => ({
  default: {
    forgotPassword: vi.fn()
  }
}));

vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

const renderWithRouter = (ui) => render(<BrowserRouter>{ui}</BrowserRouter>);

describe('ForgotPassword Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. Renderiza el input de email y botón de enviar', () => {
    renderWithRouter(<ForgotPassword />);
    expect(screen.getByPlaceholderText('ejemplo@empresa.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Enviar enlace/i })).toBeInTheDocument();
  });

  it('2. Muestra error de validación si el email es inválido', async () => {
    renderWithRouter(<ForgotPassword />);
    const user = userEvent.setup();
    const submitBtn = screen.getByRole('button', { name: /Enviar enlace/i });

    await user.click(submitBtn);
    await waitFor(() => {
      expect(screen.getByText('El correo es obligatorio')).toBeInTheDocument();
    });

    await user.type(screen.getByPlaceholderText('ejemplo@empresa.com'), 'invalidemail');
    await user.click(submitBtn);
    await waitFor(() => {
      expect(screen.getByText('Ingresa un correo electrónico válido')).toBeInTheDocument();
    });
  });

  it('3. Llama a passwordRecoveryService.forgotPassword con el email', async () => {
    passwordRecoveryService.forgotPassword.mockResolvedValueOnce(true);
    renderWithRouter(<ForgotPassword />);
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText('ejemplo@empresa.com'), 'test@empresa.com');
    await user.click(screen.getByRole('button', { name: /Enviar enlace/i }));

    await waitFor(() => {
      expect(passwordRecoveryService.forgotPassword).toHaveBeenCalledWith('test@empresa.com');
    });
  });

  it('4. Muestra mensaje de éxito tras enviar el enlace', async () => {
    passwordRecoveryService.forgotPassword.mockResolvedValueOnce(true);
    renderWithRouter(<ForgotPassword />);
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText('ejemplo@empresa.com'), 'test@empresa.com');
    await user.click(screen.getByRole('button', { name: /Enviar enlace/i }));

    await waitFor(() => {
      expect(screen.getByText(/Hemos enviado las instrucciones a tu correo electrónico/i)).toBeInTheDocument();
    });
  });

  it('5. Muestra error si el servicio falla', async () => {
    passwordRecoveryService.forgotPassword.mockRejectedValueOnce('Error de red');
    renderWithRouter(<ForgotPassword />);
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText('ejemplo@empresa.com'), 'test@empresa.com');
    await user.click(screen.getByRole('button', { name: /Enviar enlace/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Error de red');
    });
  });
});
