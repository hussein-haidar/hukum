"use client";

import { useState, useEffect } from "react";

interface SyncStatus {
  totalDocuments: number;
  sourceStats: Record<string, number>;
  jenisStats: Record<string, number>;
  recentLogs: any[];
  lastSync: any;
  isSyncing: boolean;
}

interface SyncResult {
  source: string;
  status: string;
  documentsNew: number;
  documentsUpdated: number;
  documentsFailed: number;
  duration: number;
  message?: string;
}

export default function AdminSyncPage() {
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
const [selectedSource, setSelectedSource] = useState("all");
  const [syncResults, setSyncResults] = useState<SyncResult[]>([]);
  const [globalMessage, setGlobalMessage] = useState("");
  const [failedSources, setFailedSources] = useState<Set<string>>(new Set());

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/admin/sync");
      const data = await res.json();
      if (data.success) {
        setStatus(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch sync status:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const sourceLabels: Record<string, string> = {};

  const getAvailableSources = () => [];

  const handleSync = async () => {
    setSyncing(true);
    setSyncResults([]);
    setGlobalMessage("Sinkronisasi sedang berjalan...");
    setFailedSources(new Set());

    try {
      const res = await fetch("/api/admin/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: selectedSource }),
      });
      const data = await res.json();

      if (data.success) {
        const results: SyncResult[] = data.data;
        setSyncResults(results);

        // Track failed sources to hide from dropdown
        const failed = results.filter(r => r.status === "failed").map(r => r.source);
        setFailedSources(new Set(failed));

        const totalNew = results.reduce((sum, r) => sum + r.documentsNew, 0);
        const totalFailed = results.reduce((sum, r) => sum + r.documentsFailed, 0);

        if (totalNew > 0) {
          setGlobalMessage(`Berhasil! ${totalNew} dokumen baru ditambahkan.`);
        } else if (totalFailed > 0) {
          const failedSourcesNames = failed.map(s => {
            if (s === "peraturan.go.id") return "PERATURAN.GO.ID";
            if (s === "jdihn") return "JDIHN";
            if (s === "perpusnas") return "PERPUSNAS";
            return s.toUpperCase();
          });
          setGlobalMessage(`Gagal mengambil data dari: ${failedSourcesNames.join(", ")}. Lihat detail di bawah.`);
        } else {
          setGlobalMessage("Sinkronisasi selesai.");
        }
        fetchStatus();
      } else {
        setGlobalMessage("Gagal menjalankan sinkronisasi");
      }
    } catch (err) {
      setGlobalMessage("Error: " + (err instanceof Error ? err.message : "Unknown"));
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Memuat data...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        Data Synchronization
      </h1>

      {globalMessage && (
        <div className={`p-4 rounded-lg mb-6 ${
          globalMessage.includes("Berhasil")
            ? "bg-green-100 text-green-800"
            : globalMessage.includes("berjalan")
            ? "bg-blue-100 text-blue-800"
            : globalMessage.includes("Gagal") || globalMessage.includes("Error")
            ? "bg-red-100 text-red-800"
            : "bg-gray-100 text-gray-800"
        }`}>
          {globalMessage}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            Total Dokumen
          </h2>
          <p className="text-4xl font-bold text-blue-600">
            {status?.totalDocuments || 0}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            Sinkronisasi Terakhir
          </h2>
          {status?.lastSync ? (
            <div>
              <p className="text-sm text-gray-600">
                {status.lastSync.source.toUpperCase()} -{" "}
                {status.lastSync.status === "success" ? "Berhasil" : "Gagal"}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(status.lastSync.startedAt).toLocaleString("id-ID")}
              </p>
            </div>
          ) : (
            <p className="text-gray-500">Belum pernah sync</p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">
          Jalankan Sinkronisasi
        </h2>

        <div className="flex flex-wrap gap-4 items-center">
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {getAvailableSources().map((src) => (
                <option key={src} value={src}>
                  {src === "sample"
                    ? "Sample Data (20 UU/PP/Perpres/Permen)"
                    : sourceLabels[src]}
                </option>
              ))}
            </select>

          <button
            onClick={handleSync}
            disabled={syncing}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              syncing
                ? "bg-gray-400 text-white cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {syncing ? "Syncing..." : "Mulai Sync"}
          </button>
        </div>

          {selectedSource === "all" && (
            <p className="mt-3 text-sm text-gray-500">
              Catatan: Sinkronisasi menjalankan seluruh sumber (peraturan.go.id, JDIHN, Perpusnas) melalui pipeline staging → validasi → normalisasi → deduplikasi. Sumber yang tidak berubah (hash sama) akan dilewati otomatis. Untuk jadwal otomatis 02:00, gunakan scheduler eksternal ke <code>/api/cron/sync?secret=CRON_SECRET</code>.
            </p>
          )}
      </div>

      {syncResults.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            Hasil Sinkronisasi
          </h2>
          <div className="space-y-3">
            {syncResults.map((result) => (
              <div
                key={result.source}
                className={`p-4 rounded-lg border ${
                  result.status === "success"
                    ? "bg-green-50 border-green-200"
                    : result.status === "partial"
                    ? "bg-yellow-50 border-yellow-200"
                    : "bg-red-50 border-red-200"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-800">
                    {result.source.toUpperCase()}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    result.status === "success"
                      ? "bg-green-200 text-green-800"
                      : result.status === "partial"
                      ? "bg-yellow-200 text-yellow-800"
                      : "bg-red-200 text-red-800"
                  }`}>
                    {result.status === "success" ? "Berhasil" : result.status === "partial" ? "Sebagian" : "Gagal"}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Baru:</span>{" "}
                    <span className="font-medium text-green-700">{result.documentsNew}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Update:</span>{" "}
                    <span className="font-medium text-blue-700">{result.documentsUpdated}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Gagal:</span>{" "}
                    <span className="font-medium text-red-700">{result.documentsFailed}</span>
                  </div>
                </div>
                {result.message && (
                  <p className={`mt-2 text-sm ${
                    result.status === "success" ? "text-green-700" : "text-red-700"
                  }`}>
                    {result.message}
                  </p>
                )}
                {result.duration > 0 && (
                  <p className="mt-1 text-xs text-gray-500">
                    Waktu: {(result.duration / 1000).toFixed(1)} detik
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {status?.sourceStats && Object.keys(status.sourceStats).length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            Dokumen per Sumber
          </h2>
          <div className="space-y-2">
            {Object.entries(status.sourceStats).map(([source, count]) => (
              <div key={source} className="flex justify-between items-center">
                <span className="text-gray-700">{source.toUpperCase()}</span>
                <span className="font-medium text-blue-600">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {status?.jenisStats && Object.keys(status.jenisStats).length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            Dokumen per Jenis
          </h2>
          <div className="space-y-2">
            {Object.entries(status.jenisStats)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 10)
              .map(([jenis, count]) => (
                <div key={jenis} className="flex justify-between items-center">
                  <span className="text-gray-700">{jenis}</span>
                  <span className="font-medium text-blue-600">{count}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {status?.recentLogs && status.recentLogs.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            Riwayat Sinkronisasi
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Sumber</th>
                  <th className="text-left py-2">Status</th>
                  <th className="text-right py-2">Baru</th>
                  <th className="text-right py-2">Update</th>
                  <th className="text-right py-2">Gagal</th>
                  <th className="text-right py-2">Waktu</th>
                  <th className="text-left py-2 pl-4">Pesan</th>
                </tr>
              </thead>
              <tbody>
                {status.recentLogs.map((log) => (
                  <tr key={log.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 font-medium">{log.source.toUpperCase()}</td>
                    <td className="py-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        log.status === "success"
                          ? "bg-green-100 text-green-800"
                          : log.status === "partial"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}>
                        {log.status === "success" ? "Berhasil" : log.status === "partial" ? "Sebagian" : "Gagal"}
                      </span>
                    </td>
                    <td className="py-2 text-right">{log.documentsNew}</td>
                    <td className="py-2 text-right">{log.documentsUpdated}</td>
                    <td className="py-2 text-right">{log.documentsFailed}</td>
                    <td className="py-2 text-right text-gray-500">
                      {log.duration ? `${(log.duration / 1000).toFixed(1)}s` : "-"}
                    </td>
                    <td className="py-2 pl-4 text-xs text-gray-600 max-w-xs truncate">
                      {log.message || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
