"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';

export type AuthUser = {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  role: 'user';
};

type AuthResult = { success: true } | { success: false; error: string };

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  /** True while we're checking localStorage / verifying the token on first load. */
  loading: boolean;
  login: (phone: string, password: string) => Promise<AuthResult>;
  register: (
    name: string,
    phone: string,
    password: string,
    email?: string
  ) => Promise<AuthResult>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = 'greezo_auth';

function readStoredAuth(): { token: string; user: AuthUser } | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.token && parsed?.user) return parsed;
    return null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // On mount, load whatever we have in localStorage, then verify the token
  // is still valid against the backend (in case it expired or was revoked).
  useEffect(() => {
    const stored = readStoredAuth();
    if (!stored) {
      setLoading(false);
      return;
    }

    setUser(stored.user);
    setToken(stored.token);

    (async () => {
      try {
        const res = await fetch('/api/backend/auth/me', {
          headers: { Authorization: `Bearer ${stored.token}` },
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          window.localStorage.removeItem(STORAGE_KEY);
          setUser(null);
          setToken(null);
        }
      } catch {
        // Network hiccup — keep the cached session rather than logging the
        // person out just because the backend was briefly unreachable.
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const persist = useCallback((nextToken: string, nextUser: AuthUser) => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ token: nextToken, user: nextUser })
    );
    setToken(nextToken);
    setUser(nextUser);
  }, []);

  const login = useCallback(
    async (phone: string, password: string): Promise<AuthResult> => {
      try {
        const res = await fetch('/api/backend/auth/user/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone, password }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          return { success: false, error: data.error || 'Invalid phone number or password' };
        }
        persist(data.token, data.user);
        return { success: true };
      } catch {
        return { success: false, error: "Couldn't reach the server. Please try again." };
      }
    },
    [persist]
  );

  const register = useCallback(
    async (name: string, phone: string, password: string, email?: string): Promise<AuthResult> => {
      try {
        const res = await fetch('/api/backend/auth/user/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, phone, password, email: email || undefined }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          return { success: false, error: data.error || 'Registration failed' };
        }
        persist(data.token, data.user);
        return { success: true };
      } catch {
        return { success: false, error: "Couldn't reach the server. Please try again." };
      }
    },
    [persist]
  );

  const logout = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY);
    setUser(null);
    setToken(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}