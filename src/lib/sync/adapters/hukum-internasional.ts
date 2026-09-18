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
const UN_DOCS_BASE = "https://documents.un.org";
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

// Adapter UN Treaty Collection
export const unTreatyAdapter: SourceAdapter = {
  id: "un-treaty",
  name: "UN Treaty Collection",

  async fetchList(page: number, limit = 50): Promise<FetchResult> {
    // TODO: UN Treaty Collection API
    // https://treaties.un.org/Pages/AdvanceSearch.aspx
    // Mungkin perlu scraping atau menggunakan UN Treaty Series API
    
    return { data: [], total: 0, page, totalPages: 1, hasMore: false };
  },

  normalize(raw: unknown): NormalizedDocument | null {
    const it = raw as Record<string, any>;
    const id = it.id || it.registration_number || it.treaty_id;
    const judul = it.title || it.treaty_title || "";
    if (!id || !judul) return null;

    return {
      source: "un-treaty",
      sourceId: `un-${id}`,
      jenis: mapJenisInternasional(it.type, judul, "UN"),
      nomor: it.registration_number || it.unts_number || "",
      tahun: String(it.year || it.conclusion_date?.slice(0, 4) || ""),
      judul,
      tentang: it.subject || it.summary || judul,
      status: it.status || "berlaku",
      tanggal: parseTanggalIntl(it.conclusion_date || it.entry_into_force || it.registration_date),
      urlSumber: cleanUrlIntl(it.url || `https://treaties.un.org/doc/Publication/UNTS/Volume%20${it.volume}/${id}.pdf`),
      urlPdf: cleanUrlIntl(it.pdf_url),
      instansi: "United Nations",
    };
  },
};

// Adapter HukumOnline Internasional
export const hukumOnlineIntlAdapter: SourceAdapter = {
  id: "hukumonline-intl",
  name: "HukumOnline - Hukum Internasional",

  async fetchList(page: number, limit = 20): Promise<FetchResult> {
    // TODO: HukumOnline API atau scraping
    // Kategori: https://www.hukumonline.com/klinik/kategori/hukum-internasional/
    
    return { data: [], total: 0, page, totalPages: 1, hasMore: false };
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
      urlPdf: cleanUrlIntl(it.pdf_url || `${UN_DOCS_BASE}/doc/undoc/gen/${symbol.replace(/[\/\s]/g, "-")}.pdf`),
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
  
  // Extract PDF link
  const pdfMatch = html.match(/href="([^"]+\.pdf)"/i);
  const pdfUrl = pdfMatch ? (pdfMatch[1].startsWith("http") ? pdfMatch[1] : `${UNDOCS_BASE}${pdfMatch[1]}`) : null;
  
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

// Adapter gabungan Hukum Internasional
export const hukumInternasionalAdapter: SourceAdapter = {
  id: "hukum-internasional",
  name: "Hukum Internasional (Gabungan)",

  async fetchAll(): Promise<RawDocument[] | null> {
    // Bisa menggabungkan dari multiple sumber di atas
    return null;
  },

  normalize(raw: unknown): NormalizedDocument | null {
    return unTreatyAdapter.normalize(raw);
  },
};