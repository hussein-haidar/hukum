import { prisma } from "@/lib/prisma";
import { SyncResult } from "./types";

export async function syncSampleData(): Promise<SyncResult> {
  const startTime = Date.now();
  let documentsNew = 0;
  let documentsUpdated = 0;
  let documentsFailed = 0;

  try {
    // Ambil dokumentasikan terbaru dari berbagai source untuk menjadi "sample data"
    const recentDocuments = await prisma.legalDocument.findMany({
      take: 20,
      orderBy: { syncedAt: "desc" },
      where: {
        OR: [
          { source: "peraturan.go.id" },
          { source: "jdihn" },
          { source: "perpusnas" },
          { source: "pasal.id" },
        ],
      },
    });

    // Grup by source dan ambil satu dokument per source sebagai sample
    const samplesBySource: Record<string, any> = {};
    const seenSourceIds: Set<string> = new Set();

    for (const doc of recentDocuments) {
      const sourceKey = doc.source;
      if (!seenSourceIds.has(sourceKey) && documentsNew < 10) {
        seenSourceIds.add(sourceKey);
        samplesBySource[sourceKey] = {
          sourceId: doc.sourceId,
          jenis: doc.jenis,
          nomor: doc.nomor,
          tahun: doc.tahun,
          judul: doc.judul,
          tentang: doc.tentang || doc.judul,
          status: doc.status,
          instansi: doc.instansi,
          urlSumber: doc.urlSumber,
          source: doc.source,
        };
        documentsNew++;
      }
    }

    // Tambahkan dokumenten lainnya sebagai update jika sudah ada
    for (const [sourceKey, sampleDoc] of Object.entries(samplesBySource)) {
      try {
        const existing = await prisma.legalDocument.findUnique({
          where: {
            source_sourceId: {
              source: sampleDoc.source,
              sourceId: sampleDoc.sourceId,
            },
          },
        });

        if (existing) {
          await prisma.legalDocument.update({
            where: { id: existing.id },
            data: {
              judul: sampleDoc.judul,
              tentang: sampleDoc.tentang,
              status: sampleDoc.status,
              urlSumber: sampleDoc.urlSumber,
              syncedAt: new Date(),
            },
          });
          documentsUpdated++;
        } else {
          await prisma.legalDocument.create({
            data: {
              source: sampleDoc.source,
              sourceId: sampleDoc.sourceId,
              jenis: sampleDoc.jenis,
              nomor: sampleDoc.nomor,
              tahun: sampleDoc.tahun,
              judul: sampleDoc.judul,
              tentang: sampleDoc.tentang,
              status: sampleDoc.status,
              urlSumber: sampleDoc.urlSumber,
              instansi: sampleDoc.instansi,
            },
          });
          documentsNew++;
        }
      } catch (err) {
        documentsFailed++;
      }
    }
  } catch (err) {
    documentsFailed++;
  }

  const duration = Date.now() - startTime;

  await prisma.syncLog.create({
    data: {
      source: "sample",
      status: documentsNew > 0 || documentsUpdated > 0 ? "success" : "partial",
      documentsNew,
      documentsUpdated,
      documentsFailed,
      duration,
      message: `Loaded ${documentsNew + documentsUpdated} dynamic sample documents from database`,
      finishedAt: new Date(),
    },
  });

  return {
    source: "sample",
    status: documentsNew > 0 || documentsUpdated > 0 ? "success" : "partial",
    documentsNew,
    documentsUpdated,
    documentsFailed,
    duration,
  };
}