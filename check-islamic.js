const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Check sources for Islamic law
  const islamicSources = ['fatwa-mui', 'jpi', 'lppom-mui', 'mui'];
  for (const src of islamicSources) {
    const count = await prisma.legalDocument.count({ where: { source: src } });
    console.log('Source', src, ':', count, 'docs');
  }
  // Sample search terms
  const terms = ['perceraian', 'talak', 'nikah', 'aqiqah', 'asuh anak', 'nafkah'];
  for (const term of terms) {
    const count = await prisma.legalDocument.count({
      where: {
        OR: [
          { judul: { contains: term, mode: 'insensitive' } },
          { tentang: { contains: term, mode: 'insensitive' } }
        ]
      }
    });
    console.log('Term', term, ':', count, 'docs');
  }
  // Show sample judul for each source
  for (const src of islamicSources) {
    const docs = await prisma.legalDocument.findMany({
      where: { source: src },
      take: 3,
      select: { judul: true }
    });
    console.log('Sample', src, ':', JSON.stringify(docs));
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());