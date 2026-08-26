import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface ImportDocument {
  source?: string;
  sourceId?: string;
  jenis: string;
  nomor: string;
  tahun: string;
  judul: string;
  tentang?: string;
  status?: string;
  tanggal?: string;
  urlSumber?: string;
  urlPdf?: string;
  instansi?: string;
}

function parseCSV(text: string): ImportDocument[] {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const docs: ImportDocument[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim());
    if (values.length < 4) continue;

    const obj: any = {};
    headers.forEach((h, idx) => {
      obj[h] = values[idx] || "";
    });

    docs.push({
      source: obj.source || "import",
      sourceId: obj.sourceid || obj.source_id || `import-${Date.now()}-${i}`,
      jenis: obj.jenis || obj.type || "",
      nomor: obj.nomor || obj.number || "",
      tahun: obj.tahun || obj.year || "",
      judul: obj.judul || obj.title || "",
      tentang: obj.tentang || obj.about || "",
      status: obj.status || "berlaku",
      tanggal: obj.tanggal || obj.date || undefined,
      urlSumber: obj.urlsumber || obj.url_sumber || obj.url || undefined,
      urlPdf: obj.urlpdf || obj.url_pdf || undefined,
      instansi: obj.instansi || obj.agency || undefined,
    });
  }

  return docs;
}

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";

    let documents: ImportDocument[] = [];

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;

      if (!file) {
        return NextResponse.json({ success: false, message: "File tidak ditemukan" }, { status: 400 });
      }

      const text = await file.text();
      const ext = file.name.split(".").pop()?.toLowerCase();

      if (ext === "csv") {
        documents = parseCSV(text);
      } else {
        try {
          const json = JSON.parse(text);
          documents = Array.isArray(json) ? json : [json];
        } catch {
          return NextResponse.json(
            { success: false, message: "Format file tidak valid. Gunakan JSON atau CSV." },
            { status: 400 }
          );
        }
      }
    } else {
      const body = await req.json();
      documents = Array.isArray(body.documents) ? body.documents : [body];
    }

    if (documents.length === 0) {
      return NextResponse.json({ success: false, message: "Tidak ada data untuk diimport" }, { status: 400 });
    }

    let imported = 0;
    let updated = 0;
    let failed = 0;
    const errors: string[] = [];

    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];

      if (!doc.jenis || !doc.nomor || !doc.tahun || !doc.judul) {
        failed++;
        errors.push(`Baris ${i + 1}: field wajib kosong (jenis, nomor, tahun, judul)`);
        continue;
      }

      try {
        const source = doc.source || "import";
        const sourceId = doc.sourceId || `${doc.jenis.toLowerCase()}-${doc.nomor}-${doc.tahun}`;

        const existing = await prisma.legalDocument.findUnique({
          where: {
            source_sourceId: { source, sourceId },
          },
        });

        if (existing) {
          await prisma.legalDocument.update({
            where: { id: existing.id },
            data: {
              judul: doc.judul,
              tentang: doc.tentang || existing.tentang,
              status: doc.status || existing.status,
              urlSumber: doc.urlSumber || existing.urlSumber,
              urlPdf: doc.urlPdf || existing.urlPdf,
              instansi: doc.instansi || existing.instansi,
              syncedAt: new Date(),
            },
          });
          updated++;
        } else {
          await prisma.legalDocument.create({
            data: {
              source,
              sourceId,
              jenis: doc.jenis,
              nomor: doc.nomor,
              tahun: doc.tahun,
              judul: doc.judul,
              tentang: doc.tentang,
              status: doc.status || "berlaku",
              tanggal: doc.tanggal ? new Date(doc.tanggal) : undefined,
              urlSumber: doc.urlSumber,
              urlPdf: doc.urlPdf,
              instansi: doc.instansi,
            },
          });
          imported++;
        }
      } catch (err) {
        failed++;
        errors.push(`Baris ${i + 1}: ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    }

    await prisma.syncLog.create({
      data: {
        source: "manual-import",
        status: failed > 0 && imported === 0 ? "failed" : "success",
        documentsNew: imported,
        documentsUpdated: updated,
        documentsFailed: failed,
        duration: 0,
        message: `Import ${documents.length} dokumen: ${imported} baru, ${updated} update, ${failed} gagal`,
        finishedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        total: documents.length,
        imported,
        updated,
        failed,
        errors: errors.slice(0, 10),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Gagal import: " + (error instanceof Error ? error.message : "Unknown") },
      { status: 500 }
    );
  }
}
