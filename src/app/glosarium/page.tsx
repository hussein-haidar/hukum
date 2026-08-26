"use client";

import { useState, useEffect } from "react";

interface Glosarium {
  id: number;
  term: string;
  definition: string;
  letter: string;
}

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export default function GlosariumPage() {
  const [glossaries, setGlossaries] = useState<Glosarium[]>([]);
  const [selectedLetter, setSelectedLetter] = useState("A");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/glosarium")
      .then((res) => res.json())
      .then((data) => setGlossaries(data));
  }, []);

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
      <h1 className="text-3xl font-bold mb-2">Glosarium Hukum</h1>
      <p className="text-gray-600 mb-8">Kamus istilah hukum Indonesia dengan penjelasan sederhana</p>

      <input
        type="text"
        placeholder="Cari istilah hukum..."
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
                  ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  : "bg-gray-100 text-gray-300 cursor-not-allowed"
              }`}
            >
              {letter}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-3">
        {filtered.length === 0 && (
          <p className="text-gray-500 text-center py-8">Tidak ada istilah ditemukan.</p>
        )}
        {filtered.map((g) => (
          <div key={g.id} className="card">
            <div className="flex items-start gap-3">
              <span className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold flex-shrink-0">
                {g.letter}
              </span>
              <div>
                <h3 className="font-semibold text-lg">{g.term}</h3>
                <p className="text-gray-600 mt-1">{g.definition}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
