import { prisma } from "@/lib/prisma";
import { SyncResult } from "./types";

const BASE_URL = "https://peraturan.go.id/cariglobal";

function extractDocs(html: string): any[] {
  const docs: any[] = [];
  const text = html.replace(/<[^>]+>/g, "|").replace(/&amp;/g, "&").replace(/&#039;/g, "'");
  const lines = text.split("|").map((l: string) => l.trim()).filter((l: string) => l.length > 0);

  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^(Undang-Undang|Peraturan Pemerintah|Peraturan Presiden|Peraturan Menteri|Peraturan Daerah|Ketetapan MPR|Perppu|Keputusan Presiden|Instruksi Presiden|Peraturan Badan|Peraturan Menteri Hukum dan HAM|Peraturan Menteri Keuangan)\s+Nomor\s+(\d+)\s+Tahun\s+(\d{4})$/);
    if (m) {
      let tentang = "";
      for (let k = i + 1; k < Math.min(i + 4, lines.length); k++) {
        if (lines[k].length > 10 && !lines[k].match(/^(Dokumen|Pemerintah|&nbsp;|\d{4}|Peraturan|Undang)/)) {
          tentang = lines[k];
          break;
        }
      }
      docs.push({
        jenis: m[1],
        nomor: m[2],
        tahun: m[3],
        judul: lines[i],
        tentang: tentang || lines[i],
      });
    }
  }

  return docs;
}

const JENIS_MAP: Record<string, string> = {
  "Undang-Undang": "Undang-Undang",
  "Peraturan Pemerintah": "Peraturan Pemerintah",
  "Peraturan Presiden": "Peraturan Presiden",
  "Peraturan Menteri": "Peraturan Menteri",
  "Peraturan Daerah": "Peraturan Daerah",
  "Ketetapan MPR": "Ketetapan MPR",
  "Perppu": "Perppu",
  "Keputusan Presiden": "Keputusan Presiden",
  "Instruksi Presiden": "Instruksi Presiden",
  "Peraturan Badan": "Peraturan Badan",
  "Peraturan Menteri Hukum dan HAM": "Peraturan Menteri",
  "Peraturan Menteri Keuangan": "Peraturan Menteri",
};

const JENIS_SHORT: Record<string, string> = {
  "Undang-Undang": "uu",
  "Peraturan Pemerintah": "pp",
  "Peraturan Presiden": "perpres",
  "Peraturan Menteri": "permen",
  "Peraturan Daerah": "perda",
};

export async function syncPeraturanGoId(): Promise<SyncResult> {
  const startTime = Date.now();
  let documentsNew = 0;
  let documentsUpdated = 0;
  let documentsFailed = 0;
  const errors: string[] = [];

  const maxPages = 10;

  for (let page = 1; page <= maxPages; page++) {
    try {
      const url = `${BASE_URL}?page=${page}`;

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
        errors.push(`Page ${page}: invalid response from server`);
        break;
      }

      const docs = extractDocs(html);

      if (docs.length === 0) {
        break;
      }

      for (const doc of docs) {
        try {
          const shortType = JENIS_SHORT[doc.jenis] || doc.jenis.toLowerCase().replace(/\s+/g, "-");
          const sourceId = `${shortType}-${doc.nomor}-${doc.tahun}`;

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
                jenis: JENIS_MAP[doc.jenis] || doc.jenis,
                nomor: doc.nomor,
                tahun: doc.tahun,
                judul: doc.judul,
                tentang: doc.tentang,
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
