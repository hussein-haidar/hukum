"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n";

interface Glosarium {
  id: number;
  term: string;
  definition: string;
  letter: string;
}

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export default function GlosariumContent({ glossaries }: { glossaries: Glosarium[] }) {
  const { t } = useI18n();
  const [selectedLetter, setSelectedLetter] = useState("A");
  const [search, setSearch] = useState("");

  const filtered = glossaries.filter((g) => {
    if (search) {
      return (
        g.term.toLowerCase().includes(search.toLowerCase()) ||
        g.definition.toLowerCase().includes(search.toLowerCase())
      );
    }
    return g.letter === selectedLetter;
  });

  const lettersWithContent = new Set(glossaries.map((g) => g.letter));

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2 dark:text-gray-100">{t("glosarium.title")}</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">{t("glosarium.subtitle")}</p>

      <input
        type="text"
        placeholder={t("glosarium.searchPlaceholder")}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="input-field mb-6"
      />

      {!search && (
        <div className="flex flex-wrap gap-1.5 mb-8">
          {alphabet.map((letter) => (
            <button
              key={letter}
              onClick={() => setSelectedLetter(letter)}
              disabled={!lettersWithContent.has(letter)}
              className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                selectedLetter === letter
                  ? "bg-amber-600 text-white"
                  : lettersWithContent.has(letter)
                  ? "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                  : "bg-gray-100 text-gray-300 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600"
              }`}
            >
              {letter}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-3">
        {filtered.length === 0 && (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">{t("glosarium.notFound")}</p>
        )}
        {filtered.map((g) => (
          <div key={g.id} className="card">
            <div className="flex items-start gap-3">
              <span className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 flex items-center justify-center font-bold flex-shrink-0">
                {g.letter}
              </span>
              <div>
                <h3 className="font-semibold text-lg dark:text-gray-100">{g.term}</h3>
                <p className="text-gray-600 dark:text-gray-400 mt-1">{g.definition}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}