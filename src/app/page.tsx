import Link from "next/link";

const features = [
  {
    icon: "❓",
    title: "FAQ Hukum",
    desc: "Pertanyaan umum seputar hukum Indonesia dengan jawaban sederhana dan mudah dipahami.",
    href: "/faq",
    color: "bg-blue-50 text-blue-700",
  },
  {
    icon: "📝",
    title: "Template Surat",
    desc: "Berbagai template surat hukum siap pakai: kuasa, gugatan, somasi, perjanjian.",
    href: "/template-surat",
    color: "bg-green-50 text-green-700",
  },
  {
    icon: "🧮",
    title: "Kalkulator Hukum",
    desc: "Hitung denda, biaya perkara, pesangon PHK, dan simulasi cicilan hukum.",
    href: "/kalkulator",
    color: "bg-purple-50 text-purple-700",
  },
  {
    icon: "📖",
    title: "Glosarium Hukum",
    desc: "Kamus istilah hukum Indonesia A-Z dengan penjelasan sederhana.",
    href: "/glosarium",
    color: "bg-amber-50 text-amber-700",
  },
  {
    icon: "🤖",
    title: "Chatbot Hukum AI",
    desc: "Tanyakan pertanyaan hukum dan dapatkan jawaban dari AI berbasis data hukum Indonesia.",
    href: "/chatbot",
    color: "bg-rose-50 text-rose-700",
  },
  {
    icon: "📄",
    title: "Ringkas Dokumen",
    desc: "Tempel teks UU atau peraturan hukum, dapatkan ringkasan dalam bahasa sederhana.",
    href: "/ringkas",
    color: "bg-teal-50 text-teal-700",
  },
];

export default function HomePage() {
  return (
    <div>
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-20 md:py-28">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Panduan Hukum <span className="text-blue-200">Sederhana</span>
            </h1>
            <p className="text-lg md:text-xl text-blue-100 mb-8">
              Pahami hukum Indonesia dengan mudah. FAQ, template surat, kalkulator,
              glosarium, dan bantuan AI — semua gratis di satu tempat.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/faq"
                className="bg-white text-blue-700 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
              >
                Mulai Jelajahi
              </Link>
              <Link
                href="/chatbot"
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors"
              >
                Tanya Chatbot AI
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-16 md:py-20">
        <h2 className="text-3xl font-bold text-center mb-4">Fitur Unggulan</h2>
        <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
          Semua yang Anda butuhkan untuk memahami hukum Indonesia, tersedia secara
          gratis dan mudah diakses.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <Link key={f.href} href={f.href}>
              <div className="card cursor-pointer h-full">
                <div
                  className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl mb-4 ${f.color}`}
                >
                  {f.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{f.title}</h3>
                <p className="text-gray-600">{f.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">100+</div>
              <div className="text-gray-600">Istilah Hukum</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">20+</div>
              <div className="text-gray-600">Template Surat</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">24/7</div>
              <div className="text-gray-600">Akses Chatbot AI</div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="bg-blue-50 rounded-2xl p-8 md:p-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Butuh Bantuan Hukum Sekarang?
          </h2>
          <p className="text-gray-600 mb-6 max-w-xl mx-auto">
            Gunakan Chatbot AI kami untuk bertanya seputar hukum Indonesia. AI akan
            menjawab berdasarkan data hukum yang tersedia.
          </p>
          <Link href="/chatbot" className="btn-primary inline-block">
            Buka Chatbot
          </Link>
        </div>
      </section>
    </div>
  );
}
