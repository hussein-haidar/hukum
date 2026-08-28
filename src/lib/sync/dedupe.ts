import { prisma } from "@/lib/prisma";
import { NormalizedDocument } from "./types";
import { metadataChecksum } from "./hash";

// Tahap 6: external_id (source + sourceId) mencegah duplikat.
// Tahap 7: checksum metadata mendeteksi perubahan -> hanya update kalau berubah.

export type UpsertOutcome = "inserted" | "updated" | "unchanged";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Koneksi ke pooler bisa terputus atau kena statement timeout di tengah batch
// besar; retry beberapa kali sebelum menyerah.
async function withRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  let lastErr: any;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e: any) {
      lastErr = e;
      const msg = (e?.message || e?.toString?.() || "").toLowerCase();
      if (msg.includes("closed the connection") || msg.includes("statement timeout")) {
        await delay(1000);
      } else {
        break;
      }
    }
  }
  throw lastErr;
}

export async function upsertNormalized(
  doc: NormalizedDocument
): Promise<UpsertOutcome> {
  const checksum = metadataChecksum(doc);
  const where = { source_sourceId: { source: doc.source, sourceId: doc.sourceId } };

  const existing = await prisma.legalDocument.findUnique({
    where,
    select: { id: true, checksum: true },
  });

  if (!existing) {
    await prisma.legalDocument.create({
      data: {
        source: doc.source,
        sourceId: doc.sourceId,
        jenis: doc.jenis,
        nomor: doc.nomor,
        tahun: doc.tahun,
        judul: doc.judul,
        tentang: doc.tentang ?? null,
        status: doc.status,
        tanggal: doc.tanggal ?? null,
        urlSumber: doc.urlSumber ?? null,
        urlPdf: doc.urlPdf ?? null,
        instansi: doc.instansi ?? null,
        fullText: doc.fullText ?? null,
        checksum,
      },
    });
    return "inserted";
  }

  if (existing.checksum === checksum) {
    return "unchanged";
  }

  await prisma.legalDocument.update({
    where: { id: existing.id },
    data: {
      jenis: doc.jenis,
      nomor: doc.nomor,
      tahun: doc.tahun,
      judul: doc.judul,
      tentang: doc.tentang ?? null,
      status: doc.status,
      tanggal: doc.tanggal ?? null,
      urlSumber: doc.urlSumber ?? null,
      urlPdf: doc.urlPdf ?? null,
      instansi: doc.instansi ?? null,
      fullText: doc.fullText ?? null,
      checksum,
      syncedAt: new Date(),
    },
  });
  return "updated";
}

// ---- Batch upsert (untuk export/feed besar, mis. 69k+ dokumen) ----
// 1) Baca sourceId yang sudah ada (chunked), 2) createMany untuk yang belum ada
// (skipDuplicates kalau ada race), 3) update per-baris hanya untuk yang checksum-nya
// berubah. Jauh lebih cepat daripada upsertNormalized per-baris.
export async function upsertBatchNormalized(
  docs: NormalizedDocument[]
): Promise<{ inserted: number; updated: number }> {
  if (docs.length === 0) return { inserted: 0, updated: 0 };
  const source = docs[0].source;

  // Baca keberadaan & checksum yang sudah ada.
  const existingMap = new Map<string, { id: number; checksum: string }>();
  const READ_CHUNK = 1000;
  for (let i = 0; i < docs.length; i += READ_CHUNK) {
    const chunk = docs.slice(i, i + READ_CHUNK);
    const rows = await prisma.legalDocument.findMany({
      where: { source, sourceId: { in: chunk.map((d) => d.sourceId) } },
      select: { id: true, sourceId: true, checksum: true },
    });
    for (const r of rows) existingMap.set(r.sourceId, { id: r.id, checksum: r.checksum ?? "" });
  }

  // Baru semua -> createMany (skipDuplicates untuk keamanan race).
  const toCreate = docs.filter((d) => !existingMap.has(d.sourceId));
  let inserted = 0;
  const CREATE_CHUNK = 250;
  for (let i = 0; i < toCreate.length; i += CREATE_CHUNK) {
    const res = await withRetry(() =>
      prisma.legalDocument.createMany({
        data: toCreate.slice(i, i + CREATE_CHUNK).map((d) => ({
          source: d.source,
          sourceId: d.sourceId,
          jenis: d.jenis,
          nomor: d.nomor,
          tahun: d.tahun,
          judul: d.judul,
          tentang: d.tentang ?? null,
          status: d.status,
          tanggal: d.tanggal ?? null,
          urlSumber: d.urlSumber ?? null,
          urlPdf: d.urlPdf ?? null,
          instansi: d.instansi ?? null,
          fullText: d.fullText ?? null,
          checksum: metadataChecksum(d),
        })),
        skipDuplicates: true,
      })
    );
    inserted += res.count;
  }

  // Sudah ada tapi checksum berubah -> update per-baris (jumlahnya kecil).
  const toUpdate = docs.filter((d) => {
    const e = existingMap.get(d.sourceId);
    return e && e.checksum !== metadataChecksum(d);
  });

  const UPDATE_CHUNK = 20;
  for (let i = 0; i < toUpdate.length; i += UPDATE_CHUNK) {
    const chunk = toUpdate.slice(i, i + UPDATE_CHUNK);
    await withRetry(() =>
      Promise.all(
        chunk.map((d) => {
          const e = existingMap.get(d.sourceId)!;
          return prisma.legalDocument.update({
            where: { id: e.id },
            data: {
              jenis: d.jenis,
              nomor: d.nomor,
              tahun: d.tahun,
              judul: d.judul,
              tentang: d.tentang ?? null,
              status: d.status,
              tanggal: d.tanggal ?? null,
              urlSumber: d.urlSumber ?? null,
              urlPdf: d.urlPdf ?? null,
              instansi: d.instansi ?? null,
              fullText: d.fullText ?? null,
              checksum: metadataChecksum(d),
              syncedAt: new Date(),
            },
          });
        })
      )
    );
  }

  return { inserted, updated: toUpdate.length };
}

// ---- Tahap 3: Export/list fingerprint per sumber ----

export async function getLastFingerprint(source: string): Promise<string | null> {
  const row = await prisma.syncExportState.findUnique({ where: { source } });
  return row?.lastHash ?? null;
}

export async function setLastFingerprint(source: string, hash: string): Promise<void> {
  const now = new Date();
  const existing = await prisma.syncExportState.findUnique({ where: { source } });
  if (!existing) {
    await prisma.syncExportState.create({
      data: { source, lastHash: hash, lastChangedAt: now },
    });
    return;
  }
  const changed = existing.lastHash !== hash;
  await prisma.syncExportState.update({
    where: { source },
    data: {
      lastHash: hash,
      lastCheckedAt: now,
      lastChangedAt: changed ? now : existing.lastChangedAt,
    },
  });
}
