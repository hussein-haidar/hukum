"use client";

import Link from "next/link";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";

interface Template {
  id: number;
  title: string;
  slug: string;
  description: string;
  category: string;
}

export default function TemplateSuratList({ templates }: { templates: Template[] }) {
  const { t } = useI18n();
  const allLabel = t("template.all");
  const [selectedCategory, setSelectedCategory] = useState(allLabel);

  const filtered = templates.filter(
    (tpl) => selectedCategory === allLabel || tpl.category === selectedCategory
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2 dark:text-gray-100">{t("template.title")}</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">{t("template.subtitle")}</p>

      <div className="flex flex-wrap gap-2 mb-8">
        {[allLabel, ...Array.from(new Set(templates.map((tpl) => tpl.category).filter(Boolean)))].map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === cat
                ? "bg-green-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map((tpl) => (
          <Link key={tpl.id} href={`/template-surat/${tpl.slug}`}>
            <div className="card cursor-pointer h-full">
              <span className="badge bg-green-100 text-green-700 dark:bg-gray-700 dark:text-green-300 mb-3">{tpl.category}</span>
              <h3 className="font-semibold text-lg mb-2 dark:text-gray-100">{tpl.title}</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">{tpl.description}</p>
              <div className="mt-4 text-green-600 dark:text-green-400 text-sm font-medium">
                {t("template.use")}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}