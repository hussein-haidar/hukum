import { SourceAdapter } from "./types";
import { jdihnAdapter } from "./adapters/jdihn";
import { jdihnKemenkumAdapter } from "./adapters/jdihn-kemenkum";
import { peraturanGoIdAdapter } from "./adapters/peraturan-go-id";
import { lppomMuiAdapter, muiAdapter, jpiAdapter, hukumIslamAdapter } from "./adapters/hukum-islam";
import { fatwaMuiAdapter } from "./adapters/fatwa-mui";
import { unTreatyAdapter, hukumOnlineIntlAdapter, ohchrAdapter, hukumInternasionalAdapter, unDocumentsAdapter } from "./adapters/hukum-internasional";

// Daftar semua sumber yang tersedia. Tambahkan adapter baru di sini.
// Sumber aktif:
// Hukum Indonesia:
//  - peraturan.go.id      : scrape HTML peraturan daerah
//  - jdihn (Kemenkeu)     : API JSON terpaginas (anggota JDIHN)
//  - jdihn-kemenkum       : feed/document.json lengkap + URL PDF (anggota JDIHN)
// Hukum Islam:
//  - lppom-mui            : LPPOM MUI (halalmui.org) - WP REST API WORKING ✅
//  - mui                  : MUI Pusat - delegasi ke LPPOM MUI (fatwa.mui.or.id Cloudflare blocked)
//  - jpi                  : JPI (jpi.or.id) - WP REST API WORKING ✅
//  - fatwa-mui            : Fatwa MUI (fatwamui.com) - database fatwa lengkap + PDF WORKING ✅
//  - hukum-islam          : Gabungan hukum Islam
// Hukum Internasional:
//  - ohchr                : OHCHR UHRI API (JSON API) WORKING ✅
//  - un-documents         : UN Documents via undocs.org (HTML scraping by symbol) WORKING ✅
//  - un-treaty            : UN Treaty Collection (scraping bab 1-27) WORKING ✅
//  - hukumonline-intl     : HukumOnline berita (saring kata kunci internasional) WORKING ✅
//  - hukum-internasional  : Gabungan hukum internasional

export function getAllAdapters(): SourceAdapter[] {
  return [
    // Hukum Indonesia (aktif)
    peraturanGoIdAdapter,
    jdihnAdapter,
    jdihnKemenkumAdapter,
    // Hukum Islam
    lppomMuiAdapter,        // Working - LPPOM MUI WP REST API
    muiAdapter,             // Working - delegasi ke LPPOM MUI
    jpiAdapter,             // Working - JPI WP REST API
    fatwaMuiAdapter,        // Fatwa MUI (fatwamui.com) - scrape database fatwa lengkap
    hukumIslamAdapter,      // Gabungan lppom-mui + jpi
    // Hukum Internasional
    ohchrAdapter,           // Working - OHCHR UHRI JSON API
    unDocumentsAdapter,     // Working - UN Documents via symbol patterns
    unTreatyAdapter,        // Working - UN Treaty Collection chapter scraper
    hukumOnlineIntlAdapter, // Working - HukumOnline berita scraper
    hukumInternasionalAdapter, // Gabungan ohchr + un-documents
  ];
}

export function getAdapter(id: string): SourceAdapter | undefined {
  return getAllAdapters().find((a) => a.id === id);
}
