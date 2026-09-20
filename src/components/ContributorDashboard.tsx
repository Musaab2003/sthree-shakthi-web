import React, { useState } from 'react';
import { 
  X, 
  User, 
  BookOpen, 
  FileText, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  PlusCircle, 
  LogOut, 
  Eye, 
  Building, 
  Mail, 
  Trash2, 
  Sparkles,
  ExternalLink,
  Heart
} from 'lucide-react';
import { Publication, UserAccount, PublicationStatus } from '../types';
import { storageService } from '../services/storageService';

interface ContributorDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount | null;
  publications: Publication[];
  onOpenSubmitModal: () => void;
  onOpenViewer: (pub: Publication) => void;
  onLogout: () => void;
  onDeleteSubmission?: (id: string) => void;
}

export const ContributorDashboard: React.FC<ContributorDashboardProps> = ({
  isOpen,
  onClose,
  currentUser,
  publications,
  onOpenSubmitModal,
  onOpenViewer,
  onLogout,
  onDeleteSubmission
}) => {
  const [activeTab, setActiveTab] = useState<'all' | PublicationStatus>('all');

  if (!isOpen || !currentUser) return null;

  // Filter publications by current user email
  const userPubs = publications.filter(
    p => (p.authorEmail || '').trim().toLowerCase() === currentUser.email.trim().toLowerCase()
  );

  const pendingPubs = userPubs.filter(p => p.status === 'pending');
  const approvedPubs = userPubs.filter(p => p.status === 'approved');
  const rejectedPubs = userPubs.filter(p => p.status === 'rejected');

  const filteredPubs = userPubs.filter(p => {
    if (activeTab === 'all') return true;
    return p.status === activeTab;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-[#3E1028]/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-4xl max-h-[92vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-[#F4E5DA]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Strip */}
        <div className="flex items-center justify-between px-5 sm:px-8 py-4 border-b border-[#F4E5DA] bg-[#FAF2EB]">
          <div className="flex items-center gap-3 min-w-0 pr-2">
            <div className="w-10 h-10 rounded-2xl bg-[#D95F7F] text-white flex items-center justify-center font-bold text-sm uppercase shrink-0 shadow-xs">
              {currentUser.name.slice(0, 2)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-base sm:text-lg font-bold text-[#3E1028] truncate">
                  {currentUser.name}
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-[#D95F7F]/15 text-[#D95F7F] text-[10px] font-bold border border-[#D95F7F]/30 shrink-0">
                  Author Dashboard
                </span>
              </div>
              <p className="text-[11px] text-[#5C1D3B]/70 truncate flex items-center gap-2">
                <span>{currentUser.email}</span>
                {currentUser.club && <span>• {currentUser.club}</span>}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-slate-600 hover:text-rose-700 bg-white hover:bg-rose-50 border border-[#F4E5DA] transition-colors"
              title="Sign out from account"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-white/80 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Overview Metric Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 sm:p-6 bg-white border-b border-[#F4E5DA]">
          <button 
            type="button"
            onClick={() => setActiveTab('all')}
            className={`p-3.5 rounded-2xl border transition-all text-left ${
              activeTab === 'all' ? 'bg-[#FAF2EB] border-[#D95F7F] ring-2 ring-[#D95F7F]/20' : 'bg-[#FAF2EB]/40 border-[#F4E5DA]'
            }`}
          >
            <div className="text-[10px] font-bold uppercase text-[#5C1D3B]/70">Total Submissions</div>
            <div className="font-serif text-2xl font-bold text-[#3E1028] pt-1">{userPubs.length}</div>
          </button>

          <button 
            type="button"
            onClick={() => setActiveTab('approved')}
            className={`p-3.5 rounded-2xl border transition-all text-left ${
              activeTab === 'approved' ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-400/20' : 'bg-[#FAF2EB]/40 border-[#F4E5DA]'
            }`}
          >
            <div className="text-[10px] font-bold uppercase text-emerald-800">Approved & Live</div>
            <div className="font-serif text-2xl font-bold text-emerald-700 pt-1">{approvedPubs.length}</div>
          </button>

          <button 
            type="button"
            onClick={() => setActiveTab('pending')}
            className={`p-3.5 rounded-2xl border transition-all text-left ${
              activeTab === 'pending' ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-400/20' : 'bg-[#FAF2EB]/40 border-[#F4E5DA]'
            }`}
          >
            <div className="text-[10px] font-bold uppercase text-amber-800">Under Review</div>
            <div className="font-serif text-2xl font-bold text-amber-700 pt-1">{pendingPubs.length}</div>
          </button>

          <button 
            type="button"
            onClick={() => setActiveTab('rejected')}
            className={`p-3.5 rounded-2xl border transition-all text-left ${
              activeTab === 'rejected' ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-400/20' : 'bg-[#FAF2EB]/40 border-[#F4E5DA]'
            }`}
          >
            <div className="text-[10px] font-bold uppercase text-rose-800">Needs Changes</div>
            <div className="font-serif text-2xl font-bold text-rose-700 pt-1">{rejectedPubs.length}</div>
          </button>
        </div>

        {/* Action Header & Tabs */}
        <div className="px-5 sm:px-8 py-3 bg-[#FAF2EB]/60 border-b border-[#F4E5DA] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                activeTab === 'all'
                  ? 'bg-[#3E1028] text-white'
                  : 'bg-white text-[#5C1D3B] hover:bg-slate-100 border border-[#F4E5DA]'
              }`}
            >
              All ({userPubs.length})
            </button>
            <button
              onClick={() => setActiveTab('approved')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                activeTab === 'approved'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white text-[#5C1D3B] hover:bg-slate-100 border border-[#F4E5DA]'
              }`}
            >
              Approved ({approvedPubs.length})
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                activeTab === 'pending'
                  ? 'bg-amber-600 text-white'
                  : 'bg-white text-[#5C1D3B] hover:bg-slate-100 border border-[#F4E5DA]'
              }`}
            >
              Pending ({pendingPubs.length})
            </button>
            <button
              onClick={() => setActiveTab('rejected')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                activeTab === 'rejected'
                  ? 'bg-rose-600 text-white'
                  : 'bg-white text-[#5C1D3B] hover:bg-slate-100 border border-[#F4E5DA]'
              }`}
            >
              Rejected ({rejectedPubs.length})
            </button>
          </div>

          <button
            onClick={() => {
              onClose();
              onOpenSubmitModal();
            }}
            className="flex items-center justify-center gap-2 px-5 py-2 rounded-full bg-[#D95F7F] hover:bg-[#BE4465] text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-[#D95F7F]/25 hover:scale-102 transition-all cursor-pointer shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Submit New Blog</span>
          </button>
        </div>

        {/* Submissions List */}
        <div className="flex-grow overflow-y-auto p-4 sm:p-6 space-y-4 bg-[#FDF9F6]">
          {filteredPubs.length > 0 ? (
            filteredPubs.map((pub) => (
              <div
                key={pub.id}
                className={`p-4 sm:p-5 rounded-3xl bg-white border shadow-xs transition-all space-y-3 ${
                  pub.status === 'rejected'
                    ? 'border-rose-300 ring-1 ring-rose-300/40 bg-rose-50/20'
                    : pub.status === 'approved'
                    ? 'border-emerald-200'
                    : 'border-amber-200'
                }`}
              >
                {/* Top status line */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      pub.status === 'approved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : pub.status === 'pending'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      ● {pub.status === 'approved' ? 'Approved & Live' : pub.status === 'pending' ? 'Pending Moderation' : 'Rejected / Needs Revision'}
                    </span>

                    <span className="px-2.5 py-0.5 rounded-full bg-[#FAF2EB] text-[#D95F7F] text-[10px] font-bold">
                      {pub.type === 'word' ? 'Word Document' : 'PDF Document'}
                    </span>

                    {pub.isFeatured && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black uppercase">
                        ★ Featured
                      </span>
                    )}

                    <span className="text-[11px] text-slate-400">
                      Submitted: {new Date(pub.submittedAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-1 sm:pt-0">
                    <button
                      type="button"
                      onClick={() => onOpenViewer(pub)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold text-[#3E1028] bg-[#FAF2EB] hover:bg-[#F4E5DA] border border-[#F4E5DA] transition-all cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#D95F7F]" />
                      <span>{pub.status === 'approved' ? 'View Live' : 'Preview'}</span>
                    </button>

                    {onDeleteSubmission && (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this submission?')) {
                            onDeleteSubmission(pub.id);
                          }
                        }}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete submission"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Publication Details */}
                <div className="space-y-1.5">
                  <h3 className="font-serif text-base sm:text-lg font-bold text-[#3E1028]">
                    {pub.title}
                  </h3>
                  {pub.subtitle && (
                    <p className="text-xs font-semibold text-[#D95F7F]">
                      {pub.subtitle}
                    </p>
                  )}
                  <p className="text-xs text-[#5C1D3B]/80 line-clamp-2 leading-relaxed">
                    {pub.summary}
                  </p>
                  {pub.fileName && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#FAF2EB] text-[#3E1028] text-[11px] font-mono border border-[#F4E5DA]">
                      <span>📎 {pub.fileName}</span>
                      {pub.fileSize && <span className="text-slate-400">({pub.fileSize})</span>}
                    </div>
                  )}
                </div>

                {/* REJECTION REASON BANNER (Prominently displayed to contributor) */}
                {pub.status === 'rejected' && (
                  <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-1 animate-in fade-in">
                    <div className="flex items-center gap-1.5 font-bold text-rose-900">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>Editorial Feedback from Cluster 05 Admin:</span>
                    </div>
                    <p className="text-rose-800/90 pl-5.5 leading-relaxed">
                      {pub.rejectedReason || 'Does not match editorial criteria or requires formatting adjustments.'}
                    </p>
                    <div className="pl-5.5 pt-1 text-[11px] text-rose-700">
                      👉 You may delete this submission and upload an updated revision using the <strong>Submit New Blog</strong> button.
                    </div>
                  </div>
                )}

                {/* Approved Publication Live Stats */}
                {pub.status === 'approved' && (
                  <div className="flex items-center gap-4 text-xs text-slate-500 pt-1">
                    <span className="flex items-center gap-1">
                      <Heart className="w-3.5 h-3.5 text-[#D95F7F] fill-[#D95F7F]" />
                      <span>{pub.likes || 0} Likes</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5 text-slate-400" />
                      <span>{pub.views || 0} Views</span>
                    </span>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-16 px-4 bg-white rounded-3xl border border-[#F4E5DA] space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-[#FAF2EB] text-[#D95F7F] flex items-center justify-center mx-auto shadow-inner">
                <BookOpen className="w-7 h-7" />
              </div>
              <h4 className="font-serif text-base font-bold text-[#3E1028]">
                No Submissions Found in this Filter
              </h4>
              <p className="text-xs text-[#5C1D3B]/70 max-w-sm mx-auto">
                {activeTab === 'all' 
                  ? 'You have not submitted any publications yet. Share your stories or documents with the community!'
                  : `You currently have no ${activeTab} publications.`}
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenSubmitModal();
                  }}
                  className="px-6 py-2.5 rounded-full bg-[#D95F7F] hover:bg-[#BE4465] text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  + Submit Your First Blog
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
