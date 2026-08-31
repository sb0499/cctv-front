import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FileSpreadsheet, Users, Clock, Search, ExternalLink, Calendar, Hash, FileText, ChevronLeft, ChevronRight, AlertCircle, X, Filter } from 'lucide-react';
import Sidebar from '@/components/Sidebar';

const PAGE_SIZE = 15;

type EstadoFilter = '' | 'ABIERTO' | 'CERRADO';

export default function AdminPage() {
  const { ccSlug } = useParams<{ ccSlug: string }>();
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<EstadoFilter>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [ccName, setCcName] = useState('Sede');
  const [adminUsername, setAdminUsername] = useState('Administrador');

  useEffect(() => {
    const savedColor = localStorage.getItem('selectedCCColor');
    if (savedColor) {
      document.documentElement.style.setProperty('--primary-color', savedColor);
    }
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

    const rol = localStorage.getItem('adminRol');
    if (rol === 'OPERADOR') {
      navigate(`/${ccSlug}`);
      return;
    }

    const validateCC = async () => {
      try {
        const response = await fetch(`${API_URL}/api/centros-comerciales/${ccSlug}`);
        if (!response.ok) {
          navigate('/');
          return;
        }
        const data = await response.json();
        setCcName(data.nombre);
        localStorage.setItem('selectedCCId', data.id.toString());
        localStorage.setItem('selectedCCName', data.nombre);
        localStorage.setItem('selectedCCColor', data.color || '#3b82f6');
        document.documentElement.style.setProperty('--primary-color', data.color || '#3b82f6');
        fetchRecords(token);
      } catch (e) {
        console.error(e);
        navigate('/');
      }
    };

    validateCC();
  }, [ccSlug]);

  // Reset to page 1 when any filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, fechaDesde, fechaHasta, estadoFilter]);

  const fetchRecords = async (token: string) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/ingresos`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setRecords(data);
      } else {
        navigate(`/${ccSlug}/login`);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Export passes current active filters to the backend
  const handleExportPDFReport = async () => {
    const token = localStorage.getItem('adminToken');
    try {
      const params = new URLSearchParams();
      if (fechaDesde) params.set('fechaDesde', fechaDesde);
      if (fechaHasta) params.set('fechaHasta', fechaHasta);
      if (estadoFilter) params.set('estado', estadoFilter);

      const qs = params.toString() ? `?${params.toString()}` : '';
      const response = await fetch(`${API_URL}/api/admin/reporte-pdf${qs}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Reporte_Consolidado_Trabajo_${ccSlug}_${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
    } catch (error) {
      console.error('PDF Report error', error);
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setFechaDesde('');
    setFechaHasta('');
    setEstadoFilter('');
  };

  // Client-side filter: text search + date range + estado
  const filteredRecords = records.filter(record => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || (
      record.visitante_nombre.toLowerCase().includes(searchLower) ||
      record.visitante_cedula.toLowerCase().includes(searchLower) ||
      record.operador_cctv.toLowerCase().includes(searchLower) ||
      (record.orden_trabajo && record.orden_trabajo.toLowerCase().includes(searchLower)) ||
      record.tipo_funcionario.toLowerCase().includes(searchLower) ||
      (record.detalle_actividad_autorizacion && record.detalle_actividad_autorizacion.toLowerCase().includes(searchLower))
    );

    const recordDateStr = record.fecha ? new Date(record.fecha).toISOString().split('T')[0] : '';
    const matchesFechaDesde = fechaDesde ? recordDateStr >= fechaDesde : true;
    const matchesFechaHasta = fechaHasta ? recordDateStr <= fechaHasta : true;
    const matchesEstado = estadoFilter ? record.estado === estadoFilter : true;

    return matchesSearch && matchesFechaDesde && matchesFechaHasta && matchesEstado;
  });

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / PAGE_SIZE));
  const paginatedRecords = filteredRecords.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const hasActiveFilters = !!(searchTerm || fechaDesde || fechaHasta || estadoFilter);
  const activeFilterCount = [searchTerm, fechaDesde, fechaHasta, estadoFilter].filter(Boolean).length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          <p className="text-sm font-semibold tracking-wide">Cargando historial...</p>
        </div>
      </div>
    );
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const recordsTodayCount = records.filter(r => {
    const rDate = r.fecha ? new Date(r.fecha).toISOString().split('T')[0] : '';
    return rDate === todayStr;
  }).length;
  const externalCount = records.filter(r => r.tipo_funcionario === 'Proveedor' || r.tipo_funcionario === 'Otros').length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col md:flex-row font-sans">
      <Sidebar username={adminUsername} />

      <main className="flex-1 p-4 sm:p-8 overflow-y-auto max-w-7xl mx-auto w-full">

        {/* Header */}
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8 border-b border-slate-200/60 pb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Historial de Trabajos</h1>
            <p className="text-slate-500 text-sm mt-1">Gestión, control y auditoría de reportes registrados en {ccName}</p>
          </div>
          <button
            onClick={handleExportPDFReport}
            className="w-full lg:w-auto flex items-center justify-center gap-2.5 bg-red-600 hover:bg-red-700 text-white px-6 py-3.5 rounded-xl font-bold shadow-md shadow-red-600/10 transition-all duration-300 active:scale-[0.98] cursor-pointer text-sm"
          >
            <FileSpreadsheet size={16} />
            Exportar{hasActiveFilters ? ` (${filteredRecords.length} filtrados)` : ' Reporte Completo'}
          </button>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="bg-white border border-slate-200/70 p-6 rounded-2xl shadow-sm hover:border-primary/30 transition-all group">
            <div className="text-primary mb-4 bg-primary/10 border border-primary/20 w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
              <FileText size={18} />
            </div>
            <div className="text-2xl font-black text-slate-900">{records.length}</div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1.5">Total Registros</div>
          </div>
          <div className="bg-white border border-slate-200/70 p-6 rounded-2xl shadow-sm hover:border-amber-500/30 transition-all group">
            <div className="text-amber-600 mb-4 bg-amber-50 border border-amber-100 w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
              <Clock size={18} />
            </div>
            <div className="text-2xl font-black text-slate-900">{recordsTodayCount}</div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1.5">Registrados Hoy</div>
          </div>
          <div className="bg-white border border-slate-200/70 p-6 rounded-2xl shadow-sm hover:border-purple-500/30 transition-all group">
            <div className="text-purple-600 mb-4 bg-purple-50 border border-purple-100 w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
              <Users size={18} />
            </div>
            <div className="text-2xl font-black text-slate-900">{externalCount}</div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1.5">Personal Externo</div>
          </div>
        </div>

        {/* Data Table Section */}
        <div className="bg-white border border-slate-200/70 rounded-2xl shadow-sm overflow-hidden">

          {/* Filters Panel */}
          <div className="p-5 border-b border-slate-100 bg-slate-50/60">
            {/* Top row: title + count + search */}
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 mb-4">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-sm">Listado de Actividades</h3>
                <span className="bg-slate-200 text-slate-600 text-xs px-2.5 py-0.5 rounded-full font-bold">{filteredRecords.length}</span>
                {hasActiveFilters && (
                  <span className="flex items-center gap-1 bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-full font-bold border border-primary/20">
                    <Filter size={9} /> {activeFilterCount} filtro{activeFilterCount > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                <input
                  type="text"
                  placeholder="Buscar por visitante, cédula, OT..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full sm:w-72 pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:border-primary focus:ring-1 focus:ring-primary/10 transition-all outline-none"
                />
              </div>
            </div>

            {/* Filter pills row */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Estado filter */}
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estado</span>
                <div className="flex gap-1 ml-1">
                  {(['', 'ABIERTO', 'CERRADO'] as EstadoFilter[]).map(opt => (
                    <button
                      key={opt}
                      onClick={() => setEstadoFilter(opt)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer ${
                        estadoFilter === opt
                          ? opt === 'ABIERTO'
                            ? 'bg-amber-500 text-white'
                            : opt === 'CERRADO'
                            ? 'bg-slate-700 text-white'
                            : 'bg-primary text-white'
                          : 'text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      {opt === '' ? 'Todos' : opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date range */}
              <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm">
                <Calendar size={13} className="text-slate-400 shrink-0" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">Desde</span>
                <input
                  type="date"
                  value={fechaDesde}
                  onChange={(e) => setFechaDesde(e.target.value)}
                  className="bg-transparent text-xs text-slate-700 font-semibold outline-none w-32 cursor-pointer"
                />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">Hasta</span>
                <input
                  type="date"
                  value={fechaHasta}
                  onChange={(e) => setFechaHasta(e.target.value)}
                  className="bg-transparent text-xs text-slate-700 font-semibold outline-none w-32 cursor-pointer"
                />
              </div>

              {/* Clear button */}
              {hasActiveFilters && (
                <button
                  onClick={handleClearFilters}
                  className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-xs font-bold hover:bg-rose-100 transition-colors cursor-pointer"
                >
                  <X size={12} /> Limpiar
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {filteredRecords.length === 0 ? (
              <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-3">
                <Search size={28} className="text-slate-300" />
                <p className="text-xs font-bold">No se encontraron registros con los filtros aplicados.</p>
                {hasActiveFilters && (
                  <button onClick={handleClearFilters} className="text-primary text-xs font-bold hover:underline">
                    Limpiar filtros
                  </button>
                )}
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200/80">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Fecha / Hora</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Visitante</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Orden Trabajo</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Funcionario</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Actividad</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-slate-50/50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-600">
                        <div className="font-bold text-slate-800">{record.fecha ? new Date(record.fecha).toLocaleDateString('es-ES', { timeZone: 'UTC' }) : ''}</div>
                        <div className="text-[10px] font-medium text-slate-400 mt-0.5">{record.hora_ingreso}{record.hora_salida ? ` - ${record.hora_salida}` : ''}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-extrabold text-slate-800 text-xs">{record.visitante_nombre}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">CC: {record.visitante_cedula}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold tracking-wider border ${
                          record.estado === 'ABIERTO'
                            ? 'bg-amber-100 text-amber-800 border-amber-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          {record.estado || 'ABIERTO'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                        {record.orden_trabajo ? (
                          <span className="inline-flex items-center gap-1 bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-md text-[10px] font-bold text-primary">
                            <Hash size={9} />{record.orden_trabajo}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs">
                        <span className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold ${
                          record.tipo_funcionario === 'SMO' ? 'bg-primary/10 text-primary border border-primary/20' :
                          record.tipo_funcionario === 'Proveedor' ? 'bg-purple-50 text-purple-700 border border-purple-100' :
                          record.tipo_funcionario === 'EPS' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                          'bg-slate-50 text-slate-600 border border-slate-200'
                        }`}>
                          {record.tipo_funcionario}{record.especificar_funcionario ? ` (${record.especificar_funcionario})` : ''}
                        </span>
                      </td>
                      <td className="px-6 py-4 max-w-xs text-xs text-slate-500 truncate" title={record.detalle_actividad_autorizacion}>
                        {record.detalle_actividad_autorizacion}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-xs">
                        {record.estado === 'ABIERTO' ? (
                          <span className="text-amber-600 font-bold text-[10px] px-2.5 py-1.5 bg-amber-50 border border-amber-100 rounded-lg">
                            En Curso
                          </span>
                        ) : record.pdf_url ? (
                          <a
                            href={record.pdf_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-primary hover:text-primary-hover font-bold bg-primary/10 border border-primary/20 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer text-[10px]"
                          >
                            Ver PDF <ExternalLink size={10} />
                          </a>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1 text-slate-400 font-bold text-[10px] px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                            title="Registro migrado desde sistema anterior — sin firma digital disponible"
                          >
                            <AlertCircle size={10} /> Sin PDF · Migrado
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/30">
              <p className="text-xs text-slate-500 font-semibold">
                Mostrando{' '}
                <span className="font-bold text-slate-700">{(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredRecords.length)}</span>
                {' '}de{' '}
                <span className="font-bold text-slate-700">{filteredRecords.length}</span> registros
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1 px-3 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  <ChevronLeft size={14} /> Anterior
                </button>
                <span className="px-3 py-2 text-xs font-bold text-slate-700 bg-primary/5 border border-primary/20 rounded-xl">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1 px-3 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  Siguiente <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
