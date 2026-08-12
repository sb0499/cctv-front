import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Lock, User, LogIn, AlertCircle, ArrowLeft, Landmark } from 'lucide-react';

export default function LoginPage() {
  const { ccSlug } = useParams<{ ccSlug: string }>();
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [ccName, setCcName] = useState('');
  const [ccLogo, setCcLogo] = useState<string | null>(null);
  const [logoError, setLogoError] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [validatingCC, setValidatingCC] = useState(true);

  useEffect(() => {
    validateCC();
  }, [ccSlug]);

  const validateCC = async () => {
    try {
      if (!ccSlug) {
        navigate('/');
        return;
      }
      const response = await fetch(`${API_URL}/api/centros-comerciales/${ccSlug}`);
      if (!response.ok) {
        navigate('/');
        return;
      }
      const data = await response.json();
      setCcName(data.nombre);
      const logoUrl = data.logo ? `${API_URL}/logos/${data.logo}` : `${API_URL}/logos/${ccSlug}.jpg`;
      setCcLogo(logoUrl);
      localStorage.setItem('selectedCCId', data.id.toString());
      localStorage.setItem('selectedCCName', data.nombre);
      localStorage.setItem('selectedCCColor', data.color || '#3b82f6');
      localStorage.setItem('selectedCCLogo', logoUrl);
      document.documentElement.style.setProperty('--primary-color', data.color || '#3b82f6');
      setValidatingCC(false);
    } catch (e) {
      console.error(e);
      navigate('/');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username, 
          password, 
          ccSlug
        }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('adminToken', data.token);
        localStorage.setItem('adminUsername', data.username || username);
        localStorage.setItem('adminNombreCompleto', data.nombreCompleto || data.username || username);
        navigate(`/${ccSlug}`);
      } else {
        setError(data.message || 'Credenciales inválidas');
      }
    } catch (err) {
      setError('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToSelect = () => {
    localStorage.removeItem('selectedCCId');
    localStorage.removeItem('selectedCCName');
    localStorage.removeItem('selectedCCColor');
    localStorage.removeItem('adminNombreCompleto');
    navigate('/');
  };

  if (validatingCC) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden font-sans"
      style={{
        background: `linear-gradient(135deg, var(--primary-color) 0%, color-mix(in srgb, var(--primary-color) 12%, #0f172a) 60%, #030712 100%)`
      }}
    >
      
      {/* Decorative subtle background accents */}
      <div 
        className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-[120px] pointer-events-none"
        style={{ backgroundColor: 'var(--primary-color)', opacity: 0.12 }}
      ></div>
      <div 
        className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-[120px] pointer-events-none"
        style={{ backgroundColor: 'var(--primary-color)', opacity: 0.12 }}
      ></div>

      <div className="max-w-md w-full bg-white border border-slate-100 rounded-3xl shadow-[0_20px_50px_-20px_rgba(15,23,42,0.08)] overflow-hidden transition-all duration-300">
        
        {/* Banner header */}
        <div className="p-8 text-center border-b border-slate-55 bg-slate-50/30 relative">
          <button 
            onClick={handleBackToSelect}
            className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
            title="Volver a seleccionar sede"
          >
            <ArrowLeft size={18} />
          </button>
          
          <div className="w-20 h-20 mx-auto mb-4 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center overflow-hidden shrink-0">
            {!logoError && ccLogo ? (
              <img 
                src={ccLogo} 
                onError={() => setLogoError(true)}
                className="w-full h-full object-cover" 
                alt="Logo Sede" 
              />
            ) : (
              <img 
                src="/cctv-logo.svg" 
                className="w-14 h-14 object-contain" 
                alt="Logo CCTV" 
              />
            )}
          </div>
          
          <h1 className="text-xl font-extrabold text-slate-900">
            Iniciar Sesión
          </h1>
          
          <div className="inline-flex items-center gap-1.5 bg-primary/10 border border-primary/20 px-3 py-1 rounded-full text-primary font-bold text-xs mt-2.5">
            <Landmark size={12} />
            {ccName}
          </div>
        </div>
        
        <form onSubmit={handleLogin} className="p-8 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3 border border-red-100 animate-in fade-in slide-in-from-top-2">
              <AlertCircle size={18} className="shrink-0 text-red-500" />
              <p className="text-sm font-semibold">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Usuario</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200/80 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none text-sm"
                  placeholder="Ej: admin"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200/80 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-hover text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.98] disabled:bg-slate-300 disabled:cursor-not-allowed shadow-lg shadow-primary/15 mt-8 cursor-pointer"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Validando...
              </span>
            ) : (
              <>
                <LogIn size={16} />
                Iniciar Sesión
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
