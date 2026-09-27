import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchPdfWithRetry } from "@/lib/pdf-fetch";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get("id") || "");
  if (!Number.isInteger(id) || id <= 0) {
    return new NextResponse("Missing id", { status: 400 });
  }

  const doc = await prisma.legalDocument.findUnique({
    where: { id },
    select: { id: true, urlPdf: true },
  });
  if (!doc?.urlPdf || !/^https?:\/\//i.test(doc.urlPdf)) {
    return new NextResponse("PDF tidak tersedia", { status: 404 });
  }

  try {
    const buf = await fetchPdfWithRetry(doc.urlPdf);
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return new NextResponse("Gagal mengambil PDF", { status: 502 });
  }
}