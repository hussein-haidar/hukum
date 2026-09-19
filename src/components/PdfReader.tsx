"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as pdfjs from "pdfjs-dist";

pdfjs.GlobalWorkerOptions.workerSrc = "/pdf/pdf.worker.min.js";

interface PdfReaderProps {
  docId: number;
  title: string;
  onClose: () => void;
}

export default function PdfReader({ docId, title, onClose }: PdfReaderProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pdfRef = useRef<any>(null);
  const renderTaskRef = useRef<any>(null);
  const [numPages, setNumPages] = useState(0);
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    setPage(1);
    setZoom(1);
    fetch(`/api/pdf?id=${docId}&r=${reloadKey}`)
      .then((r) => {
        if (!r.ok) throw new Error(`Gagal memuat PDF (${r.status})`);
        return r.arrayBuffer();
      })
      .then(async (buf) => {
        const doc = await pdfjs.getDocument({ data: buf }).promise;
        if (cancelled) {
          doc.destroy();
          return;
        }
        pdfRef.current = doc;
        setNumPages(doc.numPages);
        setLoading(false);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e?.message || "Gagal membaca PDF");
        setLoading(false);
      });
    return () => {
      cancelled = true;
      renderTaskRef.current?.cancel?.();
      renderTaskRef.current = null;
      pdfRef.current?.destroy?.();
      pdfRef.current = null;
    };
  }, [docId, reloadKey]);

  const renderPage = useCallback(
    async (num: number, currentDoc: any) => {
      const canvas = canvasRef.current;
      if (!canvas || !currentDoc) return;
      renderTaskRef.current?.cancel?.();
      try {
        const pageObj = await currentDoc.getPage(num);
        const base = pageObj.getViewport({ scale: 1 });
        const containerWidth = canvas.parentElement?.clientWidth || 600;
        const fit = containerWidth / base.width;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const finalScale = fit * zoom * dpr;
        const viewport = pageObj.getViewport({ scale: finalScale });
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.width = `${viewport.width / dpr}px`;
        canvas.style.height = `${viewport.height / dpr}px`;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const task = pageObj.render({ canvasContext: ctx, viewport });
        renderTaskRef.current = task;
        await task.promise;
      } catch {
        // render dibatalkan saat pindah halaman/zoom atau komponen ditutup
      }
    },
    [zoom]
  );

  useEffect(() => {
    if (!pdfRef.current || loading) return;
    renderPage(page, pdfRef.current);
  }, [page, zoom, loading, renderPage]);

  const prevPage = () => setPage((p) => Math.max(1, p - 1));
  const nextPage = () => setPage((p) => Math.min(numPages, p + 1));

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white w-full max-w-3xl h-[94vh] max-h-[94vh] rounded-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-gray-200">
          <h3 className="font-semibold text-sm truncate text-gray-800">{title}</h3>
          <button
            onClick={onClose}
            className="btn-secondary !px-3 !py-1 text-sm flex-shrink-0"
          >
            ✕ Tutup
          </button>
        </div>

        {error ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6 text-center">
            <p className="text-sm text-red-600">⚠️ {error}</p>
            <button
              onClick={() => setReloadKey((k) => k + 1)}
              className="btn-secondary"
            >
              ↻ Coba Lagi
            </button>
            <p className="text-xs text-gray-400">
              Dokumen tidak bisa ditampilkan di dalam aplikasi. Anda bisa membukanya
              lewat link <span className="font-medium">Sumber</span>.
            </p>
          </div>
        ) : loading ? (
          <div className="flex-1 flex items-center justify-center text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              Memuat dokumen...
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-auto bg-gray-100 p-3 flex justify-center">
              <canvas ref={canvasRef} className="max-w-full shadow-lg rounded bg-white" />
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 px-4 py-2 border-t border-gray-200 text-sm">
              <button
                onClick={prevPage}
                disabled={page <= 1}
                className="btn-secondary !px-3 !py-1 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ‹
              </button>
              <span className="text-gray-700">
                Halaman {page} / {numPages}
              </span>
              <button
                onClick={nextPage}
                disabled={page >= numPages}
                className="btn-secondary !px-3 !py-1 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ›
              </button>
              <span className="mx-1 text-gray-300">|</span>
              <button
                onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2)))}
                disabled={zoom <= 0.5}
                className="btn-secondary !px-2 !py-1 disabled:opacity-40"
              >
                −
              </button>
              <span className="text-gray-700">{Math.round(zoom * 100)}%</span>
              <button
                onClick={() => setZoom((z) => Math.min(3, +(z + 0.25).toFixed(2)))}
                disabled={zoom >= 3}
                className="btn-secondary !px-2 !py-1 disabled:opacity-40"
              >
                +
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}