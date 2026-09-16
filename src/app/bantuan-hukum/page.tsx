"use client";

import { useState } from "react";

interface Lawyer {
  name: string;
  field: string;
  city: string;
  phone: string;
  experience: string;
}

const tips = [
  {
    icon: "🔍",
    title: "Pahami Dulu Masalahnya",
    desc: "Identifikasi jenis perkara Anda (perdata, pidana, keluarga, atau ketenagakerjaan). Status Anda sebagai penggugat, tergugat, atau terlapor menentukan langkah berikutnya.",
  },
  {
    icon: "📋",
    title: "Kumpulkan Bukti Sejak Awal",
    desc: "Simpan semua dokumen pendukung: perjanjian tertulis, kwitansi, bukti transfer, surat-surat, hingga percakapan (chat/email). Bukti adalah kunci kemenangan di pengadilan.",
  },
  {
    icon: "🧾",
    title: "Cek Tenggang Waktu",
    desc: "Beberapa perkara memiliki batas waktu pengajuan (daluwarsa). Misalnya gugatan wanprestasi dan somasi harus diajukan sebelum hak Anda kadaluwarsa.",
  },
  {
    icon: "⚖️",
    title: "Kenali Pengadilan yang Berwenang",
    desc: "Perkara perdata antar warga biasa diajukan ke Pengadilan Negeri, perceraian umat Islam ke Pengadilan Agama, sengketa kepegawaian ke PTUN, dan sengketa HAM ke Pengadilan HAM.",
  },
  {
    icon: "📝",
    title: "Siapkan Dokumen Persidangan",
    desc: "Surat kuasa, surat gugatan/permohonan, akta kelahiran, KTP, dan bukti-bukti dinotasikan sebagai alat bukti. Fotokopi harus dilegalisir sesuai ketentuan.",
  },
  {
    icon: "🤝",
    title: "Mediasi Sebelum Berperkara",
    desc: "Pengadilan mewajibkan upaya mediasi terlebih dahulu. Sebagian besar sengketa bisa diselesaikan secara kekeluargaan — lebih murah dan lebih cepat daripada proses persidangan.",
  },
  {
    icon: "⌛",
    title: "Jangan Menunda Konsultasi",
    desc: "Semakin cepat Anda berkonsultasi dengan advokat, semakin besar peluang menyelesaikan masalah secara damai dan semakin kecil risiko kerugian yang bertambah.",
  },
  {
    icon: "💼",
    title: "Gunakan HAK Bantuan Hukum",
    desc: "Warga tidak mampu berhak memperoleh bantuan hukum gratis (pro bono) dari Posbakum di setiap pengadilan negeri atau dari LBH (Lembaga Bantuan Hukum) setempat.",
  },
];

const emergencyCards = [
  {
    title: "Ditangkap / Diperiksa Polisi",
    desc: "Anda berhak didampingi penasihat hukum sejak pemeriksaan. Hubungi keluarga untuk mengontak advokat, dan diam saja sampai pendamping tiba.",
  },
  {
    title: "Perselisihan Keluarga / KDRT",
    desc: "Segera laporkan ke Polisi atau hubungi unit PPA. Amankan bukti (visum, foto luka, chat). Anda berhak atas perlindungan dan pendampingan psikologis.",
  },
  {
    title: "Sengketa Lahan / Tanah",
    desc: "Amankan surat-surat asli (sertifikat, girik) dan cek status di kantor BPN. Ajukan mediasi ke Kantor Pertanahan sebelum membawa kasus ke pengadilan.",
  },
  {
    title: "Kena PHK Sepihak",
    desc: "Serikat pekerja dan Dinas Ketenagakerjaan bisa menengahi. Anda berhak atas pesangon sesuai UU Cipta Kerja. Somasi ke perusahaan bila hak tidak dibayar.",
  },
];

const lawyerDirectory: Lawyer[] = [
  {
    name: "LBH Jakarta",
    field: "Bantuan Hukum Umum",
    city: "Jakarta",
    phone: "021 3199 1615",
    experience: "Lembaga Bantuan Hukum",
  },
  {
    name: "LBH Surabaya",
    field: "Bantuan Hukum Umum",
    city: "Surabaya",
    phone: "031 5343 254",
    experience: "Lembaga Bantuan Hukum",
  },
  {
    name: "Posbakum PN Jakarta Pusat",
    field: "Bantuan Hukum Perdata",
    city: "Jakarta",
    phone: "021 3501 777",
    experience: "Pos Bantuan Hukum",
  },
  {
    name: "Posbakum PN Surabaya",
    field: "Bantuan Hukum Perdata",
    city: "Surabaya",
    phone: "031 5322 325",
    experience: "Pos Bantuan Hukum",
  },
  {
    name: "LBH APIK Indonesia",
    field: "Kekerasan terhadap Perempuan",
    city: "Jakarta",
    phone: "021 3935 4286",
    experience: "Lembaga Bantuan Hukum",
  },
  {
    name: "YLBHI",
    field: "Bantuan Hukum Umum & Publik",
    city: "Jakarta",
    phone: "021 392 5720",
    experience: "Lembaga Bantuan Hukum",
  },
];

const provinces = ["Semua", "Jakarta", "Surabaya", "Nasional"];

export default function BantuanHukumPage() {
  const [selectedProvince, setSelectedProvince] = useState("Semua");

  const filteredLawyers = lawyerDirectory.filter(
    (l) => selectedProvince === "Semua" || l.city === selectedProvince || (selectedProvince === "Nasional" && ["Jakarta", "Surabaya"].includes(l.city))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <span className="text-5xl mb-4 inline-block">🤝</span>
        <h1 className="text-4xl font-bold mb-3">Bantuan Hukum</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Tips menghadapi masalah hukum, langkah-langkah yang harus diambil, dan
          akses ke lembaga bantuan hukum resmi di Indonesia.
        </p>
      </div>

      <section className="mb-14">
        <h2 className="text-2xl font-bold mb-6 text-center">Situasi yang Membutuhkan Bantuan Segera</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {emergencyCards.map((e) => (
            <div key={e.title} className="card">
              <h3 className="font-semibold text-lg text-red-700 mb-2">{e.title}</h3>
              <p className="text-gray-600 text-sm">{e.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-14">
        <h2 className="text-2xl font-bold mb-2 text-center">Tips Menghadapi Masalah Hukum</h2>
        <p className="text-gray-600 text-center mb-8">
          Prinsip dasar sebelum Anda berhadapan dengan persoalan hukum.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tips.map((t) => (
            <div key={t.title} className="card">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-2xl shrink-0">
                  {t.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">{t.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{t.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-14">
        <h2 className="text-2xl font-bold mb-2 text-center">Direktori Bantuan Hukum</h2>
        <p className="text-gray-600 text-center mb-6">
          Lembaga bantuan hukum gratis dan Posbakum di pengadilan untuk warga yang membutuhkan.
        </p>

        <div className="flex flex-wrap gap-2 justify-center mb-8">
          {provinces.map((prov) => (
            <button
              key={prov}
              onClick={() => setSelectedProvince(prov)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedProvince === prov
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {prov}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLawyers.map((l) => (
            <div key={l.name} className="card">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-xl font-bold text-blue-700">
                  {l.name.charAt(0)}
                </div>
                <span className="badge bg-green-100 text-green-700">{l.city}</span>
              </div>
              <h3 className="font-semibold text-lg mb-1">{l.name}</h3>
              <p className="text-blue-600 text-sm font-medium mb-2">{l.field}</p>
              <p className="text-gray-500 text-sm mb-3">{l.experience}</p>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <span>📞</span>
                <span>{l.phone}</span>
              </div>
            </div>
          ))}
        </div>

        <p className="text-sm text-gray-500 text-center mt-6">
          Cari Pos Bantuan Hukum (Posbakum) terdekat di Pengadilan Negeri kota Anda, atau hubungi
          hotline bantuan hukum: <span className="font-semibold">1500-537</span> (Kemenkumham).
        </p>
      </section>

      <section className="bg-blue-50 rounded-2xl p-8 md:p-12 text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-4">
          Bingung Mulai dari Mana?
        </h2>
        <p className="text-gray-600 mb-6 max-w-xl mx-auto">
          Ceritakan kasus Anda ke Chatbot AI HukumKu untuk mendapatkan arah langkah
          awal, atau kunjungi FAQ untuk memahami istilah dan prosedur yang umum.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a href="/chatbot" className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
            Tanya Chatbot AI
          </a>
          <a href="/faq" className="bg-white text-blue-700 border border-blue-300 px-6 py-3 rounded-lg font-semibold hover:bg-blue-100 transition-colors">
            Lihat FAQ Hukum
          </a>
        </div>
      </section>
    </div>
  );
}