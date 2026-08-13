import React, { createContext, useEffect, useMemo, useState } from 'react';
import {
  clientLogin as clientLoginRequest,
  getCurrentClient,
} from '../../api/clientAuthApi';
import type { ClientLoginCredentials, ClientUser } from './types';

const CLIENT_TOKEN_STORAGE_KEY = 'maze_nfc_client_token';

export interface ClientAuthContextValue {
  client: ClientUser | null;
  token: string | null;
  loading: boolean;
  login: (credentials: ClientLoginCredentials) => Promise<ClientUser>;
  logout: () => void;
  refreshClient: () => Promise<void>;
}

export const ClientAuthContext = createContext<ClientAuthContextValue | undefined>(undefined);

export const ClientAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [client, setClient] = useState<ClientUser | null>(null);
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem(CLIENT_TOKEN_STORAGE_KEY)
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
        const currentClient = await getCurrentClient(token);
        if (!cancelled) {
          setClient(currentClient);
        }
      } catch {
        localStorage.removeItem(CLIENT_TOKEN_STORAGE_KEY);
        if (!cancelled) {
          setToken(null);
          setClient(null);
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

  const login = async (credentials: ClientLoginCredentials) => {
    const result = await clientLoginRequest(credentials);
    localStorage.setItem(CLIENT_TOKEN_STORAGE_KEY, result.token);
    setToken(result.token);
    setClient(result.client);
    return result.client;
  };

  const logout = () => {
    localStorage.removeItem(CLIENT_TOKEN_STORAGE_KEY);
    setToken(null);
    setClient(null);
  };

  const refreshClient = async () => {
    if (!token) return;
    const currentClient = await getCurrentClient(token);
    setClient(currentClient);
  };

  const value = useMemo(
    () => ({
      client,
      token,
      loading,
      login,
      logout,
      refreshClient,
    }),
    [client, token, loading]
  );

  return (
    <ClientAuthContext.Provider value={value}>
      {children}
    </ClientAuthContext.Provider>
  );
};
