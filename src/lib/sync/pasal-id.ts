import { prisma } from "@/lib/prisma";
import { SyncResult } from "./types";

const BASE_URL = "https://pasal.id";

export async function syncPasalId(): Promise<SyncResult> {
  const startTime = Date.now();
  let documentsNew = 0;
  let documentsUpdated = 0;
  let documentsFailed = 0;
  const errors: string[] = [];

  try {
    const res = await fetch(`${BASE_URL}/api/v1/peraturan`, {
      headers: {
        "User-Agent": "HukumKu/1.0 (Open Data Research)",
        "Authorization": "Bearer pasal_mcp_251a7e945413_4e2e97c881f4673aad0f3c84823550cc50fb348a0fcd63c1",
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      const msg = `Pasal.id API mengembalikan status ${res.status}`;
      errors.push(msg);
      documentsFailed++;
    } else {
      const json = await res.json();
      const items = json.data || [];

      for (const item of items) {
        try {
          const sourceId = String(item.id || "");
          const jenis = item.jenis || "";
          const nomor = item.nomor || "";
          const tahun = item.tahun || "";
          const judul = item.judul || "";

          if (!sourceId || !judul) {
            documentsFailed++;
            continue;
          }

          const existing = await prisma.legalDocument.findUnique({
            where: {
              source_sourceId: {
                source: "pasal.id",
                sourceId,
              },
            },
          });

          if (existing) {
            documentsUpdated++;
          } else {
            await prisma.legalDocument.create({
              data: {
                source: "pasal.id",
                sourceId,
                jenis,
                nomor: String(nomor),
                tahun: String(tahun),
                judul,
                tentang: item.tentang || judul,
                status: "berlaku",
                urlSumber: item.url || `${BASE_URL}/peraturan/${sourceId}`,
                instansi: item.instansi || undefined,
              },
            });
            documentsNew++;
          }
        } catch (err) {
          documentsFailed++;
        }
      }
    }
  } catch (err: any) {
    const msg = err.name === "TimeoutError" || err.name === "AbortError"
      ? "Pasal.id API timeout - server tidak merespon dalam 15 detik"
      : `Pasal.id API error: ${err.message || "Unknown"}`;
    errors.push(msg);
    documentsFailed++;
  }

  const duration = Date.now() - startTime;
  const finalStatus = documentsNew === 0 && documentsFailed > 0 ? "failed" : documentsNew > 0 ? "success" : "partial";
  const message = errors.length > 0
    ? `${errors.join("; ")}${errors.length > 1 ? " (+errors lainnya)" : ""}`
    : `Synced ${documentsNew + documentsUpdated} documents from pasal.id`;

  await prisma.syncLog.create({
    data: {
      source: "pasal.id",
      status: finalStatus,
      documentsNew,
      documentsUpdated,
      documentsFailed,
      duration,
      message,
      finishedAt: new Date(),
    },
  });

  return {
    source: "pasal.id",
    status: finalStatus,
    documentsNew,
    documentsUpdated,
    documentsFailed,
    duration,
    message,
  };
}