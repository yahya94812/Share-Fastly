import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '../api/client';
import { clearAllChannelTokens, clearSession, getSession, saveSession } from '../utils/storage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => getSession());

  // Periodically check whether the access token has expired so a stale
  // session doesn't silently linger while the user is on the page.
  useEffect(() => {
    const interval = setInterval(() => {
      const current = getSession();
      if (!current && session) {
        setSession(null);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [session]);

  const login = useCallback(async (email, password) => {
    const data = await api.login(email, password);
    saveSession(data.access_token, data.username);
    setSession({ accessToken: data.access_token, username: data.username });
    return data;
  }, []);

  const signup = useCallback(async (email, password) => {
    const data = await api.signup(email, password);
    saveSession(data.access_token, data.username);
    setSession({ accessToken: data.access_token, username: data.username });
    return data;
  }, []);

  const logout = useCallback(() => {
    clearSession();
    clearAllChannelTokens();
    setSession(null);
  }, []);

  return (
    <AuthContext.Provider value={{ session, login, signup, logout, isAuthenticated: !!session }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
