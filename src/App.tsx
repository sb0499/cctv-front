import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomeSelectionPage from './pages/HomeSelectionPage';
import RegistroIngresoPage from './pages/RegistroIngresoPage';
import RegistrarSalidaPage from './pages/RegistrarSalidaPage';
import LoginPage from './pages/LoginPage';
import AdminPage from './pages/AdminPage';
import UsuariosPage from './pages/UsuariosPage';
import CentrosComercialesPage from './pages/CentrosComercialesPage';
import CamarasPage from './pages/CamarasPage';
import InspeccionCamarasPage from './pages/InspeccionCamarasPage';
import CatalogosPage from './pages/CatalogosPage';
import ReportesInspeccionPage from './pages/ReportesInspeccionPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomeSelectionPage />} />
        <Route path="/:ccSlug" element={<RegistroIngresoPage />} />
        <Route path="/:ccSlug/salida" element={<RegistrarSalidaPage />} />
        <Route path="/:ccSlug/login" element={<LoginPage />} />
        <Route path="/:ccSlug/admin" element={<AdminPage />} />
        <Route path="/:ccSlug/camaras" element={<CamarasPage />} />
        <Route path="/:ccSlug/inspeccion" element={<InspeccionCamarasPage />} />
        <Route path="/:ccSlug/catalogos" element={<CatalogosPage />} />
        <Route path="/:ccSlug/reportes-inspeccion" element={<ReportesInspeccionPage />} />
        <Route path="/:ccSlug/usuarios" element={<UsuariosPage />} />
        <Route path="/:ccSlug/centros" element={<CentrosComercialesPage />} />
      </Routes>
    </Router>
  );
}

export default App;

