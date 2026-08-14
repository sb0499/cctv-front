import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { FilePlus, History, LogOut, Menu, X, FileText, Landmark, Users } from 'lucide-react';

interface SidebarProps {
  username?: string;
}

export default function Sidebar({ username = 'Admin' }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;
  const params = useParams<{ ccSlug: string }>();
  const [isOpen, setIsOpen] = useState(false);
  const [ccName, setCcName] = useState('Sede');
  const [ccLogo, setCcLogo] = useState<string | null>(null);
  const [logoError, setLogoError] = useState(false);
  const ccSlug = params.ccSlug || '';

  useEffect(() => {
    setCcName(localStorage.getItem('selectedCCName') || 'Sede');
    setCcLogo(localStorage.getItem('selectedCCLogo'));
    const savedColor = localStorage.getItem('selectedCCColor');
    if (savedColor) {
      document.documentElement.style.setProperty('--primary-color', savedColor);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminRol');
    localStorage.removeItem('adminUsername');
    localStorage.removeItem('adminNombreCompleto');
    localStorage.removeItem('selectedCCId');
    localStorage.removeItem('selectedCCName');
    localStorage.removeItem('selectedCCColor');
    localStorage.removeItem('selectedCCLogo');
    navigate('/');
  };

  const rol = localStorage.getItem('adminRol') || 'OPERADOR';
  const navItems = [
    {
      label: 'Nuevo Registro',
      path: `/${ccSlug}`,
      icon: FilePlus,
    },
    {
      label: 'Registrar Salida',
      path: `/${ccSlug}/salida`,
      icon: LogOut,
    }
  ];

  if (rol === 'ADMIN' || rol === 'SUPERVISOR') {
    navItems.push({
      label: 'Historial',
      path: `/${ccSlug}/admin`,
      icon: History,
    });
  }

  if (rol === 'ADMIN') {
    navItems.push(
      {
        label: 'Gestión Usuarios',
        path: `/${ccSlug}/usuarios`,
        icon: Users,
      },
      {
        label: 'Gestión Sedes',
        path: `/${ccSlug}/centros`,
        icon: Landmark,
      }
    );
  }

  return (
    <>
      {/* Mobile Header */}
      <header className="md:hidden bg-white text-slate-800 flex items-center justify-between px-6 py-4 shadow-sm border-b border-slate-100 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <img src="/cctv-logo.svg" alt="Logo CCTV" className="w-7 h-7 drop-shadow-sm shrink-0" />
          <span className="font-bold tracking-tight text-sm text-slate-800">REGISTRO DE TRABAJO</span>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-1 text-slate-500 hover:text-slate-800 transition-colors"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Backdrop for mobile drawer */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 md:hidden z-40 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`fixed md:sticky top-0 left-0 bottom-0 w-64 bg-white border-r border-slate-100 text-slate-800 flex flex-col p-6 z-50 md:z-10 transition-transform duration-300 md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo and Brand */}
        <div className="flex items-center gap-3 mb-8 pb-6 border-b border-slate-100">
          <img src="/cctv-logo.svg" alt="Logo CCTV" className="w-10 h-10 drop-shadow-sm shrink-0" />
          <div className="flex flex-col">
            <span className="text-sm font-extrabold tracking-wide leading-none text-slate-900">REGISTRO</span>
            <span className="text-[10px] font-bold text-primary tracking-widest mt-1">DE TRABAJO</span>
          </div>
        </div>

        <div className="mb-6 px-4 py-3 bg-primary/5 border border-primary/10 rounded-2xl flex items-center gap-3">
          <div className="bg-primary/10 w-9 h-9 rounded-xl text-primary flex items-center justify-center overflow-hidden border border-primary/10 shrink-0">
            {!logoError && ccLogo ? (
              <img 
                src={ccLogo} 
                onError={() => setLogoError(true)}
                className="w-full h-full object-cover" 
                alt="Logo Sede" 
              />
            ) : (
              <Landmark size={18} />
            )}
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-[10px] text-primary font-bold uppercase tracking-wider">Centro Comercial</span>
            <span className="text-xs font-bold text-slate-800 truncate" title={ccName}>{ccName}</span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => {
                  setIsOpen(false);
                  navigate(item.path);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-primary text-white shadow-md shadow-primary/10'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon size={18} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Change Sede / Logout */}
        <button
          onClick={handleLogout}
          className="mt-auto flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-xl transition-all duration-200 text-sm font-bold"
        >
          <LogOut size={18} />
          Cerrar Sesión
        </button>
      </aside>
    </>
  );
}
