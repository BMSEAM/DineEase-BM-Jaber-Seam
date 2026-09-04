import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authApi } from '../api/endpoints.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore the session on first load if a token is present.
  useEffect(() => {
    const token = localStorage.getItem('dineease_token');
    if (!token) {
      setLoading(false);
      return;
    }
    authApi
      .me()
      .then((res) => setUser(res.data.user))
      .catch(() => localStorage.removeItem('dineease_token'))
      .finally(() => setLoading(false));
  }, []);

  const persist = (res) => {
    localStorage.setItem('dineease_token', res.data.token);
    setUser(res.data.user);
    return res.data.user;
  };

  const login = useCallback(async (credentials) => persist(await authApi.login(credentials)), []);
  const register = useCallback(async (body) => persist(await authApi.register(body)), []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      localStorage.removeItem('dineease_token');
      setUser(null);
    }
  }, []);

  const updateUser = useCallback((u) => setUser(u), []);

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated: !!user,
    role: user?.role || null,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
