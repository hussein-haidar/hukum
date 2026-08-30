"use client";

import Link from "next/link";
import { useState } from "react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-2xl">⚖️</span>
              <span className="text-xl font-bold text-blue-700">HukumKu</span>
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-1">
            <Link
              href="/faq"
              className="px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50"
            >
              FAQ Hukum
            </Link>
            <Link
              href="/template-surat"
              className="px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50"
            >
              Template Surat
            </Link>
            <Link
              href="/kalkulator"
              className="px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50"
            >
              Kalkulator
            </Link>
            <Link
              href="/dokumen"
              className="px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50"
            >
              Peraturan
            </Link>
            <Link
              href="/glosarium"
              className="px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50"
            >
              Glosarium
            </Link>
            <Link
              href="/chatbot"
              className="px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50"
            >
              Chatbot AI
            </Link>
            <Link
              href="/ringkas"
              className="px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50"
            >
              Ringkas Dokumen
            </Link>
          </div>

          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
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
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-4 py-3 space-y-1">
            <Link href="/faq" className="block px-3 py-2 rounded-lg text-gray-700 hover:bg-blue-50" onClick={() => setIsOpen(false)}>FAQ Hukum</Link>
            <Link href="/template-surat" className="block px-3 py-2 rounded-lg text-gray-700 hover:bg-blue-50" onClick={() => setIsOpen(false)}>Template Surat</Link>
            <Link href="/kalkulator" className="block px-3 py-2 rounded-lg text-gray-700 hover:bg-blue-50" onClick={() => setIsOpen(false)}>Kalkulator</Link>
            <Link href="/dokumen" className="block px-3 py-2 rounded-lg text-gray-700 hover:bg-blue-50" onClick={() => setIsOpen(false)}>Peraturan</Link>
            <Link href="/glosarium" className="block px-3 py-2 rounded-lg text-gray-700 hover:bg-blue-50" onClick={() => setIsOpen(false)}>Glosarium</Link>
            <Link href="/chatbot" className="block px-3 py-2 rounded-lg text-gray-700 hover:bg-blue-50" onClick={() => setIsOpen(false)}>Chatbot AI</Link>
            <Link href="/ringkas" className="block px-3 py-2 rounded-lg text-gray-700 hover:bg-blue-50" onClick={() => setIsOpen(false)}>Ringkas Dokumen</Link>
          </div>
        </div>
      )}
    </nav>
  );
}
