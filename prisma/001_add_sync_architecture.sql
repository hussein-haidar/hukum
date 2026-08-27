-- ============================================================================
-- Hukumku Sync Architecture — additive schema (Tahap 3, 4, 10)
-- Jalankan di Supabase SQL Editor (atau via `prisma db push` dengan koneksi
-- langsung port 5432, BUKAN pgbouncer 6543 yang menyebabkan hang).
-- Aman dijalankan berulang kali (IF NOT EXISTS / IF NOT / ADD COLUMN IF NOT).
-- ============================================================================

-- Tahap 4: tabel staging. Data mentah disimpan dulu di sini sebelum divalidasi
-- & dinormalisasi ke LegalDocument, sehingga export rusak tidak langsung
-- merusak database utama.
CREATE TABLE IF NOT EXISTS "SourceImport" (
    "id" SERIAL PRIMARY KEY,
    "source" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "rawData" JSONB NOT NULL,
    "rawHash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'staged',
    "errorMessage" TEXT,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3)
);

CREATE INDEX IF NOT EXISTS "SourceImport_source_idx" ON "SourceImport"("source");
CREATE INDEX IF NOT EXISTS "SourceImport_status_idx" ON "SourceImport"("status");
CREATE INDEX IF NOT EXISTS "SourceImport_source_externalId_idx" ON "SourceImport"("source","externalId");

-- Tahap 3: hash terakhir per sumber. Kalau sama -> sync dilewati.
CREATE TABLE IF NOT EXISTS "SyncExportState" (
    "id" SERIAL PRIMARY KEY,
    "source" TEXT NOT NULL,
    "lastHash" TEXT,
    "lastCheckedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastChangedAt" TIMESTAMP(3)
);

CREATE UNIQUE INDEX IF NOT EXISTS "SyncExportState_source_key" ON "SyncExportState"("source");

-- Tahap 10: jumlah dokumen yang ditemukan per run (untuk anomaly detection).
ALTER TABLE "SyncLog" ADD COLUMN IF NOT EXISTS "documentsFound" INTEGER NOT NULL DEFAULT 0;
