"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (data.success) {
        localStorage.setItem("admin_token", data.token);
        router.push("/admin");
      } else {
        setError(data.message || "Username atau password salah");
      }
    } catch {
      setError("Gagal terhubung ke server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="card max-w-md w-full">
        <div className="text-center mb-6">
          <span className="text-4xl">⚖️</span>
          <h1 className="text-2xl font-bold mt-2">Admin HukumKu</h1>
          <p className="text-gray-500 text-sm">Masuk untuk mengelola konten</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-2 rounded-lg text-sm">{error}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              required
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
            {loading ? "Masuk..." : "Masuk"}
          </button>
        </form>

        <div className="mt-4 space-y-2 text-center text-sm text-gray-600">
          <div>
            <Link href="/admin/forgot-password" className="text-blue-600 hover:underline">
              Lupa password?
            </Link>
          </div>
          <div>
            Belum punya akun?{" "}
            <Link href="/admin/register" className="text-blue-600 hover:underline">
              Daftar
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
