import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import RecoveryPage from './pages/RecoveryPage';
import './App.css';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="app">
        <header className="app-header">
          <div className="container">
            <h1 className="logo">🏦 Caju Bank</h1>
            <p className="tagline">Segurança em primeiro lugar</p>
          </div>
        </header>

        <main className="app-main">
          <Routes>
            <Route path="/" element={<Navigate to="/recovery" replace />} />
            <Route path="/recovery" element={<RecoveryPage />} />
            <Route path="/login" element={<div className="placeholder-page"><h2>Página de Login</h2><p>Implementar em produção</p></div>} />
            <Route path="*" element={<div className="placeholder-page"><h2>404 - Página Não Encontrada</h2></div>} />
          </Routes>
        </main>

        <footer className="app-footer">
          <div className="container">
            <p>&copy; 2025 Caju Bank - Todos os direitos reservados</p>
            <p className="footer-links">
              <a href="/privacidade">Política de Privacidade</a> |{' '}
              <a href="/termos">Termos de Uso</a> |{' '}
              <a href="/suporte">Suporte</a>
            </p>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
};

export default App;
