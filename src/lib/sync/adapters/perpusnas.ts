import { SourceAdapter, NormalizedDocument, ExportFormat } from "../types";

// Sumber: JDIH Pusat (jdihn.go.id) — portal nasional JDIHN.
// Endpoint: https://jdihn.go.id/api/search?jenis=X&page=Y
// API JSON terpaginas berisi SELURUH peraturan perundang-undangan nasional.
//
// PENTING: Situs jdihn.go.id hanya bisa diakses dari IP Indonesia (geo-blocked).
// Untuk akses dari server luar Indonesia, setel env JDIHN_PROXY_URL ke proxy
// yang berada di Indonesia. Contoh: Cloudflare Worker di region Asia (ID).
//
// Tanpa proxy, adapter ini akan gagal dan statusnya menjadi "failed" (graceful).

const JDIHN_BASE = "https://jdihn.go.id";

// Jenis peraturan yang diambil (ID → nama).
// 1=UUD, 2=UU, 3=PP, 4=Keppres, 5=Inpres, 6=Permen — ini yang paling relevan.
const JENIS_TERPENTING = [
  { id: 1, nama: "UUD" },
  { id: 2, nama: "Undang-Undang" },
  { id: 3, nama: "Peraturan Pemerintah" },
  { id: 4, nama: "Keputusan Presiden" },
  { id: 5, nama: "Instruksi Presiden" },
  { id: 6, nama: "Peraturan Menteri" },
];

const MAX_PAGES_PER_TYPE = 100;

function getProxyBase(): string | null {
  return process.env.JDIHN_PROXY_URL || null;
}

function buildSearchUrl(jenisId: number, page: number): string {
  return `${JDIHN_BASE}/api/search?jenis=${jenisId}&page=${page}`;
}

function proxyUrl(directUrl: string): string {
  const proxy = getProxyBase();
  if (!proxy) return directUrl;
  return `${proxy}?url=${encodeURIComponent(directUrl)}`;
}

async function fetchJson(url: string): Promise<any> {
  const proxied = proxyUrl(url);
  const res = await fetch(proxied, {
    headers: {
      "User-Agent": "HukumKu/1.0 (Open Data Research)",
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export const perpusnasAdapter: SourceAdapter = {
  id: "perpusnas",
  name: "Perpusnas (JDIH Pusat)",

  // Ambil semua data dari JDIH Pusat lewat export (paginated per jenis).
  async fetchExport(): Promise<{ content: string; format: ExportFormat } | null> {
    const allItems: any[] = [];

    for (const jenis of JENIS_TERPENTING) {
      let page = 1;
      let totalPages = 1;

      while (page <= totalPages && page <= MAX_PAGES_PER_TYPE) {
        try {
          const url = buildSearchUrl(jenis.id, page);
          const json = await fetchJson(url);
          const items = json.data || [];
          totalPages = json.meta?.last_page || 1;

          for (const item of items) {
            allItems.push({ ...item, _jenisId: jenis.id, _jenisNama: jenis.nama });
          }

          page++;
          // Jeda antar request untuk sopan
          await new Promise((r) => setTimeout(r, 500));
        } catch {
          // Gagal ambil halaman ini, lanjut ke jenis berikutnya
          break;
        }
      }
    }

    if (allItems.length === 0) return null;

    return {
      content: JSON.stringify(allItems),
      format: "json",
    };
  },

  normalize(raw: unknown): NormalizedDocument | null {
    const item = raw as Record<string, any>;
    const sourceId = String(item.id_dokumen || item.id || "");
    const judul = item.judul || "";
    if (!sourceId || !judul) return null;

    const jenis = item._jenisNama || item.jenis_peraturan?.name || "";
    const tahun = String(item.tahun_terbit || "");
    const nomor = String(item.nomor || "");

    let urlPdf: string | null = null;
    if (item.download) {
      urlPdf = item.download.startsWith("http")
        ? item.download
        : `${JDIHN_BASE}${item.download}`;
    }

    return {
      source: "perpusnas",
      sourceId,
      jenis,
      nomor,
      tahun,
      judul,
      tentang: judul,
      status: "berlaku",
      urlSumber: `${JDIHN_BASE}/pencarian/detail/${sourceId}`,
      urlPdf,
      instansi: item.instansi || null,
    };
  },
};
