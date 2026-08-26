"use client";

import { useState, useEffect } from "react";

interface FAQ {
  id: number;
  question: string;
  answer: string;
  category: string;
}

const categories = ["Semua", "Perdata", "Pidana", "Keluarga", "Ketenagakerjaan", "Properti", "Umum"];

export default function FAQPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/faq")
      .then((res) => res.json())
      .then((data) => setFaqs(data));
  }, []);

  const filtered = faqs.filter((faq) => {
    const matchCategory = selectedCategory === "Semua" || faq.category === selectedCategory;
    const matchSearch =
      faq.question.toLowerCase().includes(search.toLowerCase()) ||
      faq.answer.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

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
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
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
