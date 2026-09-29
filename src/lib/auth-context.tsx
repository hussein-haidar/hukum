"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

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

  const refresh = useCallback(() => {
    setLoading(true);
    try {
      const token = window.localStorage.getItem("hukumku_user_token");
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.success && data.user) {
            setUser(data.user);
          } else {
            window.localStorage.removeItem("hukumku_user_token");
            setUser(null);
          }
        })
        .catch(() => {
          setUser(null);
        })
        .finally(() => setLoading(false));
    } catch {
      setUser(null);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = (token: string, newUser: PublicUser) => {
    try {
      window.localStorage.setItem("hukumku_user_token", token);
    } catch {
      // ignore
    }
    setUser(newUser);
    setLoading(false);
  };

  const logout = () => {
    try {
      window.localStorage.removeItem("hukumku_user_token");
    } catch {
      // ignore
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}