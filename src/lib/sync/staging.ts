import { prisma } from "@/lib/prisma";
import { RawDocument } from "./types";
import { hashRaw } from "./hash";

// Tahap 4: Semua data mentah dari sumber masuk ke tabel staging (SourceImport)
// SEBELUM divalidasi & dinormalisasi ke tabel utama. Jika export sumber rusak,
// database utama (LegalDocument) tidak langsung ikut rusak.

export interface StagedRow {
  externalId: string;
  rawHash: string;
}

// Simpan batch raw ke staging. Mengembalikan baris yang di-stage beserta hash-nya
// (dipakai untuk menghitung fingerprint sumber -> Tahap 3).
export async function stageBatch(
  source: string,
  rows: RawDocument[]
): Promise<StagedRow[]> {
  const staged: StagedRow[] = [];

  for (const row of rows) {
    const rawHash = hashRaw(row.raw);
    staged.push({ externalId: row.externalId, rawHash });

    await prisma.sourceImport.create({
      data: {
        source,
        externalId: row.externalId,
        rawData: (row.raw ?? {}) as object,
        rawHash,
        status: "staged",
      },
    });
  }

  return staged;
}

// Validasi baris staging: pastikan minimal ada externalId & judul (setelah normalize
// sederhana). Baris invalid ditandai supaya tidak diteruskan ke tabel utama.
export async function validateStaged(
  source: string,
  isValid: (row: StagedRow) => boolean
): Promise<void> {
  const rows = await prisma.sourceImport.findMany({
    where: { source, status: "staged" },
    select: { id: true, externalId: true, rawHash: true },
  });

  for (const r of rows) {
    const ok = isValid({ externalId: r.externalId, rawHash: r.rawHash });
    await prisma.sourceImport.update({
      where: { id: r.id },
      data: {
        status: ok ? "valid" : "invalid",
        errorMessage: ok ? null : "Missing required field (externalId/judul)",
      },
    });
  }
}

// Tandai baris staging sebagai sudah diproses ke tabel utama.
export async function markProcessed(source: string): Promise<void> {
  await prisma.sourceImport.updateMany({
    where: { source, status: { in: ["valid", "invalid"] } },
    data: { status: "processed", processedAt: new Date() },
  });
}
