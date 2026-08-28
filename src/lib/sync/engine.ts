import { prisma } from "@/lib/prisma";
import {
  SourceAdapter,
  SyncResult,
  RawDocument,
  SourceExport,
  NormalizedDocument,
} from "./types";
import { sha256Hex, computeSourceFingerprint } from "./hash";
import { stageBatch, markProcessed } from "./staging";
import {
  upsertNormalized,
  upsertBatchNormalized,
  getLastFingerprint,
  setLastFingerprint,
} from "./dedupe";

const MAX_PAGES = 50;
const LIST_LIMIT = 20;

// ============================================================================
// HUKUMKU SYNC SERVICE
// Flow per sumber:
//   Tahap 1: fetchExport  -> Tahap 3 (hash) -> staging -> normalize -> upsert
//   Tahap 2: fetchFeed    -> hanya item baru -> detail -> upsert
//   Fallback: fetchList / fetchAll
//                         -> Tahap 3 (fingerprint) -> staging -> normalize
//                            -> upsert (Tahap 6/7)
//   Tahap 10: logging + anomaly detection
// ============================================================================

async function parseExport(exp: SourceExport): Promise<RawDocument[]> {
  if (exp.format === "json") {
    const parsed = JSON.parse(exp.content);
    const arr = Array.isArray(parsed) ? parsed : parsed.data || [];
    return arr.map((item: any, i: number) => ({
      externalId: String(item.id ?? item.external_id ?? item.sourceId ?? i),
      raw: item,
    }));
  }
  // csv/xml/zip: implementasi parser sesuai kebutuhan sumber. Untuk saat ini
  // sumber nyata (JDIHN/peraturan.go.id) belum menyediakan export jenis lain.
  return [];
}

// Jaring pengaman: tanggal invalid dari normalize (mis. string aneh dari feed
// 69k dokumen) tidak boleh lolos ke Prisma -> memunculkan "Invalid time value".
function sanitizeNormalized(n: NormalizedDocument | null): NormalizedDocument | null {
  if (!n) return n;
  if (n.tanggal && Number.isNaN(n.tanggal.getTime())) n.tanggal = null;
  return n;
}

async function runAdapterSync(adapter: SourceAdapter): Promise<SyncResult> {
  const start = Date.now();
  let documentsNew = 0;
  let documentsUpdated = 0;
  let documentsFailed = 0;
  let documentsFound = 0;
  const errors: string[] = [];

  const finish = async (
    status: SyncResult["status"],
    skipped: boolean,
    message?: string
  ): Promise<SyncResult> => {
    const duration = Date.now() - start;
    const result: SyncResult = {
      source: adapter.id,
      status,
      documentsNew,
      documentsUpdated,
      documentsFailed,
      documentsFound,
      skipped,
      message,
      duration,
    };
    await logSync(adapter.id, result);
    return result;
  };

  try {
    // ---- Tahap 1: Export resmi ----
    if (adapter.fetchExport) {
      const exp = await adapter.fetchExport();
      if (exp) {
        const fileHash = sha256Hex(exp.content);
        const last = await getLastFingerprint(adapter.id);
        if (last === fileHash) {
          return finish(
            "success",
            true,
            "Export tidak berubah (hash sama), dilewati."
          );
        }
        const rows = await parseExport(exp);
        documentsFound = rows.length;
        await stageBatch(adapter.id, rows);
        const staged = await prisma.sourceImport.findMany({
          where: { source: adapter.id, status: "staged" },
          select: { externalId: true, rawData: true },
        });
        const normalized: NormalizedDocument[] = [];
        for (const s of staged) {
          try {
            const n = sanitizeNormalized(adapter.normalize(s.rawData as unknown));
            if (n) normalized.push(n);
            else documentsFailed++;
          } catch {
            documentsFailed++;
          }
        }
        const { inserted, updated } = await upsertBatchNormalized(normalized);
        documentsNew += inserted;
        documentsUpdated += updated;
        await markProcessed(adapter.id);
        await setLastFingerprint(adapter.id, fileHash);
        return finish(
          documentsFailed > 0 && documentsNew === 0 ? "partial" : "success",
          false,
          `Export diproses: ${documentsNew} baru, ${documentsUpdated} update.`
        );
      }
    }

    // ---- Tahap 2: Feed resmi ----
    if (adapter.fetchFeed) {
      const feed = await adapter.fetchFeed();
      if (feed && feed.length) {
        documentsFound = feed.length;
        const ids = feed.map((f) => f.externalId);
        const existing = await prisma.legalDocument.findMany({
          where: { source: adapter.id, sourceId: { in: ids } },
          select: { sourceId: true },
        });
        const existingSet = new Set(existing.map((e) => e.sourceId));
        const onlyNew = feed.filter((f) => !existingSet.has(f.externalId));
        for (const f of onlyNew) {
          let norm = sanitizeNormalized(adapter.normalize(f.raw));
          if (norm && adapter.fetchDetail) {
            const d = await adapter.fetchDetail(f.externalId);
            if (d) norm = { ...norm, ...d };
          }
          if (!norm) {
            documentsFailed++;
            continue;
          }
          const outcome = await upsertNormalized(norm);
          if (outcome === "inserted") documentsNew++;
          else if (outcome === "updated") documentsUpdated++;
        }
        await setLastFingerprint(adapter.id, computeSourceFingerprint(feed.map((f) => ({
          externalId: f.externalId,
          rawHash: sha256Hex(JSON.stringify(f.raw)),
        }))));
        return finish(
          documentsNew > 0 || documentsUpdated > 0 ? "success" : "partial",
          false,
          `Feed: ${documentsNew} baru, ${documentsUpdated} update.`
        );
      }
    }

    // ---- Fallback: fetchList terpaginas atau fetchAll mandiri ----
    if (!adapter.fetchList && !adapter.fetchAll) {
      return finish("failed", false, "Sumber tidak menyediakan export/feed/list.");
    }

    let allRaw: RawDocument[] = [];
    if (adapter.fetchAll) {
      const docs = await adapter.fetchAll();
      if (docs) allRaw = docs;
      documentsFound = allRaw.length;
    } else {
      let page = 1;
      while (page <= MAX_PAGES) {
        const res = await adapter.fetchList!(page, LIST_LIMIT);
        allRaw.push(...res.data);
        documentsFound += res.data.length;
        if (!res.hasMore || page >= res.totalPages) break;
        page++;
      }
    }

    if (allRaw.length === 0) {
      return finish("failed", false, "Tidak ada data yang berhasil diambil.");
    }

    // ---- Tahap 3: fingerprint -> lewati kalau tidak berubah ----
    const fingerprint = computeSourceFingerprint(
      allRaw.map((r) => ({ externalId: r.externalId, rawHash: sha256Hex(JSON.stringify(r.raw)) }))
    );
    const lastFp = await getLastFingerprint(adapter.id);
    if (lastFp !== null && lastFp === fingerprint) {
      return finish(
        "success",
        true,
        `Tidak ada perubahan (${documentsFound} dokumen tetap), dilewati.`
      );
    }

    // ---- Tahap 4: staging ----
    await stageBatch(adapter.id, allRaw);

    // ---- Tahap 5, 6, 7: normalize -> dedupe/upsert ----
    const staged = await prisma.sourceImport.findMany({
      where: { source: adapter.id, status: "staged" },
      select: { externalId: true, rawData: true },
    });

    const normalized: NormalizedDocument[] = [];
    for (const s of staged) {
      try {
        let norm = sanitizeNormalized(adapter.normalize(s.rawData as unknown));
        if (!norm) {
          documentsFailed++;
          continue;
        }
        if (adapter.fetchDetail) {
          try {
            const d = await adapter.fetchDetail(s.externalId);
            if (d) norm = { ...norm, ...d };
          } catch {
            // detail opsional
          }
        }
        normalized.push(norm);
      } catch {
        documentsFailed++;
      }
    }

    const { inserted, updated } = await upsertBatchNormalized(normalized);
    documentsNew += inserted;
    documentsUpdated += updated;

    await markProcessed(adapter.id);
    await setLastFingerprint(adapter.id, fingerprint);

    const status: SyncResult["status"] =
      documentsNew === 0 && documentsUpdated === 0 && documentsFailed > 0
        ? "failed"
        : documentsFailed > 0
        ? "partial"
        : "success";

    return finish(
      status,
      false,
      `Selesai: ${documentsNew} baru, ${documentsUpdated} update, ${documentsFailed} gagal.`
    );
  } catch (err: any) {
    errors.push(err?.message || "Unknown error");
    return finish("failed", false, errors.slice(0, 3).join("; "));
  }
}

// ---- Tahap 10: logging + anomaly detection ----
async function logSync(source: string, result: SyncResult): Promise<void> {
  await prisma.syncLog.create({
    data: {
      source,
      status: result.status,
      documentsNew: result.documentsNew,
      documentsUpdated: result.documentsUpdated,
      documentsFailed: result.documentsFailed,
      documentsFound: result.documentsFound,
      duration: result.duration,
      message: result.message,
      finishedAt: new Date(),
    },
  });

  // Deteksi anomali: kalau jumlah ditemukan tiba-tiba anjlok vs rata-rata historis.
  try {
    const prev = await prisma.syncLog.findMany({
      where: { source, documentsFound: { gt: 0 } },
      orderBy: { startedAt: "desc" },
      take: 5,
      select: { documentsFound: true },
    });
    if (prev.length >= 3 && result.documentsFound > 0) {
      const avg = prev.reduce((s, p) => s + p.documentsFound, 0) / prev.length;
      if (avg > 100 && result.documentsFound < avg * 0.5) {
        await prisma.systemConfig.upsert({
          where: { key: `alert:${source}` },
          create: {
            key: `alert:${source}`,
            value: `ANOMALI ${new Date().toISOString()}: ditemukan ${result.documentsFound} vs rata-rata ${Math.round(avg)}`,
          },
          update: {
            value: `ANOMALI ${new Date().toISOString()}: ditemukan ${result.documentsFound} vs rata-rata ${Math.round(avg)}`,
          },
        });
      }
    }
  } catch {
    // monitoring terpisah dari kegagalan utama
  }
}

export async function runAllSync(adapters: SourceAdapter[]): Promise<SyncResult[]> {
  const results: SyncResult[] = [];
  for (const adapter of adapters) {
    results.push(await runAdapterSync(adapter));
  }
  return results;
}

export async function runScheduledSync(): Promise<SyncResult[]> {
  const { getAllAdapters } = await import("./registry");
  const results = await runAllSync(getAllAdapters());

  // Tahap 8: sync PDF terpisah setelah metadata selesai.
  try {
    const { syncPdfs } = await import("./pdf");
    await syncPdfs();
  } catch {
    // PDF sync bersifat best-effort
  }

  return results;
}

export { runAdapterSync };