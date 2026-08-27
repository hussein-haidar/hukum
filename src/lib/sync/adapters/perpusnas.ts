import { SourceAdapter, FetchResult, RawDocument, NormalizedDocument } from "../types";

// Sumber: Perpustakaan Nasional (api-jdih.perpusnas.go.id)
// Endpoint: JSON API (membutuhkan bearer token bila disediakan via PERPUSNAS_API_TOKEN).
// Tahap 1/2: fetchExport & fetchFeed tidak tersedia -> fallback ke fetchList.

const BASE_URL = "https://api-jdih.perpusnas.go.id";

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "User-Agent": "HukumKu/1.0 (Open Data Research)",
    Accept: "application/json",
  };
  const token = process.env.PERPUSNAS_API_TOKEN;
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

export const perpusnasAdapter: SourceAdapter = {
  id: "perpusnas",
  name: "Perpusnas",

  async fetchList(page: number, limit = 10): Promise<FetchResult> {
    const peraturanTypes = ["UU", "PP", "Perpres", "Permen"];
    const data: RawDocument[] = [];
    let total = 0;
    let maxLastPage = 1;

    for (const type of peraturanTypes) {
      try {
        const params = new URLSearchParams({
          page: String(page),
          type: "peraturan",
          keyword: type,
        });
        const res = await fetch(`${BASE_URL}?${params}`, {
          headers: authHeaders(),
          signal: AbortSignal.timeout(15000),
        });
        if (!res.ok) continue;
        const json = await res.json();
        const items = json.data || [];
        total += items.length;
        maxLastPage = Math.max(maxLastPage, Math.ceil(items.length / limit) + (items.length >= limit ? 1 : 0));

        for (const item of items) {
          const id = item.id;
          if (!id) continue;
          data.push({ externalId: String(id), raw: { ...item, _type: type } });
        }
      } catch {
        // lanjut ke tipe berikutnya
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
    const sourceId = String(item.id || "");
    const judul = item.judul || "";
    if (!sourceId || !judul) return null;

    return {
      source: "perpusnas",
      sourceId,
      jenis: item.jenis || item._type || "",
      nomor: String(item.nomor || ""),
      tahun: String(item.tahun || ""),
      judul,
      tentang: judul,
      status: "berlaku",
      urlSumber: item.url || null,
      urlPdf: item.url || null,
      instansi: item.instansi || null,
    };
  },
};
