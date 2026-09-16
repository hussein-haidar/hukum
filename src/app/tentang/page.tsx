import Link from "next/link";

const stats = [
  { icon: "📚", value: "6+", label: "Kategori Fitur" },
  { icon: "🤖", value: "24/7", label: "Bantuan AI" },
  { icon: "📄", value: "4+", label: "Template Surat" },
  { icon: "🏛️", value: "100+", label: "Istilah Hukum" },
];

const values = [
  {
    icon: "🎓",
    title: "Edukasi, Bukan Ganti Profesional",
    desc: "Kami membantu Anda memahami hukum Indonesia dengan bahasa yang sederhana. Informasi di HukumKu bukan pengganti nasihat advokat profesional, melainkan bekal agar Anda tahu hak, kewajiban, dan langkah selanjutnya.",
  },
  {
    icon: "🆓",
    title: "Gratis untuk Semua",
    desc: "Seluruh fitur HukumKu — FAQ, template surat, kalkulator, glosarium, dan bantuan AI — dapat diakses secara gratis oleh semua orang, kapan saja dan di mana saja.",
  },
  {
    icon: "🇮🇩",
    title: "Hukum Indonesia",
    desc: "Konten kami mengacu pada peraturan perundang-undangan yang berlaku di Indonesia: KUHPerdata, KUHP, UU Perlindungan Konsumen, UU Ketenagakerjaan, dan peraturan terkait lainnya.",
  },
  {
    icon: "🔒",
    title: "Diproses dengan Aman",
    desc: "Data Anda tidak dibagikan ke pihak lain. Teknologi AI yang digunakan mengutamakan privasi, dan informasi bersifat umum tanpa menampung data pribadi sensitif.",
  },
];

export default function TentangPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <span className="text-5xl mb-4 inline-block">⚖️</span>
        <h1 className="text-4xl font-bold mb-3">Tentang HukumKu</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          HukumKu adalah aplikasi panduan hukum sederhana untuk membantu masyarakat
          Indonesia memahami dunia hukum tanpa harus paham bahasa peraturan yang rumit.
        </p>
      </div>

      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white rounded-2xl p-8 md:p-12 mb-14">
        <h2 className="text-2xl md:text-3xl font-bold mb-4">Misi Kami</h2>
        <p className="text-blue-100 leading-relaxed max-w-3xl">
          Banyak orang tidak memahami hak dan kewajiban hukumnya hanya karena
          peraturan ditulis dalam bahasa yang sulit dan biaya konsultasi yang mahal.
          HukumKu hadir untuk menjembatani kesenjangan itu — menghadirkan informasi
          hukum yang jelas, akurat, dan gratis, dipadukan dengan kecerdasan buatan
          untuk menjawab pertanyaan Anda kapan saja.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8">
          {stats.map((s) => (
            <div key={s.label} className="text-center bg-white/10 rounded-xl p-4">
              <div className="text-3xl mb-2">{s.icon}</div>
              <div className="text-2xl font-bold">{s.value}</div>
              <div className="text-sm text-blue-100">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-14">
        <h2 className="text-2xl font-bold mb-8 text-center">Nilai-Nilai Kami</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {values.map((v) => (
            <div key={v.title} className="card">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-2xl mb-4">
                {v.icon}
              </div>
              <h3 className="font-semibold text-lg mb-2">{v.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-14">
        <h2 className="text-2xl font-bold mb-2 text-center">Siapa di Balik HukumKu?</h2>
        <p className="text-gray-600 text-center mb-8">
          HukumKu dirancang dan dikembangkan oleh tim dengan latar belakang
          teknologi informasi dan kepedulian terhadap akses keadilan.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="card text-center">
            <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-3xl font-bold text-blue-700 mx-auto mb-4">
              H
            </div>
            <h3 className="font-semibold text-lg">HukumKu</h3>
            <p className="text-sm text-gray-500">Platform Edukasi Hukum</p>
          </div>
          <div className="card text-center">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center text-3xl font-bold text-green-700 mx-auto mb-4">
              👩‍⚖️
            </div>
            <h3 className="font-semibold text-lg">Kolaborasi Konten Hukum</h3>
            <p className="text-sm text-gray-500">Diulas dari peraturan resmi</p>
          </div>
          <div className="card text-center">
            <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center text-3xl font-bold text-amber-700 mx-auto mb-4">
              🤖
            </div>
            <h3 className="font-semibold text-lg">Dukungan AI</h3>
            <p className="text-sm text-gray-500">Ditenagai model AI modern</p>
          </div>
        </div>
      </section>

      <section className="bg-blue-50 rounded-2xl p-8 md:p-12 text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-4">Mari Mulai</h2>
        <p className="text-gray-600 mb-6 max-w-xl mx-auto">
          Jelajahi fitur-fitur HukumKu dan mulai pahami hukum Indonesia dengan cara
          yang menyenangkan.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/faq" className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
            Jelajahi FAQ
          </Link>
          <Link href="/bantuan-hukum" className="bg-white text-blue-700 border border-blue-300 px-6 py-3 rounded-lg font-semibold hover:bg-blue-100 transition-colors">
            Lihat Bantuan Hukum
          </Link>
        </div>
      </section>
    </div>
  );
}