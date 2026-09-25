// Insert incremental FAQ tambahan (kategori baru) ke DB LIVE tanpa wipe data.
// Idempotent: FAQ dengan pertanyaan yang sudah ada dilewati.
// Jalankan: npx tsx scripts/insert-faq-extra.ts  (DATABASE_URL harus di-set)
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
  const { EXTRA_FAQS } = await import("../src/lib/faq-data");

  let added = 0;
  let skipped = 0;
  for (const faq of EXTRA_FAQS) {
    const existing = await prisma.fAQ.findFirst({ where: { question: faq.question } });
    if (existing) {
      skipped++;
      continue;
    }
    await prisma.fAQ.create({ data: faq });
    added++;
    console.log(`+ ${faq.category}: ${faq.question}`);
  }

  console.log(`\nSelesai: ${added} FAQ baru ditambahkan, ${skipped} sudah ada (dilewati).`);
  await prisma.$disconnect();
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

export {};