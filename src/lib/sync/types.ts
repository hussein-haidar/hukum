export interface SyncSource {
  name: string;
  id: string;
  baseUrl: string;
  fetchDocuments(page: number, limit: number): Promise<FetchResult>;
  normalize(raw: any): NormalizedDocument | null;
}

export interface FetchResult {
  data: any[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}

export interface NormalizedDocument {
  source: string;
  sourceId: string;
  jenis: string;
  nomor: string;
  tahun: string;
  judul: string;
  tentang?: string;
  status: string;
  tanggal?: Date;
  urlSumber?: string;
  urlPdf?: string;
  instansi?: string;
  fullText?: string;
}

export interface SyncResult {
  source: string;
  status: "success" | "partial" | "failed";
  documentsNew: number;
  documentsUpdated: number;
  documentsFailed: number;
  message?: string;
  duration: number;
}

export type SyncStatus = "idle" | "syncing" | "completed" | "failed";
