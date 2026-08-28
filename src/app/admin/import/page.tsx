"use client";

import { useState, useRef } from "react";

interface ImportResult {
  total: number;
  imported: number;
  updated: number;
  failed: number;
  errors: string[];
}

export default function AdminImportPage() {
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setImporting(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        setResult(data.data);
      } else {
        setResult({
          total: 0,
          imported: 0,
          updated: 0,
          failed: 1,
          errors: [data.message],
        });
      }
    } catch (err) {
      setResult({
        total: 0,
        imported: 0,
        updated: 0,
        failed: 1,
        errors: [err instanceof Error ? err.message : "Upload failed"],
      });
    } finally {
      setImporting(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const sampleJSON = `[
  {
    "jenis": "UU",
    "nomor": "1",
    "tahun": "2023",
    "judul": "Kitab Undang-Undang Hukum Pidana",
    "tentang": "Kitab Undang-Undang Hukum Pidana",
    "status": "berlaku",
    "instansi": "DPR RI"
  },
  {
    "jenis": "PP",
    "nomor": "27",
    "tahun": "2022",
    "judul": "PP tentang Pengelolaan Limbah B3",
    "tentang": "Pengelolaan Limbah B3",
    "status": "berlaku",
    "instansi": "Kementerian LHK"
  }
]`;

  const sampleCSV = `jenis,nomor,tahun,judul,tentang,status,instansi
UU,1,2023,Kitab Undang-Undang Hukum Pidana,Kitab Undang-Undang Hukum Pidana,berlaku,DPR RI
PP,27,2022,PP tentang Pengelolaan Limbah B3,Pengelolaan Limbah B3,berlaku,Kementerian LHK
Perpres,1,2024,Perpres tentang Stranas PK,Stranas PK,berlaku,Kementerian Sekretariat Negara`;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        Import Data Hukum
      </h1>

      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          dragActive
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-gray-400"
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {importing ? (
          <div>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Mengimport data...</p>
          </div>
        ) : (
          <>
            <div className="text-4xl mb-4">📁</div>
            <p className="text-gray-600 mb-4">
              Drag & drop file <strong>JSON</strong> atau <strong>CSV</strong> di sini
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Pilih File
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
          </>
        )}
      </div>

      {result && (
        <div className={`mt-6 p-6 rounded-xl ${
          result.failed > 0 && result.imported === 0
            ? "bg-red-50 border border-red-200"
            : "bg-green-50 border border-green-200"
        }`}>
          <h2 className="text-lg font-semibold mb-4">Hasil Import</h2>
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800">{result.total}</div>
              <div className="text-sm text-gray-500">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{result.imported}</div>
              <div className="text-sm text-gray-500">Baru</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{result.updated}</div>
              <div className="text-sm text-gray-500">Update</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{result.failed}</div>
              <div className="text-sm text-gray-500">Gagal</div>
            </div>
          </div>
          {result.errors.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium text-red-700 mb-2">Error:</p>
              <ul className="text-sm text-red-600 space-y-1">
                {result.errors.map((err, i) => (
                  <li key={i}>- {err}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="font-semibold text-gray-700 mb-3">Format JSON</h3>
          <p className="text-sm text-gray-500 mb-3">
            File <code>.json</code> berisi array of objects dengan field:
          </p>
          <ul className="text-sm text-gray-600 space-y-1 mb-4">
            <li><strong>jenis</strong> (wajib): UU, PP, Perpres, Permen</li>
            <li><strong>nomor</strong> (wajib): Nomor peraturan</li>
            <li><strong>tahun</strong> (wajib): Tahun terbit</li>
            <li><strong>judul</strong> (wajib): Judul lengkap</li>
            <li><strong>tentang</strong> (opsional): Ringkasan</li>
            <li><strong>status</strong> (opsional): berlaku/dicabut</li>
            <li><strong>instansi</strong> (opsional): Instansi penerbit</li>
          </ul>
          <button
            onClick={() => {
              const blob = new Blob([sampleJSON], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "sample-legal-docs.json";
              a.click();
            }}
            className="text-sm text-blue-600 hover:text-blue-700 underline"
          >
            Download sample JSON
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="font-semibold text-gray-700 mb-3">Format CSV</h3>
          <p className="text-sm text-gray-500 mb-3">
            File <code>.csv</code> dengan header baris pertama:
          </p>
          <pre className="text-xs bg-gray-100 p-3 rounded-lg overflow-x-auto mb-4">
{`jenis,nomor,tahun,judul,tentang,status,instansi
UU,1,2023,KUHP,Kitab Undang-Undang Hukum Pidana,berlaku,DPR RI`}
          </pre>
          <button
            onClick={() => {
              const blob = new Blob([sampleCSV], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "sample-legal-docs.csv";
              a.click();
            }}
            className="text-sm text-blue-600 hover:text-blue-700 underline"
          >
            Download sample CSV
          </button>
        </div>
      </div>

      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
        <h3 className="font-semibold text-yellow-800 mb-2">Tips Import dari JDIHN</h3>
        <ol className="text-sm text-yellow-700 space-y-1">
          <li>1. Buka <a href="https://peraturan.go.id" target="_blank" className="underline">peraturan.go.id</a> di browser</li>
          <li>2. Cari peraturan yang diinginkan</li>
          <li>3. Copy data (judul, nomor, tahun, dll)</li>
          <li>4. Paste ke file JSON/CSV sesuai format di atas</li>
          <li>5. Upload file ke sini</li>
        </ol>
      </div>
    </div>
  );
}
