"use client";

import { useState } from "react";

interface Template {
  id: number;
  title: string;
  slug: string;
  description: string;
  content: string;
  category: string;
}

const PLACEHOLDER_LABELS: Record<string, string> = {
  NAMA_PEMBERI_KUASA: "Nama Pemberi Kuasa",
  UMUR: "Umur",
  PEKERJAAN: "Pekerjaan",
  ALAMAT_PEMBERI_KUASA: "Alamat Pemberi Kuasa",
  NO_KTP: "No. KTP",
  NAMA_PENERIMA_KUASA: "Nama Penerima Kuasa",
  ALAMAT_PENERIMA_KUASA: "Alamat Penerima Kuasa",
  NO_ADVOKAT: "No. Advokat",
  HAL_YANG_DIKUASAKAN: "Hal Yang Dikuasakan",
  NO_SURAT: "Nomor Surat",
  LOKASI: "Lokasi",
  TANGGAL: "Tanggal",
  KOTA: "Kota",
  NAMA_PENGGUGAT: "Nama Penggugat",
  TTL_PENGGUGAT: "TTL Penggugat",
  PEKERJAAN_PENGGUGAT: "Pekerjaan Penggugat",
  ALAMAT_PENGGUGAT: "Alamat Penggugat",
  NAMA_TERGUGAT: "Nama Tergugat",
  TTL_TERGUGAT: "TTL Tergugat",
  PEKERJAAN_TERGUGAT: "Pekerjaan Tergugat",
  ALAMAT_TERGUGAT: "Alamat Tergugat",
  FAKTA_1: "Fakta Perkara",
  FAKTA_2: "Fakta Tambahan",
  DASAR_HUKUM: "Dasar Hukum",
  KLAIM_STATUS_HUKUM: "Klaim Status Hukum",
  NAMA_KUASA_HUKUM: "Nama Kuasa Hukum",
  NAMA_PENERIMA: "Nama Penerima",
  ALAMAT_PENERIMA: "Alamat Penerima",
  NAMA_PENGIRIM: "Nama Pengirim",
  JABATAN: "Jabatan",
  TANGGAL_PERJANJIAN: "Tanggal Perjanjian",
  PELANGGARAN_1: "Pelanggaran",
  PELANGGARAN_2: "Pelanggaran Tambahan",
  TINDAKAN_YANG_HARUS_DILAKUKAN: "Tindakan Yang Harus Dilakukan",
  MASA_TENGGANG: "Masa Tenggang (Hari)",
  HARI: "Hari",
  BULAN: "Bulan",
  TAHUN: "Tahun",
  NAMA_PEMILIK: "Nama Pemilik",
  ALAMAT_PEMILIK: "Alamat Pemilik",
  NO_KTP_PEMILIK: "No. KTP Pemilik",
  NAMA_PENYEWA: "Nama Penyewa",
  ALAMAT_PENYEWA: "Alamat Penyewa",
  NO_KTP_PENYEWA: "No. KTP Penyewa",
  OBJEK_SEWA: "Objek Sewa",
  ALAMAT_OBJEK_SEWA: "Alamat Objek Sewa",
  LAMA_SEWA: "Lama Sewa",
  TANGGAL_MULAI: "Tanggal Mulai",
  TANGGAL_AKHIR: "Tanggal Akhir",
  NOMINAL_SEWA: "Nominal Sewa (Rp)",
  TERBILANG_SEWA: "Terbilang Sewa",
  FREKUENSI_PEMBAYARAN: "Frekuensi Pembayaran",
  NOMINAL_JAMINAN: "Nominal Jaminan (Rp)",
  TERBILANG_JAMINAN: "Terbilang Jaminan",
  KEPERLUAN_SEWA: "Keperluan Sewa",
};

const AMOUNT_FIELDS = ["NOMINAL_SEWA", "NOMINAL_JAMINAN"];

const TEXTAREA_FIELDS = [
  "HAL_YANG_DIKUASAKAN",
  "FAKTA_1",
  "FAKTA_2",
  "DASAR_HUKUM",
  "KLAIM_STATUS_HUKUM",
  "PELANGGARAN_1",
  "PELANGGARAN_2",
  "TINDAKAN_YANG_HARUS_DILAKUKAN",
  "KEPERLUAN_SEWA",
];

function terbilang(value: string): string {
  const num = parseFloat(value.replace(/[^\d.,]/g, "").replace(/\./g, "").replace(",", "."));
  if (isNaN(num) || num < 0) return "";

  const ANGKA = ["", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan", "sepuluh", "sebelas"];

  function sebut(n: number): string {
    if (n < 12) return ANGKA[n];
    if (n < 20) return sebut(n - 10) + " belas";
    if (n < 100) return sebut(Math.floor(n / 10)) + " puluh" + (n % 10 ? " " + sebut(n % 10) : "");
    if (n < 200) return "seratus" + (n % 100 ? " " + sebut(n % 100) : "");
    if (n < 1000) return sebut(Math.floor(n / 100)) + " ratus" + (n % 100 ? " " + sebut(n % 100) : "");
    if (n < 2000) return "seribu" + (n % 1000 ? " " + sebut(n % 1000) : "");
    if (n < 1000000) return sebut(Math.floor(n / 1000)) + " ribu" + (n % 1000 ? " " + sebut(n % 1000) : "");
    if (n < 1000000000) return sebut(Math.floor(n / 1000000)) + " juta" + (n % 1000000 ? " " + sebut(n % 1000000) : "");
    if (n < 1000000000000) return sebut(Math.floor(n / 1000000000)) + " miliar" + (n % 1000000000 ? " " + sebut(n % 1000000000) : "");
    return sebut(Math.floor(n / 1000000000000)) + " triliun" + (n % 1000000000000 ? " " + sebut(n % 1000000000000) : "");
  }

  const rounded = Math.round(num * 100);
  const rupiah = Math.floor(rounded / 100);
  const sen = rounded % 100;

  let words = rupiah === 0 ? "nol" : sebut(rupiah);
  if (sen > 0) words += " koma " + sebut(sen);
  if (words === "nol") words = "nol rupiah";
  else words += " rupiah";

  return words.charAt(0).toUpperCase() + words.slice(1);
}

function formatRupiah(value: string): string {
  const num = value.replace(/[^\d]/g, "");
  if (!num) return "";
  return num.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export default function TemplateSuratDetail({ template }: { template: Template }) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState(template.content);
  const [showAI, setShowAI] = useState(false);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState("");

  const placeholders = Array.from(
    new Set(template.content.match(/\[([A-Z_]+)\]/g) || [])
  ).map((p) => p.replace(/[\[\]]/g, ""));

  const applyValues = () => {
    let result = template.content;

    const finalValues = { ...values };

    for (const amountField of AMOUNT_FIELDS) {
      const terbKey = `TERBILANG_${amountField.replace("NOMINAL_", "")}`;
      if (placeholders.includes(terbKey) && finalValues[amountField] && !finalValues[terbKey]) {
        finalValues[terbKey] = terbilang(finalValues[amountField]);
      }
    }

    for (const [key, value] of Object.entries(finalValues)) {
      const displayValue = AMOUNT_FIELDS.includes(key) ? `Rp ${formatRupiah(value)}` : value;
      result = result.replace(new RegExp(`\\[${key}\\]`, "g"), displayValue || `[${key}]`);
    }
    setPreview(result);
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${template.title}</title>
  <style>
    @page { margin: 2.5cm 3cm; size: A4; }
    body {
      font-family: 'Times New Roman', serif;
      font-size: 12pt;
      line-height: 1.8;
      color: #000;
      padding: 0;
      margin: 0;
    }
    .surat-container {
      max-width: 210mm;
      margin: 0 auto;
      padding: 40px 60px;
      white-space: pre-wrap;
    }
    .title-center {
      text-align: center;
      font-weight: bold;
      text-decoration: underline;
      margin-bottom: 24px;
      font-size: 14pt;
    }
    .pasal-heading {
      font-weight: bold;
      margin-top: 16px;
      margin-bottom: 8px;
    }
  </style>
</head>
<body>
  <div class="surat-container">${preview}</div>
</body>
</html>`;
      printWindow.document.write(html);
      printWindow.document.close();
      setTimeout(() => printWindow.print(), 500);
    }
  };

  const handleAIAssist = async () => {
    if (!aiInput.trim() || aiLoading) return;
    setAiLoading(true);
    setAiMessage("");

    const fieldList = placeholders.join(", ");

    try {
      const res = await fetch("/api/ai/ringkas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "form-fill",
          text: `Kasus/pengalaman: ${aiInput}\n\nSurat yang sedang diisi: ${template.title}\n\nKolom yang perlu diisi: ${fieldList}`,
          placeholders,
        }),
      });
      const data = await res.json();

      if (data.fields && Object.keys(data.fields).length > 0) {
        let filled = 0;
        setValues((prev) => {
          const next = { ...prev };
          for (const [key, value] of Object.entries(data.fields)) {
            if (placeholders.includes(key) && value) {
              next[key] = String(value).trim();
              filled += 1;
            }
          }
          return next;
        });
        setTimeout(() => {
          if (filled > 0) {
            setAiMessage(
              `AI mengisi ${filled} kolom. Periksa dan sesuaikan bila perlu, lalu klik "Terapkan ke Surat".`
            );
          }
        }, 0);
      } else {
        const summary = (data.summary || "").trim();
        setAiMessage(
          summary
            ? "AI tidak menemukan nilai yang cocok untuk kolom. Beri keterangan lebih spesifik, misalnya nama, alamat, atau nominal."
            : "Gagal memperoleh jawaban dari AI. Silakan coba lagi."
        );
      }
    } catch {
      setAiMessage("Gagal terhubung ke AI. Silakan coba lagi.");
    } finally {
      setAiLoading(false);
    }
  };

  const grouped: { section: string; fields: string[] }[] = [];

  const person1 = ["NAMA_PEMBERI_KUASA", "UMUR", "PEKERJAAN", "ALAMAT_PEMBERI_KUASA", "NO_KTP"];
  const person2 = ["NAMA_PENERIMA_KUASA", "ALAMAT_PENERIMA_KUASA", "NO_ADVOKAT"];
  const suspect1 = ["NAMA_PENGGUGAT", "TTL_PENGGUGAT", "PEKERJAAN_PENGGUGAT", "ALAMAT_PENGGUGAT"];
  const suspect2 = ["NAMA_TERGUGAT", "TTL_TERGUGAT", "PEKERJAAN_TERGUGAT", "ALAMAT_TERGUGAT"];
  const ownerFields = ["NAMA_PEMILIK", "ALAMAT_PEMILIK", "NO_KTP_PEMILIK"];
  const tenantFields = ["NAMA_PENYEWA", "ALAMAT_PENYEWA", "NO_KTP_PENYEWA"];
  const dateFields = ["HARI", "BULAN", "TAHUN", "TANGGAL", "LOKASI", "KOTA", "NO_SURAT"];
  const objectFields = ["OBJEK_SEWA", "ALAMAT_OBJEK_SEWA", "LAMA_SEWA", "TANGGAL_MULAI", "TANGGAL_AKHIR", "KEPERLUAN_SEWA"];
  const moneyFields = ["NOMINAL_SEWA", "TERBILANG_SEWA", "FREKUENSI_PEMBAYARAN", "NOMINAL_JAMINAN", "TERBILANG_JAMINAN"];

  const addGroup = (section: string, fields: string[]) => {
    const present = fields.filter((f) => placeholders.includes(f));
    if (present.length > 0) grouped.push({ section, fields: present });
  };

  addGroup("Pihak 1 / Penggugat / Penyewa", [...person1, ...suspect1, ...ownerFields]);
  addGroup("Pihak 2 / Tergugat / Penerima Kuasa", [...person2, ...suspect2, ...tenantFields]);
  addGroup("Tanggal & Lokasi", dateFields);
  addGroup("Objek Sewa", objectFields);
  addGroup("Harga & Jaminan", moneyFields);

  const remaining = placeholders.filter((p) => !grouped.some((g) => g.fields.includes(p)));
  if (remaining.length > 0) {
    grouped.push({ section: "Data Lainnya", fields: remaining });
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="mb-8">
        <span className="badge bg-green-100 text-green-700 mb-2">{template.category}</span>
        <h1 className="text-3xl font-bold">{template.title}</h1>
        <p className="text-gray-600 mt-2">{template.description}</p>
      </div>

      {placeholders.length > 0 && (
        <div className="card mb-6">
          <h2 className="text-lg font-semibold mb-4 border-b pb-2">Isi Data Surat</h2>
          <div className="space-y-6">
            {grouped.map((group) => (
              <div key={group.section}>
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">{group.section}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {group.fields.map((ph) => {
                    const isTextarea = TEXTAREA_FIELDS.includes(ph);
                    const isAmount = AMOUNT_FIELDS.includes(ph);
                    const label = PLACEHOLDER_LABELS[ph] || ph.replace(/_/g, " ");

                    return (
                      <div key={ph} className={isTextarea ? "md:col-span-2" : ""}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                        {isTextarea ? (
                          <textarea
                            value={values[ph] || ""}
                            onChange={(e) => setValues({ ...values, [ph]: e.target.value })}
                            className="input-field w-full"
                            rows={3}
                            placeholder={`Masukkan ${label.toLowerCase()}`}
                          />
                        ) : (
                          <input
                            type="text"
                            value={values[ph] || ""}
                            onChange={(e) => {
                              const val = isAmount ? e.target.value.replace(/[^\d]/g, "") : e.target.value;
                              setValues({ ...values, [ph]: val });
                            }}
                            className="input-field w-full"
                            placeholder={isAmount ? "Contoh: 5000000" : `Masukkan ${label.toLowerCase()}`}
                          />
                        )}
                        {isAmount && values[ph] && (
                          <p className="text-xs text-gray-500 mt-1">
                            = {formatRupiah(values[ph])} rupiah — {terbilang(values[ph])}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t">
            <button onClick={applyValues} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium">
              Terapkan ke Surat
            </button>
            <button onClick={() => setShowAI(!showAI)} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium">
              Bantuan AI
            </button>
          </div>

          {showAI && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700 mb-2">Ceritakan kasus Anda, AI akan membantu mengisi surat:</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAIAssist()}
                  className="input-field flex-1"
                  placeholder="Contoh: Saya ingin menyewakan ruko selama 2 tahun..."
                />
                <button onClick={handleAIAssist} disabled={aiLoading || !aiInput.trim()} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50">
                  {aiLoading ? "Memproses..." : "Tanya AI"}
                </button>
              </div>
              {aiMessage && (
                <p className={`text-sm mt-2 ${aiMessage.startsWith("AI") ? "text-green-700" : "text-blue-700"}`}>
                  {aiMessage}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      <div className="card">
        <div className="flex justify-between items-center mb-4 border-b pb-3">
          <h2 className="text-lg font-semibold">Preview Surat</h2>
          <button onClick={handlePrint} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium text-sm">
            Cetak / Download PDF
          </button>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-8 font-serif text-sm leading-relaxed whitespace-pre-wrap min-h-[400px] max-h-[700px] overflow-y-auto">
          {preview}
        </div>
      </div>
    </div>
  );
}