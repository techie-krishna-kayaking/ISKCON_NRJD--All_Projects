import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('ab_user');
    const token = localStorage.getItem('ab_token');
    if (stored && token) {
      setUser(JSON.parse(stored));
      // Verify token is still valid
      api.get('/auth/me').then((res) => {
        setUser(res.data.user);
        localStorage.setItem('ab_user', JSON.stringify(res.data.user));
      }).catch(() => {
        logout();
      }).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('ab_token', res.data.token);
    localStorage.setItem('ab_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data;
  };

  const register = async (data) => {
    const res = await api.post('/auth/register', data);
    localStorage.setItem('ab_token', res.data.token);
    localStorage.setItem('ab_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('ab_token');
    localStorage.removeItem('ab_user');
    setUser(null);
  };

  const hasRole = (role) => {
    return user?.roles?.includes(role);
  };

  const isAdmin = () => hasRole('admin');
  const isStockTeam = () => hasRole('stock_team') || hasRole('admin');
  const isProcurement = () => hasRole('procurement') || hasRole('admin');

  return (
    <AuthContext.Provider value={{
      user, loading, login, register, logout,
      hasRole, isAdmin, isStockTeam, isProcurement,
      isAuthenticated: !!user,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
