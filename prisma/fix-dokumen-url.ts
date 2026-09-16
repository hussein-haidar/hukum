import { PrismaClient } from "@prisma/client";

// Perbaiki data sinkron lama: urlPdf yang berisi "-", kosong, atau bukan http(s)
// (mis. placeholder "-") dicegah agar tidak memunculkan link "Baca PDF" rusak (404).
const p = new PrismaClient();

async function main() {
  const broken = await p.legalDocument.findMany({
    where: {
      OR: [
        { urlPdf: "-" },
        { urlPdf: "" },
        { NOT: [{ urlPdf: null }, { urlPdf: { startsWith: "http" } }] },
      ],
    },
    select: { id: true, urlPdf: true },
  });

  console.log("urlPdf rusak ditemukan:", broken.length);

  if (broken.length > 0) {
    const ids = broken.map((b) => b.id);
    // update bertahap agar tidak overload query
    for (let i = 0; i < ids.length; i += 1000) {
      const chunk = ids.slice(i, i + 1000);
      const res = await p.legalDocument.updateMany({
        where: { id: { in: chunk } },
        data: { urlPdf: null },
      });
      console.log(`  batch ${i + 1}-${i + chunk.length}: ${res.count} diperbaiki`);
    }
  }

  const urlSumberBroken = await p.legalDocument.findMany({
    where: {
      OR: [
        { urlSumber: "-" },
        { urlSumber: "" },
        { NOT: [{ urlSumber: null }, { urlSumber: { startsWith: "http" } }] },
      ],
    },
    select: { id: true },
  });
  console.log("\nurlSumber rusak ditemukan:", urlSumberBroken.length);
  if (urlSumberBroken.length > 0) {
    const ids = urlSumberBroken.map((b) => b.id);
    await p.legalDocument.updateMany({
      where: { id: { in: ids } },
      data: { urlSumber: null },
    });
    console.log("urlSumber diperbaiki:", ids.length);
  }

  const stillBroken = await p.legalDocument.count({
    where: {
      OR: [{ urlPdf: "-" }, { NOT: [{ urlPdf: null }, { urlPdf: { startsWith: "http" } }] }],
    },
  });
  console.log("\nsisa urlPdf tidak valid:", stillBroken);
}

main()
  .catch(console.error)
  .finally(() => p.$disconnect());