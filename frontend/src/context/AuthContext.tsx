import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, tokenStore } from '../lib/api';
import type { User } from '../types';

interface AuthState {
  user: User | null | undefined; // undefined = checking
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, businessType?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState>({} as AuthState);

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    const token = tokenStore.get();
    if (!token) {
      setUser(null);
      return;
    }
    api
      .me()
      .then(setUser)
      .catch(() => {
        tokenStore.clear();
        setUser(null);
      });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { token, user } = await api.login({ email, password });
    tokenStore.set(token);
    setUser(user);
  }, []);

  const register = useCallback(
    async (name: string, email: string, password: string, businessType?: string) => {
      const { token, user } = await api.register({ name, email, password, businessType });
      tokenStore.set(token);
      setUser(user);
    },
    [],
  );

  const logout = useCallback(() => {
    api.logout().catch(() => {});
    tokenStore.clear();
    setUser(null);
  }, []);

  return <AuthContext.Provider value={{ user, login, register, logout }}>{children}</AuthContext.Provider>;
}
