const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const doc = await prisma.legalDocument.findUnique({ 
    where: { id: 147937 }, 
    select: { id: true, judul: true, urlPdf: true, urlSumber: true, jenis: true, source: true, tentang: true } 
  });
  console.log('Doc 147937:', JSON.stringify(doc, null, 2));
  
  // Also test search
  const results = await prisma.legalDocument.findMany({
    where: {
      OR: [
        { judul: { contains: 'cerai islam', mode: 'insensitive' } },
        { tentang: { contains: 'cerai islam', mode: 'insensitive' } },
        { nomor: { contains: 'cerai islam', mode: 'insensitive' } }
      ]
    },
    take: 5,
    select: { id: true, judul: true, jenis: true, source: true }
  });
  console.log('Search cerai islam:', JSON.stringify(results, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());