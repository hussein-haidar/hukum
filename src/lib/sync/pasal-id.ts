import { prisma } from "@/lib/prisma";
import { SyncResult } from "./types";

const BASE_URL = "https://pasal.id";

function extractDocs(html: string): any[] {
  const docs: any[] = [];
  const text = html.replace(/<[^>]+>/g, "|").replace(/&/g, "&").replace(/&#039;/g, "'");
  const lines = text.split("|").map((l: string) => l.trim()).filter((l: string) => l.length > 0);

  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^(Undang-Undang|Peraturan Pemerintah|Peraturan Presiden|Peraturan Menteri|Peraturan Daerah|UUD)\s+Nomor\s+(\d+)\s+Tahun\s+(\d{4})$/);
    if (m) {
      let tentang = "";
      for (let k = i + 1; k < Math.min(i + 5, lines.length); k++) {
        if (lines[k].length > 10 && !lines[k].match(/^(Dokumen|Pasal|Pemerintah|&nbsp;|\d{4}|Peraturan|Undang)/)) {
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

export async function syncPasalId(): Promise<SyncResult> {
  const startTime = Date.now();
  let documentsNew = 0;
  let documentsUpdated = 0;
  let documentsFailed = 0;
  const errors: string[] = [];

  const lawTypes = ["uu", "pp", "perpres", "permen"];

  for (const type of lawTypes) {
    try {
      const url = `${BASE_URL}/peraturan/${type}`;

      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) HukumKu/1.0",
          Accept: "text/html,application/xhtml+xml",
        },
        signal: AbortSignal.timeout(20000),
      });

      if (!res.ok) {
        errors.push(`Pasal.id page ${type}: HTTP ${res.status}`);
        documentsFailed++;
        continue;
      }

      const html = await res.text();

      if (html.length < 1000) {
        errors.push(`Pasal.id page ${type}: invalid response from server`);
        documentsFailed++;
        continue;
      }

      const docs = extractDocs(html);

      if (docs.length === 0) {
        errors.push(`Pasal.id page ${type}: no documents found`);
        documentsFailed++;
        continue;
      }

      for (const doc of docs) {
        try {
          const sourceId = `${type}-${doc.nomor}-${doc.tahun}`;

          const existing = await prisma.legalDocument.findUnique({
            where: {
              source_sourceId: {
                source: "pasal.id",
                sourceId,
              },
            },
          });

          if (existing) {
            documentsUpdated++;
          } else {
            await prisma.legalDocument.create({
              data: {
                source: "pasal.id",
                sourceId,
                jenis: doc.jenis,
                nomor: doc.nomor,
                tahun: doc.tahun,
                judul: doc.judul,
                tentang: doc.tentang,
                status: "berlaku",
                urlSumber: `${BASE_URL}/peraturan/${type}-${doc.nomor}-${doc.tahun}`,
                instansi: undefined,
              },
            });
            documentsNew++;
          }
        } catch (err) {
          documentsFailed++;
        }
      }

      await new Promise((r) => setTimeout(r, 2000));
    } catch (err: any) {
      const errMsg = err.name === "TimeoutError"
        ? `Pasal.id page ${type}: timeout`
        : `Pasal.id page ${type}: ${err.message || "error"}`;
      errors.push(errMsg);
      documentsFailed++;
    }
  }

  const duration = Date.now() - startTime;
  const finalStatus = documentsNew === 0 && documentsFailed > 0 ? "failed" : documentsNew > 0 ? "success" : "partial";
  const message = errors.length > 0
    ? `${errors.slice(0, 3).join("; ")}${errors.length > 3 ? ` (+${errors.length - 3} lainnya)` : ""}`
    : `Synced ${documentsNew + documentsUpdated} documents from pasal.id`;

  await prisma.syncLog.create({
    data: {
      source: "pasal.id",
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
    source: "pasal.id",
    status: finalStatus,
    documentsNew,
    documentsUpdated,
    documentsFailed,
    duration,
    message,
  };
}