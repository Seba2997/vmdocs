import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import Casos from './Casos';
import CasoService from '../services/casoService';

vi.mock('../services/casoService', () => ({
  default: {
    listar: vi.fn().mockResolvedValue({ data: [] }),
  },
}));

vi.mock('../services/clienteService', () => ({
  default: { listar: vi.fn().mockResolvedValue({ data: [] }) },
}));
vi.mock('../services/usuarioService', () => ({
  default: { listar: vi.fn().mockResolvedValue({ data: [] }) },
}));

describe('Casos Page', () => {
  const renderCasos = () => render(
    <MemoryRouter>
      <Casos />
    </MemoryRouter>
  );

  it('1. Renderiza el título de la página', async () => {
    renderCasos();
    await waitFor(() => expect(screen.getByText('Casos')).toBeInTheDocument());
  });

  it('2. Renderiza el botón para nuevo caso', async () => {
    renderCasos();
    await waitFor(() => expect(screen.getByRole('button', { name: /Nuevo caso/i })).toBeInTheDocument());
  });

  it('3. Muestra el campo de búsqueda por nombre/RUT', async () => {
    renderCasos();
    await waitFor(() => expect(screen.getAllByRole('textbox')[0]).toBeInTheDocument());
  });

  it('4. Renderiza el contenedor principal correctamente', () => {
    const { container } = renderCasos();
    expect(container).not.toBeEmptyDOMElement();
  });

  it('5. Muestra mensaje de tabla vacía cuando no hay datos', async () => {
    renderCasos();
    await waitFor(() => expect(screen.getAllByText(/No se encontraron casos./i)[0]).toBeInTheDocument());
  });
});
