import { PrismaClient } from "@prisma/client";
import { syncAll } from "@/lib/sync";

// Node 16 tidak punya global fetch (standalone tsx). Polyfill dengan node-fetch.
import fetch, { Headers, Request, Response } from "node-fetch";
if (!(globalThis as any).fetch) {
  (globalThis as any).fetch = fetch;
  (globalThis as any).Headers = Headers;
  (globalThis as any).Request = Request;
  (globalThis as any).Response = Response;
}

const p = new PrismaClient();

// Wipe semua data sinkron + re-sync ulang.
// Setelah itu, hapus dokumen yang TIDAK bisa diakses sama sekali
// (urlPdf null/kosong DAN urlSumber tidak valid).

async function main() {
  console.log("=== STEP 1: Wipe data sinkron ===");
  const before = await p.legalDocument.count();
  console.log(`  Sebelum wipe: ${before} dokumen`);

  await p.syncLog.deleteMany();
  await p.sourceImport.deleteMany();
  await p.syncExportState.deleteMany();
  await p.legalDocument.deleteMany();
  console.log("  Semua data sinkron terhapus.");

  console.log("\n=== STEP 2: Sync ulang dari semua sumber ===");
  const results = await syncAll();

  for (const r of results) {
    console.log(
      `  [${r.source}] ${r.status}: ${r.documentsNew} baru, ${r.documentsUpdated} update, ${r.documentsFound} ditemukan (${r.duration}ms)${r.skipped ? " (dilewati)" : ""}`
    );
  }

  const totalDocs = await p.legalDocument.count();
  console.log(`\n  Total dokumen setelah sync: ${totalDocs}`);

  console.log("\n=== STEP 3: Hapus dokumen tidak bisa diakses ===");

  // Dokumen yang tidak punya urlPdf DAN tidak punya urlSumber valid:
  // mustahil diakses oleh user.
  const inaccessible = await p.legalDocument.count({
    where: {
      AND: [
        { OR: [{ urlPdf: null }, { urlPdf: "" }] },
        { OR: [{ urlSumber: null }, { urlSumber: "" }, { NOT: [{ urlSumber: null }, { urlSumber: { startsWith: "http" } }] }] },
      ],
    },
  });
  console.log(`  Dokumen tanpa akses (pdf + sumber): ${inaccessible}`);

  if (inaccessible > 0) {
    const ids = (
      await p.legalDocument.findMany({
        where: {
          AND: [
            { OR: [{ urlPdf: null }, { urlPdf: "" }] },
            { OR: [{ urlSumber: null }, { urlSumber: "" }, { NOT: [{ urlSumber: null }, { urlSumber: { startsWith: "http" } }] }] },
          ],
        },
        select: { id: true },
      })
    ).map((d) => d.id);

    for (let i = 0; i < ids.length; i += 1000) {
      await p.legalDocument.deleteMany({ where: { id: { in: ids.slice(i, i + 1000) } } });
    }
    console.log(`  ${ids.length} dokumen terhapus.`);
  }

  // Dokumen yang hanya punya urlSumber (link ke halaman Kemenkum) tapi TANPA
  // urlPdf: user hanya bisa lihat detail page, tidak bisa download PDF.
  // Tapi ini masih bisa diakses — user klik "Sumber" → 200 OK.
  const sumberOnly = await p.legalDocument.count({
    where: {
      OR: [{ urlPdf: null }, { urlPdf: "" }],
      urlSumber: { startsWith: "http" },
    },
  });

  // Final stats
  const finalCount = await p.legalDocument.count();
  const withPdf = await p.legalDocument.count({ where: { urlPdf: { startsWith: "http" } } });
  const withSumber = await p.legalDocument.count({ where: { urlSumber: { startsWith: "http" } } });

  console.log("\n=== HASIL AKHIR ===");
  console.log(`  Total dokumen:         ${finalCount}`);
  console.log(`  Dengan URL PDF:        ${withPdf}`);
  console.log(`  Hanya link Sumber:     ${sumberOnly}`);
  console.log(`  Dengan URL Sumber:     ${withSumber}`);

  // Breakdown per jenis
  const byJenis = await p.legalDocument.groupBy({
    by: ["source"],
    _count: { _all: true },
  });
  byJenis.sort((a, b) => b._count._all - a._count._all);
  console.log("\n  Per sumber:");
  for (const j of byJenis) {
    console.log(`    ${j.source}: ${j._count._all}`);
  }
}

main()
  .catch(console.error)
  .finally(() => p.$disconnect());