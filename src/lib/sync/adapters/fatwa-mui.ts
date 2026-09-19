import { SourceAdapter, NormalizedDocument, RawDocument, FetchResult } from "../types";

// Sumber: Database Fatwa Majelis Ulama Indonesia
// URL: https://fatwamui.com/data-fatwa
// Struktur: satu halaman server-rendered berisi tabel lengkap fatwa
// (DataTables di client, jadi SEMUA baris ikut dalam HTML — tidak ada paginasi
// server). Kolom: Judul Fatwa | Tema Fatwa | Nomor Fatwa | Tgl Ditetapkan | Aksi
// (tautan PDF "lihat" di fatwamui.com/storage/...; sebagian baris href="#" = tanpa PDF).

const DATABASE_URL = "https://fatwamui.com/data-fatwa";

const MONTHS: Record<string, number> = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
};

function decodeHtml(s: string): string {
  return s
    .replace(/&#039;/g, "'")
    .replace(/&#8217;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, " ")
    .replace(/&ndash;/g, "-")
    .replace(/&mdash;/g, "-")
    .trim();
}

// "16 December 2003" | "1 February 2010" -> Date
function parseTgl(v: string): Date | null {
  const m = v.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
  if (!m) return null;
  const month = MONTHS[m[2].toLowerCase()];
  if (!month) return null;
  return new Date(+m[3], month - 1, +m[1]);
}

// Ekstrak tiap baris <tr> tabel fatwa menjadi objek sederhana.
function parseRows(html: string): any[] {
  const rows: any[] = [];
  const trRe = /<tr>([\s\S]*?)<\/tr>/gi;
  let m: RegExpExecArray | null;
  while ((m = trRe.exec(html))) {
    const cells = (m[1].match(/<td[^>]*>([\s\S]*?)<\/td>/gi) || []).map((c) =>
      decodeHtml(c.replace(/<[^>]*>/g, " ").replace(/\s+/g, " "))
    );
    if (cells.length < 5) continue;
    const pdfM = m[1].match(/href="([^"]+\.pdf)"/i);
    const pdf = pdfM ? decodeHtml(pdfM[1]) : null;
    rows.push({
      judul: cells[1],
      tema: cells[2],
      nomor: cells[3],
      tanggal: cells[4],
      pdf,
    });
  }
  return rows;
}

// Identifier stabil untuk dedupe: pakai URL PDF bila ada, fallback ke judul.
function stableKey(row: any): string {
  if (row.pdf) return row.pdf;
  return `nopdf-${(row.judul || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")}`;
}

export const fatwaMuiAdapter: SourceAdapter = {
  id: "fatwa-mui",
  name: "Fatwa MUI (fatwamui.com) - Database Fatwa Resmi",

  async fetchList(page: number, limit = 20): Promise<FetchResult> {
    // Sumber adalah satu halaman statis; semua data kembali pada page 1.
    if (page > 1) {
      return { data: [], total: 0, page, totalPages: 1, hasMore: false };
    }
    try {
      const res = await fetch(DATABASE_URL, {
        headers: {
          "User-Agent": "Mozilla/5.0 HukumKu/1.0",
          Accept: "text/html",
        },
        signal: AbortSignal.timeout(45000),
      });
      if (!res.ok) {
        return { data: [], total: 0, page, totalPages: 1, hasMore: false };
      }
      const html = await res.text();
      const rows = parseRows(html);
      const data: RawDocument[] = rows.map((r) => ({
        externalId: `fm-${stableKey(r)}`,
        raw: r,
      }));
      return { data, total: rows.length, page, totalPages: 1, hasMore: false };
    } catch {
      return { data: [], total: 0, page, totalPages: 1, hasMore: false };
    }
  },

  normalize(raw: unknown): NormalizedDocument | null {
    const row = raw as Record<string, any>;
    const judul = row.judul || "";
    const tema = row.tema || "";
    const nomor = row.nomor || "";
    const tglStr = row.tanggal || "";
    if (!judul) return null;

    const tanggal = parseTgl(tglStr);
    const pdf = row.pdf && /^https?:\/\//i.test(row.pdf) ? row.pdf : null;
    const nomorText = nomor ? true : false;

    return {
      source: "fatwa-mui",
      sourceId: `fm-${stableKey(row)}`,
      jenis: tema || "Fatwa",
      nomor: nomor,
      tahun: tanggal ? String(tanggal.getFullYear()) : "",
      judul,
      tentang: nomorText
        ? `Fatwa Majelis Ulama Indonesia. Tema: ${tema}. ${nomor}.`
        : `Fatwa Majelis Ulama Indonesia. Tema: ${tema}.`,
      status: "berlaku",
      tanggal,
      urlSumber: pdf,
      urlPdf: pdf,
      instansi: "Majelis Ulama Indonesia",
      fullText: null,
    };
  },
};