// CLI sync semua sumber terhadap DB live.
// Jalankan: npx tsx scripts/sync.ts [sourceId]  (DATABASE_URL harus di-set)
// Dipakai untuk: uji manual, cron eksternal, atau sekali isi data.
// Lokal pakai Node 16 (tanpa fetch bawaan) -> fallback ke node-fetch@2.
// Runner GitHub Action pakai Node 20 -> fetch native sudah ada.
const g = globalThis as any;
if (!g.fetch && typeof fetch === "undefined") {
  try {
    const nf = require("node-fetch");
    if (nf) g.fetch = nf.default || nf;
  } catch {
    /* tidak ada node-fetch; biarkan error muncul jelas saat dipakai */
  }
}
if (!(g.AbortSignal && g.AbortSignal.timeout)) {
  g.AbortSignal = g.AbortSignal || {};
  g.AbortSignal.timeout = (ms: number) => {
    const c = new AbortController();
    setTimeout(() => c.abort(), ms);
    return c.signal;
  };
}

async function main() {
  const { getAllAdapters } = await import("../src/lib/sync/registry");
  const { runAdapterSync } = await import("../src/lib/sync/engine");
  const { prisma } = await import("../src/lib/prisma");

  const onlySource = process.argv[2];
  const adapters = getAllAdapters().filter(
    (a) => !onlySource || a.id === onlySource
  );
  console.log(
    `Sumber: ${adapters.map((a) => a.id).join(", ")}${
      onlySource ? `  (hanya: ${onlySource})` : ""
    }\n`
  );

  for (const adapter of adapters) {
    const t0 = Date.now();
    const r = await runAdapterSync(adapter);
    console.log(`\n[${adapter.id}] status=${r.status} durasi=${((Date.now() - t0) / 1000).toFixed(1)}s`);
    console.log(`  new=${r.documentsNew} updated=${r.documentsUpdated} failed=${r.documentsFailed} found=${r.documentsFound} skipped=${r.skipped}`);
    console.log(`  msg: ${r.message}`);
  }

  console.log("\n=== Dokumen per source di DB ===");
  for (const adapter of adapters) {
    const c = await prisma.legalDocument.count({ where: { source: adapter.id } });
    const jenis = await prisma.legalDocument.groupBy({
      by: ["jenis"],
      where: { source: adapter.id },
      _count: true,
      orderBy: { _count: { jenis: "desc" } },
      take: 5,
    });
    console.log(`  ${adapter.id}: ${c} dokumen`);
    for (const j of jenis) console.log(`      ${j.jenis || "(kosong)"}: ${j._count}`);
  }

  await prisma.$disconnect();
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

export {};