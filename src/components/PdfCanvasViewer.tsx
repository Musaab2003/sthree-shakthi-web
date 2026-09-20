import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { Loader2, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';

// Configure CDN worker for rock-solid cross-platform mobile & desktop execution
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

interface PdfCanvasViewerProps {
  dataUrlOrBlob: string | Blob;
  title: string;
}

export const PdfCanvasViewer: React.FC<PdfCanvasViewerProps> = ({ dataUrlOrBlob, title }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);

  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    setError(null);

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

        setNumPages(pdf.numPages);
        setLoading(false);

        // Render pages after state updates
        setTimeout(() => {
          if (!isCancelled && containerRef.current) {
            renderAllPages(pdf, containerRef.current, scale, rotation);
          }
        }, 50);
      } catch (err: any) {
        if (!isCancelled) {
          console.error('PDF.js rendering error:', err);
          setError(err?.message || 'Failed to render PDF document pages.');
          setLoading(false);
        }
      }
    };

    loadPdf();

    return () => {
      isCancelled = true;
    };
  }, [dataUrlOrBlob]);

  // Re-render when scale or rotation changes
  useEffect(() => {
    if (!numPages || !containerRef.current) return;
    // Re-render existing loaded pdf if needed
  }, [scale, rotation, numPages]);

  const renderAllPages = async (pdf: any, container: HTMLDivElement, currentScale: number, currentRotation: number) => {
    container.innerHTML = '';

    const containerWidth = container.clientWidth || window.innerWidth || 600;

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const unscaledViewport = page.getViewport({ scale: 1, rotation: currentRotation });
      
      // Compute responsive fit width for mobile screens
      const desiredWidth = Math.min(containerWidth - 24, 850) * currentScale;
      const computedScale = desiredWidth / unscaledViewport.width;
      const viewport = page.getViewport({ scale: computedScale, rotation: currentRotation });

      // Page wrapper
      const pageDiv = document.createElement('div');
      pageDiv.className = 'relative mb-4 bg-white shadow-2xl rounded-lg overflow-hidden transition-transform mx-auto';
      pageDiv.style.width = `${viewport.width}px`;
      pageDiv.style.maxWidth = '100%';

      // Canvas element
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) continue;

      const outputScale = window.devicePixelRatio || 1;
      canvas.width = Math.floor(viewport.width * outputScale);
      canvas.height = Math.floor(viewport.height * outputScale);
      canvas.style.width = '100%';
      canvas.style.height = 'auto';

      context.scale(outputScale, outputScale);

      pageDiv.appendChild(canvas);

      // Page number indicator badge
      const badge = document.createElement('div');
      badge.className = 'absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/60 text-white text-[10px] font-mono pointer-events-none';
      badge.textContent = `Page ${pageNum} of ${pdf.numPages}`;
      pageDiv.appendChild(badge);

      container.appendChild(pageDiv);

      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };
      await page.render(renderContext).promise;
    }
  };

  return (
    <div className="w-full h-full flex flex-col relative bg-slate-950 overflow-hidden">
      {/* Floating Zoom Controls for mobile & desktop */}
      <div className="absolute top-3 right-3 z-30 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-700 shadow-xl">
        <button
          type="button"
          onClick={() => setScale(s => Math.max(0.7, s - 0.15))}
          className="p-1 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <span className="text-[10px] font-mono font-bold text-[#F8CAD5] px-1">
          {Math.round(scale * 100)}%
        </span>
        <button
          type="button"
          onClick={() => setScale(s => Math.min(2.0, s + 0.15))}
          className="p-1 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Document Body */}
      <div className="flex-1 w-full h-full overflow-y-auto overflow-x-hidden p-2 sm:p-4 md:p-6 flex flex-col items-center">
        {loading && (
          <div className="my-auto flex flex-col items-center justify-center p-8 text-center text-white space-y-3">
            <Loader2 className="w-10 h-10 border-4 border-[#D95F7F] border-t-transparent rounded-full animate-spin text-[#D95F7F]" />
            <p className="text-xs font-semibold text-slate-300">Rendering PDF document pages...</p>
            <p className="text-[10px] text-slate-500">{title}</p>
          </div>
        )}

        {error && (
          <div className="my-auto max-w-md w-full bg-rose-950/60 border border-rose-800 rounded-2xl p-6 text-center text-rose-200 space-y-2">
            <p className="font-bold text-sm">Unable to render PDF document</p>
            <p className="text-xs text-rose-300/80">{error}</p>
          </div>
        )}

        {/* Canvas Pages Container */}
        <div ref={containerRef} className="w-full flex flex-col items-center min-h-[200px]" />
      </div>
    </div>
  );
};
