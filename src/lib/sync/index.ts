import { SyncResult } from "./types";
import { runAdapterSync, runAllSync, runScheduledSync } from "./engine";
import { getAdapter, getAllAdapters } from "./registry";

export type { SyncResult };

// Jalankan semua sumber (Tahap 1-8).
export async function syncAll(): Promise<SyncResult[]> {
  return runAllSync(getAllAdapters());
}

// Jalankan satu sumber berdasarkan id.
export async function syncSource(source: string): Promise<SyncResult> {
  const adapter = getAdapter(source);
  if (!adapter) {
    return {
      source,
      status: "failed",
      documentsNew: 0,
      documentsUpdated: 0,
      documentsFailed: 0,
      documentsFound: 0,
      skipped: false,
      duration: 0,
      message: `Unknown source: ${source}`,
    };
  }
  return runAdapterSync(adapter);
}

// Dipanggil oleh scheduler eksternal (Tahap 9).
export { runScheduledSync };
