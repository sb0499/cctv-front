import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Camera, CheckCircle2, XCircle, AlertCircle, RefreshCw, Download, Search, ChevronDown, ChevronUp, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import Sidebar from '@/components/Sidebar';

export default function InspeccionCamarasPage() {
  const { ccSlug } = useParams<{ ccSlug: string }>();
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  const [camaras, setCamaras] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonitor, setSelectedMonitor] = useState('');
  const [expandedMonitors, setExpandedMonitors] = useState<{ [key: string]: boolean }>({});
  
  // Paginación (idéntica a SECAM)
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [ccName, setCcName] = useState('Sede');
  const [adminUsername, setAdminUsername] = useState('Administrador');

  const [error, setError] = useState<string | null>(null);
  const [successReport, setSuccessReport] = useState<{ id: number; total: number; operativas: number; no_operativas: number } | null>(null);

  useEffect(() => {
    const savedColor = localStorage.getItem('selectedCCColor');
    if (savedColor) {
      document.documentElement.style.setProperty('--primary-color', savedColor);
    }
    setCcName(localStorage.getItem('selectedCCName') || 'Sede');
    setAdminUsername(localStorage.getItem('adminNombreCompleto') || localStorage.getItem('adminUsername') || 'Administrador');
  }, []);

  useEffect(() => {
    if (!ccSlug) {
      navigate('/');
      return;
    }
    const token = localStorage.getItem('adminToken');

    if (!token) {
      navigate(`/${ccSlug}/login`);
      return;
    }

    loadCamaras();
  }, [ccSlug, navigate]);

  const loadCamaras = async () => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem('adminToken');

    try {
      const response = await fetch(`${API_URL}/api/camaras`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        setError('Error al obtener lista de cámaras para inspección');
        return;
      }

      const data = await response.json();
      const initialInspection = data.map((cam: any) => ({
        ...cam,
        estado: Boolean(Number(cam.estado)),
        estado_anterior: Number(cam.estado),
        observaciones: cam.observaciones || '',
      }));
      setCamaras(initialInspection);

      const monitors = Array.from(new Set(initialInspection.map((c: any) => c.propietario_nombre || 'Sin Monitor')));
      const initialExpanded: { [key: string]: boolean } = {};
      monitors.forEach((m) => {
        initialExpanded[m as string] = true;
      });
      setExpandedMonitors(initialExpanded);
    } catch (err) {
      setError('Error de conexión al cargar cámaras');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEstado = (id: number) => {
    setCamaras((prev) =>
      prev.map((c) => (c.id === id ? { ...c, estado: !c.estado } : c))
    );
  };

  const handleObservacionChange = (id: number, obs: string) => {
    setCamaras((prev) =>
      prev.map((c) => (c.id === id ? { ...c, observaciones: obs } : c))
    );
  };

  const toggleAccordion = (monitor: string) => {
    setExpandedMonitors((prev) => ({
      ...prev,
      [monitor]: !prev[monitor],
    }));
  };

  const handleSubmitInspeccion = async () => {
    if (camaras.length === 0) {
      setError('No hay cámaras registradas para inspeccionar');
      return;
    }

    setSubmitting(true);
    setError(null);

    const token = localStorage.getItem('adminToken');
    const payload = {
      camaras_inspeccion: camaras,
    };

    try {
      const response = await fetch(`${API_URL}/api/reportes-inspeccion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.message || 'Error al guardar reporte de inspección');
        return;
      }

      setSuccessReport({
        id: data.reporte_id,
        total: data.total_camaras,
        operativas: data.operativas,
        no_operativas: data.no_operativas,
      });
    } catch (err) {
      setError('Error de red al guardar inspección');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!successReport) return;
    const token = localStorage.getItem('adminToken');
    const res = await fetch(`${API_URL}/api/reportes-inspeccion/${successReport.id}/pdf`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    }
  };

  const handleNuevaInspeccion = () => {
    setSuccessReport(null);
    setPage(0);
    loadCamaras();
  };

  // Filtrado de cámaras
  const filteredCamaras = camaras.filter((c) => {
    const matchesSearch =
      c.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.codigo_camara?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.ip?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.sector_nombre?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesMonitor =
      !selectedMonitor || (c.propietario_nombre || 'Sin Monitor') === selectedMonitor;

    return matchesSearch && matchesMonitor;
  });

  // Paginación aplicada sobre las cámaras filtradas
  const paginatedCamaras = filteredCamaras.slice(page * rowsPerPage, (page + 1) * rowsPerPage);

  // Agrupamiento por Monitor (propietario_nombre) de las cámaras en la página actual
  const groupedCameras = paginatedCamaras.reduce((acc: any, cam: any) => {
    const monitor = cam.propietario_nombre || 'Sin Monitor';
    if (!acc[monitor]) {
      acc[monitor] = [];
    }
    acc[monitor].push(cam);
    return acc;
  }, {});

  const monitorList = Array.from(
    new Set(camaras.map((c) => c.propietario_nombre || 'Sin Monitor').filter(Boolean))
  );

  const totalPages = Math.ceil(filteredCamaras.length / rowsPerPage);
  const startCount = filteredCamaras.length > 0 ? page * rowsPerPage + 1 : 0;
  const endCount = Math.min((page + 1) * rowsPerPage, filteredCamaras.length);

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      <Sidebar username={adminUsername} />

      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <div className="max-w-7xl w-full mx-auto p-4 md:p-8">
          
          {/* Header Superior */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-black text-slate-800 tracking-tight">Inspección y Reporte</h1>
              <p className="text-slate-500 text-xs md:text-sm mt-1">
                Inspeccione las cámaras del inventario. El cambio de switch se guarda en memoria y se procesa al generar el reporte.
              </p>
            </div>

            <button
              onClick={handleSubmitInspeccion}
              disabled={submitting || camaras.length === 0}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
            >
              <CheckCircle2 className="w-5 h-5" />
              {submitting ? 'Generando...' : 'Generar Reporte'}
            </button>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              {error}
            </div>
          )}

          {/* Barra de Filtros */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row items-center gap-4">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar cámara por nombre o IP..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(0);
                }}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="w-full md:w-64 shrink-0">
              <select
                value={selectedMonitor}
                onChange={(e) => {
                  setSelectedMonitor(e.target.value);
                  setPage(0);
                }}
                className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-700"
              >
                <option value="">Filtrar Monitor (Todos)</option>
                {monitorList.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={loadCamaras}
              className="p-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition-colors shrink-0"
              title="Recargar estado cámaras"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Contenido Agrupado por Monitor */}
          {loading ? (
            <div className="p-12 text-center text-slate-500 text-sm font-medium">Cargando cámaras ordenadas por monitor...</div>
          ) : Object.keys(groupedCameras).length === 0 ? (
            <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center text-slate-500 text-sm">
              No se encontraron cámaras para realizar la inspección.
            </div>
          ) : (
            <div className="space-y-4 mb-6">
              {Object.keys(groupedCameras).map((monitor) => {
                const monitorCameras = groupedCameras[monitor];
                const isExpanded = expandedMonitors[monitor] !== false;

                return (
                  <div key={monitor} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                    {/* Acordeón Cabecera del Monitor */}
                    <button
                      type="button"
                      onClick={() => toggleAccordion(monitor)}
                      className="w-full bg-slate-50/80 hover:bg-slate-100/80 px-5 py-3.5 border-b border-slate-200 flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <span className="font-bold text-slate-800 text-sm flex items-center gap-2">
                        Monitor: <span className="text-slate-900">{monitor}</span>
                        <span className="text-xs font-normal text-slate-500">({monitorCameras.length} cámaras en página)</span>
                      </span>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                    </button>

                    {/* Lista de Cámaras del Monitor */}
                    {isExpanded && (
                      <div className="divide-y divide-slate-100 p-2 md:p-4 space-y-2">
                        {monitorCameras.map((cam: any) => (
                          <div key={cam.id} className="p-3 md:p-4 rounded-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors">
                            
                            {/* Icono + Detalles de la Cámara */}
                            <div className="flex items-center gap-3.5 flex-1 min-w-0">
                              <div
                                className={`w-11 h-11 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs ${
                                  cam.estado ? 'bg-emerald-500' : 'bg-rose-500'
                                }`}
                              >
                                <Camera className="w-5 h-5" />
                              </div>

                              <div className="min-w-0 flex-1">
                                <h3 className="font-bold text-slate-900 text-sm truncate">
                                  {cam.codigo_camara ? `[${cam.codigo_camara}] ` : ''}
                                  {cam.nombre}
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5 font-medium truncate">
                                  IP: <span className="text-slate-700">{cam.ip || 'Sin IP'}</span> | Nivel: <span className="text-slate-700">{cam.nivel_nombre || '-'}</span> | Sector: <span className="text-slate-700">{cam.sector_nombre || '-'}</span>
                                </p>
                                <p className="text-[11px] text-slate-400 mt-0.5">
                                  Tipo: {cam.tipo_nombre || '-'} | Modelo: {cam.modelo_nombre || '-'}
                                </p>
                              </div>
                            </div>

                            {/* Campo Observaciones de Inspección */}
                            <div className="w-full lg:w-80 shrink-0">
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                Observaciones de Inspección
                              </label>
                              <input
                                type="text"
                                placeholder="Observaciones de Inspección"
                                value={cam.observaciones || ''}
                                onChange={(e) => handleObservacionChange(cam.id, e.target.value)}
                                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium text-slate-700"
                              />
                            </div>

                            {/* Switch de Estado */}
                            <div className="flex items-center justify-end gap-3 shrink-0 pt-2 lg:pt-0">
                              <button
                                type="button"
                                onClick={() => handleToggleEstado(cam.id)}
                                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                  cam.estado ? 'bg-emerald-500' : 'bg-slate-300'
                                }`}
                              >
                                <span
                                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                    cam.estado ? 'translate-x-5' : 'translate-x-0'
                                  }`}
                                />
                              </button>

                              <span className={`text-xs font-bold flex items-center gap-1 min-w-[90px] ${cam.estado ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {cam.estado ? (
                                  <>
                                    <Check className="w-4 h-4" />
                                    Buen Estado
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="w-4 h-4" />
                                    Con Falla
                                  </>
                                )}
                              </span>
                            </div>

                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Barra de Paginación (Idéntica a SECAM) */}
          {filteredCamaras.length > 0 && (
            <div className="bg-white px-6 py-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500 font-medium">Cámaras por página:</span>
                <select
                  value={rowsPerPage}
                  onChange={(e) => {
                    setRowsPerPage(Number(e.target.value));
                    setPage(0);
                  }}
                  className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-xs text-slate-500 font-medium">
                  {startCount}-{endCount} de {filteredCamaras.length}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Modal de Éxito en Generación de Reporte */}
      {successReport && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full text-center border border-slate-100">
            <h2 className="text-xl font-extrabold text-slate-800 mb-4">¡Reporte Generado!</h2>
            
            <div className="w-16 h-16 bg-emerald-500 rounded-full text-white flex items-center justify-center mx-auto mb-3 shadow-md shadow-emerald-500/20">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <p className="font-bold text-slate-800 text-sm mb-1">
              Inspección procesada con éxito.
            </p>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              El PDF corporativo ha sido generado, almacenado en el servidor y enviado por correo a los miembros del equipo.
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-5 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                RESUMEN DE REPORTES
              </span>
              <p className="text-xs font-bold text-slate-800 mb-1">
                Total Cámaras: {successReport.total}
              </p>
              <p className="text-xs font-bold text-emerald-600 mb-1">
                Operativas: {successReport.operativas}
              </p>
              <p className="text-xs font-bold text-rose-600">
                No Operativas: {successReport.no_operativas}
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleDownloadPdf}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Descargar Reporte PDF
              </button>

              <button
                onClick={handleNuevaInspeccion}
                className="w-full py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              >
                Iniciar Nueva Inspección
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


