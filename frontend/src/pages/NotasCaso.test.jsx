import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import NotasCaso from './NotasCaso';
import CasoService from '../services/casoService';

vi.mock('../services/casoService', () => ({
  default: {
    listarNotas: vi.fn().mockResolvedValue({ data: [] }),
  },
}));

describe('NotasCaso Component', () => {
  const renderNotas = () => render(<NotasCaso casoId={1} />);

  it('1. Muestra el loader o el título Bitácora del Caso', async () => {
    renderNotas();
    await waitFor(() => expect(screen.getByText(/Bitácora del Caso/i)).toBeInTheDocument());
  });

  it('2. Muestra el campo de texto para escribir una nota', async () => {
    renderNotas();
    await waitFor(() => expect(screen.getByPlaceholderText(/Escribe una nueva nota/i)).toBeInTheDocument());
  });

  it('3. Renderiza el botón "Dejar nota"', async () => {
    renderNotas();
    await waitFor(() => expect(screen.getByRole('button', { name: /Dejar nota/i })).toBeInTheDocument());
  });

  it('4. Muestra un mensaje cuando no hay notas', async () => {
    renderNotas();
    await waitFor(() => expect(screen.getByText(/Aún no hay notas en la bitácora/i)).toBeInTheDocument());
  });

  it('5. Renderiza el conteo de notas en cero', async () => {
    renderNotas();
    await waitFor(() => expect(screen.getByText(/0 notas/i)).toBeInTheDocument());
  });
});
