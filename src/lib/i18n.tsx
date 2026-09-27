"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { translations, Lang } from "./translations";

interface I18nContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextValue>({
  lang: "id",
  setLang: () => {},
  t: (k) => k,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("id");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("hukumku-lang");
      if (stored === "en" || stored === "id") setLangState(stored);
    } catch {
      // abaikan bila storage tidak tersedia
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    try {
      window.localStorage.setItem("hukumku-lang", lang);
    } catch {
      // abaikan bila storage tidak tersedia
    }
  }, [lang]);

  const setLang = (l: Lang) => setLangState(l);

  const t = (key: string) =>
    translations[lang][key] ?? translations.id[key] ?? key;

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}