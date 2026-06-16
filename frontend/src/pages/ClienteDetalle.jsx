import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useForm, useWatch } from 'react-hook-form';
import ClienteService from '../services/clienteService';
import CasoService from '../services/casoService';

// ─── Helpers ──────────────────────────────────────────────────
const getPerfil = () => {
  try { return JSON.parse(localStorage.getItem('user_profile') || '{}'); } catch { return {}; }
};

const formatFecha = (d) =>
  d ? new Date(d).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const formatNombreCliente = (c) => {
  if (!c) return '';
  if (c.tipo === 'PERSONA') {
    return `${c.nombre} ${c.apellido || ''}`.trim();
  }
  return c.razon_social || c.nombre;
};

const initials = (nombre = '') => {
  const partes = nombre.trim().split(/\s+/);
  return partes.length >= 2
    ? (partes[0][0] + partes[1][0]).toUpperCase()
    : nombre.slice(0, 2).toUpperCase();
};

const faseBadge = (estado) => {
  const map = {
    'Abierto':      { bg: 'bg-blue-50 border border-blue-200',    text: 'text-primary-container' },
    'Discusion':    { bg: 'bg-amber-50 border border-amber-200',  text: 'text-amber-700' },
    'Conciliacion': { bg: 'bg-orange-50 border border-orange-200',text: 'text-orange-700' },
    'Prueba':       { bg: 'bg-purple-50 border border-purple-200',text: 'text-purple-700' },
    'Impugnacion':  { bg: 'bg-red-50 border border-red-200',      text: 'text-error' },
    'Cerrado':      { bg: 'bg-surface-container-highest',         text: 'text-on-surface-variant' },
  };
  return map[estado] || map['Abierto'];
};

// ─── Modal genérico ───────────────────────────────────────────
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

// ─── Componente principal ─────────────────────────────────────
const ClienteDetalle = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const perfil = getPerfil();
  const esAdmin = perfil.rol === 'ADMIN';

  const [cliente, setCliente] = useState(null);
  const [casos, setCasos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [tab, setTab] = useState('info');
  const [modalEditar, setModalEditar] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const [sortBy, setSortBy] = useState('id');
  const [sortOrder, setSortOrder] = useState('desc');

  const FASES_ORDEN = ['Abierto', 'Discusion', 'Conciliacion', 'Prueba', 'Impugnacion', 'Cerrado'];

  // ── Carga inicial ─────────────────────────────────────────
  const cargarCliente = async () => {
    try {
      const resp = await ClienteService.obtener(id);
      setCliente(resp.data);
      return resp.data;
    } catch {
      if (esAdmin) {
        try {
          const inactivosResp = await ClienteService.listarInactivos();
          const encontrado = inactivosResp.data.find(c => c.id === parseInt(id));
          if (encontrado) { setCliente(encontrado); return encontrado; }
        } catch { /* ignorar */ }
      }
      toast.error('Cliente no encontrado');
      navigate('/clientes');
    }
  };

  useEffect(() => {
    const init = async () => {
      setCargando(true);
      try {
        const [clienteResp, casosResp] = await Promise.allSettled([
          ClienteService.obtener(id),
          CasoService.listarPorCliente(id),
        ]);

        if (clienteResp.status === 'fulfilled') {
          setCliente(clienteResp.value.data);
        } else if (esAdmin) {
          try {
            const inactivosResp = await ClienteService.listarInactivos();
            const encontrado = inactivosResp.data.find(c => c.id === parseInt(id));
            if (encontrado) setCliente(encontrado);
            else { toast.error('Cliente no encontrado'); navigate('/clientes'); return; }
          } catch { toast.error('Error al cargar el cliente'); navigate('/clientes'); return; }
        } else {
          toast.error('No tienes acceso a este cliente');
          navigate('/clientes');
          return;
        }

        if (casosResp.status === 'fulfilled') {
          setCasos(casosResp.value.data);
        }
      } finally {
        setCargando(false);
      }
    };
    init();
  }, [id]);

  const casosOrdenados = React.useMemo(() => {
    let res = [...casos];
    res.sort((a, b) => {
      let valA, valB;
      if (sortBy === 'id') {
        valA = a.id;
        valB = b.id;
      } else if (sortBy === 'titulo') {
        valA = a.titulo.toLowerCase();
        valB = b.titulo.toLowerCase();
      } else if (sortBy === 'fase') {
        valA = FASES_ORDEN.indexOf(a.estado);
        valB = FASES_ORDEN.indexOf(b.estado);
      } else if (sortBy === 'fecha') {
        valA = new Date(a.fecha_creacion).getTime();
        valB = new Date(b.fecha_creacion).getTime();
      } else {
        valA = (a[sortBy] || '').toString().toLowerCase();
        valB = (b[sortBy] || '').toString().toLowerCase();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    return res;
  }, [casos, sortBy, sortOrder]);

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

  // ── Editar cliente ────────────────────────────────────────
  const abrirEditar = () => {
    setModalEditar(true);
  };

  const onEditar = async (data) => {
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

      const resp = await ClienteService.actualizar(id, payload);
      setCliente(resp.data);
      toast.success('Cliente actualizado');
      setModalEditar(false);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al actualizar el cliente');
    } finally {
      setGuardando(false);
    }
  };

  // ── Toggle activo (ADMIN) ─────────────────────────────────
  const onToggle = async () => {
    const prevEstado = cliente.estado;
    setCliente(prev => ({ ...prev, estado: !prevEstado }));
    
    try {
      await ClienteService.toggleActivo(id);
      toast.success(`Cliente ${!prevEstado ? 'restaurado' : 'eliminado'}`);
      if (prevEstado) {
        navigate('/clientes');
      }
    } catch (err) {
      setCliente(prev => ({ ...prev, estado: prevEstado }));
      toast.error(err.response?.data?.detail || 'Error al cambiar estado');
    }
  };

  if (cargando) {
    return (
      <div className="flex items-center justify-center h-full py-32">
        <span className="material-symbols-outlined animate-spin text-[48px] text-primary-container">progress_activity</span>
      </div>
    );
  }

  if (!cliente) return null;

  return (
    <div className="p-margin-page max-w-[1400px] mx-auto flex flex-col gap-stack-lg">

      {/* ── Breadcrumb ─────────────────────────────────────── */}
      <div className="flex items-center gap-2 text-slate-500 font-body-sm text-body-sm">
        <Link to="/clientes" className="hover:text-primary-container transition-colors">Clientes</Link>
        <span className="material-symbols-outlined text-sm">chevron_right</span>
        <span className="text-on-surface font-medium">{formatNombreCliente(cliente)}</span>
      </div>

      {/* ── Page Header ────────────────────────────────────── */}
      <div className="flex justify-between items-end flex-wrap gap-4">
        <div>
          <h2 className="font-headline-md text-headline-md text-primary-container flex items-center gap-3 flex-wrap">
            {formatNombreCliente(cliente)}
            <span className={`px-2 py-1 rounded font-label-caps text-label-caps ${cliente.estado ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-surface-container-highest text-on-surface-variant'}`}>
              {cliente.estado ? 'Activo' : 'Inactivo'}
            </span>
            <span className={`px-2 py-1 rounded font-label-caps text-label-caps ${cliente.tipo === 'EMPRESA' ? 'bg-indigo-100 text-indigo-700' : 'bg-teal-100 text-teal-700'}`}>
              {cliente.tipo}
            </span>
          </h2>
        </div>
        <div className="flex gap-3">
          <button
            onClick={abrirEditar}
            className="px-5 py-2.5 bg-surface border border-secondary-fixed text-primary-container font-title-sm text-sm font-bold rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-2 shadow-sm"
          >
            <span className="material-symbols-outlined text-[20px]">edit</span>
            Editar
          </button>
        </div>
      </div>

      {/* ── Content Grid ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* ── Card Perfil (1 col) ─────────────────────────── */}
        <div className="xl:col-span-1 bg-white border border-[#E5E7EB] rounded-xl p-padding-card flex flex-col">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-primary-fixed text-primary-container flex items-center justify-center font-bold text-xl border border-primary-fixed-dim shrink-0">
              {initials(formatNombreCliente(cliente))}
            </div>
            <div>
              <h3 className="font-title-sm text-title-sm text-on-surface">{cliente.nombre}</h3>
              <p className="font-body-sm text-body-sm text-secondary">
                RUT: {cliente.rut}
              </p>
            </div>
          </div>
          <div className="space-y-4 flex-1">
            <div>
              <p className="font-label-caps text-label-caps text-secondary mb-1">EMAIL</p>
              <p className="font-body-md text-body-md text-on-surface break-all">
                {cliente.email || <span className="text-outline italic">Sin email registrado</span>}
              </p>
            </div>
            <div>
              <p className="font-label-caps text-label-caps text-secondary mb-1">TELÉFONO</p>
              <p className="font-body-md text-body-md text-on-surface">
                {cliente.telefono || <span className="text-outline italic">Sin teléfono registrado</span>}
              </p>
            </div>
            <div>
              <p className="font-label-caps text-label-caps text-secondary mb-1">FECHA DE ALTA</p>
              <p className="font-body-md text-body-md text-on-surface">{formatFecha(cliente.fecha_creacion)}</p>
            </div>
            <div>
              <p className="font-label-caps text-label-caps text-secondary mb-1">ÚLTIMA ACTUALIZACIÓN</p>
              <p className="font-body-md text-body-md text-on-surface">
                {cliente.fecha_actualizacion ? formatFecha(cliente.fecha_actualizacion) : '—'}
              </p>
            </div>
            <div>
              <p className="font-label-caps text-label-caps text-secondary mb-1">CASOS RELACIONADOS</p>
              <p className="font-body-md text-body-md text-on-surface font-semibold">{casos.length}</p>
            </div>
          </div>
        </div>

        {/* ── Card Tabs ── */}
        <div className="xl:col-span-2 bg-white border border-[#E5E7EB] rounded-xl flex flex-col">
          <div className="border-b border-[#E5E7EB] px-padding-card flex gap-6 overflow-x-auto">
            {[
              { key: 'info',       label: 'Información Principal' },
            ].map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`py-4 font-body-sm text-sm font-medium border-b-2 transition-colors ${
                  tab === t.key
                    ? 'text-primary-container border-primary-container'
                    : 'text-secondary hover:text-on-surface border-transparent'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab: Información Principal */}
          {tab === 'info' && (
            <div className="p-padding-card grid grid-cols-2 gap-x-6 gap-y-5">
              <div className="col-span-2">
                <label className="block font-label-caps text-label-caps text-secondary mb-1">
                  {cliente.tipo === 'EMPRESA' ? 'RAZÓN SOCIAL' : 'NOMBRE COMPLETO'}
                </label>
                <div className="w-full bg-surface-container-lowest border border-[#E5E7EB] rounded px-3 py-2 text-on-surface font-body-md text-sm">
                  {formatNombreCliente(cliente)}
                </div>
              </div>

              {cliente.tipo === 'EMPRESA' && (
                <div className="col-span-2 sm:col-span-1">
                  <label className="block font-label-caps text-label-caps text-secondary mb-1">NOMBRE DE CONTACTO / FANTASÍA</label>
                  <div className="w-full bg-surface-container-lowest border border-[#E5E7EB] rounded px-3 py-2 text-on-surface font-body-md text-sm">
                    {cliente.nombre}
                  </div>
                </div>
              )}

              <div className="col-span-2 sm:col-span-1">
                <label className="block font-label-caps text-label-caps text-secondary mb-1">RUT</label>
                <div className="w-full bg-surface-container-lowest border border-[#E5E7EB] rounded px-3 py-2 text-on-surface font-body-md text-sm">
                  {cliente.rut}
                </div>
              </div>

              <div className="col-span-2">
                <label className="block font-label-caps text-label-caps text-secondary mb-1">DIRECCIÓN</label>
                <div className="w-full bg-surface-container-lowest border border-[#E5E7EB] rounded px-3 py-2 text-on-surface font-body-md text-sm">
                  {cliente.direccion || <span className="text-outline italic">No registrada</span>}
                </div>
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="block font-label-caps text-label-caps text-secondary mb-1">COMUNA</label>
                <div className="w-full bg-surface-container-lowest border border-[#E5E7EB] rounded px-3 py-2 text-on-surface font-body-md text-sm">
                  {cliente.comuna || <span className="text-outline italic">No registrada</span>}
                </div>
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="block font-label-caps text-label-caps text-secondary mb-1">CIUDAD</label>
                <div className="w-full bg-surface-container-lowest border border-[#E5E7EB] rounded px-3 py-2 text-on-surface font-body-md text-sm">
                  {cliente.ciudad || <span className="text-outline italic">No registrada</span>}
                </div>
              </div>

              <div className="col-span-2">
                <label className="block font-label-caps text-label-caps text-secondary mb-1">OBSERVACIONES</label>
                <div className="w-full bg-surface-container-lowest border border-[#E5E7EB] rounded px-3 py-2 text-on-surface font-body-md text-sm min-h-[60px]">
                  {cliente.observaciones || <span className="text-outline italic">Sin observaciones</span>}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Casos Relacionados ──────────────────────────────── */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl flex flex-col">
        <div className="p-padding-card border-b border-[#E5E7EB] flex justify-between items-center">
          <h3 className="font-title-sm text-title-sm text-on-surface">
            Casos Relacionados
            <span className="ml-2 bg-surface-container-high text-on-surface text-xs py-0.5 px-2 rounded-full font-normal">
              {casos.length}
            </span>
          </h3>
        </div>

        {casos.length === 0 ? (
          <div className="py-12 text-center text-on-surface-variant font-body-md">
            No hay casos relacionados con este cliente.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-[#E5E7EB]">
                  <th className="p-gutter-table font-label-caps text-label-caps text-secondary w-24 cursor-pointer hover:bg-surface-variant/50 transition-colors" onClick={() => handleSort('id')}>
                    <div className="flex items-center">REF {renderSortIndicator('id')}</div>
                  </th>
                  <th className="p-gutter-table font-label-caps text-label-caps text-secondary cursor-pointer hover:bg-surface-variant/50 transition-colors" onClick={() => handleSort('titulo')}>
                    <div className="flex items-center">TÍTULO {renderSortIndicator('titulo')}</div>
                  </th>
                  <th className="p-gutter-table font-label-caps text-label-caps text-secondary cursor-pointer hover:bg-surface-variant/50 transition-colors" onClick={() => handleSort('fase')}>
                    <div className="flex items-center">FASE {renderSortIndicator('fase')}</div>
                  </th>
                  <th className="p-gutter-table font-label-caps text-label-caps text-secondary w-44 cursor-pointer hover:bg-surface-variant/50 transition-colors" onClick={() => handleSort('fecha')}>
                    <div className="flex items-center">FECHA APERTURA {renderSortIndicator('fecha')}</div>
                  </th>
                  <th className="p-gutter-table font-label-caps text-label-caps text-secondary w-16"></th>
                </tr>
              </thead>
              <tbody className="font-table-cell text-table-cell text-on-surface divide-y divide-[#E5E7EB]">
                {casosOrdenados.map(caso => {
                  const badge = faseBadge(caso.estado);
                  return (
                    <tr
                      key={caso.id}
                      onClick={() => navigate(`/casos/${caso.id}`)}
                      className="hover:bg-[#F0F7FF] transition-colors group cursor-pointer"
                    >
                      <td className="p-gutter-table text-secondary font-mono text-xs">
                        #{String(caso.id).padStart(4, '0')}
                      </td>
                      <td className="p-gutter-table font-medium text-primary-container max-w-[280px] truncate">
                        {caso.titulo}
                      </td>
                      <td className="p-gutter-table">
                        <span className={`px-2 py-1 rounded font-label-caps text-[10px] ${badge.bg} ${badge.text}`}>
                          {caso.estado}
                        </span>
                      </td>
                      <td className="p-gutter-table text-secondary">
                        {formatFecha(caso.fecha_creacion)}
                      </td>
                      <td className="p-gutter-table text-right text-slate-400 group-hover:text-primary-container">
                        <span className="material-symbols-outlined text-lg">arrow_forward</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modal: Editar Cliente ───────────────────────────── */}
      {modalEditar && (
        <EditModalWithSecurity 
          cliente={cliente} 
          onClose={() => setModalEditar(false)} 
          onSave={onEditar} 
          onToggle={onToggle}
          guardando={guardando} 
          esAdmin={esAdmin}
        />
      )}
    </div>
  );
};

// ─── Modal de Edición con Seguridad ─────────────────────────
const EditModalWithSecurity = ({ cliente, onClose, onSave, onToggle, guardando, esAdmin }) => {
  const [showSecurity, setShowSecurity] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const { register, handleSubmit, control, formState: { errors } } = useForm({
    defaultValues: {
      tipo: cliente.tipo,
      nombre: cliente.nombre,
      apellido: cliente.apellido || '',
      razon_social: cliente.razon_social || '',
      rut: cliente.rut,
      email: cliente.email || '',
      telefono: cliente.telefono || '',
      direccion: cliente.direccion || '',
      comuna: cliente.comuna || '',
      ciudad: cliente.ciudad || '',
      observaciones: cliente.observaciones || ''
    }
  });

  const watchTipo = useWatch({ control, name: 'tipo' });
  const wordToType = cliente.estado ? 'eliminar' : 'restaurar';

  const handleToggleClick = () => setShowSecurity(true);

  const confirmToggle = async () => {
    if (confirmText.toLowerCase() === wordToType) {
      onClose();
      onToggle();
    } else {
      toast.error(`Debes escribir "${wordToType}" para confirmar.`);
    }
  };

  return (
    <Modal titulo="Editar Cliente" onClose={onClose}>
      <form onSubmit={handleSubmit(onSave)} className="flex flex-col gap-4">
        
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block font-body-sm text-body-sm text-on-surface font-medium mb-1">Tipo de Cliente *</label>
            <select
              {...register('tipo', { required: 'Requerido' })}
              className="w-full border border-outline-variant rounded px-3 py-2 font-body-sm text-body-sm bg-surface-container-lowest text-on-surface-variant outline-none"
              disabled
              title="El tipo de cliente no se puede cambiar después de creado"
            >
              <option value="PERSONA">Persona Natural</option>
              <option value="EMPRESA">Empresa / Jurídica</option>
            </select>
          </div>

          <div className="col-span-2">
            <label className="block font-body-sm text-body-sm text-on-surface font-medium mb-1">RUT *</label>
            <input
              {...register('rut', { required: 'El RUT es obligatorio' })}
              className="w-full border border-outline-variant rounded px-3 py-2 font-body-sm text-body-sm focus:border-primary-container focus:ring-2 focus:ring-primary-fixed-dim outline-none"
            />
            {errors.rut && <p className="text-error text-xs mt-1">{errors.rut.message}</p>}
          </div>

          {watchTipo === 'PERSONA' ? (
            <>
              <div className="col-span-1">
                <label className="block font-body-sm text-body-sm text-on-surface font-medium mb-1">Nombre *</label>
                <input
                  {...register('nombre', { required: 'El nombre es obligatorio' })}
                  className="w-full border border-outline-variant rounded px-3 py-2 font-body-sm text-body-sm focus:border-primary-container focus:ring-2 focus:ring-primary-fixed-dim outline-none"
                />
                {errors.nombre && <p className="text-error text-xs mt-1">{errors.nombre.message}</p>}
              </div>
              <div className="col-span-1">
                <label className="block font-body-sm text-body-sm text-on-surface font-medium mb-1">Apellido *</label>
                <input
                  {...register('apellido', { required: 'El apellido es obligatorio' })}
                  className="w-full border border-outline-variant rounded px-3 py-2 font-body-sm text-body-sm focus:border-primary-container focus:ring-2 focus:ring-primary-fixed-dim outline-none"
                />
                {errors.apellido && <p className="text-error text-xs mt-1">{errors.apellido.message}</p>}
              </div>
            </>
          ) : (
            <>
              <div className="col-span-2">
                <label className="block font-body-sm text-body-sm text-on-surface font-medium mb-1">Razón Social *</label>
                <input
                  {...register('razon_social', { required: 'La razón social es obligatoria' })}
                  className="w-full border border-outline-variant rounded px-3 py-2 font-body-sm text-body-sm focus:border-primary-container focus:ring-2 focus:ring-primary-fixed-dim outline-none"
                />
                {errors.razon_social && <p className="text-error text-xs mt-1">{errors.razon_social.message}</p>}
              </div>
              <div className="col-span-2">
                <label className="block font-body-sm text-body-sm text-on-surface font-medium mb-1">Nombre de Fantasía / Contacto *</label>
                <input
                  {...register('nombre', { required: 'El nombre representativo es obligatorio' })}
                  className="w-full border border-outline-variant rounded px-3 py-2 font-body-sm text-body-sm focus:border-primary-container focus:ring-2 focus:ring-primary-fixed-dim outline-none"
                />
                {errors.nombre && <p className="text-error text-xs mt-1">{errors.nombre.message}</p>}
              </div>
            </>
          )}

          <div className="col-span-1">
            <label className="block font-body-sm text-body-sm text-on-surface font-medium mb-1">Email</label>
            <input
              {...register('email', {
                pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Email inválido' }
              })}
              type="email"
              className="w-full border border-outline-variant rounded px-3 py-2 font-body-sm text-body-sm focus:border-primary-container outline-none"
            />
          </div>
          <div className="col-span-1">
            <label className="block font-body-sm text-body-sm text-on-surface font-medium mb-1">Teléfono</label>
            <input
              {...register('telefono')}
              className="w-full border border-outline-variant rounded px-3 py-2 font-body-sm text-body-sm focus:border-primary-container outline-none"
            />
          </div>

          <div className="col-span-2">
            <label className="block font-body-sm text-body-sm text-on-surface font-medium mb-1">Dirección</label>
            <input
              {...register('direccion')}
              className="w-full border border-outline-variant rounded px-3 py-2 font-body-sm text-body-sm focus:border-primary-container outline-none"
            />
          </div>

          <div className="col-span-1">
            <label className="block font-body-sm text-body-sm text-on-surface font-medium mb-1">Comuna</label>
            <input
              {...register('comuna')}
              className="w-full border border-outline-variant rounded px-3 py-2 font-body-sm text-body-sm focus:border-primary-container outline-none"
            />
          </div>
          <div className="col-span-1">
            <label className="block font-body-sm text-body-sm text-on-surface font-medium mb-1">Ciudad</label>
            <input
              {...register('ciudad')}
              className="w-full border border-outline-variant rounded px-3 py-2 font-body-sm text-body-sm focus:border-primary-container outline-none"
            />
          </div>

          <div className="col-span-2">
            <label className="block font-body-sm text-body-sm text-on-surface font-medium mb-1">Observaciones</label>
            <textarea
              {...register('observaciones')}
              rows={2}
              className="w-full border border-outline-variant rounded px-3 py-2 font-body-sm text-body-sm focus:border-primary-container outline-none resize-none"
            />
          </div>
        </div>

        {esAdmin && !showSecurity && (
          <div className="pt-4 border-t border-outline-variant mt-2">
            <button
              type="button"
              onClick={handleToggleClick}
              className={`w-full flex items-center justify-center gap-2 py-2 px-4 rounded border font-medium transition-colors ${
                cliente.estado 
                  ? 'border-red-200 text-error hover:bg-red-50' 
                  : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              <span className="material-symbols-outlined text-lg">
                {cliente.estado ? 'delete' : 'settings_backup_restore'}
              </span>
              {cliente.estado ? 'Eliminar Cliente' : 'Restaurar Cliente'}
            </button>
          </div>
        )}

        {showSecurity && (
          <div className="pt-4 border-t border-outline-variant mt-2 bg-surface-container-low p-4 rounded-lg animate-in fade-in zoom-in duration-200">
            <p className="text-xs font-medium text-on-surface mb-2">
              Seguridad: Escribe <span className="font-bold">"{wordToType}"</span> para confirmar:
            </p>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full border border-outline-variant rounded px-3 py-2 text-xs focus:border-error focus:ring-1 focus:ring-error outline-none mb-3"
              placeholder={wordToType}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowSecurity(false)}
                className="flex-1 py-1.5 border border-outline-variant rounded text-xs hover:bg-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmToggle}
                className="flex-1 py-1.5 bg-error text-white rounded text-xs hover:bg-error-container"
              >
                Confirmar
              </button>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 mt-4">
          <button type="button" onClick={onClose}
            className="px-5 py-2 border border-outline-variant rounded font-body-sm text-body-sm text-on-surface hover:bg-surface-container transition-colors">
            Cerrar
          </button>
          <button type="submit" disabled={guardando || showSecurity}
            className="px-5 py-2 bg-primary-container text-on-primary rounded font-body-sm text-body-sm hover:bg-primary transition-colors disabled:opacity-60">
            {guardando ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ClienteDetalle;
