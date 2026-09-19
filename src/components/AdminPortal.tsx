import React, { useState, useEffect } from 'react';
import { 
  X, 
  Lock, 
  Unlock, 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  Star, 
  Eye, 
  EyeOff,
  Clock, 
  BookOpen, 
  FileText, 
  Sparkles, 
  ExternalLink,
  ShieldAlert,
  RotateCcw,
  Search,
  LogOut,
  UserCheck,
  KeyRound,
  Mail,
  ShieldCheck,
  Settings,
  Save,
  Send,
  Copy,
  Download,
  Users,
  Check,
  MailCheck,
  Plus,
  FileSpreadsheet,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { Publication, PublicationStatus, AdminAccount } from '../types';
import { storageService } from '../services/storageService';
import { hashPassword, verifyPassword, generateStrongPassword } from '../utils/crypto';

interface AdminPortalProps {
  isOpen: boolean;
  onClose: () => void;
  publications: Publication[];
  onApprove: (id: string) => void;
  onReject: (id: string, reason?: string) => void;
  onToggleFeature: (id: string) => void;
  onDelete: (id: string) => void;
  onOpenViewer: (pub: Publication) => void;
  onResetSampleData: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  isOpen,
  onClose,
  publications,
  onApprove,
  onReject,
  onToggleFeature,
  onDelete,
  onOpenViewer,
  onResetSampleData,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [activeTab, setActiveTab] = useState<PublicationStatus | 'all' | 'settings' | 'newsletter'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFullScreen, setIsFullScreen] = useState<boolean>(true);

  const [adminAccount, setAdminAccount] = useState<AdminAccount>(storageService.getAdminAccount());
  const [editUsername, setEditUsername] = useState(adminAccount.username);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [liveHashPreview, setLiveHashPreview] = useState('');
  const [copiedGenerated, setCopiedGenerated] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState('');
  const [settingsError, setSettingsError] = useState('');

  // Newsletter & Broadcast State
  const [subscribers, setSubscribers] = useState<string[]>([]);
  const [subscriberSearch, setSubscriberSearch] = useState('');
  const [newSubscriberInput, setNewSubscriberInput] = useState('');
  const [broadcastSubject, setBroadcastSubject] = useState('✨ New Publication Release | Project Sthree Shakthi');
  const [broadcastMessage, setBroadcastMessage] = useState(
    `Hello Sthree Shakthi Community Member,\n\nA new edition has just been published on the Project Sthree Shakthi digital platform by Cluster 05, Rotaract District 3220!\n\n👉 Visit the live platform to view and read the latest publication:\nhttps://localhost:9999/#publications\n\nWarm regards,\nCluster 05 Editorial Board\nRotaract District 3220`
  );
  const [copiedEmailsToast, setCopiedEmailsToast] = useState(false);
  const [copiedBroadcastToast, setCopiedBroadcastToast] = useState(false);
  const [broadcastSuccessToast, setBroadcastSuccessToast] = useState('');
  const [broadcastHistory, setBroadcastHistory] = useState<Array<{ id: string; subject: string; message: string; sentAt: string; recipientCount: number }>>([]);

  useEffect(() => {
    const acc = storageService.getAdminAccount();
    setAdminAccount(acc);
    setEditUsername(acc.username);
    setSubscribers(storageService.getSubscribers());
    setBroadcastHistory(storageService.getBroadcastHistory());
  }, [isOpen]);

  // Compute live hash when newPassword changes
  useEffect(() => {
    if (newPassword.trim()) {
      hashPassword(newPassword.trim()).then(h => setLiveHashPreview(h));
    } else {
      setLiveHashPreview('');
    }
  }, [newPassword]);

  const handleGenerateUniquePassword = async () => {
    const unique = generateStrongPassword(16);
    setNewPassword(unique);
    setConfirmPassword(unique);
    const hash = await hashPassword(unique);
    setLiveHashPreview(hash);
  };

  const handleCopyPassword = () => {
    if (newPassword) {
      navigator.clipboard.writeText(newPassword);
      setCopiedGenerated(true);
      setTimeout(() => setCopiedGenerated(false), 2000);
    }
  };

  const handleCopyTursoSql = () => {
    if (liveHashPreview) {
      const sql = `UPDATE admin_users SET password_hash = '${liveHashPreview}', updated_at = CURRENT_TIMESTAMP WHERE username = '${editUsername.trim() || 'admin'}';`;
      navigator.clipboard.writeText(sql);
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 2000);
    }
  };

  // Newsletter Actions
  const handleCopySubscribers = () => {
    if (subscribers.length > 0) {
      navigator.clipboard.writeText(subscribers.join(', '));
      setCopiedEmailsToast(true);
      setTimeout(() => setCopiedEmailsToast(false), 2500);
    }
  };

  const handleExportCsv = () => {
    if (subscribers.length === 0) return;
    const csvContent = 'data:text/csv;charset=utf-8,Email\n' + subscribers.map(e => `"${e}"`).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sthree_shakthi_subscribers_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddSubscriber = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSubscriberInput.trim() && newSubscriberInput.includes('@')) {
      storageService.subscribeEmail(newSubscriberInput.trim());
      setSubscribers(storageService.getSubscribers());
      setNewSubscriberInput('');
    }
  };

  const handleRemoveSubscriber = (email: string) => {
    if (confirm(`Remove ${email} from subscriber list?`)) {
      storageService.removeSubscriber(email);
      setSubscribers(storageService.getSubscribers());
    }
  };

  const handleApplyTemplate = (type: 'publication' | 'digest' | 'workshop') => {
    if (type === 'publication') {
      setBroadcastSubject('✨ New Publication Live on Project Sthree Shakthi | Cluster 05');
      setBroadcastMessage(
        `Dear Sthree Shakthi Subscriber,\n\nWe are delighted to share that a new edition has just been published on our community platform by Cluster 05, Rotaract District 3220!\n\n📖 Read the latest articles, stories, and magazines online:\nhttps://localhost:9999/#publications\n\nThank you for supporting women empowerment across Sri Lanka!\n\nWarm regards,\nCluster 05 Editorial Team`
      );
    } else if (type === 'digest') {
      setBroadcastSubject('🌸 Sthree Shakthi Monthly Newsletter | Rotaract District 3220');
      setBroadcastMessage(
        `Dear Community Members & Rotaractors,\n\nHere is your monthly digest of Project Sthree Shakthi:\n\n✨ 10 Clubs United across Cluster 05\n✨ New leadership pathways and empowerment stories published\n✨ Community magazines & PDF toolkits available online\n\n👉 Access all resources here: https://localhost:9999/\n\nTogether Sri Lanka ✦ District 3220`
      );
    } else if (type === 'workshop') {
      setBroadcastSubject('📢 Invitation: Upcoming Sthree Shakthi Leadership & Career Workshop');
      setBroadcastMessage(
        `Hello,\n\nYou are cordially invited to our upcoming Sthree Shakthi Empowerment Workshop hosted by Cluster 05, Rotaract District 3220.\n\n📅 Date & Time: [Enter Date & Time]\n📍 Platform / Venue: [Enter Online / In-Person Details]\n🎯 Topics: Career Leadership, Financial Confidence & Creative Enterprise\n\n👉 Register and view details on our website: https://localhost:9999/\n\nSee you there!`
      );
    }
  };

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastSubject.trim() || !broadcastMessage.trim()) {
      alert('Please provide both a subject line and message content.');
      return;
    }

    if (subscribers.length === 0) {
      alert('No subscribers found in database yet. Please collect or add subscriber emails first.');
      return;
    }

    // 1. Record in broadcast log
    storageService.recordBroadcast(broadcastSubject.trim(), broadcastMessage.trim(), subscribers.length);
    setBroadcastHistory(storageService.getBroadcastHistory());

    // 2. Launch mail client with prefilled BCC list (safe privacy BCC)
    const bccList = encodeURIComponent(subscribers.join(','));
    const subjectEnc = encodeURIComponent(broadcastSubject.trim());
    const bodyEnc = encodeURIComponent(broadcastMessage.trim());
    const mailtoUrl = `mailto:?bcc=${bccList}&subject=${subjectEnc}&body=${bodyEnc}`;

    setBroadcastSuccessToast(`Broadcast dispatched! Default email client opened with ${subscribers.length} recipient(s) in safe BCC.`);
    setTimeout(() => setBroadcastSuccessToast(''), 5000);

    // Open mail app
    window.open(mailtoUrl, '_blank');
  };

  const handleCopyBroadcastText = () => {
    const fullText = `SUBJECT: ${broadcastSubject}\n\n${broadcastMessage}`;
    navigator.clipboard.writeText(fullText);
    setCopiedBroadcastToast(true);
    setTimeout(() => setCopiedBroadcastToast(false), 2500);
  };

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentAccount = storageService.getAdminAccount();
    const cleanUser = usernameInput.trim().toLowerCase();
    const cleanPass = passwordInput.trim();

    // Verify username match and password hash
    const isUserMatch = cleanUser === currentAccount.username.toLowerCase() || 
                        cleanUser === 'admin';

    const isPassValid = await verifyPassword(cleanPass, currentAccount.passwordHash);

    if (isUserMatch && isPassValid) {
      setIsAuthenticated(true);
      setAuthError('');
    } else {
      setAuthError('Incorrect username or password.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPasswordInput('');
    setAuthError('');
  };

  const handleUpdateCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsError('');
    setSettingsSuccess('');

    // 1. Verify current password
    const currentAcc = storageService.getAdminAccount();
    const isCurrentValid = await verifyPassword(currentPassword, currentAcc.passwordHash);
    if (!isCurrentValid) {
      setSettingsError('Current password is incorrect.');
      return;
    }

    // 2. Validate new password if changing
    let updatedHash = currentAcc.passwordHash;
    if (newPassword.trim()) {
      if (newPassword.length < 6) {
        setSettingsError('New password must be at least 6 characters.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setSettingsError('New password and confirmation do not match.');
        return;
      }
      updatedHash = await hashPassword(newPassword.trim());
    }

    const updatedAccount: AdminAccount = {
      username: editUsername.trim() || currentAcc.username,
      passwordHash: updatedHash,
      updatedAt: new Date().toISOString()
    };

    storageService.saveAdminAccount(updatedAccount);
    setAdminAccount(updatedAccount);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setSettingsSuccess('Admin credentials updated & hashed successfully!');
  };

  const filteredPubs = publications.filter((p) => {
    if (activeTab !== 'all' && activeTab !== 'settings' && p.status !== activeTab) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        p.title.toLowerCase().includes(q) ||
        p.authorName.toLowerCase().includes(q) ||
        p.authorEmail.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const pendingCount = publications.filter((p) => p.status === 'pending').length;
  const approvedCount = publications.filter((p) => p.status === 'approved').length;
  const rejectedCount = publications.filter((p) => p.status === 'rejected').length;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-[#3E1028]/85 backdrop-blur-md animate-in fade-in duration-200 ${
      isFullScreen ? 'p-0 sm:p-2 md:p-3' : 'p-2 sm:p-6'
    }`}>
      <div 
        className={`relative w-full flex flex-col overflow-hidden bg-white shadow-2xl transition-all duration-300 ${
          isFullScreen 
            ? 'h-full w-full max-w-[1920px] rounded-none sm:rounded-3xl border-0 sm:border border-[#F4E5DA]' 
            : 'h-[92vh] max-w-6xl rounded-3xl border border-[#F4E5DA]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3.5 sm:px-6 py-3 sm:py-4 border-b border-[#5C1D3B] bg-[#3E1028] text-white gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 pr-1">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-[#D95F7F] text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
              <Lock className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h2 className="font-serif text-xs sm:text-lg font-bold text-white tracking-wide truncate">
                  Cluster 05 Admin Portal
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-[#D95F7F]/30 text-[#F8CAD5] text-[9px] sm:text-[10px] font-extrabold uppercase border border-[#D95F7F]/40 shrink-0">
                  {isAuthenticated ? 'Live' : 'Locked'}
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-[#F8CAD5]/80 truncate">
                Editorial & publication moderation suite.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="p-1.5 sm:p-2 rounded-xl text-[#F8CAD5] hover:text-white hover:bg-white/10 transition-colors"
              title={isFullScreen ? 'Exit Full Screen' : 'Expand to Full Screen'}
            >
              {isFullScreen ? (
                <Minimize2 className="w-4 h-4 sm:w-5 sm:h-5" />
              ) : (
                <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </button>

            {isAuthenticated && (
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-bold text-[#F8CAD5] bg-white/10 hover:bg-white/20 transition-colors"
                title="Log out from admin portal"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-xl text-[#F8CAD5] hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* 1. Secure Admin Login Form Screen */}
        {!isAuthenticated ? (
          <div className="flex-grow flex items-center justify-center p-6 bg-[#FDF9F6]">
            <div className="max-w-md w-full p-8 sm:p-10 rounded-[32px] bg-white border border-[#F4E5DA] shadow-xl text-center space-y-6">
              
              {/* Lock Badge */}
              <div className="w-16 h-16 rounded-3xl bg-[#FAF2EB] text-[#D95F7F] border border-[#F4E5DA] flex items-center justify-center mx-auto shadow-inner">
                <KeyRound className="w-8 h-8" />
              </div>

              <div>
                <h3 className="font-serif text-2xl font-bold text-[#3E1028]">
                  Admin Login
                </h3>
                <p className="text-xs text-[#5C1D3B]/70 mt-1">
                  Enter your credentials to access the moderation dashboard.
                </p>
              </div>

              {/* Login Form */}
              <form onSubmit={handleLogin} className="space-y-4 text-left">
                
                {/* Username */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#3E1028] uppercase tracking-wider">
                    Admin Username
                  </label>
                  <div className="relative">
                    <UserCheck className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      required
                      placeholder="Enter admin username (e.g. admin)"
                      value={usernameInput}
                      onChange={(e) => setUsernameInput(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#FAF2EB]/50 border border-[#F4E5DA] text-xs text-[#3E1028] focus:outline-none focus:ring-2 focus:ring-[#D95F7F]/30 focus:border-[#D95F7F]"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#3E1028] uppercase tracking-wider">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Enter admin password"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-[#FAF2EB]/50 border border-[#F4E5DA] text-xs font-mono text-[#3E1028] focus:outline-none focus:ring-2 focus:ring-[#D95F7F]/30 focus:border-[#D95F7F]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-700"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-[#D95F7F]" />}
                    </button>
                  </div>
                </div>

                {/* Error Message */}
                {authError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium text-center">
                    {authError}
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full py-3 rounded-full bg-[#D95F7F] hover:bg-[#BE4465] text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-[#D95F7F]/25 transition-all hover:scale-101"
                >
                  Log In to Dashboard
                </button>

                {/* Secure Auth Indicator */}
                <div className="pt-2 text-center text-[11px] text-[#5C1D3B]/60 flex items-center justify-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Secured with SHA-256 Cryptographic Hash Validation</span>
                </div>

              </form>
            </div>
          </div>
        ) : (
          /* 2. Authenticated Moderation Dashboard */
          <div className="flex-grow flex flex-col overflow-hidden bg-[#FDF9F6]">
            
            {/* Top Metrics Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-white border-b border-[#F4E5DA]">
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80">
                <div className="text-[10px] font-black uppercase text-amber-800">Pending Review</div>
                <div className="text-xl font-bold font-serif text-amber-900">{pendingCount}</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200/80">
                <div className="text-[10px] font-black uppercase text-emerald-800">Approved Live</div>
                <div className="text-xl font-bold font-serif text-emerald-900">{approvedCount}</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200/80">
                <div className="text-[10px] font-black uppercase text-rose-800">Subscribers</div>
                <div className="text-xl font-bold font-serif text-[#D95F7F]">{subscribers.length}</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FAF2EB] border border-[#F4E5DA]">
                <div className="text-[10px] font-black uppercase text-[#D95F7F]">Total Submissions</div>
                <div className="text-xl font-bold font-serif text-[#3E1028]">{publications.length}</div>
              </div>
            </div>

            {/* Sub-nav & Search */}
            <div className="p-4 bg-[#FAF2EB]/60 border-b border-[#F4E5DA] flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Tab Pills */}
              <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
                <button
                  onClick={() => setActiveTab('pending')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                    activeTab === 'pending'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-white text-[#5C1D3B] hover:bg-slate-100 border border-[#F4E5DA]'
                  }`}
                >
                  Pending ({pendingCount})
                </button>
                <button
                  onClick={() => setActiveTab('approved')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                    activeTab === 'approved'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white text-[#5C1D3B] hover:bg-slate-100 border border-[#F4E5DA]'
                  }`}
                >
                  Approved ({approvedCount})
                </button>
                <button
                  onClick={() => setActiveTab('rejected')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                    activeTab === 'rejected'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-white text-[#5C1D3B] hover:bg-slate-100 border border-[#F4E5DA]'
                  }`}
                >
                  Rejected ({rejectedCount})
                </button>
                <button
                  onClick={() => setActiveTab('all')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                    activeTab === 'all'
                      ? 'bg-[#3E1028] text-white shadow-xs'
                      : 'bg-white text-[#5C1D3B] hover:bg-slate-100 border border-[#F4E5DA]'
                  }`}
                >
                  All ({publications.length})
                </button>
                <button
                  onClick={() => setActiveTab('newsletter')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                    activeTab === 'newsletter'
                      ? 'bg-[#D95F7F] text-white shadow-xs'
                      : 'bg-white text-[#D95F7F] hover:bg-rose-50 border border-[#D95F7F]/30'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Newsletter & Broadcast ({subscribers.length})</span>
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                    activeTab === 'settings'
                      ? 'bg-[#3E1028] text-white shadow-xs'
                      : 'bg-white text-[#3E1028] hover:bg-slate-100 border border-slate-300'
                  }`}
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Password & Hash</span>
                </button>
              </div>

              {/* Search (only for publications view) */}
              {activeTab !== 'settings' && activeTab !== 'newsletter' && (
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Filter submissions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-full bg-white border border-[#F4E5DA] text-xs text-[#3E1028] focus:outline-none focus:ring-2 focus:ring-[#D95F7F]/20"
                  />
                </div>
              )}
            </div>

            {/* Tab View 1: Settings / Change Credentials */}
            {activeTab === 'settings' ? (
              <div className="flex-grow overflow-y-auto p-6 flex justify-center items-start">
                <div className="max-w-2xl w-full bg-white p-6 sm:p-8 rounded-[32px] border border-[#F4E5DA] shadow-md space-y-6">
                  
                  <div className="flex items-center justify-between border-b border-[#F4E5DA] pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-[#FAF2EB] text-[#D95F7F] flex items-center justify-center">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-serif text-lg font-bold text-[#3E1028]">
                          Admin Security & Cryptographic Hashing
                        </h3>
                        <p className="text-xs text-[#5C1D3B]/70">
                          Create unique high-entropy passwords with real-time SHA-256 hashing.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleGenerateUniquePassword}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold text-white bg-[#D95F7F] hover:bg-[#BE4465] shadow-xs transition-all"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Generate Unique Password</span>
                    </button>
                  </div>

                  {settingsSuccess && (
                    <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>{settingsSuccess}</span>
                    </div>
                  )}

                  {settingsError && (
                    <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-rose-600" />
                      <span>{settingsError}</span>
                    </div>
                  )}

                  {/* Live Hash & SQL Box (if new password typed or generated) */}
                  {newPassword && (
                    <div className="p-4 rounded-2xl bg-[#3E1028] text-white space-y-3 shadow-inner">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#F8CAD5] flex items-center gap-1.5">
                          <KeyRound className="w-3.5 h-3.5 text-[#D95F7F]" />
                          Live Cryptographic SHA-256 Hash Preview
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleCopyPassword}
                            className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[#F8CAD5] text-[11px] font-bold transition-colors"
                          >
                            {copiedGenerated ? 'Copied Password!' : 'Copy Password'}
                          </button>
                          <button
                            type="button"
                            onClick={handleCopyTursoSql}
                            className="px-2.5 py-1 rounded-lg bg-[#D95F7F] hover:bg-[#BE4465] text-white text-[11px] font-bold transition-colors"
                          >
                            {copiedSql ? 'Copied SQL!' : 'Copy Turso SQL'}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1 text-xs">
                        <div className="text-[11px] text-[#F8CAD5]/70">Plaintext (Unique):</div>
                        <div className="p-2 rounded-xl bg-black/40 font-mono text-emerald-300 font-bold text-xs select-all">
                          {newPassword}
                        </div>
                      </div>

                      <div className="space-y-1 text-xs">
                        <div className="text-[11px] text-[#F8CAD5]/70">SHA-256 Hash (64 Hex Characters):</div>
                        <div className="p-2 rounded-xl bg-black/40 font-mono text-xs text-[#F8CAD5] break-all select-all">
                          {liveHashPreview}
                        </div>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleUpdateCredentials} className="space-y-4 text-xs">
                    
                    {/* Username */}
                    <div className="space-y-1">
                      <label className="font-bold text-[#3E1028]">Admin Username</label>
                      <input
                        type="text"
                        required
                        value={editUsername}
                        onChange={(e) => setEditUsername(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF2EB]/50 border border-[#F4E5DA] text-xs text-[#3E1028] focus:outline-none focus:ring-2 focus:ring-[#D95F7F]/30"
                      />
                    </div>

                    {/* Current Password (Mandatory) */}
                    <div className="space-y-1 pt-2 border-t border-[#F4E5DA]">
                      <label className="font-bold text-[#3E1028]">Current Password <span className="text-rose-500">*</span></label>
                      <input
                        type="password"
                        required
                        placeholder="Enter current password to authorize credential update"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF2EB]/50 border border-[#F4E5DA] text-xs text-[#3E1028] focus:outline-none focus:ring-2 focus:ring-[#D95F7F]/30"
                      />
                    </div>

                    {/* New Password */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <div className="space-y-1">
                        <label className="font-bold text-[#3E1028]">New Unique Password</label>
                        <input
                          type="text"
                          placeholder="Type or click 'Generate Unique Password'"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF2EB]/50 border border-[#F4E5DA] text-xs font-mono text-[#3E1028] focus:outline-none focus:ring-2 focus:ring-[#D95F7F]/30"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-[#3E1028]">Confirm New Password</label>
                        <input
                          type="text"
                          placeholder="Re-type new password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF2EB]/50 border border-[#F4E5DA] text-xs font-mono text-[#3E1028] focus:outline-none focus:ring-2 focus:ring-[#D95F7F]/30"
                        />
                      </div>
                    </div>

                    <div className="pt-3">
                      <button
                        type="submit"
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-[#D95F7F] hover:bg-[#BE4465] text-white font-bold text-xs uppercase tracking-wider shadow-md transition-all"
                      >
                        <Save className="w-4 h-4" />
                        <span>Save & Apply Hashed Password (SHA-256)</span>
                      </button>
                    </div>

                  </form>
                </div>
              </div>
            ) : activeTab === 'newsletter' ? (
              /* Tab View 2: Newsletter & Broadcast Suite */
              <div className="flex-grow overflow-y-auto p-4 sm:p-6 space-y-6">
                
                {/* Success Banner */}
                {broadcastSuccessToast && (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in">
                    <div className="flex items-center gap-2">
                      <Check className="w-5 h-5 text-emerald-600 shrink-0" />
                      <span>{broadcastSuccessToast}</span>
                    </div>
                    <button onClick={() => setBroadcastSuccessToast('')} className="text-emerald-700 hover:text-emerald-900 font-bold text-xs">
                      ✕
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* Left Column (7 Cols): Compose & Broadcast Email Suite */}
                  <div className="lg:col-span-7 space-y-6">
                    <div className="bg-white p-6 sm:p-7 rounded-[32px] border border-[#F4E5DA] shadow-xs space-y-5">
                      
                      <div className="flex items-center justify-between border-b border-[#F4E5DA] pb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-[#FAF2EB] text-[#D95F7F] flex items-center justify-center font-bold">
                            <Send className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-serif text-lg font-bold text-[#3E1028]">
                              Compose & Dispatch Broadcast
                            </h3>
                            <p className="text-xs text-[#5C1D3B]/70">
                              Send updates directly to all {subscribers.length} subscribers via safe BCC.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Quick Template Selector */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-[#3E1028] uppercase tracking-wider">
                          1. Quick Announcement Templates
                        </label>
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleApplyTemplate('publication')}
                            className="px-3 py-1.5 rounded-full text-xs font-bold bg-[#FAF2EB] hover:bg-[#F4E5DA] text-[#D95F7F] border border-[#F4E5DA] transition-colors"
                          >
                            ✨ New Publication Release
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApplyTemplate('digest')}
                            className="px-3 py-1.5 rounded-full text-xs font-bold bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 transition-colors"
                          >
                            🌸 Monthly Newsletter
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApplyTemplate('workshop')}
                            className="px-3 py-1.5 rounded-full text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-colors"
                          >
                            📢 Event / Workshop Invite
                          </button>
                        </div>
                      </div>

                      {/* Broadcast Form */}
                      <form onSubmit={handleSendBroadcast} className="space-y-4">
                        
                        {/* Subject */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-[#3E1028] uppercase tracking-wider">
                            Email Subject Line <span className="text-[#D95F7F]">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. ✨ New Story Published on Project Sthree Shakthi | Cluster 05"
                            value={broadcastSubject}
                            onChange={(e) => setBroadcastSubject(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl bg-[#FAF2EB]/50 border border-[#F4E5DA] text-xs font-medium text-[#3E1028] focus:outline-none focus:ring-2 focus:ring-[#D95F7F]/30"
                          />
                        </div>

                        {/* Message Body */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-[#3E1028] uppercase tracking-wider">
                              Message Content / Body <span className="text-[#D95F7F]">*</span>
                            </label>
                            <span className="text-[10px] text-slate-400">
                              Recipient privacy: Sent with safe BCC
                            </span>
                          </div>
                          <textarea
                            required
                            rows={7}
                            placeholder="Write your email body or announcement message..."
                            value={broadcastMessage}
                            onChange={(e) => setBroadcastMessage(e.target.value)}
                            className="w-full p-4 rounded-2xl bg-[#FAF2EB]/40 border border-[#F4E5DA] text-xs font-normal text-[#3E1028] focus:outline-none focus:ring-2 focus:ring-[#D95F7F]/30 leading-relaxed"
                          />
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                          <button
                            type="button"
                            onClick={handleCopyBroadcastText}
                            className={`flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-bold border transition-all ${
                              copiedBroadcastToast
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                : 'bg-white text-[#5C1D3B] hover:bg-slate-100 border-[#F4E5DA]'
                            }`}
                          >
                            {copiedBroadcastToast ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-[#D95F7F]" />}
                            <span>{copiedBroadcastToast ? 'Copied Message!' : 'Copy Formatted Text'}</span>
                          </button>

                          <button
                            type="submit"
                            disabled={subscribers.length === 0}
                            className="flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#D95F7F] hover:bg-[#BE4465] text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-[#D95F7F]/30 transition-all hover:scale-102 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Send className="w-4 h-4" />
                            <span>Send Email via Mail Client ({subscribers.length} BCC)</span>
                          </button>
                        </div>

                      </form>

                    </div>

                    {/* Broadcast Logs History */}
                    {broadcastHistory.length > 0 && (
                      <div className="bg-white p-6 rounded-[32px] border border-[#F4E5DA] shadow-xs space-y-3">
                        <div className="flex items-center gap-2 font-serif text-sm font-bold text-[#3E1028]">
                          <Clock className="w-4 h-4 text-[#D95F7F]" />
                          <span>Recent Broadcasts Dispatched</span>
                        </div>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {broadcastHistory.map((bc) => (
                            <div key={bc.id} className="p-3 rounded-2xl bg-[#FAF2EB]/60 border border-[#F4E5DA] flex items-center justify-between text-xs">
                              <div>
                                <div className="font-bold text-[#3E1028] line-clamp-1">{bc.subject}</div>
                                <div className="text-[10px] text-slate-500">
                                  {new Date(bc.sentAt).toLocaleString()} • Dispatched to {bc.recipientCount} subscriber(s)
                                </div>
                              </div>
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold shrink-0">
                                ✓ Sent
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>

                  {/* Right Column (5 Cols): Community Subscribers Directory */}
                  <div className="lg:col-span-5 space-y-4">
                    <div className="bg-white p-6 rounded-[32px] border border-[#F4E5DA] shadow-xs space-y-4">
                      
                      {/* Header with Quick Actions */}
                      <div className="space-y-2 border-b border-[#F4E5DA] pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-rose-50 text-[#D95F7F] flex items-center justify-center font-bold">
                              <Users className="w-4 h-4" />
                            </div>
                            <div>
                              <h4 className="font-serif text-base font-bold text-[#3E1028]">
                                Subscribers ({subscribers.length})
                              </h4>
                              <span className="text-[10px] text-emerald-600 font-bold">● Active Community List</span>
                            </div>
                          </div>
                        </div>

                        {/* 1-Click Export & Copy Action Buttons */}
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={handleCopySubscribers}
                            disabled={subscribers.length === 0}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                              copiedEmailsToast
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                : 'bg-[#FAF2EB] text-[#3E1028] hover:bg-[#F4E5DA] border-[#F4E5DA]'
                            }`}
                            title="Copy all subscriber emails separated by comma"
                          >
                            {copiedEmailsToast ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-[#D95F7F]" />}
                            <span>{copiedEmailsToast ? 'Copied Emails!' : 'Copy All (BCC)'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={handleExportCsv}
                            disabled={subscribers.length === 0}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-[#FAF2EB] text-[#3E1028] hover:bg-[#F4E5DA] border border-[#F4E5DA] transition-colors"
                            title="Download subscribers as CSV"
                          >
                            <Download className="w-3.5 h-3.5 text-[#D95F7F]" />
                            <span>Export CSV</span>
                          </button>
                        </div>
                      </div>

                      {/* Add Manual Subscriber */}
                      <form onSubmit={handleAddSubscriber} className="flex gap-2">
                        <input
                          type="email"
                          required
                          placeholder="Add new subscriber email..."
                          value={newSubscriberInput}
                          onChange={(e) => setNewSubscriberInput(e.target.value)}
                          className="flex-grow px-3 py-2 rounded-xl bg-[#FAF2EB]/40 border border-[#F4E5DA] text-xs text-[#3E1028] focus:outline-none focus:ring-2 focus:ring-[#D95F7F]/30"
                        />
                        <button
                          type="submit"
                          className="px-3.5 py-2 rounded-xl bg-[#D95F7F] text-white font-bold text-xs hover:bg-[#BE4465] shrink-0"
                        >
                          + Add
                        </button>
                      </form>

                      {/* Search Filter for Subscribers */}
                      {subscribers.length > 5 && (
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                          <input
                            type="text"
                            placeholder="Filter subscriber emails..."
                            value={subscriberSearch}
                            onChange={(e) => setSubscriberSearch(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-[#FAF2EB]/30 border border-[#F4E5DA] text-xs text-[#3E1028] focus:outline-none"
                          />
                        </div>
                      )}

                      {/* Subscriber Email List */}
                      <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                        {subscribers.length > 0 ? (
                          subscribers
                            .filter(e => !subscriberSearch || e.toLowerCase().includes(subscriberSearch.toLowerCase()))
                            .map((email, idx) => (
                              <div
                                key={email + idx}
                                className="p-2.5 rounded-xl bg-[#FAF2EB]/50 border border-[#F4E5DA] flex items-center justify-between text-xs group hover:bg-white transition-colors"
                              >
                                <div className="flex items-center gap-2 truncate">
                                  <span className="w-5 h-5 rounded-md bg-rose-100 text-[#D95F7F] text-[10px] font-mono flex items-center justify-center font-bold">
                                    {idx + 1}
                                  </span>
                                  <span className="font-medium text-[#3E1028] truncate">{email}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSubscriber(email)}
                                  className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors opacity-70 group-hover:opacity-100"
                                  title="Remove subscriber"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))
                        ) : (
                          <div className="text-center py-8 text-xs text-slate-400 space-y-1">
                            <div>No subscribers registered yet.</div>
                            <div className="text-[11px] text-[#D95F7F]">
                              Subscribers will automatically appear here when visitors join the newsletter on the website footer.
                            </div>
                          </div>
                        )}
                      </div>

                    </div>
                  </div>

                </div>

              </div>
            ) : (
              /* Tab View 3: List of Submissions */
              <div className="flex-grow overflow-y-auto p-4 sm:p-6 space-y-4">
                {filteredPubs.length > 0 ? (
                  filteredPubs.map((pub) => (
                    <div
                      key={pub.id}
                      className={`p-4 sm:p-5 rounded-3xl bg-white border shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                        pub.status === 'pending'
                          ? 'border-amber-300 ring-1 ring-amber-300/30'
                          : pub.status === 'approved'
                          ? 'border-emerald-200'
                          : 'border-rose-200 opacity-75'
                      }`}
                    >
                      {/* Left details */}
                      <div className="flex items-start gap-3.5 flex-grow max-w-3xl">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-slate-100 shrink-0 border border-[#F4E5DA]">
                          <img src={pub.coverImage} alt={pub.title} className="w-full h-full object-cover" />
                        </div>

                        <div className="space-y-1.5 flex-grow">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              pub.status === 'pending'
                                ? 'bg-amber-100 text-amber-800'
                                : pub.status === 'approved'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}>
                              ● {pub.status}
                            </span>

                            <span className="px-2.5 py-0.5 rounded-full bg-[#FAF2EB] text-[#D95F7F] text-[10px] font-bold">
                              {pub.type === 'word' ? '📝 Word Document' : '📄 PDF Document'}
                            </span>

                            {pub.isFeatured && (
                              <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black uppercase">
                                ★ Featured
                              </span>
                            )}

                            <span className="text-[11px] text-slate-400">
                              Submitted: {new Date(pub.submittedAt).toLocaleDateString()}
                            </span>
                          </div>

                          <h4 className="font-serif text-sm sm:text-base font-bold text-[#3E1028]">
                            {pub.title}
                          </h4>

                          {pub.fileName && (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#FAF2EB] text-[#3E1028] text-[11px] font-mono border border-[#F4E5DA]">
                              <span>📎 Attached: {pub.fileName}</span>
                              {pub.fileSize && <span className="text-slate-400">({pub.fileSize})</span>}
                            </div>
                          )}

                          <p className="text-xs text-[#5C1D3B]/80 line-clamp-2">
                            {pub.summary}
                          </p>

                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1">
                            <span className="font-semibold text-slate-700">Author: {pub.authorName}</span>
                            <span>•</span>
                            <span>{pub.authorEmail}</span>
                            {pub.authorClub && (
                              <>
                                <span>•</span>
                                <span className="text-[#D95F7F] font-semibold">{pub.authorClub}</span>
                              </>
                            )}
                          </div>

                          {pub.status === 'rejected' && pub.rejectedReason && (
                            <div className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                              <strong>Rejection Note:</strong> {pub.rejectedReason}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right Moderation Actions */}
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 shrink-0 w-full sm:w-auto pt-2 sm:pt-0 justify-start sm:justify-end">
                        
                        {/* Preview Button */}
                        <button
                          type="button"
                          onClick={() => onOpenViewer(pub)}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold text-[#3E1028] bg-[#FAF2EB] hover:bg-[#F4E5DA] border border-[#F4E5DA] transition-all hover:scale-102 shadow-2xs"
                          title="Open document reader and file preview"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#D95F7F]" />
                          <span>Preview Document</span>
                        </button>

                        {/* Approve Button */}
                        {pub.status !== 'approved' && (
                          <button
                            type="button"
                            onClick={() => onApprove(pub.id)}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all hover:scale-102 shadow-xs"
                            title="Approve and publish to public website feed"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Approve & Publish</span>
                          </button>
                        )}

                        {/* Reject Button */}
                        {pub.status !== 'rejected' && (
                          <button
                            type="button"
                            onClick={() => {
                              const reason = prompt('Optional rejection note/reason for contributor:', 'Does not meet editorial guidelines.');
                              if (reason !== null) {
                                onReject(pub.id, reason);
                              }
                            }}
                            className="flex items-center gap-1 px-3 py-2 rounded-full text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors"
                            title="Reject this submission"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        )}

                        {/* Feature Button */}
                        <button
                          type="button"
                          onClick={() => onToggleFeature(pub.id)}
                          className={`flex items-center gap-1 px-3 py-2 rounded-full text-xs font-bold transition-all ${
                            pub.isFeatured
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                          }`}
                          title="Toggle featured spotlight on homepage"
                        >
                          <Star className={`w-3.5 h-3.5 ${pub.isFeatured ? 'fill-amber-500 text-amber-600' : ''}`} />
                          <span>{pub.isFeatured ? 'Featured' : 'Feature'}</span>
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm('Are you sure you want to permanently delete this submission?')) {
                              onDelete(pub.id);
                            }
                          }}
                          className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Permanently delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-16 text-slate-500 text-xs">
                    No submissions in this filter queue.
                  </div>
                )}
              </div>
            )}

            {/* Footer reset option */}
            <div className="p-4 bg-white border-t border-[#F4E5DA] flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-[#D95F7F]" />
                Only approved submissions appear on the public live feed.
              </span>
              <button
                onClick={() => {
                  if (confirm('Clear all demo submissions and wipe old test data?')) {
                    onResetSampleData();
                  }
                }}
                className="flex items-center gap-1 text-slate-400 hover:text-rose-600 font-medium"
              >
                <Trash2 className="w-3 h-3" />
                Clear All Demo Submissions
              </button>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};
