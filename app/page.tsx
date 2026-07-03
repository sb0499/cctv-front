'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Landmark, ArrowRight } from 'lucide-react';

export default function HomeSelectionPage() {
  const [malls, setMalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Clear old tokens to avoid mixed session states when choosing a new mall
    localStorage.removeItem('adminToken');
    localStorage.removeItem('selectedCCId');
    localStorage.removeItem('selectedCCName');
    fetchMalls();
  }, []);

  const fetchMalls = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
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

  const handleSelectMall = (id: number, name: string, slug: string) => {
    localStorage.setItem('selectedCCId', id.toString());
    localStorage.setItem('selectedCCName', name);
    router.push(`/${slug}`);
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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      
      {/* Decorative background blur shapes */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-100/40 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-100/40 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-2xl w-full bg-white border border-slate-100 rounded-3xl shadow-[0_20px_50px_-20px_rgba(15,23,42,0.06)] p-8 sm:p-10 relative z-10">
        <div className="text-center mb-10">
          <div className="bg-blue-600 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/10 text-white">
            <Landmark size={22} />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Registro de Trabajo
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
                onClick={() => handleSelectMall(mall.id, mall.nombre, mall.slug)}
                className="group w-full flex items-center justify-between p-5 bg-slate-50 border border-slate-200/50 rounded-2xl hover:bg-white hover:border-blue-600 hover:shadow-lg hover:shadow-blue-500/5 transition-all text-left duration-200 cursor-pointer"
              >
                <div className="flex items-center gap-3.5 overflow-hidden">
                  <div className="bg-slate-200/50 group-hover:bg-blue-50 text-slate-550 group-hover:text-blue-600 p-2.5 rounded-xl transition-colors">
                    <Landmark size={18} />
                  </div>
                  <span className="font-extrabold text-slate-800 text-sm truncate">{mall.nombre}</span>
                </div>
                <ArrowRight size={16} className="text-slate-400 group-hover:text-blue-600 transition-colors shrink-0 group-hover:translate-x-0.5" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
