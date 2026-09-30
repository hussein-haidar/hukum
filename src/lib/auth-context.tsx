"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";

export interface PublicUser {
  id: number;
  name: string | null;
  email: string;
  picture: string | null;
}

interface AuthContextValue {
  user: PublicUser | null;
  loading: boolean;
  login: (token: string, user: PublicUser) => void;
  logout: () => void;
  refresh: () => void;
}

const TOKEN_PREFIX = "hk_user_";
const TOKEN_TTL_MS = 30 * 60 * 1000;

function getTokenExpiry(token: string | null): number | null {
  if (!token) return null;
  try {
    const raw = token.slice(TOKEN_PREFIX.length);
    const decoded = atob(raw);
    const createdAt = parseInt(decoded.split(":")[1], 10);
    if (!createdAt) return null;
    return new Date(createdAt).getTime() + TOKEN_TTL_MS;
  } catch {
    return null;
  }
}

function getStoredToken(): string | null {
  try {
    return window.localStorage.getItem("hukumku_user_token");
  } catch {
    return null;
  }
}

function clearStoredToken() {
  try {
    window.localStorage.removeItem("hukumku_user_token");
  } catch {
    // ignore
  }
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  login: () => {},
  logout: () => {},
  refresh: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);
  const logoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const verifyIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimers = () => {
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }
    if (verifyIntervalRef.current) {
      clearInterval(verifyIntervalRef.current);
      verifyIntervalRef.current = null;
    }
  };

  const logout = useCallback(() => {
    clearTimers();
    clearStoredToken();
    setUser(null);
    setLoading(false);
  }, []);

  const refresh = useCallback(() => {
    const token = getStoredToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch("/api/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.user) {
          setUser(data.user);
          // Jadwalkan logout otomatis pada saat token kedaluwarsa.
          clearTimers();
          const expiry = getTokenExpiry(token);
          if (expiry && expiry > Date.now()) {
            logoutTimerRef.current = setTimeout(() => {
              logout();
            }, expiry - Date.now());
          }
        } else {
          logout();
        }
      })
      .catch(() => {
        logout();
      })
      .finally(() => setLoading(false));
  }, [logout]);

  useEffect(() => {
    refresh();
    // Cek berkala agar sesi yang sudah tidak valid otomatis ter-logout.
    verifyIntervalRef.current = setInterval(() => {
      if (getStoredToken()) {
        fetch("/api/auth/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: getStoredToken() }),
        })
          .then((r) => r.json())
          .then((data) => {
            if (!(data.success && data.user)) logout();
          })
          .catch(() => {});
      }
    }, 60000);

    return () => {
      clearTimers();
    };
  }, [refresh, logout]);

  const login = useCallback(
    (token: string, newUser: PublicUser) => {
      try {
        window.localStorage.setItem("hukumku_user_token", token);
      } catch {
        // ignore
      }
      clearTimers();
      const expiry = getTokenExpiry(token);
      if (expiry && expiry > Date.now()) {
        logoutTimerRef.current = setTimeout(() => {
          logout();
        }, expiry - Date.now());
      }
      setUser(newUser);
      setLoading(false);
    },
    [logout]
  );

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}