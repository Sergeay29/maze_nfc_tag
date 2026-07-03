import React, { createContext, useEffect, useMemo, useState } from 'react';
import { getCurrentUser, login as loginRequest, register as registerRequest, updateCurrentUser } from '../api/authApi';
import type { AuthUser, LoginCredentials, RegisterPayload } from './types';

const TOKEN_STORAGE_KEY = 'maze_nfc_auth_token';

export interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<AuthUser>;
  register: (payload: RegisterPayload) => Promise<AuthUser>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateUserEnterprise: (patch: Partial<NonNullable<AuthUser['enterprise']>>) => void;
  updateUser: (body: { firstName?: string; lastName?: string; email?: string }) => Promise<void>;
  setUser: React.Dispatch<React.SetStateAction<AuthUser | null>>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem(TOKEN_STORAGE_KEY)
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const currentUser = await getCurrentUser(token);

        if (!cancelled) {
          setUser(currentUser);
        }
      } catch {
        localStorage.removeItem(TOKEN_STORAGE_KEY);

        if (!cancelled) {
          setToken(null);
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    restoreSession();

    return () => {
      cancelled = true;
    };
  }, [token]);

  async function login(credentials: LoginCredentials) {
    const result = await loginRequest(credentials);

    localStorage.setItem(TOKEN_STORAGE_KEY, result.token);
    setToken(result.token);
    setUser(result.user);

    return result.user;
  }

  async function register(payload: RegisterPayload) {
    const result = await registerRequest(payload);

    localStorage.setItem(TOKEN_STORAGE_KEY, result.token);
    setToken(result.token);
    setUser(result.user);

    return result.user;
  }

  async function refreshUser() {
    if (!token) return;
    try {
      const currentUser = await getCurrentUser(token);
      setUser(currentUser);
    } catch {
      logout();
    }
  }

  async function updateUser(body: { firstName?: string; lastName?: string; email?: string }) {
    if (!token) return;
    const updated = await updateCurrentUser(token, body);
    setUser(updated);
  }

  function updateUserEnterprise(patch: Partial<NonNullable<AuthUser['enterprise']>>) {
    setUser((prev) =>
      prev ? { ...prev, enterprise: prev.enterprise ? { ...prev.enterprise, ...patch } : prev.enterprise } : prev
    );
  }

  function logout() {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken(null);
    setUser(null);
  }

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      login,
      register,
      logout,
      refreshUser,
      updateUserEnterprise,
      updateUser,
      setUser,
    }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
