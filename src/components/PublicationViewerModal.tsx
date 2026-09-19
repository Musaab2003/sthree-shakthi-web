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
  Download
} from 'lucide-react';
import { Publication } from '../types';
import { parseDocumentOrFlipbookUrl } from '../utils/embedHelper';
import { storageService } from '../services/storageService';

interface PublicationViewerModalProps {
  publication: Publication | null;
  onClose: () => void;
  onLike: (id: string, e: React.MouseEvent) => void;
}

export const PublicationViewerModal: React.FC<PublicationViewerModalProps> = ({
  publication,
  onClose,
  onLike,
}) => {
  const [copiedToast, setCopiedToast] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [loadedFileData, setLoadedFileData] = useState<string | null>(null);
  const [likesCount, setLikesCount] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    // Reset iframe load state when publication changes
    setIframeLoaded(false);
    setLoadedFileData(publication?.fileData || null);
    setLikesCount(publication?.likes || 0);
    setHasLiked(publication ? storageService.hasUserLiked(publication.id) : false);
    setCopiedToast(false);

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

  if (!publication) return null;

  const currentFileData = loadedFileData || publication.fileData;

  const parsed = publication.embedUrl 
    ? parseDocumentOrFlipbookUrl(publication.embedUrl) 
    : null;

  const handleShareClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: publication.title,
          text: `Check out "${publication.title}" on Project Sthree Shakthi`,
          url: shareUrl,
        });
        return;
      } catch (err) {}
    }
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2500);
    }
  };

  const handleHeartClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const result = storageService.toggleLikePublication(publication.id);
    setLikesCount(result.likes);
    setHasLiked(result.isLiked);
    onLike(publication.id, e);
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

  return (
    <div className={`fixed inset-0 z-[70] flex items-center justify-center bg-[#3E1028]/85 backdrop-blur-md animate-in fade-in duration-200 ${
      isFullScreen ? 'p-0 sm:p-2' : 'p-2 sm:p-4 md:p-6'
    }`}>
      <div 
        className={`relative w-full flex flex-col overflow-hidden bg-white shadow-2xl transition-all duration-300 border border-[#F4E5DA] ${
          isFullScreen ? 'h-full w-full max-w-[1920px] rounded-none sm:rounded-3xl' : 'max-w-5xl h-[92vh] rounded-[32px]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Share notification banner */}
        {copiedToast && (
          <div className="absolute top-16 right-6 z-50 px-4 py-2 rounded-2xl bg-[#3E1028] text-white text-xs font-bold shadow-xl border border-[#D95F7F] flex items-center gap-2 animate-in slide-in-from-top duration-200">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>Link copied to clipboard!</span>
          </div>
        )}

        {/* Modal Top Navigation Bar */}
        <div className="flex items-center justify-between px-3.5 sm:px-6 py-3 sm:py-4 border-b border-[#F4E5DA] bg-[#FAF2EB] gap-2">
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
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {publication.embedUrl && (
              <a
                href={publication.embedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex items-center gap-1 px-3 py-1.5 sm:py-2 rounded-full text-xs font-bold text-[#3E1028] bg-white hover:bg-slate-100 border border-[#F4E5DA] shadow-2xs"
                title="Open original source in new tab"
              >
                <ExternalLink className="w-3.5 h-3.5 text-[#D95F7F]" />
                <span className="hidden md:inline">Open Link</span>
              </a>
            )}

            {/* Share Button */}
            <button
              type="button"
              onClick={handleShareClick}
              className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-full text-xs font-bold border transition-all shadow-2xs hover:scale-105 active:scale-95 ${
                copiedToast 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300' 
                  : 'bg-white text-[#3E1028] hover:bg-slate-100 border-[#F4E5DA]'
              }`}
              title="Share publication"
            >
              {copiedToast ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5 text-[#D95F7F]" />}
              <span className="hidden md:inline">{copiedToast ? 'Copied' : 'Share'}</span>
            </button>

            {/* Heart Like Button */}
            <button
              type="button"
              onClick={handleHeartClick}
              className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-full text-xs font-bold transition-all shadow-2xs border hover:scale-105 active:scale-95 ${
                hasLiked || likesCount > 0
                  ? 'bg-rose-50 text-[#D95F7F] border-[#D95F7F]/40'
                  : 'bg-white text-[#D95F7F] hover:bg-rose-50 border-[#F4E5DA]'
              }`}
              title="Like this publication"
            >
              <Heart className={`w-3.5 h-3.5 transition-transform ${hasLiked ? 'scale-125 fill-[#D95F7F] text-[#D95F7F]' : likesCount > 0 ? 'fill-[#D95F7F] text-[#D95F7F]' : ''}`} />
              <span className="text-xs">{likesCount}</span>
            </button>

            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="p-1.5 sm:p-2 rounded-full text-[#5C1D3B] hover:text-[#3E1028] hover:bg-white/80 transition-colors"
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
              className="p-1.5 sm:p-2 rounded-full text-[#5C1D3B] hover:text-[#3E1028] hover:bg-white/80 transition-colors"
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
            <div className="flex-grow p-6 sm:p-10 flex flex-col items-center justify-center space-y-6 max-w-2xl mx-auto w-full">
              
              <div className="w-20 h-20 rounded-3xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-inner">
                <FileType className="w-10 h-10" />
              </div>

              <div className="space-y-2 text-center">
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-extrabold uppercase tracking-wider border border-blue-200">
                  <FileType className="w-3.5 h-3.5" />
                  Microsoft Word Document (.docx / .doc)
                </span>
                <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#3E1028] pt-1">
                  {publication.title}
                </h3>
                {publication.subtitle && (
                  <p className="text-sm font-semibold text-[#D95F7F]">
                    {publication.subtitle}
                  </p>
                )}
              </div>

              {/* Document Details Card */}
              <div className="w-full bg-white p-5 rounded-2xl border border-[#F4E5DA] shadow-xs space-y-3 text-xs">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-[#F4E5DA]">
                  <div>
                    <div className="text-[#5C1D3B]/60 text-[10px] font-bold uppercase">Attached Document</div>
                    <div className="font-mono font-bold text-slate-800 text-sm">{publication.fileName || `${publication.title}.docx`}</div>
                  </div>
                  {publication.fileSize && (
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 font-mono text-xs font-semibold">
                      {publication.fileSize}
                    </span>
                  )}
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
              <div className="w-full bg-white p-5 rounded-2xl border border-[#F4E5DA] text-left space-y-1.5 shadow-xs">
                <div className="text-[11px] font-bold text-[#D95F7F] uppercase tracking-wider">
                  Summary & Notes
                </div>
                <p className="text-xs sm:text-sm text-[#5C1D3B]/90 leading-relaxed">
                  {publication.summary}
                </p>
              </div>

              {/* Reading Status & Cloud Link (If available) */}
              {publication.embedUrl && (
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2 w-full">
                  <a
                    href={publication.embedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-8 py-3.5 rounded-full text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/30 transition-all hover:scale-102"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>View Word Document Online</span>
                  </a>
                </div>
              )}
            </div>
          ) : isPdfType && (currentFileData || parsed?.embedUrl) ? (
            /* 2. PDF Viewer Mode */
            <div className="w-full flex-grow flex flex-col h-[60vh] sm:h-[70vh] min-h-[360px] relative bg-slate-900">
              <iframe
                src={currentFileData || parsed?.embedUrl}
                title={publication.title}
                className="w-full flex-grow h-full border-0 bg-white"
                allow="fullscreen"
                onLoad={() => setIframeLoaded(true)}
              />
              <div className="bg-slate-900 text-slate-300 text-xs px-4 sm:px-6 py-2.5 flex items-center justify-between border-t border-slate-800">
                <span className="text-[11px] text-[#F8CAD5] truncate">
                  📄 Reading Blog: {publication.title}
                </span>
                <span className="text-[10px] text-slate-400">
                  Cluster 05 Document Viewer
                </span>
              </div>
            </div>
          ) : isFlipbookType && parsed?.embedUrl ? (
            /* 2. 3D Flipbook Mode */
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
                  className="text-[#F8CAD5] hover:text-white text-[11px] font-bold flex items-center gap-1"
                >
                  Fullscreen External Reader <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ) : (
            /* 3. Word Document / Written Article Mode */
            <div className="max-w-3xl mx-auto w-full px-6 py-8 space-y-6 bg-white my-4 rounded-3xl shadow-sm border border-[#F4E5DA]">
              
              {/* Word Document Banner if applicable */}
              {isWordType && (
                <div className="p-4 rounded-2xl bg-[#FAF2EB] border border-[#F4E5DA] flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                      DOC
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-[#3E1028]">
                        {publication.fileName || `${publication.title}.docx`}
                      </h4>
                      <p className="text-[11px] text-[#5C1D3B]/70">
                        {publication.fileSize || 'Word Document'} • Ready for full reading & download
                      </p>
                    </div>
                  </div>

                  {publication.fileData ? (
                    <a
                      href={publication.fileData}
                      download={publication.fileName || `${publication.title}.docx`}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Document</span>
                    </a>
                  ) : publication.embedUrl ? (
                    <a
                      href={publication.embedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md transition-all"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open Document</span>
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
                <h1 className="font-serif text-2xl sm:text-4xl font-bold text-[#3E1028] leading-tight">
                  {publication.title}
                </h1>
                
                {publication.subtitle && (
                  <p className="text-base text-[#D95F7F] font-medium">
                    {publication.subtitle}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-4 text-xs text-[#5C1D3B]/80 pt-2">
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
              <div className="p-4 rounded-2xl bg-[#FAF2EB]/60 border border-[#F4E5DA] text-xs sm:text-sm text-[#3E1028] leading-relaxed">
                <strong>Overview:</strong> {publication.summary}
              </div>

              {/* Article Content */}
              {publication.content && (
                <div className="text-[#3E1028] leading-relaxed space-y-4 text-sm sm:text-base">
                  {publication.content.split('\n\n').map((para, i) => {
                    if (para.startsWith('### ')) {
                      return <h3 key={i} className="font-serif text-lg font-bold text-[#3E1028] mt-6 mb-2">{para.replace('### ', '')}</h3>;
                    }
                    if (para.startsWith('> ')) {
                      return (
                        <blockquote key={i} className="p-4 rounded-xl bg-[#FAF2EB] border-l-4 border-[#D95F7F] text-[#3E1028] italic text-sm my-4">
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

