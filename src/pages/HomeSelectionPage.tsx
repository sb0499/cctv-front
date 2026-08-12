import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Landmark, ArrowRight } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function HomeSelectionPage() {
  const [malls, setMalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});
  const navigate = useNavigate();

  useEffect(() => {
    // Reset primary color to default corporate blue on home page
    document.documentElement.style.setProperty('--primary-color', '#3b82f6');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('selectedCCId');
    localStorage.removeItem('selectedCCName');
    localStorage.removeItem('selectedCCColor');
    fetchMalls();
  }, []);

  const fetchMalls = async () => {
    try {
      const response = await fetch(`${API_URL}/api/centros-comerciales`);
      if (response.ok) {
        const data = await response.json();
        setMalls(data);
      }
    } catch (e) {
      console.error('Error fetching malls:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMall = (id: number, name: string, slug: string, color: string) => {
    const selectedColor = color || '#3b82f6';
    localStorage.setItem('selectedCCId', id.toString());
    localStorage.setItem('selectedCCName', name);
    localStorage.setItem('selectedCCColor', selectedColor);
    document.documentElement.style.setProperty('--primary-color', selectedColor);
    navigate(`/${slug}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
          <p className="text-sm font-semibold tracking-wide">Cargando sedes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      
      {/* Decorative background blur shapes */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-2xl w-full bg-white border border-slate-100 rounded-3xl shadow-[0_20px_50px_-20px_rgba(15,23,42,0.06)] p-8 sm:p-10 relative z-10">
        <div className="text-center mb-10">
          <img src="/cctv-logo.svg" alt="Logo CCTV" className="w-28 h-28 mx-auto mb-6 drop-shadow-lg" />
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            REGISTRO DE TRABAJO CCTV
          </h1>
          <p className="text-slate-500 text-sm mt-2 font-medium">Seleccione un Centro Comercial para acceder al sistema</p>
        </div>

        {malls.length === 0 ? (
          <div className="text-center p-6 text-slate-400 font-medium">
            No hay centros comerciales configurados en la base de datos.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {malls.map((mall) => (
              <button
                key={mall.id}
                onClick={() => handleSelectMall(mall.id, mall.nombre, mall.slug, mall.color)}
                className="group w-full flex items-center justify-between p-5 bg-slate-50 border border-slate-200/50 rounded-2xl hover:bg-white hover:border-[var(--hover-color)] hover:shadow-lg hover:shadow-[var(--hover-color)]/5 transition-all text-left duration-200 cursor-pointer"
                style={{ '--hover-color': mall.color || '#3b82f6' } as React.CSSProperties}
              >
                <div className="flex items-center gap-3.5 overflow-hidden">
                  <div 
                    className="bg-slate-200/50 text-slate-500 w-11 h-11 rounded-xl transition-colors group-hover:bg-[var(--icon-bg)] group-hover:text-[var(--icon-color)] flex items-center justify-center overflow-hidden border border-slate-100/50 shrink-0"
                    style={{ '--icon-bg': `${mall.color || '#3b82f6'}15`, '--icon-color': mall.color || '#3b82f6' } as React.CSSProperties}
                  >
                    {!imageErrors[mall.id] ? (
                      <img 
                        src={mall.logo ? `${API_URL}/logos/${mall.logo}` : `${API_URL}/logos/${mall.slug}.jpg`} 
                        onError={() => setImageErrors(prev => ({ ...prev, [mall.id]: true }))}
                        className="w-full h-full object-cover" 
                        alt={mall.nombre}
                      />
                    ) : (
                      <Landmark size={18} />
                    )}
                  </div>
                  <span className="font-extrabold text-slate-800 text-sm truncate">{mall.nombre}</span>
                </div>
                <ArrowRight 
                  size={16} 
                  className="text-slate-400 transition-colors shrink-0 group-hover:translate-x-0.5 group-hover:text-[var(--arrow-color)]" 
                  style={{ '--arrow-color': mall.color || '#3b82f6' } as React.CSSProperties}
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
