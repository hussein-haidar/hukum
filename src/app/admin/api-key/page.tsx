"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function AdminApiKeyPage() {
  const [apiKey, setApiKey] = useState("");
  const [status, setStatus] = useState("");
  const [currentKey, setCurrentKey] = useState<{ hasKey: boolean; masked: string | null } | null>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    fetch("/api/admin/api-key")
      .then((r) => r.json())
      .then((data) => setCurrentKey(data))
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    if (!apiKey.trim()) {
      setStatus("API Key tidak boleh kosong");
      return;
    }
    setStatus("Menyimpan...");
    setTesting(true);
    try {
      const res = await fetch("/api/admin/api-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey, action: "save" }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus("Tersimpan ke database");
        setCurrentKey({ hasKey: true, masked: apiKey.slice(0, 7) + "..." + apiKey.slice(-4) });
      } else {
        setStatus(data.message);
      }
    } catch (error) {
      setStatus("Gagal menyimpan");
    } finally {
      setTesting(false);
      setApiKey("");
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setStatus("Mengecek koneksi...");
    try {
      const res = await fetch("/api/admin/api-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey, action: "test" }),
      });
      const data = await res.json();
      setStatus(data.success ? data.message : data.message);
    } catch (error) {
      setStatus("Gagal cek koneksi");
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 flex flex-col items-center justify-center">
      <div className="bg-white rounded-xl p-8 w-full max-w-md shadow-lg">
        <h1 className="text-2xl font-bold text-center text-blue-700 mb-6">
          Pengelolaan Groq API Key
        </h1>

        {currentKey?.hasKey && (
          <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded mb-4 text-center text-sm">
            API Key aktif: <span className="font-mono">{currentKey.masked}</span>
          </div>
        )}

        {!currentKey?.hasKey && currentKey !== null && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-3 rounded mb-4 text-center text-sm">
            Belum ada API Key tersimpan. Silakan masukkan di bawah.
          </div>
        )}

        {status && (
          <div className="bg-blue-50 text-blue-700 p-2 rounded mb-4 text-center text-sm">
            {status}
          </div>
        )}

        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Groq API Key
            </label>
            <input
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="gsk_... (dari Groq Dashboard)"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={testing}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              Simpan
            </button>
            <button
              type="button"
              onClick={handleTest}
              disabled={testing || !apiKey.trim()}
              className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors disabled:opacity-50"
            >
              Test Koneksi
            </button>
          </div>
        </form>

        <div className="mt-6 w-full text-center">
          <a
            href="https://console.groq.com/keys"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-block bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors text-sm"
          >
            Dapatkan API Key Groq AI
          </a>
        </div>
      </div>
    </div>
  );
}
