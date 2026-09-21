import React, { useEffect, useRef, useState } from 'react';
import { renderAsync } from 'docx-preview';
import { Loader2, ZoomIn, ZoomOut, RotateCcw, FileText, Download } from 'lucide-react';

interface DocxViewerProps {
  dataUrlOrBlob: string | Blob;
  title: string;
}

// Convert Base64 / Blob / URL to ArrayBuffer safely
async function toArrayBuffer(input: string | Blob): Promise<ArrayBuffer> {
  if (input instanceof Blob) {
    return await input.arrayBuffer();
  }
  
  if (typeof input === 'string') {
    if (input.startsWith('blob:') || input.startsWith('http://') || input.startsWith('https://')) {
      const response = await fetch(input);
      return await response.arrayBuffer();
    }

    // Base64 string (with or without data: URI header)
    const base64Data = input.includes(';base64,') ? input.split(';base64,')[1] : (input.startsWith('data:') ? input.split(',')[1] : input);
    const cleanBase64 = base64Data.replace(/[\r\n\s]/g, '');
    const binaryString = atob(cleanBase64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  throw new Error('Unsupported document data format');
}

export const DocxViewer: React.FC<DocxViewerProps> = ({ dataUrlOrBlob, title }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState<number>(1.0);

  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    setError(null);

    const renderDocument = async () => {
      try {
        if (!containerRef.current) return;
        containerRef.current.innerHTML = '';

        const buffer = await toArrayBuffer(dataUrlOrBlob);
        if (isCancelled) return;

        await renderAsync(buffer, containerRef.current, undefined, {
          inWrapper: true,
          ignoreWidth: false,
          ignoreHeight: false,
          renderHeaders: true,
          renderFooters: true,
          renderFootnotes: true,
          renderEndnotes: true,
          useBase64URL: true,
        });

        if (!isCancelled) {
          setLoading(false);
        }
      } catch (err: any) {
        if (!isCancelled) {
          console.warn('DOCX render notice:', err);
          setError(err?.message || 'Could not parse Word document content.');
          setLoading(false);
        }
      }
    };

    renderDocument();

    return () => {
      isCancelled = true;
    };
  }, [dataUrlOrBlob]);

  return (
    <div className="w-full h-full flex flex-col relative bg-slate-950 select-none overflow-hidden">
      {/* Top Floating Control Bar for Word Document */}
      <div className="w-full bg-slate-900/95 border-b border-slate-800 px-3 sm:px-6 py-2 flex items-center justify-between gap-2 shrink-0 z-20 shadow-md">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-lg bg-blue-950/80 border border-blue-800 text-blue-300 text-xs font-bold flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-blue-400" />
            <span>Word Document Viewer</span>
          </span>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 bg-black/30 px-2 py-1 rounded-lg border border-white/10">
          <button
            type="button"
            onClick={() => setScale(s => Math.max(0.6, s - 0.15))}
            className="p-1 rounded text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-mono text-[#F8CAD5] font-bold px-1 min-w-[36px] text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setScale(s => Math.min(2.0, s + 0.15))}
            className="p-1 rounded text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setScale(1.0)}
            className="p-1 rounded text-slate-400 hover:text-white transition-colors ml-1 cursor-pointer"
            title="Reset Zoom"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Document Viewport */}
      <div className="flex-1 w-full h-full overflow-auto p-3 sm:p-6 flex items-start justify-center relative bg-slate-950">
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 text-white space-y-3 z-10">
            <Loader2 className="w-10 h-10 border-4 border-[#D95F7F] border-t-transparent rounded-full animate-spin text-[#D95F7F]" />
            <p className="text-xs font-semibold text-slate-300">Rendering Word Document...</p>
          </div>
        )}

        {error && (
          <div className="max-w-md w-full my-auto bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 text-center text-slate-200 space-y-4 shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center mx-auto">
              <FileText className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-white">{title}</h3>
              <p className="text-xs text-slate-400 mt-1">
                This document is a Microsoft Word file (.docx). You can read it by opening in Office 365 or downloading below.
              </p>
            </div>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href={typeof dataUrlOrBlob === 'string' ? dataUrlOrBlob : URL.createObjectURL(dataUrlOrBlob)}
                download={title.endsWith('.docx') ? title : `${title}.docx`}
                className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-[#D95F7F] hover:bg-[#BE4465] text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download Word Document</span>
              </a>
            </div>
          </div>
        )}

        {/* DOCX HTML Container */}
        <div 
          className={`w-full max-w-4xl transition-transform origin-top duration-150 ${error ? 'hidden' : 'block'} ${loading ? 'opacity-0' : 'opacity-100'}`}
          style={{ transform: `scale(${scale})` }}
        >
          <div 
            ref={containerRef}
            className="docx-viewer-content bg-white text-slate-900 rounded-2xl shadow-2xl p-6 sm:p-12 min-h-[500px] border border-slate-200 overflow-x-auto"
          />
        </div>
      </div>
    </div>
  );
};
