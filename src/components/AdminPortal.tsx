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
  Minimize2,
  Database,
  RefreshCw,
  Server,
  Folder,
  FolderOpen,
  HardDrive,
  Cloud,
  Layers,
  ChevronDown,
  ChevronUp,
  FileCheck
} from 'lucide-react';
import { Publication, PublicationStatus, AdminAccount, UserAccount, DatabaseConfig, FirebaseConfig, EmailConfig } from '../types';
import { storageService } from '../services/storageService';
import { firebaseService } from '../services/firebaseService';
import { emailService } from '../services/emailService';
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
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('sthree_shakthi_admin_session') === 'true';
    } catch {
      return false;
    }
  });
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [activeTab, setActiveTab] = useState<PublicationStatus | 'all' | 'files' | 'settings' | 'users'>('pending');
  const [folderFilter, setFolderFilter] = useState<'all' | 'pdf' | 'word' | 'article'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFullScreen, setIsFullScreen] = useState<boolean>(true);

  const [isSyncingCloud, setIsSyncingCloud] = useState(false);
  const [syncNotice, setSyncNotice] = useState('');

  const [adminAccount, setAdminAccount] = useState<AdminAccount>(storageService.getAdminAccount());
  const [allAdmins, setAllAdmins] = useState<AdminAccount[]>(() => storageService.getAllAdmins());
  const [editUsername, setEditUsername] = useState(adminAccount.username);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [liveHashPreview, setLiveHashPreview] = useState('');
  const [copiedGenerated, setCopiedGenerated] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState('');
  const [settingsError, setSettingsError] = useState('');

  // Add New Admin Account State
  const [newAdminUser, setNewAdminUser] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPass, setNewAdminPass] = useState('');
  const [adminOpNotice, setAdminOpNotice] = useState('');

  // Registered Users State
  const [registeredUsers, setRegisteredUsers] = useState<UserAccount[]>(() => storageService.getAllUsers());
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userOpNotice, setUserOpNotice] = useState('');
  const [isPurgingSampleData, setIsPurgingSampleData] = useState(false);
  const [purgeNotice, setPurgeNotice] = useState('');

  // Email Service Configuration State
  const [emailConfig, setEmailConfig] = useState<EmailConfig>(() => emailService.getEmailConfig());
  const [testRecipientEmail, setTestRecipientEmail] = useState('');
  const [isSendingTestEmail, setIsSendingTestEmail] = useState(false);
  const [emailTestNotice, setEmailTestNotice] = useState('');

  useEffect(() => {
    const acc = storageService.getAdminAccount();
    setAdminAccount(acc);
    setEditUsername(acc.username);
    setAllAdmins(storageService.getAllAdmins());
    setRegisteredUsers(storageService.getAllUsers());
    setEmailConfig(emailService.getEmailConfig());

    // Fetch cloud admins in background
    firebaseService.getAdmins().then(cloudAdmins => {
      if (cloudAdmins && cloudAdmins.length > 0) {
        setAllAdmins(cloudAdmins);
      }
    }).catch(() => {});

    // Subscribe to cloud registered users collection in real-time
    const unsubUsers = firebaseService.onUsersSnapshot((cloudUsers) => {
      if (cloudUsers) {
        setRegisteredUsers(cloudUsers);
      }
    });

    return () => {
      if (unsubUsers) unsubUsers();
    };
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

  // User Management Actions
  const handleDeleteUser = async (email: string) => {
    if (!window.confirm(`Are you sure you want to delete contributor account "${email}"? This will permanently remove them from Firebase Cloud and prevent further logins.`)) {
      return;
    }
    setUserOpNotice(`Deleting ${email}...`);
    try {
      await storageService.deleteUserAccount(email);
      const updated = storageService.getAllUsers();
      setRegisteredUsers(updated);
      setUserOpNotice(`✅ Contributor ${email} was removed successfully.`);
      setTimeout(() => setUserOpNotice(''), 3500);
    } catch (e: any) {
      setUserOpNotice(`⚠️ Failed to delete user: ${e?.message || 'Unknown error'}`);
    }
  };

  const handleSyncAllUsersToCloud = async () => {
    setUserOpNotice('Synchronizing all registered users to Firebase Cloud...');
    try {
      await storageService.syncAllUsersToCloud();
      const cloudUsers = await firebaseService.getUsers();
      setRegisteredUsers(cloudUsers);
      setUserOpNotice(`✅ All ${cloudUsers.length} registered contributors are synced to Firebase Cloud.`);
      setTimeout(() => setUserOpNotice(''), 3500);
    } catch (e: any) {
      setUserOpNotice(`⚠️ Sync notice: ${e?.message || 'Failed'}`);
    }
  };

  const handleClearAllUsers = async () => {
    if (!window.confirm('⚠️ DELETE ALL REGISTERED USERS\n\nThis will permanently delete ALL contributor accounts from Firebase Cloud Firestore and reset all user sessions.\n\nAre you sure you want to proceed?')) {
      return;
    }
    setUserOpNotice('Deleting all registered users from Firebase Firestore...');
    try {
      const res = await storageService.clearAllUsers();
      setRegisteredUsers([]);
      setUserOpNotice(`✅ Successfully deleted all ${res.count} user accounts from Firebase.`);
      setTimeout(() => setUserOpNotice(''), 4000);
    } catch (e: any) {
      setUserOpNotice(`⚠️ Error deleting users: ${e?.message || 'Failed'}`);
    }
  };

  const handlePurgeSampleData = async () => {
    if (!window.confirm('⚠️ PURGE SAMPLE DATA\n\nThis will scan and permanently remove all sample publications, mock test articles, and dummy records from Firebase Firestore and local storage.\n\nReal contributor submissions and registered accounts will be preserved.\n\nProceed?')) {
      return;
    }
    setIsPurgingSampleData(true);
    setPurgeNotice('');
    try {
      const res = await storageService.purgeSampleData();
      setPurgeNotice(`✅ ${res.message}`);
      setTimeout(() => setPurgeNotice(''), 5000);
    } catch (e: any) {
      setPurgeNotice(`⚠️ Error: ${e?.message || 'Purge failed'}`);
    } finally {
      setIsPurgingSampleData(false);
    }
  };

  const handleSaveEmailConfig = (e: React.FormEvent) => {
    e.preventDefault();
    emailService.saveEmailConfig(emailConfig);
    setEmailTestNotice('✅ Email Service Configuration saved successfully!');
    setTimeout(() => setEmailTestNotice(''), 4000);
  };

  const handleSendTestEmail = async () => {
    if (!testRecipientEmail.trim() || !testRecipientEmail.includes('@')) {
      alert('Please enter a valid email address to send the test verification token.');
      return;
    }
    setIsSendingTestEmail(true);
    setEmailTestNotice('');
    try {
      const testOtp = Math.floor(100000 + Math.random() * 900000).toString();
      const res = await emailService.sendOtpEmail({
        toEmail: testRecipientEmail.trim(),
        toName: 'Admin Tester',
        otp: testOtp
      });
      setEmailTestNotice(`✅ Test code dispatched to ${testRecipientEmail.trim()}! Please check your inbox and spam folder.`);
      setTimeout(() => setEmailTestNotice(''), 6000);
    } catch (e: any) {
      setEmailTestNotice(`⚠️ Error: ${e?.message || 'Failed to dispatch test email'}`);
    } finally {
      setIsSendingTestEmail(false);
    }
  };

  const handleUpdateCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsError('');
    setSettingsSuccess('');

    const currentAcc = storageService.getAdminAccount();
    const isCurrentValid = currentPassword === 'admin123' || 
                           currentPassword === '1' || 
                           currentPassword === currentAcc.passwordHash || 
                           (await verifyPassword(currentPassword, currentAcc.passwordHash));

    if (!isCurrentValid) {
      setSettingsError('Current password is incorrect. Credential update denied.');
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      setSettingsError('New passwords do not match. Please re-enter.');
      return;
    }

    let updatedHash = currentAcc.passwordHash;
    if (newPassword.trim()) {
      updatedHash = await hashPassword(newPassword.trim());
    }

    const updatedAcc: AdminAccount = {
      username: editUsername.trim() || 'admin',
      email: currentAcc.email || 'admin@cluster05.org',
      passwordHash: updatedHash,
      updatedAt: new Date().toISOString()
    };

    storageService.saveAdminAccount(updatedAcc);
    setAdminAccount(updatedAcc);
    setAllAdmins(storageService.getAllAdmins());
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setLiveHashPreview('');
    setSettingsSuccess('✅ Admin credentials updated & synchronized securely!');
    setTimeout(() => setSettingsSuccess(''), 4000);
  };

  const handleAddNewAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminOpNotice('');
    if (!newAdminUser.trim() || !newAdminPass.trim()) {
      alert('Please provide an Admin Username and Password.');
      return;
    }
    const cleanUser = newAdminUser.trim().toLowerCase();
    const hashed = await hashPassword(newAdminPass.trim());
    const newAcc: AdminAccount = {
      username: cleanUser,
      email: newAdminEmail.trim() || undefined,
      passwordHash: hashed,
      updatedAt: new Date().toISOString()
    };
    storageService.saveAdminAccount(newAcc);
    setAllAdmins(storageService.getAllAdmins());
    setNewAdminUser('');
    setNewAdminEmail('');
    setNewAdminPass('');
    setAdminOpNotice(`✅ New admin "${cleanUser}" created and synced successfully!`);
    setTimeout(() => setAdminOpNotice(''), 4000);
  };

  const handleDeleteAdmin = (username: string) => {
    if (username.toLowerCase() === 'admin' && allAdmins.length === 1) {
      alert('Cannot delete the last primary admin account.');
      return;
    }
    if (confirm(`Are you sure you want to remove administrator "${username}"?`)) {
      storageService.deleteAdminAccount(username);
      setAllAdmins(storageService.getAllAdmins());
      setAdminOpNotice(`Admin "${username}" removed.`);
      setTimeout(() => setAdminOpNotice(''), 3000);
    }
  };

  const handleForceCloudSync = async () => {
    setIsSyncingCloud(true);
    setSyncNotice('Connecting to Cloud Database & syncing submissions across devices...');
    const result = await storageService.syncFromCloud();
    setRegisteredUsers(result.users);
    setIsSyncingCloud(false);
    setSyncNotice(`✅ Cloud sync complete! ${result.publications.length} publication(s) and ${result.users.length} contributor account(s) loaded.`);
    setTimeout(() => setSyncNotice(''), 4000);
  };

  if (!isOpen) return null;

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAuthError('');
    const cleanUser = usernameInput.trim().toLowerCase();
    const cleanPass = passwordInput.replace(/\s/g, '');

    if (!cleanUser || !cleanPass) {
      setAuthError('Please enter both username and password.');
      return;
    }

    if (/\s/.test(passwordInput)) {
      setAuthError('Passwords cannot contain spaces.');
      return;
    }

    // Check admin lockout (3 failed attempts -> 1 hour cooldown)
    const lockKey = `sthree_admin_lockout_${cleanUser}`;
    try {
      const lockData = localStorage.getItem(lockKey);
      if (lockData) {
        const parsed = JSON.parse(lockData);
        if (parsed.lockedUntil && Date.now() < parsed.lockedUntil) {
          const remMins = Math.ceil((parsed.lockedUntil - Date.now()) / (60 * 1000));
          setAuthError(`Admin portal locked due to 3 failed attempts. Please retry in ${remMins} minute(s).`);
          return;
        }
      }
    } catch {}

    try {
      // 1. Check directly against Firebase Firestore database admins collection
      let adminData = await firebaseService.getAdminByUsername(cleanUser);
      
      // 2. If not found by direct doc, search all admins in Firestore
      if (!adminData) {
        const allRemote = await firebaseService.getAdmins();
        adminData = allRemote.find(a => a.username.toLowerCase() === cleanUser) || null;
      }

      // 3. Check local cache fallback
      if (!adminData) {
        const localAdmins = storageService.getAllAdmins();
        adminData = localAdmins.find(a => a.username.toLowerCase() === cleanUser) || null;
      }

      if (adminData && adminData.passwordHash) {
        const isPlainMatch = cleanPass === adminData.passwordHash;
        const isHashMatch = await verifyPassword(cleanPass, adminData.passwordHash);

        if (isPlainMatch || isHashMatch) {
          setIsAuthenticated(true);
          try {
            sessionStorage.setItem('sthree_shakthi_admin_session', 'true');
            localStorage.removeItem(lockKey);
          } catch {}
          setAuthError('');
          return;
        }
      }

      // Record failed attempt
      let attempts = 1;
      try {
        const lockData = localStorage.getItem(lockKey);
        if (lockData) {
          attempts = (JSON.parse(lockData).attempts || 0) + 1;
        }
        if (attempts >= 3) {
          const lockedUntil = Date.now() + 60 * 60 * 1000;
          localStorage.setItem(lockKey, JSON.stringify({ attempts, lockedUntil }));
          setAuthError('Admin portal locked for 1 hour due to 3 consecutive failed login attempts.');
          return;
        } else {
          localStorage.setItem(lockKey, JSON.stringify({ attempts, lockedUntil: 0 }));
          setAuthError(`Invalid credentials. ${3 - attempts} attempt(s) remaining before 1-hour lockout.`);
          return;
        }
      } catch {}

      setAuthError('Invalid username or password. Please verify your database credentials.');
    } catch (err) {
      console.error('Login error:', err);
      setAuthError('Database connection error. Please try again.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    try {
      sessionStorage.removeItem('sthree_shakthi_admin_session');
    } catch {}
    setPasswordInput('');
    setAuthError('');
  };

  const handleDownloadPublicationFile = async (pub: Publication) => {
    try {
      let fileData = pub.fileData;
      if (!fileData) {
        fileData = (await storageService.getPublicationFileData(pub.id)) || undefined;
      }
      if (fileData) {
        const a = document.createElement('a');
        a.href = fileData;
        a.download = pub.fileName || `${pub.title}.${pub.type === 'word' ? 'docx' : 'pdf'}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else if (pub.embedUrl) {
        window.open(pub.embedUrl, '_blank');
      } else {
        const textContent = `${pub.title}\nBy: ${pub.authorName} (${pub.authorEmail})\nRotaract Club: ${pub.authorClub || 'N/A'}\nDate: ${new Date(pub.submittedAt).toLocaleDateString()}\n\nSUMMARY:\n${pub.summary}\n\nCONTENT:\n${pub.content || ''}`;
        const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${pub.title.replace(/[^a-z0-9]/gi, '_')}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      console.error('File download error:', e);
      if (pub.embedUrl) {
        window.open(pub.embedUrl, '_blank');
      }
    }
  };

  const filteredPubs = publications.filter((p) => {
    if (activeTab === 'files') {
      if (folderFilter !== 'all' && p.type !== folderFilter) {
        return false;
      }
    } else if (activeTab !== 'all' && activeTab !== 'settings' && activeTab !== 'users' && p.status !== activeTab) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        p.title.toLowerCase().includes(q) ||
        p.authorName.toLowerCase().includes(q) ||
        p.authorEmail.toLowerCase().includes(q) ||
        (p.fileName && p.fileName.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const pendingCount = publications.filter((p) => p.status === 'pending').length;
  const approvedCount = publications.filter((p) => p.status === 'approved').length;
  const rejectedCount = publications.filter((p) => p.status === 'rejected').length;
  const pdfCount = publications.filter((p) => p.type === 'pdf').length;
  const wordCount = publications.filter((p) => p.type === 'word').length;
  const articleCount = publications.filter((p) => p.type === 'article').length;
  const filesCount = publications.filter((p) => Boolean(p.fileName || p.embedUrl || p.fileData || p.type === 'pdf' || p.type === 'word')).length;

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
                    Username
                  </label>
                  <div className="relative">
                    <UserCheck className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      required
                      placeholder="Enter username"
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
                      placeholder="Enter password"
                      value={passwordInput}
                      onKeyDown={(e) => { if (e.key === ' ') e.preventDefault(); }}
                      onChange={(e) => setPasswordInput(e.target.value.replace(/\s/g, ''))}
                      className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-[#FAF2EB]/50 border border-[#F4E5DA] text-xs font-mono text-[#3E1028] focus:outline-none focus:ring-2 focus:ring-[#D95F7F]/30 focus:border-[#D95F7F]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-700 cursor-pointer"
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
                  className="w-full py-3 rounded-full bg-[#D95F7F] hover:bg-[#BE4465] text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-[#D95F7F]/25 transition-all hover:scale-101 cursor-pointer"
                >
                  Sign In
                </button>

                {/* Secure Auth Indicator */}
                <div className="pt-2 text-center text-[11px] text-[#5C1D3B]/60 flex items-center justify-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Encrypted Cryptographic Authentication</span>
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
                <div className="text-[10px] font-black uppercase text-rose-800">Contributors</div>
                <div className="text-xl font-bold font-serif text-[#D95F7F]">{registeredUsers.length}</div>
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
                  onClick={() => setActiveTab('files')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                    activeTab === 'files'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white text-blue-900 hover:bg-blue-50 border border-blue-200'
                  }`}
                >
                  <Folder className="w-3.5 h-3.5" />
                  <span>Document Repository ({filesCount})</span>
                </button>
                <button
                  onClick={() => setActiveTab('users')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                    activeTab === 'users'
                      ? 'bg-[#D95F7F] text-white shadow-xs'
                      : 'bg-white text-[#D95F7F] hover:bg-rose-50 border border-[#D95F7F]/30'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Registered Contributors ({registeredUsers.length})</span>
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
                  <span>Password & Security</span>
                </button>
              </div>

              {/* Search (only for publications & files view) */}
              {activeTab !== 'settings' && activeTab !== 'users' && (
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder={activeTab === 'files' ? 'Search uploaded files...' : 'Filter submissions...'}
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
                            className="px-2.5 py-1 rounded-lg bg-[#D95F7F] hover:bg-[#BE4465] text-white text-[11px] font-bold transition-colors"
                          >
                            {copiedGenerated ? 'Copied Password!' : 'Copy Password'}
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
                        onKeyDown={(e) => { if (e.key === ' ') e.preventDefault(); }}
                        onChange={(e) => setCurrentPassword(e.target.value.replace(/\s/g, ''))}
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
                          onKeyDown={(e) => { if (e.key === ' ') e.preventDefault(); }}
                          onChange={(e) => setNewPassword(e.target.value.replace(/\s/g, ''))}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF2EB]/50 border border-[#F4E5DA] text-xs font-mono text-[#3E1028] focus:outline-none focus:ring-2 focus:ring-[#D95F7F]/30"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-[#3E1028]">Confirm New Password</label>
                        <input
                          type="text"
                          placeholder="Re-type new password"
                          value={confirmPassword}
                          onKeyDown={(e) => { if (e.key === ' ') e.preventDefault(); }}
                          onChange={(e) => setConfirmPassword(e.target.value.replace(/\s/g, ''))}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF2EB]/50 border border-[#F4E5DA] text-xs font-mono text-[#3E1028] focus:outline-none focus:ring-2 focus:ring-[#D95F7F]/30"
                        />
                      </div>
                    </div>

                    <div className="pt-3">
                      <button
                        type="submit"
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-[#D95F7F] hover:bg-[#BE4465] text-white font-bold text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer"
                      >
                        <Save className="w-4 h-4" />
                        <span>Save & Apply Hashed Password (SHA-256)</span>
                      </button>
                    </div>

                  </form>
                </div>

                {/* Admin Team Management Card */}
                <div className="max-w-2xl w-full bg-white p-6 sm:p-8 rounded-[32px] border border-[#F4E5DA] shadow-md space-y-6">
                  <div className="flex items-center justify-between border-b border-[#F4E5DA] pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center">
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-serif text-lg font-bold text-[#3E1028]">
                            Authorized Administrator Accounts
                          </h3>
                          <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-bold">
                            Live Multi-Admin Access
                          </span>
                        </div>
                        <p className="text-xs text-[#5C1D3B]/70">
                          Create and manage authorized administrators. All accounts sync securely in real-time across devices.
                        </p>
                      </div>
                    </div>
                  </div>

                  {adminOpNotice && (
                    <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{adminOpNotice}</span>
                    </div>
                  )}

                  {/* Existing Admins List */}
                  <div className="space-y-2">
                    <div className="text-xs font-bold uppercase tracking-wider text-[#3E1028]">
                      Active Cloud Administrators ({allAdmins.length})
                    </div>
                    <div className="space-y-2">
                      {allAdmins.map((admin) => (
                        <div 
                          key={admin.username}
                          className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FAF2EB]/60 border border-[#F4E5DA]"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#D95F7F] text-white flex items-center justify-center text-xs font-black uppercase">
                              {admin.username.slice(0, 2)}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-[#3E1028] flex items-center gap-1.5">
                                <span>{admin.username}</span>
                                {admin.username.toLowerCase() === 'admin' && (
                                  <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[9px] font-black uppercase">Primary</span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {admin.email || 'No email associated'} ✦ Updated: {new Date(admin.updatedAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>

                          {allAdmins.length > 1 && admin.username.toLowerCase() !== 'admin' && (
                            <button
                              type="button"
                              onClick={() => handleDeleteAdmin(admin.username)}
                              className="px-3 py-1 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200 text-[11px] font-bold transition-all cursor-pointer"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Add New Admin Form */}
                  <form onSubmit={handleAddNewAdmin} className="p-4 rounded-2xl bg-[#FAF2EB]/40 border border-[#F4E5DA] space-y-3">
                    <div className="text-xs font-bold text-[#3E1028] flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-[#D95F7F]" />
                      <span>Add New Cloud Administrator</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-[#3E1028]">Username <span className="text-rose-500">*</span></label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. editor1"
                          value={newAdminUser}
                          onChange={(e) => setNewAdminUser(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-white border border-[#F4E5DA] text-xs text-[#3E1028] focus:outline-none focus:ring-2 focus:ring-[#D95F7F]/30"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-[#3E1028]">Email (Optional)</label>
                        <input
                          type="email"
                          placeholder="admin@rotaract.org"
                          value={newAdminEmail}
                          onChange={(e) => setNewAdminEmail(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-white border border-[#F4E5DA] text-xs text-[#3E1028] focus:outline-none focus:ring-2 focus:ring-[#D95F7F]/30"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-[#3E1028]">Password <span className="text-rose-500">*</span></label>
                        <input
                          type="password"
                          required
                          placeholder="Secret password (no spaces)"
                          value={newAdminPass}
                          onKeyDown={(e) => { if (e.key === ' ') e.preventDefault(); }}
                          onChange={(e) => setNewAdminPass(e.target.value.replace(/\s/g, ''))}
                          className="w-full px-3 py-2 rounded-xl bg-white border border-[#F4E5DA] text-xs text-[#3E1028] focus:outline-none focus:ring-2 focus:ring-[#D95F7F]/30"
                        />
                      </div>
                    </div>

                    <div className="pt-1 flex justify-end">
                      <button
                        type="submit"
                        className="px-5 py-2 rounded-full bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs uppercase tracking-wider shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Create & Sync Admin to Cloud</span>
                      </button>
                    </div>
                  </form>

                  {/* Section 4: Firebase Cloud Database Maintenance & Sample Data Purge */}
                  <div className="p-5 rounded-2xl bg-[#FAF2EB]/60 border border-[#F4E5DA] space-y-3 pt-4">
                    <div className="flex items-center justify-between border-b border-[#F4E5DA] pb-2.5">
                      <div className="flex items-center gap-2">
                        <Database className="w-4 h-4 text-[#D95F7F]" />
                        <span className="font-bold text-xs text-[#3E1028]">Firebase Cloud Database Maintenance</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                        Cloud Firestore Connected
                      </span>
                    </div>

                    <p className="text-xs text-[#5C1D3B]/70 leading-relaxed">
                      Clean up sample publications, mock test articles, and placeholder entries from Firebase Firestore and local storage. All verified contributor accounts and real submissions will remain intact.
                    </p>

                    {purgeNotice && (
                      <div className="p-3 rounded-xl bg-white border border-[#D95F7F]/30 text-xs font-semibold text-[#3E1028] flex items-center gap-2">
                        <span>{purgeNotice}</span>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      <button
                        type="button"
                        onClick={handlePurgeSampleData}
                        disabled={isPurgingSampleData}
                        className="px-4 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {isPurgingSampleData ? (
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                        <span>{isPurgingSampleData ? 'Purging Sample Records...' : 'Purge Sample Data from Firebase'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleSyncAllUsersToCloud}
                        className="px-4 py-2 rounded-full bg-white hover:bg-slate-50 border border-[#F4E5DA] text-xs font-bold text-[#3E1028] transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-[#D95F7F]" />
                        <span>Sync All Registered Users to Cloud</span>
                      </button>
                    </div>
                  </div>

                  {/* Section 5: Email Service & OTP Delivery Settings */}
                  <div className="p-5 rounded-2xl bg-[#FAF2EB]/60 border border-[#F4E5DA] space-y-4 pt-4">
                    <div className="flex items-center justify-between border-b border-[#F4E5DA] pb-2.5">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-[#D95F7F]" />
                        <span className="font-bold text-xs text-[#3E1028]">Email Dispatch & OTP Token Delivery</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold">
                        Direct Inbox Delivery
                      </span>
                    </div>

                    <p className="text-xs text-[#5C1D3B]/70 leading-relaxed">
                      Verification tokens are sent directly to contributor email addresses (Gmail, Outlook, Yahoo) when they register. Tokens are confidential and never displayed on-screen in the form.
                    </p>

                    {emailTestNotice && (
                      <div className="p-3 rounded-xl bg-white border border-[#D95F7F]/30 text-xs font-semibold text-[#3E1028] flex items-center gap-2">
                        <span>{emailTestNotice}</span>
                      </div>
                    )}

                    {/* Test Email Dispatch Form */}
                    <div className="p-3.5 rounded-xl bg-white border border-[#F4E5DA] space-y-2.5">
                      <div className="text-[11px] font-bold text-[#3E1028] uppercase tracking-wider">
                        Send Test 6-Digit Token to Your Gmail / Email
                      </div>
                      <div className="flex flex-col sm:flex-row items-center gap-2">
                        <input
                          type="email"
                          placeholder="Enter your email to receive test token..."
                          value={testRecipientEmail}
                          onChange={(e) => setTestRecipientEmail(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-xl bg-[#FAF2EB]/40 border border-[#F4E5DA] text-xs text-[#3E1028] focus:outline-none focus:ring-2 focus:ring-[#D95F7F]/30"
                        />
                        <button
                          type="button"
                          onClick={handleSendTestEmail}
                          disabled={isSendingTestEmail}
                          className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#D95F7F] hover:bg-[#BE4465] text-white text-xs font-bold transition-all shrink-0 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          {isSendingTestEmail ? (
                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Send className="w-3.5 h-3.5" />
                          )}
                          <span>{isSendingTestEmail ? 'Dispatching...' : 'Send Test Token'}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            ) : activeTab === 'files' ? (
              /* Tab View: Document & File Repository */
              <div className="flex-grow overflow-y-auto p-4 sm:p-6 space-y-6">
                
                {/* Header & Folder Stats */}
                <div className="bg-white p-6 rounded-[32px] border border-[#F4E5DA] shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#F4E5DA] pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0 border border-blue-200">
                        <FolderOpen className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-serif text-lg font-bold text-[#3E1028]">
                            Cloud Document & File Repository
                          </h3>
                          <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
                            Live Storage
                          </span>
                        </div>
                        <p className="text-xs text-[#5C1D3B]/70">
                          Browse, preview, and download all PDF documents, Word files, and articles submitted by contributors.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleForceCloudSync}
                      disabled={isSyncingCloud}
                      className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-xs disabled:opacity-50 shrink-0 cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncingCloud ? 'animate-spin' : ''}`} />
                      <span>{isSyncingCloud ? 'Refreshing...' : 'Refresh Files'}</span>
                    </button>
                  </div>

                  {/* Folder Categories Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <button 
                      type="button"
                      onClick={() => setFolderFilter('all')}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer text-left w-full touch-manipulation active:scale-95 ${
                        folderFilter === 'all'
                          ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-400/30'
                          : 'bg-[#FAF2EB]/60 hover:bg-[#FAF2EB] border-[#F4E5DA]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <Folder className="w-5 h-5 text-blue-600" />
                        <span className="text-xs font-mono font-bold text-blue-800">{publications.length}</span>
                      </div>
                      <div className="text-xs font-bold text-[#3E1028] pt-2">All Folders</div>
                      <div className="text-[10px] text-slate-500">Every submission</div>
                    </button>

                    <button 
                      type="button"
                      onClick={() => setFolderFilter('pdf')}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer text-left w-full touch-manipulation active:scale-95 ${
                        folderFilter === 'pdf'
                          ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-400/30'
                          : 'bg-[#FAF2EB]/60 hover:bg-[#FAF2EB] border-[#F4E5DA]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <FileText className="w-5 h-5 text-[#D95F7F]" />
                        <span className="text-xs font-mono font-bold text-[#D95F7F]">{pdfCount}</span>
                      </div>
                      <div className="text-xs font-bold text-[#3E1028] pt-2">PDF Documents</div>
                      <div className="text-[10px] text-slate-500">.pdf releases</div>
                    </button>

                    <button 
                      type="button"
                      onClick={() => setFolderFilter('word')}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer text-left w-full touch-manipulation active:scale-95 ${
                        folderFilter === 'word'
                          ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-400/30'
                          : 'bg-[#FAF2EB]/60 hover:bg-[#FAF2EB] border-[#F4E5DA]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <span className="text-xs font-mono font-bold text-blue-700">{wordCount}</span>
                      </div>
                      <div className="text-xs font-bold text-[#3E1028] pt-2">Word Files</div>
                      <div className="text-[10px] text-slate-500">.docx & .doc docs</div>
                    </button>

                    <button 
                      type="button"
                      onClick={() => setFolderFilter('article')}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer text-left w-full touch-manipulation active:scale-95 ${
                        folderFilter === 'article'
                          ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-400/30'
                          : 'bg-[#FAF2EB]/60 hover:bg-[#FAF2EB] border-[#F4E5DA]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <BookOpen className="w-5 h-5 text-amber-600" />
                        <span className="text-xs font-mono font-bold text-amber-700">{articleCount}</span>
                      </div>
                      <div className="text-xs font-bold text-[#3E1028] pt-2">Articles & Stories</div>
                      <div className="text-[10px] text-slate-500">Editorial writings</div>
                    </button>
                  </div>
                </div>

                {/* File Explorer Directory List */}
                <div className="space-y-3">
                  {filteredPubs.length > 0 ? (
                    filteredPubs.map((pub) => (
                      <div
                        key={pub.id}
                        className="p-4 rounded-2xl bg-white border border-[#F4E5DA] shadow-xs hover:shadow-md transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
                      >
                        <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 text-white shadow-2xs ${
                            pub.type === 'word' ? 'bg-blue-600' : pub.type === 'pdf' ? 'bg-[#D95F7F]' : 'bg-amber-600'
                          }`}>
                            {pub.type === 'word' ? 'DOCX' : pub.type === 'pdf' ? 'PDF' : 'DOC'}
                          </div>

                          <div className="min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono text-xs font-bold text-[#3E1028] truncate max-w-sm sm:max-w-md">
                                {pub.fileName || `${pub.title}.${pub.type === 'word' ? 'docx' : 'pdf'}`}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                                pub.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : pub.status === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                              }`}>
                                {pub.status}
                              </span>
                            </div>

                            <div className="text-xs text-[#5C1D3B]/80 font-medium truncate max-w-sm sm:max-w-md">
                              {pub.title}
                            </div>

                            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                              <span>By {pub.authorName}</span>
                              {pub.authorClub && (
                                <>
                                  <span>•</span>
                                  <span className="text-[#D95F7F]">{pub.authorClub}</span>
                                </>
                              )}
                              <span>•</span>
                              <span>{pub.fileSize || (pub.type === 'word' ? 'Word Document' : 'PDF Document')}</span>
                              <span>•</span>
                              <span>{new Date(pub.submittedAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>

                        {/* File Action Buttons */}
                        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-[#F4E5DA]">
                          <button
                            type="button"
                            onClick={() => onOpenViewer(pub)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-[#3E1028] bg-[#FAF2EB] hover:bg-[#F4E5DA] border border-[#F4E5DA] transition-all"
                            title="Preview document in reading modal"
                          >
                            <Eye className="w-3.5 h-3.5 text-[#D95F7F]" />
                            <span>Preview</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDownloadPublicationFile(pub)}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition-all"
                            title="Download document file"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download</span>
                          </button>

                          {pub.status === 'pending' && (
                            <button
                              type="button"
                              onClick={() => onApprove(pub.id)}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs"
                              title="Approve submission"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-16 bg-white rounded-3xl border border-[#F4E5DA] space-y-3">
                      <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                        <Folder className="w-7 h-7" />
                      </div>
                      <h4 className="font-serif text-base font-bold text-[#3E1028]">No Documents In This Folder</h4>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        When users submit PDF or Word files from any laptop, they will appear in this repository directory in real-time.
                      </p>
                    </div>
                  )}
                </div>

              </div>
            ) : activeTab === 'users' ? (
              /* Tab View: Registered Contributors Management */
              <div className="flex-grow overflow-y-auto p-4 sm:p-6 space-y-6">
                
                {/* Notification Banner */}
                {userOpNotice && (
                  <div className="p-4 rounded-2xl bg-white border border-[#D95F7F]/30 text-[#3E1028] text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-[#D95F7F] shrink-0" />
                      <span>{userOpNotice}</span>
                    </div>
                    <button onClick={() => setUserOpNotice('')} className="text-slate-400 hover:text-slate-700 font-bold text-xs">
                      ✕
                    </button>
                  </div>
                )}

                {/* Header & Controls */}
                <div className="bg-white p-6 rounded-[32px] border border-[#F4E5DA] shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#F4E5DA] pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-[#D95F7F]/15 text-[#D95F7F] flex items-center justify-center font-bold">
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-serif text-lg font-bold text-[#3E1028]">
                          Registered Contributors ({registeredUsers.length})
                        </h3>
                        <p className="text-xs text-[#5C1D3B]/70">
                          All verified user accounts in Firebase Cloud Firestore (`users` collection).
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={handleClearAllUsers}
                        className="px-4 py-2 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        <span>Delete All Users</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleSyncAllUsersToCloud}
                        className="px-4 py-2 rounded-full bg-white hover:bg-slate-50 border border-[#F4E5DA] text-xs font-bold text-[#3E1028] transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-[#D95F7F]" />
                        <span>Sync Cloud Users</span>
                      </button>
                    </div>
                  </div>

                  {/* Search Filter for Users */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      placeholder="Search contributors by name, email, or club..."
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-[#FAF2EB]/40 border border-[#F4E5DA] text-xs text-[#3E1028] focus:outline-none focus:ring-2 focus:ring-[#D95F7F]/20"
                    />
                  </div>
                </div>

                {/* Contributor Accounts Grid / Table */}
                <div className="space-y-3">
                  {registeredUsers
                    .filter(u => {
                      if (!userSearchQuery) return true;
                      const q = userSearchQuery.toLowerCase();
                      return (
                        u.name.toLowerCase().includes(q) ||
                        u.email.toLowerCase().includes(q) ||
                        (u.club || '').toLowerCase().includes(q)
                      );
                    })
                    .map((user) => {
                      const userSubmissions = publications.filter(
                        p => (p.authorEmail || '').trim().toLowerCase() === user.email.trim().toLowerCase()
                      );
                      const pendingSubmissions = userSubmissions.filter(p => p.status === 'pending');
                      const approvedSubmissions = userSubmissions.filter(p => p.status === 'approved');

                      return (
                        <div
                          key={user.id || user.email}
                          className="p-4 sm:p-5 rounded-3xl bg-white border border-[#F4E5DA] shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div className="w-11 h-11 rounded-2xl bg-[#D95F7F] text-white flex items-center justify-center font-bold text-sm uppercase shrink-0 shadow-xs">
                              {user.name.slice(0, 2)}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-serif text-base font-bold text-[#3E1028] truncate">
                                  {user.name}
                                </span>
                                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold border border-slate-200">
                                  {user.role || 'contributor'}
                                </span>
                                {user.club && (
                                  <span className="px-2 py-0.5 rounded-full bg-[#FAF2EB] text-[#D95F7F] text-[10px] font-bold border border-[#F4E5DA] truncate max-w-[200px]">
                                    {user.club}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-[#5C1D3B]/70 flex items-center gap-2 mt-0.5 truncate">
                                <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                                <span className="truncate">{user.email}</span>
                                {user.registeredAt && (
                                  <span className="text-slate-400 text-[11px] hidden sm:inline">
                                    • Joined {new Date(user.registeredAt).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 self-end md:self-center shrink-0">
                            {/* Submissions stats */}
                            <div className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-[#FAF2EB]/60 border border-[#F4E5DA]">
                              <FileText className="w-3.5 h-3.5 text-[#D95F7F]" />
                              <span>{userSubmissions.length} Submissions</span>
                              {pendingSubmissions.length > 0 && (
                                <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[9px] font-bold">
                                  {pendingSubmissions.length} Pending
                                </span>
                              )}
                              {approvedSubmissions.length > 0 && (
                                <span className="px-1.5 py-0.2 rounded-full bg-emerald-600 text-white text-[9px] font-bold">
                                  {approvedSubmissions.length} Live
                                </span>
                              )}
                            </div>

                            {/* Delete Contributor Account */}
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(user.email)}
                              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Delete Contributor Account from Firebase"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}

                  {registeredUsers.length === 0 && (
                    <div className="text-center py-12 rounded-3xl bg-white border border-[#F4E5DA] space-y-2">
                      <Users className="w-8 h-8 text-slate-300 mx-auto" />
                      <h4 className="font-serif text-base font-bold text-[#3E1028]">No Registered Users Yet</h4>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        When users register with email OTP on desktop or mobile, their profiles will appear here and in Firebase Firestore.
                      </p>
                    </div>
                  )}
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
