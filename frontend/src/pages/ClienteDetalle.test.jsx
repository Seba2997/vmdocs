import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import ClienteDetalle from './ClienteDetalle';
import ClienteService from '../services/clienteService';

vi.mock('../services/clienteService', () => ({
  default: {
    obtener: vi.fn().mockResolvedValue({
      data: { id: 1, nombre: 'Juan', apellido: 'Perez', rut: '11.111.111-1', email: 'test@test.com', tipo: 'PERSONA', estado: true }
    }),
  },
}));

vi.mock('../services/casoService', () => ({
  default: { listarPorCliente: vi.fn().mockResolvedValue({ data: [] }) },
}));

describe('ClienteDetalle Page', () => {
  const renderDetalle = () => render(
    <MemoryRouter>
      <ClienteDetalle />
    </MemoryRouter>
  );

  it('1. Renderiza el loader o el nombre del cliente', async () => {
    renderDetalle();
    await waitFor(() => expect(screen.getAllByText(/Juan Perez/i)[0]).toBeInTheDocument());
  });

  it('2. Muestra el RUT del cliente', async () => {
    renderDetalle();
    await waitFor(() => expect(screen.getAllByText(/11.111.111-1/i)[0]).toBeInTheDocument());
  });

  it('3. Muestra el email del cliente', async () => {
    renderDetalle();
    await waitFor(() => expect(screen.getAllByText(/test@test.com/i)[0]).toBeInTheDocument());
  });

  it('4. Renderiza la sección Casos Relacionados', async () => {
    renderDetalle();
    await waitFor(() => expect(screen.getAllByText(/Casos Relacionados/i)[0]).toBeInTheDocument());
  });

  it('5. Muestra el botón de editar cliente', async () => {
    renderDetalle();
    await waitFor(() => expect(screen.getAllByRole('button', { name: /Editar/i })[0]).toBeInTheDocument());
  });
});
