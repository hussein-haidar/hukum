import { prisma } from "@/lib/prisma";
import { SyncResult } from "./types";

const BASE_URL = "https://pasal.id";
const TOKEN = "pasal_mcp_251a7e945413_4e2e97c881f4673aad0f3c84823550cc50fb348a0fcd63c1";

export async function syncPasalId(): Promise<SyncResult> {
  const startTime = Date.now();
  let documentsNew = 0;
  let documentsUpdated = 0;
  let documentsFailed = 0;
  const errors: string[] = [];

  try {
    // Endpoint laws dengan filter type UU dan limit 20
    const res = await fetch(`https://pasal.id/api/v1/laws?type=UU&limit=20`, {
      headers: {
        "Authorization": `Bearer ${TOKEN}`,
        "User-Agent": "HukumKu/1.0 (Open Data Research)",
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      const msg = `Pasal.id API mengembalikan status ${res.status}`;
      errors.push(msg);
      documentsFailed++;
    } else {
      const json = await res.json();
      const laws = json.laws || [];

      for (const law of laws) {
        try {
          // Buat sourceId dari number dan tahun
          const sourceId = `uu-${law.number}-${law.year}`;

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
                jenis: law.type || "UU",
                nomor: law.number || "",
                tahun: law.year || "",
                judul: law.title || "",
                tentang: law.title || "",
                status: law.status || "berlaku",
                urlSumber: `https://pasal.id/peraturan/${law.type || "UU"}-${law.number}-${law.year}`,
                instansi: undefined,
              },
            });
            documentsNew++;
          }
        } catch (err) {
          documentsFailed++;
        }
      }

      // Jika dokumen kurang dari 20, tambah dari search
      if (documentsNew < 20) {
        const searchRes = await fetch(`https://pasal.id/api/v1/search?q=ketenagakerjaan&type=UU&limit=20`, {
          headers: {
            "Authorization": `Bearer ${TOKEN}`,
            "User-Agent": "HukumKu/1.0 (Open Data Research)",
            Accept: "application/json",
          },
        });

        if (searchRes.ok) {
          const searchJson = await searchRes.json();
          const results = searchJson.results || [];

          for (const result of results) {
            try {
              const work = result.work || {};
              const sourceId = `uu-${work.number}-${work.year}`;

              const existing = await prisma.legalDocument.findUnique({
                where: { source_sourceId: { source: "pasal.id", sourceId } },
              });

              if (!existing) {
                await prisma.legalDocument.create({
                  data: {
                    source: "pasal.id",
                    sourceId,
                    jenis: work.type || "UU",
                    nomor: work.number || "",
                    tahun: work.year || "",
                    judul: work.title || "",
                    tentang: work.title || "",
                    status: work.status || "berlaku",
                    urlSumber: work.url_href ? `https://pasal.id${work.url_href}` : "",
                    instansi: undefined,
                  },
                });
                documentsNew++;
              }
            } catch (err) {
              documentsFailed++;
            }
          }
        }
      }
    }
  } catch (err: any) {
    const msg = err.name === "TimeoutError"
      ? "Pasal.id API timeout - server tidak merespon dalam 15 detik"
      : `Pasal.id API error: ${err.message || "Unknown"}`;
    errors.push(msg);
    documentsFailed++;
  }

  const duration = Date.now() - startTime;
  const finalStatus = documentsNew === 0 && documentsFailed > 0 ? "failed" : documentsNew > 0 ? "success" : "partial";
  const message = errors.length > 0
    ? `${errors.join("; ")}${errors.length > 1 ? " (+errors lainnya)" : ""}`
    : `Synced ${documentsNew + documentsUpdated} documents from pasal.id API`;

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