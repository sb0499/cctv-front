import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ClipboardList, Search, CheckCircle2, AlertCircle, Calendar, User, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import Sidebar from '@/components/Sidebar';

const PAGE_SIZE = 10;

export default function ReportesInspeccionPage() {
  const { ccSlug } = useParams<{ ccSlug: string }>();
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  const [reportes, setReportes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [ccName, setCcName] = useState('Sede');
  const [adminUsername, setAdminUsername] = useState('Administrador');

  const [error, setError] = useState<string | null>(null);

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

    loadReportes();
  }, [ccSlug, navigate]);

  const loadReportes = async () => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem('adminToken');

    try {
      const response = await fetch(`${API_URL}/api/reportes-inspeccion`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        setError('Error al obtener lista de reportes de inspección');
        return;
      }

      setReportes(await response.json());
    } catch (err) {
      setError('Error de conexión al cargar reportes');
    } finally {
      setLoading(false);
    }
  };

  const filteredReportes = reportes.filter((r) => {
    const term = searchTerm.toLowerCase();
    return (
      r.responsable_nombre?.toLowerCase().includes(term) ||
      r.responsable_usuario?.toLowerCase().includes(term) ||
      r.pdf_path?.toLowerCase().includes(term)
    );
  });

  const totalPages = Math.ceil(filteredReportes.length / PAGE_SIZE);
  const paginatedReportes = filteredReportes.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      <Sidebar username={adminUsername} />

      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <div className="max-w-7xl w-full mx-auto p-4 md:p-8">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <ClipboardList className="w-7 h-7 text-[var(--primary-color,#3b82f6)]" />
                <h1 className="text-2xl font-bold text-slate-800">Historial de Reportes de Inspección</h1>
              </div>
              <p className="text-slate-500 text-sm mt-1">
                Auditoría y registros consolidados de chequeos diarios de cámaras en {ccName}
              </p>
            </div>
          </div>

          {/* Notifications */}
          {error && (
            <div className="mb-4 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              {error}
            </div>
          )}

          {/* Search bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por responsable de la inspección..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary-color,#3b82f6)]"
              />
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-slate-500 text-sm">Cargando reportes de inspección...</div>
            ) : paginatedReportes.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">No se encontraron reportes de inspección.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="px-6 py-3">ID Reporte</th>
                      <th className="px-6 py-3">Fecha y Hora</th>
                      <th className="px-6 py-3">Responsable</th>
                      <th className="px-6 py-3 text-center">Total Cámaras</th>
                      <th className="px-6 py-3 text-center">Operativas</th>
                      <th className="px-6 py-3 text-center">Inoperativas</th>
                      <th className="px-6 py-3 text-right">Exportar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                    {paginatedReportes.map((rep) => (
                      <tr key={rep.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4 font-mono font-medium text-slate-900">#{rep.id}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-slate-700">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            {new Date(rep.created_at || rep.fecha).toLocaleString('es-EC')}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-slate-800 font-medium">
                            <User className="w-4 h-4 text-slate-400" />
                            {rep.responsable_nombre || rep.responsable_usuario || 'Operador'}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-slate-800">
                          {rep.total_camaras}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {rep.operativas}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                            {rep.no_operativas}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={async () => {
                                const token = localStorage.getItem('adminToken');
                                const res = await fetch(`${API_URL}/api/reportes-inspeccion/${rep.id}/pdf`, {
                                  headers: { Authorization: `Bearer ${token}` }
                                });
                                if (res.ok) {
                                  const blob = await res.blob();
                                  const url = window.URL.createObjectURL(blob);
                                  window.open(url, '_blank');
                                }
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-lg text-xs font-semibold transition-colors"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              PDF
                            </button>
                            <button
                              onClick={async () => {
                                const token = localStorage.getItem('adminToken');
                                const res = await fetch(`${API_URL}/api/reportes-inspeccion/${rep.id}/excel`, {
                                  headers: { Authorization: `Bearer ${token}` }
                                });
                                if (res.ok) {
                                  const blob = await res.blob();
                                  const url = window.URL.createObjectURL(blob);
                                  const a = document.createElement('a');
                                  a.href = url;
                                  a.download = `inspeccion_camaras_${rep.id}.xlsx`;
                                  a.click();
                                }
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-semibold transition-colors"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              Excel
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between text-sm text-slate-500">
                <span>
                  Página {currentPage} de {totalPages} ({filteredReportes.length} reportes)
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    className="p-1 border border-slate-200 rounded hover:bg-slate-100 disabled:opacity-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    className="p-1 border border-slate-200 rounded hover:bg-slate-100 disabled:opacity-50"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
