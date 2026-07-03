'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname, useParams } from 'next/navigation';
import { FilePlus, History, LogOut, Menu, X, FileText, Landmark } from 'lucide-react';

interface SidebarProps {
  username?: string;
}

export default function Sidebar({ username = 'Admin' }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const [isOpen, setIsOpen] = useState(false);
  const [ccName, setCcName] = useState('Sede');
  const ccSlug = params?.ccSlug as string || '';

  useEffect(() => {
    setCcName(localStorage.getItem('selectedCCName') || 'Sede');
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('selectedCCId');
    localStorage.removeItem('selectedCCName');
    router.push('/');
  };

  const navItems = [
    {
      label: 'Nuevo Registro',
      path: `/${ccSlug}`,
      icon: FilePlus,
    },
    {
      label: 'Historial',
      path: `/${ccSlug}/admin`,
      icon: History,
    },
  ];

  return (
    <>
      {/* Mobile Header */}
      <header className="md:hidden bg-white text-slate-800 flex items-center justify-between px-6 py-4 shadow-sm border-b border-slate-100 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-1.5 rounded-lg text-white">
            <FileText size={18} />
          </div>
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
          <div className="bg-gradient-to-tr from-blue-600 to-indigo-500 p-2.5 rounded-xl text-white shadow-md shadow-blue-500/10">
            <FileText size={22} />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-extrabold tracking-wide leading-none text-slate-900">REGISTRO</span>
            <span className="text-[10px] font-bold text-blue-600 tracking-widest mt-1">DE TRABAJO</span>
          </div>
        </div>

        {/* Selected Mall Info */}
        <div className="mb-6 px-4 py-3 bg-blue-50/50 border border-blue-100/50 rounded-2xl flex items-center gap-3">
          <div className="bg-blue-600/10 p-2 rounded-xl text-blue-600">
            <Landmark size={18} />
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">Centro Comercial</span>
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
                  router.push(item.path);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10'
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
