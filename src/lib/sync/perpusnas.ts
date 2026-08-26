import { prisma } from "@/lib/prisma";
import { SyncResult } from "./types";

const BASE_URL = "https://api-jdih.perpusnas.go.id";

export async function syncBPK(): Promise<SyncResult> {
  const startTime = Date.now();
  let documentsNew = 0;
  let documentsUpdated = 0;
  let documentsFailed = 0;
  const errors: string[] = [];

  const peraturanTypes = ["UU", "PP", "Perpres", "Permen"];

  try {
    const res = await fetch(`${BASE_URL}?page=1&type=peraturan&keyword=UU`, {
      headers: { "User-Agent": "HukumKu/1.0" },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      const msg = `Perpusnas API mengembalikan status ${res.status}`;
      errors.push(msg);
      await prisma.syncLog.create({
        data: {
          source: "perpusnas",
          status: "failed",
          documentsNew: 0,
          documentsUpdated: 0,
          documentsFailed: 1,
          duration: Date.now() - startTime,
          message: msg,
          finishedAt: new Date(),
        },
      });
      return { source: "perpusnas", status: "failed", documentsNew: 0, documentsUpdated: 0, documentsFailed: 1, duration: Date.now() - startTime, message: msg };
    }
  } catch (err: any) {
    const msg = err.name === "TimeoutError" || err.name === "AbortError"
      ? "Perpusnas API timeout - server tidak merespon dalam 10 detik"
      : err.cause?.code === "ECONNREFUSED"
      ? "Perpusnas API tidak dapat diakses - koneksi ditolak"
      : err.cause?.code === "ENOTFOUND"
      ? "Perpusnas API tidak dapat ditemukan - periksa koneksi internet"
      : `Perpusnas API error: ${err.message || "Unknown"}`;

    await prisma.syncLog.create({
      data: {
        source: "perpusnas",
        status: "failed",
        documentsNew: 0,
        documentsUpdated: 0,
        documentsFailed: 1,
        duration: Date.now() - startTime,
        message: msg,
        finishedAt: new Date(),
      },
    });
    return { source: "perpusnas", status: "failed", documentsNew: 0, documentsUpdated: 0, documentsFailed: 1, duration: Date.now() - startTime, message: msg };
  }

  for (const type of peraturanTypes) {
    let page = 1;
    let hasMore = true;

    while (hasMore && page <= 3) {
      try {
        const params = new URLSearchParams({
          page: String(page),
          type: "peraturan",
          keyword: type,
        });

        const res = await fetch(`${BASE_URL}?${params}`, {
          headers: {
            "User-Agent": "HukumKu/1.0 (Open Data Research)",
            Accept: "application/json",
          },
          signal: AbortSignal.timeout(15000),
        });

        if (!res.ok) {
          documentsFailed++;
          errors.push(`${type} page ${page}: HTTP ${res.status}`);
          break;
        }

        const json = await res.json();
        const items = json.data || [];

        for (const item of items) {
          try {
            const sourceId = String(item.id || "");
            const jenis = item.jenis || type;
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
                  source: "perpusnas",
                  sourceId,
                },
              },
            });

            if (existing) {
              await prisma.legalDocument.update({
                where: { id: existing.id },
                data: {
                  judul,
                  syncedAt: new Date(),
                },
              });
              documentsUpdated++;
            } else {
              await prisma.legalDocument.create({
                data: {
                  source: "perpusnas",
                  sourceId,
                  jenis,
                  nomor: String(nomor),
                  tahun: String(tahun),
                  judul,
                  status: "berlaku",
                  urlSumber: item.url || undefined,
                  instansi: item.instansi || undefined,
                },
              });
              documentsNew++;
            }
          } catch (err) {
            documentsFailed++;
          }
        }

        hasMore = items.length >= 10;
        page++;
      } catch (err: any) {
        const errMsg = err.name === "TimeoutError" || err.name === "AbortError"
          ? `${type} page ${page}: timeout`
          : `${type} page ${page}: ${err.message || "network error"}`;
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
      source: "perpusnas",
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
    source: "perpusnas",
    status: finalStatus,
    documentsNew,
    documentsUpdated,
    documentsFailed,
    duration,
    message,
  };
}
