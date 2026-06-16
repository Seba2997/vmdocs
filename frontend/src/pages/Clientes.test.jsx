import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import Clientes from './Clientes';
import ClienteService from '../services/clienteService';

vi.mock('../services/clienteService', () => ({
  default: {
    listar: vi.fn().mockResolvedValue({ data: [] }),
  },
}));

vi.mock('../services/casoService', () => ({
  default: { listar: vi.fn().mockResolvedValue({ data: [] }) },
}));

describe('Clientes Page', () => {
  const renderClientes = () => render(
    <MemoryRouter>
      <Clientes />
    </MemoryRouter>
  );

  it('1. Renderiza el título de la página', async () => {
    renderClientes();
    await waitFor(() => expect(screen.getAllByText('Clientes')[0]).toBeInTheDocument());
  });

  it('2. Muestra el botón Nuevo cliente', async () => {
    renderClientes();
    await waitFor(() => expect(screen.getByRole('button', { name: /Nuevo cliente/i })).toBeInTheDocument());
  });

  it('3. Renderiza el campo de búsqueda', async () => {
    renderClientes();
    await waitFor(() => expect(screen.getByPlaceholderText(/Buscar por nombre, RUT, email/i)).toBeInTheDocument());
  });

  it('4. Renderiza el contenedor principal correctamente', () => {
    const { container } = renderClientes();
    expect(container).not.toBeEmptyDOMElement();
  });

  it('5. Muestra mensaje de tabla vacía cuando no hay datos', async () => {
    renderClientes();
    await waitFor(() => expect(screen.getAllByText(/No se encontraron clientes/i)[0]).toBeInTheDocument());
  });
});
