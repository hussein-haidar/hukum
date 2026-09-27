import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Sinonim pencarian: kata kunci pengguna -> istilah database
const SEARCH_SYNONYMS: Record<string, string[]> = {
  // Hukum Islam
  "cerai": ["perceraian", "talak"],
  "cerai islam": ["perceraian", "talak", "khulu'", "fasakh"],
  "talak": ["talak", "perceraian"],
  "talak islam": ["talak", "perceraian", "khulu'", "fasakh"],
  "nikah": ["nikah", "pernikahan", "kawin"],
  "nikah islam": ["nikah", "pernikahan", "kawin", "walimatul 'urs"],
  "aqiqah": ["aqiqah", "aqiquah", " akikah"],
  "menafkahi": ["nafkah", "nafkah iddah", "nafkah mut'ah", "penghidupan"],
  "menafkahi mantan istri": ["nafkah iddah", "nafkah mut'ah", "nafkah"],
  "hak asuh": ["hak asuh anak", "asuh anak", "khadhanah"],
  "hak asuh anak": ["hak asuh anak", "asuh anak", "khadhanah"],
  "hak asuh anak islam": ["hak asuh anak", "asuh anak", "khadhanah", "perceraian"],
  "asuh anak": ["asuh anak", "hak asuh anak", "khadhanah"],
  "waris islam": ["waris", "khi", "faraidh", "pembagian warisan"],
  
  "fatwa": ["fatwa", "mui", "fatwa mui"],
  "syariah": ["syariah", "hukum islam", "fiqh"],
  "muamalah": ["muamalah", "transaksi syariah", "kontrak islam"],

  // Hukum Internasional
  "hukum internasional": ["hukum internasional", "international law", "public international law", "private international law", "undang-undang internasional"],
  "internasional": ["internasional", "international", "antara negara"],
  "pbb": ["pbb", "perserikatan bangsa-bangsa", "united nations", "un"],
  "konvensi": ["konvensi", "convention", "perjanjian internasional", "treaty"],
  "ohchr": ["ohchr", "high commissioner human rights", "komisi hak asasi manusia pbb"],
  "hak asasi manusia internasional": ["hak asasi manusia", "human rights", "ham internasional", "universal declaration human rights"],
  "hukum humaniter": ["hukum humaniter", "international humanitarian law", "ihl", "konvensi jena"],
  "hukum laut": ["hukum laut", "law of the sea", "unclos", "konvensi montego bay"],
  "perdagangan internasional": ["perdagangan internasional", "international trade", "wto", "gatt"],
  "investasi internasional": ["investasi internasional", "international investment", "icsid", "bits"],
  "arbitrase internasional": ["arbitrase internasional", "international arbitration", "icj", "pca"],
  "ekstradisi": ["ekstradisi", "ekstradition", "penyerahan orang"],
  "imunitas diplomatik": ["imunitas diplomatik", "diplomatic immunity", "konvensi wina"],
  "hukum pidana internasional": ["hukum pidana internasional", "international criminal law", "icc", "mahkamah pidana internasional"],
  "genosida": ["genosida", "genocide", "konvensi genosida"],
  "kejahatan perang": ["kejahatan perang", "war crimes", "kejahatan terhadap kemanusiaan"],
  "perjanjian": ["perjanjian", "treaty", "agreement", "protocol", "moa", "mou"],
  "ratifikasi": ["ratifikasi", "ratification", "pengesahan perjanjian"],

  // Hukum Indonesia
  "hukum indonesia": ["hukum indonesia", "hukum nasional", "peraturan perundang-undangan", "uu", "peraturan pemerintah", "perpres", "permen", "perda"],
  "indonesia": ["indonesia", "nasional", "domestik"],
  "uu": ["uu", "undang-undang", "act", "law"],
  "kode hukum": ["kode", "kuhp", "kuhap", "kuhperdata", "khi", "kode hukum"],
  "kuhp": ["kuhp", "kitab undang-undang hukum pidana", "penal code"],
  "kuhap": ["kuhap", "kitab undang-undang hukum acara pidana", "criminal procedure code"],
  "kuhperdata": ["kuhperdata", "kitab undang-undang hukum acara perdata", "civil procedure code"],
  "khi": ["khi", "kompilasi hukum islam", "hukum keluarga islam"],
  "peraturan pemerintah": ["pp", "peraturan pemerintah", "government regulation"],
  "perpres": ["perpres", "peraturan presiden", "presidential regulation"],
  "permen": ["permen", "peraturan menteri", "ministerial regulation"],
  "perda": ["perda", "peraturan daerah", "regional regulation"],
  "keputusan presiden": ["kepres", "keputusan presiden", "presidential decree"],
  "instruksi presiden": ["inpres", "instruksi presiden", "presidential instruction"],
  "mpr": ["mpr", "majlis permusyawaratan rakyat", "tap mpr"],
  "dpd": ["dpd", "dewan perwakilan daerah"],
  "dpr": ["dpr", "dewan perwakilan rakyat"],
  "mahkamah konstitusi": ["mk", "mahkamah konstitusi", "constitutional court", "putusan mk"],
  "mahkamah agung": ["ma", "mahkamah agung", "supreme court", "putusan ma", "jurisprudensi"],
  "pengadilan negeri": ["pn", "pengadilan negeri", "district court"],
  "pengadilan tinggi": ["pt", "pengadilan tinggi", "high court"],
  "pengadilan agama": ["pa", "pengadilan agama", "religious court"],
  "pengadilan tata usaha negara": ["ptun", "pengadilan tata usaha negara", "administrative court"],
  "pengadilan militer": ["pengadilan militer", "military court"],
  "pengadilan niaga": ["pengadilan niaga", "commercial court"],
  "hak asasi manusia indonesia": ["ham", "hak asasi manusia", "human rights", "uu ham", "komnas ham"],
  "pidana": ["pidana", "criminal", "kejahatan", "delik"],
  "perdata": ["perdata", "civil", "sengketa perdata", "gugatan"],
  "tata usaha negara": ["tun", "tata usaha negara", "administrative law", "ptun"],
  "pidana khusus": ["pidana khusus", "tipikor", "korupsi", "narkoba", "tpk", "terorisme"],
  "hak kekayaan intelektual": ["hki", "hak kekayaan intelektual", "intellectual property", "paten", "merk", "hak cipta"],
  "perbankan": ["perbankan", "banking", "bi", "bank indonesia", "ojk"],
  "tenaga kerja": ["tenaga kerja", "labor", "ketenagakerjaan", "phk", "pesangon", "serikat pekerja"],
  "perlindungan konsumen": ["perlindungan konsumen", "consumer protection", "uupk"],
  "lingkungan hidup": ["lingkungan hidup", "environmental law", "amdal", "uulh"],
  "agrarria": ["agrarria", "hukum tanah", "bptn", "sertifikat tanah", "hak atas tanah"],
  "kependudukan": ["kependudukan", "population", "nik", "kk", "akta kelahiran", "akta kematian"],
  "perkawinan": ["perkawinan", "marriage", "nikah", "cerai", "perceraian"],
  "waris": ["waris", "inheritance", "khi", "faraidh", "wasiat", "hibah"],
};

function expandSearchTerms(raw: string): string[] {
  const lower = raw.trim().toLowerCase();
  const expanded = new Set<string>([raw.trim()]);
  
  // Cek sinonim exact match dulu
  if (SEARCH_SYNONYMS[lower]) {
    SEARCH_SYNONYMS[lower].forEach(t => expanded.add(t));
  }
  
  // Cek partial match (kata kunci mengandung sinonim key)
  for (const [key, vals] of Object.entries(SEARCH_SYNONYMS)) {
    if (lower.includes(key)) {
      vals.forEach(t => expanded.add(t));
    }
  }
  
  return Array.from(expanded);
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const jenis = searchParams.get("jenis") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = 20;

    const searchTerms = expandSearchTerms(search);

    const searchWhere: any = search
      ? {
          OR: searchTerms.flatMap((term) => [
            { judul: { contains: term, mode: "insensitive" } },
            { tentang: { contains: term, mode: "insensitive" } },
            { nomor: { contains: term, mode: "insensitive" } },
          ]),
        }
      : {};

    // Where untuk data halaman: gabungan kata kunci + kategori terpilih.
    const where: any = { ...searchWhere };
    if (jenis) {
      where.jenis = jenis;
    }

    // Where untuk daftar kategori chip: konsisten dengan kata kunci
    // (tanpa filter kategori terpilih), supaya kategori yang ditampilkan
    // selalu relevan dengan yang sedang diketik.
    const jenisWhere: any = { ...searchWhere };

    const [total, documents, jenisList] = await Promise.all([
      prisma.legalDocument.count({ where }),
      prisma.legalDocument.findMany({
        where,
        orderBy: [{ tahun: "desc" }, { judul: "asc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.legalDocument.groupBy({
        by: ["jenis"],
        _count: { id: true },
        where: jenisWhere,
        orderBy: { jenis: "asc" },
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return NextResponse.json({
      success: true,
      data: documents,
      meta: {
        total,
        page,
        pageSize,
        totalPages,
      },
      jenisList,
    });
  } catch (error: any) {
    console.error("Dokumen list error:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Gagal mengambil data" },
      { status: 500 }
    );
  }
}
