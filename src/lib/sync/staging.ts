import { prisma } from "@/lib/prisma";
import { RawDocument } from "./types";
import { hashRaw } from "./hash";

// Tahap 4: Semua data mentah dari sumber masuk ke tabel staging (SourceImport)
// SEBELUM diformulasikan & dinormalisasi ke tabel utama. Jika export sumber
// rusak, database utama (LegalDocument) tidak langsung ikut rusak.

export interface StagedRow {
  externalId: string;
  rawHash: string;
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Koneksi ke pooler (Supabase) bisa terputus atau kena statement timeout di
// tengah batch besar. Retry query yang gagal beberapa kali supaya proses
// 69k dokumen tidak batal total.
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

// Bersihkan baris staging lama yang belum selesai diproses (status != processed).
// Mencegah tumpukan duplikat kalau run sebelumnya gagal di tengah jalan.
async function clearStale(source: string): Promise<void> {
  await withRetry(() =>
    prisma.sourceImport.deleteMany({
      where: { source, status: { not: "processed" } },
    })
  );
}

// Simpan batch raw ke staging. Mengembalikan baris yang di-stage beserta hash-nya
// (dipakai untuk menghitung fingerprint sumber -> Tahap 3).
// Dioptimasi: createMany ber-chunk (per-baris terlalu lambat untuk feed 69k+ dokumen).
export async function stageBatch(
  source: string,
  rows: RawDocument[]
): Promise<StagedRow[]> {
  await clearStale(source);

  const staged: StagedRow[] = [];
  const batch: any[] = [];

  for (const row of rows) {
    const rawHash = hashRaw(row.raw);
    staged.push({ externalId: row.externalId, rawHash });
    batch.push({
      source,
      externalId: row.externalId,
      rawData: (row.raw ?? {}) as object,
      rawHash,
      status: "staged",
    });
  }

  const CHUNK = 500;
  for (let i = 0; i < batch.length; i += CHUNK) {
    await withRetry(() =>
      prisma.sourceImport.createMany({
        data: batch.slice(i, i + CHUNK),
        skipDuplicates: true,
      })
    );
  }

  return staged;
}

// Tandai baris staging sebagai sudah diproses ke tabel utama, lalu bersihkan
// baris processed lama (keamanan: bisa hilang data mentah lama, tapi tabel
// utama sudah berisi hasil normalisasi; mencegah tabel membengkak selamanya).
export async function markProcessed(source: string): Promise<void> {
  await withRetry(() =>
    prisma.sourceImport.updateMany({
      where: { source, status: { in: ["staged", "valid", "invalid"] } },
      data: { status: "processed", processedAt: new Date() },
    })
  );
  // Hapus baris processed yang sudah berumur > 24 jam untuk sumber ini.
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  await withRetry(() =>
    prisma.sourceImport.deleteMany({
      where: { source, status: "processed", processedAt: { lt: cutoff } },
    })
  );
}