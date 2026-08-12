import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Landmark, Plus, Search, Edit2, Trash2, Palette, Image, AlertCircle, CheckCircle2, Link } from 'lucide-react';
import Sidebar from '@/components/Sidebar';

export default function CentrosComercialesPage() {
  const { ccSlug } = useParams<{ ccSlug: string }>();
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  const [malls, setMalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [ccName, setCcName] = useState('Sede');
  const [adminUsername, setAdminUsername] = useState('Administrador');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedMallId, setSelectedMallId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    slug: '',
    color: '#3b82f6',
    logoBase64: '', // Base64 image
  });

  // Image Upload Preview State
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Notifications
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

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
    const rol = localStorage.getItem('adminRol');

    if (!token) {
      navigate(`/${ccSlug}/login`);
      return;
    }

    if (rol !== 'ADMIN') {
      navigate(`/${ccSlug}`);
      return;
    }

    const loadData = async () => {
      try {
        const ccResponse = await fetch(`${API_URL}/api/centros-comerciales/${ccSlug}`);
        if (!ccResponse.ok) {
          navigate('/');
          return;
        }
        const ccData = await ccResponse.json();
        setCcName(ccData.nombre);

        await fetchMalls();
      } catch (e) {
        console.error(e);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [ccSlug]);

  const fetchMalls = async () => {
    try {
      const response = await fetch(`${API_URL}/api/centros-comerciales`);
      if (response.ok) {
        const data = await response.json();
        setMalls(data);
      }
    } catch (err) {
      console.error('Error fetching malls:', err);
    }
  };

  const showNotification = (message: string, isSuccess = true) => {
    if (isSuccess) {
      setSuccess(message);
      setTimeout(() => setSuccess(null), 4000);
    } else {
      setError(message);
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleOpenModal = (mode: 'create' | 'edit', mall?: any) => {
    setModalMode(mode);
    setModalError(null);
    setImagePreview(null);
    if (mode === 'edit' && mall) {
      setSelectedMallId(mall.id);
      setFormData({
        nombre: mall.nombre,
        slug: mall.slug,
        color: mall.color || '#3b82f6',
        logoBase64: '', // leave empty unless uploading a new one
      });
      if (mall.logo) {
        setImagePreview(`${API_URL}/logos/${mall.logo}`);
      }
    } else {
      setSelectedMallId(null);
      setFormData({
        nombre: '',
        slug: '',
        color: '#3b82f6',
        logoBase64: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalError(null);
    setImagePreview(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      // Auto-generate slug from nombre if creating or if slug was empty
      if (name === 'nombre' && modalMode === 'create') {
        updated.slug = value
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-');
      }
      return updated;
    });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setModalError('Por favor seleccione únicamente archivos de imagen.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setFormData(prev => ({ ...prev, logoBase64: base64 }));
      setImagePreview(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (!formData.nombre.trim() || !formData.slug.trim()) {
      setModalError('El nombre y el slug son campos obligatorios.');
      return;
    }

    if (formData.slug.includes(' ')) {
      setModalError('El slug no puede contener espacios en blanco.');
      return;
    }

    const token = localStorage.getItem('adminToken');
    const url = modalMode === 'create' 
      ? `${API_URL}/api/admin/centros-comerciales` 
      : `${API_URL}/api/admin/centros-comerciales/${selectedMallId}`;
    
    const method = modalMode === 'create' ? 'POST' : 'PUT';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (response.ok) {
        showNotification(modalMode === 'create' ? 'Sede creada con éxito' : 'Sede actualizada con éxito');
        handleCloseModal();
        fetchMalls();
        // If editing the active CC, reload styles
        if (modalMode === 'edit' && formData.slug === ccSlug) {
          localStorage.setItem('selectedCCColor', formData.color);
          localStorage.setItem('selectedCCName', formData.nombre);
          if (imagePreview) localStorage.setItem('selectedCCLogo', imagePreview);
          document.documentElement.style.setProperty('--primary-color', formData.color);
        }
      } else {
        setModalError(result.message || 'Error al procesar la sede.');
      }
    } catch (err) {
      setModalError('Error de conexión con el servidor.');
    }
  };

  const handleDeleteMall = async (id: number, mallName: string) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar la sede "${mallName}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    const token = localStorage.getItem('adminToken');
    try {
      const response = await fetch(`${API_URL}/api/admin/centros-comerciales/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (response.ok) {
        showNotification('Sede eliminada exitosamente.');
        fetchMalls();
      } else {
        showNotification(result.message || 'Error al eliminar la sede.', false);
      }
    } catch (err) {
      showNotification('Error de conexión al eliminar la sede.', false);
    }
  };

  const filteredMalls = malls.filter(mall => {
    const term = searchTerm.toLowerCase();
    return (
      mall.nombre.toLowerCase().includes(term) ||
      mall.slug.toLowerCase().includes(term)
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          <p className="text-sm font-semibold tracking-wide">Cargando sedes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col md:flex-row font-sans">
      <Sidebar username={adminUsername} />

      <main className="flex-1 p-4 sm:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        {/* Notification banners */}
        {success && (
          <div className="mb-6 bg-emerald-50 text-emerald-700 p-4 rounded-xl flex items-center gap-3 border border-emerald-100 animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 size={18} className="shrink-0 text-emerald-500" />
            <p className="text-sm font-semibold">{success}</p>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3 border border-red-100 animate-in fade-in slide-in-from-top-2">
            <AlertCircle size={18} className="shrink-0 text-red-500" />
            <p className="text-sm font-semibold">{error}</p>
          </div>
        )}

        {/* Header */}
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8 border-b border-slate-200/60 pb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Gestión de Sedes
            </h1>
            <p className="text-slate-500 text-sm mt-1">Administra los centros comerciales (sedes), sus logotipos, URLs amigables y paletas de colores.</p>
          </div>
          
          <button
            onClick={() => handleOpenModal('create')}
            className="w-full lg:w-auto flex items-center justify-center gap-2.5 bg-primary hover:bg-primary-hover text-white px-6 py-3.5 rounded-xl font-bold shadow-md shadow-primary/10 transition-all duration-300 active:scale-[0.98] cursor-pointer text-sm"
          >
            <Plus size={16} />
            Nueva Sede
          </button>
        </header>

        {/* Search controls */}
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <span>Sedes Registradas</span>
            <span className="bg-slate-200 text-slate-600 text-xs px-2.5 py-0.5 rounded-full font-bold">{filteredMalls.length}</span>
          </h3>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Buscar sede por nombre o slug..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-72 pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:border-primary focus:ring-1 focus:ring-primary/10 transition-all outline-none"
            />
          </div>
        </div>

        {/* Mall Grid */}
        {filteredMalls.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMalls.map((mall) => {
              const mallLogo = mall.logo ? `${API_URL}/logos/${mall.logo}` : `${API_URL}/logos/${mall.slug}.jpg`;
              return (
                <div key={mall.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-300 flex flex-col group">
                  {/* Decorative Brand Color Line */}
                  <div className="h-2 w-full" style={{ backgroundColor: mall.color || '#3b82f6' }}></div>
                  
                  <div className="p-6 flex-1 flex flex-col">
                    {/* Header Info */}
                    <div className="flex gap-4 items-start mb-6">
                      <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                        {mall.logo ? (
                          <img src={mallLogo} alt={mall.nombre} className="w-full h-full object-cover" />
                        ) : (
                          <Landmark size={24} className="text-slate-400" />
                        )}
                      </div>
                      <div className="overflow-hidden">
                        <h4 className="font-extrabold text-slate-900 leading-tight truncate" title={mall.nombre}>{mall.nombre}</h4>
                        <div className="inline-flex items-center gap-1 text-[10px] text-slate-400 font-mono mt-1">
                          <Link size={10} />
                          <span>/{mall.slug}</span>
                        </div>
                      </div>
                    </div>

                    {/* Sede Configuration Previews */}
                    <div className="space-y-3 mt-auto border-t border-slate-100 pt-4 flex flex-col justify-end">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                          <Palette size={12} /> Color Personalizado
                        </span>
                        <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-slate-600">
                          <span className="w-3.5 h-3.5 rounded-full border border-slate-200 inline-block" style={{ backgroundColor: mall.color }}></span>
                          {mall.color}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="bg-slate-50/50 border-t border-slate-100 px-6 py-3.5 flex justify-end gap-2">
                    <button
                      onClick={() => handleOpenModal('edit', mall)}
                      className="p-2 text-slate-500 hover:text-primary hover:bg-primary/5 border border-transparent hover:border-primary/10 rounded-xl transition-all text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Edit2 size={12} />
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeleteMall(mall.id, mall.nombre)}
                      className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-xl transition-all text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 size={12} />
                      Eliminar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white border border-slate-200/70 rounded-2xl p-16 text-center text-slate-400 font-semibold shadow-sm">
            Ninguna sede coincide con la búsqueda
          </div>
        )}
      </main>

      {/* Modal - Create/Edit Mall */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-100 max-w-md w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="bg-slate-50/50 p-6 border-b border-slate-100">
              <h2 className="text-lg font-black text-slate-900">
                {modalMode === 'create' ? 'Crear Nueva Sede' : 'Editar Sede'}
              </h2>
              <p className="text-xs text-slate-500 mt-1">Configura la información visual e identificadores del centro comercial.</p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {modalError && (
                <div className="bg-red-50 text-red-600 p-3.5 rounded-xl flex items-center gap-3.5 border border-red-100 text-xs font-semibold">
                  <AlertCircle size={16} className="shrink-0 text-red-500" />
                  <p>{modalError}</p>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nombre de la Sede</label>
                <input
                  type="text"
                  name="nombre"
                  required
                  value={formData.nombre}
                  onChange={handleInputChange}
                  placeholder="Ej: Condado Shopping"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-primary outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Slug URL (Identificador)</label>
                <input
                  type="text"
                  name="slug"
                  required
                  value={formData.slug}
                  onChange={handleInputChange}
                  placeholder="Ej: condado (minúsculas y sin espacios)"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-primary outline-none transition-all font-mono"
                />
              </div>

              <div className="grid grid-cols-3 gap-4 items-center">
                <div className="col-span-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Color Temático</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      name="color"
                      value={formData.color}
                      onChange={handleInputChange}
                      className="w-10 h-10 border border-slate-200 rounded-xl overflow-hidden cursor-pointer"
                    />
                    <span className="text-[10px] font-bold font-mono text-slate-500">{formData.color}</span>
                  </div>
                </div>

                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Logotipo de la Sede</label>
                  <div className="relative">
                    <input
                      type="file"
                      id="logo-upload"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <label
                      htmlFor="logo-upload"
                      className="flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-50 border border-slate-200 border-dashed rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer"
                    >
                      <Image size={14} />
                      Subir Imagen
                    </label>
                  </div>
                </div>
              </div>

              {/* Logo Preview box */}
              {imagePreview && (
                <div className="mt-4 p-4 border border-slate-100 bg-slate-50/50 rounded-2xl flex items-center justify-center">
                  <div className="text-center">
                    <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">Previsualización del Logo</span>
                    <div className="w-20 h-20 mx-auto bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm flex items-center justify-center">
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-md shadow-primary/10 transition-colors cursor-pointer"
                >
                  {modalMode === 'create' ? 'Crear Sede' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
