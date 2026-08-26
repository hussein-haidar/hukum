import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

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
      password: hashedPassword 
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

  const templates = [
    {
      title: "Surat Kuasa Hukum",
      slug: "surat-kuasa-hukum",
      description:
        "Surat kuasa untuk memberikan wewenang kepada pengacara/advokat",
      content: `SURAT KUASA HUKUM

Yang bertanda tangan di bawah ini:
Nama    : [NAMA_PEMBERI_KUASA]
Alamat  : [ALAMAT_PEMBERI_KUASA]
No. KTP : [NO_KTP]

Dengan ini memberikan kuasa kepada:
Nama    : [NAMA_PENERIMA_KUASA]
Alamat  : [ALAMAT_PENERIMA_KUASA]
No. Advokat : [NO_ADVOKAT]

Untuk dan atas nama pemberi kuasa melakukan hal-hal sebagai berikut:
[HAL_YANG_DIKUASAKAN]

Demikian surat kuasa ini saya buat dengan sebenar-benarnya dalam keadaan sehat jasmani dan rohani.

[LOKASI], [TANGGAL]

Pemberi Kuasa,
[NAMA_PEMBERI_KUASA]

Materai Rp 10.000`,
      category: "Kuasa",
    },
    {
      title: "Surat Gugatan Perdata",
      slug: "surat-gugatan-perdata",
      description: "Surat gugatan untuk perkara perdata di pengadilan negeri",
      content: `SURAT GUGATAN

Kepada Yang Terhormat
Ketua Pengadilan Negeri [KOTA]

Penggugat:
Nama    : [NAMA_PENGGUGAT]
Alamat  : [ALAMAT_PENGGUGAT]

Tergugat:
Nama    : [NAMA_TERGUGAT]
Alamat  : [ALAMAT_TERGUGAT]

BUNYI GUGATAN:
1. Menyatakan [DALAM_GUGATAN_1]
2. Menghukum Tergugat untuk [TUNTUTAN_1]
3. Menghukum Tergugat untuk membayar biaya perkara ini.

Dasar Gugatan:
[DASAR_HUKUM_DAN_FAKTA]

Demikian gugatan ini kami ajukan dengan sebenar-benarnya.

[LOKASI], [TANGGAL]

Penggugat,
[NAMA_PENGGUGAT]`,
      category: "Gugatan",
    },
    {
      title: "Surat Somasi",
      slug: "surat-somasi",
      description: "Surat peringatan sebelum dilakukan tindakan hukum lebih lanjut",
      content: `SURAT SOMASI

Kepada Yth.
[NAMA_PENERIMA]
di Tempat

Dengan hormat,

Berdasarkan perjanjian tertulis tanggal [TANGGAL_PERJANJIAN], Kami menyatakan bahwa pihak Bapak/Ibu telah melanggar ketentuan sebagai berikut:
[PELANGGARAN]

Berdasarkan hal tersebut, kami memberikan peringatan pertama agar Bapak/Ibu segera:
[TINDAKAN_YANG_HARUS_DILAKUKAN]

Apabila dalam waktu [MASA_TENGGANG] hari sejak surat ini diterima tidak ada itikad baik dari Bapak/Ibu, maka kami akan mengambil langkah hukum yang diperlukan tanpa pemberitahuan lebih lanjut.

Demikian surat somasi ini kami sampaikan. Atas perhatian dan kerjasamanya, kami ucapkan terima kasih.

[LOKASI], [TANGGAL]

[NAMA_PENGIRIM]
[JABATAN]`,
      category: "Somasi",
    },
    {
      title: "Surat Perjanjian Sewa-Menyewa",
      slug: "surat-perjanjian-sewa",
      description:
        "Surat perjanjian untuk sewa-menyewa rumah/ruko/kontrakan",
      content: `SURAT PERJANJIAN SEWA-MENYEWA

Pada hari ini [HARI], tanggal [TANGGAL] bulan [BULAN] tahun [TAHUN], telah dibuat dan ditandatangani perjanjian oleh dan antara:

PIHAK PERTAMA (Penyewa):
Nama    : [NAMA_PENYEWA]
Alamat  : [ALAMAT_PENYEWA]
No. KTP : [NO_KTP_PENYEWA]

PIHAK KEDUA (Pemilik):
Nama    : [NAMA_PEMILIK]
Alamat  : [ALAMAT_PEMILIK]
No. KTP : [NO_KTP_PEMILIK]

Dengan ini menyatakan bahwa:

1. Pihak Kedua menyewakan kepada Pihak Pertama berupa [OBJEK_SEWA] yang beralamat di [ALAMAT_OBJEK_SEWA].

2. Jangka waktu sewa adalah [LAMA_SEWA] terhitung sejak [TANGGAL_MULAI] sampai dengan [TANGGAL_AKHIR].

3. Sewa sebesar Rp [NOMINAL_SEWA] ([TERBILANG]) dibayarkan [FREKUENSI_PEMBAYARAN].

4. Uang jaminan sebesar Rp [NOMINAL_JAMINAN] yang akan dikembalikan setelah masa sewa berakhir dan tidak ada kerusakan.

5. Pihak Pertama tidak diperkenankan menyewakan kembali tanpa izin tertulis dari Pihak Kedua.

Demikian perjanjian ini dibuat dalam 2 (dua) rangkap bermeterai cukup dan masing-masing pihak menyimpan 1 (satu) rangkap.

Pihak Pertama,               Pihak Kedua,
[NAMA_PENYEWA]               [NAMA_PEMILIK]

Materai Rp 10.000            Materai Rp 10.000`,
      category: "Perjanjian",
    },
  ];

  for (const template of templates) {
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
