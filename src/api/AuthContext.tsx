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
  refresh: () => Promise<boolean>;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>('loading');
  const [user, setUser] = useState<User | null>(null);

  const lastError = React.useRef<string | null>(null);

  const load = useCallback(async (): Promise<boolean> => {
    const token = await getToken();
    if (!token) {
      lastError.current = 'Could not save your login on this device.';
      setStatus('unauthenticated'); setUser(null); return false;
    }
    try {
      const me = await getMe();
      setUser(me);
      setStatus('authenticated');
      return true;
    } catch (e: any) {
      // Only discard the token if the server explicitly rejected it —
      // a network hiccup / cold start shouldn't log the user out.
      if (e?.status === 401) await setToken(null);
      lastError.current = e?.message || 'Could not load your profile.';
      setUser(null);
      setStatus('unauthenticated');
      return false;
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const signIn = useCallback(async (token: string) => {
    await setToken(token);
    const ok = await load();
    if (!ok) {
      throw new Error(`Verified, but sign-in couldn't finish: ${lastError.current} Tap Verify to retry.`);
    }
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
