import { SourceAdapter, FetchResult, RawDocument, NormalizedDocument } from "../types";

// Sumber Hukum Islam yang tersedia:
// 1. LPPOM MUI (halalmui.org) - WP REST API WORKING ✅
//    - Fatwa MUI (category 30): 32 posts
//    - Fatwa & Regulasi (category 20): 41 posts  
//    - Regulasi (category 31): 9 posts
// 2. JPI (jpi.or.id) - WP REST API WORKING ✅ (Islamic urban studies)
// 3. BAZNAS - No WP API
// 4. MUI Pusat (fatwa.mui.or.id) - Cloudflare blocked
// 5. DSN-MUI - Cloudflare blocked
// 6. Kemenag/Bimas - Cloudflare blocked

const LPPOM_MUI_BASE = "https://halalmui.org";
const LPPOM_MUI_API = `${LPPOM_MUI_BASE}/wp-json/wp/v2`;
const JPI_BASE = "https://jpi.or.id";
const JPI_API = `${JPI_BASE}/wp-json/wp/v2`;

// Category IDs from halalmui.org
const LPPOM_CATEGORIES = {
  FATWA_MUI: 30,           // Fatwa MUI - 32 posts
  FATWA_REGULASI: 20,      // Fatwa & Regulasi (parent) - 41 posts
  REGULASI: 31,            // Regulasi - 9 posts
  ARTIKEL_HALAL: 44,       // Artikel Halal - 554 posts
  BERITA: 45,              // Berita - 736 posts
};

// JPI post types: publication, blog, news, project, graphics, survey
const JPI_TYPES = ["publication", "blog", "news", "project", "graphics", "survey"];

const JENIS_HUKUM_ISLAM: Record<string, string> = {
  "FATWA": "Fatwa MUI",
  "HADIS": "Hadis",
  "QURAN": "Al-Quran",
  "FIKIH": "Fikih",
  "USUL FIKIH": "Usul Fikih",
  "PUTUSAN AGAMA": "Putusan Peradilan Agama",
  "KEPUTUSAN": "Keputusan Keagamaan",
  "FATWA KOMISI": "Fatwa Komisi Fatwa",
  "BAHTSUL MASAIL": "Bahtsul Masail",
  "REGULASI": "Regulasi Halal",
  "SERTIFIKASI": "Sertifikasi Halal",
  "HALAL": "Hukum Halal",
  "PERENCANAAN": "Perencanaan Islam",
  "URBAN": "Studi Urban Islam",
};

function mapJenisIslam(kategori?: string, judul?: string, sumber?: string): string {
  if (!kategori && !judul) return "Hukum Islam";
  const text = ((kategori || "") + " " + (judul || "") + " " + (sumber || "")).toUpperCase();
  for (const [k, v] of Object.entries(JENIS_HUKUM_ISLAM)) {
    if (text.includes(k)) return v;
  }
  if (sumber === "JPI") return "Studi Urban Islam";
  return kategori || "Hukum Islam";
}

function parseTanggalIslam(v: unknown): Date | null {
  if (v == null || v === "") return null;
  const s = String(v).trim();
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return new Date(+iso[1], +iso[2] - 1, +iso[3]);
  const dmy = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (dmy) return new Date(+dmy[3], +dmy[2] - 1, +dmy[1]);
  const bulan: Record<string, number> = {
    januari: 0, februari: 1, maret: 2, april: 3, mei: 4, juni: 5,
    juli: 6, agustus: 7, september: 8, oktober: 9, november: 10, desember: 11,
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, okt: 9, nov: 10, des: 11,
  };
  const dmyText = s.match(/^(\d{1,2})\s+(\w+)\s+(\d{4})$/i);
  if (dmyText) {
    const bln = bulan[dmyText[2].toLowerCase()];
    if (bln !== undefined) return new Date(+dmyText[3], bln, +dmyText[1]);
  }
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

function cleanUrlIslam(v: unknown): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  if (!/^https?:\/\//i.test(s)) return null;
  return s;
}

function extractFatwaNomor(judul: string): string {
  const match = judul.match(/(?:No|Nomor)\.?\s*(\d+)\s*(?:Tahun|tahun)\s*(\d{4})/i);
  if (match) return `${match[1]}/${match[2]}`;
  const match2 = judul.match(/Fatwa\s+MUI\s+No\s+(\d+)\s+Tahun\s+(\d{4})/i);
  if (match2) return `${match2[1]}/${match2[2]}`;
  return "";
}

function extractFatwaTahun(judul: string): string {
  const match = judul.match(/(?:Tahun|tahun)\s*(\d{4})/i);
  if (match) return match[1];
  const match2 = judul.match(/Fatwa\s+MUI\s+No\s+\d+\s+Tahun\s+(\d{4})/i);
  if (match2) return match2[1];
  return "";
}

// LPPOM MUI Adapter - Working WP REST API
export const lppomMuiAdapter: SourceAdapter = {
  id: "lppom-mui",
  name: "LPPOM MUI - Fatwa & Regulasi Halal",

  async fetchList(page: number, limit = 20): Promise<FetchResult> {
    try {
      const categories = [LPPOM_CATEGORIES.FATWA_MUI, LPPOM_CATEGORIES.FATWA_REGULASI];
      const allPosts: any[] = [];
      
      for (const catId of categories) {
        const offset = (page - 1) * limit;
        const res = await fetch(
          `${LPPOM_MUI_API}/posts?categories=${catId}&per_page=${limit}&offset=${offset}&orderby=date&order=desc`,
          {
            headers: { "User-Agent": "Mozilla/5.0 HukumKu/1.0", Accept: "application/json" },
            signal: AbortSignal.timeout(30000),
          }
        );
        if (!res.ok) continue;
        const posts = (await res.json()) as any[];
        allPosts.push(...posts);
      }

      const seen = new Set<number>();
      const uniquePosts = allPosts.filter((p) => {
        if (seen.has(p.id)) return false;
        seen.add(p.id);
        return true;
      });

      uniquePosts.sort((a, b) => new Date(b.date_gmt).getTime() - new Date(a.date_gmt).getTime());

      const pageOffset = (page - 1) * limit;
      const data: RawDocument[] = uniquePosts.slice(0, limit).map((post) => ({
        externalId: `lppom-${post.id}`,
        raw: post,
      }));

      const total = uniquePosts.length + pageOffset;
      
      return { data, total, page, totalPages: Math.ceil(total / limit), hasMore: uniquePosts.length >= limit };
    } catch (e) {
      console.error("[lppom-mui] fetchList error:", e);
      return { data: [], total: 0, page, totalPages: page, hasMore: false };
    }
  },

  normalize(raw: unknown): NormalizedDocument | null {
    const post = raw as Record<string, any>;
    const id = post.id;
    const judul = post.title?.rendered || "";
    if (!id || !judul) return null;

    const categories = post.categories || [];
    const categoryNames = categories.map((c: number) => {
      const cat = Object.entries(LPPOM_CATEGORIES).find(([, v]) => v === c);
      return cat ? cat[0] : "";
    }).filter(Boolean);

    const kategori = categoryNames.join(", ") || "Fatwa MUI";
    const nomor = extractFatwaNomor(judul);
    const tahun = extractFatwaTahun(judul) || post.date_gmt?.slice(0, 4) || "";

    const contentHtml = post.content?.rendered || post.excerpt?.rendered || "";
    const tentang = contentHtml
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 500);

    let pdfUrl: string | null = null;
    const pdfMatch = contentHtml.match(/href="([^"]+\.pdf)"/i);
    if (pdfMatch) pdfUrl = cleanUrlIslam(pdfMatch[1]);

    return {
      source: "lppom-mui",
      sourceId: `lppom-${id}`,
      jenis: mapJenisIslam(kategori, judul, "LPPOM MUI"),
      nomor,
      tahun,
      judul,
      tentang: tentang || judul,
      status: "berlaku",
      tanggal: parseTanggalIslam(post.date_gmt || post.date),
      urlSumber: cleanUrlIslam(post.link),
      urlPdf: pdfUrl,
      instansi: "LPPOM MUI",
    };
  },
};

// MUI Pusat Adapter - Delegates to LPPOM MUI (same organization, LPPOM has working API)
export const muiAdapter: SourceAdapter = {
  id: "mui",
  name: "MUI Pusat (via LPPOM MUI)",

  async fetchList(page: number, limit = 20): Promise<FetchResult> {
    // fatwa.mui.or.id blocked by Cloudflare, use LPPOM MUI as proxy
    return lppomMuiAdapter.fetchList!(page, limit);
  },

  normalize(raw: unknown): NormalizedDocument | null {
    const normalized = lppomMuiAdapter.normalize(raw);
    if (normalized) {
      return { ...normalized, source: "mui", sourceId: normalized.sourceId.replace("lppom-", "mui-"), instansi: "Majelis Ulama Indonesia" };
    }
    return null;
  },
};

// JPI Adapter - WP REST API Working (Islamic Urban Studies)
export const jpiAdapter: SourceAdapter = {
  id: "jpi",
  name: "JPI - Jakarta Pusat Pengkajian Islam (Studi Urban)",

  async fetchList(page: number, limit = 20): Promise<FetchResult> {
    try {
      const allPosts: any[] = [];
      const perType = Math.ceil(limit / JPI_TYPES.length);
      
      for (const type of JPI_TYPES) {
        const offset = (page - 1) * perType;
        const res = await fetch(
          `${JPI_API}/${type}?per_page=${perType}&offset=${offset}&orderby=date&order=desc`,
          {
            headers: { "User-Agent": "Mozilla/5.0 HukumKu/1.0", Accept: "application/json" },
            signal: AbortSignal.timeout(30000),
          }
        );
        if (!res.ok) continue;
        const posts = (await res.json()) as any[];
        allPosts.push(...posts);
      }

      // Sort by date desc
      allPosts.sort((a, b) => new Date(b.date_gmt || b.date).getTime() - new Date(a.date_gmt || a.date).getTime());

      const pageOffset = (page - 1) * limit;
      const data: RawDocument[] = allPosts.slice(0, limit).map((post) => ({
        externalId: `jpi-${post.id}`,
        raw: post,
      }));

      const total = allPosts.length + pageOffset;
      
      return { data, total, page, totalPages: Math.ceil(total / limit), hasMore: allPosts.length >= limit };
    } catch (e) {
      console.error("[jpi] fetchList error:", e);
      return { data: [], total: 0, page, totalPages: page, hasMore: false };
    }
  },

  normalize(raw: unknown): NormalizedDocument | null {
    const post = raw as Record<string, any>;
    const id = post.id;
    const judul = post.title?.rendered || "";
    if (!id || !judul) return null;

    const contentHtml = post.content?.rendered || post.excerpt?.rendered || "";
    const tentang = contentHtml
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 500);

    // Extract post type from links
    let postType = "publication";
    if (post._links?.["wp:term"]) {
      for (const term of post._links["wp:term"]) {
        if (term.href?.includes("type=")) {
          const match = term.href.match(/type=([^&]+)/);
          if (match) postType = match[1];
        }
      }
    }

    return {
      source: "jpi",
      sourceId: `jpi-${id}`,
      jenis: mapJenisIslam(postType, judul, "JPI"),
      nomor: "",
      tahun: post.date_gmt?.slice(0, 4) || post.date?.slice(0, 4) || "",
      judul,
      tentang: tentang || judul,
      status: "berlaku",
      tanggal: parseTanggalIslam(post.date_gmt || post.date),
      urlSumber: cleanUrlIslam(post.link),
      urlPdf: null,
      instansi: "Jakarta Pusat Pengkajian Islam",
    };
  },
};

// Adapter gabungan untuk Hukum Islam - combines all working sources
export const hukumIslamAdapter: SourceAdapter = {
  id: "hukum-islam",
  name: "Hukum Islam (Gabungan: LPPOM MUI + JPI)",

  async fetchAll(): Promise<RawDocument[] | null> {
    // Could combine all sources, but fetchAll is rarely used
    return null;
  },

  async fetchList(page: number, limit = 20): Promise<FetchResult> {
    // Combine results from LPPOM MUI and JPI
    const halfLimit = Math.ceil(limit / 2);
    const [lppomResult, jpiResult] = await Promise.all([
      lppomMuiAdapter.fetchList!(page, halfLimit),
      jpiAdapter.fetchList!(page, halfLimit),
    ]);

    const combinedData = [...lppomResult.data, ...jpiResult.data];
    const total = lppomResult.total + jpiResult.total;
    
    return {
      data: combinedData.slice(0, limit),
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hasMore: combinedData.length >= limit,
    };
  },

  normalize(raw: unknown): NormalizedDocument | null {
    // Try LPPOM MUI first, then JPI
    return lppomMuiAdapter.normalize(raw) || jpiAdapter.normalize(raw);
  },
};