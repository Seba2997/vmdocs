import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import LoginForm from './LoginForm';

// Mock dependencias
vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

const mockIniciarSesion = vi.fn();
vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    iniciarSesion: mockIniciarSesion,
    cargando: false,
    error: null
  })
}));

describe('LoginForm Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. Renderiza el formulario de login correctamente', () => {
    render(<LoginForm />);
    expect(screen.getByPlaceholderText('ejemplo@empresa.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument();
  });

  it('2. Muestra errores de validación si se intenta enviar vacío', async () => {
    render(<LoginForm />);
    const user = userEvent.setup();
    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });
    
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('El correo es obligatorio')).toBeInTheDocument();
      expect(screen.getByText('La contraseña es obligatoria')).toBeInTheDocument();
    });
    expect(mockIniciarSesion).not.toHaveBeenCalled();
  });

  it('3. Permite escribir en los campos de email y contraseña', async () => {
    render(<LoginForm />);
    const user = userEvent.setup();
    const emailInput = screen.getByPlaceholderText('ejemplo@empresa.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');

    await user.type(emailInput, 'test@empresa.com');
    await user.type(passwordInput, 'password123');

    expect(emailInput.value).toBe('test@empresa.com');
    expect(passwordInput.value).toBe('password123');
  });

  it('4. Valida el formato del correo y longitud de contraseña', async () => {
    render(<LoginForm />);
    const user = userEvent.setup();
    
    await user.type(screen.getByPlaceholderText('ejemplo@empresa.com'), 'correo-invalido');
    await user.type(screen.getByPlaceholderText('••••••••'), '123');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(screen.getByText('Ingresa un correo electrónico válido (ej: nombre@dominio.com)')).toBeInTheDocument();
      expect(screen.getByText('La contraseña debe tener al menos 8 caracteres')).toBeInTheDocument();
    });
  });

  it('5. Llama a iniciarSesion con credenciales válidas y muestra éxito', async () => {
    mockIniciarSesion.mockResolvedValueOnce(true);
    render(<LoginForm />);
    const user = userEvent.setup();
    
    await user.type(screen.getByPlaceholderText('ejemplo@empresa.com'), 'admin@vmdocs.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'passwordSeguro123');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(mockIniciarSesion).toHaveBeenCalledWith('admin@vmdocs.com', 'passwordSeguro123');
    });
  });
});
