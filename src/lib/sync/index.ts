import { syncJDIHN } from "./jdihn";
import { syncBPK } from "./perpusnas";
import { syncSampleData } from "./sample";
import { syncPeraturanGoId } from "./peraturan-go-id";
import { SyncResult } from "./types";

export type { SyncResult };

export async function syncAll(): Promise<SyncResult[]> {
  const results: SyncResult[] = [];

  const peraturanResult = await syncPeraturanGoId();
  results.push(peraturanResult);

  return results;
}

export async function syncSource(source: string): Promise<SyncResult> {
  switch (source) {
    case "jdihn":
      return syncJDIHN();
    case "perpusnas":
    case "bpk":
      return syncBPK();
    case "peraturan":
      return syncPeraturanGoId();
    case "sample":
      return syncSampleData();
    default:
      return {
        source,
        status: "failed",
        documentsNew: 0,
        documentsUpdated: 0,
        documentsFailed: 0,
        duration: 0,
        message: `Unknown source: ${source}`,
      };
  }
}
