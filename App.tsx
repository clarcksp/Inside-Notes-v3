import React, { useState, useEffect, useCallback } from 'react';
import Login from './components/Auth';
import Dashboard from './components/Dashboard';
import { LoadingSpinner } from './components/ui';
import type { UsuarioTecnico } from './types';

const App: React.FC = () => {
  const [user, setUser] = useState<UsuarioTecnico | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate checking for an existing session
    try {
      const storedUser = localStorage.getItem('inside-notes-user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      localStorage.removeItem('inside-notes-user');
    }
    setLoading(false);
  }, []);

  const handleLogin = useCallback((loggedInUser: UsuarioTecnico) => {
    localStorage.setItem('inside-notes-user', JSON.stringify(loggedInUser));
    setUser(loggedInUser);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('inside-notes-user');
    setUser(null);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-primary">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary text-text-primary">
      {user ? (
        <Dashboard user={user} onLogout={handleLogout} />
      ) : (
        <Login onLogin={handleLogin} />
      )}
    </div>
  );
};

export default App;
