import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const PDF_SIGNATURE = "%PDF-";

async function fetchPdf(url: string): Promise<ArrayBuffer> {
  let lastErr: any = new Error("Gagal mengambil PDF");
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, 1500 * attempt));
    }
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Linux; Android 12) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
          Accept: "application/pdf,*/*;q=0.8",
        },
        signal: AbortSignal.timeout(60000),
      });
      if (!res.ok) {
        lastErr = new Error(`HTTP ${res.status}`);
        continue;
      }
      const buf = await res.arrayBuffer();
      const head = new Uint8Array(buf.slice(0, Math.min(5, buf.byteLength)));
      const signature = String.fromCharCode.apply(null, head as any);
      if (buf.byteLength < 10 || signature !== PDF_SIGNATURE) {
        lastErr = new Error("Response bukan PDF (server sumber salah mengirim)");
        continue;
      }
      return buf;
    } catch (e: any) {
      lastErr = e;
    }
  }
  throw lastErr;
}

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
    const buf = await fetchPdf(doc.urlPdf);
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