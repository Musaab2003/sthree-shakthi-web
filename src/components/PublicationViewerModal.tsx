import React, { useEffect, useState } from 'react';
import { 
  X, 
  ExternalLink, 
  Heart, 
  Share2, 
  FileText, 
  FileType,
  Maximize2,
  Minimize2,
  Download,
  Check
} from 'lucide-react';
import { Publication } from '../types';
import { parseDocumentOrFlipbookUrl } from '../utils/embedHelper';
import { storageService } from '../services/storageService';
import { generatePublicationPdfBlob } from '../utils/pdfGenerator';
import { PdfCanvasViewer } from './PdfCanvasViewer';
import { DocxViewer } from './DocxViewer';

interface PublicationViewerModalProps {
  publication: Publication | null;
  onClose: () => void;
  onLike: (id: string, e: React.MouseEvent) => void;
  isAdminView?: boolean;
}

function safeBase64ToBlobUrl(rawData: string, defaultMime: string = 'application/pdf'): string | null {
  try {
    if (rawData.startsWith('http://') || rawData.startsWith('https://') || rawData.startsWith('blob:')) {
      return rawData;
    }
    const parts = rawData.split(',');
    const mimeMatch = parts[0]?.match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : defaultMime;
    const base64Str = (parts.length > 1 ? parts[1] : parts[0]).replace(/[\r\n\s]/g, '');
    
    // Chunked binary string conversion to prevent string length overflow
    const binary = atob(base64Str);
    const len = binary.length;
    const buffer = new ArrayBuffer(len);
    const view = new Uint8Array(buffer);
    for (let i = 0; i < len; i++) {
      view[i] = binary.charCodeAt(i);
    }
    const blob = new Blob([view], { type: mime || defaultMime });
    return URL.createObjectURL(blob);
  } catch (e) {
    console.warn('Base64 blob URL conversion notice:', e);
    return null;
  }
}

export const PublicationViewerModal: React.FC<PublicationViewerModalProps> = ({
  publication,
  onClose,
  onLike,
  isAdminView = false,
}) => {
  const [copiedToast, setCopiedToast] = useState(false);
  const [loadedFileData, setLoadedFileData] = useState<string | null>(null);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const lastLoadedPubIdRef = React.useRef<string | null>(null);

  useEffect(() => {
    setLikesCount(publication?.likes || 0);
    setHasLiked(publication ? storageService.hasUserLiked(publication.id) : false);
    setCopiedToast(false);

    if (publication) {
      document.body.style.overflow = 'hidden';

      // Only re-fetch and reset file data if the publication ID has changed
      if (lastLoadedPubIdRef.current !== publication.id) {
        lastLoadedPubIdRef.current = publication.id;

        if (publication.fileData && publication.fileData.length > 50) {
          setLoadedFileData(publication.fileData);
          setIsLoadingFile(false);
        } else {
          setIsLoadingFile(true);
          setLoadedFileData(null);
          setBlobUrl(null);
          storageService.getPublicationFileData(publication.id).then((data) => {
            if (data) {
              setLoadedFileData(data);
            }
            setIsLoadingFile(false);
          }).catch((err) => {
            console.warn('Error fetching publication file data:', err);
            setIsLoadingFile(false);
          });
        }
      }
    } else {
      document.body.style.overflow = 'unset';
      lastLoadedPubIdRef.current = null;
      setIsLoadingFile(false);
      setLoadedFileData(null);
      setBlobUrl(null);
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [publication]);

  useEffect(() => {
    if (!publication) {
      setBlobUrl(null);
      return;
    }

    // Do not generate fallback if still loading from database
    if (isLoadingFile) {
      return;
    }

    let activeBlobUrl: string | null = null;
    const rawData = loadedFileData || publication.fileData;
    const docIsWord = Boolean(
      publication.type === 'word' || 
      (publication.fileName && (
        publication.fileName.toLowerCase().endsWith('.docx') || 
        publication.fileName.toLowerCase().endsWith('.doc') || 
        publication.fileName.toLowerCase().includes('.docx') || 
        publication.fileName.toLowerCase().includes('.doc')
      )) ||
      (publication.title && (
        publication.title.toLowerCase().endsWith('.docx') || 
        publication.title.toLowerCase().endsWith('.doc')
      ))
    );

    const defaultMime = docIsWord 
      ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      : 'application/pdf';

    if (rawData && (rawData.startsWith('data:') || rawData.startsWith('http://') || rawData.startsWith('https://') || rawData.startsWith('blob:') || rawData.length > 100)) {
      const converted = safeBase64ToBlobUrl(rawData, defaultMime);
      if (converted) {
        activeBlobUrl = converted;
        setBlobUrl(converted);
      } else {
        setBlobUrl(rawData);
      }
    } else if (publication.embedUrl) {
      const parsed = parseDocumentOrFlipbookUrl(publication.embedUrl);
      setBlobUrl(parsed.embedUrl || publication.embedUrl);
    } else {
      // If truly no file was attached, create fallback PDF document
      try {
        const fallbackBlob = generatePublicationPdfBlob(publication);
        activeBlobUrl = URL.createObjectURL(fallbackBlob);
        setBlobUrl(activeBlobUrl);
      } catch (err) {
        console.warn('PDF fallback generation notice:', err);
      }
    }

    return () => {
      if (activeBlobUrl && activeBlobUrl.startsWith('blob:')) {
        URL.revokeObjectURL(activeBlobUrl);
      }
    };
  }, [loadedFileData, publication?.id, publication?.fileData, publication?.embedUrl, isLoadingFile]);

  if (!publication) return null;

  const effectiveDocUrl = blobUrl || (publication.embedUrl ? parseDocumentOrFlipbookUrl(publication.embedUrl).embedUrl : null);

  const isWordType = publication.type === 'word' || 
    (Boolean(publication.fileName) && (
      publication.fileName!.toLowerCase().endsWith('.docx') || 
      publication.fileName!.toLowerCase().endsWith('.doc') || 
      publication.fileName!.toLowerCase().includes('.docx') || 
      publication.fileName!.toLowerCase().includes('.doc')
    )) ||
    (Boolean(publication.title) && (
      publication.title.toLowerCase().endsWith('.docx') || 
      publication.title.toLowerCase().endsWith('.doc')
    ));

  const handleShareClick = async (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    const shareUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: publication.title,
          text: `Read "${publication.title}" on Project Sthree Shakthi`,
          url: shareUrl,
        });
        return;
      } catch (err) {
        // Fallback to clipboard
      }
    }
    
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = shareUrl;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2500);
    } catch (e) {
      console.warn('Copy failed:', e);
    }
  };

  const handleHeartClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    const currentlyLiked = hasLiked;
    setHasLiked(!currentlyLiked);
    setLikesCount(prev => currentlyLiked ? Math.max(0, prev - 1) : prev + 1);
    onLike(publication.id, e as React.MouseEvent);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#3E1028]/85 backdrop-blur-md animate-in fade-in duration-200 p-0 sm:p-3 md:p-6">
      <div 
        className={`relative w-full flex flex-col overflow-hidden bg-slate-900 shadow-2xl transition-all duration-300 border border-[#F4E5DA] ${
          isFullScreen ? 'h-full w-full max-w-[1920px] rounded-none sm:rounded-3xl' : 'max-w-5xl h-[100dvh] sm:h-[92vh] rounded-none sm:rounded-[32px]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Toast: Link copied */}
        {copiedToast && (
          <div className="absolute top-16 right-4 sm:right-6 z-50 px-4 py-2 rounded-2xl bg-[#3E1028] text-white text-xs font-bold shadow-xl border border-[#D95F7F] flex items-center gap-2 animate-in slide-in-from-top duration-200">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Link copied to clipboard!</span>
          </div>
        )}

        {/* Modal Top Navigation Bar (Header) */}
        <div className="flex items-center justify-between px-3 sm:px-6 py-2.5 sm:py-4 border-b border-[#F4E5DA] bg-[#FAF2EB] gap-2 shrink-0 select-none z-10">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 pr-1 sm:pr-4">
            <span className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
              isWordType ? 'bg-blue-600 text-white' : 'bg-[#D95F7F] text-white'
            }`}>
              {isWordType ? (
                <FileType className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              ) : (
                <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              )}
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h2 className="font-serif text-xs sm:text-base font-bold text-[#3E1028] truncate">
                  {publication.title}
                </h2>
                <span className={`hidden sm:inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  isWordType ? 'bg-blue-100 text-blue-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  {isWordType ? 'Word Document' : 'PDF Document'}
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-[#5C1D3B]/70 truncate">
                By {publication.authorName} {publication.authorClub ? `• ${publication.authorClub}` : ''}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {publication.embedUrl && (
              <a
                href={publication.embedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden md:flex items-center gap-1 px-3 py-1.5 sm:py-2 rounded-full text-xs font-bold text-[#3E1028] bg-white hover:bg-slate-100 border border-[#F4E5DA] shadow-2xs cursor-pointer touch-manipulation active:scale-95"
                title="Open original source in new tab"
              >
                <ExternalLink className="w-3.5 h-3.5 text-[#D95F7F]" />
                <span>Open Link</span>
              </a>
            )}

            {/* Share Button */}
            <button
              type="button"
              onClick={handleShareClick}
              className={`flex items-center justify-center gap-1 px-2.5 sm:px-3 py-1.5 sm:py-2 min-h-[36px] rounded-full text-xs font-bold border transition-all shadow-2xs hover:scale-105 active:scale-95 cursor-pointer touch-manipulation ${
                copiedToast 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300' 
                  : 'bg-white text-[#3E1028] hover:bg-slate-100 border-[#F4E5DA]'
              }`}
              title="Share publication"
            >
              {copiedToast ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5 text-[#D95F7F]" />}
              <span className="hidden sm:inline">{copiedToast ? 'Copied' : 'Share'}</span>
            </button>

            {/* Heart Like Button (Only in Public View) */}
            {!isAdminView && (
              <button
                type="button"
                onClick={handleHeartClick}
                className={`flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 min-h-[36px] rounded-full text-xs font-bold transition-all shadow-2xs border hover:scale-105 active:scale-95 cursor-pointer touch-manipulation ${
                  hasLiked || likesCount > 0
                    ? 'bg-rose-50 text-[#D95F7F] border-[#D95F7F]/40'
                    : 'bg-white text-[#D95F7F] hover:bg-rose-50 border-[#F4E5DA]'
                }`}
                title={hasLiked ? 'Unlike this publication' : 'Like this publication'}
              >
                <Heart className={`w-3.5 h-3.5 transition-transform ${hasLiked ? 'scale-125 fill-[#D95F7F] text-[#D95F7F]' : likesCount > 0 ? 'fill-[#D95F7F] text-[#D95F7F]' : ''}`} />
                <span className="text-xs font-semibold">{likesCount}</span>
              </button>
            )}

            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="p-2 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-full text-[#5C1D3B] hover:text-[#3E1028] hover:bg-white/80 transition-colors cursor-pointer touch-manipulation active:scale-95"
              title={isFullScreen ? 'Exit Full Screen' : 'Expand to Full Screen'}
            >
              {isFullScreen ? (
                <Minimize2 className="w-4 h-4 sm:w-5 sm:h-5" />
              ) : (
                <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </button>

            {/* Close Modal */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-full text-[#5C1D3B] hover:text-[#3E1028] hover:bg-white/80 transition-colors cursor-pointer touch-manipulation active:scale-95"
              title="Close modal"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Modal Main Body: 100% Full-Screen Interactive Document / PDF / Word Viewer */}
        <div className="flex-1 w-full h-full min-h-0 relative bg-slate-900 flex flex-col overflow-hidden">
          {isLoadingFile ? (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-white space-y-3">
              <div className="w-10 h-10 border-4 border-[#D95F7F] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-semibold text-slate-300">
                Loading {isWordType ? 'Word document' : 'PDF document'}...
              </p>
            </div>
          ) : effectiveDocUrl ? (
            publication.embedUrl && !publication.embedUrl.endsWith('.pdf') && !publication.embedUrl.endsWith('.docx') ? (
              <iframe
                src={effectiveDocUrl}
                title={publication.title}
                className="w-full h-full flex-1 border-0 bg-slate-900"
                allow="fullscreen"
              />
            ) : isWordType ? (
              <DocxViewer
                dataUrlOrBlob={loadedFileData || publication.fileData || effectiveDocUrl}
                title={publication.title}
              />
            ) : (
              <PdfCanvasViewer
                dataUrlOrBlob={loadedFileData || publication.fileData || effectiveDocUrl}
                title={publication.title}
              />
            )
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-white bg-slate-900">
              <div className="max-w-md w-full bg-slate-800/90 border border-slate-700 rounded-3xl p-8 space-y-4 shadow-2xl">
                <div className="w-16 h-16 rounded-2xl bg-[#D95F7F]/20 border border-[#D95F7F]/40 text-[#D95F7F] flex items-center justify-center mx-auto">
                  <FileText className="w-8 h-8" />
                </div>
                <h3 className="font-serif text-xl font-bold text-white">
                  {publication.title}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {publication.summary || 'Document details submitted by the author.'}
                </p>
                <div className="pt-2 text-[11px] text-slate-400">
                  Author: <span className="text-slate-200 font-medium">{publication.authorName}</span>
                  {publication.authorClub ? ` (${publication.authorClub})` : ''}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Dark Bar (Document Information + Actions) */}
        <div className="bg-slate-900 text-slate-300 text-xs px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 shrink-0 z-10">
          <span className="text-[11px] text-[#F8CAD5] truncate flex items-center gap-1.5 max-w-[200px] sm:max-w-none">
            <FileText className="w-3.5 h-3.5 text-[#D95F7F] shrink-0" />
            <span className="truncate">
              {publication.title} {publication.fileSize ? `(${publication.fileSize})` : ''}
            </span>
          </span>
          
          <div className="flex items-center gap-2">
            {effectiveDocUrl && (
              <a
                href={effectiveDocUrl}
                download={publication.fileName || `${publication.title}.${isWordType ? 'docx' : 'pdf'}`}
                className="px-3.5 py-1.5 rounded-full bg-[#D95F7F] hover:bg-[#BE4465] text-white text-[11px] font-bold transition-all flex items-center gap-1.5 shadow-xs touch-manipulation cursor-pointer"
              >
                <Download className="w-3 h-3" />
                <span>Download {isWordType ? 'Doc' : 'PDF'}</span>
              </a>
            )}
            {effectiveDocUrl && (
              <a
                href={effectiveDocUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-[11px] font-medium transition-all flex items-center gap-1 touch-manipulation cursor-pointer"
              >
                <ExternalLink className="w-3 h-3" />
                <span>Open in New Tab</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

