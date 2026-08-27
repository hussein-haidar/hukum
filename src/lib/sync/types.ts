// Tahap 1, 2, 5: Abstraksi sumber data.
// Setiap sumber (JDIHN, Perpusnas, peraturan.go.id, dll) diimplementasikan
// sebagai SourceAdapter. Engine akan: (1) coba export (Tahap 1), (2) coba feed
// (Tahap 2), (3) fallback ke list+detail. Semua hasil dinormalisasi via mapper.

export interface NormalizedDocument {
  source: string;
  sourceId: string;
  jenis: string;
  nomor: string;
  tahun: string;
  judul: string;
  tentang?: string | null;
  status: string;
  tanggal?: Date | null;
  urlSumber?: string | null;
  urlPdf?: string | null;
  instansi?: string | null;
  fullText?: string | null;
}

export interface SyncResult {
  source: string;
  status: "success" | "partial" | "failed";
  documentsNew: number;
  documentsUpdated: number;
  documentsFailed: number;
  documentsFound: number;
  skipped: boolean; // Tahap 3: export/list tidak berubah -> dilewati
  message?: string;
  duration: number;
}

export interface RawDocument {
  externalId: string;
  raw: unknown;
}

export interface FetchResult {
  data: RawDocument[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}

// Format export yang didukung (Tahap 1).
export type ExportFormat = "json" | "csv" | "xml" | "zip";

export interface SourceExport {
  content: string;
  format: ExportFormat;
}

export interface SourceAdapter {
  id: string;
  name: string;

  // Tahap 1: Prefer export resmi (CSV/XLSX/JSON/XML/ZIP/bulk download/data dump).
  // Return null bila sumber tidak menyediakan export.
  fetchExport?: () => Promise<SourceExport | null>;

  // Tahap 2: Feed resmi (RSS/Atom/JSON Feed). Hanya berisi pointer ke data baru.
  // Return null bila sumber tidak menyediakan feed.
  fetchFeed?: () => Promise<RawDocument[] | null>;

  // Fallback: pengambilan terpaginas (API JSON atau hasil scrape HTML).
  fetchList: (page: number, limit: number) => Promise<FetchResult>;

  // Tahap 5: Normalisasi / mapper dari schema sumber -> schema Hukumku.
  normalize: (raw: unknown) => NormalizedDocument | null;

  // Tahap 8: Ambil detail (mis. URL PDF) untuk satu externalId.
  // Dipanggil terpisah dari metadata agar PDF tidak membebani sync metadata.
  fetchDetail?: (externalId: string) => Promise<Partial<NormalizedDocument> | null>;
}
