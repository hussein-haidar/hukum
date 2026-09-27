"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n";

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
  const { t } = useI18n();
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
      setHasil(cleanMarkdown(data.summary || t("ringkas.gagal")));
    } catch {
      setHasil(t("ringkas.netError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2 dark:text-gray-100">{t("ringkas.title")}</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        {t("ringkas.subtitle")}
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t("ringkas.label")}
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={12}
            placeholder={t("ringkas.placeholder")}
            className="input-field resize-none"
          />
        </div>

        <button
          onClick={handleRingkas}
          disabled={loading || !input.trim()}
          className="btn-primary disabled:opacity-50 w-full sm:w-auto"
        >
          {loading ? t("ringkas.loading") : t("ringkas.button")}
        </button>

        {hasil && (
          <div className="card bg-teal-50 dark:bg-gray-800 border border-teal-200 dark:border-gray-700">
            <h3 className="font-semibold text-teal-800 dark:text-teal-300 mb-2">{t("ringkas.result")}</h3>
            <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-loose">{hasil}</div>
          </div>
        )}

        <p className="text-xs text-gray-400 dark:text-gray-500">
          {t("ringkas.warn")}
        </p>
      </div>
    </div>
  );
}
