import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FolderTree, Plus, Edit2, Trash2, CheckCircle2, AlertCircle, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import Sidebar from '@/components/Sidebar';

const CATALOGOS_CONFIG = [
  { key: 'sectores', label: 'Sectores' },
  { key: 'niveles', label: 'Niveles' },
  { key: 'tipos', label: 'Tipos de Cámara' },
  { key: 'modelos', label: 'Modelos' },
  { key: 'propietarios', label: 'Propietarios / Monitores' },
];

export default function CatalogosPage() {
  const { ccSlug } = useParams<{ ccSlug: string }>();
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  const [activeTab, setActiveTab] = useState('sectores');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Paginación
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [ccName, setCcName] = useState('Sede');
  const [adminUsername, setAdminUsername] = useState('Administrador');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [nombre, setNombre] = useState('');

  // Notifications
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

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
    const rol = localStorage.getItem('adminRol');

    if (!token) {
      navigate(`/${ccSlug}/login`);
      return;
    }
    if (rol !== 'ADMIN' && rol !== 'SUPERVISOR') {
      navigate(`/${ccSlug}`);
      return;
    }

    loadCatalogData();
  }, [ccSlug, activeTab, navigate]);

  const loadCatalogData = async () => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem('adminToken');

    try {
      const response = await fetch(`${API_URL}/api/catalogos/${activeTab}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        setError(`Error al obtener catálogo de ${activeTab}`);
        return;
      }

      setItems(await response.json());
    } catch (err) {
      setError('Error de conexión al cargar catálogo');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setModalMode('create');
    setSelectedId(null);
    setNombre('');
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: any) => {
    setModalMode('edit');
    setSelectedId(item.id);
    setNombre(item.nombre || '');
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setModalError('El nombre es obligatorio');
      return;
    }

    const token = localStorage.getItem('adminToken');
    const url = modalMode === 'create' ? `${API_URL}/api/catalogos/${activeTab}` : `${API_URL}/api/catalogos/${activeTab}/${selectedId}`;
    const method = modalMode === 'create' ? 'POST' : 'PUT';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ nombre, activo: 1 }),
      });

      const data = await response.json();
      if (!response.ok) {
        setModalError(data.message || 'Error al guardar elemento');
        return;
      }

      setSuccess(modalMode === 'create' ? 'Ítem agregado exitosamente' : 'Ítem actualizado exitosamente');
      setIsModalOpen(false);
      loadCatalogData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setModalError('Error de conexión al guardar ítem');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Está seguro de desactivar este ítem del catálogo?')) return;

    const token = localStorage.getItem('adminToken');
    try {
      const response = await fetch(`${API_URL}/api/catalogos/${activeTab}/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.message || 'Error al desactivar ítem');
        return;
      }

      setSuccess('Ítem desactivado exitosamente');
      loadCatalogData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Error de conexión al desactivar ítem');
    }
  };

  const filteredItems = items.filter((item) =>
    item.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredItems.length / rowsPerPage);
  const paginatedItems = filteredItems.slice(page * rowsPerPage, (page + 1) * rowsPerPage);
  const startCount = filteredItems.length > 0 ? page * rowsPerPage + 1 : 0;
  const endCount = Math.min((page + 1) * rowsPerPage, filteredItems.length);

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      <Sidebar username={adminUsername} />

      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <div className="max-w-7xl w-full mx-auto p-4 md:p-8">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <FolderTree className="w-7 h-7 text-[var(--primary-color,#3b82f6)]" />
                <h1 className="text-2xl font-bold text-slate-800">Catálogos del Sistema</h1>
              </div>
              <p className="text-slate-500 text-sm mt-1">
                Administración de sectores, niveles, tipos, modelos y propietarios en {ccName}
              </p>
            </div>

            <button
              onClick={handleOpenCreateModal}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--primary-color,#3b82f6)] text-white text-sm font-semibold rounded-lg shadow-sm hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" />
              Nuevo Elemento
            </button>
          </div>

          {/* Notifications */}
          {success && (
            <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              {success}
            </div>
          )}

          {error && (
            <div className="mb-4 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              {error}
            </div>
          )}

          {/* Tabs */}
          <div className="flex border-b border-slate-200 mb-6 overflow-x-auto">
            {CATALOGOS_CONFIG.map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key);
                  setSearchTerm('');
                  setPage(0);
                }}
                className={`px-4 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
                  activeTab === tab.key
                    ? 'border-[var(--primary-color,#3b82f6)] text-[var(--primary-color,#3b82f6)]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={`Buscar en ${CATALOGOS_CONFIG.find((t) => t.key === activeTab)?.label}...`}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(0);
                }}
                className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary-color,#3b82f6)]"
              />
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6">
            {loading ? (
              <div className="p-8 text-center text-slate-500 text-sm">Cargando datos del catálogo...</div>
            ) : filteredItems.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">No hay registros en este catálogo.</div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="px-6 py-3">ID</th>
                    <th className="px-6 py-3">Nombre</th>
                    <th className="px-6 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {paginatedItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-slate-400">#{item.id}</td>
                      <td className="px-6 py-4 font-medium text-slate-800">{item.nombre}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEditModal(item)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Desactivar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Barra de Paginación */}
          {filteredItems.length > 0 && (
            <div className="bg-white px-6 py-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500 font-medium">Registros por página:</span>
                <select
                  value={rowsPerPage}
                  onChange={(e) => {
                    setRowsPerPage(Number(e.target.value));
                    setPage(0);
                  }}
                  className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-xs text-slate-500 font-medium">
                  {startCount}-{endCount} de {filteredItems.length}
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

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-2xl shadow-xl border border-slate-100 p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-4">
              {modalMode === 'create' ? 'Agregar Elemento a Catálogo' : 'Editar Elemento'}
            </h2>

            {modalError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {modalError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nombre *</label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Nombre del elemento..."
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold bg-[var(--primary-color,#3b82f6)] text-white rounded-lg hover:opacity-90 transition-opacity"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
