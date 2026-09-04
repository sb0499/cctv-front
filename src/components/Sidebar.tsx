import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { FilePlus, History, LogOut, Menu, X, FileText, Landmark, Users, Camera, Video, FolderTree, ClipboardList, ChevronDown, ChevronRight, ShieldCheck } from 'lucide-react';

interface SidebarProps {
  username?: string;
}

export default function Sidebar({ username = 'Admin' }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;
  const params = useParams<{ ccSlug: string }>();
  const [isOpen, setIsOpen] = useState(false);
  const [secamOpen, setSecamOpen] = useState(true);
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

  // Submenú SECAM
  const secamItems = [
    {
      label: 'Inspección Cámaras',
      path: `/${ccSlug}/inspeccion`,
      icon: Camera,
      roles: ['ADMIN', 'SUPERVISOR', 'OPERADOR'],
    },
    {
      label: 'Inventario Cámaras',
      path: `/${ccSlug}/camaras`,
      icon: Video,
      roles: ['ADMIN', 'SUPERVISOR'],
    },
    {
      label: 'Reportes Inspección',
      path: `/${ccSlug}/reportes-inspeccion`,
      icon: ClipboardList,
      roles: ['ADMIN', 'SUPERVISOR'],
    },
    {
      label: 'Catálogos Cámaras',
      path: `/${ccSlug}/catalogos`,
      icon: FolderTree,
      roles: ['ADMIN', 'SUPERVISOR'],
    },
  ].filter((item) => item.roles.includes(rol));

  const isSecamActive = secamItems.some((item) => pathname === item.path);

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

      <aside
        className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-white border-r border-slate-100 text-slate-800 flex flex-col p-4 md:p-5 z-50 md:z-10 transition-transform duration-300 md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo and Brand */}
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100 shrink-0">
          <img src="/cctv-logo.svg" alt="Logo SICC" className="w-9 h-9 drop-shadow-sm shrink-0" />
          <div className="flex flex-col">
            <span className="text-sm font-black tracking-wider leading-none text-slate-900">SICC</span>
            <span className="text-[9px] font-bold text-primary tracking-wider mt-0.5 uppercase">Control & Cámaras</span>
          </div>
        </div>

        <div className="mb-4 px-3 py-2.5 bg-primary/5 border border-primary/10 rounded-xl flex items-center gap-3 shrink-0">
          <div className="bg-primary/10 w-8 h-8 rounded-lg text-primary flex items-center justify-center overflow-hidden border border-primary/10 shrink-0">
            {!logoError && ccLogo ? (
              <img
                src={ccLogo}
                onError={() => setLogoError(true)}
                className="w-full h-full object-cover"
                alt="Logo Sede"
              />
            ) : (
              <Landmark size={16} />
            )}
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-[9px] text-primary font-bold uppercase tracking-wider">Centro Comercial</span>
            <span className="text-xs font-bold text-slate-800 truncate" title={ccName}>{ccName}</span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto custom-scrollbar space-y-0.5 min-h-0 pr-1">
          {/* Seccion Bitacora CCTV */}
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-1">Bitácora Accesos</div>

          <button
            onClick={() => {
              setIsOpen(false);
              navigate(`/${ccSlug}`);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs md:text-sm font-bold transition-all duration-200 cursor-pointer ${
              pathname === `/${ccSlug}`
                ? 'bg-primary text-white shadow-md shadow-primary/10'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <FilePlus size={16} />
            Nuevo Registro
          </button>

          <button
            onClick={() => {
              setIsOpen(false);
              navigate(`/${ccSlug}/salida`);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs md:text-sm font-bold transition-all duration-200 cursor-pointer ${
              pathname === `/${ccSlug}/salida`
                ? 'bg-primary text-white shadow-md shadow-primary/10'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <LogOut size={16} />
            Registrar Salida
          </button>

          {(rol === 'ADMIN' || rol === 'SUPERVISOR') && (
            <button
              onClick={() => {
                setIsOpen(false);
                navigate(`/${ccSlug}/admin`);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs md:text-sm font-bold transition-all duration-200 cursor-pointer ${
                pathname === `/${ccSlug}/admin`
                  ? 'bg-primary text-white shadow-md shadow-primary/10'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <History size={16} />
              Historial Bitácora
            </button>
          )}

          {/* Menú SECAM (Desplegable) */}
          <div className="pt-2">
            <button
              onClick={() => setSecamOpen(!secamOpen)}
              className={`w-full flex items-center justify-between px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors ${
                isSecamActive ? 'text-primary bg-primary/10' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-primary" />
                <span>SECAM (Cámaras)</span>
              </div>
              {secamOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>

            {secamOpen && (
              <div className="mt-1 ml-2 pl-2 border-l-2 border-slate-100 space-y-0.5">
                {secamItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.path;
                  return (
                    <button
                      key={item.path}
                      onClick={() => {
                        setIsOpen(false);
                        navigate(item.path);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                        isActive
                          ? 'bg-primary text-white shadow-sm shadow-primary/10'
                          : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <Icon size={15} />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Administración (ADMIN) */}
          {rol === 'ADMIN' && (
            <div className="pt-2 space-y-0.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-1">Administración</div>
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate(`/${ccSlug}/usuarios`);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs md:text-sm font-bold transition-all duration-200 cursor-pointer ${
                  pathname === `/${ccSlug}/usuarios`
                    ? 'bg-primary text-white shadow-md shadow-primary/10'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Users size={16} />
                Gestión Usuarios
              </button>

              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate(`/${ccSlug}/centros`);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs md:text-sm font-bold transition-all duration-200 cursor-pointer ${
                  pathname === `/${ccSlug}/centros`
                    ? 'bg-primary text-white shadow-md shadow-primary/10'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Landmark size={16} />
                Gestión Sedes
              </button>
            </div>
          )}
        </nav>

        {/* Logout — shrink-0 keeps it anchored at the bottom always */}
        <div className="shrink-0 pt-4 mt-4 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-xl transition-all duration-200 text-sm font-bold"
          >
            <LogOut size={18} />
            Cerrar Sesión
          </button>
        </div>
      </aside>
    </>
  );
}
