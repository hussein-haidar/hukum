// Backfill glosarium: panen istilah dari seluruh dokumen yang sudah ada di DB.
// Idempotent (istilah baru saja yang ditambahkan), aman dijalankan ulang.
// Jalankan: npx tsx scripts/backfill-glossary.ts  (DATABASE_URL harus di-set)
const g = globalThis as any;
if (!(g.AbortSignal && g.AbortSignal.timeout)) {
  g.AbortSignal = g.AbortSignal || {};
  g.AbortSignal.timeout = (ms: number) => {
    const c = new AbortController();
    setTimeout(() => c.abort(), ms);
    return c.signal;
  };
}

async function main() {
  const { prisma } = await import("../src/lib/prisma");
  const { extractGlossaryCandidates, insertGlossaryCandidates } = await import(
    "../src/lib/sync/glosarium"
  );

  const pageSize = 500;
  let cursor = 0;
  let scanned = 0;
  const candidates: Array<{ term: string; definition: string }> = [];
  const seen = new Set<string>();

  while (true) {
    const docs = await prisma.legalDocument.findMany({
      select: { judul: true, tentang: true, fullText: true },
      orderBy: { id: "asc" },
      skip: cursor,
      take: pageSize,
    });
    if (docs.length === 0) break;
    scanned += docs.length;
    for (const c of extractGlossaryCandidates(docs)) {
      const key = c.term.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      candidates.push(c);
    }
    cursor += pageSize;
    console.error(`  ${scanned} dokumen dipindai, ${candidates.length} kandidat...`);
  }

  const inserted = await insertGlossaryCandidates(candidates);
  console.log(`\nSelesai: ${scanned} dokumen dipindai, ${inserted} istilah glosarium baru.`);
  await prisma.$disconnect();
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

export {};