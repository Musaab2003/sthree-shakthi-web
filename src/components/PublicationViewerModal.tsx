import React, { useEffect, useState, useRef } from 'react';
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
  Check,
  Upload,
  FileCheck,
  AlertCircle
} from 'lucide-react';
import { Publication } from '../types';
import { parseDocumentOrFlipbookUrl } from '../utils/embedHelper';
import { storageService } from '../services/storageService';

interface PublicationViewerModalProps {
  publication: Publication | null;
  onClose: () => void;
  onLike: (id: string, e: React.MouseEvent) => void;
  isAdminView?: boolean;
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

  // Attach state
  const [isAttaching, setIsAttaching] = useState(false);
  const [attachSuccessToast, setAttachSuccessToast] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setLoadedFileData(publication?.fileData || null);
    setLikesCount(publication?.likes || 0);
    setHasLiked(publication ? storageService.hasUserLiked(publication.id) : false);
    setCopiedToast(false);

    if (publication) {
      document.body.style.overflow = 'hidden';
      if (!publication.fileData) {
        setIsLoadingFile(true);
        storageService.getPublicationFileData(publication.id).then((data) => {
          if (data) {
            setLoadedFileData(data);
          }
          setIsLoadingFile(false);
        }).catch(() => {
          setIsLoadingFile(false);
        });
      } else {
        setIsLoadingFile(false);
      }
    } else {
      document.body.style.overflow = 'unset';
      setIsLoadingFile(false);
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

    let activeBlobUrl: string | null = null;
    const rawData = loadedFileData || publication.fileData;

    if (rawData) {
      if (rawData.startsWith('data:') || rawData.startsWith('data:application/pdf') || rawData.startsWith('data:application/octet-stream')) {
        try {
          const parts = rawData.split(',');
          const mimeMatch = parts[0].match(/:(.*?);/);
          const mime = mimeMatch ? mimeMatch[1] : 'application/pdf';
          const binary = atob(parts[1]);
          const array = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) {
            array[i] = binary.charCodeAt(i);
          }
          const blob = new Blob([array], { type: mime });
          activeBlobUrl = URL.createObjectURL(blob);
          setBlobUrl(activeBlobUrl);
        } catch (e) {
          console.warn('Error converting base64 to blob URL:', e);
          setBlobUrl(rawData);
        }
      } else {
        setBlobUrl(rawData);
      }
    } else if (publication.embedUrl) {
      const parsed = parseDocumentOrFlipbookUrl(publication.embedUrl);
      setBlobUrl(parsed.embedUrl || publication.embedUrl);
    } else {
      setBlobUrl(null);
    }

    return () => {
      if (activeBlobUrl && activeBlobUrl.startsWith('blob:')) {
        URL.revokeObjectURL(activeBlobUrl);
      }
    };
  }, [loadedFileData, publication]);

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

  // Handler for uploading/attaching document file
  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAttaching(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      const sizeStr = `${(file.size / (1024 * 1024)).toFixed(2)} MB`;
      
      setLoadedFileData(dataUrl);

      await storageService.attachFileToPublication(
        publication.id,
        dataUrl,
        file.name,
        sizeStr,
        undefined,
        file
      );

      setIsAttaching(false);
      setAttachSuccessToast(true);
      setTimeout(() => setAttachSuccessToast(false), 3000);
    };
    reader.readAsDataURL(file);
  };

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
      
      {/* Hidden File Input for attaching/replacing document */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelected}
        accept=".pdf,.docx,.doc,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="hidden"
      />

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

        {/* Toast: File Attached */}
        {attachSuccessToast && (
          <div className="absolute top-16 right-4 sm:right-6 z-50 px-4 py-2 rounded-2xl bg-emerald-700 text-white text-xs font-bold shadow-xl border border-emerald-400 flex items-center gap-2 animate-in slide-in-from-top duration-200">
            <FileCheck className="w-4 h-4 text-white shrink-0" />
            <span>PDF Document loaded successfully!</span>
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
            
            {/* Attach / Replace File Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isAttaching}
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 sm:py-2 min-h-[36px] rounded-full text-xs font-bold text-[#3E1028] bg-white hover:bg-slate-100 border border-[#F4E5DA] shadow-2xs cursor-pointer touch-manipulation active:scale-95"
              title="Upload or replace PDF file"
            >
              <Upload className="w-3.5 h-3.5 text-[#D95F7F]" />
              <span className="hidden md:inline">{effectiveDocUrl ? 'Replace PDF' : 'Attach PDF'}</span>
            </button>

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

        {/* Modal Main Body: 100% Full-Screen Interactive Document / PDF Viewer */}
        <div className="flex-1 w-full h-full min-h-0 relative bg-slate-900 flex flex-col overflow-hidden">
          {isLoadingFile ? (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-white space-y-3">
              <div className="w-10 h-10 border-4 border-[#D95F7F] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-semibold text-slate-300">Loading PDF document...</p>
            </div>
          ) : effectiveDocUrl ? (
            <object
              data={effectiveDocUrl}
              type={isWordType ? undefined : 'application/pdf'}
              className="w-full h-full flex-1 bg-slate-900 border-0"
            >
              <iframe
                src={
                  effectiveDocUrl.startsWith('http') && 
                  !effectiveDocUrl.includes('drive.google.com') && 
                  !effectiveDocUrl.includes('docs.google.com') &&
                  (effectiveDocUrl.endsWith('.pdf') || effectiveDocUrl.endsWith('.docx'))
                    ? `https://docs.google.com/viewer?url=${encodeURIComponent(effectiveDocUrl)}&embedded=true`
                    : effectiveDocUrl
                }
                title={publication.title}
                className="w-full h-full border-0 bg-slate-900"
                allow="fullscreen"
              />
            </object>
          ) : (
            /* Prompt to open the original PDF file */
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-white bg-slate-900 overflow-y-auto">
              <div className="max-w-md w-full bg-slate-800/95 border border-slate-700 rounded-3xl p-8 space-y-6 shadow-2xl">
                <div className="w-20 h-20 rounded-3xl bg-[#D95F7F]/20 border border-[#D95F7F]/40 text-[#D95F7F] flex items-center justify-center mx-auto shadow-inner">
                  <FileText className="w-10 h-10" />
                </div>

                <div className="space-y-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-950 text-rose-300 text-[11px] font-bold uppercase tracking-wider border border-rose-800">
                    <AlertCircle className="w-3.5 h-3.5" />
                    PDF Document File: {publication.fileName || `${publication.title}.pdf`}
                  </span>
                  <h3 className="font-serif text-2xl font-bold text-white pt-1">
                    {publication.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Click the button below to load <strong>{publication.fileName || `${publication.title}.pdf`}</strong> into the interactive PDF reader.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isAttaching}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-[#D95F7F] hover:bg-[#BE4465] text-white font-bold text-sm shadow-xl shadow-[#D95F7F]/30 transition-all hover:scale-102 cursor-pointer touch-manipulation active:scale-95"
                >
                  <Upload className="w-4 h-4" />
                  <span>{isAttaching ? 'Loading PDF...' : `Open "${publication.fileName || `${publication.title}.pdf`}"`}</span>
                </button>
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
            {isAdminView && effectiveDocUrl && (
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

