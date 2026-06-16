import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import Dashboard from './Dashboard';
import api from '../services/api';

vi.mock('../services/api', () => ({
  default: {
    get: vi.fn().mockResolvedValue({
      data: {
        kpis: { casosActivos: 10, clientes: 5, casosAbiertos: 3, casosCerrados: 7, documentosAnalizados: 15 },
        chartData: [],
        actividadReciente: []
      }
    }),
  },
}));

describe('Dashboard Page', () => {
  const renderDashboard = () => render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>
  );

  it('1. Renderiza el título Visión General', async () => {
    renderDashboard();
    await waitFor(() => expect(screen.getByText(/Visión General/i)).toBeInTheDocument());
  });

  it('2. Muestra KPI de Casos Activos', async () => {
    renderDashboard();
    await waitFor(() => expect(screen.getByText(/Casos Activos/i)).toBeInTheDocument());
  });

  it('3. Muestra KPI de Clientes', async () => {
    renderDashboard();
    await waitFor(() => expect(screen.getByText(/Clientes/i)).toBeInTheDocument());
  });

  it('4. Renderiza la sección de Actividad Reciente', async () => {
    renderDashboard();
    await waitFor(() => expect(screen.getByText(/Actividad Reciente/i)).toBeInTheDocument());
  });

  it('5. Renderiza el gráfico de Tendencia', async () => {
    renderDashboard();
    await waitFor(() => expect(screen.getByText(/Tendencia de Casos por Fase/i)).toBeInTheDocument());
  });
});
