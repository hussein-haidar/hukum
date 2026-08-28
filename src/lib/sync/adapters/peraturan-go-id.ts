import { SourceAdapter, FetchResult, RawDocument, NormalizedDocument } from "../types";

// Sumber: peraturan.go.id (database peraturan nasional resmi).
// TIDAK ada export/feed resmi -> scraping halaman daftar berdasarkan kategori.
// CATATAN JARINGAN (validasi langsung):
//   - /cariglobal?page=N          -> HTTP 500 (pagination broken)
//   - /cariglobal                 -> 200 (daftar default saja)
//   - /cari..., ?per_page, ?filter -> 500
//   - Halaman kategori (/uu,/pp,/perpres,/permen,/perda,/perppu,/inpres) + ?page=N -> 200 OK.
// Jadi strategi: crawl halaman kategori per slug + paginasi; tiap kartu berisi
// judul, tentang, slug detail, dan URL PDF langsung.

const BASE_URL = "https://peraturan.go.id";

const CATEGORIES = [
  { slug: "uu", jenis: "Undang-Undang" },
  { slug: "pp", jenis: "Peraturan Pemerintah" },
  { slug: "perpres", jenis: "Peraturan Presiden" },
  { slug: "permen", jenis: "Peraturan Menteri" },
  { slug: "perda", jenis: "Peraturan Daerah" },
  { slug: "perppu", jenis: "Perppu" },
  { slug: "inpres", jenis: "Instruksi Presiden" },
];

// Jumlah halaman maksimal per kategori (~25 dokumen/halaman). Supaya runtime
// sync tetap terkendali, batasi selimut crawl (bisa dinaikkan nanti).
const MAX_CAT_PAGES = 40;
// Jeda kecil antar request supaya tidak membanjiri server.
const REQUEST_DELAY_MS = 250;

interface ExtractedDoc {
  slug: string;
  jenis: string;
  nomor: string;
  tahun: string;
  judul: string;
  tentang: string;
  urlPdf: string | null;
  instansi: string;
}

// Parse blok kartu dokumen (class="strip grid") dari satu halaman kategori.
function extractDocs(html: string, categoryJenis: string): ExtractedDoc[] {
  const docs: ExtractedDoc[] = [];
  const blocks = html.split(/class="strip[^"]*"/);
  for (const block of blocks) {
    const titleMatch = block.match(
      /([A-Za-zÀ-ÿ ]+?)\s*Nomor\s+(\d{1,5})\s*Tahun\s+(\d{4})/
    );
    if (!titleMatch) continue;

    const tentangMatch = block.match(/title="lihat detail"[^>]*>\s*([^<]+)</);
    // Slug detail ada di href /id/... Baca SEMUA lalu buang link "tahun" (/id/#).
    const slugHrefs: string[] = [];
    const slugRe = /href="\/id\/([^"]*)"/g;
    let sm: RegExpExecArray | null;
    while ((sm = slugRe.exec(block)) !== null) {
      if (sm[1] && sm[1] !== "#") slugHrefs.push(sm[1]);
    }
    const slug = slugHrefs[0] || "";
    const pdfMatch = block.match(/\/files\/([^"]+\.pdf)/);
    const instansiMatch = block.match(/loc_open[^>]*>\s*([^<]+)/);

    const jenis = categoryJenis || titleMatch[1].trim();
    const nomor = titleMatch[2];
    const tahun = titleMatch[3];
    const judul = `${jenis} Nomor ${nomor} Tahun ${tahun}`;
    const tentang = tentangMatch ? tentangMatch[1].trim() : judul;

    docs.push({
      slug: slug.replace(/\.html?$/, ""),
      jenis,
      nomor,
      tahun,
      judul,
      tentang,
      urlPdf: pdfMatch
        ? `https://peraturan.go.id/files/${pdfMatch[1]}`
        : null,
      instansi: instansiMatch ? instansiMatch[1].trim() : "Pemerintah Pusat",
    });
  }
  return docs;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Ambil satu halaman dengan 1x retry; nil bila gagal (transien rate-limit/500).
async function fetchPage(url: string): Promise<string | null> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) HukumKu/1.0",
          Accept: "text/html,application/xhtml+xml",
        },
        signal: AbortSignal.timeout(20000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (e: any) {
      if (attempt === 0) await sleep(1200);
    }
  }
  return null;
}

export const peraturanGoIdAdapter: SourceAdapter = {
  id: "peraturan.go.id",
  name: "PERATURAN.GO.ID",

  // Listing mandiri: crawl semua kategori + paginasi.
  async fetchAll(): Promise<RawDocument[] | null> {
    const all: RawDocument[] = [];

    for (const cat of CATEGORIES) {
      let page = 1;
      let consecutiveFails = 0;
      while (page <= MAX_CAT_PAGES) {
        const html = await fetchPage(`${BASE_URL}/${cat.slug}?page=${page}`);
        if (html === null) {
          consecutiveFails++;
          if (consecutiveFails >= 2) break;
          page++;
          continue;
        }

        const docs = extractDocs(html, cat.jenis);
        if (docs.length === 0) break;

        for (const d of docs) {
          const externalId = d.slug || `${cat.slug}-nomor-${d.nomor}-tahun-${d.tahun}`;
          all.push({ externalId, raw: d });
        }

        consecutiveFails = 0;
        await sleep(REQUEST_DELAY_MS);
        page++;
      }
    }

    return all.length > 0 ? all : null;
  },

  normalize(raw: unknown): NormalizedDocument | null {
    const d = raw as ExtractedDoc;
    if (!d || !d.jenis || !d.nomor || !d.tahun) return null;
    const sourceId = d.slug || `${d.jenis.toLowerCase().replace(/\s+/g, "-")}-${d.nomor}-${d.tahun}`;
    return {
      source: "peraturan.go.id",
      sourceId,
      jenis: d.jenis,
      nomor: d.nomor,
      tahun: d.tahun,
      judul: d.judul,
      tentang: d.tentang,
      status: "berlaku",
      urlSumber: d.slug ? `${BASE_URL}/id/${d.slug}` : null,
      urlPdf: d.urlPdf,
      instansi: d.instansi,
    };
  },

  // Tidak perlu fetchList: fetchAll menangani segalanya (kecepatan).
  // Didefinisikan agar tipe SourceAdapter terpenuhi tanpa crash di jalur lain.
  async fetchList(): Promise<FetchResult> {
    return { data: [], total: 0, page: 1, totalPages: 1, hasMore: false };
  },
};