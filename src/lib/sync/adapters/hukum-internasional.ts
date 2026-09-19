import { SourceAdapter, FetchResult, RawDocument, NormalizedDocument } from "../types";

// Sumber Hukum Internasional potensial:
// 1. UN Treaty Collection (treaties.un.org) - traktat/konvensi internasional (complex ASP.NET, placeholder)
// 2. UN Documents (undocs.org, documents.un.org) - resolusi, laporan, dokumen resmi UN
// 3. HukumOnline kategori Internasional - analisis hukum internasional
// 4. Database HAM: OHCHR UHRI API - sudah implemented
// 5. ASEAN Legal Documents - hukum regional ASEAN
// 6. WTO Dispute Settlement - putusan WTO
// 7. ILO Conventions - konvensi ILO
// 8. WIPO - hukum kekayaan intelektual internasional

const UNDOCS_BASE = "https://undocs.org";
const UN_TREATY_BASE = "https://treaties.un.org";
const HUKUMONLINE_BASE = "https://www.hukumonline.com";
const OHCHR_BASE = "https://www.ohchr.org";

// Common UN document symbol patterns for fetching
const UN_DOC_SYMBOL_PATTERNS = [
  // General Assembly Resolutions
  { prefix: "A/RES/", start: 70, end: 79, type: "Resolusi Majelis Umum" },
  { prefix: "A/RES/", start: 60, end: 69, type: "Resolusi Majelis Umum" },
  { prefix: "A/RES/", start: 50, end: 59, type: "Resolusi Majelis Umum" },
  // Security Council Resolutions
  { prefix: "S/RES/", start: 1900, end: 2800, type: "Resolusi DK PBB" },
  // Human Rights Council
  { prefix: "A/HRC/RES/", start: 1, end: 60, type: "Resolusi HAM" },
  // Treaty Bodies
  { prefix: "CCPR/C/", start: 1, end: 140, type: "Komite HAM" },
  { prefix: "CEDAW/C/", start: 1, end: 90, type: "CEDAW" },
  { prefix: "CRC/C/", start: 1, end: 100, type: "CRC" },
  { prefix: "CAT/C/", start: 1, end: 80, type: "CAT" },
  // Special Procedures
  { prefix: "A/HRC/", start: 1, end: 60, type: "Prosedur Khusus HAM" },
];

const JENIS_HUKUM_INTERNASIONAL: Record<string, string> = {
  "TREATY": "Traktat/Konvensi",
  "CONVENTION": "Konvensi",
  "PROTOCOL": "Protokol",
  "CHARTER": "Piagam",
  "DECLARATION": "Deklarasi",
  "RESOLUTION": "Resolusi",
  "DECISION": "Keputusan",
  "JUDGMENT": "Putusan",
  "ADVISORY OPINION": "Opini Konsultatif",
  "GENERAL COMMENT": "Komentar Umum",
  "CONCLUDING OBSERVATIONS": "Observasi Penutup",
  "HUMAN RIGHTS": "HAM",
  "INTERNATIONAL LAW": "Hukum Internasional",
  "TRADE LAW": "Hukum Perdagangan",
  "ENVIRONMENTAL LAW": "Hukum Lingkungan",
  "HUMANITARIAN LAW": "Hukum Kemanusiaan",
  "CRIMINAL LAW": "Hukum Pidana Internasional",
  "LAW OF THE SEA": "Hukum Laut",
  "DIPLOMATIC LAW": "Hukum Diplomatik",
  "CONSULAR LAW": "Hukum Konsuler",
  "STATE RESPONSIBILITY": "Tanggung Jawab Negara",
  "INTERNATIONAL ORGANIZATIONS": "Organisasi Internasional",
  "DISPUTE SETTLEMENT": "Penyelesaian Sengketa",
  "ARBITRATION": "Arbitrase",
  "MEDIATION": "Mediasi",
};

function mapJenisInternasional(kategori?: string, judul?: string, sumber?: string): string {
  const text = ((kategori || "") + " " + (judul || "") + " " + (sumber || "")).toUpperCase();
  for (const [k, v] of Object.entries(JENIS_HUKUM_INTERNASIONAL)) {
    if (text.includes(k)) return v;
  }
  // Default berdasarkan sumber
  if (sumber?.includes("UN") || sumber?.includes("treaties")) return "Traktat/Konvensi UN";
  if (sumber?.includes("HukumOnline")) return "Analisis Hukum Internasional";
  if (sumber?.includes("OHCHR") || sumber?.includes("HAM")) return "HAM Internasional";
  if (sumber?.includes("ICJ") || sumber?.includes("ICC")) return "Putusan Pengadilan Internasional";
  if (sumber?.includes("WTO")) return "Hukum Perdagangan WTO";
  if (sumber?.includes("ILO")) return "Konvensi ILO";
  if (sumber?.includes("ASEAN")) return "Hukum ASEAN";
  return kategori || "Hukum Internasional";
}

function parseTanggalIntl(v: unknown): Date | null {
  if (v == null || v === "") return null;
  const s = String(v).trim();
  // ISO format
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return new Date(+iso[1], +iso[2] - 1, +iso[3]);
  // dd/mm/yyyy atau dd-mm-yyyy
  const dmy = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (dmy) return new Date(+dmy[3], +dmy[2] - 1, +dmy[1]);
  // dd Month yyyy
  const bulan: Record<string, number> = {
    january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
    july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
    jan: 0, feb: 1, mar: 2, apr: 3, jun: 5,
    jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
  };
  const dmyText = s.match(/^(\d{1,2})\s+(\w+)\s+(\d{4})$/i);
  if (dmyText) {
    const bln = bulan[dmyText[2].toLowerCase()];
    if (bln !== undefined) return new Date(+dmyText[3], bln, +dmyText[1]);
  }
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

function cleanUrlIntl(v: unknown): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  if (!/^https?:\/\//i.test(s)) return null;
  return s;
}

// URL akses PDF resmi UN (undocs.org embed ke endpoint ini).
// Pola lama documents.un.org/doc/undoc/gen/... sering 404/HTML, jadi
// pakai /api/symbol/access yang menjamin response application/pdf.
function unPdfAccessUrl(symbol: string): string {
  return `https://documents.un.org/api/symbol/access?s=${encodeURIComponent(symbol)}&l=en&t=pdf`;
}

// UN Treaty Collection
// Scraping halaman daftar per bab (Treaties.aspx?id={chapter}) karena tiap bab
// berisi daftar traktat lengkap (judul, tanggal, mtdsg_no). Halaman ASP.NET
// WebForms lambat -> pakai retry + jeda antar request.
const TREATY_BASE = "https://treaties.un.org";
const TREATY_CHAPTERS = Array.from({ length: 27 }, (_, i) => i + 1);

function parseTreatyRows(html: string, chapter: number): Record<string, any>[] {
  const rows: Record<string, any>[] = [];
  // Setiap <tr> berisi <a href="ViewDetails.aspx?...&mtdsg_no=X-...">Judul</a>
  const trRe = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let tm: RegExpExecArray | null;
  while ((tm = trRe.exec(html)) !== null) {
    const rowHtml = tm[1];
    if (!rowHtml.includes("ViewDetails.aspx")) continue;
    const href = rowHtml.match(/ViewDetails\.aspx\?src=TREATY&amp;mtdsg_no=([^&"']+)/);
    const titleMatch = rowHtml.match(/<a[^>]*>([\s\S]*?)<\/a>/);
    if (!href || !titleMatch) continue;

    const mtdsgNo = href[1].trim();
    const judul = titleMatch[1]
      .replace(/<[^>]*>/g, "")
      .replace(/&amp;/g, "&")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (!judul) continue;

    // Tahun dari teks "New York, 16 December 1966" atau "(16 December 1966)"
    const yearMatch = judul.match(/(19|20)\d{2}/);
    // Tanggal lengkap
    const dateMatch = judul.match(/\(?(\d{1,2}\s+\w+\s+(?:19|20)\d{2})\)?/);

    rows.push({
      mtdsg_no: mtdsgNo,
      title: judul,
      chapter,
      year: yearMatch ? yearMatch[0] : "",
      date: dateMatch ? dateMatch[1].trim() : "",
      detail_url: `${TREATY_BASE}/Pages/ViewDetails.aspx?src=TREATY&mtdsg_no=${mtdsgNo}&chapter=${chapter}&clang=_en`,
    });
  }
  return rows;
}

async function fetchTreatyChapter(
  chapter: number,
  retries = 2
): Promise<Record<string, any>[]> {
  const url = `${TREATY_BASE}/Pages/Treaties.aspx?id=${chapter}&subid=A&clang=_en`;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 HukumKu/1.0" },
        signal: AbortSignal.timeout(25000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const html = await res.text();
      const rows = parseTreatyRows(html, chapter);
      if (rows.length > 0) return rows;
    } catch (e: any) {
      if (attempt === retries) {
        console.error(`[un-treaty] chapter ${chapter} error:`, e?.message);
      }
      await new Promise((r) => setTimeout(r, 1500));
    }
  }
  return [];
}

export const unTreatyAdapter: SourceAdapter = {
  id: "un-treaty",
  name: "UN Treaty Collection",

  // Meng-crawl semua bab (1-27) dengan concurrency terbatas.
  async fetchAll(): Promise<RawDocument[] | null> {
    const all: Record<string, any>[] = [];
    const CONCURRENCY = 3;
    for (let i = 0; i < TREATY_CHAPTERS.length; i += CONCURRENCY) {
      const batch = TREATY_CHAPTERS.slice(i, i + CONCURRENCY);
      const results = await Promise.all(batch.map((c) => fetchTreatyChapter(c)));
      for (const rows of results) all.push(...rows);
      // Jeda antar batch supaya tidak membanjiri server ASP.NET
      if (i + CONCURRENCY < TREATY_CHAPTERS.length) {
        await new Promise((r) => setTimeout(r, 1200));
      }
    }
    return all.length > 0 ? all.map((r) => ({ externalId: r.mtdsg_no, raw: r })) : null;
  },

  async fetchList(page: number, limit = 50): Promise<FetchResult> {
    const all = await this.fetchAll!();
    if (!all) return { data: [], total: 0, page, totalPages: page, hasMore: false };
    const start = (page - 1) * limit;
    const data = all.slice(start, start + limit);
    return {
      data,
      total: all.length,
      page,
      totalPages: Math.ceil(all.length / limit),
      hasMore: start + limit < all.length,
    };
  },

  normalize(raw: unknown): NormalizedDocument | null {
    const it = raw as Record<string, any>;
    const id = it.mtdsg_no || it.id || it.registration_number;
    const judul = it.title || it.treaty_title || "";
    if (!id || !judul) return null;

    return {
      source: "un-treaty",
      sourceId: `un-${id}`,
      jenis: mapJenisInternasional(it.type, judul, "UN"),
      nomor: id,
      tahun: String(it.year || it.conclusion_date?.slice(0, 4) || ""),
      judul,
      tentang: it.subject || it.summary || judul,
      status: it.status || "berlaku",
      tanggal: parseTanggalIntl(it.date || it.conclusion_date || it.entry_into_force),
      urlSumber: cleanUrlIntl(it.detail_url || it.url),
      urlPdf: cleanUrlIntl(it.pdf_url),
      instansi: "United Nations",
    };
  },
};

// HukumOnline - Hukum Internasional
// Tidak ada kategori /berita/internasional/ (404), jadi ambil daftar berita
// umum lalu saring dengan kata kunci internasional. Berita list tersedia di
// https://www.hukumonline.com/berita/?page=N
const HOL_INTL_KEYWORDS = [
  "internasional", "international", "pbb ", "un ", "asean", "wto", "oecd",
  "icj", "icc", "perjanjian", "traktat", "konvensi", "ratifikasi", "global",
  "negara asing", "asing", "luar negeri", "ekstradisi", "investasi asing",
  "hukum laut", "unclos", "ius cogens", "diplomatik", "statuta roma",
];

const HOL_MAX_PAGES = 3;

function extractHukBonlineArticles(html: string): Record<string, any>[] {
  const items: Record<string, any>[] = [];
  // Item berbentuk <a href="/berita/a/{slug}">Judul</a>
  const linkRe = /<a[^>]*href="(\/berita\/a\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  let lm: RegExpExecArray | null;
  while ((lm = linkRe.exec(html)) !== null) {
    const href = lm[1].trim();
    const title = lm[2]
      .replace(/<[^>]*>/g, "")
      .replace(/\s+/g, " ")
      .replace(/\s*\d{1,2}\s+(?:Jan|Feb|Mar|Apr|Mei|Jun|Jul|Agu|Sep|Okt|Nov|Des|\w+)\s+\d{4}$/i, "")
      .trim();
    if (!href || !title || title.length < 15) continue;
    const slug = href.replace(/\/berita\/a\//, "").replace(/\/$/, "").split("?")[0];
    items.push({ slug, title, url: HUKUMONLINE_BASE + href });
  }
  return items;
}

function isHolIntlArticle(it: Record<string, any>): boolean {
  const text = ((it.title || "") + " " + (it.category || "")).toLowerCase();
  for (const kw of HOL_INTL_KEYWORDS) {
    if (text.includes(kw)) return true;
  }
  return false;
}

export const hukumOnlineIntlAdapter: SourceAdapter = {
  id: "hukumonline-intl",
  name: "HukumOnline - Hukum Internasional",

  async fetchAll(): Promise<RawDocument[] | null> {
    const seen = new Set<string>();
    const all: Record<string, any>[] = [];
    for (let page = 1; page <= HOL_MAX_PAGES; page++) {
      try {
        const res = await fetch(`${HUKUMONLINE_BASE}/berita/?page=${page}`, {
          headers: { "User-Agent": "Mozilla/5.0 HukumKu/1.0" },
          signal: AbortSignal.timeout(20000),
        });
        if (!res.ok) break;
        const html = await res.text();
        const items = extractHukBonlineArticles(html).filter(isHolIntlArticle);
        for (const it of items) {
          if (!seen.has(it.slug)) {
            seen.add(it.slug);
            all.push(it);
          }
        }
        // Kalau ini halaman terakhir (tidak ada navigasi halaman berikutnya), berhenti
        if (!/berita\/\?page=\d+/.test(html) || !html.includes(`page=${page + 1}`)) break;
      } catch (e: any) {
        console.error(`[hukumonline-intl] page ${page} error:`, e?.message);
        break;
      }
    }
    return all.length > 0 ? all.map((r) => ({ externalId: r.slug, raw: r })) : null;
  },

  async fetchList(page: number, limit = 20): Promise<FetchResult> {
    const all = await this.fetchAll!();
    if (!all) return { data: [], total: 0, page, totalPages: page, hasMore: false };
    const start = (page - 1) * limit;
    const data = all.slice(start, start + limit);
    return {
      data,
      total: all.length,
      page,
      totalPages: Math.ceil(all.length / limit),
      hasMore: start + limit < all.length,
    };
  },

  normalize(raw: unknown): NormalizedDocument | null {
    const it = raw as Record<string, any>;
    const id = it.id || it.slug;
    const judul = it.title || it.judul || "";
    if (!id || !judul) return null;

    return {
      source: "hukumonline-intl",
      sourceId: `hol-intl-${id}`,
      jenis: mapJenisInternasional(it.category, judul, "HukumOnline"),
      nomor: "",
      tahun: String(it.year || new Date(it.published_at).getFullYear() || ""),
      judul,
      tentang: it.excerpt || it.content || judul,
      status: "berlaku",
      tanggal: parseTanggalIntl(it.published_at || it.date),
      urlSumber: cleanUrlIntl(it.url || it.permalink),
      urlPdf: null,
      instansi: "HukumOnline",
    };
  },
};

const UHRI_API = "https://uhri.ohchr.org/api";

// Adapter OHCHR UHRI (Universal Human Rights Index) - API JSON resmi
export const ohchrAdapter: SourceAdapter = {
  id: "ohchr",
  name: "OHCHR UHRI - HAM Internasional",

  async fetchList(page: number, limit = 50): Promise<FetchResult> {
    try {
      const offset = (page - 1) * limit;
      const res = await fetch(`${UHRI_API}/Document?limit=${limit}&offset=${offset}`, {
        headers: {
          "User-Agent": "Mozilla/5.0 HukumKu/1.0",
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(30000),
      });
      if (!res.ok) {
        return { data: [], total: 0, page, totalPages: page, hasMore: false };
      }
      const json = (await res.json()) as any;
      // UHRI API response: { data: [...], total: N, ... }
      const items: any[] = json.data || [];
      const total = json.total || items.length;
      const totalPages = Math.ceil(total / limit);

      const data: RawDocument[] = items.map((it: any) => ({
        externalId: String(it.id || it.symbol || `doc-${offset}-${items.indexOf(it)}`),
        raw: it,
      }));

      return { data, total, page, totalPages, hasMore: page < totalPages };
    } catch (e) {
      console.error("[ohchr] fetchList error:", e);
      return { data: [], total: 0, page, totalPages: page, hasMore: false };
    }
  },

  normalize(raw: unknown): NormalizedDocument | null {
    const it = raw as Record<string, any>;
    // UHRI Document structure: id, symbol, title, document_type, date, themes, countries, body, url, pdf_url, etc.
    const id = it.id || it.symbol || it.doc_symbol;
    const judul = it.title || it.document_title || it.name || "";
    if (!id || !judul) return null;

    // Map document_type ke jenis
    const jenis = mapJenisInternasional(it.document_type, judul, "OHCHR");

    return {
      source: "ohchr",
      sourceId: `ohchr-${id}`,
      jenis,
      nomor: it.symbol || it.doc_symbol || "",
      tahun: String(it.year || it.date?.slice(0, 4) || new Date(it.date).getFullYear() || ""),
      judul,
      tentang: it.summary || it.abstract || it.description || judul,
      status: "berlaku",
      tanggal: parseTanggalIntl(it.date || it.publication_date || it.adoption_date),
      urlSumber: cleanUrlIntl(it.url || `https://uhri.ohchr.org/document/${id}`),
      urlPdf: cleanUrlIntl(it.pdf_url || it.download_url),
      instansi: it.body || it.issuing_body || "OHCHR / United Nations",
    };
  },
};

// Adapter UN Documents (undocs.org / documents.un.org)
// Fetch by known document symbol patterns
export const unDocumentsAdapter: SourceAdapter = {
  id: "un-documents",
  name: "UN Documents (undocs.org)",

  async fetchList(page: number, limit = 50): Promise<FetchResult> {
    try {
      // Generate document symbols for this page
      const allSymbols = generateUnDocumentSymbols();
      const start = (page - 1) * limit;
      const pageSymbols = allSymbols.slice(start, start + limit);
      
      // Fetch metadata for each symbol in parallel (with concurrency limit)
      const results = await fetchUnDocumentsMetadata(pageSymbols, 5);
      
      const data: RawDocument[] = results
        .filter((r): r is RawDocument => r !== null)
        .map((r, i) => ({
          externalId: `un-doc-${start + i}`,
          raw: r,
        }));

      return {
        data,
        total: allSymbols.length,
        page,
        totalPages: Math.ceil(allSymbols.length / limit),
        hasMore: start + limit < allSymbols.length,
      };
    } catch (e) {
      console.error("[un-documents] fetchList error:", e);
      return { data: [], total: 0, page, totalPages: page, hasMore: false };
    }
  },

  normalize(raw: unknown): NormalizedDocument | null {
    const it = raw as Record<string, any>;
    const symbol = it.symbol;
    const judul = it.title || it.judul || "";
    if (!symbol || !judul) return null;

    // Determine jenis from symbol prefix
    let jenis = "Dokumen PBB";
    if (symbol.startsWith("A/RES/")) jenis = "Resolusi Majelis Umum";
    else if (symbol.startsWith("S/RES/")) jenis = "Resolusi DK PBB";
    else if (symbol.startsWith("A/HRC/RES/")) jenis = "Resolusi Dewan HAM";
    else if (symbol.includes("/C/")) jenis = "Laporan Komite Traktat";
    else if (symbol.startsWith("A/")) jenis = "Dokumen Majelis Umum";
    else if (symbol.startsWith("S/")) jenis = "Dokumen Dewan Keamanan";
    else if (symbol.startsWith("E/")) jenis = "Dokumen ECOSOC";
    else if (symbol.startsWith("ST/")) jenis = "Dokumen Sekretariat";

    return {
      source: "un-documents",
      sourceId: `un-doc-${symbol.replace(/[\/\s]/g, "-")}`,
      jenis,
      nomor: symbol,
      tahun: String(it.year || extractYearFromSymbol(symbol) || new Date().getFullYear()),
      judul,
      tentang: it.summary || it.description || judul,
      status: "berlaku",
      tanggal: parseTanggalIntl(it.date || it.publication_date),
      urlSumber: cleanUrlIntl(it.url || `${UNDOCS_BASE}/en/${symbol.replace(/\//g, "/")}`),
      urlPdf: cleanUrlIntl(it.pdf_url) || unPdfAccessUrl(symbol),
      instansi: it.body || "United Nations",
    };
  },
};

// Helper functions for UN Documents
function generateUnDocumentSymbols(): string[] {
  const symbols: string[] = [];
  
  // GA Resolutions (recent sessions)
  for (let session = 75; session <= 79; session++) {
    for (let num = 1; num <= 350; num++) {
      symbols.push(`A/RES/${session}/${num}`);
    }
  }
  
  // SC Resolutions (recent)
  for (let num = 2500; num <= 2750; num++) {
    symbols.push(`S/RES/${num} (${2020 + Math.floor((num - 2500) / 50)})`);
  }
  
  // HRC Resolutions
  for (let session = 40; session <= 56; session++) {
    for (let num = 1; num <= 40; num++) {
      symbols.push(`A/HRC/RES/${session}/${num}`);
    }
  }
  
  // Treaty Body sessions (sample)
  const treatyBodies = ["CCPR", "CEDAW", "CRC", "CAT", "CRPD", "CERD", "CMW", "CED"];
  for (const body of treatyBodies) {
    for (let session = 100; session <= 140; session++) {
      for (let doc = 1; doc <= 10; doc++) {
        symbols.push(`${body}/C/${session}/${doc}`);
      }
    }
  }
  
  return symbols;
}

async function fetchUnDocumentsMetadata(symbols: string[], concurrency = 5): Promise<(Record<string, any> | null)[]> {
  const results: (Record<string, any> | null)[] = [];
  
  for (let i = 0; i < symbols.length; i += concurrency) {
    const batch = symbols.slice(i, i + concurrency);
    const promises = batch.map(async (symbol) => {
      try {
        // Try undocs.org first (HTML page with metadata)
        const url = `${UNDOCS_BASE}/en/${symbol.replace(/\//g, "/")}`;
        const res = await fetch(url, {
          headers: { "User-Agent": "Mozilla/5.0 HukumKu/1.0" },
          signal: AbortSignal.timeout(15000),
        });
        
        if (!res.ok) return null;
        const html = await res.text();
        return parseUnDocumentHtml(html, symbol);
      } catch {
        return null;
      }
    });
    
    const batchResults = await Promise.all(promises);
    results.push(...batchResults);
    
    // Small delay between batches
    if (i + concurrency < symbols.length) {
      await new Promise(r => setTimeout(r, 500));
    }
  }
  
  return results;
}

function parseUnDocumentHtml(html: string, symbol: string): Record<string, any> | null {
  // Extract title from HTML
  const titleMatch = html.match(/<title>([^<]+)<\/title>/i) ||
                     html.match(/<h1[^>]*>([^<]+)<\/h1>/i) ||
                     html.match(/class="document-title"[^>]*>([^<]+)</i);
  
  const title = titleMatch ? titleMatch[1].trim().replace(/^\s*UN\s*Doc\s*[:\-]\s*/i, "") : "";
  if (!title || title.toLowerCase().includes("not found") || title.toLowerCase().includes("404")) {
    return null;
  }
  
  // Extract date
  const dateMatch = html.match(/(?:date|Date|tanggal)[:\s]*([^<\n]+)/i) ||
                    html.match(/(\d{1,2}\s+\w+\s+\d{4})/);
  const date = dateMatch ? dateMatch[1].trim() : "";
  
  // Extract summary/description
  const summaryMatch = html.match(/<meta name="description" content="([^"]*)"/i) ||
                       html.match(/class="abstract"[^>]*>([^<]+)</i) ||
                       html.match(/<p[^>]*class="summary"[^>]*>([^<]+)</i);
  const summary = summaryMatch ? summaryMatch[1].trim() : "";
  
  // Extract PDF link (utamakan endpoint akses resmi yang dipakai undocs.org)
  const accessMatch = html.match(/src="(https:\/\/documents\.un\.org\/api\/symbol\/access\?[^"]+)"/i);
  let pdfUrl: string | null = accessMatch ? accessMatch[1].replace(/&amp;/g, "&") : null;
  if (!pdfUrl) {
    const pdfMatch = html.match(/href="([^"]+\.pdf)"/i);
    if (pdfMatch) pdfUrl = pdfMatch[1].startsWith("http") ? pdfMatch[1] : `${UNDOCS_BASE}${pdfMatch[1]}`;
  }
  
  // Extract year from symbol
  const year = extractYearFromSymbol(symbol);
  
  return {
    symbol,
    title,
    date,
    summary,
    pdf_url: pdfUrl,
    year,
    body: extractBodyFromSymbol(symbol),
  };
}

function extractYearFromSymbol(symbol: string): number | null {
  // A/RES/76/300 -> 2021 (session 76 = 2021-2022)
  const gaMatch = symbol.match(/A\/RES\/(\d+)\//);
  if (gaMatch) {
    const session = parseInt(gaMatch[1]);
    // GA session 1 = 1946, session 76 = 2021
    return 1945 + session;
  }
  
  // S/RES/2600 (2021) -> extract year from parentheses
  const scMatch = symbol.match(/\((\d{4})\)/);
  if (scMatch) return parseInt(scMatch[1]);
  
  // A/HRC/RES/50/1 -> session 50 ~ 2022
  const hrcMatch = symbol.match(/A\/HRC\/RES\/(\d+)\//);
  if (hrcMatch) {
    const session = parseInt(hrcMatch[1]);
    return 2006 + session; // HRC started 2006
  }
  
  return null;
}

function extractBodyFromSymbol(symbol: string): string {
  if (symbol.startsWith("A/RES/")) return "General Assembly";
  if (symbol.startsWith("S/RES/")) return "Security Council";
  if (symbol.startsWith("A/HRC/")) return "Human Rights Council";
  if (symbol.includes("/C/")) return symbol.split("/C/")[0]; // CCPR, CEDAW, etc.
  if (symbol.startsWith("A/")) return "General Assembly";
  if (symbol.startsWith("S/")) return "Security Council";
  if (symbol.startsWith("E/")) return "ECOSOC";
  if (symbol.startsWith("ST/")) return "Secretariat";
  return "United Nations";
}

// Helper to get adapters (avoids TDZ issues)
function getOhchrAdapter() { return ohchrAdapter; }
function getUnDocsAdapter() { return unDocumentsAdapter; }

// Adapter gabungan Hukum Internasional - combines OHCHR + UN Documents
export const hukumInternasionalAdapter: SourceAdapter = {
  id: "hukum-internasional",
  name: "Hukum Internasional (Gabungan: OHCHR + UN Documents)",

  async fetchAll(): Promise<RawDocument[] | null> {
    return null;
  },

  async fetchList(page: number, limit = 50): Promise<FetchResult> {
    // Combine results from OHCHR and UN Documents
    const halfLimit = Math.ceil(limit / 2);
    const [ohchrResult, unDocsResult] = await Promise.all([
      getOhchrAdapter().fetchList!(page, halfLimit),
      getUnDocsAdapter().fetchList!(page, halfLimit),
    ]);

    const combinedData = [...ohchrResult.data, ...unDocsResult.data];
    const total = ohchrResult.total + unDocsResult.total;
    
    return {
      data: combinedData.slice(0, limit),
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hasMore: combinedData.length >= limit,
    };
  },

  normalize(raw: unknown): NormalizedDocument | null {
    // Try OHCHR first, then UN Documents
    return getOhchrAdapter().normalize(raw) || getUnDocsAdapter().normalize(raw);
  },
};