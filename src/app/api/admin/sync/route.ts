import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncAll, syncSource } from "@/lib/sync";

export async function GET() {
  try {
    const [documents, logs, stats] = await Promise.all([
      prisma.legalDocument.groupBy({
        by: ["source", "jenis"],
        _count: { id: true },
      }),
      prisma.syncLog.findMany({
        orderBy: { startedAt: "desc" },
        take: 10,
      }),
      prisma.legalDocument.aggregate({
        _count: { id: true },
      }),
    ]);

    const sourceStats: Record<string, number> = {};
    const jenisStats: Record<string, number> = {};

    for (const doc of documents) {
      sourceStats[doc.source] = (sourceStats[doc.source] || 0) + doc._count.id;
      jenisStats[doc.jenis] = (jenisStats[doc.jenis] || 0) + doc._count.id;
    }

    const lastSync = logs[0] || null;
    const isSyncing = lastSync && lastSync.status === "success" && !lastSync.finishedAt;

    return NextResponse.json({
      success: true,
      data: {
        totalDocuments: stats._count.id,
        sourceStats,
        jenisStats,
        recentLogs: logs,
        lastSync: lastSync ? {
          source: lastSync.source,
          status: lastSync.status,
          documentsNew: lastSync.documentsNew,
          documentsUpdated: lastSync.documentsUpdated,
          documentsFailed: lastSync.documentsFailed,
          startedAt: lastSync.startedAt,
          finishedAt: lastSync.finishedAt,
          duration: lastSync.duration,
        } : null,
        isSyncing,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Gagal mengambil status sinkronisasi" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { source } = await req.json();

    let results;
    if (source && source !== "all") {
      const result = await syncSource(source);
      results = [result];
    } else {
      results = await syncAll();
    }

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Gagal menjalankan sinkronisasi" },
      { status: 500 }
    );
  }
}
