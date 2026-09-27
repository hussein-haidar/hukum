import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const jenis = searchParams.get("jenis") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = 20;

    const searchWhere: any = search
      ? {
          OR: [
            { judul: { contains: search, mode: "insensitive" } },
            { tentang: { contains: search, mode: "insensitive" } },
            { nomor: { contains: search, mode: "insensitive" } },
          ],
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
