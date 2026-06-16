import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import Login from './Login';

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({ isAuthenticated: false })
}));

describe('Login Page', () => {
  const renderLogin = () => render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );

  it('1. Renderiza el título de bienvenida (VMDocs)', () => {
    renderLogin();
    expect(screen.getAllByText(/VMDocs/i)[0]).toBeInTheDocument();
  });

  it('2. Renderiza el botón Iniciar sesión (repetido)', () => {
    renderLogin();
    expect(screen.getAllByText(/Iniciar sesión/i)[0]).toBeInTheDocument();
  });

  it('3. Muestra el componente LoginForm (contiene el input de email)', () => {
    renderLogin();
    expect(screen.getByPlaceholderText(/ejemplo@empresa.com/i)).toBeInTheDocument();
  });

  it('4. Contiene el enlace de ¿Olvidaste tu contraseña?', () => {
    renderLogin();
    expect(screen.getByText(/¿Olvidaste tu contraseña\?/i)).toBeInTheDocument();
  });

  it('5. Renderiza el botón de inicio de sesión', () => {
    renderLogin();
    expect(screen.getByRole('button', { name: /Iniciar sesión/i })).toBeInTheDocument();
  });
});
