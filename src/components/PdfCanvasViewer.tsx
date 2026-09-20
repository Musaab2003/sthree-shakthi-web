import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { Loader2, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from 'lucide-react';

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

interface PdfCanvasViewerProps {
  dataUrlOrBlob: string | Blob;
  title: string;
}

export const PdfCanvasViewer: React.FC<PdfCanvasViewerProps> = ({ dataUrlOrBlob, title }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const renderTaskRef = useRef<any>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [numPages, setNumPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState<number>(1.0);

  // 1. Load PDF Document
  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    setError(null);
    setCurrentPage(1);

    const loadPdf = async () => {
      try {
        let loadingTask: any;
        if (typeof dataUrlOrBlob === 'string') {
          if (dataUrlOrBlob.startsWith('data:') || dataUrlOrBlob.startsWith('blob:')) {
            loadingTask = pdfjsLib.getDocument(dataUrlOrBlob);
          } else {
            loadingTask = pdfjsLib.getDocument({ url: dataUrlOrBlob });
          }
        } else {
          const arrayBuffer = await dataUrlOrBlob.arrayBuffer();
          loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        }

        const pdf = await loadingTask.promise;
        if (isCancelled) return;

        setPdfDoc(pdf);
        setNumPages(pdf.numPages);
        setLoading(false);
      } catch (err: any) {
        if (!isCancelled) {
          console.error('PDF load error:', err);
          setError(err?.message || 'Failed to open PDF document.');
          setLoading(false);
        }
      }
    };

    loadPdf();

    return () => {
      isCancelled = true;
    };
  }, [dataUrlOrBlob]);

  // 2. Render Single Active Page
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current || !containerRef.current) return;

    let isCancelled = false;

    const renderPage = async () => {
      try {
        // Cancel any pending render task to prevent canvas collision/overlapping
        if (renderTaskRef.current) {
          try {
            renderTaskRef.current.cancel();
          } catch {}
        }

        const page = await pdfDoc.getPage(currentPage);
        if (isCancelled) return;

        const container = containerRef.current;
        const containerWidth = container ? container.clientWidth - 24 : 600;
        const unscaledViewport = page.getViewport({ scale: 1 });
        const autoFitScale = Math.min((containerWidth / unscaledViewport.width), 1.6) * scale;
        const viewport = page.getViewport({ scale: autoFitScale });

        const canvas = canvasRef.current;
        if (!canvas) return;
        const context = canvas.getContext('2d');
        if (!context) return;

        const outputScale = window.devicePixelRatio || 1;
        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;

        context.setTransform(1, 0, 0, 1, 0, 0); // reset transform
        context.scale(outputScale, outputScale);

        const renderContext = {
          canvasContext: context,
          viewport: viewport
        };

        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;
        await renderTask.promise;
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException') {
          console.warn('Page render notice:', err);
        }
      }
    };

    renderPage();

    return () => {
      isCancelled = true;
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {}
      }
    };
  }, [pdfDoc, currentPage, scale]);

  const handlePrevPage = () => {
    setCurrentPage(p => Math.max(1, p - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(p => Math.min(numPages, p + 1));
  };

  return (
    <div className="w-full h-full flex flex-col relative bg-slate-950 select-none overflow-hidden">
      {/* Top Floating Control Bar: Single-Page Navigation & Zoom */}
      <div className="w-full bg-slate-900/95 border-b border-slate-800 px-3 sm:px-6 py-2 flex items-center justify-between gap-2 shrink-0 z-20 shadow-md">
        {/* Page Switcher */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={handlePrevPage}
            disabled={currentPage <= 1 || loading}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:pointer-events-none text-white transition-all cursor-pointer active:scale-95 flex items-center gap-1 text-xs font-semibold"
            title="Previous Page"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Prev</span>
          </button>

          <span className="px-3 py-1 rounded-lg bg-black/40 border border-white/10 text-white font-mono text-xs font-bold">
            {currentPage} <span className="text-slate-400 font-normal">/</span> {numPages}
          </span>

          <button
            type="button"
            onClick={handleNextPage}
            disabled={currentPage >= numPages || loading}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:pointer-events-none text-white transition-all cursor-pointer active:scale-95 flex items-center gap-1 text-xs font-semibold"
            title="Next Page"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 bg-black/30 px-2 py-1 rounded-lg border border-white/10">
          <button
            type="button"
            onClick={() => setScale(s => Math.max(0.6, s - 0.15))}
            className="p-1 rounded text-slate-300 hover:text-white transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-mono text-[#F8CAD5] font-bold px-1 min-w-[36px] text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setScale(s => Math.min(2.5, s + 0.15))}
            className="p-1 rounded text-slate-300 hover:text-white transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Single Page Canvas Viewport */}
      <div 
        ref={containerRef}
        className="flex-1 w-full h-full overflow-auto p-2 sm:p-4 flex items-center justify-center relative bg-slate-950"
      >
        {loading && (
          <div className="flex flex-col items-center justify-center p-8 text-center text-white space-y-3">
            <Loader2 className="w-10 h-10 border-4 border-[#D95F7F] border-t-transparent rounded-full animate-spin text-[#D95F7F]" />
            <p className="text-xs font-semibold text-slate-300">Rendering PDF Page...</p>
          </div>
        )}

        {error && (
          <div className="max-w-md w-full bg-rose-950/60 border border-rose-800 rounded-2xl p-6 text-center text-rose-200 space-y-2">
            <p className="font-bold text-sm">Unable to render PDF document</p>
            <p className="text-xs text-rose-300/80">{error}</p>
          </div>
        )}

        {/* Clean Single Canvas (No overlapping, perfectly centered) */}
        <canvas
          ref={canvasRef}
          className={`shadow-2xl rounded-lg bg-white max-w-full transition-all duration-200 ${loading ? 'hidden' : 'block'}`}
        />
      </div>
    </div>
  );
};
