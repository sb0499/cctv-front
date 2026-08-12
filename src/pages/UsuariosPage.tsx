import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserPlus, Search, Edit2, Trash2, Key, AlertCircle, CheckCircle2, Shield, Landmark } from 'lucide-react';
import Sidebar from '@/components/Sidebar';

export default function UsuariosPage() {
  const { ccSlug } = useParams<{ ccSlug: string }>();
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  
  const [users, setUsers] = useState<any[]>([]);
  const [malls, setMalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [ccName, setCcName] = useState('Sede');
  const [adminUsername, setAdminUsername] = useState('Administrador');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    nombre_completo: '',
    centro_comercial_id: '',
    rol: 'OPERADOR',
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
        // Validate CC slug and fetch CC details
        const ccResponse = await fetch(`${API_URL}/api/centros-comerciales/${ccSlug}`);
        if (!ccResponse.ok) {
          navigate('/');
          return;
        }
        const ccData = await ccResponse.json();
        setCcName(ccData.nombre);

        // Fetch users & malls
        await Promise.all([
          fetchUsers(token),
          fetchMalls()
        ]);
      } catch (e) {
        console.error(e);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [ccSlug]);

  const fetchUsers = async (token: string) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/usuarios`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else if (response.status === 403) {
        navigate(`/${ccSlug}`);
      } else {
        navigate(`/${ccSlug}/login`);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

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

  const handleOpenModal = (mode: 'create' | 'edit', user?: any) => {
    setModalMode(mode);
    setModalError(null);
    const activeCCId = localStorage.getItem('selectedCCId') || '';
    if (mode === 'edit' && user) {
      setSelectedUserId(user.id);
      setFormData({
        username: user.username,
        password: '', // Leave blank when editing unless changing
        nombre_completo: user.nombre_completo,
        centro_comercial_id: user.centro_comercial_id.toString(),
        rol: user.rol,
      });
    } else {
      setSelectedUserId(null);
      setFormData({
        username: '',
        password: '',
        nombre_completo: '',
        centro_comercial_id: activeCCId,
        rol: 'OPERADOR',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalError(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    // Form validations
    if (!formData.username.trim() || !formData.nombre_completo.trim() || !formData.centro_comercial_id || !formData.rol) {
      setModalError('Todos los campos son obligatorios.');
      return;
    }

    if (modalMode === 'create' && !formData.password) {
      setModalError('La contraseña es obligatoria para nuevos usuarios.');
      return;
    }

    if (formData.username.includes(' ')) {
      setModalError('El nombre de usuario no puede contener espacios.');
      return;
    }

    const token = localStorage.getItem('adminToken');
    const url = modalMode === 'create' 
      ? `${API_URL}/api/admin/usuarios` 
      : `${API_URL}/api/admin/usuarios/${selectedUserId}`;
    
    const method = modalMode === 'create' ? 'POST' : 'PUT';
    
    const activeCCId = localStorage.getItem('selectedCCId') || '';
    const payload = {
      ...formData,
      centro_comercial_id: activeCCId
    };

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.ok) {
        showNotification(modalMode === 'create' ? 'Usuario creado con éxito' : 'Usuario actualizado con éxito');
        handleCloseModal();
        if (token) fetchUsers(token);
      } else {
        setModalError(result.message || 'Ocurrió un error al procesar el usuario.');
      }
    } catch (err) {
      setModalError('Error de conexión con el servidor.');
    }
  };

  const handleDeleteUser = async (id: number, usernameToDelete: string) => {
    const activeUsername = localStorage.getItem('adminUsername');
    if (usernameToDelete === activeUsername) {
      showNotification('No puedes eliminar tu propio usuario activo.', false);
      return;
    }

    if (!window.confirm(`¿Estás seguro de que deseas eliminar el usuario "${usernameToDelete}"?`)) {
      return;
    }

    const token = localStorage.getItem('adminToken');
    try {
      const response = await fetch(`${API_URL}/api/admin/usuarios/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (response.ok) {
        showNotification('Usuario eliminado exitosamente.');
        if (token) fetchUsers(token);
      } else {
        showNotification(result.message || 'Error al eliminar el usuario.', false);
      }
    } catch (err) {
      showNotification('Error de conexión al eliminar usuario.', false);
    }
  };

  const filteredUsers = users.filter(user => {
    const term = searchTerm.toLowerCase();
    return (
      user.username.toLowerCase().includes(term) ||
      user.nombre_completo.toLowerCase().includes(term) ||
      (user.centro_comercial_nombre && user.centro_comercial_nombre.toLowerCase().includes(term)) ||
      user.rol.toLowerCase().includes(term)
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          <p className="text-sm font-semibold tracking-wide">Cargando usuarios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col md:flex-row font-sans">
      <Sidebar username={adminUsername} />

      <main className="flex-1 p-4 sm:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        {/* Alerts Banner */}
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
              Gestión de Usuarios
            </h1>
            <p className="text-slate-500 text-sm mt-1">Crea, edita y administra los accesos y roles del personal asignado a cada sede.</p>
          </div>
          
          <button
            onClick={() => handleOpenModal('create')}
            className="w-full lg:w-auto flex items-center justify-center gap-2.5 bg-primary hover:bg-primary-hover text-white px-6 py-3.5 rounded-xl font-bold shadow-md shadow-primary/10 transition-all duration-300 active:scale-[0.98] cursor-pointer text-sm"
          >
            <UserPlus size={16} />
            Nuevo Usuario
          </button>
        </header>

        {/* Content Table */}
        <div className="bg-white border border-slate-200/70 rounded-2xl shadow-sm overflow-hidden">
          {/* Search bar */}
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-slate-50/50">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <span>Listado de Cuentas</span>
              <span className="bg-slate-200 text-slate-600 text-xs px-2.5 py-0.5 rounded-full font-bold">{filteredUsers.length}</span>
            </h3>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Buscar por nombre, usuario, sede..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-72 pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary/10 transition-all outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">Nombre Completo</th>
                  <th className="px-6 py-4">Usuario</th>
                  <th className="px-6 py-4">Sede Asignada</th>
                  <th className="px-6 py-4">Rol</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50/30 transition-colors group">
                      <td className="px-6 py-4 font-bold text-slate-900">
                        {user.nombre_completo}
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-600">
                        {user.username}
                      </td>
                      <td className="px-6 py-4">
                        <div className="inline-flex items-center gap-1.5 text-slate-500">
                          <Landmark size={14} className="text-slate-400" />
                          <span className="font-semibold text-xs">{user.centro_comercial_nombre || 'No asignada'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                          user.rol === 'ADMIN' 
                            ? 'bg-purple-50 text-purple-700 border border-purple-100' 
                            : user.rol === 'SUPERVISOR'
                            ? 'bg-blue-50 text-blue-700 border border-blue-100'
                            : 'bg-slate-50 text-slate-600 border border-slate-100'
                        }`}>
                          <Shield size={10} />
                          {user.rol}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenModal('edit', user)}
                            className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all cursor-pointer"
                            title="Editar usuario"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id, user.username)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                            title="Eliminar usuario"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-semibold">
                      Ningún usuario coincide con la búsqueda
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Modal - Create/Edit User */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-100 max-w-md w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="bg-slate-50/50 p-6 border-b border-slate-100">
              <h2 className="text-lg font-black text-slate-900">
                {modalMode === 'create' ? 'Crear Nuevo Usuario' : 'Editar Usuario'}
              </h2>
              <p className="text-xs text-slate-500 mt-1">Completa la información para configurar la cuenta de acceso.</p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {modalError && (
                <div className="bg-red-50 text-red-600 p-3.5 rounded-xl flex items-center gap-3.5 border border-red-100 text-xs font-semibold">
                  <AlertCircle size={16} className="shrink-0 text-red-500" />
                  <p>{modalError}</p>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nombre Completo</label>
                <input
                  type="text"
                  name="nombre_completo"
                  required
                  value={formData.nombre_completo}
                  onChange={handleInputChange}
                  placeholder="Ej: Juan Pérez"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-primary outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nombre de Usuario</label>
                <input
                  type="text"
                  name="username"
                  required
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="Ej: jperez (sin espacios)"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-primary outline-none transition-all font-mono"
                />
              </div>

               <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Sede Asignada</label>
                  <div className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-600 font-bold flex items-center gap-1.5 select-none">
                    <Landmark size={14} className="text-slate-400" />
                    {ccName}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Rol de Cuenta</label>
                  <select
                    name="rol"
                    value={formData.rol}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-primary outline-none transition-all font-semibold"
                  >
                    <option value="OPERADOR">OPERADOR</option>
                    <option value="SUPERVISOR">SUPERVISOR</option>
                    <option value="ADMIN">ADMINISTRADOR</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  {modalMode === 'create' ? 'Contraseña' : 'Nueva Contraseña'}
                </label>
                <div className="relative">
                  <Key size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    name="password"
                    required={modalMode === 'create'}
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder={modalMode === 'create' ? '••••••••' : 'Dejar en blanco para no cambiar'}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-primary outline-none transition-all"
                  />
                </div>
              </div>

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
                  {modalMode === 'create' ? 'Crear Usuario' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
