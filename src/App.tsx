import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomeSelectionPage from './pages/HomeSelectionPage';
import RegistroIngresoPage from './pages/RegistroIngresoPage';
import LoginPage from './pages/LoginPage';
import AdminPage from './pages/AdminPage';
import UsuariosPage from './pages/UsuariosPage';
import CentrosComercialesPage from './pages/CentrosComercialesPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomeSelectionPage />} />
        <Route path="/:ccSlug" element={<RegistroIngresoPage />} />
        <Route path="/:ccSlug/login" element={<LoginPage />} />
        <Route path="/:ccSlug/admin" element={<AdminPage />} />
        <Route path="/:ccSlug/usuarios" element={<UsuariosPage />} />
        <Route path="/:ccSlug/centros" element={<CentrosComercialesPage />} />
      </Routes>
    </Router>
  );
}

export default App;
