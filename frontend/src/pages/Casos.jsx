import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useForm } from 'react-hook-form';
import CasoService from '../services/casoService';
import ClienteService from '../services/clienteService';

// Fases del backend (FaseCaso enum)
const FASES = ['Abierto', 'Discusion', 'Conciliacion', 'Prueba', 'Impugnacion', 'Cerrado'];

const faseBadge = (estado) => {
  const map = {
    'Abierto':      { bg: 'bg-blue-50 border border-blue-200',   text: 'text-primary-container', dot: 'bg-primary-container' },
    'Discusion':    { bg: 'bg-amber-50 border border-amber-200', text: 'text-amber-700',          dot: 'bg-amber-500' },
    'Conciliacion': { bg: 'bg-orange-50 border border-orange-200',text: 'text-orange-700',        dot: 'bg-orange-500' },
    'Prueba':       { bg: 'bg-purple-50 border border-purple-200',text: 'text-purple-700',        dot: 'bg-purple-500' },
    'Impugnacion':  { bg: 'bg-red-50 border border-red-200',     text: 'text-error',             dot: 'bg-error' },
    'Cerrado':      { bg: 'bg-surface-container-highest',        text: 'text-on-surface-variant', dot: 'bg-outline' },
  };
  return map[estado] || map['Abierto'];
};

const prioridadBadge = (prioridad) => {
  const map = {
    'ALTA': { bg: 'bg-red-100', text: 'text-red-800' },
    'MEDIA': { bg: 'bg-yellow-100', text: 'text-yellow-800' },
    'BAJA': { bg: 'bg-green-100', text: 'text-green-800' },
  };
  return map[prioridad] || map['MEDIA'];
};

const formatNombreCliente = (c) => {
  if (!c) return '';
  if (c.tipo === 'PERSONA') {
    return `${c.nombre} ${c.apellido || ''}`.trim();
  }
  return c.razon_social || c.nombre;
};

const ITEMS_POR_PAGINA = 10;

const getPerfil = () => {
  try { return JSON.parse(localStorage.getItem('user_profile') || '{}'); }
  catch { return {}; }
};

const formatFecha = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });
};

// ── Modal genérico ──
const Modal = ({ titulo, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 overflow-y-auto py-10">
    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 p-padding-card my-auto">
      <div className="flex justify-between items-center mb-stack-lg">
        <h3 className="font-title-sm text-title-sm text-on-surface">{titulo}</h3>
        <button type="button" onClick={onClose} className="text-on-surface-variant hover:text-on-surface transition-colors">
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>
      {children}
    </div>
  </div>
);


const Casos = () => {
  const [casos, setCasos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState('');
  const [pagina, setPagina] = useState(1);
  const [modalCrear, setModalCrear] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [sortBy, setSortBy] = useState('id');
  const [sortOrder, setSortOrder] = useState('desc');
  const [verInactivos, setVerInactivos] = useState(false);

  const perfil = getPerfil();
  const esAdmin = perfil.rol === 'ADMIN';
  const navigate = useNavigate();

  const formCrear = useForm({ 
    defaultValues: { 
      titulo: '', 
      descripcion: '', 
      cliente_id: '', 
      estado: 'Abierto',
      numero_rol: '',
      tribunal: '',
      materia: '',
      prioridad: 'MEDIA',
      fecha_inicio: '',
      fecha_cierre: ''
    } 
  });

  const cargarCasos = async (inactivos = verInactivos) => {
    setCargando(true);
    try {
      const [casosResp, clientesActivosResp] = await Promise.all([
        inactivos ? CasoService.listarInactivos() : CasoService.listar(),
        ClienteService.listar(),
      ]);
      const casosData = casosResp.data;
      let clientesData = clientesActivosResp.data;

      if (esAdmin) {
        try {
          const inactivosResp = await ClienteService.listarInactivos();
          clientesData = [...clientesData, ...inactivosResp.data];
        } catch { /* ignorar si falla */ }
      } else {
        const idsEnLista = new Set(clientesData.map(c => c.id));
        const idsFaltantes = [...new Set(casosData.map(c => c.cliente_id))].filter(id => !idsEnLista.has(id));
        if (idsFaltantes.length > 0) {
          const resultados = await Promise.allSettled(idsFaltantes.map(id => ClienteService.obtener(id)));
          const extras = resultados.filter(r => r.status === 'fulfilled').map(r => r.value.data);
          clientesData = [...clientesData, ...extras];
        }
      }

      setCasos(casosData);
      setClientes(clientesData);
    } catch {
      toast.error('Error al cargar los datos');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarCasos(verInactivos);
  }, [esAdmin, verInactivos]);

  const handleRestaurar = async (e, id) => {
    e.stopPropagation();
    try {
      await CasoService.toggleActivo(id);
      toast.success('Caso restaurado exitosamente');
      cargarCasos(verInactivos);
    } catch (err) {
      toast.error('Error al restaurar caso');
    }
  };

  // Mapear cliente_id → nombre
  const clienteMap = useMemo(() => {
    const m = {};
    clientes.forEach(c => { m[c.id] = formatNombreCliente(c); });
    return m;
  }, [clientes]);

  // Filtro + Ordenado + paginación cliente-side
  const casosFiltrados = useMemo(() => {
    const q = filtro.toLowerCase();
    let res = casos.filter(c =>
      c.titulo.toLowerCase().includes(q) ||
      (c.numero_rol || '').toLowerCase().includes(q) ||
      (clienteMap[c.cliente_id] || '').toLowerCase().includes(q) ||
      c.estado.toLowerCase().includes(q)
    );

    // Sorting
    res.sort((a, b) => {
      let valA, valB;
      if (sortBy === 'cliente') {
        valA = (clienteMap[a.cliente_id] || '').toLowerCase();
        valB = (clienteMap[b.cliente_id] || '').toLowerCase();
      } else if (sortBy === 'id') {
        valA = a.id;
        valB = b.id;
      } else if (sortBy === 'fecha') {
        valA = new Date(a.fecha_creacion).getTime();
        valB = new Date(b.fecha_creacion).getTime();
      } else if (sortBy === 'fase') {
        // Ordenar por el orden lógico de las fases en el array FASES
        valA = FASES.indexOf(a.estado);
        valB = FASES.indexOf(b.estado);
      } else if (sortBy === 'titulo') {
        valA = a.titulo.toLowerCase();
        valB = b.titulo.toLowerCase();
      } else {
        valA = (a[sortBy] || '').toString().toLowerCase();
        valB = (b[sortBy] || '').toString().toLowerCase();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return res;
  }, [casos, filtro, clienteMap, sortBy, sortOrder]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const renderSortIndicator = (field) => {
    if (sortBy !== field) return <span className="material-symbols-outlined text-[14px] opacity-30 ml-1 align-middle">unfold_more</span>;
    return (
      <span className="material-symbols-outlined text-[14px] ml-1 align-middle text-primary-container">
        {sortOrder === 'asc' ? 'arrow_downward' : 'arrow_upward'}
      </span>
    );
  };

  const totalPaginas = Math.max(1, Math.ceil(casosFiltrados.length / ITEMS_POR_PAGINA));
  const casosPagina = casosFiltrados.slice((pagina - 1) * ITEMS_POR_PAGINA, pagina * ITEMS_POR_PAGINA);

  // ── Crear ──
  const onCrear = async (data) => {
    setGuardando(true);
    try {
      const payload = { ...data, cliente_id: parseInt(data.cliente_id) };
      Object.keys(payload).forEach(k => {
        if (payload[k] === '') payload[k] = null;
      });

      await CasoService.crear(payload);
      toast.success('Caso creado exitosamente');
      setModalCrear(false);
      formCrear.reset();
      await cargarCasos();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al crear el caso');
    } finally {
      setGuardando(false);
    }
  };


  return (
    <div className="p-margin-page max-w-[1600px] mx-auto flex flex-col gap-stack-lg">

      {/* ── Page Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display-lg text-display-lg text-primary-container flex items-center gap-3">
            {verInactivos ? 'Casos Eliminados' : 'Casos'}
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            {verInactivos ? 'Archivos y expedientes dados de baja.' : 'Gestión y seguimiento de expedientes legales.'}
          </p>
        </div>
        {!verInactivos && (
          <button
            onClick={() => setModalCrear(true)}
            className="px-5 py-2.5 bg-surface border border-secondary-fixed text-primary-container font-title-sm text-sm font-bold rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-2 shadow-sm"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            Nuevo Caso
          </button>
        )}
      </div>

      {/* ── Tabla ── */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">

        {/* Toolbar */}
        <div className="p-padding-card border-b border-outline-variant flex flex-wrap items-center justify-between gap-2 bg-surface-container-low/50">
          <div className="relative border border-outline-variant rounded-lg bg-surface-container-lowest flex items-center px-3 py-2 w-full sm:w-64 focus-within:border-primary-container">
            <span className="material-symbols-outlined text-outline text-[18px] mr-2">search</span>
            <input
              type="text"
              value={filtro}
              onChange={e => { setFiltro(e.target.value); setPagina(1); }}
              placeholder="Filtrar casos..."
              className="bg-transparent border-none outline-none w-full font-body-sm text-body-sm text-on-surface placeholder:text-outline p-0 focus:ring-0"
            />
          </div>
          
          <div className="flex items-center gap-4 flex-wrap">
            {esAdmin && (
              <button
                onClick={() => { setVerInactivos(!verInactivos); setPagina(1); }}
                className="text-sm font-medium text-secondary hover:text-primary-container transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded hover:bg-surface-container-lowest"
              >
                <span className="material-symbols-outlined text-[18px]">{verInactivos ? 'arrow_back' : 'visibility_off'}</span>
                {verInactivos ? 'Volver a casos activos' : 'Ver casos eliminados'}
              </button>
            )}
            
            <div className="font-body-sm text-body-sm text-on-surface-variant">
              {cargando
                ? 'Cargando...'
                : `Mostrando ${casosFiltrados.length === 0 ? 0 : (pagina - 1) * ITEMS_POR_PAGINA + 1}–${Math.min(pagina * ITEMS_POR_PAGINA, casosFiltrados.length)} de ${casosFiltrados.length} casos`
              }
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto w-full hidden md:block">
          <table className="w-full text-left border-collapse min-w-[750px]">
            <thead className="bg-surface-container-low border-b border-outline-variant">
            <tr>
              <th className="font-label-caps text-label-caps text-on-surface-variant px-gutter-table py-stack-md tracking-wider cursor-pointer hover:bg-surface-variant/50 transition-colors" onClick={() => handleSort('id')}>
                <div className="flex items-center">REF {renderSortIndicator('id')}</div>
              </th>
              <th className="font-label-caps text-label-caps text-on-surface-variant px-gutter-table py-stack-md tracking-wider cursor-pointer hover:bg-surface-variant/50 transition-colors" onClick={() => handleSort('numero_rol')}>
                <div className="flex items-center">ROL / TRIBUNAL {renderSortIndicator('numero_rol')}</div>
              </th>
              <th className="font-label-caps text-label-caps text-on-surface-variant px-gutter-table py-stack-md tracking-wider cursor-pointer hover:bg-surface-variant/50 transition-colors" onClick={() => handleSort('titulo')}>
                <div className="flex items-center">TÍTULO {renderSortIndicator('titulo')}</div>
              </th>
              <th className="font-label-caps text-label-caps text-on-surface-variant px-gutter-table py-stack-md tracking-wider cursor-pointer hover:bg-surface-variant/50 transition-colors" onClick={() => handleSort('cliente')}>
                <div className="flex items-center">CLIENTE {renderSortIndicator('cliente')}</div>
              </th>
              <th className="font-label-caps text-label-caps text-on-surface-variant px-gutter-table py-stack-md tracking-wider cursor-pointer hover:bg-surface-variant/50 transition-colors" onClick={() => handleSort('fase')}>
                <div className="flex items-center">FASE {renderSortIndicator('fase')}</div>
              </th>
              <th className="font-label-caps text-label-caps text-on-surface-variant px-gutter-table py-stack-md tracking-wider cursor-pointer hover:bg-surface-variant/50 transition-colors" onClick={() => handleSort('prioridad')}>
                <div className="flex items-center">PRIORIDAD {renderSortIndicator('prioridad')}</div>
              </th>
              <th className="font-label-caps text-label-caps text-on-surface-variant px-gutter-table py-stack-md tracking-wider text-center w-32">
                {verInactivos ? 'Acciones' : 'Ver detalle'}
              </th>
            </tr>
            </thead>
            <tbody className="bg-surface-container-lowest divide-y divide-outline-variant">
              {cargando ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-on-surface-variant">
                    <span className="material-symbols-outlined text-[36px] block mb-2 animate-spin">progress_activity</span>
                    Cargando casos...
                  </td>
                </tr>
              ) : casosPagina.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-on-surface-variant font-body-md">
                    No se encontraron casos.
                  </td>
                </tr>
              ) : (
                casosPagina.map(caso => {
                  const badge = faseBadge(caso.estado);
                  const pBadge = prioridadBadge(caso.prioridad);
                  return (
                    <tr key={caso.id} className="hover:bg-[#F0F7FF] transition-colors group">
                      <td className="font-table-cell text-table-cell text-secondary px-gutter-table py-stack-md font-mono text-xs">
                        #{String(caso.id).padStart(4, '0')}
                      </td>
                      <td className="font-table-cell text-table-cell text-on-surface-variant px-gutter-table py-stack-md max-w-[200px] truncate">
                        <div className="font-medium text-on-surface">{caso.numero_rol || <span className="text-outline italic">Sin Rol</span>}</div>
                        <div className="text-xs">{caso.tribunal || '—'}</div>
                      </td>
                      <td className="font-table-cell text-table-cell text-on-surface font-medium px-gutter-table py-stack-md max-w-[240px] truncate">
                        {caso.titulo}
                      </td>
                      <td className="font-table-cell text-table-cell text-on-surface px-gutter-table py-stack-md">
                        {clienteMap[caso.cliente_id] || `Cliente #${caso.cliente_id}`}
                      </td>
                      <td className="px-gutter-table py-stack-md">
                        <span className={`${badge.bg} ${badge.text} font-label-caps text-[10px] px-2 py-1 rounded-lg inline-flex items-center gap-1`}>
                          {caso.estado}
                        </span>
                      </td>
                      <td className="px-gutter-table py-stack-md">
                        <span className={`${pBadge.bg} ${pBadge.text} font-label-caps text-[10px] px-2 py-0.5 rounded`}>
                          {caso.prioridad || 'MEDIA'}
                        </span>
                      </td>
                      <td className="px-gutter-table py-stack-md text-center">
                        <div className="flex items-center justify-center">
                          {verInactivos ? (
                            <button
                              onClick={(e) => handleRestaurar(e, caso.id)}
                              className="px-3 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded text-xs font-bold border border-emerald-200 transition-colors flex items-center gap-1"
                              title="Restaurar caso"
                            >
                              <span className="material-symbols-outlined text-[16px]">restore</span> Restaurar
                            </button>
                          ) : (
                            <button
                              onClick={() => navigate(`/casos/${caso.id}`)}
                              className="text-slate-400 hover:text-primary-container transition-colors p-1"
                            >
                              <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Vista Tarjetas (móvil) ── */}
      <div className="md:hidden flex flex-col gap-3">
        {cargando ? (
          <div className="text-center py-12 text-on-surface-variant bg-white border border-outline-variant rounded-xl">
            <span className="material-symbols-outlined text-[36px] block mb-2 animate-spin">progress_activity</span>
            Cargando casos...
          </div>
        ) : casosPagina.length === 0 ? (
          <div className="text-center py-12 text-on-surface-variant font-body-md bg-white border border-outline-variant rounded-xl">
            No se encontraron casos.
          </div>
        ) : (
          casosPagina.map(caso => {
            const badge = faseBadge(caso.estado);
            const pBadge = prioridadBadge(caso.prioridad);
            return (
              <div
                key={caso.id}
                onClick={() => !verInactivos && navigate(`/casos/${caso.id}`)}
                className="bg-white border border-outline-variant rounded-xl p-4 shadow-sm flex flex-col gap-3 cursor-pointer active:bg-slate-50 transition-colors"
              >
                {/* Cabecera */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-on-surface text-sm leading-snug line-clamp-2">{caso.titulo}</p>
                    <p className="text-xs text-on-surface-variant mt-0.5">{clienteMap[caso.cliente_id] || `Cliente #${caso.cliente_id}`}</p>
                  </div>
                  {verInactivos ? (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleRestaurar(e, caso.id); }}
                      className="px-3 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded text-xs font-bold border border-emerald-200 transition-colors flex items-center gap-1 shrink-0"
                    >
                      <span className="material-symbols-outlined text-[16px]">restore</span> Restaurar
                    </button>
                  ) : (
                    <span className="material-symbols-outlined text-[20px] text-slate-400 shrink-0">arrow_forward</span>
                  )}
                </div>
                {/* Badges */}
                <div className="flex items-center gap-2 flex-wrap border-t border-outline-variant pt-3">
                  <span className="font-mono text-[10px] text-secondary">№ {caso.numero_rol || 'Sin Rol'}</span>
                  <span className="text-outline">·</span>
                  <span className={`${badge.bg} ${badge.text} font-label-caps text-[10px] px-2 py-0.5 rounded-lg`}>
                    {caso.estado}
                  </span>
                  <span className={`${pBadge.bg} ${pBadge.text} font-label-caps text-[10px] px-2 py-0.5 rounded`}>
                    {caso.prioridad || 'MEDIA'}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Paginación (compartida) ── */}
      <div className="py-4 flex items-center justify-between flex-wrap gap-3">
        <span className="font-body-sm text-body-sm text-on-surface-variant">
          Página {pagina} de {totalPaginas}
        </span>
        <div className="flex items-center gap-2">
          <button onClick={() => setPagina(p => Math.max(1, p - 1))} disabled={pagina === 1}
            className="p-1 text-outline hover:text-on-surface transition-colors disabled:opacity-40">
            <span className="material-symbols-outlined text-[20px]">chevron_left</span>
          </button>
          <span className="font-body-sm text-body-sm text-on-surface-variant">{pagina} / {totalPaginas}</span>
          <button onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))} disabled={pagina === totalPaginas}
            className="p-1 text-outline hover:text-on-surface transition-colors disabled:opacity-40">
            <span className="material-symbols-outlined text-[20px]">chevron_right</span>
          </button>
        </div>
      </div>

      {/* ── Modal: Crear Caso ── */}
      {modalCrear && (
        <Modal titulo="Nuevo Caso" onClose={() => { setModalCrear(false); formCrear.reset(); }}>
          <form onSubmit={formCrear.handleSubmit(onCrear)} className="flex flex-col gap-4">
            
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block font-body-sm text-body-sm text-on-surface font-medium mb-1">Título *</label>
                <input
                  {...formCrear.register('titulo', { required: 'El título es obligatorio' })}
                  className="w-full border border-outline-variant rounded px-3 py-2 font-body-sm text-body-sm focus:border-primary-container focus:ring-2 focus:ring-primary-fixed-dim outline-none"
                  placeholder="Ej: Litigio Comercial Rodríguez vs Silva"
                />
                {formCrear.formState.errors.titulo && (
                  <p className="text-error text-xs mt-1">{formCrear.formState.errors.titulo.message}</p>
                )}
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="block font-body-sm text-body-sm text-on-surface font-medium mb-1">Cliente *</label>
                <select
                  {...formCrear.register('cliente_id', { required: 'El cliente es obligatorio' })}
                  className="w-full border border-outline-variant rounded px-3 py-2 font-body-sm text-body-sm focus:border-primary-container outline-none bg-white"
                >
                  <option value="">Seleccionar cliente...</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{formatNombreCliente(c)}</option>)}
                </select>
                {formCrear.formState.errors.cliente_id && (
                  <p className="text-error text-xs mt-1">{formCrear.formState.errors.cliente_id.message}</p>
                )}
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="block font-body-sm text-body-sm text-on-surface font-medium mb-1">Prioridad</label>
                <select
                  {...formCrear.register('prioridad')}
                  className="w-full border border-outline-variant rounded px-3 py-2 font-body-sm text-body-sm focus:border-primary-container outline-none bg-white"
                >
                  <option value="ALTA">Alta</option>
                  <option value="MEDIA">Media</option>
                  <option value="BAJA">Baja</option>
                </select>
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="block font-body-sm text-body-sm text-on-surface font-medium mb-1">Número de Rol</label>
                <input
                  {...formCrear.register('numero_rol')}
                  className="w-full border border-outline-variant rounded px-3 py-2 font-body-sm text-body-sm focus:border-primary-container focus:ring-2 focus:ring-primary-fixed-dim outline-none"
                  placeholder="Ej: C-1234-2023"
                />
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="block font-body-sm text-body-sm text-on-surface font-medium mb-1">Materia</label>
                <input
                  {...formCrear.register('materia')}
                  className="w-full border border-outline-variant rounded px-3 py-2 font-body-sm text-body-sm focus:border-primary-container focus:ring-2 focus:ring-primary-fixed-dim outline-none"
                  placeholder="Ej: Civil, Laboral..."
                />
              </div>

              <div className="col-span-2">
                <label className="block font-body-sm text-body-sm text-on-surface font-medium mb-1">Tribunal</label>
                <input
                  {...formCrear.register('tribunal')}
                  className="w-full border border-outline-variant rounded px-3 py-2 font-body-sm text-body-sm focus:border-primary-container focus:ring-2 focus:ring-primary-fixed-dim outline-none"
                  placeholder="Ej: 1° Juzgado Civil de Santiago"
                />
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="block font-body-sm text-body-sm text-on-surface font-medium mb-1">Fecha de Inicio</label>
                <input
                  type="date"
                  {...formCrear.register('fecha_inicio')}
                  className="w-full border border-outline-variant rounded px-3 py-2 font-body-sm text-body-sm focus:border-primary-container focus:ring-2 focus:ring-primary-fixed-dim outline-none"
                />
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="block font-body-sm text-body-sm text-on-surface font-medium mb-1">Fase inicial</label>
                <select
                  {...formCrear.register('estado')}
                  className="w-full border border-outline-variant rounded px-3 py-2 font-body-sm text-body-sm focus:border-primary-container outline-none bg-white"
                >
                  {FASES.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>

              <div className="col-span-2">
                <label className="block font-body-sm text-body-sm text-on-surface font-medium mb-1">Descripción</label>
                <textarea
                  {...formCrear.register('descripcion')}
                  rows={3}
                  className="w-full border border-outline-variant rounded px-3 py-2 font-body-sm text-body-sm focus:border-primary-container focus:ring-2 focus:ring-primary-fixed-dim outline-none resize-none"
                  placeholder="Descripción del expediente..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-4">
              <button type="button" onClick={() => { setModalCrear(false); formCrear.reset(); }}
                className="px-5 py-2 border border-outline-variant rounded font-body-sm text-body-sm text-on-surface hover:bg-surface-container transition-colors">
                Cancelar
              </button>
              <button type="submit" disabled={guardando}
                className="px-5 py-2 bg-primary-container text-on-primary rounded font-body-sm text-body-sm hover:bg-primary transition-colors disabled:opacity-60">
                {guardando ? 'Creando...' : 'Crear Caso'}
              </button>
            </div>
          </form>
        </Modal>
      )}

    </div>
  );
};

export default Casos;
