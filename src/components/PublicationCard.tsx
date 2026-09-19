import React from 'react';
import { 
  BookOpen, 
  FileText, 
  ExternalLink, 
  Eye, 
  Heart, 
  Clock, 
  Sparkles,
  Share2
} from 'lucide-react';
import { Publication, PublicationCategory } from '../types';
import { storageService } from '../services/storageService';

interface PublicationCardProps {
  publication: Publication;
  onOpenViewer: (publication: Publication) => void;
  onLike: (id: string, e: React.MouseEvent) => void;
}

export const PublicationCard: React.FC<PublicationCardProps> = ({
  publication,
  onOpenViewer,
  onLike,
}) => {
  const getTypeBadge = (type: Publication['type']) => {
    switch (type) {
      case 'word':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-600/90 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider border border-white/20 shadow-xs">
            <FileText className="w-3 h-3 text-blue-100" />
            Word Doc
          </span>
        );
      case 'pdf':
      case 'drive':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#D95F7F]/95 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider border border-white/20 shadow-xs">
            <FileText className="w-3 h-3 text-white" />
            PDF Document
          </span>
        );
    }
  };

  const isWord = publication.type === 'word' || 
    (Boolean(publication.fileName) && (
      publication.fileName!.toLowerCase().endsWith('.docx') || 
      publication.fileName!.toLowerCase().endsWith('.doc')
    ));

  const hasCustomCover = Boolean(publication.coverImage) && 
    publication.coverImage !== '/campaign-poster.jpg' && 
    !publication.coverImage.includes('campaign-poster');

  return (
    <div 
      onClick={() => onOpenViewer(publication)}
      className="group cursor-pointer rounded-3xl bg-white border border-[#F4E5DA] shadow-xs hover:shadow-xl hover:shadow-[#D95F7F]/10 transition-all duration-300 flex flex-col overflow-hidden hover:-translate-y-1.5 touch-manipulation active:scale-[0.98] select-none"
    >
      {/* Cover Container (Image or Dynamic Editorial Document Cover) */}
      <div className="relative aspect-[16/10] w-full overflow-hidden">
        {hasCustomCover ? (
          <>
            <img
              src={publication.coverImage}
              alt={publication.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
          </>
        ) : (
          /* Dynamic Aesthetic Document Cover for PDF / Word files without cover photos */
          <div className={`w-full h-full p-6 flex flex-col justify-between relative overflow-hidden transition-all duration-500 ${
            isWord 
              ? 'bg-gradient-to-br from-[#F0F7FF] via-[#E0EFFF] to-[#C7E2FE] text-[#1E3A8A]' 
              : 'bg-gradient-to-br from-[#FFF5F8] via-[#FCE7EC] to-[#F8CAD5] text-[#5C1D3B]'
          }`}>
            {/* Background Ambient Paper & Grid Patterns */}
            <div className="absolute -right-8 -bottom-8 w-36 h-36 rounded-full bg-white/40 blur-xl pointer-events-none" />
            
            {/* Center Floating Document Mockup Emblem */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-90 group-hover:scale-105 transition-transform duration-500">
              <div className="w-16 h-20 rounded-xl bg-white shadow-md border border-white/80 flex flex-col p-2 space-y-1.5">
                <div className={`w-6 h-6 rounded-md flex items-center justify-center text-white ${
                  isWord ? 'bg-blue-600' : 'bg-[#D95F7F]'
                }`}>
                  <FileText className="w-3.5 h-3.5" />
                </div>
                <div className="space-y-1 pt-1">
                  <div className="h-1.5 w-full bg-slate-200 rounded-full" />
                  <div className="h-1.5 w-3/4 bg-slate-200 rounded-full" />
                  <div className="h-1.5 w-1/2 bg-slate-200 rounded-full" />
                </div>
              </div>
            </div>

            {/* Subtle Gradient Shadow for bottom metadata */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />
          </div>
        )}

        {/* Top Badges */}
        <div className="absolute top-3.5 left-3.5 flex items-center gap-1.5 z-10">
          {getTypeBadge(publication.type)}
          {publication.isFeatured && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500 text-white text-[10px] font-black uppercase tracking-wider shadow-sm">
              ★ Featured
            </span>
          )}
        </div>

        {/* Read Time & File Name */}
        <div className="absolute bottom-3 left-3.5 right-3.5 flex items-center justify-between text-white text-xs z-10">
          {publication.fileName ? (
            <span className="font-mono text-[10px] bg-black/50 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/20 truncate max-w-[180px]">
              📎 {publication.fileName}
            </span>
          ) : (
            <span />
          )}
          {publication.readTimeMinutes && (
            <span className="flex items-center gap-1 text-[11px] font-medium bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/10">
              <Clock className="w-3 h-3" />
              {publication.readTimeMinutes} min read
            </span>
          )}
        </div>
      </div>

      {/* Card Body */}
      <div className="p-6 flex flex-col flex-grow justify-between space-y-4">
        <div className="space-y-2">
          <h3 className="text-base font-bold text-slate-900 font-display group-hover:text-brand-700 transition-colors line-clamp-2 leading-snug">
            {publication.title}
          </h3>

          {publication.subtitle && (
            <p className="text-xs font-semibold text-rosepink-600 line-clamp-1">
              {publication.subtitle}
            </p>
          )}

          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed font-normal">
            {publication.summary}
          </p>
        </div>

        {/* Author & Footer Actions */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <div className="truncate max-w-[170px]">
            <div className="font-bold text-slate-800 truncate">{publication.authorName}</div>
            <div className="text-[10px] text-slate-400 truncate">
              {publication.authorClub || 'Community Contributor'}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {(() => {
              const isLikedByMe = storageService.hasUserLiked(publication.id);
              return (
                <button
                  type="button"
                  onClick={(e) => onLike(publication.id, e)}
                  className={`flex items-center gap-1.5 transition-all px-2 py-1 rounded-full ${
                    isLikedByMe 
                      ? 'text-[#D95F7F] bg-rose-50 hover:bg-rose-100 font-bold' 
                      : 'text-slate-400 hover:text-[#D95F7F] hover:bg-rose-50/60'
                  }`}
                  title={isLikedByMe ? 'Unlike this publication' : 'Like this publication'}
                >
                  <Heart className={`w-4 h-4 transition-transform active:scale-130 ${
                    isLikedByMe 
                      ? 'text-[#D95F7F] fill-[#D95F7F]' 
                      : 'text-slate-400'
                  }`} />
                  <span className="text-xs font-semibold">{publication.likes || 0}</span>
                </button>
              );
            })()}

            <span className="flex items-center gap-1 text-slate-400 p-1">
              <Eye className="w-3.5 h-3.5" />
              <span className="text-[11px]">{publication.views || 0}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
