"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import ThemeToggle from "./ThemeToggle";
import LangToggle from "./LangToggle";

const linkClass =
  "px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 dark:text-gray-300 dark:hover:text-blue-400 dark:hover:bg-gray-700";

const mobileLinkClass =
  "block px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 dark:text-gray-300 dark:hover:text-blue-400 dark:hover:bg-gray-700";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [templateVisible, setTemplateVisible] = useState(false);
  const { t } = useI18n();
  const { user, logout } = useAuth();

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => setTemplateVisible(!!d.templateSuratVisible))
      .catch(() => {});
  }, []);

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 dark:bg-gray-900 dark:border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-2xl">⚖️</span>
              <span className="text-xl font-bold text-blue-700 dark:text-blue-400">HukumKu</span>
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-1">
            <Link href="/faq" className={linkClass}>{t("nav.faq")}</Link>
            {templateVisible && (
              <Link href="/template-surat" className={linkClass}>{t("nav.template")}</Link>
            )}
            <Link href="/kalkulator" className={linkClass}>{t("nav.kalkulator")}</Link>
            <Link href="/dokumen" className={linkClass}>{t("nav.peraturan")}</Link>
            <Link href="/glosarium" className={linkClass}>{t("nav.glosarium")}</Link>
            <Link href="/bantuan-hukum" className={linkClass}>{t("nav.bantuan")}</Link>
            <Link href="/chatbot" className={linkClass}>{t("nav.chatbot")}</Link>
            <Link href="/ringkas" className={linkClass}>{t("nav.ringkas")}</Link>
          </div>

          <div className="flex items-center md:hidden">
            <LangToggle />
            <ThemeToggle />
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>

          <div className="hidden md:flex items-center space-x-2">
            <LangToggle />
            <ThemeToggle />
            {user ? (
              <div className="flex items-center gap-2 ml-2 pl-2 border-l border-gray-200 dark:border-gray-700">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 max-w-[140px] truncate">
                  {user.name || user.email}
                </span>
                <button
                  onClick={logout}
                  className="text-sm text-red-500 hover:text-red-600 font-medium"
                  title={t("auth.logout")}
                >
                  {t("auth.logout")}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 ml-2 pl-2 border-l border-gray-200 dark:border-gray-700">
                <Link href="/login" className="btn-secondary !py-1.5 !px-3 text-sm">
                  {t("auth.login")}
                </Link>
                <Link href="/register" className="btn-primary !py-1.5 !px-3 text-sm">
                  {t("auth.register")}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white dark:bg-gray-900 dark:border-gray-700">
          <div className="px-4 py-3 space-y-1">
            <Link href="/faq" className={mobileLinkClass} onClick={() => setIsOpen(false)}>{t("nav.faq")}</Link>
            {templateVisible && (
              <Link href="/template-surat" className={mobileLinkClass} onClick={() => setIsOpen(false)}>{t("nav.template")}</Link>
            )}
            <Link href="/kalkulator" className={mobileLinkClass} onClick={() => setIsOpen(false)}>{t("nav.kalkulator")}</Link>
            <Link href="/dokumen" className={mobileLinkClass} onClick={() => setIsOpen(false)}>{t("nav.peraturan")}</Link>
            <Link href="/glosarium" className={mobileLinkClass} onClick={() => setIsOpen(false)}>{t("nav.glosarium")}</Link>
            <Link href="/bantuan-hukum" className={mobileLinkClass} onClick={() => setIsOpen(false)}>{t("nav.bantuan")}</Link>
            <Link href="/chatbot" className={mobileLinkClass} onClick={() => setIsOpen(false)}>{t("nav.chatbot")}</Link>
            <Link href="/ringkas" className={mobileLinkClass} onClick={() => setIsOpen(false)}>{t("nav.ringkas")}</Link>
            {user ? (
              <div className="px-3 py-2 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                  👤 {user.name || user.email}
                </span>
                <button
                  onClick={() => {
                    logout();
                    setIsOpen(false);
                  }}
                  className="text-sm text-red-500 hover:text-red-600 font-medium"
                >
                  {t("auth.logout")}
                </button>
              </div>
            ) : (
              <div className="px-3 py-2 flex items-center gap-2">
                <Link
                  href="/login"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 text-center btn-secondary !py-2 text-sm"
                >
                  {t("auth.login")}
                </Link>
                <Link
                  href="/register"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 text-center btn-primary !py-2 text-sm"
                >
                  {t("auth.register")}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}