import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  increment,
  Firestore,
  Unsubscribe 
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, FirebaseStorage } from 'firebase/storage';
import { Publication, PublicationStatus, FirebaseConfig, AdminAccount, UserAccount, UserNotification } from '../types';

const STORAGE_KEY = 'sthree_shakthi_firebase_config_v1';

export const DEFAULT_FIREBASE_CONFIG: FirebaseConfig = {
  apiKey: ((import.meta as any).env?.VITE_FIREBASE_API_KEY as string) || 'AIzaSyBwDsJa5SD4CICvHpGszWUB9b5h5sYnih0',
  authDomain: ((import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN as string) || 'tsl-sri-shakthi.firebaseapp.com',
  projectId: ((import.meta as any).env?.VITE_FIREBASE_PROJECT_ID as string) || 'tsl-sri-shakthi',
  storageBucket: ((import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET as string) || 'tsl-sri-shakthi.firebasestorage.app',
  messagingSenderId: ((import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID as string) || '790098341477',
  appId: ((import.meta as any).env?.VITE_FIREBASE_APP_ID as string) || '1:790098341477:web:4a6c1b01977ab10949608c',
  measurementId: ((import.meta as any).env?.VITE_FIREBASE_MEASUREMENT_ID as string) || 'G-JE3JKBCM97'
};

let cachedDb: Firestore | null = null;
let cachedApp: FirebaseApp | null = null;
let cachedStorage: FirebaseStorage | null = null;

export const firebaseService = {
  getConfig(): FirebaseConfig {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          apiKey: parsed.apiKey || DEFAULT_FIREBASE_CONFIG.apiKey,
          authDomain: parsed.authDomain || DEFAULT_FIREBASE_CONFIG.authDomain,
          projectId: parsed.projectId || DEFAULT_FIREBASE_CONFIG.projectId,
          storageBucket: parsed.storageBucket || DEFAULT_FIREBASE_CONFIG.storageBucket,
          messagingSenderId: parsed.messagingSenderId || DEFAULT_FIREBASE_CONFIG.messagingSenderId,
          appId: parsed.appId || DEFAULT_FIREBASE_CONFIG.appId,
          measurementId: parsed.measurementId || DEFAULT_FIREBASE_CONFIG.measurementId
        };
      }
    } catch {}
    return DEFAULT_FIREBASE_CONFIG;
  },

  saveConfig(cfg: FirebaseConfig): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
      cachedApp = null;
      cachedDb = null;
    } catch (e) {
      console.error('Failed to save Firebase config:', e);
    }
  },

  isConfigured(): boolean {
    const cfg = this.getConfig();
    return Boolean(cfg.apiKey && cfg.projectId && cfg.appId);
  },

  getDb(): Firestore | null {
    if (cachedDb) return cachedDb;
    const cfg = this.getConfig();
    if (!cfg.apiKey || !cfg.projectId || !cfg.appId) {
      return null;
    }
    try {
      if (getApps().length === 0) {
        cachedApp = initializeApp(cfg);
      } else {
        cachedApp = getApp();
      }
      cachedDb = getFirestore(cachedApp);
      return cachedDb;
    } catch (err) {
      console.warn('Firebase initialization error:', err);
      return null;
    }
  },

  getStorage(): FirebaseStorage | null {
    if (cachedStorage) return cachedStorage;
    const cfg = this.getConfig();
    if (!cfg.apiKey || !cfg.projectId || !cfg.appId) {
      return null;
    }
    try {
      if (getApps().length === 0) {
        cachedApp = initializeApp(cfg);
      } else {
        cachedApp = getApp();
      }
      cachedStorage = getStorage(cachedApp);
      return cachedStorage;
    } catch (err) {
      console.warn('Firebase Storage initialization error:', err);
      return null;
    }
  },

  async uploadPublicationFile(file: File | Blob, pubId: string, fileName: string): Promise<string | null> {
    const storage = this.getStorage();
    if (!storage) return null;
    try {
      const uploadTask = (async () => {
        const cleanFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
        const storageRef = ref(storage, `publications/${pubId}/${cleanFileName}`);
        const snapshot = await uploadBytes(storageRef, file);
        return await getDownloadURL(snapshot.ref);
      })();

      const timeoutTask = new Promise<null>((resolve) => setTimeout(() => resolve(null), 2500));
      return await Promise.race([uploadTask, timeoutTask]);
    } catch (e) {
      console.warn('Firebase Storage upload notice:', e);
      return null;
    }
  },

  async testConnection(): Promise<{ success: boolean; message: string }> {
    const db = this.getDb();
    if (!db) {
      return { 
        success: false, 
        message: 'Firebase configuration is incomplete. Please enter your Firebase API Key, Project ID, and App ID in the Cloud Database settings.' 
      };
    }
    try {
      const pubsCol = collection(db, 'publications');
      const snap = await getDocs(query(pubsCol));
      return { 
        success: true, 
        message: `?? Connected to Firebase Cloud Firestore successfully! Active collection has ${snap.size} publication document(s).` 
      };
    } catch (err: any) {
      return { 
        success: false, 
        message: `Firebase Connection Error: ${err?.message || 'Please check Firestore rules and configuration.'}` 
      };
    }
  },

  listenToPublications(callback: (pubs: Publication[]) => void): Unsubscribe | null {
    const db = this.getDb();
    if (!db) return null;
    try {
      const q = collection(db, 'publications');
      return onSnapshot(q, (snapshot) => {
        const pubs: Publication[] = snapshot.docs
          .filter(d => !d.id.startsWith('chunk-') && !d.id.includes('__chunk') && !(d.data()?.tags || []).includes('FILE_CHUNK'))
          .map(d => {
            const data = d.data();
            return {
              id: d.id,
              authorId: data.authorId || undefined,
              title: data.title || 'Untitled',
              subtitle: data.subtitle || undefined,
              authorName: data.authorName || 'Anonymous',
              authorEmail: data.authorEmail || '',
              authorClub: data.authorClub || undefined,
              category: data.category || 'story',
              type: data.type || 'pdf',
              summary: data.summary || '',
              content: data.content || undefined,
              embedUrl: data.embedUrl || undefined,
              fileName: data.fileName || undefined,
              fileSize: data.fileSize || undefined,
              fileData: data.fileData || undefined,
              chunkCount: Number(data.chunkCount) || undefined,
              coverImage: data.coverImage || '/campaign-poster.jpg',
              tags: Array.isArray(data.tags) ? data.tags : [],
              status: (data.status || 'pending') as PublicationStatus,
              isFeatured: Boolean(data.isFeatured),
              submittedAt: data.submittedAt || new Date().toISOString(),
              approvedAt: data.approvedAt || undefined,
              rejectedReason: data.rejectedReason || undefined,
              views: Number(data.views) || 0,
              likes: Number(data.likes) || 0,
              readTimeMinutes: Number(data.readTimeMinutes) || 5
            };
          });
        pubs.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
        callback(pubs);
      }, (error) => {
        console.warn('Firebase publications listener notice:', error);
      });
    } catch (e) {
      console.warn('Failed to attach Firebase listener:', e);
      return null;
    }
  },

  async syncAllPublications(): Promise<Publication[] | null> {
    const db = this.getDb();
    if (!db) return null;
    try {
      const q = collection(db, 'publications');
      const snapshot = await getDocs(q);
      const pubs: Publication[] = snapshot.docs
        .filter(d => !d.id.startsWith('chunk-') && !d.id.includes('__chunk') && !(d.data()?.tags || []).includes('FILE_CHUNK'))
        .map(d => {
          const data = d.data();
          return {
            id: d.id,
            authorId: data.authorId || undefined,
            title: data.title || 'Untitled',
            subtitle: data.subtitle || undefined,
            authorName: data.authorName || 'Anonymous',
            authorEmail: data.authorEmail || '',
            authorClub: data.authorClub || undefined,
            category: data.category || 'story',
            type: data.type || 'pdf',
            summary: data.summary || '',
            content: data.content || undefined,
            embedUrl: data.embedUrl || undefined,
            fileName: data.fileName || undefined,
            fileSize: data.fileSize || undefined,
            fileData: data.fileData || undefined,
            chunkCount: Number(data.chunkCount) || undefined,
            coverImage: data.coverImage || '/campaign-poster.jpg',
            tags: Array.isArray(data.tags) ? data.tags : [],
            status: (data.status || 'pending') as PublicationStatus,
            isFeatured: Boolean(data.isFeatured),
            submittedAt: data.submittedAt || new Date().toISOString(),
            approvedAt: data.approvedAt || undefined,
            rejectedReason: data.rejectedReason || undefined,
            views: Number(data.views) || 0,
            likes: Number(data.likes) || 0,
            readTimeMinutes: Number(data.readTimeMinutes) || 5
          };
        });
      pubs.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
      return pubs;
    } catch (err) {
      console.warn('Firebase syncAllPublications warning:', err);
      return null;
    }
  },

  async insertPublication(pub: Publication): Promise<boolean> {
    const db = this.getDb();
    if (!db) return false;
    try {
      const docRef = doc(db, 'publications', pub.id);
      const cleanData: Record<string, any> = {
        authorId: pub.authorId || null,
        title: pub.title || 'Untitled',
        subtitle: pub.subtitle || null,
        authorName: pub.authorName || 'Anonymous',
        authorEmail: pub.authorEmail || '',
        authorClub: pub.authorClub || null,
        category: pub.category || 'story',
        type: pub.type || 'pdf',
        summary: pub.summary || '',
        content: pub.content || null,
        embedUrl: pub.embedUrl || null,
        fileName: pub.fileName || null,
        fileSize: pub.fileSize || null,
        fileData: (pub.fileData && pub.fileData.length < 500000) ? pub.fileData : null,
        chunkCount: pub.chunkCount || null,
        coverImage: pub.coverImage || '/campaign-poster.jpg',
        tags: pub.tags || [],
        status: pub.status || 'pending',
        isFeatured: Boolean(pub.isFeatured),
        submittedAt: pub.submittedAt || new Date().toISOString(),
        approvedAt: pub.approvedAt || null,
        rejectedReason: pub.rejectedReason || null,
        views: Number(pub.views) || 0,
        likes: Number(pub.likes) || 0,
        readTimeMinutes: Number(pub.readTimeMinutes) || 5
      };
      const insertTask = setDoc(docRef, cleanData, { merge: true }).then(() => true);
      const timeoutTask = new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 4000));
      return await Promise.race([insertTask, timeoutTask]);
    } catch (err) {
      console.error('Firebase insertPublication error:', err);
      return false;
    }
  },

  async updatePublicationStatus(id: string, status: PublicationStatus, rejectedReason?: string): Promise<boolean> {
    const db = this.getDb();
    if (!db) return false;
    try {
      const docRef = doc(db, 'publications', id);
      const updates: Record<string, any> = {
        status,
        rejectedReason: rejectedReason || null
      };
      if (status === 'approved') {
        updates.approvedAt = new Date().toISOString();
      }
      await updateDoc(docRef, updates);
      return true;
    } catch (err) {
      console.error('Firebase updatePublicationStatus error:', err);
      return false;
    }
  },

  async togglePublicationFeature(id: string, isFeatured: boolean): Promise<boolean> {
    const db = this.getDb();
    if (!db) return false;
    try {
      const docRef = doc(db, 'publications', id);
      await updateDoc(docRef, { isFeatured });
      return true;
    } catch (err) {
      console.error('Firebase togglePublicationFeature error:', err);
      return false;
    }
  },

  async updatePublicationLikes(id: string, likes: number): Promise<boolean> {
    const db = this.getDb();
    if (!db) return false;
    try {
      const docRef = doc(db, 'publications', id);
      await updateDoc(docRef, { likes: Math.max(0, likes) });
      return true;
    } catch (err) {
      console.warn('Firebase updatePublicationLikes notice:', err);
      return false;
    }
  },

  async incrementPublicationViews(id: string): Promise<boolean> {
    const db = this.getDb();
    if (!db) return false;
    try {
      const docRef = doc(db, 'publications', id);
      await updateDoc(docRef, { views: increment(1) });
      return true;
    } catch (err) {
      console.warn('Firebase incrementPublicationViews notice:', err);
      return false;
    }
  },

  async deletePublication(id: string): Promise<boolean> {
    const db = this.getDb();
    if (!db) return false;
    try {
      const docRef = doc(db, 'publications', id);
      await deleteDoc(docRef);
      // Clean up chunk documents in parallel
      const chunkDeletions = [];
      for (let i = 0; i < 30; i++) {
        const chunkDocRef = doc(db, 'publications', `chunk-${id}-${String(i).padStart(4, '0')}`);
        chunkDeletions.push(deleteDoc(chunkDocRef).catch(() => {}));
      }
      await Promise.all(chunkDeletions);
      return true;
    } catch (err) {
      console.error('Firebase deletePublication error:', err);
      return false;
    }
  },

  async savePublicationFileToFirestore(pubId: string, fileData: string): Promise<boolean> {
    const db = this.getDb();
    if (!db || !fileData) return false;
    try {
      const CHUNK_SIZE = 450 * 1024; // 450 KB per chunk (guaranteed under Firestore 1MB document limit)
      const totalChunks = Math.ceil(fileData.length / CHUNK_SIZE);
      
      const batchPromises = [];
      for (let i = 0; i < totalChunks; i++) {
        const chunkStr = fileData.substring(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
        const chunkId = `chunk-${pubId}-${String(i).padStart(4, '0')}`;
        
        // Save as valid publication document in permitted publications collection
        const chunkDocData = {
          title: 'FILE_CHUNK',
          subtitle: null,
          authorName: 'System',
          authorEmail: 'system@cluster05.org',
          authorClub: null,
          category: 'story',
          type: 'pdf',
          summary: `Chunk ${i} of ${totalChunks} for ${pubId}`,
          content: pubId,
          embedUrl: null,
          fileName: chunkId,
          fileSize: null,
          fileData: chunkStr,
          coverImage: '/campaign-poster.jpg',
          tags: ['FILE_CHUNK', pubId],
          status: 'approved',
          isFeatured: false,
          submittedAt: new Date().toISOString(),
          approvedAt: null,
          rejectedReason: null,
          views: 0,
          likes: 0,
          readTimeMinutes: 0
        };

        batchPromises.push(setDoc(doc(db, 'publications', chunkId), chunkDocData));
      }

      // Also record chunkCount on main document
      batchPromises.push(updateDoc(doc(db, 'publications', pubId), { chunkCount: totalChunks }).catch(() => {}));

      const saveTask = Promise.all(batchPromises).then(() => true);
      const timeoutTask = new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 12000));
      return await Promise.race([saveTask, timeoutTask]);
    } catch (e) {
      console.warn('Firestore chunk save notice:', e);
      return false;
    }
  },

  async getPublicationFileData(id: string): Promise<string | null> {
    const db = this.getDb();
    if (!db || !id) return null;
    try {
      // 1. Fetch main doc
      const docRef = doc(db, 'publications', id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        if (data?.fileData && data.fileData.length > 50) {
          return data.fileData;
        }

        const count = Number(data?.chunkCount) || 0;
        if (count > 0) {
          // Parallel fetch all known chunks simultaneously in 1 network burst
          const chunkPromises = [];
          for (let i = 0; i < count; i++) {
            const chunkId = `chunk-${id}-${String(i).padStart(4, '0')}`;
            chunkPromises.push(getDoc(doc(db, 'publications', chunkId)));
          }
          const chunkSnaps = await Promise.all(chunkPromises);
          let combined = '';
          for (const cs of chunkSnaps) {
            if (cs.exists()) {
              combined += cs.data()?.fileData || '';
            }
          }
          if (combined.length > 50) {
            return combined;
          }
        }
      }

      // 2. Fallback: Fast parallel batch fetch of first 12 chunks
      const batchPromises = [];
      for (let i = 0; i < 12; i++) {
        const chunkId = `chunk-${id}-${String(i).padStart(4, '0')}`;
        batchPromises.push(getDoc(doc(db, 'publications', chunkId)));
      }
      const chunkSnaps = await Promise.all(batchPromises);
      let combined = '';
      for (const cs of chunkSnaps) {
        if (cs.exists()) {
          combined += cs.data()?.fileData || '';
        }
      }

      if (combined && combined.length > 50) {
        return combined;
      }

      return null;
    } catch (e) {
      console.warn('Firestore getPublicationFileData notice:', e);
      return null;
    }
  },

  listenToSubscribers(callback: (subs: string[]) => void): Unsubscribe | null {
    const db = this.getDb();
    if (!db) return null;
    try {
      return onSnapshot(collection(db, 'newsletter_subscribers'), (snapshot) => {
        const emails = snapshot.docs.map(d => String(d.id).replace(/___/g, '.')).filter(Boolean);
        callback(emails);
      });
    } catch {
      return null;
    }
  },

  async syncSubscribers(): Promise<string[] | null> {
    const db = this.getDb();
    if (!db) return null;
    try {
      const snapshot = await getDocs(collection(db, 'newsletter_subscribers'));
      return snapshot.docs.map(d => String(d.id).replace(/___/g, '.')).filter(Boolean);
    } catch {
      return null;
    }
  },

  async insertSubscriber(email: string): Promise<boolean> {
    const db = this.getDb();
    if (!db) return false;
    try {
      const clean = email.trim().toLowerCase();
      const docId = clean.replace(/\./g, '___');
      await setDoc(doc(db, 'newsletter_subscribers', docId), {
        email: clean,
        subscribedAt: new Date().toISOString()
      }, { merge: true });
      return true;
    } catch (err) {
      console.error('Firebase insertSubscriber error:', err);
      return false;
    }
  },

  async removeSubscriber(email: string): Promise<boolean> {
    const db = this.getDb();
    if (!db) return false;
    try {
      const clean = email.trim().toLowerCase();
      const docId = clean.replace(/\./g, '___');
      await deleteDoc(doc(db, 'newsletter_subscribers', docId));
      return true;
    } catch (err) {
      console.error('Firebase removeSubscriber error:', err);
      return false;
    }
  },

  // 4. Admin Accounts Collection in Firestore
  async getAdminByUsername(username: string): Promise<AdminAccount | null> {
    const db = this.getDb();
    if (!db || !username) return null;
    try {
      const cleanUser = username.trim().toLowerCase();
      const docRef = doc(db, 'admins', cleanUser);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        return {
          username: cleanUser,
          email: data.email || '',
          passwordHash: data.passwordHash || data.password || '',
          updatedAt: data.updatedAt || new Date().toISOString()
        };
      }
      return null;
    } catch (e) {
      console.warn('Error fetching admin by username from Firestore:', e);
      return null;
    }
  },

  async getAdmins(): Promise<AdminAccount[]> {
    const db = this.getDb();
    if (!db) return [];
    try {
      const snap = await getDocs(collection(db, 'admins'));
      if (snap.empty) return [];
      return snap.docs.map(d => {
        const data = d.data();
        const user = (data.username || d.id || '').trim().toLowerCase();
        return {
          username: user,
          email: data.email || '',
          passwordHash: data.passwordHash || data.password || '',
          updatedAt: data.updatedAt || new Date().toISOString()
        };
      });
    } catch (e) {
      console.warn('Error fetching admins from Firestore:', e);
      return [];
    }
  },

  async saveAdmin(account: AdminAccount): Promise<boolean> {
    const db = this.getDb();
    if (!db) return false;
    try {
      const cleanUser = account.username.trim().toLowerCase();
      await setDoc(doc(db, 'admins', cleanUser), {
        username: cleanUser,
        email: account.email || '',
        passwordHash: account.passwordHash,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      return true;
    } catch (err) {
      console.error('Firebase saveAdmin error:', err);
      return false;
    }
  },

  async deleteAdmin(username: string): Promise<boolean> {
    const db = this.getDb();
    if (!db) return false;
    try {
      const cleanUser = username.trim().toLowerCase();
      await deleteDoc(doc(db, 'admins', cleanUser));
      return true;
    } catch (err) {
      console.error('Firebase deleteAdmin error:', err);
      return false;
    }
  },

  // 5. Contributor User Accounts Collection in Firestore
  async getUserByEmail(email: string): Promise<UserAccount | null> {
    const db = this.getDb();
    if (!db || !email) return null;
    try {
      const cleanEmail = email.trim().toLowerCase();
      const docId = cleanEmail.replace(/\./g, '___');
      const docRef = doc(db, 'users', docId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        return {
          id: data.id || docId,
          name: data.name || '',
          email: cleanEmail,
          passwordHash: data.passwordHash || '',
          club: data.club || undefined,
          role: data.role || 'contributor',
          registeredAt: data.registeredAt || new Date().toISOString(),
          updatedAt: data.updatedAt || undefined
        };
      }
      return null;
    } catch (e) {
      console.warn('Error fetching user by email from Firestore:', e);
      return null;
    }
  },

  async saveUser(user: UserAccount): Promise<boolean> {
    const db = this.getDb();
    if (!db || !user.email) return false;
    try {
      const cleanEmail = user.email.trim().toLowerCase();
      const docId = cleanEmail.replace(/\./g, '___');
      await setDoc(doc(db, 'users', docId), {
        id: user.id || docId,
        name: user.name || '',
        email: cleanEmail,
        passwordHash: user.passwordHash,
        club: user.club || null,
        role: user.role || 'contributor',
        registeredAt: user.registeredAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }, { merge: true });
      return true;
    } catch (err) {
      console.error('Firebase saveUser error:', err);
      return false;
    }
  },

  async getUsers(): Promise<UserAccount[]> {
    const db = this.getDb();
    if (!db) return [];
    try {
      const snap = await getDocs(collection(db, 'users'));
      if (snap.empty) return [];
      return snap.docs.map(d => {
        const data = d.data();
        return {
          id: data.id || d.id,
          name: data.name || '',
          email: (data.email || d.id.replace(/___/g, '.')).trim().toLowerCase(),
          passwordHash: data.passwordHash || '',
          club: data.club || undefined,
          role: data.role || 'contributor',
          registeredAt: data.registeredAt || new Date().toISOString(),
          updatedAt: data.updatedAt || undefined
        };
      });
    } catch (e) {
      console.warn('Error fetching users from Firestore:', e);
      return [];
    }
  },

  // 6. Registration Email OTP Verification Storage
  async saveEmailOtp(email: string, otp: string, expiresAt: number): Promise<boolean> {
    const db = this.getDb();
    if (!db || !email || !otp) return false;
    try {
      const cleanEmail = email.trim().toLowerCase();
      const docId = cleanEmail.replace(/\./g, '___');
      await setDoc(doc(db, 'email_otps', docId), {
        email: cleanEmail,
        otp: String(otp).trim(),
        expiresAt,
        createdAt: new Date().toISOString()
      }, { merge: true });
      return true;
    } catch (e) {
      console.warn('Firebase saveEmailOtp notice:', e);
      return false;
    }
  },

  async getStoredOtp(email: string): Promise<{ otp: string; expiresAt: number } | null> {
    const db = this.getDb();
    if (!db || !email) return null;
    try {
      const cleanEmail = email.trim().toLowerCase();
      const docId = cleanEmail.replace(/\./g, '___');
      const snap = await getDoc(doc(db, 'email_otps', docId));
      if (snap.exists()) {
        const data = snap.data();
        return {
          otp: String(data.otp || ''),
          expiresAt: Number(data.expiresAt) || 0
        };
      }
      return null;
    } catch (e) {
      console.warn('Firebase getStoredOtp notice:', e);
      return null;
    }
  },

  async deleteEmailOtp(email: string): Promise<boolean> {
    const db = this.getDb();
    if (!db || !email) return false;
    try {
      const cleanEmail = email.trim().toLowerCase();
      const docId = cleanEmail.replace(/\./g, '___');
      await deleteDoc(doc(db, 'email_otps', docId));
      return true;
    } catch (e) {
      console.warn('Firebase deleteEmailOtp notice:', e);
      return false;
    }
  },

  // 12. Notification Operations
  async saveNotification(notif: UserNotification): Promise<boolean> {
    const db = this.getDb();
    if (!db || !notif.id) return false;
    try {
      await setDoc(doc(db, 'user_notifications', notif.id), {
        ...notif,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      return true;
    } catch (e) {
      console.warn('Error saving notification in Firestore:', e);
      return false;
    }
  },

  async getUserNotifications(email: string): Promise<UserNotification[]> {
    const db = this.getDb();
    if (!db || !email) return [];
    try {
      const snap = await getDocs(collection(db, 'user_notifications'));
      if (snap.empty) return [];
      const cleanEmail = email.trim().toLowerCase();
      const list: UserNotification[] = [];
      snap.docs.forEach(d => {
        const data = d.data() as UserNotification;
        if ((data.userEmail || '').trim().toLowerCase() === cleanEmail) {
          list.push({ ...data, id: data.id || d.id });
        }
      });
      return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (e) {
      console.warn('Error fetching user notifications from Firestore:', e);
      return [];
    }
  },

  async updateNotificationReadStatus(id: string, read: boolean): Promise<boolean> {
    const db = this.getDb();
    if (!db || !id) return false;
    try {
      await updateDoc(doc(db, 'user_notifications', id), {
        read,
        updatedAt: new Date().toISOString()
      });
      return true;
    } catch (e) {
      console.warn('Error updating notification read status in Firestore:', e);
      return false;
    }
  },

  async deleteNotification(id: string): Promise<boolean> {
    const db = this.getDb();
    if (!db || !id) return false;
    try {
      await deleteDoc(doc(db, 'user_notifications', id));
      return true;
    } catch (e) {
      console.warn('Error deleting notification from Firestore:', e);
      return false;
    }
  }
};

