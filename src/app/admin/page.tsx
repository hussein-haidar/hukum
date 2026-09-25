"use client";

import { useState, useEffect } from "react";

interface Stats {
  faq: number;
  template: number;
  glosarium: number;
  legalDocuments: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({ faq: 0, template: 0, glosarium: 0, legalDocuments: 0 });
  const [templateVisible, setTemplateVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/faq").then((r) => r.json()),
      fetch("/api/template").then((r) => r.json()),
      fetch("/api/glosarium").then((r) => r.json()),
      fetch("/api/admin/sync").then((r) => r.json()),
      fetch("/api/settings").then((r) => r.json()),
    ]).then(([faq, template, glosarium, sync, settings]) => {
      setStats({
        faq: faq.length,
        template: template.length,
        glosarium: glosarium.length,
        legalDocuments: sync.data?.totalDocuments || 0,
      });
      setTemplateVisible(!!settings.templateSuratVisible);
    });
  }, []);

  const toggleTemplate = async () => {
    const next = !templateVisible;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateSuratVisible: next }),
      });
      const data = await res.json();
      if (data.success) setTemplateVisible(next);
    } catch {
      // biarkan state lama tetap
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard Admin</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card bg-blue-50 border border-blue-200">
          <div className="text-3xl mb-2">❓</div>
          <div className="text-3xl font-bold text-blue-700">{stats.faq}</div>
          <div className="text-gray-600">FAQ Hukum</div>
        </div>
        <div className="card bg-green-50 border border-green-200">
          <div className="text-3xl mb-2">📝</div>
          <div className="text-3xl font-bold text-green-700">{stats.template}</div>
          <div className="text-gray-600">Template Surat</div>
        </div>
        <div className="card bg-amber-50 border border-amber-200">
          <div className="text-3xl mb-2">📖</div>
          <div className="text-3xl font-bold text-amber-700">{stats.glosarium}</div>
          <div className="text-gray-600">Glosarium Istilah</div>
        </div>
        <div className="card bg-purple-50 border border-purple-200">
          <div className="text-3xl mb-2">⚖️</div>
          <div className="text-3xl font-bold text-purple-700">{stats.legalDocuments}</div>
          <div className="text-gray-600">Dokumen Hukum</div>
        </div>
      </div>

      <div className="card mt-8 max-w-lg">
        <h2 className="text-lg font-semibold mb-1">Pengaturan Situs</h2>
        <p className="text-sm text-gray-500 mb-4">
          Kontrol fitur yang tampil di website publik.
        </p>
        <div className="flex items-center justify-between border-t pt-4">
          <div className="flex-1">
            <p className="font-medium">Halaman Template Surat</p>
            <p className="text-sm text-gray-500">
              {templateVisible
                ? "Terlihat di Navbar, Footer, dan halaman /template-surat."
                : "Tersembunyi dari navbar, footer, dan halaman publik."}
            </p>
          </div>
          <button
            onClick={toggleTemplate}
            disabled={saving}
            className={`relative inline-flex flex-shrink-0 h-7 w-13 items-center rounded-full transition-colors ml-6 ${
              templateVisible ? "bg-green-500" : "bg-gray-300"
            } ${saving ? "opacity-50 cursor-not-allowed" : ""}`}
            style={{ width: "52px" }}
            aria-label="Toggle Tampilkan Template Surat"
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                templateVisible ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}