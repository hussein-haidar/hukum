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

  useEffect(() => {
    Promise.all([
      fetch("/api/faq").then((r) => r.json()),
      fetch("/api/template").then((r) => r.json()),
      fetch("/api/glosarium").then((r) => r.json()),
      fetch("/api/admin/sync").then((r) => r.json()),
    ]).then(([faq, template, glosarium, sync]) => {
      setStats({
        faq: faq.length,
        template: template.length,
        glosarium: glosarium.length,
        legalDocuments: sync.data?.totalDocuments || 0,
      });
    });
  }, []);

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
    </div>
  );
}
