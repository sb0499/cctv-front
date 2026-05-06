'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileSpreadsheet, LogOut, Users, Clock, FileDown, Search, ExternalLink } from 'lucide-react';

export default function AdminDashboard() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/login');
      return;
    }

    fetchRecords(token);
  }, [router]);

  const fetchRecords = async (token: string) => {
    try {
      const response = await fetch('http://localhost:3001/api/admin/ingresos', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setRecords(data);
      } else {
        router.push('/login');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    router.push('/login');
  };


  const handleExportPDFReport = async () => {
    const token = localStorage.getItem('adminToken');
    try {
      const response = await fetch('http://localhost:3001/api/admin/reporte-pdf', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Reporte_Consolidado_CCTV_${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
    } catch (error) {
      console.error('PDF Report error', error);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50">Cargando dashboard...</div>;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 text-white flex flex-col p-6">
        <div className="flex items-center gap-3 mb-10">
          <div className="bg-blue-600 p-2 rounded-lg">
            <FileSpreadsheet size={24} />
          </div>
          <span className="text-xl font-bold">Admin Panel</span>
        </div>
        
        <nav className="flex-1 space-y-2">
          <button className="w-full flex items-center gap-3 px-4 py-3 bg-blue-600 rounded-xl font-medium transition-all">
            <Users size={20} />
            Ingresos
          </button>
        </nav>

        <button 
          onClick={handleLogout}
          className="mt-auto flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
        >
          <LogOut size={20} />
          Cerrar Sesión
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Registros de Monitoreo</h1>
            <p className="text-slate-500">Gestión y control de accesos CCTV</p>
          </div>
          
          <div className="flex gap-4">
            <button
              onClick={handleExportPDFReport}
              className="flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-100"
            >
              <FileSpreadsheet size={20} />
              Reporte PDF (con firmas)
            </button>
          </div>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="text-blue-600 mb-2 bg-blue-50 w-10 h-10 rounded-lg flex items-center justify-center">
              <Users size={20} />
            </div>
            <div className="text-2xl font-bold text-slate-800">{records.length}</div>
            <div className="text-sm text-slate-500 font-medium uppercase tracking-wider">Total Ingresos</div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="text-amber-600 mb-2 bg-amber-50 w-10 h-10 rounded-lg flex items-center justify-center">
              <Clock size={20} />
            </div>
            <div className="text-2xl font-bold text-slate-800">
              {records.filter(r => r.fecha === new Date().toISOString().split('T')[0]).length}
            </div>
            <div className="text-sm text-slate-500 font-medium uppercase tracking-wider">Hoy</div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-bold text-slate-800">Listado de Actividad</h3>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Buscar..." 
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Visitante</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Fecha / Hora</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Funcionario</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">PDF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50 transition-all">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">{record.visitante_nombre}</div>
                      <div className="text-xs text-slate-500">CC: {record.visitante_cedula}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      <div>{new Date(record.fecha).toLocaleDateString()}</div>
                      <div className="text-xs font-medium text-slate-400">{record.hora_ingreso}</div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                        record.tipo_funcionario === 'SMO' ? 'bg-blue-100 text-blue-700' :
                        record.tipo_funcionario === 'Proveedor' ? 'bg-purple-100 text-purple-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {record.tipo_funcionario}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <a 
                        href={record.pdf_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm font-bold"
                      >
                        Ver <ExternalLink size={14} />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
