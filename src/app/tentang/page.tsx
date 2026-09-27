"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";

const stats = [
  { icon: "📚", value: "6+", key: "tentang.stat.features" },
  { icon: "🤖", value: "24/7", key: "tentang.stat.ai" },
  { icon: "📄", value: "4+", key: "tentang.stat.template" },
  { icon: "🏛️", value: "100+", key: "tentang.stat.terms" },
];

const valueKeys = [
  { icon: "🎓", key: "tentang.value1" },
  { icon: "🆓", key: "tentang.value2" },
  { icon: "🇮🇩", key: "tentang.value3" },
  { icon: "🔒", key: "tentang.value4" },
];

export default function TentangPage() {
  const { t } = useI18n();

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <span className="text-5xl mb-4 inline-block">⚖️</span>
        <h1 className="text-4xl font-bold mb-3 dark:text-gray-100">{t("tentang.title")}</h1>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          {t("tentang.subtitle")}
        </p>
      </div>

      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white rounded-2xl p-8 md:p-12 mb-14">
        <h2 className="text-2xl md:text-3xl font-bold mb-4">{t("tentang.misiTitle")}</h2>
        <p className="text-blue-100 leading-relaxed max-w-3xl">
          {t("tentang.misiBody")}
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8">
          {stats.map((s) => (
            <div key={s.key} className="text-center bg-white/10 rounded-xl p-4">
              <div className="text-3xl mb-2">{s.icon}</div>
              <div className="text-2xl font-bold">{s.value}</div>
              <div className="text-sm text-blue-100">{t(s.key)}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-14">
        <h2 className="text-2xl font-bold mb-8 text-center dark:text-gray-100">{t("tentang.valuesTitle")}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {valueKeys.map((v) => (
            <div key={v.key} className="card">
              <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-gray-700 flex items-center justify-center text-2xl mb-4">
                {v.icon}
              </div>
              <h3 className="font-semibold text-lg mb-2 dark:text-gray-100">{t(`${v.key}.title`)}</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{t(`${v.key}.desc`)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-14">
        <h2 className="text-2xl font-bold mb-2 text-center dark:text-gray-100">{t("tentang.teamTitle")}</h2>
        <p className="text-gray-600 dark:text-gray-400 text-center mb-8">
          {t("tentang.teamDesc")}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="card text-center">
            <div className="w-20 h-20 rounded-full bg-blue-100 dark:bg-gray-700 flex items-center justify-center text-3xl font-bold text-blue-700 dark:text-blue-400 mx-auto mb-4">
              H
            </div>
            <h3 className="font-semibold text-lg dark:text-gray-100">HukumKu</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Edukasi Hukum</p>
          </div>
          <div className="card text-center">
            <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-gray-700 flex items-center justify-center text-3xl font-bold text-green-700 dark:text-green-400 mx-auto mb-4">
              👩‍⚖️
            </div>
            <h3 className="font-semibold text-lg dark:text-gray-100">Kolaborasi Konten Hukum</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Diulas dari peraturan resmi</p>
          </div>
          <div className="card text-center">
            <div className="w-20 h-20 rounded-full bg-amber-100 dark:bg-gray-700 flex items-center justify-center text-3xl font-bold text-amber-700 dark:text-amber-400 mx-auto mb-4">
              🤖
            </div>
            <h3 className="font-semibold text-lg dark:text-gray-100">Dukungan AI</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Ditenagai model AI modern</p>
          </div>
        </div>
      </section>

      <section className="bg-blue-50 dark:bg-gray-800 rounded-2xl p-8 md:p-12 text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-4 dark:text-gray-100">{t("tentang.ctaTitle")}</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-xl mx-auto">
          {t("tentang.ctaDesc")}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/faq" className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
            {t("tentang.btnFaq")}
          </Link>
          <Link href="/bantuan-hukum" className="bg-white dark:bg-gray-700 text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-gray-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-100 dark:hover:bg-gray-600 transition-colors">
            {t("tentang.btnAid")}
          </Link>
        </div>
      </section>
    </div>
  );
}