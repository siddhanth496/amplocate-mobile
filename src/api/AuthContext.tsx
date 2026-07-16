import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getToken, setToken } from './client';
import { getMe } from './endpoints';

type User = { id: string; phone: string; name: string | null };
type Status = 'loading' | 'authenticated' | 'unauthenticated';

type AuthValue = {
  status: Status;
  user: User | null;
  signIn: (token: string) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>('loading');
  const [user, setUser] = useState<User | null>(null);

  const load = useCallback(async () => {
    const token = await getToken();
    if (!token) { setStatus('unauthenticated'); setUser(null); return; }
    try {
      const me = await getMe();
      setUser(me);
      setStatus('authenticated');
    } catch {
      await setToken(null);
      setUser(null);
      setStatus('unauthenticated');
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const signIn = useCallback(async (token: string) => {
    await setToken(token);
    setStatus('loading');
    await load();
  }, [load]);

  const signOut = useCallback(async () => {
    await setToken(null);
    setUser(null);
    setStatus('unauthenticated');
  }, []);

  return (
    <AuthContext.Provider value={{ status, user, signIn, signOut, refresh: load }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
