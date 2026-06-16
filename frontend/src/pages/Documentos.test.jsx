import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import Documentos from './Documentos';
import CasoService from '../services/casoService';

vi.mock('../services/casoService', () => ({
  default: {
    listar: vi.fn()
  }
}));

const mockSubirDocumento = vi.fn();
const mockDescargarDocumento = vi.fn();

vi.mock('../hooks/useDocumentos', () => ({
  useDocumentos: () => ({
    documentos: [
      { id: 1, nombre_original: 'contrato.pdf', tipo_mime: 'application/pdf', tamano: 1024, fecha_subida: '2023-01-01T00:00:00Z', caso_id: 1, usuario_id: 1 },
      { id: 2, nombre_original: 'evidencia.jpg', tipo_mime: 'image/jpeg', tamano: 2048, fecha_subida: '2023-01-02T00:00:00Z', caso_id: 1, usuario_id: 1 }
    ],
    papelera: [],
    cargando: false,
    subiendo: false,
    fetchDocumentos: vi.fn(),
    fetchPapelera: vi.fn(),
    subirDocumento: mockSubirDocumento,
    eliminarDocumento: vi.fn(),
    restaurarDocumento: vi.fn(),
    eliminarDefinitivamente: vi.fn(),
    obtenerUrlTemporal: vi.fn().mockResolvedValue('http://temporal-url.com'),
    descargarDocumento: mockDescargarDocumento,
  })
}));

vi.mock('react-toastify', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn()
  }
}));

describe('Documentos Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    CasoService.listar.mockResolvedValue({ data: [{ id: 1, titulo: 'Caso Prueba 1' }] });
  });

  it('1. Renderiza la lista de documentos', async () => {
    render(<Documentos />);
    await waitFor(() => {
      expect(screen.getAllByText('contrato.pdf')[0]).toBeInTheDocument();
      expect(screen.getAllByText('evidencia.jpg')[0]).toBeInTheDocument();
    });
  });

  it('2. Filtra los documentos por búsqueda', async () => {
    render(<Documentos />);
    const user = userEvent.setup();
    
    await waitFor(() => expect(screen.getAllByText('contrato.pdf')[0]).toBeInTheDocument());

    const searchInput = screen.getByPlaceholderText(/Buscar documentos/i);
    await user.type(searchInput, 'contrato');

    expect(screen.getAllByText('contrato.pdf')[0]).toBeInTheDocument();
    expect(screen.queryByText('evidencia.jpg')).not.toBeInTheDocument();
  });

  it('3. Llama a descargar o ver documento al hacer clic en los botones del panel derecho', async () => {
    render(<Documentos />);
    const user = userEvent.setup();
    
    await waitFor(() => expect(screen.getAllByText('contrato.pdf')[0]).toBeInTheDocument());

    const docRow = screen.getAllByText('evidencia.jpg')[0];
    await user.click(docRow);

    const downloadBtns = screen.getAllByRole('button', { name: /Bajar/i });
    await user.click(downloadBtns[0]);

    expect(mockDescargarDocumento).toHaveBeenCalledWith(2, 'evidencia.jpg', true);
  });

  it('4. Abre la papelera al hacer clic en el botón', async () => {
    render(<Documentos />);
    const user = userEvent.setup();

    await waitFor(() => expect(screen.getByTitle(/Papelera de reciclaje/i)).toBeInTheDocument());
    
    await user.click(screen.getByTitle(/Papelera de reciclaje/i));
    
    await waitFor(() => {
      // Como no conocemos el texto exacto del modal, verificamos que el componente haya cambiado su estado de forma que se muestren más opciones (el modal en sí) o un diálogo
      expect(document.querySelector('[role="dialog"]') || document.querySelector('.fixed.inset-0')).toBeInTheDocument();
    });
  });

  it('5. Intenta subir un archivo al seleccionar en el input', async () => {
    render(<Documentos />);
    const user = userEvent.setup();
    
    // Necesitamos encontrar el input file hidden usando un poco de astucia (o un testId si lo tuvieramos)
    // El input tiene accept=...
    const inputFiles = document.querySelector('input[type="file"]');
    
    const file = new File(['hello'], 'hello.png', { type: 'image/png' });
    await user.upload(inputFiles, file);
    
    expect(mockSubirDocumento).toHaveBeenCalledWith(file);
  });
});
