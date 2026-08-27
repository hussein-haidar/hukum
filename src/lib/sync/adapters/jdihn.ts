import { SourceAdapter, FetchResult, RawDocument, NormalizedDocument } from "../types";

// Sumber: JDIH Kementerian Keuangan (anggota jaringan JDIHN).
// Endpoint: JSON API terpaginas di https://jdih.kemenkeu.go.id/api/search
// Dipilih sebagai pengganti api jdihn.go.id pusat yang sering timeout.
// Terbukti merespons 200 dengan JSON terstruktur (total 10.000+ dokumen).

const BASE_URL = "https://jdih.kemenkeu.go.id";

const JENIS_MAP: Record<string, string> = {
  "UNDANG-UNDANG": "Undang-Undang",
  "PERATURAN PEMERINTAH": "Peraturan Pemerintah",
  "PERATURAN PRESIDEN": "Peraturan Presiden",
  "PERATURAN MENTERI": "Peraturan Menteri",
  "KEPUTUSAN PRESIDEN": "Keputusan Presiden",
  "INSTRUKSI PRESIDEN": "Instruksi Presiden",
  "PERATURAN DAERAH": "Peraturan Daerah",
  "KEPUTUSAN MENTERI": "Keputusan Menteri",
};

function mapJenis(bentuk?: string): string {
  if (!bentuk) return "";
  const u = bentuk.toUpperCase();
  for (const [k, v] of Object.entries(JENIS_MAP)) if (u.includes(k)) return v;
  return bentuk;
}

export const jdihnAdapter: SourceAdapter = {
  id: "jdihn",
  name: "JDIHN (Kemenkeu)",

  async fetchList(page: number, limit = 50): Promise<FetchResult> {
    try {
      const res = await fetch(`${BASE_URL}/api/search?keyword=&page=${page}&size=${limit}`, {
        headers: {
          "User-Agent": "Mozilla/5.0 HukumKu/1.0",
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(20000),
      });
      if (!res.ok) {
        return { data: [], total: 0, page, totalPages: page, hasMore: false };
      }
      const json = (await res.json()) as any;
      const items: any[] = json.data || [];
      const pageInfo = json.page || {};
      const totalPages = pageInfo.total_pages || 1;

      const data: RawDocument[] = items.map((it: any) => ({
        externalId: String(it.slug || it.produk_hukum_id),
        raw: it,
      }));

      return {
        data,
        total: pageInfo.total || items.length,
        page,
        totalPages,
        hasMore: page < totalPages,
      };
    } catch {
      return { data: [], total: 0, page, totalPages: page, hasMore: false };
    }
  },

  normalize(raw: unknown): NormalizedDocument | null {
    const it = raw as Record<string, any>;
    const slug = it.slug || it.produk_hukum_id;
    const judul = it.judul || "";
    if (!slug || !judul) return null;

    const statusRaw = (it.status || "").toString().toLowerCase();
    const status = statusRaw.includes("tidak")
      ? "tidak_berlaku"
      : statusRaw.includes("berlaku")
      ? "berlaku"
      : "berlaku";

    const tanggal = it.tanggal_penetapan ? new Date(it.tanggal_penetapan) : null;

    return {
      source: "jdihn",
      sourceId: String(slug),
      jenis: mapJenis(it.bentuk),
      nomor: String(it.no || ""),
      tahun: String(it.tahun || ""),
      judul,
      tentang: judul,
      status,
      tanggal,
      urlSumber: `${BASE_URL}/produk-hukum/${slug}`,
      urlPdf: null,
      instansi: it.teu || "Kementerian Keuangan",
    };
  },
};
