import { SourceAdapter, NormalizedDocument, ExportFormat } from "../types";

// Sumber: JDIH Kementerian Hukum dan HAM (anggota jaringan JDIHN).
// Endpoint: https://jdih.kemenkum.go.id/feed/document.json
// Ini adalah EXPORT resmi (Tahap 1): satu file JSON berisi SELURUH peraturan
// nasional (UUD, UU, PP, Perpres, Permen, dsb) lengkap dengan URL PDF.
// Ukuran ~74 MB -> untuk produksi sebaiknya dijalankan lewat scheduler eksternal
// (GitHub Action / server) bukan function Vercel default (batas memori).

const FEED_URL = "https://jdih.kemenkum.go.id/feed/document.json";

const JENIS_MAP: Record<string, string> = {
  UUD: "UUD",
  UU: "Undang-Undang",
  PP: "Peraturan Pemerintah",
  PERPRES: "Peraturan Presiden",
  PERMEN: "Peraturan Menteri",
  KEPRES: "Keputusan Presiden",
  INPRES: "Instruksi Presiden",
  PERDA: "Peraturan Daerah",
};

function mapJenis(singkatan?: string, jenis?: string): string {
  if (singkatan && JENIS_MAP[singkatan]) return JENIS_MAP[singkatan];
  if (jenis) return jenis;
  return "";
}

export const jdihnKemenkumAdapter: SourceAdapter = {
  id: "jdihn-kemenkum",
  name: "JDIHN (Kemenkumham Feed)",

  // Tahap 1: Export resmi (file JSON tunggal).
  async fetchExport(): Promise<{ content: string; format: ExportFormat } | null> {
    try {
      const res = await fetch(FEED_URL, {
        headers: { "User-Agent": "Mozilla/5.0 HukumKu/1.0" },
        signal: AbortSignal.timeout(120000),
      });
      if (!res.ok) return null;
      const text = await res.text();
      if (!text.startsWith("[")) return null;
      return { content: text, format: "json" };
    } catch {
      return null;
    }
  },

  normalize(raw: unknown): NormalizedDocument | null {
    const it = raw as Record<string, any>;
    const id = it.idData;
    if (id == null) return null;
    const judul = it.judul || "";
    if (!judul) return null;

    const statusRaw = (it.status || "").toString().toLowerCase();
    const status = statusRaw.includes("tidak")
      ? "tidak_berlaku"
      : statusRaw.includes("berlaku")
      ? "berlaku"
      : "berlaku";

    const tanggal = it.tanggal_penetapan ? new Date(it.tanggal_penetapan) : null;
    const nomor = it.noPeraturan && it.noPeraturan !== "-" ? String(it.noPeraturan) : "";

    return {
      source: "jdihn-kemenkum",
      sourceId: `kmk-${id}`,
      jenis: mapJenis(it.singkatanJenis, it.jenis),
      nomor,
      tahun: String(it.tahun_pengundangan || ""),
      judul,
      tentang: judul,
      status,
      tanggal,
      urlSumber: it.urlDetailPeraturan || null,
      urlPdf: it.urlDownload || null, // URL PDF langsung dari feed
      instansi: it.teuBadan || "Kementerian Hukum dan HAM",
    };
  },
};
