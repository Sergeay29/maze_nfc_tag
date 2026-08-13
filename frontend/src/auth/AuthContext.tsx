import React, { createContext, useEffect, useMemo, useState } from 'react';
import {
  getCurrentUser,
  login as loginRequest,
  register as registerRequest,
  updateCurrentUser,
  verify2FA as verify2FARequest,
} from '../api/authApi';
import type { AuthUser, LoginCredentials, RegisterPayload } from './types';

const TOKEN_STORAGE_KEY = 'maze_nfc_auth_token';

export interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  mustSetup2FA: boolean;
  login: (credentials: LoginCredentials) => Promise<AuthUser | { requires2FA: true; tempToken: string }>;
  verify2FA: (tempToken: string, code: string, backupCode?: string) => Promise<AuthUser>;
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
  const [mustSetup2FA, setMustSetup2FA] = useState(false);

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

    if (result.requires2FA && result.tempToken) {
      return { requires2FA: true as const, tempToken: result.tempToken };
    }

    if (!result.token || !result.user) {
      throw new Error('Réponse de connexion invalide');
    }

    localStorage.setItem(TOKEN_STORAGE_KEY, result.token);
    setToken(result.token);
    setUser(result.user);
    setMustSetup2FA(Boolean(result.mustSetup2FA));

    return result.user;
  }

  async function verify2FA(tempToken: string, code: string, backupCode?: string) {
    const result = await verify2FARequest({
      tempToken,
      code: backupCode ? undefined : code,
      backupCode,
    });

    if (!result.token || !result.user) {
      throw new Error('Réponse 2FA invalide');
    }

    localStorage.setItem(TOKEN_STORAGE_KEY, result.token);
    setToken(result.token);
    setUser(result.user);
    setMustSetup2FA(Boolean(result.mustSetup2FA));

    return result.user;
  }

  async function register(payload: RegisterPayload) {
    const result = await registerRequest(payload);

    if (!result.token || !result.user) {
      throw new Error('Réponse inscription invalide');
    }

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
      if (currentUser.twoFactorEnabled) {
        setMustSetup2FA(false);
      }
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
    setMustSetup2FA(false);
  }

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      mustSetup2FA,
      login,
      verify2FA,
      register,
      logout,
      refreshUser,
      updateUserEnterprise,
      updateUser,
      setUser,
    }),
    [user, token, loading, mustSetup2FA]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
