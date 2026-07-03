'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { FileSpreadsheet, Users, Clock, Search, ExternalLink, Calendar, Hash, FileText } from 'lucide-react';
import Sidebar from '@/components/Sidebar';

interface PageProps {
  params: Promise<{ ccSlug: string }>;
}

export default function AdminDashboard({ params }: PageProps) {
  const { ccSlug } = use(params);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [ccName, setCcName] = useState('Sede');
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push(`/${ccSlug}/login`);
      return;
    }

    setCcName(localStorage.getItem('selectedCCName') || 'Sede');
    fetchRecords(token);
  }, [router, ccSlug]);

  const fetchRecords = async (token: string) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/ingresos`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setRecords(data);
      } else {
        router.push(`/${ccSlug}/login`);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDFReport = async () => {
    const token = localStorage.getItem('adminToken');
    try {
      const response = await fetch(`${API_URL}/api/admin/reporte-pdf`, {
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

  // Client-side search logic
  const filteredRecords = records.filter(record => {
    const searchLower = searchTerm.toLowerCase();
    return (
      record.visitante_nombre.toLowerCase().includes(searchLower) ||
      record.visitante_cedula.toLowerCase().includes(searchLower) ||
      record.operador_cctv.toLowerCase().includes(searchLower) ||
      (record.orden_trabajo && record.orden_trabajo.toLowerCase().includes(searchLower)) ||
      record.tipo_funcionario.toLowerCase().includes(searchLower) ||
      (record.detalle_actividad_autorizacion && record.detalle_actividad_autorizacion.toLowerCase().includes(searchLower))
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
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
      
      {/* Sidebar Navigation */}
      <Sidebar username="Administrador" />

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        
        {/* Header */}
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8 border-b border-slate-200/60 pb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Historial de Trabajos
            </h1>
            <p className="text-slate-500 text-sm mt-1">Gestión, control y auditoría de reportes registrados en {ccName}</p>
          </div>
          
          <button
            onClick={handleExportPDFReport}
            className="w-full lg:w-auto flex items-center justify-center gap-2.5 bg-red-600 hover:bg-red-700 text-white px-6 py-3.5 rounded-xl font-bold shadow-md shadow-red-600/10 transition-all duration-300 active:scale-[0.98] cursor-pointer text-sm"
          >
            <FileSpreadsheet size={16} />
            Exportar Reporte Consolidado
          </button>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="bg-white border border-slate-200/70 p-6 rounded-2xl shadow-sm hover:border-blue-500/30 transition-all group">
            <div className="text-blue-600 mb-4 bg-blue-50 border border-blue-100 w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
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
          
          {/* Table Utilities */}
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-slate-50/50">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <span>Listado de Actividades</span>
              <span className="bg-slate-200 text-slate-600 text-xs px-2.5 py-0.5 rounded-full font-bold">{filteredRecords.length}</span>
            </h3>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Buscar por visitante, cédula, OT..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-72 pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600/10 transition-all outline-none"
              />
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            {filteredRecords.length === 0 ? (
              <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-3">
                <Search size={28} className="text-slate-300" />
                <p className="text-xs font-bold">No se encontraron registros que coincidan con la búsqueda.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200/80">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Fecha / Hora</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Visitante</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Orden Trabajo</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Funcionario</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Actividad</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-slate-50/50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-600">
                        <div className="font-bold text-slate-800">{record.fecha ? new Date(record.fecha).toLocaleDateString('es-ES', { timeZone: 'UTC' }) : ''}</div>
                        <div className="text-[10px] font-medium text-slate-400 mt-0.5">{record.hora_ingreso} {record.hora_salida ? ` - ${record.hora_salida}` : ''}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-extrabold text-slate-800 text-xs">{record.visitante_nombre}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">CC: {record.visitante_cedula}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                        {record.orden_trabajo ? (
                          <span className="inline-flex items-center gap-1 bg-blue-50 border border-blue-100/60 px-2 py-0.5 rounded-md text-[10px] font-bold text-blue-600">
                            <Hash size={9} />
                            {record.orden_trabajo}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs">
                        <span className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold ${
                          record.tipo_funcionario === 'SMO' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
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
                        <a 
                          href={record.pdf_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-bold bg-blue-50 border border-blue-100/50 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer text-[10px]"
                        >
                          Ver PDF <ExternalLink size={10} />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
