import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LogOut, Search, Clock, ShieldCheck, User, FileText, Send, CheckCircle2, AlertCircle, Calendar, X, Download } from 'lucide-react';
import SignaturePad from '@/components/SignaturePad';
import Sidebar from '@/components/Sidebar';

interface Registro {
  id: number;
  fecha: string;
  operador_cctv: string;
  orden_trabajo: string | null;
  visitante_nombre: string;
  visitante_cedula: string;
  hora_ingreso: string;
  hora_salida: string | null;
  tipo_funcionario: string;
  especificar_funcionario: string | null;
  detalle_actividad_autorizacion: string;
  observaciones: string | null;
  pdf_url: string | null;
  firma_url: string | null;
  estado: 'ABIERTO' | 'CERRADO';
}

export default function RegistrarSalidaPage() {
  const { ccSlug } = useParams<{ ccSlug: string }>();
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<Registro[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [ccName, setCcName] = useState('');
  const [adminUsername, setAdminUsername] = useState('Administrador');

  // Modal State
  const [selectedRecord, setSelectedRecord] = useState<Registro | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [observaciones, setObservaciones] = useState('');
  const [signature, setSignature] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSuccess, setModalSuccess] = useState<{ msg: string; pdfUrl: string } | null>(null);

  useEffect(() => {
    const savedColor = localStorage.getItem('selectedCCColor');
    if (savedColor) {
      document.documentElement.style.setProperty('--primary-color', savedColor);
    }
  }, []);

  useEffect(() => {
    validateSession();
  }, [ccSlug]);

  const validateSession = async () => {
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
      const ccData = await response.json();
      setCcName(ccData.nombre);
      localStorage.setItem('selectedCCId', ccData.id.toString());
      localStorage.setItem('selectedCCName', ccData.nombre);
      localStorage.setItem('selectedCCColor', ccData.color || '#3b82f6');
      localStorage.setItem('selectedCCLogo', ccData.logo || '');
      document.documentElement.style.setProperty('--primary-color', ccData.color || '#3b82f6');
      
      const token = localStorage.getItem('adminToken');
      if (!token) {
        navigate(`/${ccSlug}/login`);
        return;
      }

      setAdminUsername(localStorage.getItem('adminNombreCompleto') || localStorage.getItem('adminUsername') || 'Administrador');
      await fetchRecords(token);
      setCheckingAuth(false);
    } catch (e) {
      console.error(e);
      navigate('/');
    }
  };

  const fetchRecords = async (token: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/ingresos`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setRecords(data);
      }
    } catch (error) {
      console.error('Error fetching records:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRecords = records.filter(record => {
    const searchLower = searchTerm.toLowerCase();
    return (
      record.visitante_nombre.toLowerCase().includes(searchLower) ||
      record.visitante_cedula.includes(searchLower)
    );
  });

  const openSalidaModal = (record: Registro) => {
    setSelectedRecord(record);
    setObservaciones('');
    setSignature('');
    setModalError(null);
    setModalSuccess(null);
    setModalOpen(true);
  };

  const closeSalidaModal = () => {
    if (modalLoading) return;
    setModalOpen(false);
    setSelectedRecord(null);
  };

  const handleRegisterSalida = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;
    if (!signature) {
      setModalError('La firma del visitante es obligatoria para registrar la salida.');
      return;
    }

    setModalLoading(true);
    setModalError(null);

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/api/ingresos/${selectedRecord.id}/salida`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ observaciones, firmaBase64: signature })
      });

      const data = await response.json();

      if (response.ok) {
        setModalSuccess({ msg: 'Salida registrada exitosamente.', pdfUrl: data.pdfUrl });
        if (token) fetchRecords(token);
      } else {
        setModalError(data.message || 'Error al registrar la salida.');
      }
    } catch (err) {
      setModalError('Error de conexión con el servidor.');
    } finally {
      setModalLoading(false);
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
      <Sidebar username={adminUsername} />
      
      <main className="flex-1 p-4 sm:p-8 overflow-y-auto max-w-5xl mx-auto w-full">
        <header className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/60 pb-6">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Registrar Salida de Visitantes</h1>
              <p className="text-slate-500 text-sm mt-1">Busca y finaliza las visitas activas de CCTV</p>
            </div>
            <div className="bg-white border border-slate-200 px-4 py-2.5 rounded-2xl flex items-center gap-2 shadow-sm">
              <Calendar className="text-primary" size={16} />
              <span className="text-xs font-bold text-slate-700">
                {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
              </span>
            </div>
          </div>
        </header>

        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por Nombre o Cédula del visitante..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-slate-800 focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none text-sm font-semibold shadow-sm"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="bg-white border border-slate-200/70 p-12 text-center text-slate-400 flex flex-col items-center gap-3 rounded-2xl shadow-sm">
            <Search size={32} className="text-slate-300" />
            <p className="text-sm font-bold">No se encontraron registros de visitas.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredRecords.map((record) => (
              <div 
                key={record.id} 
                className={`bg-white border transition-all p-5 rounded-2xl shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${
                  record.estado === 'ABIERTO' ? 'border-amber-200 bg-amber-50/10' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-xs font-bold text-slate-500">
                      {new Date(record.fecha).toLocaleDateString('es-ES', { timeZone: 'UTC' })}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold tracking-wider border ${
                      record.estado === 'ABIERTO' 
                        ? 'bg-amber-100 text-amber-800 border-amber-200' 
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {record.estado}
                    </span>
                    {record.orden_trabajo && (
                      <span className="bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-md text-[9px] font-bold">
                        OT: {record.orden_trabajo}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm">{record.visitante_nombre}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Cédula: <span className="font-semibold text-slate-700">{record.visitante_cedula}</span></p>
                  </div>
                  <div className="flex items-center gap-4 text-[11px] text-slate-400 font-semibold mt-1">
                    <span className="flex items-center gap-1"><Clock size={12} /> Ingreso: {record.hora_ingreso}</span>
                    {record.hora_salida && (
                      <span className="flex items-center gap-1"><Clock size={12} /> Salida: {record.hora_salida}</span>
                    )}
                  </div>
                </div>

                <div className="shrink-0 w-full sm:w-auto">
                  {record.estado === 'ABIERTO' ? (
                    <button
                      onClick={() => openSalidaModal(record)}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer"
                    >
                      <LogOut size={14} />
                      Registrar Salida
                    </button>
                  ) : (
                    record.pdf_url && (
                      <a
                        href={record.pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl border border-slate-200/80 transition-all cursor-pointer"
                      >
                        <FileText size={14} />
                        Descargar PDF
                      </a>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Salida Modal */}
      {modalOpen && selectedRecord && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden my-8 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="px-6 py-5 bg-primary text-white flex justify-between items-center shrink-0">
              <div>
                <h3 className="font-extrabold text-base">Registrar Salida de Visitante</h3>
                <p className="text-[11px] text-white/70 mt-0.5">Completa observaciones y firma para finalizar el registro</p>
              </div>
              <button 
                onClick={closeSalidaModal}
                disabled={modalLoading}
                className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {modalSuccess ? (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-6 rounded-2xl flex flex-col items-center text-center gap-4">
                  <CheckCircle2 className="text-emerald-600" size={36} />
                  <div>
                    <h4 className="font-extrabold text-emerald-950 text-base">¡Registro Finalizado!</h4>
                    <p className="text-xs mt-1 text-slate-600">{modalSuccess.msg}</p>
                  </div>
                  <a
                    href={modalSuccess.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-6 py-3 rounded-xl transition-all shadow-md shadow-emerald-600/10 cursor-pointer"
                  >
                    <Download size={14} />
                    Ver y Descargar PDF
                  </a>
                </div>
              ) : (
                <form onSubmit={handleRegisterSalida} className="space-y-5">
                  {modalError && (
                    <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl flex items-start gap-3">
                      <AlertCircle className="shrink-0 text-red-600 mt-0.5" size={16} />
                      <p className="text-xs font-semibold">{modalError}</p>
                    </div>
                  )}

                  {/* Informacion de Ingreso Bloqueada */}
                  <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-2xl space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck size={14} className="text-primary" /> Datos de Ingreso (Bloqueados)
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="block text-slate-400 font-semibold mb-0.5">Visitante</span>
                        <span className="font-extrabold text-slate-800">{selectedRecord.visitante_nombre}</span>
                      </div>
                      <div>
                        <span className="block text-slate-400 font-semibold mb-0.5">Cédula / Documento</span>
                        <span className="font-extrabold text-slate-800">{selectedRecord.visitante_cedula}</span>
                      </div>
                      <div>
                        <span className="block text-slate-400 font-semibold mb-0.5">Operador de Turno</span>
                        <span className="font-bold text-slate-700">{selectedRecord.operador_cctv}</span>
                      </div>
                      <div>
                        <span className="block text-slate-400 font-semibold mb-0.5">Hora Ingreso</span>
                        <span className="font-bold text-slate-700">{selectedRecord.hora_ingreso}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="block text-slate-400 font-semibold mb-0.5">Actividad / Autorización</span>
                        <p className="text-[11px] text-slate-600 bg-white border border-slate-100 p-2.5 rounded-xl font-medium leading-relaxed">
                          {selectedRecord.detalle_actividad_autorizacion}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Observaciones (Editable) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Observaciones de Salida
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Indique cómo finaliza la actividad, materiales retirados, incidentes reportados, etc..."
                      value={observaciones}
                      onChange={(e) => setObservaciones(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none text-xs resize-none"
                    />
                  </div>

                  {/* Firma Digital */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Firma de Salida del Visitante
                    </label>
                    <p className="text-[10px] text-slate-400 font-medium">Dibuje la firma dentro del recuadro para validar el retiro</p>
                    <div className="p-1 bg-slate-50 border border-slate-200 rounded-2xl">
                      <SignaturePad
                        onSave={(data) => setSignature(data)}
                        onClear={() => setSignature('')}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 shrink-0">
                    <button
                      type="button"
                      disabled={modalLoading}
                      onClick={closeSalidaModal}
                      className="px-5 py-2.5 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors text-xs font-bold cursor-pointer disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={modalLoading}
                      className="bg-primary hover:bg-primary-hover text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md shadow-primary/10 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:bg-slate-300 disabled:cursor-not-allowed"
                    >
                      {modalLoading ? (
                        <>
                          <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Registrando Salida...
                        </>
                      ) : (
                        <>
                          <Send size={12} />
                          Finalizar y Emitir PDF
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
