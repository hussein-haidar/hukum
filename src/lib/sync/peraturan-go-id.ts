import { prisma } from "@/lib/prisma";
import { SyncResult } from "./types";

const BASE_URL = "https://peraturan.go.id/cariglobal";

function extractDocs(html: string): any[] {
  const docs: any[] = [];
  const text = html.replace(/<[^>]+>/g, "\n").replace(/&amp;/g, "&").replace(/&#039;/g, "'");

  const pattern = /(UU|PP|PERPRES|PERMEN|PERDA|TAPMPR|PERPPU|KEPPRES|INPRES|PERBAN)\s+(\d{4})\s*\n+(.*?Nomor\s+(\d+)\s+(?:Tahun\s+)?(\d{4})\s*\n+(.*?))\n/g;

  let m: RegExpExecArray | null;
  while ((m = pattern.exec(text)) !== null) {
    const judul = m[5].trim();
    if (judul.length > 5) {
      docs.push({
        jenisShort: m[1],
        tahun: m[2],
        judul: judul.replace(/\s+/g, " "),
        nomor: m[4],
      });
    }
  }

  if (docs.length === 0) {
    const simplePattern = /(UU|PP|PERPRES|PERMEN|PERDA|TAPMPR|PERPPU|KEPPRES|INPRES|PERBAN)\s+(\d{4})/g;
    let sm: RegExpExecArray | null;
    const seen = new Set<string>();

    while ((sm = simplePattern.exec(text)) !== null) {
      const jenisShort = sm[1];
      const tahun = sm[2];
      const afterMatch = text.substring(sm.index, sm.index + 500);
      const lines = afterMatch.split("\n").map((l: string) => l.trim()).filter((l: string) => l.length > 10);

      for (const line of lines) {
        const nomorMatch = line.match(/Nomor\s+(\d+)/);
        if (nomorMatch) {
          const key = `${jenisShort}-${nomorMatch[1]}-${tahun}`;
          if (seen.has(key)) continue;
          seen.add(key);

          const judulLines = lines.filter((l: string) => l.length > 15 && l !== line && !l.match(/^(UU|PP|PERPRES|PERMEN|PERDA|TAPMPR|PERPPU|Dokumen|Pemerintah|Pencarian|Ditampilan)/));
          const judul = judulLines[0] || line;

          docs.push({
            jenisShort,
            tahun,
            nomor: nomorMatch[1],
            judul: judul.replace(/\s+/g, " ").trim(),
          });
          break;
        }
      }
    }
  }

  return docs;
}

const JENIS_MAP: Record<string, string> = {
  UU: "Undang-Undang",
  PP: "Peraturan Pemerintah",
  PERPRES: "Peraturan Presiden",
  PERMEN: "Peraturan Menteri",
  PERDA: "Peraturan Daerah",
  TAPMPR: "Ketetapan MPR",
  PERPPU: "Perppu",
  KEPPRES: "Keputusan Presiden",
  INPRES: "Instruksi Presiden",
  PERBAN: "Peraturan Badan",
};

export async function syncPeraturanGoId(): Promise<SyncResult> {
  const startTime = Date.now();
  let documentsNew = 0;
  let documentsUpdated = 0;
  let documentsFailed = 0;
  const errors: string[] = [];

  const maxPages = 5;

  for (let page = 1; page <= maxPages; page++) {
    try {
      const url = `${BASE_URL}?PeraturanSearch%5Bidglobal%5D=${page}`;

      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) HukumKu/1.0",
          Accept: "text/html,application/xhtml+xml",
        },
        signal: AbortSignal.timeout(20000),
      });

      if (!res.ok) {
        errors.push(`Page ${page}: HTTP ${res.status}`);
        break;
      }

      const html = await res.text();

      if (html.includes("An error occurred") || html.length < 1000) {
        errors.push(`Page ${page}: invalid response`);
        break;
      }

      const docs = extractDocs(html);

      if (docs.length === 0) {
        break;
      }

      for (const doc of docs) {
        try {
          const sourceId = `${doc.jenisShort.toLowerCase()}-${doc.nomor}-${doc.tahun}`;
          const jenis = JENIS_MAP[doc.jenisShort] || doc.jenisShort;

          const existing = await prisma.legalDocument.findUnique({
            where: {
              source_sourceId: {
                source: "peraturan.go.id",
                sourceId,
              },
            },
          });

          if (existing) {
            documentsUpdated++;
          } else {
            await prisma.legalDocument.create({
              data: {
                source: "peraturan.go.id",
                sourceId,
                jenis,
                nomor: doc.nomor,
                tahun: doc.tahun,
                judul: doc.judul,
                tentang: doc.judul,
                status: "berlaku",
                urlSumber: `https://peraturan.go.id/peraturan/${sourceId}`,
                instansi: "Pemerintah Pusat",
              },
            });
            documentsNew++;
          }
        } catch (err) {
          documentsFailed++;
        }
      }

      await new Promise((r) => setTimeout(r, 1500));
    } catch (err: any) {
      const errMsg = err.name === "TimeoutError"
        ? `Page ${page}: timeout`
        : `Page ${page}: ${err.message || "error"}`;
      errors.push(errMsg);
      documentsFailed++;
      break;
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
