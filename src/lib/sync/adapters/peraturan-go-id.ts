import { SourceAdapter, FetchResult, RawDocument, NormalizedDocument } from "../types";

// Sumber: peraturan.go.id
// Catatan: TIDAK ada export/feed/RSS resmi -> menggunakan scraping HTML (fallback).
// Struktur halaman pencarian berisi daftar peraturan per halaman.
// Tahap 1/2: fetchExport & fetchFeed tidak tersedia.

const BASE_URL = "https://peraturan.go.id/cariglobal";

const JENIS_MAP: Record<string, string> = {
  "Undang-Undang": "Undang-Undang",
  "Peraturan Pemerintah": "Peraturan Pemerintah",
  "Peraturan Presiden": "Peraturan Presiden",
  "Peraturan Menteri": "Peraturan Menteri",
  "Peraturan Daerah": "Peraturan Daerah",
  "Ketetapan MPR": "Ketetapan MPR",
  Perppu: "Perppu",
  "Keputusan Presiden": "Keputusan Presiden",
  "Instruksi Presiden": "Instruksi Presiden",
  "Peraturan Badan": "Peraturan Badan",
  "Peraturan Menteri Hukum dan HAM": "Peraturan Menteri",
  "Peraturan Menteri Keuangan": "Peraturan Menteri",
};

const JENIS_SHORT: Record<string, string> = {
  "Undang-Undang": "uu",
  "Peraturan Pemerintah": "pp",
  "Peraturan Presiden": "perpres",
  "Peraturan Menteri": "permen",
  "Peraturan Daerah": "perda",
};

interface ExtractedDoc {
  jenis: string;
  nomor: string;
  tahun: string;
  judul: string;
  tentang: string;
}

function extractDocs(html: string): ExtractedDoc[] {
  const docs: ExtractedDoc[] = [];
  const text = html
    .replace(/<[^>]+>/g, "|")
    .replace(/&amp;/g, "&")
    .replace(/&#039;/g, "'");
  const lines = text
    .split("|")
    .map((l: string) => l.trim())
    .filter((l: string) => l.length > 0);

  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(
      /^(Undang-Undang|Peraturan Pemerintah|Peraturan Presiden|Peraturan Menteri|Peraturan Daerah|Ketetapan MPR|Perppu|Keputusan Presiden|Instruksi Presiden|Peraturan Badan|Peraturan Menteri Hukum dan HAM|Peraturan Menteri Keuangan)\s+Nomor\s+(\d+)\s+Tahun\s+(\d{4})/
    );
    if (m) {
      let tentang = "";
      for (let k = i + 1; k < Math.min(i + 4, lines.length); k++) {
        if (
          lines[k].length > 10 &&
          !lines[k].match(/^(Dokumen|Pemerintah|&nbsp;|\d{4}|Peraturan|Undang)/)
        ) {
          tentang = lines[k];
          break;
        }
      }
      docs.push({
        jenis: m[1],
        nomor: m[2],
        tahun: m[3],
        judul: lines[i],
        tentang: tentang || lines[i],
      });
    }
  }
  return docs;
}

export const peraturanGoIdAdapter: SourceAdapter = {
  id: "peraturan.go.id",
  name: "PERATURAN.GO.ID",

  async fetchList(page: number, limit = 20): Promise<FetchResult> {
    try {
      const res = await fetch(`${BASE_URL}?page=${page}`, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) HukumKu/1.0",
          Accept: "text/html,application/xhtml+xml",
        },
        signal: AbortSignal.timeout(20000),
      });
      if (!res.ok) return { data: [], total: 0, page, totalPages: page, hasMore: false };
      const html = await res.text();
      if (html.includes("An error occurred") || html.length < 1000)
        return { data: [], total: 0, page, totalPages: page, hasMore: false };

      const docs = extractDocs(html);
      const data: RawDocument[] = docs.map((d) => ({
        externalId: `${JENIS_SHORT[d.jenis] || d.jenis.toLowerCase().replace(/\s+/g, "-")}-${d.nomor}-${d.tahun}`,
        raw: d,
      }));

      return {
        data,
        total: data.length,
        page,
        totalPages: page + (data.length >= limit ? 1 : 0),
        hasMore: data.length >= limit,
      };
    } catch {
      return { data: [], total: 0, page, totalPages: page, hasMore: false };
    }
  },

  normalize(raw: unknown): NormalizedDocument | null {
    const d = raw as ExtractedDoc;
    if (!d || !d.jenis || !d.nomor || !d.tahun) return null;
    const shortType =
      JENIS_SHORT[d.jenis] || d.jenis.toLowerCase().replace(/\s+/g, "-");
    const sourceId = `${shortType}-${d.nomor}-${d.tahun}`;
    return {
      source: "peraturan.go.id",
      sourceId,
      jenis: JENIS_MAP[d.jenis] || d.jenis,
      nomor: d.nomor,
      tahun: d.tahun,
      judul: d.judul,
      tentang: d.tentang,
      status: "berlaku",
      urlSumber: `https://peraturan.go.id/peraturan/${sourceId}`,
      urlPdf: null,
      instansi: "Pemerintah Pusat",
    };
  },

  // Tahap 8: ambil URL PDF dari halaman detail (best-effort, terpisah).
  async fetchDetail(externalId: string): Promise<Partial<NormalizedDocument> | null> {
    try {
      const res = await fetch(`https://peraturan.go.id/peraturan/${externalId}`, {
        headers: { "User-Agent": "Mozilla/5.0 HukumKu/1.0" },
        signal: AbortSignal.timeout(20000),
      });
      if (!res.ok) return null;
      const html = await res.text();
      const m = html.match(/href="([^"]+\.pdf)"/i);
      if (!m) return null;
      const url = m[1].startsWith("http") ? m[1] : `https://peraturan.go.id${m[1]}`;
      return { urlPdf: url };
    } catch {
      return null;
    }
  },
};
