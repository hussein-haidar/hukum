export interface TemplateSeed {
  title: string;
  slug: string;
  description: string;
  category: string;
  content: string;
}

export const templateSeeds: TemplateSeed[] = [
  {
    title: "Surat Kuasa Hukum",
    slug: "surat-kuasa-hukum",
    description: "Surat kuasa resmi untuk memberikan wewenang kepada advokat/kuasa hukum dalam menangani perkara.",
    category: "Kuasa",
    content: `SURAT KUASA HUKUM
Nomor: [NO_SURAT]

Yang bertanda tangan di bawah ini:

Nama                 : [NAMA_PEMBERI_KUASA]
Umur                 : [UMUR] tahun
Pekerjaan            : [PEKERJAAN]
Alamat               : [ALAMAT_PEMBERI_KUASA]
No. KTP              : [NO_KTP]

Selanjutnya disebut sebagai PEMBERI KUASA.

Dengan ini memberikan kuasa kepada:

Nama                 : [NAMA_PENERIMA_KUASA]
Alamat               : [ALAMAT_PENERIMA_KUASA]
No. Advokat          : [NO_ADVOKAT]

Selanjutnya disebut sebagai PENERIMA KUASA.

Untuk dan atas nama PEMBERI KUASA, PENERIMA KUASA berwenang melakukan tindakan hukum sebagai berikut:

[HAL_YANG_DIKUASAKAN]

Kuasa ini diberikan untuk jangka waktu sampai dengan selesainya seluruh urusan yang dikuasakan. PENERIMA KUASA berwenang menandatangani seluruh dokumen yang diperlukan sepanjang berkaitan dengan kuasa yang diberikan tersebut.

Demikian Surat Kuasa ini dibuat dengan sebenarnya untuk dipergunakan sebagaimana mestinya, tanpa paksaan dari pihak manapun.

[LOKASI], [TANGGAL]

PENERIMA KUASA,                 PEMBERI KUASA,



[NAMA_PENERIMA_KUASA]           [NAMA_PEMBERI_KUASA]
                                (Materai Rp 10.000 ditempel di atas tanda tangan)`,
  },
  {
    title: "Surat Gugatan",
    slug: "surat-gugatan",
    description: "Surat gugatan perdata lengkap dengan identitas para pihak, posita, dan petitum.",
    category: "Gugatan",
    content: `SURAT GUGATAN
Nomor: [NO_SURAT]

Kepada Yang Terhormat,
Ketua Pengadilan Negeri [KOTA]
di Tempat.

Dengan hormat,

Yang bertanda tangan di bawah ini, kami Kuasa Hukum dari:

1. Nama                 : [NAMA_PENGGUGAT]
   Tempat, Tanggal Lahir: [TTL_PENGGUGAT]
   Pekerjaan            : [PEKERJAAN_PENGGUGAT]
   Alamat               : [ALAMAT_PENGGUGAT]
   Selanjutnya disebut sebagai PENGGUGAT.

2. Nama                 : [NAMA_TERGUGAT]
   Tempat, Tanggal Lahir: [TTL_TERGUGAT]
   Pekerjaan            : [PEKERJAAN_TERGUGAT]
   Alamat               : [ALAMAT_TERGUGAT]
   Selanjutnya disebut sebagai TERGUGAT.

Dalam hal ini PENGGUGAT mengajukan gugatan terhadap TERGUGAT berdasarkan hal-hal sebagai berikut:

A. POSITA (DUDUK PERKARA)
1. [FAKTA_1]
2. [FAKTA_2]
3. [DASAR_HUKUM]

Bahwa berdasarkan hal-hal tersebut di atas, gugatan PENGGUGAT telah memenuhi syarat untuk diajukan dan diperiksa oleh Pengadilan Negeri [KOTA].

B. PETITUM (TUNTUTAN)
1. Mengabulkan gugatan PENGGUGAT untuk seluruhnya;
2. Menyatakan sah dan berharga semua alat bukti yang diajukan oleh PENGGUGAT;
3. Menyatakan bahwa [KLAIM_STATUS_HUKUM];
4. Menghukum TERGUGAT untuk tunduk dan patuh terhadap isi putusan;
5. Menghukum TERGUGAT untuk membayar seluruh biaya yang timbul akibat perkara ini.

Namun apabila Majelis Hakim berpendapat lain, mohon putusan yang seadil-adilnya (ex aequo et bono).

Demikian gugatan ini kami ajukan. Atas perkenan dan kebijaksanaan Yang Terhormat Ketua Pengadilan Negeri [KOTA], kami ucapkan terima kasih.

[KOTA], [TANGGAL]

Hormat Kami,
Kuasa Hukum PENGGUGAT,



[NAMA_KUASA_HUKUM]
[NO_ADVOKAT]`,
  },
  {
    title: "Surat Somasi",
    slug: "surat-somasi",
    description: "Surat peringatan resmi atas wanprestasi atau pelanggaran kewajiban agar dipenuhi dalam tenggang waktu tertentu.",
    category: "Somasi",
    content: `SURAT SOMASI
Nomor: [NO_SURAT]

Kepada Yth.
[NAMA_PENERIMA]
[ALAMAT_PENERIMA]
di Tempat.

Dengan hormat,

Berdasarkan perjanjian/hubungan hukum antara Saudara dengan [NAMA_PENGIRIM] sebagaimana dituangkan dalam perjanjian tertulis tanggal [TANGGAL_PERJANJIAN], maka dengan ini kami nyatakan bahwa Saudara telah melakukan wanprestasi/tidak memenuhi kewajiban berupa:

1. [PELANGGARAN_1]
2. [PELANGGARAN_2]

Bahwa perbuatan Saudara tersebut telah menimbulkan kerugian bagi [NAMA_PENGIRIM].

Oleh karena itu, melalui Surat Somasi ini kami memberikan peringatan dan teguran kepada Saudara untuk segera memenuhi prestasi/kewajiban sebagaimana mestinya, yaitu:

[TINDAKAN_YANG_HARUS_DILAKUKAN]

Paling lambat dalam waktu [MASA_TENGGANG] hari kalender sejak surat ini diterima.

Apabila dalam tenggang waktu tersebut Saudara tidak juga memenuhi kewajiban, maka kami dengan tegas akan menempuh upaya hukum sesuai ketentuan peraturan perundang-undangan yang berlaku. Segala biaya yang timbul akibat upaya hukum tersebut akan menjadi beban dan tanggung jawab Saudara.

Demikian Surat Somasi ini kami sampaikan. Atas perhatian dan itikad baik Saudara, kami ucapkan terima kasih.

[LOKASI], [TANGGAL]

Hormat Kami,



[NAMA_PENGIRIM]
[JABATAN]`,
  },
  {
    title: "Surat Perjanjian Sewa Menyewa",
    slug: "surat-perjanjian-sewa-menyewa",
    description: "Perjanjian sewa menyewa rumah/ruko/kontrakan dengan struktur pasal standar dan klausul lengkap.",
    category: "Perjanjian",
    content: `SURAT PERJANJIAN SEWA MENYEWA
Nomor: [NO_SURAT]

Pada hari ini, [HARI] tanggal [TANGGAL] bulan [BULAN] tahun [TAHUN], kami yang bertanda tangan di bawah ini:

1. Nama       : [NAMA_PEMILIK]
   Alamat     : [ALAMAT_PEMILIK]
   No. KTP    : [NO_KTP_PEMILIK]
   Selanjutnya disebut sebagai PIHAK PERTAMA (Pemilik);

2. Nama       : [NAMA_PENYEWA]
   Alamat     : [ALAMAT_PENYEWA]
   No. KTP    : [NO_KTP_PENYEWA]
   Selanjutnya disebut sebagai PIHAK KEDUA (Penyewa).

Para Pihak dengan ini menerangkan bahwa PIHAK PERTAMA adalah pemilik sah atas [OBJEK_SEWA] yang terletak di [ALAMAT_OBJEK_SEWA], dan PIHAK PERTAMA setuju untuk menyewakan objek tersebut kepada PIHAK KEDUA. Oleh karena itu, Para Pihak sepakat untuk mengikatkan diri dalam Perjanjian Sewa Menyewa dengan ketentuan dan syarat-syarat sebagai berikut:

PASAL 1
OBJEK SEWA
PIHAK PERTAMA menyewakan kepada PIHAK KEDUA dan PIHAK KEDUA menerima sewa dari PIHAK PERTAMA berupa [OBJEK_SEWA] yang terletak di [ALAMAT_OBJEK_SEWA].

PASAL 2
JANGKA WAKTU SEWA
Perjanjian sewa-menyewa ini berlaku untuk jangka waktu [LAMA_SEWA], terhitung sejak tanggal [TANGGAL_MULAI] dan berakhir pada tanggal [TANGGAL_AKHIR]. Jangka waktu sewa dapat diperpanjang atas kesepakatan tertulis Para Pihak.

PASAL 3
HARGA DAN CARA PEMBAYARAN
1. Harga sewa atas objek yang disewa disepakati sebesar Rp [NOMINAL_SEWA] ([TERBILANG_SEWA]).
2. Pembayaran dilakukan secara [FREKUENSI_PEMBAYARAN] dan wajib dilunasi oleh PIHAK KEDUA kepada PIHAK PERTAMA paling lambat pada saat perjanjian ini ditandatangani.

PASAL 4
UANG JAMINAN (DEPOSIT)
PIHAK KEDUA memberikan uang jaminan sebesar Rp [NOMINAL_JAMINAN] ([TERBILANG_JAMINAN]) kepada PIHAK PERTAMA, yang akan dikembalikan secara utuh tanpa bunga setelah masa sewa berakhir, dengan ketentuan tidak ada tunggakan sewa dan tidak ada kerusakan pada objek sewa selain pemakaian wajar.

PASAL 5
HAK DAN KEWAJIBAN PARA PIHAK
1. PIHAK KEDUA berhak menggunakan objek sewa untuk keperluan [KEPERLUAN_SEWA];
2. PIHAK KEDUA wajib merawat dan menjaga kebersihan serta keutuhan objek sewa;
3. Segala biaya perbaikan kerusakan yang timbul akibat kelalaian PIHAK KEDUA menjadi tanggung jawab PIHAK KEDUA;
4. PIHAK KEDUA dilarang menggunakan objek sewa untuk kegiatan yang melanggar hukum, mengganggu ketertiban umum, atau bertentangan dengan ketentuan peraturan perundang-undangan yang berlaku.

PASAL 6
PEMELIHARAAN DAN PERBAIKAN
Segala kerusakan pada objek sewa yang timbul akibat pemakaian wajar menjadi tanggung jawab PIHAK PERTAMA untuk diperbaiki. Adapun kerusakan yang disebabkan oleh kelalaian atau kesengajaan PIHAK KEDUA menjadi tanggung jawab dan biaya PIHAK KEDUA.

PASAL 7
LARANGAN SUB-SEWA
PIHAK KEDUA tidak diperkenankan untuk menyewakan kembali, meminjamkan, atau menyerahkan seluruh atau sebagian objek sewa kepada pihak ketiga tanpa izin tertulis terlebih dahulu dari PIHAK PERTAMA.

PASAL 8
PENYELESAIAN PERSELISIHAN
Apabila di kemudian hari timbul perselisihan dalam pelaksanaan perjanjian ini, Para Pihak sepakat untuk menyelesaikannya secara musyawarah untuk mufakat. Apabila musyawarah tidak mencapai kesepakatan, Para Pihak sepakat untuk menyelesaikannya melalui Pengadilan Negeri [KOTA].

Demikian Surat Perjanjian ini dibuat dalam rangkap 2 (dua) bermeterai cukup, yang masing-masing memiliki kekuatan hukum yang sama, dan ditandatangani oleh Para Pihak dalam keadaan sehat akal serta tanpa paksaan dari pihak manapun.

[KOTA], [TANGGAL] [BULAN] [TAHUN]

PIHAK PERTAMA (Pemilik)             PIHAK KEDUA (Penyewa)



[NAMA_PEMILIK]                      [NAMA_PENYEWA]
                                    (Tanda tangan di atas Materai Rp 10.000)`,
  },
];
