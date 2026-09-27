"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as pdfjs from "pdfjs-dist";
import { sanitizeText } from "@/lib/sanitize";

pdfjs.GlobalWorkerOptions.workerSrc = "/pdf/pdf.worker.min.js";

interface PdfReaderProps {
  docId: number;
  title: string;
  onClose: () => void;
  sumberUrl?: string | null;
}

export default function PdfReader({ docId, title, onClose, sumberUrl }: PdfReaderProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pdfRef = useRef<any>(null);
  const renderTaskRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState<number | "auto">("auto");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    setPage(1);
    setZoom("auto");
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

  const calculateZoom = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    const currentDoc = pdfRef.current;
    if (!canvas || !container || !currentDoc || zoom !== "auto") return;

    currentDoc.getPage(page).then((pageObj: any) => {
      const viewport = pageObj.getViewport({ scale: 1 });
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;
      const scaleX = containerWidth / viewport.width;
      const scaleY = containerHeight / viewport.height;
      const fitScale = Math.min(scaleX, scaleY) * 0.95; // 95% to leave small margin
      setZoom(Math.max(0.5, Math.min(fitScale, 3)));
    });
  }, [page, zoom]);

  const renderPage = useCallback(
    async (num: number, currentDoc: any, currentZoom: number) => {
      const canvas = canvasRef.current;
      if (!canvas || !currentDoc) return;
      renderTaskRef.current?.cancel?.();
      try {
        const pageObj = await currentDoc.getPage(num);
        const base = pageObj.getViewport({ scale: 1 });
        const container = containerRef.current;
        const containerWidth = container?.clientWidth || 600;
        const fit = containerWidth / base.width;
        const cssScale = fit * currentZoom;
        // Higher DPR for sharper text (cap at 2 for performance)
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const maxDim = 8000;
        const safeDpr = Math.min(
          dpr,
          maxDim / (base.width * cssScale),
          maxDim / (base.height * cssScale)
        );
        const viewport = pageObj.getViewport({ scale: cssScale * safeDpr });
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.width = `${base.width * cssScale}px`;
        canvas.style.height = `${base.height * cssScale}px`;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const task = pageObj.render({ canvasContext: ctx, viewport });
        renderTaskRef.current = task;
        await task.promise;
      } catch {
        // render dibatalkan saat pindah halaman/zoom atau komponen ditutup
      }
    },
    []
  );

  useEffect(() => {
    if (!pdfRef.current || loading) return;
    if (zoom === "auto") {
      calculateZoom();
    } else {
      renderPage(page, pdfRef.current, zoom);
    }
  }, [page, zoom, loading, calculateZoom, renderPage]);

  // Recalculate auto-zoom on resize
  useEffect(() => {
    if (zoom !== "auto") return;
    const handleResize = () => calculateZoom();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [zoom, calculateZoom]);

  const prevPage = () => setPage((p) => Math.max(1, p - 1));
  const nextPage = () => setPage((p) => Math.min(numPages, p + 1));
  const zoomIn = () => setZoom((z) => (z === "auto" ? 1 : Math.min(3, +(z + 0.25).toFixed(2))));
  const zoomOut = () => setZoom((z) => (z === "auto" ? 1 : Math.max(0.5, +(z - 0.25).toFixed(2))));
  const resetZoom = () => setZoom("auto");

  const zoomDisplay = zoom === "auto" ? "Otomatis" : `${Math.round(Number(zoom) * 100)}%`;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-2 sm:p-4">
      {/* Mobile: full screen, Desktop: centered with max dimensions */}
      <div className="bg-white w-full max-w-4xl h-[90vh] max-h-[90vh] sm:max-h-[85vh] rounded-2xl flex flex-col overflow-hidden shadow-2xl">
        {/* Header - fixed, no shrink */}
        <div className="flex-shrink-0 flex items-center justify-between gap-3 px-4 py-3 border-b border-gray-200 bg-white sticky top-0 z-10">
          <h3 className="font-semibold text-sm truncate text-gray-800 pr-4">{sanitizeText(title)}</h3>
          <button
            onClick={onClose}
            className="btn-secondary !px-3 !py-1.5 text-sm flex-shrink-0 min-w-[44px]"
            aria-label="Tutup PDF"
          >
            ✕ Tutup
          </button>
        </div>

        {/* Content area - flex-1 with overflow */}
        <div className="flex-1 overflow-hidden relative min-h-0">
          {error ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
              <p className="text-sm text-red-600">⚠️ {error}</p>
              <button
                onClick={() => setReloadKey((k) => k + 1)}
                className="btn-secondary"
              >
                ↻ Coba Lagi
              </button>
              <div className="flex flex-wrap justify-center gap-2">
                <a
                  href={`/api/pdf?id=${docId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary"
                >
                  📄 Buka PDF di tab baru
                </a>
                {sumberUrl && /^https?:\/\//i.test(sumberUrl) && (
                  <a
                    href={sumberUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary"
                  >
                    🔗 Buka Halaman Sumber
                  </a>
                )}
              </div>
              <p className="text-xs text-gray-400">
                Bila tetap gagal, kemungkinan server asal dokumen sedang
                bermasalah. Anda tetap bisa membukanya lewat tombol di atas.
              </p>
            </div>
          ) : loading ? (
            <div className="flex h-full items-center justify-center text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                Memuat dokumen...
              </div>
            </div>
          ) : (
            <>
              {/* Canvas container - fills available space */}
              <div
                ref={containerRef}
                className="flex-1 overflow-auto bg-gray-100 p-3 sm:p-4 flex justify-center items-start min-h-0"
              >
                <canvas
                  ref={canvasRef}
                  className="shadow-lg rounded bg-white max-w-full"
                />
              </div>

              {/* Footer toolbar - fixed, no shrink */}
              <div className="flex-shrink-0 flex flex-col sm:flex-row items-center justify-center gap-2 px-4 py-2.5 border-t border-gray-200 bg-white text-sm">
                {/* Page navigation */}
                <div className="flex items-center gap-2 w-full sm:w-auto justify-center">
                  <button
                    onClick={prevPage}
                    disabled={page <= 1}
                    className="btn-secondary !px-3 !py-2 disabled:opacity-40 disabled:cursor-not-allowed min-w-[44px] min-h-[44px]"
                    aria-label="Halaman sebelumnya"
                  >
                    ‹
                  </button>
                  <span className="text-gray-700 dark:text-gray-300 min-w-[100px] text-center font-medium">
                    Halaman {page} / {numPages}
                  </span>
                  <button
                    onClick={nextPage}
                    disabled={page >= numPages}
                    className="btn-secondary !px-3 !py-2 disabled:opacity-40 disabled:cursor-not-allowed min-w-[44px] min-h-[44px]"
                    aria-label="Halaman berikutnya"
                  >
                    ›
                  </button>
                </div>

                {/* Zoom controls */}
                <div className="flex items-center gap-1.5 w-full sm:w-auto justify-center flex-wrap">
                  <button
                    onClick={zoomOut}
                    disabled={zoom !== "auto" && Number(zoom) <= 0.5}
                    className="btn-secondary !px-3 !py-2 disabled:opacity-40 min-w-[44px] min-h-[44px]"
                    aria-label="Perkecil"
                  >
                    −
                  </button>
                  <span className="text-gray-700 dark:text-gray-300 min-w-[70px] text-center font-medium">
                    {zoomDisplay}
                  </span>
                  <button
                    onClick={zoomIn}
                    disabled={zoom !== "auto" && Number(zoom) >= 3}
                    className="btn-secondary !px-3 !py-2 disabled:opacity-40 min-w-[44px] min-h-[44px]"
                    aria-label="Perbesar"
                  >
                    +
                  </button>
                  <button
                    onClick={resetZoom}
                    disabled={zoom === "auto"}
                    className="btn-secondary !px-3 !py-2 disabled:opacity-40 min-w-[44px] min-h-[44px] ml-1"
                    aria-label="Reset zoom ke otomatis"
                    title="Pas ke lebar"
                  >
                    ⛶
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}