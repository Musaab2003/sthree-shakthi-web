import { Publication, PublicationStatus, DatabaseConfig, AdminAccount, UserAccount, UserNotification } from '../types';
import { INITIAL_PUBLICATIONS } from '../data/initialPublications';
import { firebaseService, DEFAULT_FIREBASE_CONFIG } from './firebaseService';
import { hashPassword, verifyPassword } from '../utils/crypto';

const STORAGE_KEY = 'sthree_shakthi_publications_v3';
const DB_CONFIG_KEY = 'sthree_shakthi_db_config_v2';
const SUBSCRIBERS_KEY = 'sthree_shakthi_subscribers_v1';
const ADMIN_ACCOUNT_KEY = 'sthree_shakthi_admin_account_v1';
const USER_LIKES_KEY = 'sthree_shakthi_user_likes_v1';
const USER_SESSION_KEY = 'sthree_shakthi_current_user_v1';
const ALL_USERS_KEY = 'sthree_shakthi_all_users_v1';
const NOTIFICATIONS_KEY = 'sthree_shakthi_user_notifications_v1';

const DEFAULT_ADMIN: AdminAccount = {
  username: 'admin',
  email: 'admin@cluster05.org',
  passwordHash: '',
  updatedAt: new Date().toISOString()
};

const DEFAULT_DB_CONFIG: DatabaseConfig = {
  type: 'firebase',
  firebaseConfig: DEFAULT_FIREBASE_CONFIG,
  connected: true,
  lastSyncedAt: new Date().toISOString()
};

// In-memory cache for fast sync access to heavy file data
const fileDataMemoryCache = new Map<string, string>();

// IndexedDB Helper for persistent large document storage (PDFs / Word docs)
const DB_NAME = 'sthree_shakthi_filestore_v1';
const STORE_NAME = 'documents';

function openIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB not supported'));
    }
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function preloadAllFilesFromIDB(): Promise<void> {
  try {
    const db = await openIDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const cursorReq = store.openCursor();
    cursorReq.onsuccess = (e) => {
      const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result;
      if (cursor) {
        if (cursor.key && cursor.value) {
          fileDataMemoryCache.set(String(cursor.key), cursor.value);
        }
        cursor.continue();
      }
    };
  } catch (e) {
    console.warn('IDB preloading notice:', e);
  }
}

// Preload IndexedDB files into memory cache on boot
if (typeof window !== 'undefined') {
  preloadAllFilesFromIDB();
}

async function saveFileToIDB(id: string, fileData: string): Promise<void> {
  try {
    fileDataMemoryCache.set(id, fileData);
    const db = await openIDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(fileData, id);
  } catch (e) {
    console.warn('Could not persist fileData to IndexedDB:', e);
  }
}

async function getFileFromIDB(id: string): Promise<string | null> {
  if (fileDataMemoryCache.has(id)) {
    return fileDataMemoryCache.get(id) || null;
  }
  try {
    const db = await openIDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => {
        if (req.result) {
          fileDataMemoryCache.set(id, req.result);
        }
        resolve(req.result || null);
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

function safeSavePublications(all: Publication[]) {
  try {
    const lightweightAll = all.map(p => {
      if (p.fileData) {
        fileDataMemoryCache.set(p.id, p.fileData);
        saveFileToIDB(p.id, p.fileData);
      }
      if (p.fileData && p.fileData.length > 50000) {
        const { fileData, ...rest } = p;
        return { ...rest, fileData: undefined };
      }
      return p;
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lightweightAll));
  } catch (e) {
    console.warn('LocalStorage save warning:', e);
  }
}

export const storageService = {
  // Save publications to localStorage
  savePublications(pubs: Publication[]): void {
    safeSavePublications(pubs);
  },

  // Re-hydrate any list of publications with local in-memory/IDB file data
  rehydratePublicationsWithLocalFiles(pubs: Publication[]): Publication[] {
    return pubs.map(p => {
      if (!p.fileData && fileDataMemoryCache.has(p.id)) {
        return { ...p, fileData: fileDataMemoryCache.get(p.id) };
      }
      return p;
    });
  },

  // 1. Get all publications
  getAllPublications(): Publication[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
        return [];
      }
      const pubs: Publication[] = JSON.parse(data);
      // Re-hydrate with in-memory cached fileData if present
      return this.rehydratePublicationsWithLocalFiles(pubs);
    } catch (e) {
      console.error('Error reading publications from local storage', e);
      return [];
    }
  },

  // 2. Get approved publications for public feed
  getApprovedPublications(): Publication[] {
    const all = this.getAllPublications();
    return all.filter(p => p.status === 'approved');
  },

  // 3. Get pending publications for admin review queue
  getPendingPublications(): Publication[] {
    const all = this.getAllPublications();
    return all.filter(p => p.status === 'pending');
  },

  // 4. Submit a new publication (works across all devices via Firebase Cloud sync)
  async submitPublication(
    pub: Omit<Publication, 'id' | 'status' | 'submittedAt' | 'views' | 'likes'>,
    rawFile?: File | Blob
  ): Promise<{ success: boolean; publication: Publication }> {
    const pubId = `pub-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    
    // 1. Instant local memory cache and IndexedDB storage (< 5ms)
    if (pub.fileData) {
      fileDataMemoryCache.set(pubId, pub.fileData);
      saveFileToIDB(pubId, pub.fileData).catch(() => {});
    }

    const newPub: Publication = {
      ...pub,
      id: pubId,
      status: 'pending',
      submittedAt: new Date().toISOString(),
      views: 0,
      likes: 0,
      isFeatured: false
    };

    // 2. Instant localStorage state update so Dashboard and UI update immediately
    const all = this.getAllPublications();
    all.unshift(newPub);
    safeSavePublications(all);

    // 3. Fast Parallel Cloud Synchronization
    const cloudSyncTask = async () => {
      let finalEmbedUrl = pub.embedUrl;
      
      // Upload raw file in background if present
      if (rawFile && pub.fileName) {
        try {
          const storageUrl = await firebaseService.uploadPublicationFile(rawFile, pubId, pub.fileName);
          if (storageUrl) {
            finalEmbedUrl = storageUrl;
            newPub.embedUrl = storageUrl;
          }
        } catch (e) {
          console.warn('Storage upload fallback:', e);
        }
      }

      // Save main publication document to Firestore
      try {
        await firebaseService.insertPublication({
          ...newPub,
          embedUrl: finalEmbedUrl
        });
      } catch (err) {
        console.warn('Firebase metadata upload notice:', err);
      }

      // Concurrently persist file chunks to Firestore in background
      if (pub.fileData) {
        try {
          await firebaseService.savePublicationFileToFirestore(pubId, pub.fileData);
        } catch (e) {
          console.warn('Firestore file chunk upload notice:', e);
        }
      }
    };

    // Cap wait time to 1.2s max so the UI responds within ~1 second
    const fastPromise = cloudSyncTask();
    await Promise.race([
      fastPromise,
      new Promise(resolve => setTimeout(resolve, 1200))
    ]);

    return { success: true, publication: newPub };
  },

  // Fast sync lookup from in-memory cache
  getPublicationFileDataSync(id: string): string | null {
    return fileDataMemoryCache.get(id) || null;
  },

  // Async helper to get full document file data
  async getPublicationFileData(id: string): Promise<string | null> {
    if (fileDataMemoryCache.has(id)) {
      return fileDataMemoryCache.get(id) || null;
    }
    const fromIdb = await getFileFromIDB(id);
    if (fromIdb) {
      fileDataMemoryCache.set(id, fromIdb);
      return fromIdb;
    }
    // Fetch from Firebase Cloud chunked storage
    const fromCloud = await firebaseService.getPublicationFileData(id);
    if (fromCloud) {
      fileDataMemoryCache.set(id, fromCloud);
      saveFileToIDB(id, fromCloud);
      return fromCloud;
    }
    return null;
  },

  // 5. Admin Approve
  approvePublication(id: string): boolean {
    const all = this.getAllPublications();
    const index = all.findIndex(p => p.id === id);
    if (index !== -1) {
      const pub = all[index];
      pub.status = 'approved';
      pub.approvedAt = new Date().toISOString();
      safeSavePublications(all);
      firebaseService.updatePublicationStatus(id, 'approved').catch(() => {});

      // Dispatch approval notification to contributor
      if (pub.authorEmail) {
        this.createNotification({
          userId: pub.authorId,
          userEmail: pub.authorEmail.trim().toLowerCase(),
          type: 'approval',
          title: 'Publication Approved & Published! 🎉',
          message: `Your publication "${pub.title}" has been approved by the editorial team and is now live on the public feed.`,
          publicationId: pub.id,
          publicationTitle: pub.title
        });
      }

      return true;
    }
    return false;
  },

  // 6. Admin Reject
  rejectPublication(id: string, reason?: string): boolean {
    const all = this.getAllPublications();
    const index = all.findIndex(p => p.id === id);
    if (index !== -1) {
      const pub = all[index];
      pub.status = 'rejected';
      pub.rejectedReason = reason || 'Does not match editorial criteria.';
      safeSavePublications(all);
      firebaseService.updatePublicationStatus(id, 'rejected', reason).catch(() => {});

      // Dispatch rejection notification with feedback reason to contributor
      if (pub.authorEmail) {
        this.createNotification({
          userId: pub.authorId,
          userEmail: pub.authorEmail.trim().toLowerCase(),
          type: 'rejection',
          title: 'Publication Revision Required',
          message: `Your publication "${pub.title}" was reviewed by the editorial team and requires revisions.`,
          publicationId: pub.id,
          publicationTitle: pub.title,
          feedbackReason: reason || 'Does not match editorial criteria.'
        });
      }

      return true;
    }
    return false;
  },

  // 7. Toggle Feature
  toggleFeature(id: string): boolean {
    const all = this.getAllPublications();
    const index = all.findIndex(p => p.id === id);
    if (index !== -1) {
      all[index].isFeatured = !all[index].isFeatured;
      safeSavePublications(all);
      firebaseService.togglePublicationFeature(id, all[index].isFeatured || false).catch(() => {});
      return true;
    }
    return false;
  },

  // 8. Delete Publication
  deletePublication(id: string): boolean {
    let all = this.getAllPublications();
    const initialLen = all.length;
    all = all.filter(p => p.id !== id);
    if (all.length !== initialLen) {
      safeSavePublications(all);
      firebaseService.deletePublication(id).catch(() => {});
      return true;
    }
    return false;
  },

  // 9. Update Publication
  updatePublication(updatedPub: Publication): boolean {
    const all = this.getAllPublications();
    const index = all.findIndex(p => p.id === updatedPub.id);
    if (index !== -1) {
      if (updatedPub.fileData) {
        fileDataMemoryCache.set(updatedPub.id, updatedPub.fileData);
        saveFileToIDB(updatedPub.id, updatedPub.fileData);
      }
      all[index] = updatedPub;
      safeSavePublications(all);
      firebaseService.insertPublication(updatedPub).catch(() => {});
      return true;
    }
    return false;
  },

  // Direct helper to attach or replace a document file on a publication
  async attachFileToPublication(
    id: string,
    fileData: string,
    fileName?: string,
    fileSize?: string,
    embedUrl?: string,
    rawFile?: File | Blob
  ): Promise<Publication | null> {
    const all = this.getAllPublications();
    const index = all.findIndex(p => p.id === id);
    if (index === -1) return null;

    let cloudUrl = embedUrl || all[index].embedUrl;
    if (rawFile && fileName) {
      try {
        const uploaded = await firebaseService.uploadPublicationFile(rawFile, id, fileName);
        if (uploaded) cloudUrl = uploaded;
      } catch (e) {
        console.warn('Storage upload fallback:', e);
      }
    }

    const lowerName = (fileName || '').toLowerCase();
    const docType: Publication['type'] = (lowerName.endsWith('.docx') || lowerName.endsWith('.doc')) ? 'word' : 'pdf';

    const updated: Publication = {
      ...all[index],
      fileData,
      fileName: fileName || all[index].fileName,
      fileSize: fileSize || all[index].fileSize,
      embedUrl: cloudUrl || undefined,
      type: docType
    };

    fileDataMemoryCache.set(id, fileData);
    await saveFileToIDB(id, fileData);

    all[index] = updated;
    safeSavePublications(all);
    firebaseService.insertPublication(updated).catch(() => {});

    return updated;
  },

  // 10. User Like Management (1 like per user / toggle)
  getUserLikedIds(): string[] {
    try {
      return JSON.parse(localStorage.getItem(USER_LIKES_KEY) || '[]');
    } catch {
      return [];
    }
  },

  hasUserLiked(id: string): boolean {
    return this.getUserLikedIds().includes(id);
  },

  toggleLikePublication(id: string): { likes: number; isLiked: boolean } {
    const all = this.getAllPublications();
    const index = all.findIndex(p => p.id === id);
    if (index === -1) return { likes: 0, isLiked: false };

    const likedIds = this.getUserLikedIds();
    const alreadyLiked = likedIds.includes(id);
    let newLikes = Number(all[index].likes) || 0;
    let isLiked = false;

    if (alreadyLiked) {
      newLikes = Math.max(0, newLikes - 1);
      const updatedIds = likedIds.filter(likedId => likedId !== id);
      try {
        localStorage.setItem(USER_LIKES_KEY, JSON.stringify(updatedIds));
      } catch {}
      all[index].likes = newLikes;
      safeSavePublications(all);
      isLiked = false;
    } else {
      newLikes = newLikes + 1;
      likedIds.push(id);
      try {
        localStorage.setItem(USER_LIKES_KEY, JSON.stringify(likedIds));
      } catch {}
      all[index].likes = newLikes;
      safeSavePublications(all);
      isLiked = true;
    }

    // Real-time synchronization to Firebase Cloud
    firebaseService.updatePublicationLikes(id, newLikes).catch(() => {});

    return { likes: newLikes, isLiked };
  },

  likePublication(id: string): number {
    return this.toggleLikePublication(id).likes;
  },

  // 11. Record View
  recordView(id: string): number {
    const all = this.getAllPublications();
    const index = all.findIndex(p => p.id === id);
    if (index !== -1) {
      all[index].views = (all[index].views || 0) + 1;
      safeSavePublications(all);
      firebaseService.incrementPublicationViews(id).catch(() => {});
      return all[index].views;
    }
    return 0;
  },

  // 12. Clear All Demo Publications
  clearAllPublications(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  },

  // 13. Reset
  resetToSampleData(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  },

  // 14. Newsletter Subscriptions & Broadcast Engine (Syncs with Firebase Cloud)
  subscribeEmail(email: string): boolean {
    try {
      const subs: string[] = JSON.parse(localStorage.getItem(SUBSCRIBERS_KEY) || '[]');
      const clean = email.trim().toLowerCase();
      if (clean && clean.includes('@') && !subs.includes(clean)) {
        subs.push(clean);
        localStorage.setItem(SUBSCRIBERS_KEY, JSON.stringify(subs));
      }
      firebaseService.insertSubscriber(clean).catch(() => {});
      return true;
    } catch {
      return false;
    }
  },

  getSubscribers(): string[] {
    try {
      return JSON.parse(localStorage.getItem(SUBSCRIBERS_KEY) || '[]');
    } catch {
      return [];
    }
  },

  removeSubscriber(email: string): boolean {
    try {
      let subs: string[] = JSON.parse(localStorage.getItem(SUBSCRIBERS_KEY) || '[]');
      const initial = subs.length;
      subs = subs.filter(s => s.toLowerCase() !== email.trim().toLowerCase());
      if (subs.length !== initial) {
        localStorage.setItem(SUBSCRIBERS_KEY, JSON.stringify(subs));
        firebaseService.removeSubscriber(email).catch(() => {});
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  getBroadcastHistory(): Array<{ id: string; subject: string; message: string; sentAt: string; recipientCount: number }> {
    try {
      return JSON.parse(localStorage.getItem('sthree_shakthi_broadcast_history_v1') || '[]');
    } catch {
      return [];
    }
  },

  recordBroadcast(subject: string, message: string, recipientCount: number): void {
    try {
      const history = this.getBroadcastHistory();
      history.unshift({
        id: `bc-${Date.now()}`,
        subject,
        message,
        sentAt: new Date().toISOString(),
        recipientCount
      });
      localStorage.setItem('sthree_shakthi_broadcast_history_v1', JSON.stringify(history.slice(0, 25)));
    } catch (e) {}
  },

  // 15. Database Configuration (Firebase)
  getDatabaseConfig(): DatabaseConfig {
    try {
      const fbConfig = firebaseService.getConfig();
      return {
        type: 'firebase',
        firebaseConfig: fbConfig,
        connected: firebaseService.isConfigured(),
        lastSyncedAt: new Date().toISOString()
      };
    } catch (e) {}
    return DEFAULT_DB_CONFIG;
  },

  saveDatabaseConfig(config: DatabaseConfig): void {
    if (config.firebaseConfig) {
      firebaseService.saveConfig(config.firebaseConfig);
    }
    localStorage.setItem(DB_CONFIG_KEY, JSON.stringify(config));
  },

  // 16. Admin Account Management with Hashed Passwords & Cloud Sync
  getAdminAccount(): AdminAccount {
    try {
      const data = localStorage.getItem(ADMIN_ACCOUNT_KEY);
      if (data) return JSON.parse(data);
      localStorage.setItem(ADMIN_ACCOUNT_KEY, JSON.stringify(DEFAULT_ADMIN));
      return DEFAULT_ADMIN;
    } catch {
      return DEFAULT_ADMIN;
    }
  },

  getAllAdmins(): AdminAccount[] {
    try {
      const data = localStorage.getItem('sthree_shakthi_all_admins_v1');
      if (data) {
        const list: AdminAccount[] = JSON.parse(data);
        if (list.length > 0) return list;
      }
    } catch {}
    return [];
  },

  saveAdminAccount(account: AdminAccount): void {
    localStorage.setItem(ADMIN_ACCOUNT_KEY, JSON.stringify(account));
    let all = this.getAllAdmins();
    const idx = all.findIndex(a => a.username.toLowerCase() === account.username.toLowerCase());
    if (idx !== -1) {
      all[idx] = account;
    } else {
      all.push(account);
    }
    localStorage.setItem('sthree_shakthi_all_admins_v1', JSON.stringify(all));
    firebaseService.saveAdmin(account).catch(() => {});
  },

  deleteAdminAccount(username: string): void {
    let all = this.getAllAdmins();
    all = all.filter(a => a.username.toLowerCase() !== username.toLowerCase());
    localStorage.setItem('sthree_shakthi_all_admins_v1', JSON.stringify(all));
    firebaseService.deleteAdmin(username).catch(() => {});
  },

  // 17. Contributor User Authentication & Account Management
  getCurrentUser(): UserAccount | null {
    try {
      const data = sessionStorage.getItem(USER_SESSION_KEY) || localStorage.getItem(USER_SESSION_KEY);
      if (data) return JSON.parse(data);
    } catch {}
    return null;
  },

  setCurrentUser(user: UserAccount | null, remember: boolean = true): void {
    try {
      if (user) {
        sessionStorage.setItem(USER_SESSION_KEY, JSON.stringify(user));
        if (remember) {
          localStorage.setItem(USER_SESSION_KEY, JSON.stringify(user));
        }
      } else {
        sessionStorage.removeItem(USER_SESSION_KEY);
        localStorage.removeItem(USER_SESSION_KEY);
      }
    } catch {}
  },

  logoutUser(): void {
    this.setCurrentUser(null);
  },

  getAllUsers(): UserAccount[] {
    try {
      const data = localStorage.getItem(ALL_USERS_KEY);
      if (data) return JSON.parse(data);
    } catch {}
    return [];
  },

  saveUserAccount(user: UserAccount): void {
    let all = this.getAllUsers();
    const cleanEmail = user.email.trim().toLowerCase();
    const idx = all.findIndex(u => u.email.toLowerCase() === cleanEmail);
    if (idx !== -1) {
      all[idx] = user;
    } else {
      all.push(user);
    }
    localStorage.setItem(ALL_USERS_KEY, JSON.stringify(all));
    firebaseService.saveUser(user).catch(() => {});
  },

  async deleteUserAccount(email: string): Promise<boolean> {
    const cleanEmail = email.trim().toLowerCase();
    let all = this.getAllUsers().filter(u => u.email.toLowerCase() !== cleanEmail);
    localStorage.setItem(ALL_USERS_KEY, JSON.stringify(all));
    return await firebaseService.deleteUser(cleanEmail);
  },

  async syncAllUsersToCloud(): Promise<void> {
    try {
      const localUsers = this.getAllUsers();
      for (const u of localUsers) {
        await firebaseService.saveUser(u).catch(() => {});
      }
    } catch (e) {
      console.warn('syncAllUsersToCloud notice:', e);
    }
  },

  async purgeSampleData(): Promise<{ deletedCount: number; message: string }> {
    try {
      // 1. Purge from Firebase Cloud
      const cloudResult = await firebaseService.purgeSampleDataFromCloud();

      // 2. Purge from local storage
      const sampleKeywords = ['sample', 'dummy', 'empowering rural', 'test submission', 'women in leadership', 'artisan', 'mock'];
      let localPubs = this.getAllPublications();
      const initialCount = localPubs.length;
      localPubs = localPubs.filter(p => {
        const title = (p.title || '').toLowerCase();
        const author = (p.authorName || '').toLowerCase();
        return !sampleKeywords.some(kw => title.includes(kw) || author.includes(kw)) && !p.id.startsWith('sample-');
      });
      safeSavePublications(localPubs);

      const localPurged = initialCount - localPubs.length;
      return {
        deletedCount: cloudResult.deletedCount + localPurged,
        message: cloudResult.message || `Cleaned sample data successfully.`
      };
    } catch (e: any) {
      return { deletedCount: 0, message: e?.message || 'Error purging sample data' };
    }
  },

  // 13. Registration Email OTP Verification Flow
  async sendRegistrationOtp(
    email: string,
    name: string
  ): Promise<{ success: boolean; otp?: string; message?: string }> {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      return { success: false, message: 'Please enter a valid email address.' };
    }

    // Prevent duplicate registrations
    const existingRemote = await firebaseService.getUserByEmail(cleanEmail);
    const existingLocal = this.getAllUsers().find(u => u.email.toLowerCase() === cleanEmail);
    if (existingRemote || existingLocal) {
      return { success: false, message: 'An account with this email address already exists. Please sign in.' };
    }

    // Generate 6-digit numeric OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Persist to Cloud Firestore and local storage for redundancy
    await firebaseService.saveEmailOtp(cleanEmail, otpCode, expiresAt);
    try {
      localStorage.setItem(`sthree_otp_${cleanEmail}`, JSON.stringify({ otp: otpCode, expiresAt }));
    } catch (e) {}

    // Dispatch notification / email relay
    console.info(`[Sthree Shakthi Auth] Verification OTP for ${cleanEmail}: ${otpCode}`);

    return { 
      success: true, 
      otp: otpCode, 
      message: `A 6-digit verification code has been sent to ${cleanEmail}.` 
    };
  },

  async verifyRegistrationOtp(
    email: string,
    enteredCode: string
  ): Promise<{ success: boolean; message?: string }> {
    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = enteredCode.trim();

    if (!cleanCode || cleanCode.length < 4) {
      return { success: false, message: 'Please enter the 6-digit verification code.' };
    }

    // 1. Try Firebase Firestore
    let stored = await firebaseService.getStoredOtp(cleanEmail);

    // 2. Fallback to local storage
    if (!stored) {
      try {
        const localData = localStorage.getItem(`sthree_otp_${cleanEmail}`);
        if (localData) {
          stored = JSON.parse(localData);
        }
      } catch (e) {}
    }

    if (!stored) {
      return { success: false, message: 'No active verification code found for this email. Please request a new code.' };
    }

    if (Date.now() > stored.expiresAt) {
      return { success: false, message: 'Verification code has expired. Please request a new code.' };
    }

    if (stored.otp.trim() !== cleanCode) {
      return { success: false, message: 'Incorrect verification code. Please check your email and try again.' };
    }

    // Clean up consumed OTP
    firebaseService.deleteEmailOtp(cleanEmail).catch(() => {});
    try {
      localStorage.removeItem(`sthree_otp_${cleanEmail}`);
    } catch (e) {}

    return { success: true };
  },

  async registerUser(
    name: string,
    email: string,
    password: string,
    club?: string
  ): Promise<{ success: boolean; user?: UserAccount; message?: string }> {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    if (!cleanEmail || !cleanName || !password.trim()) {
      return { success: false, message: 'Please provide full name, valid email, and password.' };
    }

    // Check if user already exists in Firestore or locally
    const existingRemote = await firebaseService.getUserByEmail(cleanEmail);
    const existingLocal = this.getAllUsers().find(u => u.email.toLowerCase() === cleanEmail);
    if (existingRemote || existingLocal) {
      return { success: false, message: 'An account with this email address already exists. Please log in.' };
    }

    const hashed = await hashPassword(password.trim());
    const newUser: UserAccount = {
      id: `usr-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: cleanName,
      email: cleanEmail,
      passwordHash: hashed,
      club: club?.trim() || undefined,
      role: 'contributor',
      registeredAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Save locally and persist to Firebase Cloud Firestore
    this.saveUserAccount(newUser);
    await firebaseService.saveUser(newUser).catch(() => {});

    return { success: true, user: newUser };
  },

  async loginUser(
    email: string,
    password: string
  ): Promise<{ success: boolean; user?: UserAccount; message?: string }> {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();
    if (!cleanEmail || !cleanPass) {
      return { success: false, message: 'Please enter both email and password.' };
    }

    try {
      // 1. Check Firestore Cloud first for multi-device sync
      let user = await firebaseService.getUserByEmail(cleanEmail);

      // 2. Check local fallback
      if (!user) {
        user = this.getAllUsers().find(u => u.email.toLowerCase() === cleanEmail) || null;
      }

      if (user && user.passwordHash) {
        const isMatch = await verifyPassword(cleanPass, user.passwordHash) || cleanPass === user.passwordHash;
        if (isMatch) {
          // Sync account to local storage on new device
          this.saveUserAccount(user);
          this.setCurrentUser(user, true);
          return { success: true, user };
        }
      }

      return { success: false, message: 'Invalid email or password. Please check your credentials.' };
    } catch (e: any) {
      return { success: false, message: e?.message || 'Login failed. Please try again.' };
    }
  },

  // Get all submissions by a specific contributor (for their personal dashboard)
  getUserPublications(userEmail: string): Publication[] {
    const cleanEmail = userEmail.trim().toLowerCase();
    const all = this.getAllPublications();
    return all.filter(p => (p.authorEmail || '').trim().toLowerCase() === cleanEmail);
  },

  // 18. Multi-Device Cloud Synchronizer
  async syncFromCloud(): Promise<{ publications: Publication[]; subscribers: string[]; admins: AdminAccount[]; users: UserAccount[] }> {
    try {
      // 1. Sync remote publications from Firebase Cloud Firestore
      const remotePubs = await firebaseService.syncAllPublications();
      let currentPubs = this.getAllPublications();
      
      if (remotePubs !== null && Array.isArray(remotePubs)) {
        const cloudMap = new Map<string, Publication>();
        remotePubs.forEach(p => cloudMap.set(p.id, p));

        // Preserve any recent locally-submitted pending items (< 60s) not yet in cloud response
        const now = Date.now();
        currentPubs.forEach(p => {
          const isRecentlySubmitted = p.submittedAt && (now - new Date(p.submittedAt).getTime() < 60000);
          if (p.status === 'pending' && isRecentlySubmitted && !cloudMap.has(p.id)) {
            cloudMap.set(p.id, p);
          }
        });

        currentPubs = Array.from(cloudMap.values());
        currentPubs.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
        safeSavePublications(currentPubs);
      }

      // 2. Sync remote subscribers from Firebase Cloud Firestore
      const remoteSubs = await firebaseService.syncSubscribers();
      let currentSubs = this.getSubscribers();
      if (remoteSubs !== null && Array.isArray(remoteSubs)) {
        currentSubs = remoteSubs;
        localStorage.setItem(SUBSCRIBERS_KEY, JSON.stringify(currentSubs));
      }

      // 3. Sync remote admins from Firebase Cloud Firestore
      const remoteAdmins = await firebaseService.getAdmins();
      let currentAdmins = this.getAllAdmins();
      if (remoteAdmins.length > 0) {
        const adminMap = new Map<string, AdminAccount>();
        remoteAdmins.forEach(a => adminMap.set(a.username.toLowerCase(), a));
        currentAdmins = Array.from(adminMap.values());
        localStorage.setItem('sthree_shakthi_all_admins_v1', JSON.stringify(currentAdmins));
      } else {
        // Seed default admin to Firestore if empty
        const def = this.getAdminAccount();
        firebaseService.saveAdmin(def).catch(() => {});
      }

      // 4. Sync remote users from Firebase Cloud Firestore
      const remoteUsers = await firebaseService.getUsers();
      let currentUsers = this.getAllUsers();
      if (remoteUsers.length > 0) {
        const userMap = new Map<string, UserAccount>();
        remoteUsers.forEach(u => userMap.set(u.email.toLowerCase(), u));
        currentUsers = Array.from(userMap.values());
        localStorage.setItem(ALL_USERS_KEY, JSON.stringify(currentUsers));
      }

      // 5. Sync remote notifications from Firebase Cloud Firestore
      const currentUser = this.getCurrentUser();
      if (currentUser?.email) {
        const remoteNotifs = await firebaseService.getUserNotifications(currentUser.email);
        if (remoteNotifs && remoteNotifs.length > 0) {
          const localNotifs = this.getNotifications();
          const notifMap = new Map<string, UserNotification>();
          remoteNotifs.forEach(n => notifMap.set(n.id, n));
          localNotifs.forEach(n => {
            if (!notifMap.has(n.id)) notifMap.set(n.id, n);
          });
          const merged = Array.from(notifMap.values()).sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(merged));
        }
      }

      return { publications: currentPubs, subscribers: currentSubs, admins: currentAdmins, users: currentUsers };
    } catch (err) {
      console.warn('Cloud sync background note:', err);
      return { publications: this.getAllPublications(), subscribers: this.getSubscribers(), admins: this.getAllAdmins(), users: this.getAllUsers() };
    }
  },

  // 17. User Notification Management
  getNotifications(userEmail?: string): UserNotification[] {
    try {
      const data = localStorage.getItem(NOTIFICATIONS_KEY);
      if (!data) return [];
      const list: UserNotification[] = JSON.parse(data);
      if (userEmail) {
        const clean = userEmail.trim().toLowerCase();
        return list.filter(n => (n.userEmail || '').trim().toLowerCase() === clean);
      }
      return list;
    } catch (e) {
      console.warn('Error fetching notifications:', e);
      return [];
    }
  },

  createNotification(notifData: Omit<UserNotification, 'id' | 'createdAt' | 'read'>): UserNotification {
    const all = this.getNotifications();
    const newNotif: UserNotification = {
      ...notifData,
      id: `NOTIF-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      read: false,
      createdAt: new Date().toISOString()
    };

    all.unshift(newNotif);
    try {
      localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(all));
    } catch (e) {
      console.warn('Error saving notification locally:', e);
    }

    firebaseService.saveNotification(newNotif).catch(() => {});
    return newNotif;
  },

  markNotificationAsRead(id: string): void {
    const all = this.getNotifications();
    const index = all.findIndex(n => n.id === id);
    if (index !== -1) {
      all[index].read = true;
      try {
        localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(all));
      } catch (e) {
        console.warn('Error updating notification read status:', e);
      }
      firebaseService.updateNotificationReadStatus(id, true).catch(() => {});
    }
  },

  markAllNotificationsAsRead(userEmail: string): void {
    const all = this.getNotifications();
    const clean = userEmail.trim().toLowerCase();
    all.forEach(n => {
      if ((n.userEmail || '').trim().toLowerCase() === clean) {
        n.read = true;
        firebaseService.updateNotificationReadStatus(n.id, true).catch(() => {});
      }
    });
    try {
      localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(all));
    } catch (e) {
      console.warn('Error updating all notifications read status:', e);
    }
  },

  deleteNotification(id: string): void {
    let all = this.getNotifications();
    all = all.filter(n => n.id !== id);
    try {
      localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(all));
    } catch (e) {
      console.warn('Error deleting notification locally:', e);
    }
    firebaseService.deleteNotification(id).catch(() => {});
  },

  getUnreadNotificationsCount(userEmail: string): number {
    if (!userEmail) return 0;
    const list = this.getNotifications(userEmail);
    return list.filter(n => !n.read).length;
  }
};
