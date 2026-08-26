import { prisma } from "@/lib/prisma";
import { SyncSource, FetchResult, NormalizedDocument, SyncResult } from "./types";

const BASE_URL = "https://jdihn.go.id";

const PRIORITY_JENIS: Record<number, string> = {
  9: "UU",
  7: "UUD",
  10: "PPPU",
  11: "PP",
  12: "Perpres",
  14: "Inpres",
  16: "UU Darurat",
};

export const jdihnSource: SyncSource = {
  name: "JDIHN",
  id: "jdihn",
  baseUrl: BASE_URL,

  async fetchDocuments(page: number, limit: number = 15): Promise<FetchResult> {
    const results: any[] = [];
    let total = 0;

    for (const [jenisId, jenisName] of Object.entries(PRIORITY_JENIS)) {
      try {
        const params = new URLSearchParams({
          page: String(page),
          jenis: jenisId,
        });

        const res = await fetch(`${BASE_URL}/api/search?${params}`, {
          headers: {
            "User-Agent": "HukumKu/1.0 (Open Data Research)",
            Accept: "application/json",
          },
        });

        if (!res.ok) continue;

        const json = await res.json();
        const items = json.data || [];
        total += json.meta?.total || 0;

        for (const item of items) {
          results.push({ ...item, _jenis_name: jenisName });
        }
      } catch (err) {
        console.error(`JDIHN fetch error for jenis ${jenisName}:`, err);
      }
    }

    return {
      data: results,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    };
  },

  normalize(raw: any): NormalizedDocument | null {
    const judul = raw.judul;
    if (!judul) return null;

    const docId = raw.id || raw.id_dokumen;
    const jenis = raw._jenis_name || raw.jenis_peraturan?.name || "";
    const nomor = raw.nomor || "";
    const tahun = raw.tahun_terbit || "";
    const instansi = raw.instansi || "";
    const download = raw.download || "";

    const dateStr = tahun && /^\d{4}$/.test(tahun) ? `${tahun}-01-01` : undefined;

    return {
      source: "jdihn",
      sourceId: String(docId),
      jenis,
      nomor: String(nomor),
      tahun: String(tahun),
      judul,
      tentang: raw.tentang || judul,
      status: raw.status?.name || "berlaku",
      tanggal: dateStr ? new Date(dateStr) : undefined,
      urlSumber: `${BASE_URL}/pencarian/detail/${docId}`,
      urlPdf: download || undefined,
      instansi,
    };
  },
};

export async function syncJDIHN(): Promise<SyncResult> {
  const startTime = Date.now();
  let documentsNew = 0;
  let documentsUpdated = 0;
  let documentsFailed = 0;
  const errors: string[] = [];

  try {
    const res = await fetch(`${BASE_URL}/home/countPeraturan`, {
      headers: { "User-Agent": "HukumKu/1.0" },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      const msg = `JDIHN API mengembalikan status ${res.status}`;
      errors.push(msg);
      await prisma.syncLog.create({
        data: {
          source: "jdihn",
          status: "failed",
          documentsNew: 0,
          documentsUpdated: 0,
          documentsFailed: 1,
          duration: Date.now() - startTime,
          message: msg,
          finishedAt: new Date(),
        },
      });
      return { source: "jdihn", status: "failed", documentsNew: 0, documentsUpdated: 0, documentsFailed: 1, duration: Date.now() - startTime };
    }
  } catch (err: any) {
    const msg = err.name === "TimeoutError" || err.name === "AbortError"
      ? "JDIHN API timeout - server tidak merespon dalam 10 detik"
      : err.cause?.code === "ECONNREFUSED"
      ? "JDIHN API tidak dapat diakses - koneksi ditolak"
      : err.cause?.code === "ENOTFOUND"
      ? "JDIHN API tidak dapat ditemukan - periksa koneksi internet"
      : `JDIHN API error: ${err.message || "Unknown"}`;

    await prisma.syncLog.create({
      data: {
        source: "jdihn",
        status: "failed",
        documentsNew: 0,
        documentsUpdated: 0,
        documentsFailed: 1,
        duration: Date.now() - startTime,
        message: msg,
        finishedAt: new Date(),
      },
    });
    return { source: "jdihn", status: "failed", documentsNew: 0, documentsUpdated: 0, documentsFailed: 1, duration: Date.now() - startTime, message: msg };
  }

  for (const [jenisId, jenisName] of Object.entries(PRIORITY_JENIS)) {
    let page = 1;
    let hasMore = true;

    while (hasMore && page <= 5) {
      try {
        const params = new URLSearchParams({
          page: String(page),
          jenis: jenisId,
        });

        const res = await fetch(`${BASE_URL}/api/search?${params}`, {
          headers: {
            "User-Agent": "HukumKu/1.0 (Open Data Research)",
            Accept: "application/json",
          },
          signal: AbortSignal.timeout(15000),
        });

        if (!res.ok) {
          documentsFailed++;
          errors.push(`${jenisName} page ${page}: HTTP ${res.status}`);
          break;
        }

        const json = await res.json();
        const items = json.data || [];

        for (const item of items) {
          try {
            const normalized = jdihnSource.normalize({
              ...item,
              _jenis_name: jenisName,
            });

            if (!normalized) {
              documentsFailed++;
              continue;
            }

            const existing = await prisma.legalDocument.findUnique({
              where: {
                source_sourceId: {
                  source: normalized.source,
                  sourceId: normalized.sourceId,
                },
              },
            });

            if (existing) {
              await prisma.legalDocument.update({
                where: { id: existing.id },
                data: {
                  judul: normalized.judul,
                  status: normalized.status,
                  urlPdf: normalized.urlPdf || existing.urlPdf,
                  syncedAt: new Date(),
                },
              });
              documentsUpdated++;
            } else {
              await prisma.legalDocument.create({
                data: {
                  source: normalized.source,
                  sourceId: normalized.sourceId,
                  jenis: normalized.jenis,
                  nomor: normalized.nomor,
                  tahun: normalized.tahun,
                  judul: normalized.judul,
                  tentang: normalized.tentang,
                  status: normalized.status,
                  tanggal: normalized.tanggal,
                  urlSumber: normalized.urlSumber,
                  urlPdf: normalized.urlPdf,
                  instansi: normalized.instansi,
                },
              });
              documentsNew++;
            }
          } catch (err) {
            documentsFailed++;
          }
        }

        const meta = json.meta || {};
        hasMore = page < (meta.last_page || 1);
        page++;
      } catch (err: any) {
        const errMsg = err.name === "TimeoutError" || err.name === "AbortError"
          ? `${jenisName} page ${page}: timeout`
          : `${jenisName} page ${page}: ${err.message || "network error"}`;
        errors.push(errMsg);
        documentsFailed++;
        break;
      }
    }
  }

  const duration = Date.now() - startTime;
  const finalStatus = documentsNew === 0 && documentsFailed > 0 ? "failed" : documentsNew > 0 ? "success" : "partial";
  const message = errors.length > 0
    ? `${errors.slice(0, 3).join("; ")}${errors.length > 3 ? ` (+${errors.length - 3} lainnya)` : ""}`
    : `Synced ${documentsNew + documentsUpdated} documents`;

  await prisma.syncLog.create({
    data: {
      source: "jdihn",
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
    source: "jdihn",
    status: finalStatus,
    documentsNew,
    documentsUpdated,
    documentsFailed,
    duration,
    message,
  };
}
