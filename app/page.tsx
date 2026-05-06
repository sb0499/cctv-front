'use client';

import React, { useState } from 'react';
import { ClipboardList, User, ShieldCheck, FileText, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import SignaturePad from '@/components/SignaturePad';

export default function RegistroIngresoPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [signature, setSignature] = useState<string>('');

  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    operador_cctv: '',
    visitante_nombre: '',
    visitante_cedula: '',
    hora_ingreso: '',
    hora_salida: '',
    tipo_funcionario: 'SMO',
    especificar_funcionario: '',
    detalle_actividad_autorizacion: '',
    observaciones: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signature) {
      setError('La firma es obligatoria.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('http://localhost:3001/api/ingresos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, firmaBase64: signature }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`Registro guardado exitosamente. Documento generado: ${data.pdfUrl}`);
        // Reset form except operator and date if desired, but here we reset all
        setFormData({
          fecha: new Date().toISOString().split('T')[0],
          operador_cctv: '',
          visitante_nombre: '',
          visitante_cedula: '',
          hora_ingreso: '',
          hora_salida: '',
          tipo_funcionario: 'SMO',
          especificar_funcionario: '',
          detalle_actividad_autorizacion: '',
          observaciones: '',
        });
        setSignature('');
      } else {
        setError(data.message || 'Error al guardar el registro.');
      }
    } catch (err) {
      setError('Error de conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-t-2xl shadow-sm p-6 border-b border-slate-100 flex items-center gap-4">
          <div className="bg-blue-600 p-3 rounded-xl text-white">
            <ClipboardList size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Control de Ingreso</h1>
            <p className="text-slate-500">Central de Monitoreo CCTV</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-b-2xl shadow-xl overflow-hidden">
          <div className="p-8 space-y-8">
            
            {/* Seccion 1: Información General */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-blue-600 font-semibold border-b pb-2">
                <ShieldCheck size={20} />
                <h2>Información del Turno</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Fecha</label>
                  <input
                    type="date"
                    name="fecha"
                    required
                    value={formData.fecha}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Operador CCTV de Turno</label>
                  <input
                    type="text"
                    name="operador_cctv"
                    required
                    placeholder="Nombre completo"
                    value={formData.operador_cctv}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Seccion 2: Datos del Visitante */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-blue-600 font-semibold border-b pb-2">
                <User size={20} />
                <h2>Datos del Visitante / Funcionario</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Completo</label>
                  <input
                    type="text"
                    name="visitante_nombre"
                    required
                    value={formData.visitante_nombre}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Cédula / ID</label>
                  <input
                    type="text"
                    name="visitante_cedula"
                    required
                    value={formData.visitante_cedula}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Funcionario</label>
                  <select
                    name="tipo_funcionario"
                    value={formData.tipo_funcionario}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    <option value="SMO">SMO</option>
                    <option value="EPS">EPS</option>
                    <option value="Proveedor">Proveedor</option>
                    <option value="Otros">Otros</option>
                  </select>
                </div>
                {(formData.tipo_funcionario === 'Proveedor' || formData.tipo_funcionario === 'Otros') && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Especificar (Empresa/Entidad)</label>
                    <input
                      type="text"
                      name="especificar_funcionario"
                      required
                      placeholder="Ej: Sointech"
                      value={formData.especificar_funcionario}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all animate-in fade-in slide-in-from-top-2"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Seccion 3: Detalles de la Actividad */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-blue-600 font-semibold border-b pb-2">
                <FileText size={20} />
                <h2>Actividad y Horarios</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Hora de Ingreso</label>
                  <input
                    type="time"
                    name="hora_ingreso"
                    required
                    value={formData.hora_ingreso}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Hora de Salida (Opcional)</label>
                  <input
                    type="time"
                    name="hora_salida"
                    value={formData.hora_salida}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Detalle de Actividad / Autorización</label>
                <textarea
                  name="detalle_actividad_autorizacion"
                  required
                  rows={3}
                  value={formData.detalle_actividad_autorizacion}
                  onChange={handleChange}
                  placeholder="Describa el motivo del ingreso y quién autoriza..."
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Observaciones</label>
                <textarea
                  name="observaciones"
                  rows={2}
                  value={formData.observaciones}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Seccion 4: Firma */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-blue-600 font-semibold border-b pb-2">
                <Send size={20} />
                <h2>Firma Digital</h2>
              </div>
              <p className="text-sm text-slate-500">Por favor, firme dentro del recuadro:</p>
              <SignaturePad 
                onSave={(data) => setSignature(data)} 
                onClear={() => setSignature('')} 
              />
            </div>
          </div>

          {/* Alert Messages */}
          {(success || error) && (
            <div className="px-8 pb-4">
              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-3">
                  <CheckCircle2 className="shrink-0" />
                  <p>{success}</p>
                </div>
              )}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-3">
                  <AlertCircle className="shrink-0" />
                  <p>{error}</p>
                </div>
              )}
            </div>
          )}

          {/* Footer / Submit */}
          <div className="bg-slate-50 p-8 border-t border-slate-200">
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 px-6 rounded-xl text-white font-bold text-lg shadow-lg transform transition-all active:scale-95 ${
                loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Procesando...
                </span>
              ) : (
                'Finalizar Registro e Imprimir'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
