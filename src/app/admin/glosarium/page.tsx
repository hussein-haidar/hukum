"use client";

import { useState, useEffect } from "react";

interface Glosarium {
  id: number;
  term: string;
  definition: string;
  letter: string;
}

export default function AdminGlosariumPage() {
  const [glossaries, setGlossaries] = useState<Glosarium[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ term: "", definition: "", letter: "A" });
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetch("/api/glosarium").then((r) => r.json()).then(setGlossaries);
  }, []);

  const save = async () => {
    const method = editingId ? "PUT" : "POST";
    const url = editingId ? `/api/glosarium/${editingId}` : "/api/glosarium";
    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const updated = await fetch("/api/glosarium").then((r) => r.json());
    setGlossaries(updated);
    setForm({ term: "", definition: "", letter: "A" });
    setEditingId(null);
    setShowForm(false);
  };

  const del = async (id: number) => {
    if (!confirm("Hapus istilah ini?")) return;
    await fetch(`/api/glosarium/${id}`, { method: "DELETE" });
    setGlossaries(glossaries.filter((g) => g.id !== id));
  };

  const edit = (g: Glosarium) => {
    setForm({ term: g.term, definition: g.definition, letter: g.letter });
    setEditingId(g.id);
    setShowForm(true);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Kelola Glosarium</h1>
        <button onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ term: "", definition: "", letter: "A" }); }} className="btn-primary">
          + Tambah Istilah
        </button>
      </div>

      {showForm && (
        <div className="card mb-6 space-y-3">
          <h3 className="font-semibold">{editingId ? "Edit Istilah" : "Tambah Istilah Baru"}</h3>
          <input placeholder="Istilah" value={form.term} onChange={(e) => setForm({ ...form, term: e.target.value, letter: e.target.value.charAt(0).toUpperCase() })} className="input-field" />
          <textarea placeholder="Definisi" value={form.definition} onChange={(e) => setForm({ ...form, definition: e.target.value })} className="input-field" rows={3} />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Huruf Indeks</label>
            <select value={form.letter} onChange={(e) => setForm({ ...form, letter: e.target.value })} className="input-field">
              {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={save} className="btn-primary">{editingId ? "Update" : "Simpan"}</button>
            <button onClick={() => { setShowForm(false); setEditingId(null); }} className="btn-secondary">Batal</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {glossaries.map((g) => (
          <div key={g.id} className="card flex justify-between items-start">
            <div className="flex-1 flex items-start gap-3">
              <span className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold flex-shrink-0">
                {g.letter}
              </span>
              <div>
                <h3 className="font-medium">{g.term}</h3>
                <p className="text-sm text-gray-600 mt-1">{g.definition}</p>
              </div>
            </div>
            <div className="flex gap-2 ml-4 flex-shrink-0">
              <button onClick={() => edit(g)} className="text-blue-600 hover:text-blue-800 text-sm">Edit</button>
              <button onClick={() => del(g.id)} className="text-red-600 hover:text-red-800 text-sm">Hapus</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
