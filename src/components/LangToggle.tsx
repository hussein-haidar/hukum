"use client";

import { useI18n } from "@/lib/i18n";

export default function LangToggle() {
  const { lang, setLang } = useI18n();

  return (
    <button
      onClick={() => setLang(lang === "id" ? "en" : "id")}
      title={lang === "id" ? "English" : "Bahasa Indonesia"}
      aria-label="Change language"
      className="px-2 py-1 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
    >
      {lang === "id" ? "EN" : "ID"}
    </button>
  );
}