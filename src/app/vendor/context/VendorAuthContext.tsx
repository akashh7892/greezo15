"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';

export type VendorUser = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  referralCode: string;
  payoutMethod?: string | null;
  payoutDetails?: Record<string, any> | null;
  role: 'vendor';
};

type AuthResult = { success: true } | { success: false; error: string };

type RegisterInput = {
  name: string;
  email: string;
  phone?: string;
  password: string;
  payoutMethod?: string;
  payoutDetails?: Record<string, any>;
};

type VendorAuthContextValue = {
  vendor: VendorUser | null;
  token: string | null;
  /** True while we're checking localStorage / verifying the token on first load. */
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (input: RegisterInput) => Promise<AuthResult>;
  logout: () => void;
  /** Merge new fields into the cached vendor (e.g. after a profile update). */
  updateVendor: (patch: Partial<VendorUser>) => void;
};

const VendorAuthContext = createContext<VendorAuthContextValue | undefined>(undefined);

const STORAGE_KEY = 'greezo_vendor_auth';

function readStoredAuth(): { token: string; vendor: VendorUser } | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.token && parsed?.vendor) return parsed;
    return null;
  } catch {
    return null;
  }
}

export function VendorAuthProvider({ children }: { children: ReactNode }) {
  const [vendor, setVendor] = useState<VendorUser | null>(null);
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

    setVendor(stored.vendor);
    setToken(stored.token);

    (async () => {
      try {
        const res = await fetch('/api/backend/auth/me', {
          headers: { Authorization: `Bearer ${stored.token}` },
        });
        const data = await res.json();
        if (!res.ok || !data.success || data.user?.role !== 'vendor') {
          window.localStorage.removeItem(STORAGE_KEY);
          setVendor(null);
          setToken(null);
        }
      } catch {
        // Network hiccup — keep the cached session rather than logging the
        // vendor out just because the backend was briefly unreachable.
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const persist = useCallback((nextToken: string, nextVendor: VendorUser) => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ token: nextToken, vendor: nextVendor })
    );
    setToken(nextToken);
    setVendor(nextVendor);
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      try {
        const res = await fetch('/api/backend/auth/vendor/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          return { success: false, error: data.error || 'Invalid email or password' };
        }
        persist(data.token, data.vendor);
        return { success: true };
      } catch {
        return { success: false, error: "Couldn't reach the server. Please try again." };
      }
    },
    [persist]
  );

  const register = useCallback(
    async (input: RegisterInput): Promise<AuthResult> => {
      try {
        const res = await fetch('/api/backend/auth/vendor/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          return { success: false, error: data.error || 'Registration failed' };
        }
        persist(data.token, data.vendor);
        return { success: true };
      } catch {
        return { success: false, error: "Couldn't reach the server. Please try again." };
      }
    },
    [persist]
  );

  const logout = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY);
    setVendor(null);
    setToken(null);
  }, []);

  const updateVendor = useCallback(
    (patch: Partial<VendorUser>) => {
      setVendor((prev) => {
        if (!prev) return prev;
        const next = { ...prev, ...patch };
        if (token) {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, vendor: next }));
        }
        return next;
      });
    },
    [token]
  );

  return (
    <VendorAuthContext.Provider
      value={{ vendor, token, loading, login, register, logout, updateVendor }}
    >
      {children}
    </VendorAuthContext.Provider>
  );
}

export function useVendorAuth() {
  const ctx = useContext(VendorAuthContext);
  if (!ctx) {
    throw new Error('useVendorAuth must be used within a VendorAuthProvider');
  }
  return ctx;
}