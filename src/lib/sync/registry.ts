import { SourceAdapter } from "./types";
import { jdihnAdapter } from "./adapters/jdihn";
import { jdihnKemenkumAdapter } from "./adapters/jdihn-kemenkum";
import { peraturanGoIdAdapter } from "./adapters/peraturan-go-id";

// Daftar semua sumber yang tersedia. Tambahkan adapter baru di sini.
// Sumber aktif:
//  - peraturan.go.id      : scrape HTML peraturan daerah
//  - jdihn (Kemenkeu)     : API JSON terpaginas (anggota JDIHN)
//  - jdihn-kemenkum       : feed/document.json lengkap + URL PDF (anggota JDIHN)

export function getAllAdapters(): SourceAdapter[] {
  return [peraturanGoIdAdapter, jdihnAdapter, jdihnKemenkumAdapter];
}

export function getAdapter(id: string): SourceAdapter | undefined {
  return getAllAdapters().find((a) => a.id === id);
}
