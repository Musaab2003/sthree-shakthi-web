import { Publication, PublicationStatus, DatabaseConfig, AdminAccount } from '../types';
import { INITIAL_PUBLICATIONS } from '../data/initialPublications';
import { tursoService } from './tursoService';

const STORAGE_KEY = 'sthree_shakthi_publications_v3';
const DB_CONFIG_KEY = 'sthree_shakthi_db_config_v2';
const SUBSCRIBERS_KEY = 'sthree_shakthi_subscribers_v1';
const ADMIN_ACCOUNT_KEY = 'sthree_shakthi_admin_account_v1';
const USER_LIKES_KEY = 'sthree_shakthi_user_likes_v1';

// SHA-256 hash of default password 'admin123'
const DEFAULT_PASSWORD_HASH = '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9';

const DEFAULT_ADMIN: AdminAccount = {
  username: 'admin',
  email: 'admin@cluster05.org',
  passwordHash: DEFAULT_PASSWORD_HASH,
  updatedAt: new Date().toISOString()
};

const DEFAULT_DB_CONFIG: DatabaseConfig = {
  type: 'turso',
  databaseUrl: 'libsql://sthree-shakthi-db-musaab2003.aws-ap-south-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODk3OTYxNTQsImlkIjoiMDFhMDdmMmEtM2EwMS03NmY0LWI2ZGUtYzE5YzU3OTY1ZDQ0Iiwia2lkIjoiY1JfdV81RVNLVXJFWTZWejNXMXFXbk5MVGNKeHU2cWZnajlXaFVJOU9MWSIsInJpZCI6ImY5YzUyZGI3LTBhNTItNDhhZC04YWU1LTg5MWZmOWVmYjdlNyJ9.lvfBa8bP0CZHqvzFW1Y1Ush4P5d7iopZKTFarkKjye56R5i7CDbFtqyspyZECyxUSqccoveHtdGbOEANOuZuCw',
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

async function saveFileToIDB(id: string, fileData: string): Promise<void> {
  try {
    const db = await openIDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(fileData, id);
  } catch (e) {
    console.warn('Could not persist fileData to IndexedDB:', e);
  }
}

async function getFileFromIDB(id: string): Promise<string | null> {
  try {
    const db = await openIDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

function safeSavePublications(all: Publication[]) {
  try {
    const lightweightAll = all.map(p => {
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
      return pubs.map(p => {
        if (!p.fileData && fileDataMemoryCache.has(p.id)) {
          return { ...p, fileData: fileDataMemoryCache.get(p.id) };
        }
        return p;
      });
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

  // 4. Submit a new publication (works across all laptops via Turso Cloud sync)
  async submitPublication(pub: Omit<Publication, 'id' | 'status' | 'submittedAt' | 'views' | 'likes'>): Promise<{ success: boolean; publication: Publication }> {
    const pubId = `pub-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    
    // Cache heavy fileData in memory and persist in IndexedDB
    if (pub.fileData) {
      fileDataMemoryCache.set(pubId, pub.fileData);
      saveFileToIDB(pubId, pub.fileData);
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

    const all = this.getAllPublications();
    all.unshift(newPub);
    safeSavePublications(all);

    // Sync to Turso Cloud directly and await result
    try {
      const inserted = await tursoService.insertPublication(newPub);
      if (!inserted && newPub.fileData) {
        // Fallback: If heavy payload hit network limits, insert metadata and preview
        const lightweightPub = { ...newPub, fileData: undefined };
        await tursoService.insertPublication(lightweightPub);
      }
    } catch (err) {
      console.warn('Turso Cloud publish error:', err);
    }

    return { success: true, publication: newPub };
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
    // Fetch from Turso Cloud on demand
    const fromCloud = await tursoService.getPublicationFileData(id);
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
      all[index].status = 'approved';
      all[index].approvedAt = new Date().toISOString();
      safeSavePublications(all);
      tursoService.updatePublicationStatus(id, 'approved').catch(() => {});
      return true;
    }
    return false;
  },

  // 6. Admin Reject
  rejectPublication(id: string, reason?: string): boolean {
    const all = this.getAllPublications();
    const index = all.findIndex(p => p.id === id);
    if (index !== -1) {
      all[index].status = 'rejected';
      all[index].rejectedReason = reason || 'Does not match editorial criteria.';
      safeSavePublications(all);
      tursoService.updatePublicationStatus(id, 'rejected', reason).catch(() => {});
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
      tursoService.togglePublicationFeature(id, all[index].isFeatured || false).catch(() => {});
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
      tursoService.deletePublication(id).catch(() => {});
      return true;
    }
    return false;
  },

  // 9. Update Publication
  updatePublication(updatedPub: Publication): boolean {
    const all = this.getAllPublications();
    const index = all.findIndex(p => p.id === updatedPub.id);
    if (index !== -1) {
      all[index] = updatedPub;
      safeSavePublications(all);
      tursoService.insertPublication(updatedPub).catch(() => {});
      return true;
    }
    return false;
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

    if (alreadyLiked) {
      all[index].likes = Math.max(0, (all[index].likes || 1) - 1);
      const updatedIds = likedIds.filter(likedId => likedId !== id);
      try {
        localStorage.setItem(USER_LIKES_KEY, JSON.stringify(updatedIds));
      } catch {}
      safeSavePublications(all);
      return { likes: all[index].likes, isLiked: false };
    } else {
      all[index].likes = (all[index].likes || 0) + 1;
      likedIds.push(id);
      try {
        localStorage.setItem(USER_LIKES_KEY, JSON.stringify(likedIds));
      } catch {}
      safeSavePublications(all);
      return { likes: all[index].likes, isLiked: true };
    }
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

  // 14. Newsletter Subscriptions & Broadcast Engine (Syncs with Turso Cloud)
  subscribeEmail(email: string): boolean {
    try {
      const subs: string[] = JSON.parse(localStorage.getItem(SUBSCRIBERS_KEY) || '[]');
      const clean = email.trim().toLowerCase();
      if (clean && clean.includes('@') && !subs.includes(clean)) {
        subs.push(clean);
        localStorage.setItem(SUBSCRIBERS_KEY, JSON.stringify(subs));
      }
      tursoService.insertSubscriber(clean).catch(() => {});
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
        tursoService.removeSubscriber(email).catch(() => {});
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

  // 15. Database Configuration (Turso)
  getDatabaseConfig(): DatabaseConfig {
    try {
      const data = localStorage.getItem(DB_CONFIG_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        let modified = false;
        if (!parsed.authToken) {
          parsed.authToken = DEFAULT_DB_CONFIG.authToken;
          modified = true;
        }
        if (!parsed.databaseUrl) {
          parsed.databaseUrl = DEFAULT_DB_CONFIG.databaseUrl;
          modified = true;
        }
        if (modified) {
          localStorage.setItem(DB_CONFIG_KEY, JSON.stringify(parsed));
        }
        return parsed;
      }
      localStorage.setItem(DB_CONFIG_KEY, JSON.stringify(DEFAULT_DB_CONFIG));
      return DEFAULT_DB_CONFIG;
    } catch (e) {}
    return DEFAULT_DB_CONFIG;
  },

  saveDatabaseConfig(config: DatabaseConfig): void {
    localStorage.setItem(DB_CONFIG_KEY, JSON.stringify(config));
  },

  // 16. Admin Account Management with Hashed Passwords
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

  saveAdminAccount(account: AdminAccount): void {
    localStorage.setItem(ADMIN_ACCOUNT_KEY, JSON.stringify(account));
  },

  // 17. Multi-Device Cloud Synchronizer
  async syncFromCloud(): Promise<{ publications: Publication[]; subscribers: string[] }> {
    try {
      // 1. Sync remote publications from Turso Cloud
      const remotePubs = await tursoService.syncAllPublications();
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

      // 2. Sync remote subscribers from Turso Cloud
      const remoteSubs = await tursoService.syncSubscribers();
      let currentSubs = this.getSubscribers();
      if (remoteSubs !== null && Array.isArray(remoteSubs)) {
        currentSubs = remoteSubs;
        localStorage.setItem(SUBSCRIBERS_KEY, JSON.stringify(currentSubs));
      }

      return { publications: currentPubs, subscribers: currentSubs };
    } catch (err) {
      console.warn('Cloud sync background note:', err);
      return { publications: this.getAllPublications(), subscribers: this.getSubscribers() };
    }
  }
};
