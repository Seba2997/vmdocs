import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useForm } from 'react-hook-form';
import CasoService from '../services/casoService';
import ClienteService from '../services/clienteService';
import UsuarioService from '../services/usuarioService';
import Documentos from './Documentos';
import NotasCaso from './NotasCaso';

// ─── Constantes ───────────────────────────────────────────────
const FASES = ['Abierto', 'Discusion', 'Conciliacion', 'Prueba', 'Impugnacion', 'Cerrado'];

const faseBadge = (estado) => {
  const map = {
    'Abierto':      { bg: 'bg-blue-50 border border-blue-200',    text: 'text-primary-container', dot: 'bg-primary-container' },
    'Discusion':    { bg: 'bg-amber-50 border border-amber-200',  text: 'text-amber-700',          dot: 'bg-amber-500' },
    'Conciliacion': { bg: 'bg-orange-50 border border-orange-200',text: 'text-orange-700',         dot: 'bg-orange-500' },
    'Prueba':       { bg: 'bg-purple-50 border border-purple-200',text: 'text-purple-700',         dot: 'bg-purple-500' },
    'Impugnacion':  { bg: 'bg-red-50 border border-red-200',      text: 'text-error',              dot: 'bg-error' },
    'Cerrado':      { bg: 'bg-surface-container-highest',         text: 'text-on-surface-variant', dot: 'bg-outline' },
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

const getPerfil = () => {
  try { return JSON.parse(localStorage.getItem('user_profile') || '{}'); } catch { return {}; }
};

const formatFecha = (d) => d ? new Date(d).toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';
const formatFechaShort = (d) => d ? new Date(d).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

// ─── Iniciales Avatar ────────────────────────────────────────
const Avatar = ({ nombre = '', apellido = '' }) => {
  const initials = `${nombre[0] || ''}${apellido[0] || ''}`.toUpperCase();
  return (
    <div className="w-10 h-10 rounded-full bg-primary-fixed text-primary-container flex items-center justify-center font-semibold text-sm border border-primary-fixed-dim shrink-0">
      {initials || '?'}
    </div>
  );
};

// ─── Modal genérico ──────────────────────────────────────────
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

// ─── Stepper de Fases ────────────────────────────────────────
const FaseStepper = ({ faseActual }) => {
  const idx = FASES.indexOf(faseActual);
  return (
    <div className="flex flex-col gap-2">
      {FASES.map((fase, i) => {
        const activa = i === idx;
        const pasada = i < idx;
        return (
          <div key={fase} className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${activa ? 'bg-primary-fixed/30 border border-primary-fixed-dim' : ''}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold border-2 ${activa ? 'bg-primary-container border-primary-container text-on-primary' : pasada ? 'bg-surface-container-high border-outline text-on-surface-variant' : 'border-outline-variant text-outline bg-white'}`}>
              {pasada ? <span className="material-symbols-outlined text-[14px]">check</span> : i + 1}
            </div>
            <span className={`font-body-sm text-body-sm ${activa ? 'text-primary-container font-semibold' : pasada ? 'text-on-surface-variant line-through' : 'text-outline'}`}>
              {fase}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// ─── Componente principal ────────────────────────────────────
const CasoDetalle = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const perfil = getPerfil();
  const esAdmin = perfil.rol === 'ADMIN';

  const [caso, setCaso] = useState(null);
  const [cliente, setCliente] = useState(null);
  const [usuariosAsignados, setUsuariosAsignados] = useState([]);
  const [todosUsuarios, setTodosUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const location = useLocation();
  const [tab, setTab] = useState(() => {
    const params = new URLSearchParams(location.search);
    return params.get('tab') || 'info';
  });
  const [modalEditar, setModalEditar] = useState(false);
  const [modalAsignar, setModalAsignar] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState('');
  const [isPapeleraOpen, setIsPapeleraOpen] = useState(false);

  // ── Carga inicial ─────────────────────────────────────────
  const cargarCaso = async () => {
    const resp = await CasoService.obtener(id);
    setCaso(resp.data);
    return resp.data;
  };

  const cargarUsuariosAsignados = async () => {
    const resp = await CasoService.listarUsuarios(id);
    setUsuariosAsignados(resp.data);
  };

  useEffect(() => {
    const init = async () => {
      setCargando(true);
      try {
        const [casoResp, usuResp] = await Promise.all([
          CasoService.obtener(id),
          CasoService.listarUsuarios(id),
        ]);
        const c = casoResp.data;
        setCaso(c);
        setUsuariosAsignados(usuResp.data);

        // Fetch cliente directamente por ID — evita problemas de RBAC y clientes inactivos
        try {
          const clienteResp = await ClienteService.obtener(c.cliente_id);
          setCliente(clienteResp.data);
        } catch {
          // Si falla (ej: cliente inactivo → 404), intentar en la lista de inactivos (solo ADMIN)
          if (esAdmin) {
            try {
              const inactivosResp = await ClienteService.listarInactivos();
              const encontrado = inactivosResp.data.find(cl => cl.id === c.cliente_id);
              setCliente(encontrado || null);
            } catch { setCliente(null); }
          } else {
            setCliente(null);
          }
        }

        // Si es admin, cargamos todos los usuarios para asignar
        if (esAdmin) {
          const todosResp = await UsuarioService.listarTodos();
          setTodosUsuarios(todosResp.data);
        }
      } catch {
        toast.error('Error al cargar el caso');
        navigate('/casos');
      } finally {
        setCargando(false);
      }
    };
    init();
  }, [id, esAdmin, navigate]);

  // ── Editar caso ───────────────────────────────────────────
  const abrirEditar = () => {
    setModalEditar(true);
  };

  const onEditar = async (data) => {
    setGuardando(true);
    try {
      const payload = { ...data };
      Object.keys(payload).forEach(k => {
        if (payload[k] === '') payload[k] = null;
      });

      await CasoService.actualizar(id, payload);
      if (data.estado !== caso.estado) await CasoService.cambiarFase(id, data.estado);
      toast.success('Caso actualizado');
      setModalEditar(false);
      const nuevo = await cargarCaso();
      setCaso(nuevo);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al actualizar');
    } finally {
      setGuardando(false);
    }
  };

  // ── Asignar usuario ───────────────────────────────────────
  const onAsignar = async () => {
    if (!usuarioSeleccionado) return;
    setGuardando(true);
    try {
      await CasoService.asignarUsuario(id, usuarioSeleccionado);
      toast.success('Usuario asignado al caso');
      setModalAsignar(false);
      setUsuarioSeleccionado('');
      await cargarUsuariosAsignados();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al asignar usuario');
    } finally {
      setGuardando(false);
    }
  };

  // ── Desasignar usuario ────────────────────────────────────
  const onDesasignar = async (usuarioId) => {
    try {
      await CasoService.desasignarUsuario(id, usuarioId);
      toast.success('Usuario desasignado');
      await cargarUsuariosAsignados();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al desasignar');
    }
  };

  // Usuarios disponibles para asignar (excluir ya asignados)
  const asignadosIds = new Set(usuariosAsignados.map(u => u.id));
  const usuariosDisponibles = todosUsuarios.filter(u => !asignadosIds.has(u.id) && u.estado);

  if (cargando) {
    return (
      <div className="flex items-center justify-center h-full py-32">
        <span className="material-symbols-outlined animate-spin text-[48px] text-primary-container">progress_activity</span>
      </div>
    );
  }

  if (!caso) return null;

  const badge = faseBadge(caso.estado);
  const pBadge = prioridadBadge(caso.prioridad);

  return (
    <div className="p-margin-page max-w-[1400px] mx-auto flex flex-col gap-stack-lg">

      {/* ── Breadcrumb ─────────────────────────────────────── */}
      <div className="flex items-center gap-2 text-secondary font-body-sm text-body-sm">
        <Link to="/casos" className="hover:text-primary-container transition-colors">Casos</Link>
        <span className="material-symbols-outlined text-sm">chevron_right</span>
        <span className="text-on-surface font-medium truncate max-w-xs">{caso.titulo}</span>
      </div>

      {/* ── Page Header ────────────────────────────────────── */}
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div className="flex flex-wrap items-start gap-3">
          <div>
            <h2 className="font-display-lg text-display-lg text-primary-container leading-tight">{caso.titulo}</h2>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg font-label-caps text-label-caps ${badge.bg} ${badge.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                {caso.estado}
              </span>
              <span className={`inline-flex items-center px-2 py-1 rounded-lg font-label-caps text-label-caps ${caso.activo ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-surface-container-highest text-on-surface-variant'}`}>
                {caso.activo ? 'Activo' : 'Inactivo'}
              </span>
              <span className={`inline-flex items-center px-2 py-1 rounded-lg font-label-caps text-label-caps ${pBadge.bg} ${pBadge.text}`}>
                PRIORIDAD: {caso.prioridad || 'MEDIA'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 items-start justify-end">
          <button
            onClick={abrirEditar}
            className="px-4 py-2 bg-surface border border-secondary-fixed text-primary-container font-title-sm text-sm font-bold rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">edit</span>
            Editar
          </button>
          {tab === 'docs' && (
            <button
              onClick={() => setIsPapeleraOpen(true)}
              className="px-4 py-2 bg-surface border border-secondary-fixed text-on-surface-variant font-title-sm text-sm font-bold rounded-lg hover:bg-red-50 hover:text-error transition-colors flex items-center gap-2"
              title="Papelera de reciclaje"
            >
              <span className="material-symbols-outlined text-sm">delete_sweep</span>
              Papelera
            </button>
          )}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="border-b border-secondary-fixed overflow-x-auto">
        <nav className="flex gap-6 min-w-max">
          {[
            { key: 'info',      icon: 'info',        label: 'Información' },
            { key: 'docs',      icon: 'folder',      label: 'Documentos' },
            { key: 'notas',     icon: 'history_edu', label: 'Bitácora' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => {
                setTab(t.key);
                navigate(`/casos/${id}?tab=${t.key}`, { replace: true });
              }}
              className={`pb-4 px-1 font-title-sm text-title-sm border-b-2 flex items-center gap-2 transition-colors ${
                tab === t.key
                  ? 'text-primary-container border-primary-container font-semibold'
                  : 'text-secondary hover:text-on-surface border-transparent hover:border-secondary-fixed'
              }`}
            >
              <span className="material-symbols-outlined text-lg">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {/* ══════════════════════════════════════════════════════
          TAB: INFORMACIÓN
      ══════════════════════════════════════════════════════ */}
      {tab === 'info' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-gutter-table">
          {/* Left Column (Detalles & Equipo) */}
          <div className="xl:col-span-2 flex flex-col gap-gutter-table">
            {/* Detalles generales */}
            <div className="bg-surface border border-secondary-fixed rounded-xl p-padding-card flex flex-col gap-6">
            <div className="flex justify-between items-center border-b border-secondary-fixed pb-4">
              <h3 className="font-title-sm text-title-sm text-on-surface">Detalles Generales</h3>
            </div>
            <div className="grid grid-cols-2 gap-y-6 gap-x-8">
              <div className="flex flex-col gap-1 col-span-2 sm:col-span-1">
                <span className="font-label-caps text-label-caps text-secondary uppercase">Cliente Principal</span>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-outline">domain</span>
                  <Link to={cliente ? `/clientes/${cliente.id}` : '#'} className="font-body-md text-body-md font-medium text-primary-container hover:underline">
                    {cliente ? formatNombreCliente(cliente) : `Cliente #${caso.cliente_id}`}
                  </Link>
                </div>
              </div>
              
              <div className="flex flex-col gap-1 col-span-2 sm:col-span-1">
                <span className="font-label-caps text-label-caps text-secondary uppercase">Número de Rol</span>
                <span className="font-body-md text-body-md font-medium text-on-surface font-mono">
                  {caso.numero_rol || <span className="text-outline italic">No registrado</span>}
                </span>
              </div>

              <div className="flex flex-col gap-1 col-span-2 sm:col-span-1">
                <span className="font-label-caps text-label-caps text-secondary uppercase">Tribunal</span>
                <span className="font-body-md text-body-md text-on-surface">
                  {caso.tribunal || <span className="text-outline italic">No registrado</span>}
                </span>
              </div>

              <div className="flex flex-col gap-1 col-span-2 sm:col-span-1">
                <span className="font-label-caps text-label-caps text-secondary uppercase">Materia</span>
                <span className="font-body-md text-body-md text-on-surface">
                  {caso.materia || <span className="text-outline italic">No registrada</span>}
                </span>
              </div>

              <div className="flex flex-col gap-1 col-span-2 sm:col-span-1">
                <span className="font-label-caps text-label-caps text-secondary uppercase">Fecha de Inicio</span>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-outline">event</span>
                  <span className="font-body-md text-body-md text-on-surface">
                    {formatFechaShort(caso.fecha_inicio)}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-1 col-span-2 sm:col-span-1">
                <span className="font-label-caps text-label-caps text-secondary uppercase">Fecha de Cierre (Proyectada)</span>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-outline">event_available</span>
                  <span className="font-body-md text-body-md text-on-surface">
                    {formatFechaShort(caso.fecha_cierre)}
                  </span>
                </div>
              </div>
              
              <div className="flex flex-col gap-1 col-span-2 sm:col-span-1">
                <span className="font-label-caps text-label-caps text-secondary uppercase">Fecha de Apertura en Sistema</span>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-outline">calendar_today</span>
                  <span className="font-body-md text-body-md text-on-surface">{formatFecha(caso.fecha_creacion)}</span>
                </div>
              </div>
              <div className="flex flex-col gap-1 col-span-2 sm:col-span-1">
                <span className="font-label-caps text-label-caps text-secondary uppercase">Última Actualización</span>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-outline">update</span>
                  <span className="font-body-md text-body-md text-on-surface">
                    {caso.fecha_actualizacion ? formatFecha(caso.fecha_actualizacion) : 'Sin cambios'}
                  </span>
                </div>
              </div>
            </div>
            {/* Descripción */}
            <div className="flex flex-col gap-2 mt-2 pt-4 border-t border-secondary-fixed">
              <span className="font-label-caps text-label-caps text-secondary uppercase">Descripción del Caso</span>
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed bg-surface-container-lowest p-4 rounded-lg border border-secondary-fixed min-h-[80px]">
                {caso.descripcion || <span className="italic text-outline">Sin descripción.</span>}
              </p>
            </div>
          </div>

          {/* Equipo Legal Asignado */}
          <div className="bg-surface border border-secondary-fixed rounded-xl p-padding-card flex flex-col gap-4">
          <div className="flex justify-between items-center border-b border-secondary-fixed pb-4 mb-2">
            <h3 className="font-title-sm text-title-sm text-on-surface">Equipo Legal Asignado</h3>
            {esAdmin && (
              <button
                onClick={() => setModalAsignar(true)}
                className="text-primary-container hover:bg-surface-container-high p-1.5 rounded transition-colors flex items-center gap-1 font-body-sm text-body-sm"
                title="Asignar usuario"
              >
                <span className="material-symbols-outlined text-sm">person_add</span>
                Asignar
              </button>
            )}
          </div>

          {usuariosAsignados.length === 0 ? (
            <p className="text-on-surface-variant font-body-md text-body-md py-6 text-center">
              No hay usuarios asignados a este caso.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {usuariosAsignados.map(u => (
                <div key={u.id} className="flex items-center gap-3 p-3 hover:bg-surface-container-low rounded-xl transition-colors border border-transparent hover:border-secondary-fixed group">
                  <Avatar nombre={u.nombre} apellido={u.apellido} />
                  <div className="flex flex-col flex-1">
                    <span className="font-body-sm text-body-sm font-semibold text-on-surface">
                      {u.nombre} {u.apellido}
                    </span>
                    <span className="font-label-caps text-label-caps text-secondary">{u.rol}</span>
                  </div>
                  {esAdmin && (
                    <button
                      onClick={() => onDesasignar(u.id)}
                      className="opacity-0 group-hover:opacity-100 text-outline hover:text-error transition-all p-1 rounded hover:bg-red-50"
                      title="Desasignar"
                    >
                      <span className="material-symbols-outlined text-[18px]">person_remove</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
          </div>
        </div>

        {/* Right Column (Progreso) */}
        {/* Progreso de fases (1 col) */}
        <div className="bg-surface border border-secondary-fixed rounded-xl p-padding-card flex flex-col gap-4 h-fit">
          <div className="border-b border-secondary-fixed pb-4">
            <h3 className="font-title-sm text-title-sm text-on-surface">Progreso del Caso</h3>
          </div>
          <FaseStepper faseActual={caso.estado} />
        </div>
      </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB: DOCUMENTOS
      ══════════════════════════════════════════════════════ */}
      {tab === 'docs' && (
        <div className="mt-4">
          <Documentos 
            isEmbedded={true} 
            caseTitle={caso.titulo} 
            casoId={id} 
            isPapeleraOpen={isPapeleraOpen}
            setIsPapeleraOpen={setIsPapeleraOpen}
          />
        </div>
      )}
      {/* ══════════════════════════════════════════════════════
          TAB: BITÁCORA / NOTAS
      ══════════════════════════════════════════════════════ */}
      {tab === 'notas' && (
        <div className="mt-4">
          <NotasCaso casoId={id} />
        </div>
      )}

      {/* ── Modal: Editar Caso ──────────────────────────────── */}
      {modalEditar && (
        <EditCasoModalWithSecurity
          caso={caso}
          onClose={() => setModalEditar(false)}
          onSave={onEditar}
          onToggle={async () => {
            const prevActivo = caso.activo;
            setCaso(prev => ({ ...prev, activo: !prevActivo }));
            try {
              await CasoService.toggleActivo(id);
              toast.success(`Caso ${!prevActivo ? 'restaurado' : 'eliminado'}`);
              if (prevActivo) {
                navigate('/casos');
              }
            } catch (err) {
              setCaso(prev => ({ ...prev, activo: prevActivo }));
              toast.error('Error al cambiar estado');
            }
          }}
          guardando={guardando}
          esAdmin={esAdmin}
        />
      )}

      {/* ── Modal: Asignar Usuario (ADMIN) ─────────────────── */}
      {modalAsignar && (
        <Modal titulo="Asignar Usuario al Caso" onClose={() => { setModalAsignar(false); setUsuarioSeleccionado(''); }}>
          <div className="flex flex-col gap-stack-md">
            <div>
              <label className="block font-body-sm text-body-sm text-on-surface font-medium mb-1">Seleccionar usuario</label>
              <select
                value={usuarioSeleccionado}
                onChange={e => setUsuarioSeleccionado(e.target.value)}
                className="w-full border border-outline-variant rounded px-3 py-2 font-body-sm text-body-sm focus:border-primary-container outline-none bg-white"
              >
                <option value="">Seleccionar...</option>
                {usuariosDisponibles.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.nombre} {u.apellido} ({u.rol})
                  </option>
                ))}
              </select>
              {usuariosDisponibles.length === 0 && (
                <p className="text-on-surface-variant text-xs mt-2">Todos los usuarios activos ya están asignados.</p>
              )}
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => { setModalAsignar(false); setUsuarioSeleccionado(''); }}
                className="px-5 py-2 border border-outline-variant rounded font-body-sm text-body-sm text-on-surface hover:bg-surface-container transition-colors">
                Cancelar
              </button>
              <button onClick={onAsignar} disabled={!usuarioSeleccionado || guardando}
                className="px-5 py-2 bg-primary-container text-on-primary rounded font-body-sm text-body-sm hover:bg-primary transition-colors disabled:opacity-60">
                {guardando ? 'Asignando...' : 'Asignar'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ─── Modal de Edición con Seguridad ─────────────────────────
const EditCasoModalWithSecurity = ({ caso, onClose, onSave, onToggle, guardando, esAdmin }) => {
  const [showSecurity, setShowSecurity] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      titulo: caso.titulo,
      descripcion: caso.descripcion || '',
      estado: caso.estado,
      numero_rol: caso.numero_rol || '',
      tribunal: caso.tribunal || '',
      materia: caso.materia || '',
      prioridad: caso.prioridad || 'MEDIA',
      fecha_inicio: caso.fecha_inicio || '',
      fecha_cierre: caso.fecha_cierre || ''
    }
  });

  const wordToType = caso.activo ? 'eliminar' : 'restaurar';

  const handleToggleClick = () => {
    setShowSecurity(true);
  };

  const confirmToggle = async () => {
    if (confirmText.toLowerCase() === wordToType) {
      onClose();
      onToggle();
    } else {
      toast.error(`Debes escribir "${wordToType}" para confirmar.`);
    }
  };

  return (
    <Modal titulo="Editar Caso" onClose={onClose}>
      <form onSubmit={handleSubmit(onSave)} className="flex flex-col gap-4">
        
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block font-body-sm text-body-sm text-on-surface font-medium mb-1">Título *</label>
            <input
              {...register('titulo', { required: 'El título es obligatorio' })}
              className="w-full border border-outline-variant rounded px-3 py-2 font-body-sm text-body-sm focus:border-primary-container focus:ring-2 focus:ring-primary-fixed-dim outline-none"
            />
            {errors.titulo && <p className="text-error text-xs mt-1">{errors.titulo.message}</p>}
          </div>

          <div className="col-span-2 sm:col-span-1">
            <label className="block font-body-sm text-body-sm text-on-surface font-medium mb-1">Fase</label>
            <select
              {...register('estado')}
              className="w-full border border-outline-variant rounded px-3 py-2 font-body-sm text-body-sm focus:border-primary-container outline-none bg-white"
            >
              {FASES.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>

          <div className="col-span-2 sm:col-span-1">
            <label className="block font-body-sm text-body-sm text-on-surface font-medium mb-1">Prioridad</label>
            <select
              {...register('prioridad')}
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
              {...register('numero_rol')}
              className="w-full border border-outline-variant rounded px-3 py-2 font-body-sm text-body-sm focus:border-primary-container focus:ring-2 focus:ring-primary-fixed-dim outline-none"
            />
          </div>

          <div className="col-span-2 sm:col-span-1">
            <label className="block font-body-sm text-body-sm text-on-surface font-medium mb-1">Materia</label>
            <input
              {...register('materia')}
              className="w-full border border-outline-variant rounded px-3 py-2 font-body-sm text-body-sm focus:border-primary-container focus:ring-2 focus:ring-primary-fixed-dim outline-none"
            />
          </div>

          <div className="col-span-2">
            <label className="block font-body-sm text-body-sm text-on-surface font-medium mb-1">Tribunal</label>
            <input
              {...register('tribunal')}
              className="w-full border border-outline-variant rounded px-3 py-2 font-body-sm text-body-sm focus:border-primary-container focus:ring-2 focus:ring-primary-fixed-dim outline-none"
            />
          </div>

          <div className="col-span-2 sm:col-span-1">
            <label className="block font-body-sm text-body-sm text-on-surface font-medium mb-1">Fecha de Inicio</label>
            <input
              type="date"
              {...register('fecha_inicio')}
              className="w-full border border-outline-variant rounded px-3 py-2 font-body-sm text-body-sm focus:border-primary-container focus:ring-2 focus:ring-primary-fixed-dim outline-none"
            />
          </div>

          <div className="col-span-2 sm:col-span-1">
            <label className="block font-body-sm text-body-sm text-on-surface font-medium mb-1">Fecha de Cierre</label>
            <input
              type="date"
              {...register('fecha_cierre')}
              className="w-full border border-outline-variant rounded px-3 py-2 font-body-sm text-body-sm focus:border-primary-container focus:ring-2 focus:ring-primary-fixed-dim outline-none"
            />
          </div>

          <div className="col-span-2">
            <label className="block font-body-sm text-body-sm text-on-surface font-medium mb-1">Descripción</label>
            <textarea
              {...register('descripcion')}
              rows={4}
              className="w-full border border-outline-variant rounded px-3 py-2 font-body-sm text-body-sm focus:border-primary-container focus:ring-2 focus:ring-primary-fixed-dim outline-none resize-none"
            />
          </div>
        </div>

        {esAdmin && !showSecurity && (
          <div className="pt-4 border-t border-outline-variant mt-2">
            <button
              type="button"
              onClick={handleToggleClick}
              className={`w-full flex items-center justify-center gap-2 py-2 px-4 rounded border font-medium transition-colors ${
                caso.activo 
                  ? 'border-red-200 text-error hover:bg-red-50' 
                  : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              <span className="material-symbols-outlined text-lg">
                {caso.activo ? 'delete' : 'settings_backup_restore'}
              </span>
              {caso.activo ? 'Eliminar Caso' : 'Restaurar Caso'}
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

export default CasoDetalle;
