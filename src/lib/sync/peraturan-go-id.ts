import { prisma } from "@/lib/prisma";
import { SyncResult } from "./types";

const BASE_URL = "https://peraturan.go.id";

const JENIS_MAP: Record<string, string> = {
  UU: "Undang-Undang",
  PP: "Peraturan Pemerintah",
  PERPRES: "Peraturan Presiden",
  PERMEN: "Peraturan Menteri",
  PERDA: "Peraturan Daerah",
  TAPMPR: "Ketetapan MPR",
};

function parseHTML(html: string): { items: any[]; total: number; totalPages: number } {
  const items: any[] = [];

  const totalMatch = html.match(/(\d+[\.\d]*)\s*Peraturan\s+ditemukan/);
  const total = totalMatch ? parseInt(totalMatch[1].replace(/\./g, ""), 10) : 0;

  const pageMatch = html.match(/Ditampilan\s+\d+\s*-\s*\d+\s+data\s+dari\s+(\d+[\.\d]*)/);
  const totalDisplay = pageMatch ? parseInt(pageMatch[1].replace(/\./g, ""), 10) : total;
  const totalPages = Math.ceil(totalDisplay / 20);

  const itemRegex = /<div[^>]*class="[^"]*regulation-item[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/gi;
  let match;
  while ((match = itemRegex.exec(html)) !== null) {
    items.push(match[1]);
  }

  if (items.length === 0) {
    const sectionRegex = /<(?:div|li)[^>]*>\s*<(?:span|b|strong)[^>]*>\s*(UU|PP|PERPRES|PERMEN|PERDA|TAPMPR|PERPPU|KEPPRES|INPRES|PERBAN|PERMENKUMHAM|PENETAPAN)\s*<\/(?:span|b|strong)>\s*<(?:span|div)[^>]*>\s*(\d{4})\s*<\/(?:span|div)>\s*<(?:div|span|p)[^>]*>\s*(.*?)\s*<\/(?:div|span|p)>/gi;
    while ((match = sectionRegex.exec(html)) !== null) {
      items.push({ jenis: match[1], tahun: match[2], judul: match[3].trim() });
    }
  }

  return { items, total, totalPages };
}

function extractDocumentsFromText(html: string): any[] {
  const docs: any[] = [];
  const lines = html.split(/\n/);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

    const m = line.match(/(UU|PP|PERPRES|PERMEN|PERDA|TAPMPR|PERPPU|KEPPRES|INPRES|PERBAN|PERMENKUMHAM|PENETAPAN)\s+(\d{4})/);
    if (m) {
      let judul = "";
      for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
        const nextLine = lines[j].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
        if (nextLine && nextLine.length > 10 && !nextLine.match(/^(UU|PP|PERPRES|PERMEN|PERDA|TAPMPR|PERPPU|Dokumen)/)) {
          judul = nextLine;
          break;
        }
      }

      if (judul) {
        const nomorMatch = judul.match(/Nomor\s+(\d+)/i);
        docs.push({
          jenis: JENIS_MAP[m[1]] || m[1],
          jenisShort: m[1],
          nomor: nomorMatch ? nomorMatch[1] : "",
          tahun: m[2],
          judul: judul,
        });
      }
    }
  }

  return docs;
}

export async function syncPeraturanGoId(): Promise<SyncResult> {
  const startTime = Date.now();
  let documentsNew = 0;
  let documentsUpdated = 0;
  let documentsFailed = 0;
  const errors: string[] = [];

  const jenisFilters = [
    { id: "10", name: "UU", jenisShort: "UU" },
    { id: "5", name: "PP", jenisShort: "PP" },
    { id: "6", name: "Perpres", jenisShort: "PERPRES" },
    { id: "9", name: "Permen", jenisShort: "PERMEN" },
  ];

  for (const filter of jenisFilters) {
    let page = 1;
    let maxPages = 3;

    while (page <= maxPages) {
      try {
        const params = new URLSearchParams({
          "PencarianSpesifik[jenis]": filter.id,
          "PencarianSpesifik[status]": "1",
          "PencarianSpesifik[pemrakarsa]": "",
          "PencarianSpesifik[tahunDari]": "",
          "PencarianSpesifik[tahunSampai]": "",
          "PeraturanSearch[pager]": "1",
          "PeraturanSearch[idglobal]": "1",
        });

        if (page > 1) {
          params.set("PeraturanSearch[idglobal]", String(page));
        }

        const url = `${BASE_URL}/cariglobal?${params.toString()}`;

        const res = await fetch(url, {
          headers: {
            "User-Agent": "HukumKu/1.0 (Open Data Research)",
            Accept: "text/html",
          },
          signal: AbortSignal.timeout(20000),
        });

        if (!res.ok) {
          errors.push(`${filter.name} page ${page}: HTTP ${res.status}`);
          break;
        }

        const html = await res.text();
        const docs = extractDocumentsFromText(html);

        if (docs.length === 0) {
          break;
        }

        for (const doc of docs) {
          try {
            const sourceId = `${doc.jenisShort.toLowerCase()}-${doc.nomor}-${doc.tahun}`;

            if (!doc.judul || doc.judul.length < 5) {
              documentsFailed++;
              continue;
            }

            const existing = await prisma.legalDocument.findUnique({
              where: {
                source_sourceId: {
                  source: "peraturan.go.id",
                  sourceId,
                },
              },
            });

            if (existing) {
              await prisma.legalDocument.update({
                where: { id: existing.id },
                data: {
                  judul: doc.judul,
                  syncedAt: new Date(),
                },
              });
              documentsUpdated++;
            } else {
              await prisma.legalDocument.create({
                data: {
                  source: "peraturan.go.id",
                  sourceId,
                  jenis: doc.jenis,
                  nomor: doc.nomor,
                  tahun: doc.tahun,
                  judul: doc.judul,
                  tentang: doc.judul,
                  status: "berlaku",
                  urlSumber: `${BASE_URL}/peraturan/${sourceId}`,
                  instansi: "Pemerintah Pusat",
                },
              });
              documentsNew++;
            }
          } catch (err) {
            documentsFailed++;
          }
        }

        const totalMatch = html.match(/(\d+[\.\d]*)\s*Peraturan\s+ditemukan/);
        if (totalMatch) {
          const totalDocs = parseInt(totalMatch[1].replace(/\./g, ""), 10);
          maxPages = Math.min(Math.ceil(totalDocs / 20), 5);
        }

        page++;
        await new Promise((r) => setTimeout(r, 1000));
      } catch (err: any) {
        const errMsg = err.name === "TimeoutError" || err.name === "AbortError"
          ? `${filter.name} page ${page}: timeout`
          : `${filter.name} page ${page}: ${err.message || "error"}`;
        errors.push(errMsg);
        documentsFailed++;
        break;
      }
    }
  }

  const duration = Date.now() - startTime;
  const finalStatus = documentsNew === 0 && documentsFailed > 0 ? "failed" : documentsNew > 0 ? "success" : "partial";
  const message = errors.length > 0
    ? `${errors.slice(0, 3).join("; ")}${errors.length > 3 ? ` (+${errors.length - 3} lainnya)` : ""}`
    : `Synced ${documentsNew + documentsUpdated} documents`;

  await prisma.syncLog.create({
    data: {
      source: "peraturan.go.id",
      status: finalStatus,
      documentsNew,
      documentsUpdated,
      documentsFailed,
      duration,
      message,
      finishedAt: new Date(),
    },
  });

  return {
    source: "peraturan.go.id",
    status: finalStatus,
    documentsNew,
    documentsUpdated,
    documentsFailed,
    duration,
    message,
  };
}
