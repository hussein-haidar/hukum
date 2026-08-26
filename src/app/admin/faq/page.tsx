"use client";

import { useState, useEffect } from "react";

interface FAQ {
  id: number;
  question: string;
  answer: string;
  category: string;
}

export default function AdminFAQPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ question: "", answer: "", category: "Perdata" });
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetch("/api/faq").then((r) => r.json()).then(setFaqs);
  }, []);

  const save = async () => {
    const method = editingId ? "PUT" : "POST";
    const url = editingId ? `/api/faq/${editingId}` : "/api/faq";
    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const updated = await fetch("/api/faq").then((r) => r.json());
    setFaqs(updated);
    setForm({ question: "", answer: "", category: "Perdata" });
    setEditingId(null);
    setShowForm(false);
  };

  const del = async (id: number) => {
    if (!confirm("Hapus FAQ ini?")) return;
    await fetch(`/api/faq/${id}`, { method: "DELETE" });
    setFaqs(faqs.filter((f) => f.id !== id));
  };

  const edit = (faq: FAQ) => {
    setForm({ question: faq.question, answer: faq.answer, category: faq.category });
    setEditingId(faq.id);
    setShowForm(true);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Kelola FAQ Hukum</h1>
        <button onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ question: "", answer: "", category: "Perdata" }); }} className="btn-primary">
          + Tambah FAQ
        </button>
      </div>

      {showForm && (
        <div className="card mb-6 space-y-3">
          <h3 className="font-semibold">{editingId ? "Edit FAQ" : "Tambah FAQ Baru"}</h3>
          <input placeholder="Pertanyaan" value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} className="input-field" />
          <textarea placeholder="Jawaban" value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} className="input-field" rows={4} />
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input-field">
            {["Perdata", "Pidana", "Keluarga", "Ketenagakerjaan", "Properti", "Umum"].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <button onClick={save} className="btn-primary">{editingId ? "Update" : "Simpan"}</button>
            <button onClick={() => { setShowForm(false); setEditingId(null); }} className="btn-secondary">Batal</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {faqs.map((faq) => (
          <div key={faq.id} className="card flex justify-between items-start">
            <div className="flex-1">
              <span className="badge bg-blue-100 text-blue-700 text-xs">{faq.category}</span>
              <h3 className="font-medium mt-1">{faq.question}</h3>
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">{faq.answer}</p>
            </div>
            <div className="flex gap-2 ml-4 flex-shrink-0">
              <button onClick={() => edit(faq)} className="text-blue-600 hover:text-blue-800 text-sm">Edit</button>
              <button onClick={() => del(faq.id)} className="text-red-600 hover:text-red-800 text-sm">Hapus</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
