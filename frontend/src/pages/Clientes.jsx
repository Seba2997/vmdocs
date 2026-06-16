import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useForm, useWatch } from 'react-hook-form';
import ClienteService from '../services/clienteService';
import CasoService from '../services/casoService';

const ITEMS_POR_PAGINA = 10;

const getPerfil = () => {
  try { return JSON.parse(localStorage.getItem('user_profile') || '{}'); }
  catch { return {}; }
};

// ── Modal genérico ──
const Modal = ({ titulo, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 overflow-y-auto pt-10 pb-10">
    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 p-padding-card">
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

const formatNombreCliente = (c) => {
  if (c.tipo === 'PERSONA') {
    return `${c.nombre} ${c.apellido || ''}`.trim();
  }
  return c.razon_social || c.nombre;
};

const Clientes = () => {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState([]);
  const [casosCount, setCasosCount] = useState({}); // { cliente_id: count }
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState('');
  const [pagina, setPagina] = useState(1);
  const [modalCrear, setModalCrear] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [sortBy, setSortBy] = useState('nombre');
  const [sortOrder, setSortOrder] = useState('asc');
  const [verInactivos, setVerInactivos] = useState(false);

  const perfil = getPerfil();
  const isAdmin = perfil.rol === 'ADMIN';

  const formCrear = useForm({ 
    defaultValues: { 
      tipo: 'PERSONA',
      nombre: '', 
      apellido: '',
      razon_social: '',
      rut: '',
      email: '', 
      telefono: '',
      direccion: '',
      comuna: '',
      ciudad: '',
      observaciones: ''
    } 
  });

  const watchTipo = useWatch({
    control: formCrear.control,
    name: 'tipo'
  });

  const cargarClientes = async (inactivos = verInactivos) => {
    setCargando(true);
    try {
      const [clientesResp, casosResp] = await Promise.all([
        inactivos ? ClienteService.listarInactivos() : ClienteService.listar(),
        CasoService.listar(),
      ]);
      setClientes(clientesResp.data);

      const conteo = {};
      casosResp.data.forEach(c => {
        conteo[c.cliente_id] = (conteo[c.cliente_id] || 0) + 1;
      });
      setCasosCount(conteo);
    } catch {
      toast.error('Error al cargar los datos');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarClientes(verInactivos);
  }, [verInactivos]);

  const handleRestaurar = async (e, id) => {
    e.stopPropagation();
    try {
      await ClienteService.toggleActivo(id);
      toast.success('Cliente restaurado exitosamente');
      cargarClientes(verInactivos);
    } catch (err) {
      toast.error('Error al restaurar cliente');
    }
  };

  // Filtro y Ordenado client-side
  const clientesFiltrados = useMemo(() => {
    const q = filtro.toLowerCase();
    let res = clientes.filter(c =>
      c.nombre.toLowerCase().includes(q) ||
      (c.apellido || '').toLowerCase().includes(q) ||
      (c.razon_social || '').toLowerCase().includes(q) ||
      (c.rut || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q)
    );

    // Sorting
    res.sort((a, b) => {
      let valA, valB;
      if (sortBy === 'casos') {
        valA = casosCount[a.id] || 0;
        valB = casosCount[b.id] || 0;
      } else if (sortBy === 'nombre') {
        valA = formatNombreCliente(a).toLowerCase();
        valB = formatNombreCliente(b).toLowerCase();
      } else {
        valA = (a[sortBy] || '').toString().toLowerCase();
        valB = (b[sortBy] || '').toString().toLowerCase();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return res;
  }, [clientes, filtro, sortBy, sortOrder, casosCount]);

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

  const totalPaginas = Math.max(1, Math.ceil(clientesFiltrados.length / ITEMS_POR_PAGINA));
  const clientesPagina = clientesFiltrados.slice(
    (pagina - 1) * ITEMS_POR_PAGINA,
    pagina * ITEMS_POR_PAGINA
  );

  const paginasVisibles = useMemo(() => {
    const rango = [];
    const delta = 1;
    const inicio = Math.max(1, pagina - delta);
    const fin = Math.min(totalPaginas, pagina + delta);
    for (let i = inicio; i <= fin; i++) rango.push(i);
    return rango;
  }, [pagina, totalPaginas]);

  // ── Crear ──
  const onCrear = async (data) => {
    setGuardando(true);
    try {
      const payload = { ...data };
      if (payload.tipo === 'PERSONA') {
        payload.razon_social = null;
      } else {
        payload.apellido = null;
      }

      // Limpiar vacios
      Object.keys(payload).forEach(k => {
        if (payload[k] === '') payload[k] = null;
      });

      await ClienteService.crear(payload);
      toast.success('Cliente creado exitosamente');
      setModalCrear(false);
      formCrear.reset();
      await cargarClientes();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al crear el cliente');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="p-margin-page max-w-[1400px] mx-auto flex flex-col gap-stack-lg">

      {/* ── Page Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display-lg text-display-lg text-primary-container flex items-center gap-3">
            {verInactivos ? 'Clientes Eliminados' : 'Clientes'}
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            {verInactivos ? 'Directorio de clientes inactivos o dados de baja.' : 'Gestión del portafolio de clientes y entidades representadas.'}
          </p>
        </div>
        {!verInactivos && (
          <button
            onClick={() => setModalCrear(true)}
            className="px-5 py-2.5 bg-surface border border-secondary-fixed text-primary-container font-title-sm text-sm font-bold rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-2 shadow-sm"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            Nuevo cliente
          </button>
        )}
      </div>


      {/* ── Contenedor principal (ígual a Casos) ── */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">

        {/* Toolbar */}
        <div className="p-padding-card border-b border-outline-variant flex flex-wrap items-center justify-between gap-2 bg-surface-container-low/50">
          <div className="relative border border-outline-variant rounded-lg bg-surface-container-lowest flex items-center px-3 py-2 w-full sm:w-80 focus-within:border-primary-container">
            <span className="material-symbols-outlined text-outline text-[18px] mr-2">search</span>
            <input
              type="text"
              value={filtro}
              onChange={e => { setFiltro(e.target.value); setPagina(1); }}
              placeholder="Buscar por nombre, RUT, email..."
              className="bg-transparent border-none outline-none w-full font-body-sm text-body-sm text-on-surface placeholder:text-outline p-0 focus:ring-0"
            />
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            {isAdmin && (
              <button
                onClick={() => { setVerInactivos(!verInactivos); setPagina(1); }}
                className="text-sm font-medium text-secondary hover:text-primary-container transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded hover:bg-surface-container-lowest"
              >
                <span className="material-symbols-outlined text-[18px]">{verInactivos ? 'arrow_back' : 'visibility_off'}</span>
                {verInactivos ? 'Volver a registros activos' : 'Ver registros eliminados'}
              </button>
            )}
            <div className="font-body-sm text-body-sm text-on-surface-variant">
              {cargando
                ? 'Cargando...'
                : `Mostrando ${clientesFiltrados.length === 0 ? 0 : (pagina - 1) * ITEMS_POR_PAGINA + 1}–${Math.min(pagina * ITEMS_POR_PAGINA, clientesFiltrados.length)} de ${clientesFiltrados.length} clientes`
              }
            </div>
          </div>
        </div>

        {/* Vista Tarjetas (móvil) */}
        <div className="md:hidden flex flex-col gap-3 p-4">
          {cargando ? (
            <div className="text-center py-12 text-on-surface-variant">
              <span className="material-symbols-outlined text-[36px] block mb-2 animate-spin">progress_activity</span>
              Cargando clientes...
            </div>
          ) : clientesPagina.length === 0 ? (
            <div className="text-center py-12 text-on-surface-variant font-body-md">
              No se encontraron clientes.
            </div>
          ) : (
            clientesPagina.map(cliente => (
              <div
                key={cliente.id}
                onClick={() => !verInactivos && navigate(`/clientes/${cliente.id}`)}
                className="bg-white border border-outline-variant rounded-xl p-4 shadow-sm flex flex-col gap-3 cursor-pointer active:bg-slate-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${cliente.tipo === 'EMPRESA' ? 'bg-indigo-100 text-indigo-700' : 'bg-teal-100 text-teal-700'}`}>
                        {cliente.tipo}
                      </span>
                      <span className="font-semibold text-on-surface text-sm leading-snug">{formatNombreCliente(cliente)}</span>
                    </div>
                    <p className="text-xs text-on-surface-variant mt-0.5">{cliente.email || <span className="italic">Sin email</span>}</p>
                  </div>
                  {verInactivos ? (
                    <button
                      onClick={(e) => handleRestaurar(e, cliente.id)}
                      className="px-3 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded text-xs font-bold border border-emerald-200 transition-colors flex items-center gap-1 shrink-0"
                    >
                      <span className="material-symbols-outlined text-[16px]">restore</span> Restaurar
                    </button>
                  ) : (
                    <span className="material-symbols-outlined text-[20px] text-slate-400 shrink-0">arrow_forward</span>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap border-t border-outline-variant pt-3">
                  <span className="font-mono text-[10px] text-secondary">RUT: {cliente.rut}</span>
                  <span className="text-outline">·</span>
                  <span className="font-label-caps text-[10px] text-on-surface-variant">
                    {casosCount[cliente.id] ?? 0} caso{(casosCount[cliente.id] ?? 0) !== 1 ? 's' : ''} vinculado{(casosCount[cliente.id] ?? 0) !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Vista Tabla (desktop) */}
        <div className="overflow-x-auto w-full hidden md:block">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead className="bg-surface-container-low border-b border-outline-variant">
              <tr>
                <th className="font-label-caps text-label-caps text-on-surface-variant px-gutter-table py-stack-md tracking-wider cursor-pointer hover:bg-surface-variant/50 transition-colors" onClick={() => handleSort('rut')}>
                  <div className="flex items-center">RUT {renderSortIndicator('rut')}</div>
                </th>
                <th className="font-label-caps text-label-caps text-on-surface-variant px-gutter-table py-stack-md tracking-wider cursor-pointer hover:bg-surface-variant/50 transition-colors" onClick={() => handleSort('nombre')}>
                  <div className="flex items-center">Nombre / Razón Social {renderSortIndicator('nombre')}</div>
                </th>
                <th className="font-label-caps text-label-caps text-on-surface-variant px-gutter-table py-stack-md tracking-wider cursor-pointer hover:bg-surface-variant/50 transition-colors" onClick={() => handleSort('email')}>
                  <div className="flex items-center">Email {renderSortIndicator('email')}</div>
                </th>
                <th className="font-label-caps text-label-caps text-on-surface-variant px-gutter-table py-stack-md tracking-wider text-right cursor-pointer hover:bg-surface-variant/50 transition-colors" onClick={() => handleSort('casos')}>
                  <div className="flex items-center justify-end">Casos Vinculados {renderSortIndicator('casos')}</div>
                </th>
                <th className="font-label-caps text-label-caps text-on-surface-variant px-gutter-table py-stack-md tracking-wider text-center w-32">
                  {verInactivos ? 'Acciones' : 'Ver detalle'}
                </th>
              </tr>
            </thead>
            <tbody className="bg-surface-container-lowest divide-y divide-outline-variant">
              {cargando ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-on-surface-variant">
                    <span className="material-symbols-outlined text-[36px] block mb-2 animate-spin">progress_activity</span>
                    Cargando clientes...
                  </td>
                </tr>
              ) : clientesPagina.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-on-surface-variant font-body-md">
                    No se encontraron clientes.
                  </td>
                </tr>
              ) : (
                clientesPagina.map(cliente => (
                  <tr key={cliente.id} className="hover:bg-[#F0F7FF] transition-colors group cursor-pointer">
                    <td className="font-table-cell text-table-cell text-on-surface font-mono px-gutter-table py-stack-md">
                      {cliente.rut}
                    </td>
                    <td className="font-table-cell text-table-cell text-on-surface font-medium px-gutter-table py-stack-md">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${cliente.tipo === 'EMPRESA' ? 'bg-indigo-100 text-indigo-700' : 'bg-teal-100 text-teal-700'}`}>
                          {cliente.tipo}
                        </span>
                        <span>{formatNombreCliente(cliente)}</span>
                      </div>
                    </td>
                    <td className="font-table-cell text-table-cell text-on-surface-variant px-gutter-table py-stack-md">
                      {cliente.email || <span className="text-outline italic">Sin email</span>}
                    </td>
                    <td className="font-table-cell text-table-cell text-on-surface text-right font-medium px-gutter-table py-stack-md">
                      {casosCount[cliente.id] ?? 0}
                    </td>
                    <td className="px-gutter-table py-stack-md text-center">
                      <div className="flex justify-center">
                        {verInactivos ? (
                          <button
                            onClick={(e) => handleRestaurar(e, cliente.id)}
                            className="px-3 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded text-xs font-bold border border-emerald-200 transition-colors flex items-center gap-1"
                            title="Restaurar cliente"
                          >
                            <span className="material-symbols-outlined text-[16px]">restore</span> Restaurar
                          </button>
                        ) : (
                          <button
                            onClick={() => navigate(`/clientes/${cliente.id}`)}
                            className="text-slate-400 hover:text-primary-container transition-colors p-1"
                          >
                            <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Paginación (compartida entre tabla y cards) ── */}
      <div className="px-2 py-4 flex items-center justify-between flex-wrap gap-3">
        <span className="font-body-sm text-body-sm text-on-surface-variant">
          Mostrando {clientesFiltrados.length === 0 ? 0 : (pagina - 1) * ITEMS_POR_PAGINA + 1} a {Math.min(pagina * ITEMS_POR_PAGINA, clientesFiltrados.length)} de {clientesFiltrados.length} clientes
        </span>
        <div className="flex gap-2 items-center">
          <button
            onClick={() => setPagina(p => Math.max(1, p - 1))}
            disabled={pagina === 1}
            className="w-8 h-8 flex items-center justify-center border border-outline-variant rounded hover:bg-surface-container-low text-outline disabled:opacity-40 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
          </button>

          {paginasVisibles[0] > 1 && (
            <>
              <button onClick={() => setPagina(1)} className="w-8 h-8 flex items-center justify-center border border-outline-variant rounded hover:bg-surface-container-low font-body-sm text-on-surface transition-colors">1</button>
              {paginasVisibles[0] > 2 && <span className="text-outline px-1">…</span>}
            </>
          )}

          {paginasVisibles.map(n => (
            <button
              key={n}
              onClick={() => setPagina(n)}
              className={`w-8 h-8 flex items-center justify-center border rounded font-body-sm transition-colors ${
                n === pagina
                  ? 'bg-primary-container text-on-primary border-primary-container'
                  : 'border-outline-variant hover:bg-surface-container-low text-on-surface'
              }`}
            >
              {n}
            </button>
          ))}

          {paginasVisibles[paginasVisibles.length - 1] < totalPaginas && (
            <>
              {paginasVisibles[paginasVisibles.length - 1] < totalPaginas - 1 && <span className="text-outline px-1">…</span>}
              <button onClick={() => setPagina(totalPaginas)} className="w-8 h-8 flex items-center justify-center border border-outline-variant rounded hover:bg-surface-container-low font-body-sm text-on-surface transition-colors">{totalPaginas}</button>
            </>
          )}

          <button
            onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
            disabled={pagina === totalPaginas}
            className="w-8 h-8 flex items-center justify-center border border-outline-variant rounded hover:bg-surface-container-low text-outline disabled:opacity-40 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
          </button>
        </div>
      </div>

      {/* ── Modal: Crear Cliente ── */}
      {modalCrear && (
        <Modal titulo="Nuevo Cliente" onClose={() => { setModalCrear(false); formCrear.reset(); }}>
          <form onSubmit={formCrear.handleSubmit(onCrear)} className="flex flex-col gap-4">
            
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block font-body-sm text-body-sm text-on-surface font-medium mb-1">Tipo de Cliente *</label>
                <select
                  {...formCrear.register('tipo', { required: 'Requerido' })}
                  className="w-full border border-outline-variant rounded px-3 py-2 font-body-sm text-body-sm focus:border-primary-container focus:ring-2 focus:ring-primary-fixed-dim outline-none bg-white"
                >
                  <option value="PERSONA">Persona Natural</option>
                  <option value="EMPRESA">Empresa / Jurídica</option>
                </select>
              </div>

              <div className="col-span-2">
                <label className="block font-body-sm text-body-sm text-on-surface font-medium mb-1">RUT *</label>
                <input
                  {...formCrear.register('rut', { required: 'El RUT es obligatorio' })}
                  className="w-full border border-outline-variant rounded px-3 py-2 font-body-sm text-body-sm focus:border-primary-container focus:ring-2 focus:ring-primary-fixed-dim outline-none"
                  placeholder="Ej: 12.345.678-9"
                />
                {formCrear.formState.errors.rut && <p className="text-error text-xs mt-1">{formCrear.formState.errors.rut.message}</p>}
              </div>

              {watchTipo === 'PERSONA' ? (
                <>
                  <div className="col-span-1">
                    <label className="block font-body-sm text-body-sm text-on-surface font-medium mb-1">Nombre *</label>
                    <input
                      {...formCrear.register('nombre', { required: 'El nombre es obligatorio para personas' })}
                      className="w-full border border-outline-variant rounded px-3 py-2 font-body-sm text-body-sm focus:border-primary-container focus:ring-2 focus:ring-primary-fixed-dim outline-none"
                    />
                    {formCrear.formState.errors.nombre && <p className="text-error text-xs mt-1">{formCrear.formState.errors.nombre.message}</p>}
                  </div>
                  <div className="col-span-1">
                    <label className="block font-body-sm text-body-sm text-on-surface font-medium mb-1">Apellido *</label>
                    <input
                      {...formCrear.register('apellido', { required: 'El apellido es obligatorio para personas' })}
                      className="w-full border border-outline-variant rounded px-3 py-2 font-body-sm text-body-sm focus:border-primary-container focus:ring-2 focus:ring-primary-fixed-dim outline-none"
                    />
                    {formCrear.formState.errors.apellido && <p className="text-error text-xs mt-1">{formCrear.formState.errors.apellido.message}</p>}
                  </div>
                </>
              ) : (
                <>
                  <div className="col-span-2">
                    <label className="block font-body-sm text-body-sm text-on-surface font-medium mb-1">Razón Social *</label>
                    <input
                      {...formCrear.register('razon_social', { required: 'La razón social es obligatoria para empresas' })}
                      className="w-full border border-outline-variant rounded px-3 py-2 font-body-sm text-body-sm focus:border-primary-container focus:ring-2 focus:ring-primary-fixed-dim outline-none"
                    />
                    {formCrear.formState.errors.razon_social && <p className="text-error text-xs mt-1">{formCrear.formState.errors.razon_social.message}</p>}
                  </div>
                  <div className="col-span-2">
                    <label className="block font-body-sm text-body-sm text-on-surface font-medium mb-1">Nombre de Fantasía / Contacto *</label>
                    <input
                      {...formCrear.register('nombre', { required: 'El nombre representativo es obligatorio' })}
                      className="w-full border border-outline-variant rounded px-3 py-2 font-body-sm text-body-sm focus:border-primary-container focus:ring-2 focus:ring-primary-fixed-dim outline-none"
                    />
                    {formCrear.formState.errors.nombre && <p className="text-error text-xs mt-1">{formCrear.formState.errors.nombre.message}</p>}
                  </div>
                </>
              )}

              <div className="col-span-1">
                <label className="block font-body-sm text-body-sm text-on-surface font-medium mb-1">Email</label>
                <input
                  {...formCrear.register('email', {
                    pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Email inválido' }
                  })}
                  type="email"
                  className="w-full border border-outline-variant rounded px-3 py-2 font-body-sm text-body-sm focus:border-primary-container outline-none"
                />
              </div>
              <div className="col-span-1">
                <label className="block font-body-sm text-body-sm text-on-surface font-medium mb-1">Teléfono</label>
                <input
                  {...formCrear.register('telefono')}
                  className="w-full border border-outline-variant rounded px-3 py-2 font-body-sm text-body-sm focus:border-primary-container outline-none"
                />
              </div>

              <div className="col-span-2">
                <label className="block font-body-sm text-body-sm text-on-surface font-medium mb-1">Dirección</label>
                <input
                  {...formCrear.register('direccion')}
                  className="w-full border border-outline-variant rounded px-3 py-2 font-body-sm text-body-sm focus:border-primary-container outline-none"
                />
              </div>

              <div className="col-span-1">
                <label className="block font-body-sm text-body-sm text-on-surface font-medium mb-1">Comuna</label>
                <input
                  {...formCrear.register('comuna')}
                  className="w-full border border-outline-variant rounded px-3 py-2 font-body-sm text-body-sm focus:border-primary-container outline-none"
                />
              </div>
              <div className="col-span-1">
                <label className="block font-body-sm text-body-sm text-on-surface font-medium mb-1">Ciudad</label>
                <input
                  {...formCrear.register('ciudad')}
                  className="w-full border border-outline-variant rounded px-3 py-2 font-body-sm text-body-sm focus:border-primary-container outline-none"
                />
              </div>

              <div className="col-span-2">
                <label className="block font-body-sm text-body-sm text-on-surface font-medium mb-1">Observaciones</label>
                <textarea
                  {...formCrear.register('observaciones')}
                  rows={2}
                  className="w-full border border-outline-variant rounded px-3 py-2 font-body-sm text-body-sm focus:border-primary-container outline-none resize-none"
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
                {guardando ? 'Creando...' : 'Crear Cliente'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default Clientes;
