import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Proxy PDF agar bisa dibaca in-app (iframe/pdf.js) tanpa CORS/hotlink issue
// di smartphone. Hanya bisa mengambil urlPdf milik dokumen yang tersimpan,
// jadi aman dari open-proxy.
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
    const res = await fetch(doc.urlPdf, {
      headers: { "User-Agent": "Mozilla/5.0 HukumKu-PdfReader/1.0" },
      signal: AbortSignal.timeout(45000),
    });
    if (!res.ok) {
      return new NextResponse("Gagal mengambil PDF", { status: res.status });
    }
    const buf = await res.arrayBuffer();
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