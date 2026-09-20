import React, { useState, useRef } from 'react';
import { 
  X, 
  PlusCircle, 
  FileText, 
  CheckCircle2, 
  Upload,
  FileType,
  Trash2
} from 'lucide-react';
import { Publication, PublicationType, UserAccount } from '../types';

interface SubmitPublicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (pub: Omit<Publication, 'id' | 'status' | 'submittedAt' | 'views' | 'likes'>, rawFile?: File | null) => Promise<any> | void;
  currentUser?: UserAccount | null;
}

const DEFAULT_COVER = '/campaign-poster.jpg';

export const SubmitPublicationModal: React.FC<SubmitPublicationModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  currentUser,
}) => {
  const [type, setType] = useState<PublicationType>('pdf');
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [authorName, setAuthorName] = useState(() => currentUser?.name || '');
  const [authorEmail, setAuthorEmail] = useState(() => currentUser?.email || '');
  const [authorClub, setAuthorClub] = useState(() => currentUser?.club || '');
  const [summary, setSummary] = useState('');
  const [embedUrl, setEmbedUrl] = useState('');
  const [content, setContent] = useState('');

  // Update prefill when user changes or modal opens
  React.useEffect(() => {
    if (currentUser && isOpen) {
      if (!authorName) setAuthorName(currentUser.name || '');
      if (!authorEmail) setAuthorEmail(currentUser.email || '');
      if (!authorClub) setAuthorClub(currentUser.club || '');
    }
  }, [currentUser, isOpen]);
  
  // File upload states
  const [rawFile, setRawFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [fileData, setFileData] = useState<string>('');
  const [fileSourceMode, setFileSourceMode] = useState<'upload' | 'link'>('upload');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [submissionId, setSubmissionId] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size (< 25MB)
    if (file.size > 25 * 1024 * 1024) {
      alert('File size exceeds 25MB limit. Please upload a smaller file or provide a cloud link.');
      return;
    }

    const lowerName = file.name.toLowerCase();
    if (!lowerName.endsWith('.pdf') && file.type !== 'application/pdf') {
      alert('Please upload a PDF document (.pdf). Only PDF format is accepted for publication.');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setType('pdf');
    setRawFile(file);
    setFileName(file.name);
    setFileSize(`${(file.size / (1024 * 1024)).toFixed(2)} MB`);

    if (!title.trim()) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setFileData(result);
    };
    reader.readAsDataURL(file);
  };

  const handleClearFile = () => {
    setRawFile(null);
    setFileName('');
    setFileSize('');
    setFileData('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !authorName.trim() || !authorEmail.trim() || !summary.trim()) {
      alert('Please fill in all required fields (Title, Author Name, Email, Summary).');
      return;
    }

    if (fileSourceMode === 'upload' && !fileName) {
      alert('Please select a PDF (.pdf) document to upload.');
      return;
    }
    if (fileSourceMode === 'link' && !embedUrl.trim()) {
      alert('Please provide a valid document link.');
      return;
    }

    const generatedId = `SUB-${Math.floor(100000 + Math.random() * 900000)}`;
    setIsSubmitting(true);
    setSubmitError('');

    try {
      let finalFileData = fileData;
      if (!finalFileData && rawFile) {
        finalFileData = await new Promise<string>((resolve) => {
          const r = new FileReader();
          r.onload = (ev) => resolve((ev.target?.result as string) || '');
          r.onerror = () => resolve('');
          r.readAsDataURL(rawFile);
        });
      }

      await onSubmit({
        authorId: currentUser?.id,
        title: title.trim(),
        subtitle: subtitle.trim() || undefined,
        authorName: authorName.trim(),
        authorEmail: authorEmail.trim(),
        authorClub: authorClub.trim() || undefined,
        category: 'story',
        type,
        summary: summary.trim(),
        content: content.trim() || undefined,
        embedUrl: embedUrl.trim() || undefined,
        fileName: fileName || undefined,
        fileSize: fileSize || undefined,
        fileData: finalFileData || undefined,
        coverImage: DEFAULT_COVER,
        tags: ['SthreeShakthi', 'Cluster05'],
        readTimeMinutes: Math.max(3, Math.ceil((content.length || summary.length) / 200) + 2)
      }, rawFile);

      setSubmissionId(generatedId);
      setSubmittedSuccess(true);
    } catch (err: any) {
      console.error('Submission error:', err);
      setSubmitError(err?.message || 'An error occurred while saving the submission. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setTitle('');
    setSubtitle('');
    setAuthorName('');
    setAuthorEmail('');
    setAuthorClub('');
    setSummary('');
    setEmbedUrl('');
    setContent('');
    setRawFile(null);
    setFileName('');
    setFileSize('');
    setFileData('');
    setIsSubmitting(false);
    setSubmitError('');
    setSubmittedSuccess(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-[#3E1028]/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl max-h-[92vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-[#F4E5DA]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-[#F4E5DA] bg-[#FAF2EB]">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 pr-2">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl bg-[#D95F7F] text-white flex items-center justify-center shrink-0 shadow-xs">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="font-serif text-sm sm:text-lg font-bold text-[#3E1028] truncate">
                Submit PDF Publication
              </h2>
              <p className="text-[10px] sm:text-[11px] text-[#5C1D3B]/80 truncate">
                Upload your publication document in PDF format (.pdf)
              </p>
            </div>
          </div>

          <button
            onClick={handleReset}
            className="p-1.5 sm:p-2 rounded-xl text-[#5C1D3B] hover:text-[#3E1028] hover:bg-white/80 transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-grow overflow-y-auto p-4 sm:p-6 bg-[#FDF9F6]">
          {submittedSuccess ? (
            /* Success View */
            <div className="text-center py-10 space-y-6 max-w-md mx-auto">
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="font-serif text-2xl font-bold text-[#3E1028]">
                  Submission Received!
                </h3>
                <p className="text-xs sm:text-sm text-[#5C1D3B]/80 leading-relaxed">
                  Thank you for sharing your work with <strong>Project Sthree Shakthi</strong>. Your PDF publication is now in the <strong>Admin Moderation Queue</strong>.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-[#F4E5DA] text-left text-xs space-y-1.5 shadow-xs">
                <div className="text-[#5C1D3B]/60 font-medium">Tracking Reference:</div>
                <div className="font-mono font-bold text-[#D95F7F] text-sm">{submissionId}</div>
                <div className="text-[#5C1D3B]/70 text-[11px] pt-1">
                  Once approved by the Cluster 05 Editorial Board, your publication will appear live on the public feed.
                </div>
              </div>

              <button
                onClick={handleReset}
                className="w-full py-3 rounded-full bg-[#D95F7F] hover:bg-[#BE4465] text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-md shadow-[#D95F7F]/30 cursor-pointer"
              >
                Close & Return to Website
              </button>
            </div>
          ) : (
            /* Submission Form */
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* PDF Document Attachment Section */}
              <div className="p-4 rounded-2xl bg-white border border-[#F4E5DA] space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#3E1028] flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#D95F7F]" />
                    <span>Upload PDF Document (.pdf)</span>
                    <span className="text-[#D95F7F]">*</span>
                  </label>
                  <div className="flex items-center gap-1 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setFileSourceMode('upload')}
                      className={`px-2.5 py-1 rounded-full font-bold cursor-pointer transition-all ${
                        fileSourceMode === 'upload' ? 'bg-[#D95F7F] text-white' : 'text-[#5C1D3B] hover:bg-slate-100'
                      }`}
                    >
                      File Upload
                    </button>
                    <button
                      type="button"
                      onClick={() => setFileSourceMode('link')}
                      className={`px-2.5 py-1 rounded-full font-bold cursor-pointer transition-all ${
                        fileSourceMode === 'link' ? 'bg-[#D95F7F] text-white' : 'text-[#5C1D3B] hover:bg-slate-100'
                      }`}
                    >
                      Cloud Link
                    </button>
                  </div>
                </div>

                {fileSourceMode === 'upload' ? (
                  <div>
                    {fileName ? (
                      <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#FAF2EB] border border-[#F4E5DA]">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[#D95F7F] text-white flex items-center justify-center font-bold text-xs">
                            PDF
                          </div>
                          <div>
                            <div className="text-xs font-bold text-[#3E1028] line-clamp-1">{fileName}</div>
                            <div className="text-[10px] text-emerald-700 font-semibold">{fileSize} • Valid PDF ready for upload</div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleClearFile}
                          className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer"
                          title="Remove file"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-[#F4E5DA] hover:border-[#D95F7F] rounded-2xl p-6 text-center cursor-pointer bg-[#FAF2EB]/40 hover:bg-[#FAF2EB] transition-all space-y-2 group"
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".pdf,application/pdf"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                        <div className="w-10 h-10 rounded-full bg-white text-[#D95F7F] group-hover:scale-110 transition-transform flex items-center justify-center mx-auto shadow-2xs">
                          <Upload className="w-5 h-5" />
                        </div>
                        <div className="text-xs font-bold text-[#3E1028]">
                          Click to select your PDF document (.pdf)
                        </div>
                        <div className="text-[10px] text-[#5C1D3B]/60">
                          Supports PDF files up to 25MB with high-speed rendering
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <input
                      type="url"
                      placeholder="https://drive.google.com/file/d/... or https://onedrive.live.com/..."
                      value={embedUrl}
                      onChange={(e) => setEmbedUrl(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF2EB]/50 border border-[#F4E5DA] text-xs text-[#3E1028] focus:outline-none focus:ring-2 focus:ring-[#D95F7F]/30"
                    />
                    <span className="text-[10px] text-[#5C1D3B]/70">Make sure permissions are set to Anyone with link can view.</span>
                  </div>
                )}
              </div>

              {/* Title & Subtitle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#3E1028]">
                    Publication Title <span className="text-[#D95F7F]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Voices of Sthree Shakthi - Edition 01"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#F4E5DA] text-xs text-[#3E1028] focus:outline-none focus:ring-2 focus:ring-[#D95F7F]/30"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#3E1028]">
                    Subtitle / Edition (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Stories of Women Shaping the Future"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#F4E5DA] text-xs text-[#3E1028] focus:outline-none focus:ring-2 focus:ring-[#D95F7F]/30"
                  />
                </div>
              </div>

              {/* Contributor Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#3E1028]">
                    Author / Contributor Name <span className="text-[#D95F7F]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Amanda Silva"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#F4E5DA] text-xs text-[#3E1028] focus:outline-none focus:ring-2 focus:ring-[#D95F7F]/30"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#3E1028]">
                    Contact Email <span className="text-[#D95F7F]">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. amanda@gmail.com"
                    value={authorEmail}
                    onChange={(e) => setAuthorEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#F4E5DA] text-xs text-[#3E1028] focus:outline-none focus:ring-2 focus:ring-[#D95F7F]/30"
                  />
                </div>
              </div>

              {/* Rotaract Club / Organization */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#3E1028]">
                  Rotaract Club or Community Affiliation (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rotaract Club of Colombo Central / Community Contributor"
                  value={authorClub}
                  onChange={(e) => setAuthorClub(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#F4E5DA] text-xs text-[#3E1028] focus:outline-none focus:ring-2 focus:ring-[#D95F7F]/30"
                />
              </div>

              {/* Summary / Excerpt */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#3E1028]">
                  Short Description / Summary <span className="text-[#D95F7F]">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="A short summary highlighting what this document or publication is about..."
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#F4E5DA] text-xs text-[#3E1028] focus:outline-none focus:ring-2 focus:ring-[#D95F7F]/30"
                />
              </div>

              {/* Full Blog / Story Text */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-[#3E1028]">
                    Blog Story / Article Body <span className="text-slate-400 font-normal">(Optional for documents)</span>
                  </label>
                  <span className="text-[10px] text-[#5C1D3B]/70">Supports Markdown & Paragraphs</span>
                </div>
                <textarea
                  rows={6}
                  placeholder="Paste or write the full text of your blog/article here so visitors can read it directly online..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#F4E5DA] text-xs text-[#3E1028] focus:outline-none focus:ring-2 focus:ring-[#D95F7F]/30 leading-relaxed font-sans"
                />
              </div>

              {submitError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                  ⚠️ {submitError}
                </div>
              )}

              {/* Submit CTA */}
              <div className="pt-4 border-t border-[#F4E5DA] flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleReset}
                  className="px-5 py-2.5 rounded-full text-xs font-bold text-[#5C1D3B] hover:bg-slate-100 disabled:opacity-50 text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center justify-center gap-2 px-6 py-3 sm:py-2.5 rounded-full text-xs font-bold text-white bg-[#D95F7F] hover:bg-[#BE4465] disabled:opacity-60 shadow-md shadow-[#D95F7F]/30 transition-all hover:scale-102"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <PlusCircle className="w-4 h-4" />
                      <span>Submit Document for Approval</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          )}
        </div>
      </div>
    </div>
  );
};

