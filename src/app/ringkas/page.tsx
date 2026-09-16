"use client";

import { useState } from "react";

function cleanMarkdown(raw: string): string {
  const lines = raw.split("\n");
  const output: string[] = [];
  let counter = 0;

  for (const line of lines) {
    let l = line;

    l = l.replace(/^#{1,6}\s*/, "");

    l = l.replace(/\*\*(.*?)\*\*/g, "$1");
    l = l.replace(/__(.*?)__/g, "$1");
    l = l.replace(/\*(.*?)\*/g, "$1");
    l = l.replace(/`(.*?)`/g, "$1");

    const bullet = l.match(/^\s*(?:[-*•])\s+(.*)$/);
    if (bullet) {
      counter += 1;
      output.push(`${counter}. ${bullet[1].trim()}`);
      continue;
    }

    const numbered = l.match(/^\s*(\d+)[.)]\s+(.*)$/);
    if (numbered) {
      output.push(`${numbered[1]}. ${numbered[2].trim()}`);
      continue;
    }

    const trimmed = l.trim();
    if (!trimmed) {
      output.push("");
      counter = 0;
      continue;
    }

    output.push(trimmed);
  }

  return output
    .map((s) => s.replace(/[#*]+$/g, "").replace(/\s+/g, " ").trim())
    .filter((s, i, arr) => !(s === "" && (i === 0 || arr[i - 1] === "")))
    .join("\n");
}

export default function RingkasPage() {
  const [input, setInput] = useState("");
  const [hasil, setHasil] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRingkas = async () => {
    if (!input.trim() || loading) return;
    setLoading(true);
    setHasil("");

    try {
      const res = await fetch("/api/ai/ringkas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input.trim() }),
      });
      const data = await res.json();
      setHasil(cleanMarkdown(data.summary || "Gagal merangkum dokumen."));
    } catch {
      setHasil("Gagal terhubung ke server. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Ringkas Dokumen Hukum</h1>
      <p className="text-gray-600 mb-8">
        Tempel teks UU, peraturan, atau dokumen hukum lainnya, dapatkan ringkasan
        dalam bahasa sederhana.
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Teks Dokumen Hukum
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={12}
            placeholder="Tempel teks dokumen hukum di sini...&#10;&#10;Contoh: Pasal-pasal dari Undang-Undang, putusan pengadilan, atau peraturan daerah."
            className="input-field resize-none"
          />
        </div>

        <button
          onClick={handleRingkas}
          disabled={loading || !input.trim()}
          className="btn-primary disabled:opacity-50"
        >
          {loading ? "Merangkum..." : "Ringkas Sekarang"}
        </button>

        {hasil && (
          <div className="card bg-teal-50 border border-teal-200">
            <h3 className="font-semibold text-teal-800 mb-2">Ringkasan:</h3>
            <div className="text-gray-700 whitespace-pre-wrap leading-loose">{hasil}</div>
          </div>
        )}

        <p className="text-xs text-gray-400">
          ⚠️ Ringkasan dibuat oleh AI dan mungkin tidak 100% akurat. Selalu verifikasi
          dengan dokumen asli.
        </p>
      </div>
    </div>
  );
}
