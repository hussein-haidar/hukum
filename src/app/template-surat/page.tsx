"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Template {
  id: number;
  title: string;
  slug: string;
  description: string;
  category: string;
}

const categories = ["Semua", "Kuasa", "Gugatan", "Somasi", "Perjanjian"];

export default function TemplatePage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("Semua");

  useEffect(() => {
    fetch("/api/template")
      .then((res) => res.json())
      .then((data) => setTemplates(data));
  }, []);

  const filtered = templates.filter(
    (t) => selectedCategory === "Semua" || t.category === selectedCategory
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Template Surat</h1>
      <p className="text-gray-600 mb-8">Template surat hukum siap pakai untuk berbagai kebutuhan</p>

      <div className="flex flex-wrap gap-2 mb-8">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === cat
                ? "bg-green-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map((t) => (
          <Link key={t.id} href={`/template-surat/${t.slug}`}>
            <div className="card cursor-pointer h-full">
              <span className="badge bg-green-100 text-green-700 mb-3">{t.category}</span>
              <h3 className="font-semibold text-lg mb-2">{t.title}</h3>
              <p className="text-gray-600 text-sm">{t.description}</p>
              <div className="mt-4 text-green-600 text-sm font-medium">
                Gunakan Template →
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
