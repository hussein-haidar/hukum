import { SourceAdapter } from "./types";
import { jdihnAdapter } from "./adapters/jdihn";
import { perpusnasAdapter } from "./adapters/perpusnas";
import { peraturanGoIdAdapter } from "./adapters/peraturan-go-id";

// Daftar semua sumber yang tersedia. Tambahkan adapter baru di sini.
export function getAllAdapters(): SourceAdapter[] {
  return [peraturanGoIdAdapter, jdihnAdapter, perpusnasAdapter];
}

export function getAdapter(id: string): SourceAdapter | undefined {
  return getAllAdapters().find((a) => a.id === id);
}
