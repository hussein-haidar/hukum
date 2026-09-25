"use client";

import { useState, useEffect, useMemo } from "react";

interface FAQ {
  id: number;
  question: string;
  answer: string;
  category: string;
}

const WINDOW = 6;
const INTERVAL_MS = 4000;

export default function FaqContent({ faqs }: { faqs: FAQ[] }) {
  const [catStart, setCatStart] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const allCategories = useMemo(() => {
    const set = new Set<string>(faqs.map((f) => f.category).filter(Boolean));
    return ["Semua", ...Array.from(set).sort()];
  }, [faqs]);

  // Rotasi otomatis window kategori; berhenti saat user memilih kategori.
  useEffect(() => {
    if (allCategories.length <= WINDOW || selectedCategory !== null) return;
    const t = setInterval(() => {
      setCatStart((s) => (s + 1) % allCategories.length);
    }, INTERVAL_MS);
    return () => clearInterval(t);
  }, [allCategories.length, selectedCategory]);

  const visibleCategories =
    allCategories.length <= WINDOW || selectedCategory !== null
      ? allCategories
      : Array.from(
          { length: WINDOW },
          (_, i) => allCategories[(catStart + i) % allCategories.length]
        );

  const filtered = faqs.filter((faq) => {
    const matchCategory =
      selectedCategory === null || selectedCategory === "Semua" || faq.category === selectedCategory;
    const matchSearch =
      faq.question.toLowerCase().includes(search.toLowerCase()) ||
      faq.answer.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  const toggleCategory = (cat: string) => {
    setSelectedCategory(selectedCategory === cat ? null : cat);
    setExpandedId(null);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">FAQ Hukum</h1>
      <p className="text-gray-600 mb-8">Pertanyaan umum seputar hukum Indonesia</p>

      <input
        type="text"
        placeholder="Cari pertanyaan..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="input-field mb-4"
      />

      <div className="flex flex-wrap gap-2 mb-8">
        {visibleCategories.map((cat) => (
          <button
            key={cat}
            onClick={() => toggleCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === cat
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <p className="text-gray-500 text-center py-8">Tidak ada FAQ ditemukan.</p>
        )}
        {filtered.map((faq) => (
          <div key={faq.id} className="card">
            <button
              onClick={() => setExpandedId(expandedId === faq.id ? null : faq.id)}
              className="w-full text-left flex justify-between items-start gap-4"
            >
              <div>
                <span className="badge bg-blue-100 text-blue-700 mb-2">{faq.category}</span>
                <h3 className="font-semibold text-lg">{faq.question}</h3>
              </div>
              <span className="text-gray-400 text-2xl flex-shrink-0 mt-1">
                {expandedId === faq.id ? "−" : "+"}
              </span>
            </button>
            {expandedId === faq.id && (
              <div className="mt-4 pt-4 border-t border-gray-100 text-gray-700 leading-relaxed">
                {faq.answer}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}