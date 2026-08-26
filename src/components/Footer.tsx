export default function Footer() {
  return (
    <footer className="bg-gray-800 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <span className="text-2xl">⚖️</span>
              <span className="text-xl font-bold text-white">HukumKu</span>
            </div>
            <p className="text-sm text-gray-400">
              Panduan hukum sederhana untuk masyarakat Indonesia. Mudah dipahami,
              gratis, dan dapat diakses kapan saja.
            </p>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-3">Fitur</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="/faq" className="hover:text-white">FAQ Hukum</a></li>
              <li><a href="/template-surat" className="hover:text-white">Template Surat</a></li>
              <li><a href="/kalkulator" className="hover:text-white">Kalkulator Hukum</a></li>
              <li><a href="/glosarium" className="hover:text-white">Glosarium</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-3">AI Tools</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="/chatbot" className="hover:text-white">Chatbot Hukum</a></li>
              <li><a href="/ringkas" className="hover:text-white">Ringkas Dokumen</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-3">Disclaimer</h3>
            <p className="text-sm text-gray-400">
              Informasi di aplikasi ini bersifat umum dan bukan pengganti konsultasi
              hukum profesional. Untuk kasus spesifik, silakan konsultasikan dengan
              advokat atau penasihat hukum.
            </p>
          </div>
        </div>
        <div className="border-t border-gray-700 mt-8 pt-6 text-center text-sm text-gray-500">
          © 2026 HukumKu. Dibuat untuk kepentingan edukasi hukum masyarakat.
        </div>
      </div>
    </footer>
  );
}
