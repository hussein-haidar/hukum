import { createHash } from "crypto";

// Tahap 3 & 7: Hash digunakan untuk mendeteksi perubahan.
// - Export/list fingerprint: agar sync bisa dilewati kalau sumber tidak berubah.
// - Record checksum: agar hanya metadata yang benar-benar berubah yang di-UPDATE.

export function sha256Hex(input: string | Buffer): string {
  return createHash("sha256").update(input).digest("hex");
}

// Hash dari satu dokumen mentah (raw). Digunakan untuk fingerprint level staging.
export function hashRaw(raw: unknown): string {
  return sha256Hex(JSON.stringify(stableStringify(raw)));
}

// Fingerprint level sumber: hash dari seluruh (externalId + rawHash) yang diurutkan.
// Kalau dua fetch menghasilkan fingerprint sama -> sumber tidak berubah.
export function computeSourceFingerprint(rows: { externalId: string; rawHash: string }[]): string {
  const lines = rows
    .map((r) => `${r.externalId}|${r.rawHash}`)
    .sort();
  return sha256Hex(lines.join("\n"));
}

// Checksum metadata satu dokumen ter-normalisasi (tanpa field PDF/storage).
// Berubah -> UPDATE; sama -> dilewati.
export function metadataChecksum(doc: {
  jenis: string;
  nomor: string;
  tahun: string;
  judul: string;
  tentang?: string | null;
  status: string;
  tanggal?: Date | null;
  instansi?: string | null;
  urlSumber?: string | null;
}): string {
  const payload = {
    jenis: doc.jenis ?? "",
    nomor: doc.nomor ?? "",
    tahun: doc.tahun ?? "",
    judul: doc.judul ?? "",
    tentang: doc.tentang ?? "",
    status: doc.status ?? "",
    tanggal: doc.tanggal ? doc.tanggal.toISOString().slice(0, 10) : "",
    instansi: doc.instansi ?? "",
    urlSumber: doc.urlSumber ?? "",
  };
  return sha256Hex(JSON.stringify(payload));
}

// Stabilkan object key order supaya hash konsisten antar run.
function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return "[" + value.map(stableStringify).join(",") + "]";
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return "{" + keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(",") + "}";
}
