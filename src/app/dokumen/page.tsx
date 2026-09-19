"use client";

import { useState, useEffect } from "react";

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
  const [documents, setDocuments] = useState<Dokumen[]>([]);
  const [jenisList, setJenisList] = useState<string[]>([]);
  const [meta, setMeta] = useState<Meta>({ total: 0, page: 1, totalPages: 1 });
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [jenis, setJenis] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
          setJenisList(
            (data.jenisList as JenisCount[]).map((j) => j.jenis).filter((j) => j.trim() !== "")
          );
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

  const selectJenis = (j: string) => {
    setJenis(j);
    setMeta((m) => ({ ...m, page: 1 }));
  };

  const statusBadge = (status: string) => {
    const label = status === "berlaku" ? "Berlaku" : status === "dicabut" ? "Dicabut" : status;
    const cls =
      status === "berlaku"
        ? "bg-green-100 text-green-700"
        : status === "dicabut"
        ? "bg-red-100 text-red-700"
        : "bg-gray-100 text-gray-700";
    return <span className={`badge ${cls}`}>{label}</span>;
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Peraturan &amp; Dokumen Hukum</h1>
      <p className="text-gray-600 mb-8">
        Kumpulan peraturan perundang-undangan Indonesia yang disinkronkan dari sumber resmi (Peraturan.go.id, JDIH).
      </p>

      <div className="flex gap-2 mb-6">
        <input
          type="text"
          placeholder="Cari judul, tentang, atau nomor peraturan..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="input-field"
        />
        <button onClick={handleSearch} className="btn-primary flex-shrink-0">
          Cari
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        <button
          onClick={() => selectJenis("")}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            jenis === "" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Semua
        </button>
        {jenisList.map((j) => (
          <button
            key={j}
            onClick={() => selectJenis(j)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              jenis === j ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {j}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Memuat data...</p>
        </div>
      ) : error ? (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center max-w-2xl mx-auto">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold mb-2">Data Peraturan Belum Tersedia</h2>
          <p className="text-gray-600 mb-6">
            {error}
          </p>
          <div className="text-gray-500 text-sm space-y-2">
            <p>Database peraturan belum diisi. Data dapat disinkronkan dari sumber resmi seperti Peraturan.go.id dan JDIH melalui panel admin.</p>
          </div>
          <button
            onClick={() => setMeta((m) => ({ ...m, page: 1 }))}
            className="mt-6 bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      ) : documents.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center max-w-2xl mx-auto">
          <div className="text-5xl mb-4">📭</div>
          <h2 className="text-xl font-bold mb-2">Belum Ada Peraturan</h2>
          <p className="text-gray-600">
            {search || jenis
              ? "Tidak ada peraturan yang cocok dengan pencarian Anda. Coba kata kunci lain."
              : "Database peraturan masih kosong. Jalankan Data Sync melalui panel admin untuk mengambil peraturan dari sumber resmi."}
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-4">
            Menampilkan {documents.length} dari {meta.total} dokumen
          </p>
          <div className="space-y-3">
            {documents.map((doc) => (
              <div key={doc.id} className="card">
                <div className="flex flex-wrap gap-2 mb-2">
                  <span className="badge bg-blue-100 text-blue-700">
                    {doc.jenis} No. {doc.nomor}/{doc.tahun}
                  </span>
                  {statusBadge(doc.status)}
                  {doc.instansi && (
                    <span className="badge bg-purple-100 text-purple-700">{doc.instansi}</span>
                  )}
                </div>
                <h3 className="font-semibold text-lg text-gray-800">{doc.judul}</h3>
                {doc.tentang && (
                  <p className="text-gray-600 mt-1">{doc.tentang}</p>
                )}
                <div className="flex flex-wrap gap-4 mt-3 text-sm">
                  {doc.urlPdf && /^https?:\/\//i.test(doc.urlPdf) && (
                    <a
                      href={doc.urlPdf}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline font-medium"
                    >
                      📄 Baca PDF
                    </a>
                  )}
                  {doc.urlSumber && /^https?:\/\//i.test(doc.urlSumber) && (
                    <a
                      href={doc.urlSumber}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-600 hover:underline"
                    >
                      🔗 Sumber
                    </a>
                  )}
                  <span className="text-gray-400">Sumber: {doc.source}</span>
                </div>
              </div>
            ))}
          </div>

          {meta.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <button
                onClick={() => setMeta((m) => ({ ...m, page: Math.max(1, m.page - 1) }))}
                disabled={meta.page <= 1}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Sebelumnya
              </button>
              <span className="px-4 py-2 text-sm text-gray-600">
                Halaman {meta.page} / {meta.totalPages}
              </span>
              <button
                onClick={() => setMeta((m) => ({ ...m, page: Math.min(m.totalPages, m.page + 1) }))}
                disabled={meta.page >= meta.totalPages}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Berikutnya
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
