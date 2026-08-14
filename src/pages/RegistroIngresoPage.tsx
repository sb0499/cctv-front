import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShieldCheck, User, FileText, Send, CheckCircle2, AlertCircle, Calendar, Hash, Clock } from 'lucide-react';
import Sidebar from '@/components/Sidebar';

const validarDocumento = (doc: string): { valido: boolean; tipo: 'cedula' | 'pasaporte' | 'invalido'; mensaje: string; enProgreso?: boolean } => {
  const cleanDoc = doc.trim();
  if (cleanDoc.length === 0) {
    return { valido: false, tipo: 'invalido', mensaje: '' };
  }
  
  const soloNumeros = /^\d+$/.test(cleanDoc);
  
  if (soloNumeros) {
    if (cleanDoc.length === 10) {
      const provincia = parseInt(cleanDoc.substring(0, 2), 10);
      if (provincia < 1 || (provincia > 24 && provincia !== 30)) {
        return { valido: false, tipo: 'cedula', mensaje: 'Cédula ecuatoriana inválida (provincia incorrecta)' };
      }
      
      const tercerDigito = parseInt(cleanDoc.charAt(2), 10);
      if (tercerDigito > 5) {
        return { valido: false, tipo: 'cedula', mensaje: 'Cédula ecuatoriana inválida' };
      }
      
      const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
      let suma = 0;
      for (let i = 0; i < 9; i++) {
        let valor = parseInt(cleanDoc.charAt(i), 10) * coeficientes[i];
        if (valor >= 10) {
          valor -= 9;
        }
        suma += valor;
      }
      
      const verificador = parseInt(cleanDoc.charAt(9), 10);
      const residuo = suma % 10;
      const digitoVerificadorCalculado = residuo === 0 ? 0 : 10 - residuo;
      
      if (verificador === digitoVerificadorCalculado) {
        return { valido: true, tipo: 'cedula', mensaje: 'Cédula ecuatoriana válida' };
      } else {
        return { valido: false, tipo: 'cedula', mensaje: 'Cédula ecuatoriana inválida' };
      }
    } else {
      if (cleanDoc.length > 10) {
        return { valido: false, tipo: 'invalido', mensaje: 'La cédula debe tener un máximo de 10 dígitos' };
      } else {
        return { valido: false, tipo: 'invalido', mensaje: 'Cédula incompleta (debe tener 10 dígitos)', enProgreso: true };
      }
    }
  } else {
    // Si contiene letras, se asume pasaporte y se permiten hasta 15 caracteres
    const esAlfanumerico = /^[a-zA-Z0-9]+$/.test(cleanDoc);
    if (esAlfanumerico && cleanDoc.length >= 5 && cleanDoc.length <= 15) {
      return { valido: true, tipo: 'pasaporte', mensaje: 'Pasaporte/ID Extranjero válido' };
    } else {
      return { valido: false, tipo: 'invalido', mensaje: 'El pasaporte debe ser alfanumérico y tener entre 5 y 15 caracteres' };
    }
  }
};

export default function RegistroIngresoPage() {
  const { ccSlug } = useParams<{ ccSlug: string }>();
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ccName, setCcName] = useState('');

  // Estados para el operador en sesión y autocompletado de visitante
  const [adminUsername, setAdminUsername] = useState('Administrador');
  const [searchingCedula, setSearchingCedula] = useState(false);
  const [autoFilled, setAutoFilled] = useState(false);

  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    operador_cctv: '',
    orden_trabajo: '',
    visitante_nombre: '',
    visitante_cedula: '',
    hora_ingreso: '',
    hora_salida: '',
    tipo_funcionario: 'SMO',
    especificar_funcionario: '',
    detalle_actividad_autorizacion: '',
    observaciones: '',
  });

  // Cargar color del localStorage inmediatamente para evitar destellos
  useEffect(() => {
    const savedColor = localStorage.getItem('selectedCCColor');
    if (savedColor) {
      document.documentElement.style.setProperty('--primary-color', savedColor);
    }
  }, []);

  useEffect(() => {
    validateSession();
  }, [ccSlug]);

  // Reloj en tiempo real para mantener la hora de ingreso actualizada al sistema
  useEffect(() => {
    const updateTime = () => {
      const currentHHMM = new Date().toTimeString().split(' ')[0].substring(0, 5);
      setFormData(prev => ({ ...prev, hora_ingreso: currentHHMM }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const validateSession = async () => {
    try {
      if (!ccSlug) {
        navigate('/');
        return;
      }
      // 1. Validar que la sede exista en el backend
      const response = await fetch(`${API_URL}/api/centros-comerciales/${ccSlug}`);
      if (!response.ok) {
        navigate('/');
        return;
      }
      const ccData = await response.json();
      setCcName(ccData.nombre);
      localStorage.setItem('selectedCCId', ccData.id.toString());
      localStorage.setItem('selectedCCName', ccData.nombre);
      localStorage.setItem('selectedCCColor', ccData.color || '#3b82f6');
      document.documentElement.style.setProperty('--primary-color', ccData.color || '#3b82f6');

      // 2. Verificar que exista un token activo
      const token = localStorage.getItem('adminToken');
      if (!token) {
        navigate(`/${ccSlug}/login`);
        return;
      }

      // Pre-llenar operador
      const fullName = localStorage.getItem('adminNombreCompleto') || localStorage.getItem('adminUsername') || 'Administrador';
      setAdminUsername(fullName);
      setFormData(prev => ({ ...prev, operador_cctv: fullName }));

      setCheckingAuth(false);
    } catch (e) {
      console.error(e);
      navigate('/');
    }
  };

  // Efecto para buscar visitante por cédula con debounce de 600ms
  useEffect(() => {
    const cedula = formData.visitante_cedula.trim();
    if (cedula.length < 5) {
      setAutoFilled(false);
      return;
    }

    const timer = setTimeout(() => {
      if (autoFilled) return;

      const checkCedulaDirect = async () => {
        setSearchingCedula(true);
        try {
          const token = localStorage.getItem('adminToken');
          const response = await fetch(`${API_URL}/api/visitantes/${cedula}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (response.ok) {
            const data = await response.json();
            if (data.found && data.visitante) {
              setFormData(prev => ({
                ...prev,
                visitante_nombre: data.visitante.nombre,
                tipo_funcionario: data.visitante.tipo_funcionario,
                especificar_funcionario: data.visitante.especificar_funcionario || '',
              }));
              setAutoFilled(true);
            }
          }
        } catch (err) {
          console.error('Error al verificar cédula:', err);
        } finally {
          setSearchingCedula(false);
        }
      };

      checkCedulaDirect();
    }, 600);

    return () => clearTimeout(timer);
  }, [formData.visitante_cedula]);

  // Buscar también cuando pierda el foco por si no se disparó el debounce
  const handleCedulaBlur = async () => {
    const cedula = formData.visitante_cedula.trim();
    if (cedula.length < 5 || autoFilled) return;

    setSearchingCedula(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/api/visitantes/${cedula}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.found && data.visitante) {
          setFormData(prev => ({
            ...prev,
            visitante_nombre: data.visitante.nombre,
            tipo_funcionario: data.visitante.tipo_funcionario,
            especificar_funcionario: data.visitante.especificar_funcionario || '',
          }));
          setAutoFilled(true);
        }
      }
    } catch (err) {
      console.error('Error al consultar cédula en blur:', err);
    } finally {
      setSearchingCedula(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      if (name === 'visitante_cedula') {
        updated.visitante_nombre = '';
        updated.tipo_funcionario = 'SMO';
        updated.especificar_funcionario = '';
      }
      return updated;
    });
    if (name === 'visitante_cedula') {
      setAutoFilled(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar cédula ecuatoriana o pasaporte
    const docValidation = validarDocumento(formData.visitante_cedula);
    if (!docValidation.valido) {
      setError(docValidation.mensaje || 'El documento ingresado no es válido.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/api/ingresos`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`Registro guardado exitosamente.`);
        setFormData({
          fecha: new Date().toISOString().split('T')[0],
          operador_cctv: localStorage.getItem('adminNombreCompleto') || localStorage.getItem('adminUsername') || '',
          orden_trabajo: '',
          visitante_nombre: '',
          visitante_cedula: '',
          hora_ingreso: '',
          hora_salida: '',
          tipo_funcionario: 'SMO',
          especificar_funcionario: '',
          detalle_actividad_autorizacion: '',
          observaciones: '',
        });
        setAutoFilled(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setError(data.message || 'Error al guardar el registro.');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      setError('Error de conexión con el servidor.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          <p className="text-sm font-semibold tracking-wide">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col md:flex-row font-sans">
      
      {/* Sidebar Navigation */}
      <Sidebar username={adminUsername} />

      {/* Main Form Area */}
      <main className="flex-1 p-4 sm:p-8 overflow-y-auto max-w-5xl mx-auto w-full">
        
        {/* Header */}
        <header className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/60 pb-6">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Nuevo Registro de Trabajo
              </h1>
              <p className="text-slate-500 text-sm mt-1">Completa los campos para registrar un nuevo reporte de actividad</p>
            </div>
            <div className="bg-white border border-slate-200 px-4 py-2.5 rounded-2xl flex items-center gap-2 shadow-sm">
              <Calendar className="text-primary" size={16} />
              <span className="text-xs font-bold text-slate-700">
                {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
              </span>
            </div>
          </div>
        </header>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
          
          {/* Alerts */}
          {(success || error) && (
            <div className="transition-all duration-300">
              {success && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-5 rounded-2xl flex items-start gap-4">
                  <CheckCircle2 className="shrink-0 text-emerald-600 mt-0.5" size={20} />
                  <div>
                    <h4 className="font-bold text-emerald-950">Registro Exitoso</h4>
                    <p className="text-sm mt-1">{success} El reporte PDF se ha guardado en el servidor.</p>
                  </div>
                </div>
              )}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 p-5 rounded-2xl flex items-start gap-4">
                  <AlertCircle className="shrink-0 text-red-600 mt-0.5" size={20} />
                  <div>
                    <h4 className="font-bold text-red-950">Ha ocurrido un problema</h4>
                    <p className="text-sm mt-1">{error}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Card 1: Datos del Turno */}
          <div className="bg-white border border-slate-200/70 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
              <div className="bg-primary/10 p-2.5 rounded-xl text-primary border border-primary/20">
                <ShieldCheck size={18} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Información General</h3>
                <p className="text-xs text-slate-400">Datos principales del turno y fecha de registro</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Fecha</label>
                <input
                  type="date"
                  name="fecha"
                  required
                  readOnly
                  value={formData.fecha}
                  className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed outline-none text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Operador de Turno</label>
                <input
                  type="text"
                  name="operador_cctv"
                  required
                  readOnly
                  placeholder="Nombre completo"
                  value={formData.operador_cctv}
                  className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed outline-none text-sm font-semibold"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Datos del Visitante */}
          <div className="bg-white border border-slate-200/70 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
              <div className="bg-primary/10 p-2.5 rounded-xl text-primary border border-primary/20">
                <User size={18} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Datos del Visitante / Funcionario</h3>
                <p className="text-xs text-slate-400">Identificación y orden de trabajo del responsable del ingreso</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Documento / Cédula</label>
                <input
                  type="text"
                  name="visitante_cedula"
                  required
                  placeholder="Ej: 10293847"
                  value={formData.visitante_cedula}
                  onChange={handleChange}
                  onBlur={handleCedulaBlur}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none text-sm font-semibold"
                />
                {searchingCedula && (
                  <p className="text-[11px] text-primary font-semibold mt-1.5 animate-pulse">Buscando en base de datos...</p>
                )}
                {!searchingCedula && formData.visitante_cedula.trim().length >= 5 && (
                  (() => {
                    const validation = validarDocumento(formData.visitante_cedula);
                    if (!validation.valido) {
                      return (
                        <p className={`text-[11px] font-semibold mt-1.5 flex items-center gap-1 ${
                          validation.enProgreso ? 'text-slate-400' : 'text-rose-600'
                        }`}>
                          <AlertCircle size={12} className={validation.enProgreso ? 'text-slate-400' : 'text-rose-500'} /> {validation.mensaje}
                        </p>
                      );
                    }
                    if (autoFilled) {
                      return (
                        <p className="text-[11px] text-emerald-600 font-semibold mt-1.5 flex items-center gap-1">
                          <CheckCircle2 size={12} className="text-emerald-500" /> Datos recuperados del historial
                        </p>
                      );
                    }
                    return (
                      <p className="text-[11px] text-emerald-600 font-semibold mt-1.5 flex items-center gap-1">
                        <CheckCircle2 size={12} className="text-emerald-500" /> {validation.mensaje}
                      </p>
                    );
                  })()
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nombre Completo</label>
                <input
                  type="text"
                  name="visitante_nombre"
                  required
                  readOnly={autoFilled}
                  placeholder="Ej: Carlos Mendoza"
                  value={formData.visitante_nombre}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border border-slate-200 rounded-xl outline-none text-sm transition-all ${
                    autoFilled 
                      ? 'bg-slate-100 text-slate-500 cursor-not-allowed' 
                      : 'bg-slate-50 text-slate-800 placeholder-slate-400 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/10'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tipo de Funcionario</label>
                <select
                  name="tipo_funcionario"
                  value={formData.tipo_funcionario}
                  onChange={(e) => {
                    handleChange(e);
                    if (autoFilled) setAutoFilled(false);
                  }}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none text-sm font-bold"
                >
                  <option value="SMO">SMO</option>
                  <option value="EPS">EPS</option>
                  <option value="Proveedor">Proveedor</option>
                  <option value="Otros">Otros</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  Orden de Trabajo <span className="text-[10px] text-slate-400 font-medium lowercase tracking-normal">(opcional)</span>
                </label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    name="orden_trabajo"
                    placeholder="Ej: OT-10293"
                    value={formData.orden_trabajo}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none text-sm font-semibold text-primary"
                  />
                </div>
              </div>

              {(formData.tipo_funcionario === 'Proveedor' || formData.tipo_funcionario === 'Otros') && (
                <div className="md:col-span-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Especificar (Empresa/Entidad)</label>
                  <input
                    type="text"
                    name="especificar_funcionario"
                    required
                    placeholder="Ej: Sointech / Empresa Externa"
                    value={formData.especificar_funcionario}
                    onChange={(e) => {
                      handleChange(e);
                      if (autoFilled) setAutoFilled(false);
                    }}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none text-sm"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Card 3: Detalles del Trabajo */}
          <div className="bg-white border border-slate-200/70 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
              <div className="bg-primary/10 p-2.5 rounded-xl text-primary border border-primary/20">
                <FileText size={18} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Actividad y Horario
                </h3>
                <p className="text-xs text-slate-400">
                  Detalles técnicos del trabajo a realizar
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Clock size={14} className="text-slate-400" /> Hora de Ingreso
                </label>
                <input
                  type="time"
                  name="hora_ingreso"
                  required
                  readOnly
                  value={formData.hora_ingreso}
                  className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed outline-none text-sm font-semibold"
                />
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Detalle de Actividad / Autorización
                </label>
                <textarea
                  name="detalle_actividad_autorizacion"
                  required
                  rows={4}
                  placeholder="Describa a detalle el motivo de las labores, áreas a intervenir y quién autoriza el procedimiento..."
                  value={formData.detalle_actividad_autorizacion}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none text-sm resize-none"
                />
              </div>
            </div>
          </div>

          {/* Form Submit Button */}
          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="w-full md:w-auto bg-primary hover:bg-primary-hover text-white font-bold text-sm px-10 py-4 rounded-xl shadow-md shadow-primary/10 flex items-center justify-center gap-2.5 transition-all duration-300 active:scale-[0.98] disabled:bg-slate-300 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Procesando Registro...
                </span>
              ) : (
                <>
                  <Send size={16} />
                  Guardar y Emitir Reporte
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
