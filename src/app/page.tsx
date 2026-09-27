"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n";

const baseFeatures = [
  { href: "/faq", icon: "❓", key: "home.faq", color: "bg-blue-50 text-blue-700" },
  { href: "/template-surat", icon: "📝", key: "home.template", color: "bg-green-50 text-green-700", templateVisibleKey: true },
  { href: "/kalkulator", icon: "🧮", key: "home.kalkulator", color: "bg-purple-50 text-purple-700" },
  { href: "/glosarium", icon: "📖", key: "home.glosarium", color: "bg-amber-50 text-amber-700" },
  { href: "/chatbot", icon: "🤖", key: "home.chatbot", color: "bg-rose-50 text-rose-700" },
  { href: "/ringkas", icon: "📄", key: "home.ringkas", color: "bg-teal-50 text-teal-700" },
  { href: "/bantuan-hukum", icon: "🤝", key: "home.bantuan", color: "bg-indigo-50 text-indigo-700" },
];

export default function HomePage() {
  const { t } = useI18n();
  const [templateVisible, setTemplateVisible] = useState(true);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => setTemplateVisible(!!d.templateSuratVisible))
      .catch(() => {});
  }, []);

  const featureKeys = baseFeatures.filter(
    (f) => !f.templateVisibleKey || templateVisible
  );

  return (
    <div>
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-20 md:py-28">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              {t("home.hero.title1")} <span className="text-blue-200">{t("home.hero.title2")}</span>
            </h1>
            <p className="text-lg md:text-xl text-blue-100 mb-8">
              {t("home.hero.subtitle")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/faq"
                className="bg-white text-blue-700 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
              >
                {t("home.hero.btnExplore")}
              </Link>
              <Link
                href="/bantuan-hukum"
                className="bg-blue-500/30 border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors"
              >
                {t("home.hero.btnAid")}
              </Link>
              <Link
                href="/chatbot"
                className="bg-white/10 border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors"
              >
                {t("home.hero.btnChat")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-16 md:py-20">
        <h2 className="text-3xl font-bold text-center mb-4 dark:text-gray-100">{t("home.featuresTitle")}</h2>
        <p className="text-gray-600 dark:text-gray-400 text-center mb-12 max-w-2xl mx-auto">
          {t("home.featuresSub")}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featureKeys.map((f) => (
            <Link key={f.href} href={f.href}>
              <div className="card cursor-pointer h-full">
                <div
                  className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl mb-4 ${f.color}`}
                >
                  {f.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2 dark:text-gray-100">{t(`${f.key}.title`)}</h3>
                <p className="text-gray-600 dark:text-gray-400">{t(`${f.key}.desc`)}</p>
                <div className="mt-4 text-blue-600 dark:text-blue-400 text-sm font-medium">
                  {t("home.learnMore")}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-gray-100 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">100+</div>
              <div className="text-gray-600 dark:text-gray-400">{t("home.stat.istilah")}</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">20+</div>
              <div className="text-gray-600 dark:text-gray-400">{t("home.stat.template")}</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">24/7</div>
              <div className="text-gray-600 dark:text-gray-400">{t("home.stat.ai")}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-gray-800 dark:to-gray-800 rounded-2xl p-8 md:p-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-4 dark:text-gray-100">
                {t("home.ctaTitle")}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                {t("home.ctaDesc")}
              </p>
              <Link
                href="/bantuan-hukum"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors inline-block mt-4"
              >
                {t("home.ctaBtn")}
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="bg-white dark:bg-gray-700 rounded-xl p-4 shadow-sm text-center">
                  <div className="text-3xl mb-2">{["🚨", "💼", "🏛️", "📋"][n - 1]}</div>
                  <p className="text-sm font-medium dark:text-gray-100">{t(`home.grid${n}`)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="bg-blue-50 dark:bg-gray-800 rounded-2xl p-8 md:p-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4 dark:text-gray-100">
            {t("home.finalTitle")}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-xl mx-auto">
            {t("home.finalDesc")}
          </p>
          <Link href="/chatbot" className="btn-primary inline-block">
            {t("home.finalBtn")}
          </Link>
        </div>
      </section>
    </div>
  );
}