import { SourceAdapter, FetchResult, RawDocument, NormalizedDocument } from "../types";

// Sumber: JDIHN (Jaringan Dokumentasi dan Informasi Hukum Nasional)
// Endpoint: JSON API di https://jdihn.go.id/api/search
// Catatan: Tidak ada export/feed resmi dari hub pusat, jadi menggunakan list API.
// Tahap 1/2: fetchExport & fetchFeed sengaja tidak diimplementasikan (return null)
// sehingga engine otomatis fallback ke fetchList.

const BASE_URL = "https://jdihn.go.id";

const PRIORITY_JENIS: Record<string, string> = {
  "9": "Undang-Undang",
  "7": "UUD",
  "10": "Perppu",
  "11": "Peraturan Pemerintah",
  "12": "Peraturan Presiden",
  "14": "Instruksi Presiden",
  "16": "Undang-Undang Darurat",
};

function mapJenis(name?: string): string {
  if (!name) return "";
  const n = name.toUpperCase();
  if (n.includes("UNDANG-UNDANG DASAR")) return "UUD";
  if (n.includes("UNDANG-UNDANG DARURAT")) return "UU Darurat";
  if (n.includes("PERATURAN PEMERINTAH PENGGANTI")) return "Perppu";
  if (n.includes("UNDANG-UNDANG")) return "Undang-Undang";
  if (n.includes("PERATURAN PEMERINTAH")) return "Peraturan Pemerintah";
  if (n.includes("PERATURAN PRESIDEN")) return "Peraturan Presiden";
  if (n.includes("KEPUTUSAN PRESIDEN")) return "Keputusan Presiden";
  if (n.includes("INSTRUKSI PRESIDEN")) return "Instruksi Presiden";
  if (n.includes("PERATURAN MENTERI")) return "Peraturan Menteri";
  if (n.includes("PERATURAN DAERAH")) return "Peraturan Daerah";
  return name;
}

export const jdihnAdapter: SourceAdapter = {
  id: "jdihn",
  name: "JDIHN",

  async fetchList(page: number, limit = 15): Promise<FetchResult> {
    const data: RawDocument[] = [];
    let total = 0;
    let maxLastPage = 1;

    for (const [jenisId, jenisName] of Object.entries(PRIORITY_JENIS)) {
      try {
        const params = new URLSearchParams({ page: String(page), jenis: jenisId });
        const res = await fetch(`${BASE_URL}/api/search?${params}`, {
          headers: {
            "User-Agent": "HukumKu/1.0 (Open Data Research)",
            Accept: "application/json",
          },
          signal: AbortSignal.timeout(15000),
        });
        if (!res.ok) continue;
        const json = await res.json();
        const items = json.data || [];
        total += json.meta?.total || 0;
        maxLastPage = Math.max(maxLastPage, json.meta?.last_page || 1);

        for (const item of items) {
          const id = item.id || item.id_dokumen;
          if (!id) continue;
          data.push({ externalId: String(id), raw: { ...item, _jenis_name: jenisName } });
        }
      } catch {
        // lanjut ke jenis berikutnya
      }
    }

    return {
      data,
      total,
      page,
      totalPages: maxLastPage,
      hasMore: page < maxLastPage,
    };
  },

  normalize(raw: unknown): NormalizedDocument | null {
    const item = raw as Record<string, any>;
    const judul = item.judul;
    if (!judul) return null;

    const docId = item.id || item.id_dokumen;
    const jenis = item._jenis_name || item.jenis_peraturan?.name || "";
    const nomor = String(item.nomor || "");
    const tahun = String(item.tahun_terbit || "");
    const instansi = item.instansi || "";
    const download = item.download || "";

    const dateStr =
      tahun && /^\d{4}$/.test(tahun) ? `${tahun}-01-01` : undefined;

    return {
      source: "jdihn",
      sourceId: String(docId),
      jenis: mapJenis(jenis),
      nomor,
      tahun,
      judul,
      tentang: item.tentang || judul,
      status: item.status?.name || "berlaku",
      tanggal: dateStr ? new Date(dateStr) : null,
      urlSumber: `${BASE_URL}/pencarian/detail/${docId}`,
      urlPdf: download || null,
      instansi,
    };
  },

  // Tahap 8: ambil URL PDF dari halaman detail (terpisah dari metadata).
  async fetchDetail(externalId: string): Promise<Partial<NormalizedDocument> | null> {
    try {
      const res = await fetch(`${BASE_URL}/pencarian/detail/${externalId}`, {
        headers: { "User-Agent": "HukumKu/1.0" },
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) return null;
      const html = await res.text();
      const m = html.match(/href="([^"]+\.pdf)"/i);
      if (!m) return null;
      const url = m[1].startsWith("http") ? m[1] : `${BASE_URL}${m[1]}`;
      return { urlPdf: url };
    } catch {
      return null;
    }
  },
};
