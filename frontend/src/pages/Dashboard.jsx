import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const Dashboard = () => {
  const [stats, setStats] = useState({
    kpis: { casosActivos: '—', clientes: '—', casosAbiertos: 0, casosCerrados: 0, documentosAnalizados: '—' },
    chartData: [],
    actividadReciente: []
  });
  const [cargando, setCargando] = useState(true);
  const [modalHistorial, setModalHistorial] = useState(false);
  const [rangoGrafico, setRangoGrafico] = useState('6m');
  const navigate = useNavigate();

  // Filtra los meses del gráfico según el rango seleccionado:
  // '6m'    → todos los datos del backend (ya son 6 meses)
  // 'anual' → solo los meses transcurridos del año en curso
  const mesesEsteAnio = new Date().getMonth() + 1; // 1 (ene) … 12 (dic)
  const chartDataFiltrado = rangoGrafico === '6m'
    ? stats.chartData
    : stats.chartData.slice(-mesesEsteAnio);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const resp = await api.get('/dashboard/stats');
        setStats(resp.data);
      } catch (error) {
        console.error("Error al cargar dashboard", error);
      } finally {
        setCargando(false);
      }
    };
    fetchStats();
  }, []);

  const kpis = [
    { icon: 'folder_open', iconBg: 'bg-blue-50', iconColor: 'text-primary-container', label: 'Casos Activos', value: stats.kpis.casosActivos, badge: `${stats.kpis.casosAbiertos} abiertos` },
    { icon: 'groups', iconBg: 'bg-emerald-50', iconColor: 'text-emerald-700', label: 'Clientes', value: stats.kpis.clientes, badge: 'activos' },
    { icon: 'description', iconBg: 'bg-purple-50', iconColor: 'text-purple-700', label: 'Documentos Analizados', value: stats.kpis.documentosAnalizados, badge: 'por IA' },
  ];

  return (
    <div className="p-margin-page max-w-[1600px] mx-auto">
      {/* ── Header ── */}
      <div className="flex flex-wrap justify-between items-end mb-8 gap-3">
        <div>
          <h2 className="font-display-lg text-display-lg text-primary-container">Visión General</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">Resumen del estado del bufete al día de hoy.</p>
        </div>
      </div>

      {/* ── Bento Grid ── */}
      <div className="grid grid-cols-12 gap-6">
        {/* KPI Cards */}
        {kpis.map((kpi) => (
          <div key={kpi.label} className="col-span-12 md:col-span-4 bg-surface-container-lowest border border-[#E5E7EB] rounded-lg p-padding-card flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-2 ${kpi.iconBg} ${kpi.iconColor} rounded`}>
                <span className="material-symbols-outlined">{kpi.icon}</span>
              </div>
              <span className="font-label-caps text-label-caps text-on-secondary-container bg-surface-container px-2 py-1 rounded">
                {kpi.badge}
              </span>
            </div>
            <div>
              <p className="font-body-md text-body-md text-on-surface-variant">{kpi.label}</p>
              <h3 className="font-display-lg text-display-lg text-on-surface mt-1">{kpi.value}</h3>
            </div>
          </div>
        ))}

        {/* ── Chart ── */}
        <div className="col-span-12 lg:col-span-8 bg-surface-container-lowest border border-[#E5E7EB] rounded-lg p-padding-card h-96 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-title-sm text-title-sm text-on-surface">Tendencia de Casos por Fase</h3>
            <select
              value={rangoGrafico}
              onChange={e => setRangoGrafico(e.target.value)}
              className="border border-[#E5E7EB] rounded pl-3 pr-8 py-1 font-body-sm text-body-sm text-on-surface focus:border-primary-container focus:ring-0 bg-white cursor-pointer"
            >
              <option value="6m">Últimos 6 meses</option>
              <option value="anual">Este año</option>
            </select>
          </div>
          <div className="flex-1 relative flex items-end gap-4 pb-6 pt-10">
            <div className="absolute inset-0 border-b border-[#E5E7EB] pointer-events-none flex flex-col justify-between pb-6">
              {[0, 1, 2, 3].map(i => <div key={i} className="w-full border-t border-dashed border-[#E5E7EB] h-0" />)}
            </div>
            {chartDataFiltrado.length === 0 && !cargando ? (
              <div className="absolute inset-0 flex items-center justify-center text-on-surface-variant font-body-sm">
                {rangoGrafico === 'anual'
                  ? 'No hay casos registrados en lo que va del año.'
                  : 'No hay casos creados en los últimos 6 meses.'}
              </div>
            ) : null}
            {chartDataFiltrado.map((d) => {
              const max = Math.max(...chartDataFiltrado.map(c => 
                (c.abierto || 0) + (c.discusion || 0) + (c.conciliacion || 0) + (c.prueba || 0) + (c.impugnacion || 0) + (c.cerrado || 0)
              ), 1);
              
              const h_cerrado = (d.cerrado / max) * 100;
              const h_impugnacion = (d.impugnacion / max) * 100;
              const h_prueba = (d.prueba / max) * 100;
              const h_conciliacion = (d.conciliacion / max) * 100;
              const h_discusion = (d.discusion / max) * 100;
              const h_abierto = (d.abierto / max) * 100;

              return (
                <div key={d.mes} className="flex-1 flex flex-col justify-end items-center gap-2 z-10 group">
                  <div className="w-3/4 md:w-1/2 flex flex-col justify-end h-full gap-[1px]">
                    {h_cerrado > 0 && <div className="w-full bg-[#94a3b8] group-hover:opacity-80 transition-opacity rounded-t-[2px]" style={{ height: `${h_cerrado}%`, minHeight: '4px' }} title={`${d.cerrado} Cerrado`} />}
                    {h_impugnacion > 0 && <div className="w-full bg-[#ef4444] group-hover:opacity-80 transition-opacity" style={{ height: `${h_impugnacion}%`, minHeight: '4px' }} title={`${d.impugnacion} Impugnación`} />}
                    {h_prueba > 0 && <div className="w-full bg-[#a855f7] group-hover:opacity-80 transition-opacity" style={{ height: `${h_prueba}%`, minHeight: '4px' }} title={`${d.prueba} Prueba`} />}
                    {h_conciliacion > 0 && <div className="w-full bg-[#f97316] group-hover:opacity-80 transition-opacity" style={{ height: `${h_conciliacion}%`, minHeight: '4px' }} title={`${d.conciliacion} Conciliación`} />}
                    {h_discusion > 0 && <div className="w-full bg-[#f59e0b] group-hover:opacity-80 transition-opacity" style={{ height: `${h_discusion}%`, minHeight: '4px' }} title={`${d.discusion} Discusión`} />}
                    {h_abierto > 0 && <div className="w-full bg-[#4f46e5] group-hover:opacity-80 transition-opacity" style={{ height: `${h_abierto}%`, minHeight: '4px' }} title={`${d.abierto} Abierto`} />}
                  </div>
                  <span className="font-body-sm text-body-sm text-on-surface-variant text-xs">{d.mes}</span>
                </div>
              );
            })}
          </div>
          <div className="flex justify-center flex-wrap gap-x-5 gap-y-2 mt-4 px-2">
            {[
              { label: 'Abierto', color: 'bg-[#4f46e5]' },
              { label: 'Discusión', color: 'bg-[#f59e0b]' },
              { label: 'Conciliación', color: 'bg-[#f97316]' },
              { label: 'Prueba', color: 'bg-[#a855f7]' },
              { label: 'Impugnación', color: 'bg-[#ef4444]' },
              { label: 'Cerrado', color: 'bg-[#94a3b8]' }
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1.5 font-body-sm text-body-sm text-on-surface-variant text-xs">
                <div className={`w-2.5 h-2.5 rounded-full ${l.color}`} /> {l.label}
              </div>
            ))}
          </div>
        </div>

        {/* ── Actividad Reciente ── */}
        <div className="col-span-12 lg:col-span-4 bg-surface-container-lowest border border-[#E5E7EB] rounded-lg p-padding-card flex flex-col">
          <h3 className="font-title-sm text-title-sm text-on-surface mb-6">Actividad Reciente</h3>
          <div className="flex-1 overflow-auto">
            <div className="space-y-4">
              {cargando ? (
                <div className="py-8 text-center text-on-surface-variant font-body-sm">Cargando...</div>
              ) : stats.actividadReciente.length === 0 ? (
                <div className="py-8 text-center text-on-surface-variant font-body-sm">No hay actividad reciente</div>
              ) : (
                stats.actividadReciente.map((act, i) => (
                  <div 
                    key={i} 
                    onClick={() => act.enlace && navigate(act.enlace)}
                    className="flex gap-4 p-3 rounded-lg hover:bg-surface-container-low transition-colors border border-transparent hover:border-[#E5E7EB] cursor-pointer"
                  >
                    <div className={`w-10 h-10 rounded-full ${act.iconBg} flex items-center justify-center ${act.iconColor} shrink-0`}>
                      <span className="material-symbols-outlined text-sm">{act.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-body-sm text-body-sm font-medium text-on-surface truncate" title={act.titulo}>{act.titulo}</p>
                      <p className="font-body-sm text-body-sm text-on-surface-variant text-xs mt-0.5">
                        {act.usuario && <span className="font-semibold text-secondary mr-1">{act.usuario}:</span>}
                        {act.desc} — <span className="text-primary-container">{act.tiempo}</span>
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          <button 
            onClick={() => setModalHistorial(true)}
            className="w-full mt-4 py-2 border border-[#E5E7EB] rounded font-body-sm text-body-sm text-primary-container hover:bg-blue-50 transition-colors"
          >
            Ver todo el historial
          </button>
        </div>
      </div>

      {/* ── Modal Historial Completo ── */}
      {modalHistorial && (
        <HistorialModal onClose={() => setModalHistorial(false)} />
      )}
    </div>
  );
};

const HistorialModal = ({ onClose }) => {
  const [historial, setHistorial] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [pagina, setPagina] = useState(0);
  const [hayMas, setHayMas] = useState(true);
  const [esAdmin, setEsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const perfil = JSON.parse(localStorage.getItem('user_profile') || '{}');
      setEsAdmin(perfil.rol === 'ADMIN');
    } catch {}
  }, []);

  const cargarHistorial = async (pag) => {
    try {
      if (pag === 0) setCargando(true);
      const resp = await api.get(`/actividades/?skip=${pag * 20}&limit=20`);
      
      const nuevasActividades = resp.data.actividades.map(act => {
        const d = new Date(act.fecha);
        const fechaStr = d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute:'2-digit' });
        
        const ent_val = typeof act.entidad_tipo === 'string' ? act.entidad_tipo.toUpperCase() : act.entidad_tipo;
        const ent_show = ent_val === 'CASO' ? 'Caso' : ent_val === 'CLIENTE' ? 'Cliente' : ent_val === 'DOCUMENTO' ? 'Documento' : ent_val;

        let icon = "info", bg = "bg-gray-50", color = "text-gray-700", enlace = null;
        if (act.accion === "CREACION") {
          if (ent_val === "CASO") { icon = "gavel"; bg = "bg-orange-50"; color = "text-orange-700"; enlace = `/casos/${act.entidad_id}`; }
          else if (ent_val === "CLIENTE") { icon = "person_add"; bg = "bg-sky-50"; color = "text-sky-700"; enlace = `/clientes`; }
        } else if (act.accion === "SUBIDA") { icon = "upload_file"; bg = "bg-blue-50"; color = "text-primary-container"; enlace = `/casos/${act.caso_id}?tab=docs`; }
        else if (act.accion === "ANALISIS_IA") { icon = "psychology"; bg = "bg-purple-50"; color = "text-purple-700"; enlace = `/casos/${act.caso_id}?tab=docs`; }
        else if (act.accion === "ACTUALIZACION") { icon = "edit_document"; bg = "bg-emerald-50"; color = "text-emerald-700"; enlace = act.caso_id ? `/casos/${act.caso_id}` : null; }
        else if (act.accion === "ELIMINACION") { icon = "delete"; bg = "bg-red-50"; color = "text-red-700"; enlace = act.caso_id ? `/casos/${act.caso_id}?tab=docs` : null; }
        else if (act.accion === "ASIGNACION") { icon = "group_add"; bg = "bg-slate-50"; color = "text-slate-700"; enlace = act.caso_id ? `/casos/${act.caso_id}?tab=usuarios` : null; }

        const usuarioNombre = act.usuario ? `${act.usuario.nombre} ${act.usuario.apellido}` : 'Sistema';

        return {
          id: act.id,
          icon, iconBg: bg, iconColor: color,
          titulo: act.descripcion,
          desc: `${ent_show} #${act.entidad_id}`,
          tiempo: fechaStr,
          enlace,
          usuario: usuarioNombre
        };
      });

      if (pag === 0) setHistorial(nuevasActividades);
      else setHistorial(prev => [...prev, ...nuevasActividades]);
      
      setHayMas(resp.data.actividades.length === 20);
    } catch (error) {
      console.error("Error cargando historial", error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarHistorial(0);
  }, []);

  const cargarMas = () => {
    const nuevaPagina = pagina + 1;
    setPagina(nuevaPagina);
    cargarHistorial(nuevaPagina);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 p-padding-card flex flex-col max-h-[85vh]">
        <div className="flex justify-between items-center mb-stack-lg border-b border-[#E5E7EB] pb-4">
          <h3 className="font-title-sm text-title-sm text-on-surface">Historial de Auditoría</h3>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto pr-2 space-y-3">
          {cargando && pagina === 0 ? (
            <div className="py-8 text-center text-on-surface-variant font-body-sm">Cargando registros...</div>
          ) : historial.length === 0 ? (
            <div className="py-8 text-center text-on-surface-variant font-body-sm">No hay registros de actividad en la base de datos.</div>
          ) : (
            historial.map((act) => (
              <div 
                key={act.id} 
                onClick={() => { if(act.enlace) { onClose(); navigate(act.enlace); } }}
                className={`flex gap-4 p-3 rounded-lg border border-[#E5E7EB] transition-colors ${act.enlace ? 'hover:bg-surface-container-low cursor-pointer hover:border-primary-container/30' : ''}`}
              >
                <div className={`w-10 h-10 rounded-full ${act.iconBg} flex items-center justify-center ${act.iconColor} shrink-0`}>
                  <span className="material-symbols-outlined text-sm">{act.icon}</span>
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <p className="font-body-sm text-body-sm font-medium text-on-surface">{act.titulo}</p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant text-xs mt-0.5 flex items-center gap-1">
                    {esAdmin && <><span className="font-semibold text-secondary">{act.usuario}</span><span className="text-outline-variant">•</span></>}
                    <span>{act.desc}</span> <span className="text-outline-variant mx-0.5">|</span> <span className="text-primary-container">{act.tiempo}</span>
                  </p>
                </div>
              </div>
            ))
          )}
          {hayMas && !cargando && (
            <button onClick={cargarMas} className="w-full mt-2 py-3 border border-dashed border-[#E5E7EB] rounded-lg text-secondary hover:text-on-surface hover:bg-surface-container-lowest transition-colors font-body-sm text-body-sm">
              Cargar más registros
            </button>
          )}
          {cargando && pagina > 0 && (
            <div className="py-4 text-center text-on-surface-variant font-body-sm text-xs">Cargando más...</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
