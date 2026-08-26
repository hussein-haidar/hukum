"use client";

import { useState, useEffect } from "react";

interface Template {
  id: number;
  title: string;
  slug: string;
  description: string;
  content: string;
  category: string;
}

export default function TemplateDetailPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const [template, setTemplate] = useState<Template | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState("");
  const [showAI, setShowAI] = useState(false);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    fetch("/api/template")
      .then((r) => r.json())
      .then((data: Template[]) => {
        const found = data.find((t) => t.slug === slug);
        if (found) {
          setTemplate(found);
          setPreview(found.content);
        }
      });
  }, [slug]);

  const placeholders = template
    ? [...new Set(template.content.match(/\[([A-Z_]+)\]/g) || [])].map((p) => p.replace(/[\[\]]/g, ""))
    : [];

  const applyValues = () => {
    if (!template) return;
    let result = template.content;
    for (const [key, value] of Object.entries(values)) {
      result = result.replace(new RegExp(`\\[${key}\\]`, "g"), value || `[${key}]`);
    }
    setPreview(result);
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`<html><head><title>${template?.title}</title><style>body{font-family:serif;padding:40px;white-space:pre-wrap;line-height:1.8;}</style></head><body>${preview}</body></html>`);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleAIAssist = async () => {
    if (!aiInput.trim() || aiLoading) return;
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai/ringkas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: `Bantu saya isi surat hukum berikut: ${aiInput}\n\nTemplate:\n${template?.content}` }),
      });
      const data = await res.json();
      alert("Saran AI:\n\n" + data.summary);
    } catch {
      alert("Gagal memanggil AI");
    } finally {
      setAiLoading(false);
    }
  };

  if (!template) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center text-gray-500">
        Memuat template...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-8">
        <span className="badge bg-green-100 text-green-700 mb-2">{template.category}</span>
        <h1 className="text-3xl font-bold">{template.title}</h1>
        <p className="text-gray-600 mt-2">{template.description}</p>
      </div>

      {placeholders.length > 0 && (
        <div className="card mb-6">
          <h2 className="text-lg font-semibold mb-4">Isi Data Surat</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {placeholders.map((ph) => (
              <div key={ph}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {ph.replace(/_/g, " ")}
                </label>
                <input
                  type="text"
                  value={values[ph] || ""}
                  onChange={(e) => setValues({ ...values, [ph]: e.target.value })}
                  className="input-field"
                  placeholder={`Masukkan ${ph.replace(/_/g, " ").toLowerCase()}`}
                />
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={applyValues} className="btn-primary">Terapkan ke Surat</button>
            <button onClick={() => setShowAI(!showAI)} className="btn-secondary">🤖 Bantuan AI</button>
          </div>

          {showAI && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700 mb-2">Ceritakan kasus Anda, AI akan membantu mengisi surat:</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  className="input-field flex-1"
                  placeholder="Contoh: Saya ingin menyewakan ruko selama 2 tahun..."
                />
                <button onClick={handleAIAssist} disabled={aiLoading} className="btn-primary disabled:opacity-50">
                  {aiLoading ? "..." : "Tanya AI"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Preview Surat</h2>
          <button onClick={handlePrint} className="btn-primary text-sm">
            🖨️ Cetak / Download PDF
          </button>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-8 font-serif text-sm leading-loose whitespace-pre-wrap min-h-[400px]">
          {preview}
        </div>
      </div>
    </div>
  );
}
