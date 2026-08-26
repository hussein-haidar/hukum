"use client";

import { useState, useEffect } from "react";

interface Template {
  id: number;
  title: string;
  slug: string;
  description: string;
  content: string;
  category: string;
}

export default function AdminTemplatePage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ title: "", slug: "", description: "", content: "", category: "Kuasa" });
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetch("/api/template").then((r) => r.json()).then(setTemplates);
  }, []);

  const save = async () => {
    const method = editingId ? "PUT" : "POST";
    const url = editingId ? `/api/template/${editingId}` : "/api/template";
    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const updated = await fetch("/api/template").then((r) => r.json());
    setTemplates(updated);
    setForm({ title: "", slug: "", description: "", content: "", category: "Kuasa" });
    setEditingId(null);
    setShowForm(false);
  };

  const del = async (id: number) => {
    if (!confirm("Hapus template ini?")) return;
    await fetch(`/api/template/${id}`, { method: "DELETE" });
    setTemplates(templates.filter((t) => t.id !== id));
  };

  const edit = (t: Template) => {
    setForm({ title: t.title, slug: t.slug, description: t.description, content: t.content, category: t.category });
    setEditingId(t.id);
    setShowForm(true);
  };

  const autoSlug = (title: string) => {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Kelola Template Surat</h1>
        <button onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ title: "", slug: "", description: "", content: "", category: "Kuasa" }); }} className="btn-primary">
          + Tambah Template
        </button>
      </div>

      {showForm && (
        <div className="card mb-6 space-y-3">
          <h3 className="font-semibold">{editingId ? "Edit Template" : "Tambah Template Baru"}</h3>
          <input placeholder="Judul" value={form.title} onChange={(e) => { setForm({ ...form, title: e.target.value, slug: autoSlug(e.target.value) }); }} className="input-field" />
          <input placeholder="Slug (otomatis)" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="input-field bg-gray-50" />
          <input placeholder="Deskripsi" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field" />
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input-field">
            {["Kuasa", "Gugatan", "Somasi", "Perjanjian"].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <textarea placeholder="Isi template (gunakan [NAMA] untuk placeholder)" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className="input-field" rows={10} />
          <div className="flex gap-2">
            <button onClick={save} className="btn-primary">{editingId ? "Update" : "Simpan"}</button>
            <button onClick={() => { setShowForm(false); setEditingId(null); }} className="btn-secondary">Batal</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {templates.map((t) => (
          <div key={t.id} className="card flex justify-between items-start">
            <div className="flex-1">
              <span className="badge bg-green-100 text-green-700 text-xs">{t.category}</span>
              <h3 className="font-medium mt-1">{t.title}</h3>
              <p className="text-sm text-gray-600 mt-1">{t.description}</p>
            </div>
            <div className="flex gap-2 ml-4 flex-shrink-0">
              <button onClick={() => edit(t)} className="text-blue-600 hover:text-blue-800 text-sm">Edit</button>
              <button onClick={() => del(t.id)} className="text-red-600 hover:text-red-800 text-sm">Hapus</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
