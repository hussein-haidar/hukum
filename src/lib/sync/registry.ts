import { SourceAdapter } from "./types";
import { jdihnAdapter } from "./adapters/jdihn";
import { jdihnKemenkumAdapter } from "./adapters/jdihn-kemenkum";
import { perpusnasAdapter } from "./adapters/perpusnas";
import { peraturanGoIdAdapter } from "./adapters/peraturan-go-id";

// Daftar semua sumber yang tersedia. Tambahkan adapter baru di sini.
// Catatan endpoint (hasil penelusuran):
//  - peraturan.go.id      : scrape HTML (tidak ada export/feed resmi)
//  - jdihn (Kemenkeu)     : API JSON terpaginas, respons 200, andal
//  - jdihn-kemenkum       : feed/document.json EXPORT lengkap + URL PDF
//  - perpusnas            : API 503 + web 403 Cloudflare -> gagal (hidden)

export function getAllAdapters(): SourceAdapter[] {
  return [peraturanGoIdAdapter, jdihnAdapter, jdihnKemenkumAdapter, perpusnasAdapter];
}

export function getAdapter(id: string): SourceAdapter | undefined {
  return getAllAdapters().find((a) => a.id === id);
}
