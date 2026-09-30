"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PdfReader from "@/components/PdfReader";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { sanitizeText } from "@/lib/sanitize";

interface Dokumen {
  id: number;
  source: string;
  jenis: string;
  nomor: string;
  tahun: string;
  judul: string;
  tentang: string | null;
  status: string;
  tanggal: string | null;
  urlSumber: string | null;
  urlPdf: string | null;
  instansi: string | null;
}

interface Meta {
  total: number;
  page: number;
  totalPages: number;
}

interface JenisCount {
  jenis: string;
  _count: { id: number };
}

export default function DokumenPage() {
  const { t } = useI18n();
  const router = useRouter();
  const { user } = useAuth();
  const CAT_WINDOW = 8;
  const CAT_INTERVAL_MS = 4000;

  const [documents, setDocuments] = useState<Dokumen[]>([]);
  const [jenisList, setJenisList] = useState<string[]>([]);
  const [catStart, setCatStart] = useState(0);
  const [meta, setMeta] = useState<Meta>({ total: 0, page: 1, totalPages: 1 });
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [jenis, setJenis] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [readerDoc, setReaderDoc] = useState<Dokumen | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (jenis) params.set("jenis", jenis);
    params.set("page", String(meta.page));

    setLoading(true);
    setError("");

    fetch(`/api/dokumen?${params.toString()}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        if (controller.signal.aborted) return;
        if (data.success) {
          setDocuments(data.data);
          setMeta(data.meta);
          const nextJenisList = (data.jenisList as JenisCount[])
            .map((j) => j.jenis)
            .filter((j) => j.trim() !== "");
          setJenisList(nextJenisList);
          // Jika kategori yang terpilih tidak lagi tersedia untuk kata kunci ini
          // (mis. chip lama diklik saat jeda debounce), batalkan pilihannya agar
          // tidak menghasilkan kombinasi kosong yang membingungkan.
          if (jenis && !nextJenisList.includes(jenis)) setJenis("");
        } else {
          setError(data.message || "Gagal memuat data");
        }
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setError("Terjadi kesalahan saat memuat data. Peraturan mungkin belum disinkronkan.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
        clearTimeout(timeout);
      });

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [meta.page, search, jenis]);

  const handleSearch = () => {
    setMeta((m) => ({ ...m, page: 1 }));
    setSearch(searchInput);
  };

  // Live search-as-you-type: teks yang diketik otomatis dijadikan filter
  // setelah berhenti mengetik sebentar (debounce). Sekaligus memperbaiki bug
  // "bukan klik cari lalu pilih kategori jadi kosong" karena teks di kotak kini
  // selalu sinkron dengan state `search` (tidak ada sisa pencarian lama).
  useEffect(() => {
    if (searchInput === search) return;
    const t = setTimeout(() => {
      setSearch(searchInput);
      setMeta((m) => ({ ...m, page: 1 }));
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput, search]);

  const handleRefresh = () => {
    setSearchInput("");
    setSearch("");
    setJenis("");
    setMeta((m) => ({ ...m, page: 1 }));
  };

  const selectJenis = (j: string) => {
    // Klik sekali = pilih, klik lagi = batalkan pilih (toggle)
    setJenis(j === jenis ? "" : j);
    // Komit teks yang sedang diketik supaya hasil selalu konsisten dengan filter.
    if (searchInput !== search) setSearch(searchInput);
    setMeta((m) => ({ ...m, page: 1 }));
  };

  // Jaga posisi window tetap valid saat daftar kategori berubah.
  useEffect(() => {
    if (jenisList.length <= CAT_WINDOW) setCatStart(0);
  }, [jenisList.length, CAT_WINDOW]);

  // Saat user memilih kategori, kunci window supaya pilihan tetap terlihat.
  useEffect(() => {
    if (jenis === "") return;
    const idx = jenisList.indexOf(jenis);
    if (idx === -1) return;
    setCatStart(idx);
  }, [jenis, jenisList]);

  // Rotasi otomatis window kategori (berhenti saat ada kategori yang dipilih).
  useEffect(() => {
    if (jenis !== "" || jenisList.length <= CAT_WINDOW) return;
    const t = setInterval(() => {
      setCatStart((s) => (s + CAT_WINDOW) % jenisList.length);
    }, CAT_INTERVAL_MS);
    // Reset urutan begitu daftar berganti supaya mulai dari awal lagi.
    setCatStart(0);
    return () => clearInterval(t);
  }, [jenis, jenisList, CAT_WINDOW, CAT_INTERVAL_MS]);

  const visibleJenis = Array.from(
    { length: Math.min(CAT_WINDOW, jenisList.length) },
    (_, i) => jenisList[(catStart + i) % jenisList.length]
  );

  const statusBadge = (status: string) => {
    const label =
      status === "berlaku"
        ? t("dokumen.status.berlaku")
        : status === "dicabut"
        ? t("dokumen.status.dicabut")
        : status;
    const cls =
      status === "berlaku"
        ? "bg-green-100 text-green-700 dark:bg-gray-700 dark:text-green-300"
        : status === "dicabut"
        ? "bg-red-100 text-red-700 dark:bg-gray-700 dark:text-red-300"
        : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300";
    return <span className={`badge ${cls}`}>{label}</span>;
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2 dark:text-gray-100">{t("dokumen.title")}</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        {t("dokumen.subtitle")}
      </p>

      <div className="flex gap-2 mb-3">
        <input
          type="text"
          placeholder={t("dokumen.searchPlaceholder")}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="input-field"
        />
        <button onClick={handleSearch} className="btn-primary flex-shrink-0">
          {t("dokumen.search")}
        </button>
        <button
          onClick={handleRefresh}
          className="btn-secondary flex-shrink-0"
          title={t("dokumen.reset")}
        >
          ⟳
        </button>
      </div>

      {/* Petunjuk pencarian hukum */}
      <details className="mb-4 group">
        <summary className="cursor-pointer text-sm text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100 flex items-center gap-1.5 select-none list-none p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
          <span className="text-base">💡</span>
          <span className="font-medium">Petunjuk pencarian hukum</span>
          <span className="inline-block ml-auto transition-transform group-open:rotate-90 text-gray-500 dark:text-gray-400">▸</span>
        </summary>
        <div className="mt-2 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800 text-sm text-gray-700 dark:text-gray-300 space-y-3">
          <div>
            <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">🕌 Hukum Islam (KHI, Fatwa MUI):</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2 text-xs">
              <div className="bg-white dark:bg-gray-800 p-2 rounded-lg border border-blue-100 dark:border-blue-800">
                <span className="font-medium text-gray-900 dark:text-gray-100">cerai islam</span>
                <span className="text-gray-600 dark:text-gray-400 ml-1">→ perceraian, talak</span>
              </div>
              <div className="bg-white dark:bg-gray-800 p-2 rounded-lg border border-blue-100 dark:border-blue-800">
                <span className="font-medium text-gray-900 dark:text-gray-100">talak islam</span>
                <span className="text-gray-600 dark:text-gray-400 ml-1">→ talak, perceraian, khulu'</span>
              </div>
              <div className="bg-white dark:bg-gray-800 p-2 rounded-lg border border-blue-100 dark:border-blue-800">
                <span className="font-medium text-gray-900 dark:text-gray-100">nikah islam</span>
                <span className="text-gray-600 dark:text-gray-400 ml-1">→ nikah, pernikahan, kawin</span>
              </div>
              <div className="bg-white dark:bg-gray-800 p-2 rounded-lg border border-blue-100 dark:border-blue-800">
                <span className="font-medium text-gray-900 dark:text-gray-100">waris islam</span>
                <span className="text-gray-600 dark:text-gray-400 ml-1">→ waris, khi, faraidh</span>
              </div>
              <div className="bg-white dark:bg-gray-800 p-2 rounded-lg border border-blue-100 dark:border-blue-800">
                <span className="font-medium text-gray-900 dark:text-gray-100">nafkah mantan istri</span>
                <span className="text-gray-600 dark:text-gray-400 ml-1">→ nafkah iddah, mut'ah</span>
              </div>
              <div className="bg-white dark:bg-gray-800 p-2 rounded-lg border border-blue-100 dark:border-blue-800">
                <span className="font-medium text-gray-900 dark:text-gray-100">hak asuh anak</span>
                <span className="text-gray-600 dark:text-gray-400 ml-1">→ hak asuh anak, khadhanah</span>
              </div>
            </div>
          </div>
          <div>
            <p className="font-medium text-green-900 dark:text-green-100 mb-1">🌍 Hukum Internasional (PBB, OHCHR, Konvensi):</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2 text-xs">
              <div className="bg-white dark:bg-gray-800 p-2 rounded-lg border border-green-100 dark:border-green-800">
                <span className="font-medium text-gray-900 dark:text-gray-100">hukum internasional</span>
                <span className="text-gray-600 dark:text-gray-400 ml-1">→ international law, pbb</span>
              </div>
              <div className="bg-white dark:bg-gray-800 p-2 rounded-lg border border-green-100 dark:border-green-800">
                <span className="font-medium text-gray-900 dark:text-gray-100">konvensi</span>
                <span className="text-gray-600 dark:text-gray-400 ml-1">→ convention, treaty, perjanjian</span>
              </div>
              <div className="bg-white dark:bg-gray-800 p-2 rounded-lg border border-green-100 dark:border-green-800">
                <span className="font-medium text-gray-900 dark:text-gray-100">hak asasi manusia</span>
                <span className="text-gray-600 dark:text-gray-400 ml-1">→ human rights, ohchr, ham internasional</span>
              </div>
              <div className="bg-white dark:bg-gray-800 p-2 rounded-lg border border-green-100 dark:border-green-800">
                <span className="font-medium text-gray-900 dark:text-gray-100">hukum laut</span>
                <span className="text-gray-600 dark:text-gray-400 ml-1">→ unclos, law of the sea</span>
              </div>
              <div className="bg-white dark:bg-gray-800 p-2 rounded-lg border border-green-100 dark:border-green-800">
                <span className="font-medium text-gray-900 dark:text-gray-100">perdagangan internasional</span>
                <span className="text-gray-600 dark:text-gray-400 ml-1">→ wto, international trade</span>
              </div>
              <div className="bg-white dark:bg-gray-800 p-2 rounded-lg border border-green-100 dark:border-green-800">
                <span className="font-medium text-gray-900 dark:text-gray-100">hukum pidana internasional</span>
                <span className="text-gray-600 dark:text-gray-400 ml-1">→ icc, war crimes, genosida</span>
              </div>
            </div>
          </div>
          <div>
            <p className="font-medium text-amber-900 dark:text-amber-100 mb-1">🇮🇩 Hukum Indonesia (UU, KUHP, Peraturan):</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2 text-xs">
              <div className="bg-white dark:bg-gray-800 p-2 rounded-lg border border-amber-100 dark:border-amber-800">
                <span className="font-medium text-gray-900 dark:text-gray-100">hukum indonesia</span>
                <span className="text-gray-600 dark:text-gray-400 ml-1">→ uu, kuhp, kuhap, kuhperdata</span>
              </div>
              <div className="bg-white dark:bg-gray-800 p-2 rounded-lg border border-amber-100 dark:border-amber-800">
                <span className="font-medium text-gray-900 dark:text-gray-100">pidana / perdata</span>
                <span className="text-gray-600 dark:text-gray-400 ml-1">→ kuhp, kuhper, kuhap, gugatan</span>
              </div>
              <div className="bg-white dark:bg-gray-800 p-2 rounded-lg border border-amber-100 dark:border-amber-800">
                <span className="font-medium text-gray-900 dark:text-gray-100">ham indonesia</span>
                <span className="text-gray-600 dark:text-gray-400 ml-1">→ uu ham, komnas ham, mk</span>
              </div>
              <div className="bg-white dark:bg-gray-800 p-2 rounded-lg border border-amber-100 dark:border-amber-800">
                <span className="font-medium text-gray-900 dark:text-gray-100">tenaga kerja</span>
                <span className="text-gray-600 dark:text-gray-400 ml-1">→ phk, pesangon, serikat pekerja</span>
              </div>
              <div className="bg-white dark:bg-gray-800 p-2 rounded-lg border border-amber-100 dark:border-amber-800">
                <span className="font-medium text-gray-900 dark:text-gray-100">agrarria / tanah</span>
                <span className="text-gray-600 dark:text-gray-400 ml-1">→ hak atas tanah, sertifikat, bptn</span>
              </div>
              <div className="bg-white dark:bg-gray-800 p-2 rounded-lg border border-amber-100 dark:border-amber-800">
                <span className="font-medium text-gray-900 dark:text-gray-100">hki / kekayaan intelektual</span>
                <span className="text-gray-600 dark:text-gray-400 ml-1">→ paten, merk, hak cipta</span>
              </div>
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-xs mt-2">Ketik bebas, sistem akan memperluas ke istilah hukum yang sesuai.</p>
        </div>
      </details>

      <div
        className="flex flex-wrap gap-2 mb-8"
        title="Kategori bergulir otomatis setiap beberapa detik"
      >
        <button
          onClick={() => selectJenis("")}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            jenis === "" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
          }`}
        >
          {t("dokumen.all")}
        </button>
        {visibleJenis.map((j) => (
          <button
            key={j}
            onClick={() => selectJenis(j)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              jenis === j ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            {j}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto dark:border-blue-400"></div>
          <p className="mt-4 text-gray-500 dark:text-gray-400">{t("dokumen.loading")}</p>
        </div>
      ) : error ? (
        <div className="bg-amber-50 dark:bg-gray-800 border border-amber-200 dark:border-gray-700 rounded-2xl p-8 text-center max-w-2xl mx-auto">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold mb-2 dark:text-gray-100">{t("dokumen.emptyTitle")}</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error}
          </p>
          <div className="text-gray-500 dark:text-gray-400 text-sm space-y-2">
            <p>{t("dokumen.emptyText")}</p>
          </div>
          <button
            onClick={() => setMeta((m) => ({ ...m, page: 1 }))}
            className="mt-6 bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            {t("dokumen.retry")}
          </button>
        </div>
      ) : documents.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-8 text-center max-w-2xl mx-auto">
          <div className="text-5xl mb-4">📭</div>
          <h2 className="text-xl font-bold mb-2 dark:text-gray-100">{t("dokumen.noResult")}</h2>
          <p className="text-gray-600 dark:text-gray-400">
            {search && jenis
              ? t("dokumen.noSearchInCat").replace("%1", search).replace("%2", jenis)
              : search
              ? t("dokumen.noResultSearch").replace("%1", search)
              : jenis
              ? t("dokumen.noResultCat").replace("%1", jenis)
              : t("dokumen.emptyText")}
          </p>
          {(search || jenis) && (
            <button onClick={handleRefresh} className="mt-6 btn-secondary">
              {t("dokumen.reset")}
            </button>
          )}
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {t("dokumen.showing").replace("%1", String(documents.length)).replace("%2", String(meta.total))}
          </p>
          <div className="space-y-3">
            {documents.map((doc) => (
              <div key={doc.id} className="card">
                <div className="flex flex-wrap gap-2 mb-2">
                  <span className="badge bg-blue-100 text-blue-700 dark:bg-gray-700 dark:text-blue-300">
                    {doc.jenis} No. {doc.nomor}/{doc.tahun}
                  </span>
                  {statusBadge(doc.status)}
                  {doc.instansi && (
                    <span className="badge bg-purple-100 text-purple-700 dark:bg-gray-700 dark:text-purple-300">{doc.instansi}</span>
                  )}
                </div>
                <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-100">{sanitizeText(doc.judul)}</h3>
                {doc.tentang && (
                  <p className="text-gray-600 dark:text-gray-400 mt-1">{sanitizeText(doc.tentang)}</p>
                )}
                <div className="flex flex-col sm:flex-row gap-2 mt-3 text-sm">
                  {doc.urlPdf && /^https?:\/\//i.test(doc.urlPdf) ? (
                    <button
                      onClick={() =>
                        user
                          ? setReaderDoc(doc)
                          : router.push("/login?next=/dokumen")
                      }
                      className="btn-primary !py-2 !px-4 text-sm whitespace-nowrap"
                    >
                      {t("dokumen.readPdf")}
                    </button>
                  ) : (
                    <span className="text-xs text-gray-500 dark:text-gray-400 self-center sm:self-auto px-2">
                      PDF tidak tersedia
                    </span>
                  )}
                  {doc.urlSumber && /^https?:\/\//i.test(doc.urlSumber) && (
                    <a
                      href={doc.urlSumber}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary !py-2 !px-4 text-sm whitespace-nowrap"
                    >
                      {t("dokumen.source")}
                    </a>
                  )}
                  <span className="text-gray-400 dark:text-gray-500 self-center sm:self-auto px-2">{t("dokumen.sourceLabel").replace("%1", doc.source)}</span>
                </div>
              </div>
            ))}
          </div>

          {meta.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <button
                onClick={() => setMeta((m) => ({ ...m, page: Math.max(1, m.page - 1) }))}
                disabled={meta.page <= 1}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-40 disabled:cursor-not-allowed dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              >
                {t("dokumen.prev")}
              </button>
              <span className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                {t("dokumen.page").replace("%1", String(meta.page)).replace("%2", String(meta.totalPages))}
              </span>
              <button
                onClick={() => setMeta((m) => ({ ...m, page: Math.min(m.totalPages, m.page + 1) }))}
                disabled={meta.page >= meta.totalPages}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-40 disabled:cursor-not-allowed dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              >
                {t("dokumen.next")}
              </button>
            </div>
          )}
        </>
      )}
      {readerDoc && (
        <PdfReader
          docId={readerDoc.id}
          title={readerDoc.judul}
          sumberUrl={readerDoc.urlSumber}
          onClose={() => setReaderDoc(null)}
        />
      )}
    </div>
  );
}
