import { SourceAdapter } from "./types";
import { jdihnAdapter } from "./adapters/jdihn";
import { jdihnKemenkumAdapter } from "./adapters/jdihn-kemenkum";
import { peraturanGoIdAdapter } from "./adapters/peraturan-go-id";
import { lppomMuiAdapter, muiAdapter, jpiAdapter, hukumIslamAdapter } from "./adapters/hukum-islam";
import { unTreatyAdapter, hukumOnlineIntlAdapter, ohchrAdapter, hukumInternasionalAdapter, unDocumentsAdapter } from "./adapters/hukum-internasional";

// Daftar semua sumber yang tersedia. Tambahkan adapter baru di sini.
// Sumber aktif:
// Hukum Indonesia:
//  - peraturan.go.id      : scrape HTML peraturan daerah
//  - jdihn (Kemenkeu)     : API JSON terpaginas (anggota JDIHN)
//  - jdihn-kemenkum       : feed/document.json lengkap + URL PDF (anggota JDIHN)
// Hukum Islam:
//  - lppom-mui            : LPPOM MUI (halalmui.org) - WP REST API WORKING ✅
//  - mui                  : MUI Pusat - Cloudflare blocked (placeholder)
//  - jpi                  : JPI - bukan hukum Islam (placeholder)
//  - hukum-islam          : Gabungan hukum Islam
// Hukum Internasional:
//  - ohchr                : OHCHR UHRI API (working - JSON API)
//  - un-documents         : UN Documents via undocs.org (HTML scraping by symbol)
//  - un-treaty            : UN Treaty Collection (placeholder - complex ASP.NET)
//  - hukumonline-intl     : HukumOnline kategori Internasional (placeholder)
//  - hukum-internasional  : Gabungan hukum internasional

export function getAllAdapters(): SourceAdapter[] {
  return [
    // Hukum Indonesia (aktif)
    peraturanGoIdAdapter,
    jdihnAdapter,
    jdihnKemenkumAdapter,
    // Hukum Islam
    lppomMuiAdapter,        // Working - LPPOM MUI WP REST API
    muiAdapter,             // Placeholder (blocked)
    jpiAdapter,             // Placeholder (non-hukum)
    hukumIslamAdapter,
    // Hukum Internasional
    ohchrAdapter,           // Working - OHCHR UHRI JSON API
    unDocumentsAdapter,     // Working - UN Documents via symbol patterns
    unTreatyAdapter,        // Placeholder
    hukumOnlineIntlAdapter, // Placeholder
    hukumInternasionalAdapter,
  ];
}

export function getAdapter(id: string): SourceAdapter | undefined {
  return getAllAdapters().find((a) => a.id === id);
}
