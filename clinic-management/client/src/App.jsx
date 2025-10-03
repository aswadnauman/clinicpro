import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import './index.css';

function AppContent() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return isAuthenticated ? <Dashboard /> : <Login />;
}

function App() {
  return (
    <AuthProvider>
      <div className="app">
        <AppContent />
      </div>
    </AuthProvider>
  );
}

export default App;