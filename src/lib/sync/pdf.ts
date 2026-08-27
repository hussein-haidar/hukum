import { promises as fs } from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";

// Tahap 8: PDF dipisahkan dari metadata.
// SYNC 1 -> metadata masuk ke MySQL.
// SYNC 2 -> PDF di-download ke storage terpisah.
// Jadi kalau metadata berubah, kita tidak perlu download ulang PDF.

const STORAGE_DIR = path.join(process.cwd(), "public", "storage", "peraturan");

function localPath(source: string, sourceId: string): string {
  const safeSource = source.replace(/[^a-z0-9_-]/gi, "_");
  const safeId = sourceId.replace(/[^a-z0-9_.-]/gi, "_");
  return path.join(STORAGE_DIR, safeSource, `${safeId}.pdf`);
}

function publicUrl(source: string, sourceId: string): string {
  const safeSource = source.replace(/[^a-z0-9_-]/gi, "_");
  const safeId = sourceId.replace(/[^a-z0-9_.-]/gi, "_");
  return `/storage/peraturan/${safeSource}/${safeId}.pdf`;
}

async function downloadPdf(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "HukumKu/1.0 (legal-data-research)" },
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 1000) return null; // terlalu kecil, kemungkinan error page
    return buf;
  } catch {
    return null;
  }
}

export interface PdfSyncResult {
  source: string;
  downloaded: number;
  skipped: number;
  failed: number;
  duration: number;
}

// Download PDF untuk dokumen yang belum punya file lokal.
// source opsional: kalau diisi, hanya sumber tersebut yang diproses.
export async function syncPdfs(source?: string): Promise<PdfSyncResult> {
  const start = Date.now();
  let downloaded = 0;
  let skipped = 0;
  let failed = 0;

  const where: any = { urlPdf: { startsWith: "http" } };
  if (source) where.source = source;

  const docs = await prisma.legalDocument.findMany({
    where,
    select: { source: true, sourceId: true, urlPdf: true },
  });

  for (const doc of docs) {
    if (!doc.urlPdf) {
      skipped++;
      continue;
    }
    const target = localPath(doc.source, doc.sourceId);
    if (await fileExists(target)) {
      skipped++;
      continue;
    }
    const buf = await downloadPdf(doc.urlPdf);
    if (!buf) {
      failed++;
      continue;
    }
    try {
      await fs.mkdir(path.dirname(target), { recursive: true });
      await fs.writeFile(target, buf);
      await prisma.legalDocument.update({
        where: { source_sourceId: { source: doc.source, sourceId: doc.sourceId } },
        data: { urlPdf: publicUrl(doc.source, doc.sourceId) },
      });
      downloaded++;
    } catch {
      failed++;
    }
  }

  return {
    source: source ?? "all",
    downloaded,
    skipped,
    failed,
    duration: Date.now() - start,
  };
}

async function fileExists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}
