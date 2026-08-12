import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomeSelectionPage from './pages/HomeSelectionPage';
import RegistroIngresoPage from './pages/RegistroIngresoPage';
import LoginPage from './pages/LoginPage';
import AdminPage from './pages/AdminPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomeSelectionPage />} />
        <Route path="/:ccSlug" element={<RegistroIngresoPage />} />
        <Route path="/:ccSlug/login" element={<LoginPage />} />
        <Route path="/:ccSlug/admin" element={<AdminPage />} />
      </Routes>
    </Router>
  );
}

export default App;
