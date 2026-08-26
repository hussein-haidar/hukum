"use client";

import { useState } from "react";
import Link from "next/link";

export default function AdminApiKeyPage() {
  const [apiKey, setApiKey] = useState("");
  const [status, setStatus] = useState("");
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  // Fungsi simpan dan langsung test koneksi
  const handleSave = async () => {
    if (!apiKey.trim()) {
      setStatus("API Key tidak boleh kosong");
      return;
    }
    // Simpan ke global state
    ;(globalThis as any).GROQ_API_KEY = apiKey;
    
    // Lakukan test koneksi langsung
    setStatus("Mengecek koneksi...");
    setTesting(true);
    setTestResult(null);
    
    try {
      const res = await fetch("/api/admin/api-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey, action: "test" }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus("Disimpan dan terhubung ✅");
        setTestResult("✅ " + data.message);
      } else {
        setStatus("Disimpan tapi koneksi gagal ❌");
        setTestResult("❌ " + data.message);
      }
    } catch (error) {
      setStatus("Disimpan tapi gagal cek koneksi ❌");
      setTestResult("❌ Gagal terhubung ke server: " + (error instanceof Error ? error.message : "Unknown"));
    } finally {
      setTesting(false);
    }
    setApiKey("");
  };

  const handleTest = () => {
    if (!apiKey.trim()) {
      setTestResult("Masukkan terlebih dahulu");
      return;
    }
    if (apiKey.startsWith("gsk_")) {
      setTestResult("✅ Valid");
    } else {
      setTestResult("❌ Format salah");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 flex flex-col items-center justify-center">
      <div className="bg-white rounded-xl p-8 w-full max-w-md shadow-lg">
        <h1 className="text-2xl font-bold text-center text-blue-700 mb-6">
          Pengelolaan Groq API Key
        </h1>

        {status && (
          <div className="bg-green-100 text-green-800 p-2 rounded mb-4 text-center">
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
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Simpan API Key
          </button>
        </form>

        {testResult && (
          <div className="mt-4 text-center">
            <span className={`text-lg font-medium ${
              testResult.startsWith("✅") ? "text-green-600" : "text-red-600"
            }`}>
              {testResult}
            </span>
          </div>
        )}

        {/* TOMBOL BARU: DAPATKAN API KEY GROQ AI */}
        <div className="mt-6 w-full text-center">
          <a
            href="https://console.groq.com/keys"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors text-sm">
            Dapatkan API Key Groq AI
          </a>
        </div>


      </div>
    </div>
  );
}