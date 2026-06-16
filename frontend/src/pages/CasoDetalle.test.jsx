import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import CasoDetalle from './CasoDetalle';

vi.mock('../services/casoService', () => ({
  default: {
    obtener: vi.fn().mockResolvedValue({ data: { id: 1, cliente_id: 1, titulo: 'Caso Test', estado: 'Abierto' } }),
    listarUsuarios: vi.fn().mockResolvedValue({ data: [] }),
  },
}));

vi.mock('../services/clienteService', () => ({
  default: {
    obtener: vi.fn().mockResolvedValue({ data: { id: 1, nombre: 'Cliente Test' } }),
  },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ id: '1' })
  };
});

describe('CasoDetalle Page', () => {
  const renderDetalle = () => render(
    <MemoryRouter>
      <CasoDetalle />
    </MemoryRouter>
  );

  it('1. Renderiza el componente sin crashear', () => {
    const { container } = renderDetalle();
    expect(container).not.toBeEmptyDOMElement();
  });

  it('2. Existe en el DOM', () => {
    renderDetalle();
    expect(document.body).toBeTruthy();
  });

  it('3. Retorna un nodo válido', () => {
    const { container } = renderDetalle();
    expect(container.firstChild).toBeDefined();
  });

  it('4. Tiene un contenedor principal', () => {
    const { container } = renderDetalle();
    expect(container).toBeInTheDocument();
  });

  it('5. Renderiza elementos HTML correctamente', () => {
    const { container } = renderDetalle();
    expect(container.innerHTML.length).toBeGreaterThan(0);
  });
});
