import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Video, Plus, Search, Edit2, Trash2, AlertCircle, CheckCircle2, XCircle, ChevronLeft, ChevronRight, Filter, Image as ImageIcon, Upload, Eye, X } from 'lucide-react';
import Sidebar from '@/components/Sidebar';

const PAGE_SIZE = 10;

export default function CamarasPage() {
  const { ccSlug } = useParams<{ ccSlug: string }>();
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  const [camaras, setCamaras] = useState<any[]>([]);
  const [modelos, setModelos] = useState<any[]>([]);
  const [niveles, setNiveles] = useState<any[]>([]);
  const [propietarios, setPropietarios] = useState<any[]>([]);
  const [sectores, setSectores] = useState<any[]>([]);
  const [tipos, setTipos] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSector, setFilterSector] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [ccName, setCcName] = useState('Sede');
  const [adminUsername, setAdminUsername] = useState('Administrador');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedCamId, setSelectedCamId] = useState<number | null>(null);
  const [viewImageModal, setViewImageModal] = useState<{ url: string; nombre: string } | null>(null);

  const [formData, setFormData] = useState({
    codigo_camara: '',
    nombre: '',
    propietario_id: '',
    nivel_id: '',
    sector_id: '',
    tipo_id: '',
    modelo_id: '',
    estado: 1,
    ip: '',
    imagen: '',
    observaciones: '',
  });

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

    loadData();
  }, [ccSlug, navigate]);

  const loadData = async () => {
    setLoading(true);
    const token = localStorage.getItem('adminToken');
    try {
      const headers = { Authorization: `Bearer ${token}` };

      const [camRes, modRes, nivRes, propRes, secRes, tipRes] = await Promise.all([
        fetch(`${API_URL}/api/camaras`, { headers }),
        fetch(`${API_URL}/api/catalogos/modelos`, { headers }),
        fetch(`${API_URL}/api/catalogos/niveles`, { headers }),
        fetch(`${API_URL}/api/catalogos/propietarios`, { headers }),
        fetch(`${API_URL}/api/catalogos/sectores`, { headers }),
        fetch(`${API_URL}/api/catalogos/tipos`, { headers }),
      ]);

      if (camRes.ok) setCamaras(await camRes.json());
      if (modRes.ok) setModelos(await modRes.json());
      if (nivRes.ok) setNiveles(await nivRes.json());
      if (propRes.ok) setPropietarios(await propRes.json());
      if (secRes.ok) setSectores(await secRes.json());
      if (tipRes.ok) setTipos(await tipRes.json());
    } catch (err) {
      setError('Error de conexión al cargar inventario de cámaras');
    } finally {
      setLoading(false);
    }
  };

  const getCameraImageUrl = (img: string | null) => {
    if (!img) return null;
    if (img.startsWith('data:image/') || img.startsWith('http://') || img.startsWith('https://')) {
      return img;
    }
    return `${API_URL}/cameras/${img}`;
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setModalError('La imagen no debe superar los 10MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, imagen: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOpenCreateModal = () => {
    setModalMode('create');
    setSelectedCamId(null);
    setFormData({
      codigo_camara: '',
      nombre: '',
      propietario_id: propietarios[0]?.id || '',
      nivel_id: niveles[0]?.id || '',
      sector_id: sectores[0]?.id || '',
      tipo_id: tipos[0]?.id || '',
      modelo_id: modelos[0]?.id || '',
      estado: 1,
      ip: '',
      imagen: '',
      observaciones: '',
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (cam: any) => {
    setModalMode('edit');
    setSelectedCamId(cam.id);
    setFormData({
      codigo_camara: cam.codigo_camara || '',
      nombre: cam.nombre || '',
      propietario_id: cam.propietario_id || '',
      nivel_id: cam.nivel_id || '',
      sector_id: cam.sector_id || '',
      tipo_id: cam.tipo_id || '',
      modelo_id: cam.modelo_id || '',
      estado: cam.estado !== undefined ? Number(cam.estado) : 1,
      ip: cam.ip || '',
      imagen: cam.imagen || '',
      observaciones: cam.observaciones || '',
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (!formData.nombre.trim() || !formData.propietario_id || !formData.nivel_id || !formData.sector_id || !formData.tipo_id || !formData.modelo_id) {
      setModalError('Por favor complete todos los campos obligatorios (*).');
      return;
    }

    const token = localStorage.getItem('adminToken');
    const url = modalMode === 'create' ? `${API_URL}/api/camaras` : `${API_URL}/api/camaras/${selectedCamId}`;
    const method = modalMode === 'create' ? 'POST' : 'PUT';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!response.ok) {
        setModalError(data.message || 'Error al guardar la cámara');
        return;
      }

      setSuccess(modalMode === 'create' ? 'Cámara registrada exitosamente' : 'Cámara actualizada exitosamente');
      setIsModalOpen(false);
      loadData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setModalError('Error de red al procesar la solicitud');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Está seguro de que desea eliminar esta cámara?')) return;

    const token = localStorage.getItem('adminToken');
    try {
      const response = await fetch(`${API_URL}/api/camaras/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.message || 'Error al eliminar la cámara');
        return;
      }

      setSuccess('Cámara eliminada exitosamente');
      loadData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Error de conexión al eliminar la cámara');
    }
  };

  const filteredCamaras = camaras.filter((cam) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      cam.nombre?.toLowerCase().includes(term) ||
      cam.codigo_camara?.toLowerCase().includes(term) ||
      cam.ip?.toLowerCase().includes(term) ||
      cam.sector_nombre?.toLowerCase().includes(term);

    const matchesSector = filterSector ? String(cam.sector_id) === filterSector : true;
    const matchesEstado = filterEstado !== '' ? String(cam.estado) === filterEstado : true;

    return matchesSearch && matchesSector && matchesEstado;
  });

  const totalPages = Math.ceil(filteredCamaras.length / PAGE_SIZE) || 1;
  const paginatedCamaras = filteredCamaras.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      <Sidebar username={adminUsername} />

      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <div className="max-w-7xl w-full mx-auto p-4 md:p-8">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <Video className="w-7 h-7 text-[var(--primary-color,#3b82f6)]" />
                <h1 className="text-2xl font-bold text-slate-800">Inventario de Cámaras</h1>
              </div>
              <p className="text-slate-500 text-sm mt-1">
                Gestión, monitoreo y configuración de cámaras para {ccName}
              </p>
            </div>

            <button
              onClick={handleOpenCreateModal}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--primary-color,#3b82f6)] text-white text-sm font-semibold rounded-lg shadow-sm hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" />
              Nueva Cámara
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

          {/* Filters & Search */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por código, nombre, IP o sector..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary-color,#3b82f6)] focus:border-transparent"
              />
            </div>

            <div className="flex gap-3">
              <select
                value={filterSector}
                onChange={(e) => {
                  setFilterSector(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--primary-color,#3b82f6)]"
              >
                <option value="">Todos los sectores</option>
                {sectores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre}
                  </option>
                ))}
              </select>

              <select
                value={filterEstado}
                onChange={(e) => {
                  setFilterEstado(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--primary-color,#3b82f6)]"
              >
                <option value="">Todos los estados</option>
                <option value="1">Operativa</option>
                <option value="0">Inoperativa</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-slate-500 text-sm">Cargando inventario de cámaras...</div>
            ) : paginatedCamaras.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">No se encontraron cámaras registradas.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="px-4 py-3 text-center">Foto</th>
                      <th className="px-4 py-3">Código</th>
                      <th className="px-4 py-3">Nombre</th>
                      <th className="px-4 py-3">Sector / Nivel</th>
                      <th className="px-4 py-3">Tipo / Modelo</th>
                      <th className="px-4 py-3">Propietario</th>
                      <th className="px-4 py-3">IP</th>
                      <th className="px-4 py-3 text-center">Estado</th>
                      <th className="px-4 py-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                    {paginatedCamaras.map((cam) => {
                      const imgUrl = getCameraImageUrl(cam.imagen);
                      return (
                        <tr key={cam.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-3 text-center">
                            {imgUrl ? (
                              <button
                                onClick={() => setViewImageModal({ url: imgUrl, nombre: cam.nombre })}
                                className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 relative group cursor-pointer inline-block"
                                title="Ver imagen de cámara"
                              >
                                <img src={imgUrl} alt={cam.nombre} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                  <Eye className="w-4 h-4 text-white" />
                                </div>
                              </button>
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 mx-auto">
                                <ImageIcon className="w-5 h-5" />
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 font-mono font-medium text-slate-900">{cam.codigo_camara || 'N/A'}</td>
                          <td className="px-4 py-3 font-medium text-slate-800">{cam.nombre}</td>
                          <td className="px-4 py-3">
                            <div className="text-slate-900 font-medium">{cam.sector_nombre || '-'}</div>
                            <div className="text-xs text-slate-400">{cam.nivel_nombre || '-'}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-slate-800">{cam.tipo_nombre || '-'}</div>
                            <div className="text-xs text-slate-400">{cam.modelo_nombre || '-'}</div>
                          </td>
                          <td className="px-4 py-3 text-slate-600">{cam.propietario_nombre || '-'}</td>
                          <td className="px-4 py-3 font-mono text-xs text-slate-500">{cam.ip || '-'}</td>
                          <td className="px-4 py-3 text-center">
                            {Number(cam.estado) === 1 ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Operativa
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
                                <XCircle className="w-3.5 h-3.5" />
                                Falla / Inoperativa
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleOpenEditModal(cam)}
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Editar Cámara"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(cam.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Eliminar Cámara"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between text-sm text-slate-500">
                <span>
                  Página {currentPage} de {totalPages} ({filteredCamaras.length} cámaras)
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

      {/* View Image Modal */}
      {viewImageModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-2xl w-full rounded-2xl shadow-2xl overflow-hidden relative">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-blue-600" />
                Fotografía Cámara: {viewImageModal.nombre}
              </h3>
              <button
                onClick={() => setViewImageModal(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 flex items-center justify-center bg-slate-950 max-h-[70vh]">
              <img
                src={viewImageModal.url}
                alt={viewImageModal.nombre}
                className="max-h-[65vh] w-auto object-contain rounded-lg shadow-md"
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white max-w-lg w-full rounded-2xl shadow-xl border border-slate-100 p-6 my-8">
            <h2 className="text-xl font-bold text-slate-800 mb-4">
              {modalMode === 'create' ? 'Registrar Nueva Cámara' : 'Editar Cámara'}
            </h2>

            {modalError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {modalError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Image Upload */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Fotografía de Referencia</label>
                <div className="flex items-center gap-4">
                  {formData.imagen ? (
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
                      <img
                        src={getCameraImageUrl(formData.imagen) || formData.imagen}
                        alt="Vista previa"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, imagen: '' })}
                        className="absolute top-1 right-1 bg-rose-600 text-white rounded-full p-0.5 shadow hover:bg-rose-700"
                        title="Quitar imagen"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 bg-slate-50 shrink-0">
                      <ImageIcon className="w-6 h-6 mb-1 text-slate-300" />
                      <span className="text-[10px]">Sin foto</span>
                    </div>
                  )}
                  <div className="flex-1">
                    <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-200 transition-colors">
                      <Upload className="w-3.5 h-3.5 text-slate-500" />
                      {formData.imagen ? 'Cambiar Imagen' : 'Subir Imagen'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                    <p className="text-[11px] text-slate-400 mt-1">JPG, PNG o WEBP (Máx. 10MB)</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Código Cámara</label>
                  <input
                    type="text"
                    value={formData.codigo_camara}
                    onChange={(e) => setFormData({ ...formData, codigo_camara: e.target.value })}
                    placeholder="Ej: CAM-SCL-001"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Nombre Cámara *</label>
                  <input
                    type="text"
                    required
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Ej: Cámara Zona 001"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Sector *</label>
                  <select
                    required
                    value={formData.sector_id}
                    onChange={(e) => setFormData({ ...formData, sector_id: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="">Seleccione Sector</option>
                    {sectores.map((s) => (
                      <option key={s.id} value={s.id}>{s.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Nivel *</label>
                  <select
                    required
                    value={formData.nivel_id}
                    onChange={(e) => setFormData({ ...formData, nivel_id: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="">Seleccione Nivel</option>
                    {niveles.map((n) => (
                      <option key={n.id} value={n.id}>{n.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Tipo *</label>
                  <select
                    required
                    value={formData.tipo_id}
                    onChange={(e) => setFormData({ ...formData, tipo_id: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="">Seleccione Tipo</option>
                    {tipos.map((t) => (
                      <option key={t.id} value={t.id}>{t.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Modelo *</label>
                  <select
                    required
                    value={formData.modelo_id}
                    onChange={(e) => setFormData({ ...formData, modelo_id: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="">Seleccione Modelo</option>
                    {modelos.map((m) => (
                      <option key={m.id} value={m.id}>{m.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Propietario / Monitor *</label>
                  <select
                    required
                    value={formData.propietario_id}
                    onChange={(e) => setFormData({ ...formData, propietario_id: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="">Seleccione Propietario</option>
                    {propietarios.map((p) => (
                      <option key={p.id} value={p.id}>{p.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Dirección IP</label>
                  <input
                    type="text"
                    value={formData.ip}
                    onChange={(e) => setFormData({ ...formData, ip: e.target.value })}
                    placeholder="192.168.1.100"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Estado Operativo</label>
                <select
                  value={formData.estado}
                  onChange={(e) => setFormData({ ...formData, estado: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value={1}>Operativa (Normal)</option>
                  <option value={0}>Inoperativa (Con Falla)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Observaciones</label>
                <textarea
                  rows={2}
                  value={formData.observaciones}
                  onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                  placeholder="Detalles sobre estado o configuración..."
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
                  {modalMode === 'create' ? 'Crear Cámara' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
