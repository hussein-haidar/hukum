import { prisma } from "@/lib/prisma";
import { NormalizedDocument } from "./types";
import { metadataChecksum } from "./hash";

// Tahap 6: external_id (source + sourceId) mencegah duplikat.
// Tahap 7: checksum metadata mendeteksi perubahan -> hanya update kalau berubah.

export type UpsertOutcome = "inserted" | "updated" | "unchanged";

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
