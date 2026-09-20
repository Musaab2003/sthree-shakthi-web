import React, { useEffect, useState } from 'react';
import { 
  X, 
  ExternalLink, 
  Heart, 
  Share2, 
  BookOpen, 
  FileText, 
  FileType,
  Sparkles, 
  Clock, 
  Check, 
  Calendar,
  Layers,
  Maximize2,
  Minimize2,
  Download,
  Upload,
  Link2,
  CheckCircle2
} from 'lucide-react';
import { Publication } from '../types';
import { parseDocumentOrFlipbookUrl } from '../utils/embedHelper';
import { storageService } from '../services/storageService';
import { firebaseService } from '../services/firebaseService';

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
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [loadedFileData, setLoadedFileData] = useState<string | null>(null);
  const [likesCount, setLikesCount] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [linkInput, setLinkInput] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [fileUploadSuccessToast, setFileUploadSuccessToast] = useState(false);

  useEffect(() => {
    // Reset iframe load state when publication changes
    setIframeLoaded(false);
    setLoadedFileData(publication?.fileData || null);
    setLikesCount(publication?.likes || 0);
    setHasLiked(publication ? storageService.hasUserLiked(publication.id) : false);
    setCopiedToast(false);
    setFileUploadSuccessToast(false);
    setIsUploadingFile(false);
    setShowLinkInput(false);
    setLinkInput(publication?.embedUrl || '');

    if (publication) {
      document.body.style.overflow = 'hidden';
      if (!publication.fileData) {
        storageService.getPublicationFileData(publication.id).then((data) => {
          if (data) setLoadedFileData(data);
        });
      }
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [publication]);

  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    let activeBlobUrl: string | null = null;
    const rawData = loadedFileData || publication?.fileData;

    if (rawData) {
      if (rawData.startsWith('data:') || rawData.startsWith('data:application/pdf')) {
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

  const currentFileData = loadedFileData || publication.fileData;
  const parsed = publication.embedUrl ? parseDocumentOrFlipbookUrl(publication.embedUrl) : null;
  const effectivePdfUrl = blobUrl || parsed?.embedUrl || (publication.embedUrl ? publication.embedUrl : null);

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
        // User cancelled or share failed, fallback to clipboard
      }
    }
    
    // Fallback to clipboard copy
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        // Legacy fallback
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
    // Optimistic local update
    const currentlyLiked = hasLiked;
    setHasLiked(!currentlyLiked);
    setLikesCount(prev => currentlyLiked ? Math.max(0, prev - 1) : prev + 1);
    
    onLike(publication.id, e as React.MouseEvent);
  };

  const handleInlineFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingFile(true);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      setLoadedFileData(dataUrl);

      let cloudUrl: string | null = null;
      try {
        cloudUrl = await firebaseService.uploadPublicationFile(file, publication.id, file.name);
      } catch (err) {
        console.warn('Firebase Storage upload notice:', err);
      }

      const updated: Publication = {
        ...publication,
        fileData: dataUrl,
        fileName: file.name,
        fileSize: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        embedUrl: cloudUrl || publication.embedUrl || undefined
      };

      storageService.updatePublication(updated);
      setIsUploadingFile(false);
      setFileUploadSuccessToast(true);
      setTimeout(() => setFileUploadSuccessToast(false), 3000);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveLink = () => {
    if (!linkInput.trim()) return;
    const updated: Publication = {
      ...publication,
      embedUrl: linkInput.trim()
    };
    storageService.updatePublication(updated);
    setShowLinkInput(false);
    setFileUploadSuccessToast(true);
    setTimeout(() => setFileUploadSuccessToast(false), 3000);
  };

  const isWordType = publication.type === 'word' || 
    (Boolean(publication.fileName) && (
      publication.fileName!.toLowerCase().endsWith('.docx') || 
      publication.fileName!.toLowerCase().endsWith('.doc') || 
      publication.fileName!.toLowerCase().includes('.docx') || 
      publication.fileName!.toLowerCase().includes('.doc')
    )) ||
    (Boolean(publication.title) && (
      publication.title.toLowerCase().endsWith('.docx') || 
      publication.title.toLowerCase().endsWith('.doc') ||
      publication.title.toLowerCase().includes('.docx')
    ));

  const isPdfType = !isWordType && (
    publication.type === 'pdf' || 
    publication.type === 'drive' || 
    (Boolean(publication.fileName) && publication.fileName!.toLowerCase().endsWith('.pdf'))
  );
  
  const isFlipbookType = !isWordType && !isPdfType && publication.type === 'flipbook';

  const isArticleType = !isWordType && !isPdfType && !isFlipbookType;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#3E1028]/85 backdrop-blur-md animate-in fade-in duration-200 p-0 sm:p-3 md:p-6">
      <div 
        className={`relative w-full flex flex-col overflow-hidden bg-white shadow-2xl transition-all duration-300 border border-[#F4E5DA] ${
          isFullScreen ? 'h-full w-full max-w-[1920px] rounded-none sm:rounded-3xl' : 'max-w-5xl h-[100dvh] sm:h-[92vh] rounded-none sm:rounded-[32px]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Share notification banner */}
        {copiedToast && (
          <div className="absolute top-16 right-4 sm:right-6 z-50 px-4 py-2 rounded-2xl bg-[#3E1028] text-white text-xs font-bold shadow-xl border border-[#D95F7F] flex items-center gap-2 animate-in slide-in-from-top duration-200">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Link copied to clipboard!</span>
          </div>
        )}

        {/* Modal Top Navigation Bar */}
        <div className="flex items-center justify-between px-3 sm:px-6 py-2.5 sm:py-4 border-b border-[#F4E5DA] bg-[#FAF2EB] gap-2 shrink-0 select-none">
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
              className="p-2 sm:p-2 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-full text-[#5C1D3B] hover:text-[#3E1028] hover:bg-white/80 transition-colors cursor-pointer touch-manipulation active:scale-95"
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
              className="p-2 sm:p-2 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-full text-[#5C1D3B] hover:text-[#3E1028] hover:bg-white/80 transition-colors cursor-pointer touch-manipulation active:scale-95"
              title="Close modal"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Modal Main Content Area */}
        <div className="flex-grow overflow-y-auto bg-[#FDF9F6] flex flex-col">
          
          {/* 1. Word Document Mode */}
          {isWordType ? (
            <div className="flex-grow p-4 sm:p-10 flex flex-col items-center space-y-6 max-w-3xl mx-auto w-full">
              
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-inner mt-2">
                <FileType className="w-8 h-8 sm:w-10 sm:h-10" />
              </div>

              <div className="space-y-2 text-center w-full px-2">
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-extrabold uppercase tracking-wider border border-blue-200">
                  <FileType className="w-3.5 h-3.5" />
                  Microsoft Word Document (.docx)
                </span>
                <h3 className="font-serif text-xl sm:text-3xl font-bold text-[#3E1028] pt-1">
                  {publication.title}
                </h3>
                {publication.subtitle && (
                  <p className="text-xs sm:text-sm font-semibold text-[#D95F7F]">
                    {publication.subtitle}
                  </p>
                )}
              </div>

              {/* Document Details Card */}
              <div className="w-full bg-white p-4 sm:p-5 rounded-2xl border border-[#F4E5DA] shadow-xs space-y-3 text-xs">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-[#F4E5DA]">
                  <div>
                    <div className="text-[#5C1D3B]/60 text-[10px] font-bold uppercase">Attached Document</div>
                    <div className="font-mono font-bold text-slate-800 text-xs sm:text-sm break-all">{publication.fileName || `${publication.title}.docx`}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {publication.fileSize && (
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 font-mono text-xs font-semibold">
                        {publication.fileSize}
                      </span>
                    )}
                    {isAdminView && currentFileData && (
                      <a
                        href={currentFileData}
                        download={publication.fileName || `${publication.title}.docx`}
                        className="px-3 py-1 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center gap-1 hover:bg-blue-700 transition-colors shadow-xs"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </a>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[#5C1D3B]/80 pt-1">
                  <div>
                    <span className="font-bold text-slate-700">Author:</span> {publication.authorName}
                  </div>
                  <div>
                    <span className="font-bold text-slate-700">Email:</span> {publication.authorEmail}
                  </div>
                  {publication.authorClub && (
                    <div className="sm:col-span-2">
                      <span className="font-bold text-slate-700">Club / Affiliation:</span> {publication.authorClub}
                    </div>
                  )}
                </div>
              </div>

              {/* Description / Summary Box */}
              {publication.summary && (
                <div className="w-full bg-white p-4 sm:p-5 rounded-2xl border border-[#F4E5DA] text-left space-y-1.5 shadow-xs">
                  <div className="text-[11px] font-bold text-[#D95F7F] uppercase tracking-wider">
                    Summary & Overview
                  </div>
                  <p className="text-xs sm:text-sm text-[#5C1D3B]/90 leading-relaxed">
                    {publication.summary}
                  </p>
                </div>
              )}

              {/* Full Blog / Document Body Content if available */}
              {publication.content && (
                <div className="w-full bg-white p-5 sm:p-8 rounded-2xl border border-[#F4E5DA] text-left space-y-4 shadow-xs">
                  <div className="text-[11px] font-bold text-[#D95F7F] uppercase tracking-wider border-b border-[#F4E5DA] pb-2">
                    Document Content & Article Text
                  </div>
                  <div className="text-[#3E1028] leading-relaxed space-y-4 text-xs sm:text-sm">
                    {publication.content.split('\n\n').map((para, i) => {
                      if (para.startsWith('### ')) {
                        return <h3 key={i} className="font-serif text-base sm:text-lg font-bold text-[#3E1028] mt-4 mb-2">{para.replace('### ', '')}</h3>;
                      }
                      if (para.startsWith('> ')) {
                        return (
                          <blockquote key={i} className="p-3.5 rounded-xl bg-[#FAF2EB] border-l-4 border-[#D95F7F] text-[#3E1028] italic text-xs sm:text-sm my-3">
                            {para.replace('> ', '')}
                          </blockquote>
                        );
                      }
                      return <p key={i}>{para}</p>;
                    })}
                  </div>
                </div>
              )}

              {/* Reading Status & Cloud Link (If available) */}
              {publication.embedUrl && (
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2 w-full pb-6">
                  <a
                    href={publication.embedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-8 py-3.5 rounded-full text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/30 transition-all hover:scale-102 touch-manipulation cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>View Word Document Online</span>
                  </a>
                </div>
              )}
            </div>
          ) : isPdfType ? (
            /* 2. PDF Viewer Mode */
            effectivePdfUrl ? (
              <div className="w-full flex-grow flex flex-col min-h-[500px] relative bg-slate-900">
                <div className="w-full flex-grow h-[65vh] sm:h-[75vh] relative bg-slate-900">
                  <object
                    data={effectivePdfUrl}
                    type="application/pdf"
                    className="w-full h-full bg-slate-900 border-0"
                  >
                    <iframe
                      src={
                        effectivePdfUrl.startsWith('http') 
                          ? `https://docs.google.com/viewer?url=${encodeURIComponent(effectivePdfUrl)}&embedded=true`
                          : effectivePdfUrl
                      }
                      title={publication.title}
                      className="w-full h-full border-0 bg-white"
                      allow="fullscreen"
                      onLoad={() => setIframeLoaded(true)}
                    />
                  </object>
                </div>

                <div className="bg-slate-900 text-slate-300 text-xs px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 shrink-0">
                  <span className="text-[11px] text-[#F8CAD5] truncate flex items-center gap-1.5 max-w-[200px] sm:max-w-none">
                    <FileText className="w-3.5 h-3.5 text-[#D95F7F] shrink-0" />
                    <span className="truncate">{publication.title} {publication.fileSize ? `(${publication.fileSize})` : ''}</span>
                  </span>
                  
                  <div className="flex items-center gap-2">
                    {isAdminView && (
                      <a
                        href={effectivePdfUrl}
                        download={publication.fileName || `${publication.title}.pdf`}
                        className="px-3.5 py-1.5 rounded-full bg-[#D95F7F] hover:bg-[#BE4465] text-white text-[11px] font-bold transition-all flex items-center gap-1.5 shadow-xs touch-manipulation cursor-pointer"
                      >
                        <Download className="w-3 h-3" />
                        <span>Download PDF</span>
                      </a>
                    )}
                    <a
                      href={effectivePdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-[11px] font-medium transition-all flex items-center gap-1 touch-manipulation cursor-pointer"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Open in New Tab</span>
                    </a>
                  </div>
                </div>

                {/* If publication also has written body content, display it below the PDF embed */}
                {publication.content && (
                  <div className="bg-white p-6 sm:p-8 border-t border-[#F4E5DA] text-left space-y-4">
                    <div className="text-[11px] font-bold text-[#D95F7F] uppercase tracking-wider border-b border-[#F4E5DA] pb-2">
                      Accompanying Article & Description
                    </div>
                    <div className="text-[#3E1028] leading-relaxed space-y-4 text-xs sm:text-sm">
                      {publication.content.split('\n\n').map((para, i) => (
                        <p key={i}>{para}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* PDF Showcase & Editorial Article Reader (When direct stream is loading or external) */
              <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 space-y-6 bg-white my-2 sm:my-4 rounded-2xl sm:rounded-3xl shadow-sm border border-[#F4E5DA]">
                
                {/* PDF Document Notice Banner */}
                <div className="p-4 rounded-2xl bg-[#FAF2EB] border border-[#F4E5DA] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#D95F7F] text-white flex items-center justify-center font-bold text-xs sm:text-sm shadow-xs shrink-0">
                      PDF
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs sm:text-sm font-bold text-[#3E1028] truncate">
                        {publication.fileName || `${publication.title}.pdf`}
                      </h4>
                      <p className="text-[10px] sm:text-[11px] text-[#5C1D3B]/70 truncate">
                        {publication.fileSize || 'PDF Publication'} • Official Submission
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {isAdminView && currentFileData && (
                      <a
                        href={currentFileData}
                        download={publication.fileName || `${publication.title}.pdf`}
                        className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-full text-xs font-bold text-white bg-[#D95F7F] hover:bg-[#BE4465] shadow-md transition-all shrink-0 touch-manipulation cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </a>
                    )}
                    {publication.embedUrl && (
                      <a
                        href={publication.embedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-full text-xs font-bold text-white bg-[#D95F7F] hover:bg-[#BE4465] shadow-md transition-all shrink-0 touch-manipulation cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Open Document</span>
                      </a>
                    )}
                  </div>
                </div>

                {/* Article Header */}
                <div className="space-y-3 border-b border-[#F4E5DA] pb-6">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-[#D95F7F] text-xs font-extrabold uppercase tracking-wider border border-rose-200">
                    <FileText className="w-3.5 h-3.5" />
                    Editorial Document Publication
                  </span>

                  <h1 className="font-serif text-2xl sm:text-4xl font-bold text-[#3E1028] leading-tight">
                    {publication.title}
                  </h1>
                  
                  {publication.subtitle && (
                    <p className="text-sm sm:text-base text-[#D95F7F] font-medium">
                      {publication.subtitle}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-[#5C1D3B]/80 pt-2">
                    <span className="font-bold text-[#3E1028]">{publication.authorName}</span>
                    <span>•</span>
                    <span>{publication.authorClub || 'Cluster 05 Community'}</span>
                    <span>•</span>
                    <span>{new Date(publication.submittedAt).toLocaleDateString()}</span>
                    {publication.readTimeMinutes && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-[#D95F7F]" />
                          {publication.readTimeMinutes} min read
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Summary / Overview Box */}
                {publication.summary && (
                  <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF2EB]/60 border border-[#F4E5DA] space-y-1.5">
                    <div className="text-[11px] font-bold text-[#D95F7F] uppercase tracking-wider">
                      Summary & Executive Overview
                    </div>
                    <p className="text-xs sm:text-sm text-[#3E1028] leading-relaxed">
                      {publication.summary}
                    </p>
                  </div>
                )}

                {/* Article Body Content */}
                {publication.content ? (
                  <div className="text-[#3E1028] leading-relaxed space-y-4 text-xs sm:text-base">
                    {publication.content.split('\n\n').map((para, i) => {
                      if (para.startsWith('### ')) {
                        return <h3 key={i} className="font-serif text-base sm:text-lg font-bold text-[#3E1028] mt-6 mb-2">{para.replace('### ', '')}</h3>;
                      }
                      if (para.startsWith('> ')) {
                        return (
                          <blockquote key={i} className="p-3.5 sm:p-4 rounded-xl bg-[#FAF2EB] border-l-4 border-[#D95F7F] text-[#3E1028] italic text-xs sm:text-sm my-4">
                            {para.replace('> ', '')}
                          </blockquote>
                        );
                      }
                      return <p key={i}>{para}</p>;
                    })}
                  </div>
                ) : (
                  <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#FAF2EB] via-white to-[#FFF5F8] border-2 border-dashed border-[#D95F7F]/40 text-center space-y-5 shadow-xs">
                    <div className="w-16 h-16 rounded-3xl bg-rose-100 text-[#D95F7F] flex items-center justify-center mx-auto shadow-inner">
                      <Upload className="w-8 h-8" />
                    </div>
                    <div className="space-y-1.5 max-w-lg mx-auto">
                      <h4 className="font-serif text-lg sm:text-xl font-bold text-[#3E1028]">
                        Open or Attach Document to Read
                      </h4>
                      <p className="text-xs sm:text-sm text-[#5C1D3B]/80 leading-relaxed">
                        To view and read the full document pages for <strong>"{publication.title}"</strong>, select your document file or connect a Google Drive link.
                      </p>
                    </div>

                    {fileUploadSuccessToast && (
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300 animate-in fade-in">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Document loaded & synced successfully!</span>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                      <label className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-xs font-bold text-white bg-[#D95F7F] hover:bg-[#BE4465] shadow-lg shadow-[#D95F7F]/30 transition-all hover:scale-105 cursor-pointer touch-manipulation">
                        {isUploadingFile ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Uploading & Loading Reader...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4" />
                            <span>Select Document from Device to Read</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept=".pdf,.docx,.doc,application/pdf"
                          onChange={handleInlineFileUpload}
                          disabled={isUploadingFile}
                          className="hidden"
                        />
                      </label>

                      <button
                        type="button"
                        onClick={() => setShowLinkInput(!showLinkInput)}
                        className="inline-flex items-center justify-center gap-1.5 px-5 py-3 rounded-full text-xs font-bold text-[#5C1D3B] hover:text-[#3E1028] bg-white hover:bg-slate-100 border border-[#F4E5DA] transition-all"
                      >
                        <Link2 className="w-4 h-4 text-[#D95F7F]" />
                        <span>{showLinkInput ? 'Hide Link Option' : 'Attach Google Drive / Cloud Link'}</span>
                      </button>
                    </div>

                    {showLinkInput && (
                      <div className="pt-3 max-w-md mx-auto space-y-2 text-left animate-in fade-in">
                        <label className="block text-[11px] font-bold text-[#3E1028]">
                          Paste Google Drive, Flipbook, or Document Link:
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="url"
                            placeholder="https://drive.google.com/file/d/..."
                            value={linkInput}
                            onChange={(e) => setLinkInput(e.target.value)}
                            className="flex-grow px-3 py-2 rounded-xl bg-white border border-[#F4E5DA] text-xs text-[#3E1028] focus:outline-none focus:ring-2 focus:ring-[#D95F7F]/30"
                          />
                          <button
                            type="button"
                            onClick={handleSaveLink}
                            className="px-4 py-2 rounded-xl bg-[#D95F7F] hover:bg-[#BE4465] text-white text-xs font-bold transition-colors shrink-0"
                          >
                            Save & View
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Footer Interaction Bar */}
                <div className="pt-6 border-t border-[#F4E5DA] flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {!isAdminView && (
                      <button
                        type="button"
                        onClick={handleHeartClick}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                          hasLiked 
                            ? 'bg-rose-50 text-[#D95F7F] border-[#D95F7F]/40' 
                            : 'bg-[#FAF2EB] text-[#5C1D3B] hover:text-[#D95F7F] border-[#F4E5DA]'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${hasLiked ? 'fill-[#D95F7F] text-[#D95F7F]' : ''}`} />
                        <span>{hasLiked ? 'Liked' : 'Like'} ({likesCount})</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleShareClick}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold bg-[#FAF2EB] text-[#5C1D3B] hover:text-[#3E1028] border border-[#F4E5DA] transition-all"
                    >
                      <Share2 className="w-4 h-4 text-[#D95F7F]" />
                      <span>Share</span>
                    </button>
                  </div>

                  {publication.tags && publication.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {publication.tags.map((tag) => (
                        <span key={tag} className="px-3 py-1 rounded-full bg-[#FAF2EB] text-[#D95F7F] text-xs font-bold border border-[#F4E5DA]">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          ) : isFlipbookType && parsed?.embedUrl ? (
            /* 3. 3D Flipbook Mode */
            <div className="w-full flex-grow flex flex-col min-h-[550px] relative bg-slate-900">
              {!iframeLoaded && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white space-y-3 z-10 bg-slate-900">
                  <div className="w-10 h-10 border-4 border-[#D95F7F] border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs font-medium text-slate-300">
                    Loading interactive 3D Flipbook reader...
                  </p>
                </div>
              )}

              <iframe
                src={parsed.embedUrl}
                title={publication.title}
                className="w-full flex-grow h-full min-h-[550px] border-0"
                allow="fullscreen; clipboard-write"
                onLoad={() => setIframeLoaded(true)}
              />

              <div className="bg-slate-900 text-slate-400 text-xs px-6 py-2 flex items-center justify-between border-t border-slate-800">
                <span className="text-[11px]">
                  💡 Tip: Flip pages with click or drag.
                </span>
                <a
                  href={publication.embedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#F8CAD5] hover:text-white text-[11px] font-bold flex items-center gap-1 touch-manipulation"
                >
                  Fullscreen External Reader <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ) : (
            /* 4. Word Document / Written Article Mode */
            <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 space-y-6 bg-white my-2 sm:my-4 rounded-2xl sm:rounded-3xl shadow-sm border border-[#F4E5DA]">
              
              {/* Word Document Banner if applicable */}
              {isWordType && (
                <div className="p-4 rounded-2xl bg-[#FAF2EB] border border-[#F4E5DA] flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs sm:text-sm shadow-xs shrink-0">
                      DOC
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs sm:text-sm font-bold text-[#3E1028] truncate">
                        {publication.fileName || `${publication.title}.docx`}
                      </h4>
                      <p className="text-[10px] sm:text-[11px] text-[#5C1D3B]/70 truncate">
                        {publication.fileSize || 'Word Document'} • Ready for full reading
                      </p>
                    </div>
                  </div>

                  {isAdminView && currentFileData ? (
                    <a
                      href={currentFileData}
                      download={publication.fileName || `${publication.title}.docx`}
                      className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-full text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md transition-all shrink-0 touch-manipulation cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </a>
                  ) : publication.embedUrl ? (
                    <a
                      href={publication.embedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-full text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md transition-all shrink-0 touch-manipulation cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open</span>
                    </a>
                  ) : null}
                </div>
              )}

              {/* Cover Image */}
              {publication.coverImage && (
                <div className="rounded-2xl overflow-hidden aspect-[21/9] w-full bg-slate-100 shadow-xs">
                  <img
                    src={publication.coverImage}
                    alt={publication.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Article Header */}
              <div className="space-y-3 border-b border-[#F4E5DA] pb-6">
                <h1 className="font-serif text-xl sm:text-4xl font-bold text-[#3E1028] leading-tight">
                  {publication.title}
                </h1>
                
                {publication.subtitle && (
                  <p className="text-sm sm:text-base text-[#D95F7F] font-medium">
                    {publication.subtitle}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-[#5C1D3B]/80 pt-2">
                  <span className="font-bold text-[#3E1028]">{publication.authorName}</span>
                  <span>•</span>
                  <span>{publication.authorClub || 'Cluster 05'}</span>
                  <span>•</span>
                  <span>{new Date(publication.submittedAt).toLocaleDateString()}</span>
                  {publication.readTimeMinutes && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-[#D95F7F]" />
                        {publication.readTimeMinutes} min read
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Summary */}
              {publication.summary && (
                <div className="p-4 rounded-2xl bg-[#FAF2EB]/60 border border-[#F4E5DA] text-xs sm:text-sm text-[#3E1028] leading-relaxed">
                  <strong>Overview:</strong> {publication.summary}
                </div>
              )}

              {/* Article Content */}
              {publication.content && (
                <div className="text-[#3E1028] leading-relaxed space-y-4 text-xs sm:text-base">
                  {publication.content.split('\n\n').map((para, i) => {
                    if (para.startsWith('### ')) {
                      return <h3 key={i} className="font-serif text-base sm:text-lg font-bold text-[#3E1028] mt-6 mb-2">{para.replace('### ', '')}</h3>;
                    }
                    if (para.startsWith('> ')) {
                      return (
                        <blockquote key={i} className="p-3.5 sm:p-4 rounded-xl bg-[#FAF2EB] border-l-4 border-[#D95F7F] text-[#3E1028] italic text-xs sm:text-sm my-4">
                          {para.replace('> ', '')}
                        </blockquote>
                      );
                    }
                    return <p key={i}>{para}</p>;
                  })}
                </div>
              )}

              {/* Tags */}
              {publication.tags && publication.tags.length > 0 && (
                <div className="pt-6 border-t border-[#F4E5DA] flex flex-wrap gap-1.5">
                  {publication.tags.map((tag) => (
                    <span key={tag} className="px-3 py-1 rounded-full bg-[#FAF2EB] text-[#D95F7F] text-xs font-bold border border-[#F4E5DA]">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

