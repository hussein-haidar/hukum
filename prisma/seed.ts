import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { templateSeeds } from "./templateSeeds";

const prisma = new PrismaClient();

async function main() {
  await prisma.fAQ.deleteMany();
  await prisma.templateSurat.deleteMany();
  await prisma.glosarium.deleteMany();
  await prisma.admin.deleteMany();

  const hashedPassword = await bcrypt.hash("admin123", 10);
  await prisma.admin.create({
    data: {
      username: "admin",
      email: "admin@hukumku.com",
      password: hashedPassword,
    },
  });

  const faqs = [
    {
      question: "Apa itu pengaduan di pengadilan?",
      answer:
        "Pengaduan adalah laporan yang diajukan oleh seseorang kepada pengadilan terkait adanya dugaan pelanggaran hukum yang merugikan dirinya. Pengaduan dapat diajukan secara tertulis atau lisan ke Pengadilan Negeri setempat.",
      category: "Perdata",
    },
    {
      question: "Bagaimana cara mengurus perceraian?",
      answer:
        "Perceraian dapat diajukan ke Pengadilan Agama (bagi muslim) atau Pengadilan Negeri (bagi non-muslim). Dokumen yang diperlukan: surat nikah, KTP, Kartu Keluarga, akta lahir anak (jika ada), dan surat gugatan cerai. Biaya perkara ditanggung oleh pihak yang mengajukan.",
      category: "Keluarga",
    },
    {
      question: "Apa hak karyawan saat di-PHK?",
      answer:
        "Berdasarkan UU Ketenagakerjaan No. 13 Tahun 2003, karyawan yang di-PHK berhak menerima: uang pesangon, uang penggantian hak, dan uang penghargaan masa kerja. Besaran tergantung lama kerja dan alasan PHK.",
      category: "Ketenagakerjaan",
    },
    {
      question: "Bagaimana cara membuat surat kuasa hukum?",
      answer:
        "Surat kuasa hukum dibuat secara tertulis, mencantumkan identitas pemberi kuasa dan penerima kuasa, ruang lingkup kuasa, dan tanda tangan kedua belah pihak serta saksi. Surat kuasa harus dibubuhi materai Rp 10.000.",
      category: "Umum",
    },
    {
      question: "Apa itu alibi dalam hukum pidana?",
      answer:
        "Alibi adalah keterangan yang menyatakan bahwa terdakwa tidak berada di tempat kejadian perkara (TKP) pada saat tindak pidana terjadi. Alibi dapat menjadi alasan pembebasan dari tuduhan pidana jika dapat dibuktikan.",
      category: "Pidana",
    },
    {
      question: "Berapa lama masa berlaku SIM?",
      answer:
        "SIM A dan SIM C berlaku selama 5 tahun sejak diterbitkan. Setelah masa berlaku habis, harus diperpanjang. Jika tidak diperpanjang dalam waktu 2 tahun setelah masa berlaku habis, SIM harus dibuat baru.",
      category: "Umum",
    },
    {
      question: "Bagaimana cara mengurus sertifikat tanah?",
      answer:
        "Untuk mengurus sertifikat tanah (PTSL atau pendaftaran tanah biasa), persiapkan: surat kepemilikan tanah (letter C/girik), KTP, PBB terakhir, surat pengantar RT/RW, dan foto bangunan. Ajukan ke Kantor Pertanahan (BPN) setempat.",
      category: "Properti",
    },
    {
      question: "Apa itu syarat sah perjanjian dalam KUHPerdata?",
      answer:
        "Berdasarkan Pasal 1320 KUHPerdata, syarat sah perjanjian adalah: 1) Kesepakatan mereka yang mengikatkan diri, 2) Kecakapan untuk membuat perjanjian, 3) Suatu hal tertentu, 4) Suatu sebab yang halal.",
      category: "Perdata",
    },
  ];

  for (const faq of faqs) {
    await prisma.fAQ.create({ data: faq });
  }

  for (const template of templateSeeds) {
    await prisma.templateSurat.create({ data: template });
  }

  const glossaries = [
    { term: "Advokat", definition: "Orang yang berprofesi memberikan bantuan hukum, baik di dalam maupun di luar pengadilan, yang telah memenuhi syarat berdasarkan ketentuan Undang-Undang Advokat.", letter: "A" },
    { term: "Alibi", definition: "Keterangan yang menyatakan bahwa seseorang tidak berada di tempat kejadian perkara pada saat tindak pidana terjadi.", letter: "A" },
    { term: "Berkas Perkara", definition: "Kumpulan dokumen yang berisi surat-surat dan bukti-bukti yang berkaitan dengan suatu perkara di pengadilan.", letter: "B" },
    { term: "Cagar Budaya", definition: "Benda, bangunan, atau struktur yang memiliki nilai penting bagi sejarah, ilmu pengetahuan, pendidikan, agama, dan/atau kebudayaan.", letter: "C" },
    { term: "Delik", definition: "Tindak pidana atau perbuatan yang dilarang oleh undang-undang dan diancam dengan hukuman tertentu.", letter: "D" },
    { term: "Gugatan", definition: "Permohonan atau tuntutan yang diajukan oleh penggugat kepada pengadilan untuk memperoleh putusan hakim.", letter: "G" },
    { term: "Hak Cipta", definition: "Hak eksklusif yang timbul secara otomatis berdasarkan prinsip deklarasi atas ciptaan para pencipta tanpa pendaftaran.", letter: "H" },
    { term: "Indikator", definition: "Tanda atau penanda yang menunjukkan adanya suatu keadaan atau peristiwa hukum tertentu.", letter: "I" },
    { term: "Jaksa", definition: "Pejabat negara yang diberi wewenang oleh undang-undang untuk melakukan penuntutan berdasarkan berkas perkara yang telah dinyatakan lengkap.", letter: "J" },
    { term: "Kompensasi", definition: "Pembayaran yang diberikan sebagai pengganti kerugian atau kerusakan yang dialami oleh pihak lain.", letter: "K" },
    { term: "Lembaga Pemasyarakatan", definition: "Lembaga pemasyarakatan atau penjara tempat narapidana menjalani hukuman pidana penjara.", letter: "L" },
    { term: "Mediasi", definition: "Cara penyelesaian sengketa melalui proses perundingan untuk memperoleh kesepakatan para pihak dengan dibantu oleh mediator.", letter: "M" },
    { term: "Notaris", definition: "Pejabat umum yang berwenang untuk membuat akta otentik dan kewenangan lain yang diberikan oleh undang-undang.", letter: "N" },
    { term: "Otoritatif", definition: "Bersifat mengikat atau memiliki wewenang yang sah berdasarkan hukum.", letter: "O" },
    { term: "Plaintiff", definition: "Istilah Inggris untuk penggugat, yaitu pihak yang mengajukan gugatan di pengadilan.", letter: "P" },
    { term: "Quasi Delik", definition: "Perbuatan yang menimbulkan kerugian pada orang lain tanpa unsur kesengajaan, tetapi karena kelalaian atau kecerobohan.", letter: "Q" },
    { term: "Restitusi", definition: "Pengembalian ke keadaan semula atau pemberian ganti rugi dalam bentuk uang atas kerugian yang diderita.", letter: "R" },
    { term: "Somasi", definition: "Surat peringatan atau teguran yang dikirimkan kepada pihak yang dianggap melanggar hak atau kewajibannya.", letter: "S" },
    { term: "Tergugat", definition: "Pihak yang dituntut atau digugat oleh penggugat di pengadilan karena dianggap melakukan pelanggaran hak.", letter: "T" },
    { term: "Ugahari", definition: "Kondisi atau keadaan yang masih sederhana dan belum rumit dalam konteks hukum.", letter: "U" },
    { term: "Verdict", definition: "Putusan atau keputusan hakim dalam suatu perkara di pengadilan.", letter: "V" },
    { term: "Wakil", definition: "Orang yang diberi kuasa atau diutus untuk mewakili orang lain dalam kegiatan hukum tertentu.", letter: "W" },
    { term: "Xerografi", definition: "Teknik penggandaan dokumen hukum yang digunakan sebagai bukti dalam persidangan.", letter: "X" },
    { term: "Yurisprudensi", definition: "Putusan hakim yang telah berkekuatan hukum tetap yang dijadikan pedoman dalam memutus perkara serupa.", letter: "Y" },
    { term: "Zaman Peninjauan", definition: "Masa atau periode hukum yang mengalami perubahan dan peninjauan terhadap peraturan yang berlaku.", letter: "Z" },
  ];

  for (const glossary of glossaries) {
    await prisma.glosarium.create({ data: glossary });
  }

  console.log("Seed data berhasil ditambahkan!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
