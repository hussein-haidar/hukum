"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password !== confirmPassword) {
      setError("Password tidak cocok");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password minimal 6 karakter");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/admin/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();

      if (data.success) {
        setMessage("Password berhasil direset. Mengalihkan ke login...");
        setTimeout(() => router.push("/admin/login"), 2000);
      } else {
        setError(data.message || "Gagal reset password");
      }
    } catch {
      setError("Gagal terhubung ke server");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="text-center">
        <div className="bg-red-50 text-red-700 px-4 py-2 rounded-lg text-sm mb-4">
          Token reset tidak valid
        </div>
        <Link href="/admin/forgot-password" className="text-blue-600 hover:underline">
          Minta link reset baru
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleResetPassword} className="space-y-4">
      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-2 rounded-lg text-sm">{error}</div>
      )}
      {message && (
        <div className="bg-green-50 text-green-700 px-4 py-2 rounded-lg text-sm">{message}</div>
      )}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Password Baru</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input-field"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Konfirmasi Password</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="input-field"
          required
        />
      </div>
      <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
        {loading ? "Mereset..." : "Reset Password"}
      </button>
    </form>
  );
}

export default function AdminResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="card max-w-md w-full">
        <div className="text-center mb-6">
          <span className="text-4xl">🔑</span>
          <h1 className="text-2xl font-bold mt-2">Reset Password</h1>
          <p className="text-gray-500 text-sm">Masukkan password baru Anda</p>
        </div>

        <Suspense fallback={<div className="text-center text-gray-500">Memuat...</div>}>
          <ResetPasswordForm />
        </Suspense>

        <div className="mt-4 text-center text-sm text-gray-600">
          <Link href="/admin/login" className="text-blue-600 hover:underline">
            ← Kembali ke Login
          </Link>
        </div>
      </div>
    </div>
  );
}