import React, { useState, useMemo } from 'react';
import { 
  BookOpen, 
  Search, 
  Filter, 
  PlusCircle, 
  Sparkles, 
  FileText, 
  ArrowRight
} from 'lucide-react';
import { Publication, PublicationCategory } from '../types';
import { PublicationCard } from './PublicationCard';

interface PublicationsFeedProps {
  publications: Publication[];
  onOpenViewer: (publication: Publication) => void;
  onOpenSubmitModal: () => void;
  onLike: (id: string, e: React.MouseEvent) => void;
}

export const PublicationsFeed: React.FC<PublicationsFeedProps> = ({
  publications,
  onOpenViewer,
  onOpenSubmitModal,
  onLike,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');

  const filteredPublications = useMemo(() => {
    return publications.filter((pub) => {
      // Type filter
      if (selectedType !== 'all') {
        if (selectedType === 'pdf') {
          if (pub.type !== 'pdf' && pub.type !== 'drive') return false;
        } else if (pub.type !== selectedType) {
          return false;
        }
      }
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchTitle = pub.title.toLowerCase().includes(query);
        const matchSubtitle = pub.subtitle?.toLowerCase().includes(query);
        const matchAuthor = pub.authorName.toLowerCase().includes(query);
        const matchSummary = pub.summary.toLowerCase().includes(query);
        const matchClub = pub.authorClub?.toLowerCase().includes(query);
        if (!matchTitle && !matchSubtitle && !matchAuthor && !matchSummary && !matchClub) {
          return false;
        }
      }
      return true;
    });
  }, [publications, selectedType, searchQuery]);

  const featuredPub = useMemo(() => {
    return publications.find(p => p.isFeatured) || publications[0];
  }, [publications]);

  return (
    <section id="publications" className="py-16 lg:py-24 bg-[#FAF2EB]/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-3 max-w-2xl text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#FAF2EB] text-[#D95F7F] text-xs font-bold uppercase tracking-wider border border-[#F4E5DA]">
              <BookOpen className="w-3.5 h-3.5 text-[#D95F7F]" />
              <span>Community Publications</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-5xl font-bold text-[#3E1028] tracking-tight">
              PDF Documents & <span className="italic font-normal text-[#D95F7F]">Word Articles</span>
            </h2>
            <p className="text-sm sm:text-base text-[#5C1D3B]/80 leading-relaxed font-normal">
              Explore community-submitted PDF resources, project documents, and Word articles published across Cluster 05.
            </p>
          </div>

          {/* Submit Action */}
          <button
            onClick={onOpenSubmitModal}
            className="self-start md:self-auto flex items-center gap-2 px-6 py-3.5 rounded-full text-xs sm:text-sm font-bold text-white bg-[#D95F7F] hover:bg-[#BE4465] shadow-lg shadow-[#D95F7F]/30 hover:scale-102 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Submit Blog</span>
          </button>
        </div>

        {/* Featured Spotlight Banner (if available) */}
        {featuredPub && (
          <div 
            onClick={() => onOpenViewer(featuredPub)}
            className="cursor-pointer group relative rounded-[32px] overflow-hidden bg-[#3E1028] text-white shadow-xl shadow-[#3E1028]/20 mb-12 border border-[#5C1D3B]"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 sm:p-10 items-center">
              <div className="lg:col-span-7 space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-[#D95F7F] text-white text-[11px] font-extrabold uppercase tracking-wider">
                    ★ Featured Publication
                  </span>
                  <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[#F8CAD5] text-[11px] font-semibold border border-white/10">
                    {featuredPub.type === 'word' ? 'Word Document (.docx)' : 'PDF Document'}
                  </span>
                </div>

                <h3 className="font-serif text-2xl sm:text-4xl font-bold text-white leading-tight">
                  {featuredPub.title}
                </h3>

                {featuredPub.subtitle && (
                  <p className="text-sm sm:text-base text-[#F8CAD5] font-medium">
                    {featuredPub.subtitle}
                  </p>
                )}

                <p className="text-xs sm:text-sm text-[#FAF2EB]/80 leading-relaxed line-clamp-3">
                  {featuredPub.summary}
                </p>

                <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-[#F8CAD5]/80">
                  <span className="font-bold text-white">By {featuredPub.authorName}</span>
                  {featuredPub.authorClub && (
                    <>
                      <span>•</span>
                      <span>{featuredPub.authorClub}</span>
                    </>
                  )}
                  {featuredPub.fileName && (
                    <>
                      <span>•</span>
                      <span className="font-mono text-[#FAF2EB]">📎 {featuredPub.fileName}</span>
                    </>
                  )}
                </div>

                <div className="pt-2">
                  <button className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white text-[#3E1028] font-bold text-xs uppercase tracking-wider group-hover:bg-[#FAF2EB] transition-colors shadow-md">
                    <span>View Blog</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>

              <div className="lg:col-span-5 aspect-[16/10] lg:aspect-[4/3] rounded-2xl overflow-hidden border border-white/20 shadow-2xl relative">
                {Boolean(featuredPub.coverImage) && 
                 featuredPub.coverImage !== '/campaign-poster.jpg' && 
                 !featuredPub.coverImage.includes('campaign-poster') ? (
                  <>
                    <img
                      src={featuredPub.coverImage}
                      alt={featuredPub.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#3E1028]/80 via-transparent to-transparent" />
                  </>
                ) : (
                  <div className={`w-full h-full p-8 flex flex-col items-center justify-center relative overflow-hidden transition-all duration-500 ${
                    featuredPub.type === 'word'
                      ? 'bg-gradient-to-br from-[#1E3A8A] via-[#1E40AF] to-[#3B82F6]'
                      : 'bg-gradient-to-br from-[#5C1D3B] via-[#7E253E] to-[#D95F7F]'
                  }`}>
                    <div className="w-24 h-32 rounded-2xl bg-white shadow-2xl flex flex-col p-3 space-y-2 group-hover:scale-105 transition-transform duration-500">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white ${
                        featuredPub.type === 'word' ? 'bg-blue-600' : 'bg-[#D95F7F]'
                      }`}>
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="space-y-1.5 pt-1">
                        <div className="h-2 w-full bg-slate-200 rounded-full" />
                        <div className="h-2 w-4/5 bg-slate-200 rounded-full" />
                        <div className="h-2 w-3/5 bg-slate-200 rounded-full" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Filter Controls Bar */}
        <div className="p-4 rounded-3xl bg-white border border-[#F4E5DA] shadow-xs space-y-4 mb-8">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            
            {/* Search Input */}
            <div className="relative flex-grow max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="Search publications by title, author, or keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#FAF2EB]/50 border border-[#F4E5DA] text-xs sm:text-sm text-[#3E1028] focus:outline-none focus:ring-2 focus:ring-[#D95F7F]/30"
              />
            </div>

            {/* Type Filter Buttons */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setSelectedType('all')}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                  selectedType === 'all'
                    ? 'bg-[#3E1028] text-white shadow-xs'
                    : 'bg-[#FAF2EB]/60 text-[#5C1D3B] hover:bg-[#FAF2EB]'
                }`}
              >
                All Documents ({publications.length})
              </button>
              <button
                onClick={() => setSelectedType('pdf')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                  selectedType === 'pdf'
                    ? 'bg-[#D95F7F] text-white shadow-xs'
                    : 'bg-[#FAF2EB]/60 text-[#5C1D3B] hover:bg-[#FAF2EB]'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                PDFs ({publications.filter(p => p.type === 'pdf' || p.type === 'drive').length})
              </button>
              <button
                onClick={() => setSelectedType('word')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                  selectedType === 'word'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-[#FAF2EB]/60 text-[#5C1D3B] hover:bg-[#FAF2EB]'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Word Docs ({publications.filter(p => p.type === 'word').length})
              </button>
            </div>

          </div>
        </div>

        {/* Publications Grid */}
        {filteredPublications.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPublications.map((pub) => (
              <PublicationCard
                key={pub.id}
                publication={pub}
                onOpenViewer={onOpenViewer}
                onLike={onLike}
              />
            ))}
          </div>
        ) : (
          /* Clean Empty State */
          <div className="text-center py-16 px-4 rounded-[32px] bg-white border border-[#F4E5DA] space-y-4 shadow-sm">
            <div className="w-16 h-16 rounded-3xl bg-[#FAF2EB] text-[#D95F7F] flex items-center justify-center mx-auto shadow-inner">
              <BookOpen className="w-8 h-8" />
            </div>
            <h3 className="font-serif text-xl font-bold text-[#3E1028]">
              No Live Publications Yet
            </h3>
            <p className="text-xs text-[#5C1D3B]/70 max-w-md mx-auto leading-relaxed">
              Upload a <strong>PDF document</strong>, <strong>Word file (.docx)</strong>, <strong>3D Flipbook</strong>, or <strong>written blog</strong>. Once approved by the admin, it will be published live here!
            </p>
            <div className="pt-2">
              <button
                onClick={onOpenSubmitModal}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs font-bold text-white bg-[#D95F7F] hover:bg-[#BE4465] shadow-md shadow-[#D95F7F]/30"
              >
                <PlusCircle className="w-4 h-4" />
                Submit First Publication
              </button>
            </div>
          </div>
        )}

      </div>
    </section>
  );
};
