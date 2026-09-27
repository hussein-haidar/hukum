"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n";

export default function Footer() {
  const [templateVisible, setTemplateVisible] = useState(false);
  const { t } = useI18n();

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => setTemplateVisible(!!d.templateSuratVisible))
      .catch(() => {});
  }, []);

  return (
    <footer className="bg-gray-800 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <span className="text-2xl">⚖️</span>
              <span className="text-xl font-bold text-white">HukumKu</span>
            </div>
            <p className="text-sm text-gray-400">{t("footer.tagline")}</p>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-3">{t("footer.features")}</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="/faq" className="hover:text-white">{t("nav.faq")}</a></li>
              {templateVisible && (
                <li><a href="/template-surat" className="hover:text-white">{t("nav.template")}</a></li>
              )}
              <li><a href="/kalkulator" className="hover:text-white">{t("nav.kalkulator")}</a></li>
              <li><a href="/glosarium" className="hover:text-white">{t("nav.glosarium")}</a></li>
              <li><a href="/bantuan-hukum" className="hover:text-white">{t("nav.bantuan")}</a></li>
              <li><a href="/tentang" className="hover:text-white">{t("nav.tentang")}</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-3">{t("footer.aiTools")}</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="/chatbot" className="hover:text-white">{t("nav.chatbot")}</a></li>
              <li><a href="/ringkas" className="hover:text-white">{t("nav.ringkas")}</a></li>
              <li><a href="/dokumen" className="hover:text-white">{t("nav.peraturan")}</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-3">{t("footer.disclaimer")}</h3>
            <p className="text-sm text-gray-400">{t("footer.disclaimerText")}</p>
          </div>
        </div>
        <div className="border-t border-gray-700 mt-8 pt-6 text-center text-sm text-gray-500">
          {t("footer.copyright")}
        </div>
      </div>
    </footer>
  );
}