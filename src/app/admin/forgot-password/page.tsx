"use client";

import { useState } from "react";
import Link from "next/link";

export default function AdminForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/admin/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (data.success) {
        setMessage(data.message);
      } else {
        setError(data.message || "Gagal mengirim email reset");
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
          <span className="text-4xl">🔐</span>
          <h1 className="text-2xl font-bold mt-2">Lupa Password</h1>
          <p className="text-gray-500 text-sm">Masukkan email untuk reset password</p>
        </div>

        <form onSubmit={handleForgotPassword} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-2 rounded-lg text-sm">{error}</div>
          )}
          {message && (
            <div className="bg-green-50 text-green-700 px-4 py-2 rounded-lg text-sm">{message}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              required
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
            {loading ? "Mengirim..." : "Kirim Link Reset"}
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-gray-600">
          <Link href="/admin/login" className="text-blue-600 hover:underline">
            ← Kembali ke Login
          </Link>
        </div>
      </div>
    </div>
  );
}