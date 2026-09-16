"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: 'admin';
};

type AuthResult = { success: true } | { success: false; error: string };

type AdminAuthContextValue = {
  admin: AdminUser | null;
  token: string | null;
  /** True while we're checking localStorage / verifying the token on first load. */
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  logout: () => void;
};

const AdminAuthContext = createContext<AdminAuthContextValue | undefined>(undefined);

const STORAGE_KEY = 'greezo_admin_auth';

function readStoredAuth(): { token: string; admin: AdminUser } | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.token && parsed?.admin) return parsed;
    return null;
  } catch {
    return null;
  }
}

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
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

    setAdmin(stored.admin);
    setToken(stored.token);

    (async () => {
      try {
        const res = await fetch('/api/backend/auth/me', {
          headers: { Authorization: `Bearer ${stored.token}` },
        });
        const data = await res.json();
        if (!res.ok || !data.success || data.user?.role !== 'admin') {
          window.localStorage.removeItem(STORAGE_KEY);
          setAdmin(null);
          setToken(null);
        }
      } catch {
        // Network hiccup — keep the cached session rather than logging the
        // admin out just because the backend was briefly unreachable.
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const persist = useCallback((nextToken: string, nextAdmin: AdminUser) => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ token: nextToken, admin: nextAdmin })
    );
    setToken(nextToken);
    setAdmin(nextAdmin);
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      try {
        const res = await fetch('/api/backend/auth/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          return { success: false, error: data.error || 'Invalid email or password' };
        }
        persist(data.token, data.admin);
        return { success: true };
      } catch {
        return { success: false, error: "Couldn't reach the server. Please try again." };
      }
    },
    [persist]
  );

  const logout = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY);
    setAdmin(null);
    setToken(null);
  }, []);

  return (
    <AdminAuthContext.Provider value={{ admin, token, loading, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return ctx;
}
