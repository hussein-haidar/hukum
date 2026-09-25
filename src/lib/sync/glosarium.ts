import { prisma } from "@/lib/prisma";

/**
 * Panen otomatis istilah glosarium dari dokumen yang sudah disinkronkan.
 * Sumber kandidat:
 *  1) Akronim yang lazim muncul di dokumen hukum (UU, PP, OJK, dst) dengan
 *     definisi dari kamus akronim lawan lokal.
 *  2) Pola "Frasa (AKRONIM)" di judul/tentang/fullText dokumen, mis.
 *     "Badan Usaha Milik Negara (BUMN)" -> istilah "BUMN".
 * Selalu idempotent (istilah yang sudah ada dilewati) dan dibatasi jumlahnya.
 */

const MAX_INSERTS = 300;

const ACRO_EXPANSIONS: Record<string, string> = {
  UU: "Undang-Undang",
  UUD: "Undang-Undang Dasar",
  PP: "Peraturan Pemerintah",
  PERPRES: "Peraturan Presiden",
  KEPPRES: "Keputusan Presiden",
  PERMEN: "Peraturan Menteri",
  PMK: "Peraturan Menteri Keuangan",
  PERMENDAGRI: "Peraturan Menteri Dalam Negeri",
  PERMENKES: "Peraturan Menteri Kesehatan",
  PERMENDIKBUD: "Peraturan Menteri Pendidikan dan Kebudayaan",
  PERMENDIKBUDRISTEK: "Peraturan Menteri Pendidikan, Kebudayaan, Riset, dan Teknologi",
  PERMENAKER: "Peraturan Menteri Ketenagakerjaan",
  PERMENHUB: "Peraturan Menteri Perhubungan",
  PERMENKEU: "Peraturan Menteri Keuangan",
  PERMENDAG: "Peraturan Menteri Perdagangan",
  PERMENHAN: "Peraturan Menteri Pertahanan",
  PERMENLHK: "Peraturan Menteri Lingkungan Hidup dan Kehutanan",
  PERMENPU: "Peraturan Menteri Pekerjaan Umum",
  PERMENPANRB: "Peraturan Menteri Pendayagunaan Aparatur Negara dan Reformasi Birokrasi",
  BPK: "Badan Pemeriksa Keuangan",
  BPJS: "Badan Penyelenggara Jaminan Sosial",
  KPK: "Komisi Pemberantasan Korupsi",
  OJK: "Otoritas Jasa Keuangan",
  BI: "Bank Indonesia",
  BPS: "Badan Pusat Statistik",
  BUMN: "Badan Usaha Milik Negara",
  BUMD: "Badan Usaha Milik Daerah",
  UMKM: "Usaha Mikro, Kecil, dan Menengah",
  PN: "Pengadilan Negeri",
  PA: "Pengadilan Agama",
  MA: "Mahkamah Agung",
  MK: "Mahkamah Konstitusi",
  PTUN: "Pengadilan Tata Usaha Negara",
  PHI: "Pengadilan Hubungan Industrial",
  TUN: "Tata Usaha Negara",
  DPR: "Dewan Perwakilan Rakyat",
  DPRD: "Dewan Perwakilan Rakyat Daerah",
  MPR: "Majelis Permusyawaratan Rakyat",
  KUHAP: "Kitab Undang-Undang Hukum Acara Pidana",
  KUHP: "Kitab Undang-Undang Hukum Pidana",
  KUHPERDATA: "Kitab Undang-Undang Hukum Perdata",
  APBN: "Anggaran Pendapatan dan Belanja Negara",
  APBD: "Anggaran Pendapatan dan Belanja Daerah",
  PPH: "Pajak Penghasilan",
  PPN: "Pajak Pertambahan Nilai",
  PNBP: "Penerimaan Negara Bukan Pajak",
  KTP: "Kartu Tanda Penduduk",
  NIK: "Nomor Induk Kependudukan",
  NPWP: "Nomor Pokok Wajib Pajak",
  SK: "Surat Keputusan",
  SP2HP: "Surat Pemberitahuan Perkembangan Hasil Penyidikan",
  RUPS: "Rapat Umum Pemegang Saham",
  PT: "Perseroan Terbatas",
  CV: "Persekutuan Komanditer",
  KITAP: "Kartu Izin Tinggal Tetap",
  IMTA: "Izin Mempekerjakan Tenaga Asing",
  TKA: "Tenaga Kerja Asing",
  SIM: "Surat Izin Mengemudi",
  STNK: "Surat Tanda Nomor Kendaraan",
  BPKB: "Buku Pemilik Kendaraan Bermotor",
  PBB: "Pajak Bumi dan Bangunan",
  SHM: "Sertifikat Hak Milik",
  HGB: "Hak Guna Bangunan",
  HGU: "Hak Guna Usaha",
  SHGB: "Sertifikat Hak Guna Bangunan",
  NHS: "Nomor Hak Sertifikat",
  MUI: "Majelis Ulama Indonesia",
  BAZNAS: "Badan Amil Zakat Nasional",
  LAZ: "Lembaga Amil Zakat",
  DSN: "Dewan Syariah Nasional",
  KHI: "Kompilasi Hukum Islam",
  BPN: "Badan Pertanahan Nasional",
  KUA: "Kantor Urusan Agama",
  DISPENDUKCAPIL: "Dinas Kependudukan dan Pencatatan Sipil",
  TPS: "Tempat Pemungutan Suara",
  KPU: "Komisi Pemilihan Umum",
  BUMDES: "Badan Usaha Milik Desa",
  APBDES: "Anggaran Pendapatan dan Belanja Desa",
  UUPA: "Undang-Undang Pokok Agraria",
  RUU: "Rancangan Undang-Undang",
  PPAT: "Pejabat Pembuat Akta Tanah",
  IMB: "Izin Mendirikan Bangunan",
  RTH: "Ruang Terbuka Hijau",
  RTBL: "Rencana Tata Bangunan dan Lingkungan",
  BPSK: "Badan Penyelesaian Sengketa Konsumen",
  RTRW: "Rencana Tata Ruang Wilayah",
  ITE: "Informasi dan Transaksi Elektronik",
  SDM: "Sumber Daya Manusia",
  HAM: "Hak Asasi Manusia",
  KIP: "Keterbukaan Informasi Publik",
  ADR: "Alternatif Penyelesaian Sengketa",
  CSR: "Tanggung Jawab Sosial Perusahaan",
  PHK: "Pemutusan Hubungan Kerja",
  PPNS: "Penyidik Pegawai Negeri Sipil",
  BPHN: "Badan Pembinaan Hukum Nasional",
  LPS: "Lembaga Penjamin Simpanan",
  PPATK: "Pusat Pelaporan dan Analisis Transaksi Keuangan",
  BPHTB: "Bea Perolehan Hak atas Tanah dan Bangunan",
  SAKIP: "Sistem Akuntabilitas Kinerja Instansi Pemerintah",
  NSPK: "Norma, Standar, Prosedur, dan Kriteria",
  WIPO: "Organisasi Kekayaan Intelektual Dunia",
  TDL: "Tarif Dasar Listrik",
  PHLN: "Pinjaman dan Hibah Luar Negeri",
  SDI: "Sumber Daya Informasi",
  PMA: "Penanaman Modal Asing",
  PMDN: "Penanaman Modal Dalam Negeri",
  BBM: "Bahan Bakar Minyak",
  UGM: "Universitas Gadjah Mada",
  LSM: "Lembaga Swadaya Masyarakat",
  ZEE: "Zona Ekonomi Eksklusif",
  CEDAW: "Konvensi Penghapusan Segala Bentuk Diskriminasi terhadap Perempuan",
  BPD: "Badan Permusyawaratan Desa",
  TKI: "Tenaga Kerja Indonesia",
  ABK: "Anak Buah Kapal",
  PKPU: "Penundaan Kewajiban Pembayaran Utang",
  SEMA: "Surat Edaran Mahkamah Agung",
  DJSN: "Dewan Jaminan Sosial Nasional",
  FGD: "Focus Group Discussion",
  OTDA: "Otonomi Daerah",
  BOT: "Build Operate Transfer",
  PK: "Peninjauan Kembali",
  MLA: "Mutual Legal Assistance",
  TOC: "Kejahatan Terorganisir Transnasional",
  ILO: "Organisasi Perburuhan Internasional",
  WHO: "Organisasi Kesehatan Dunia",
  UNESCO: "Organisasi Pendidikan, Ilmu Pengetahuan, dan Kebudayaan Perserikatan Bangsa-Bangsa",
  ICAO: "Organisasi Penerbangan Sipil Internasional",
  WTO: "Organisasi Perdagangan Dunia",
  IMF: "Dana Moneter Internasional",
  ASEAN: "Asosiasi Bangsa-Bangsa Asia Tenggara",
};

const SKIP_TERMS = new Set([
  "pasal",
  "ayat",
  "huruf",
  "angka",
  "lampiran",
  "naskah",
  "perubahan",
  "tentang",
]);

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Bentuk tampilan yang benar untuk akronim yang lazim ditulis campuran huruf.
// Default: akronim ditulis seluruhnya kapital (UU, OJK, dst).
const DISPLAY_OVERRIDES: Record<string, string> = {
  PERPRES: "Perpres",
  KEPPRES: "Keppres",
  PERMEN: "Permen",
  PERMENDAGRI: "Permendagri",
  PERMENKES: "Permenkes",
  PERMENDIKBUD: "Permendikbud",
  PERMENDIKBUDRISTEK: "Permendikbudristek",
  PERMENAKER: "Permenaker",
  PERMENHUB: "Permenhub",
  PERMENKEU: "Permenkeu",
  PERMENDAG: "Permendag",
  PERMENHAN: "Permenhan",
  PERMENLHK: "PermenLHK",
  PERMENPU: "PermenPU",
  PERMENPANRB: "PermenPANRB",
  DISPENDUKCAPIL: "Disdukcapil",
  APBDES: "APBDes",
  KUHPERDATA: "KUHPerdata",
  BUMDES: "BUMDes",
  HAKI: "HaKI",
};

function displayAcro(key: string): string {
  return DISPLAY_OVERRIDES[key] ?? key;
}

function letterOf(term: string): string {
  const m = term.trim().match(/[A-Za-z]/);
  return m ? m[0].toUpperCase() : "A";
}

export interface GlossarySeed {
  judul?: string | null;
  tentang?: string | null;
  fullText?: string | null;
}

export function extractGlossaryCandidates(docs: GlossarySeed[]): Array<{ term: string; definition: string }> {
  const out: Array<{ term: string; definition: string }> = [];
  const seen = new Set<string>();

  const push = (term: string, definition: string) => {
    const key = term.trim().toLowerCase();
    if (!key || key.length > 80) return;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ term: term.trim(), definition: definition.trim() });
  };

  for (const doc of docs) {
    const text = [doc.judul, doc.tentang, doc.fullText ? doc.fullText.slice(0, 3000) : null]
      .filter(Boolean)
      .join(" ### ");

    // Akronim yang ada di kamus lawan lokal (definisi selalu lengkap).
    for (const [acro, full] of Object.entries(ACRO_EXPANSIONS)) {
      if (new RegExp(`\\b${escapeRegExp(acro)}\\b`, "i").test(text)) {
        push(displayAcro(acro), full);
      }
    }
  }

  return out;
}

export async function insertGlossaryCandidates(
  candidates: Array<{ term: string; definition: string }>,
  max = MAX_INSERTS
): Promise<number> {
  if (candidates.length === 0) return 0;

  const existing = await prisma.glosarium.findMany({ select: { term: true } });
  const seen = new Set(existing.map((g) => g.term.trim().toLowerCase()));

  let inserted = 0;
  for (const c of candidates) {
    const key = c.term.toLowerCase();
    if (seen.has(key) || SKIP_TERMS.has(key)) continue;
    seen.add(key);
    try {
      await prisma.glosarium.create({
        data: { term: c.term, definition: c.definition, letter: letterOf(c.term) },
      });
      inserted++;
    } catch {
      // duplikat/error baris ditoleransi
    }
    if (inserted >= max) break;
  }
  return inserted;
}

export async function harvestGlossaryFromDocs(docs: GlossarySeed[]): Promise<number> {
  return insertGlossaryCandidates(extractGlossaryCandidates(docs));
}