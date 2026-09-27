import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Sinonim pencarian: kata kunci pengguna -> istilah database
const SEARCH_SYNONYMS: Record<string, string[]> = {
  "cerai": ["perceraian", "talak"],
  "cerai islam": ["perceraian", "talak", "khulu'", "fasakh"],
  "talak": ["talak", "perceraian"],
  "talak islam": ["talak", "perceraian", "khulu'", "fasakh"],
  "nikah": ["nikah", "pernikahan", "kawin"],
  "nikah islam": ["nikah", "pernikahan", "kawin", "walimatul 'urs"],
  "aqiqah": ["aqiqah", "aqiquah", " akikah"],
  "menafkahi": ["nafkah", "nafkah iddah", "nafkah mut'ah", "penghidupan"],
  "menafkahi mantan istri": ["nafkah iddah", "nafkah mut'ah", "nafkah"],
  "hak asuh": ["hak asuh anak", "asuh anak", "khadhanah"],
  "hak asuh anak": ["hak asuh anak", "asuh anak", "khadhanah"],
  "hak asuh anak islam": ["hak asuh anak", "asuh anak", "khadhanah", "perceraian"],
  "asuh anak": ["asuh anak", "hak asuh anak", "khadhanah"],
};

function expandSearchTerms(raw: string): string[] {
  const lower = raw.trim().toLowerCase();
  const expanded = new Set<string>([raw.trim()]);
  
  // Cek sinonim exact match dulu
  if (SEARCH_SYNONYMS[lower]) {
    SEARCH_SYNONYMS[lower].forEach(t => expanded.add(t));
  }
  
  // Cek partial match (kata kunci mengandung sinonim key)
  for (const [key, vals] of Object.entries(SEARCH_SYNONYMS)) {
    if (lower.includes(key)) {
      vals.forEach(t => expanded.add(t));
    }
  }
  
  return Array.from(expanded);
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const jenis = searchParams.get("jenis") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = 20;

    const searchTerms = expandSearchTerms(search);

    const searchWhere: any = search
      ? {
          OR: searchTerms.flatMap((term) => [
            { judul: { contains: term, mode: "insensitive" } },
            { tentang: { contains: term, mode: "insensitive" } },
            { nomor: { contains: term, mode: "insensitive" } },
          ]),
        }
      : {};

    // Where untuk data halaman: gabungan kata kunci + kategori terpilih.
    const where: any = { ...searchWhere };
    if (jenis) {
      where.jenis = jenis;
    }

    // Where untuk daftar kategori chip: konsisten dengan kata kunci
    // (tanpa filter kategori terpilih), supaya kategori yang ditampilkan
    // selalu relevan dengan yang sedang diketik.
    const jenisWhere: any = { ...searchWhere };

    const [total, documents, jenisList] = await Promise.all([
      prisma.legalDocument.count({ where }),
      prisma.legalDocument.findMany({
        where,
        orderBy: [{ tahun: "desc" }, { judul: "asc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.legalDocument.groupBy({
        by: ["jenis"],
        _count: { id: true },
        where: jenisWhere,
        orderBy: { jenis: "asc" },
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return NextResponse.json({
      success: true,
      data: documents,
      meta: {
        total,
        page,
        pageSize,
        totalPages,
      },
      jenisList,
    });
  } catch (error: any) {
    console.error("Dokumen list error:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Gagal mengambil data" },
      { status: 500 }
    );
  }
}
