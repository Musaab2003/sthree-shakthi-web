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
import { Publication, PublicationStatus, FirebaseConfig, AdminAccount } from '../types';

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
      const q = query(collection(db, 'publications'), orderBy('submittedAt', 'desc'));
      return onSnapshot(q, (snapshot) => {
        const pubs: Publication[] = snapshot.docs.map(d => {
          const data = d.data();
          return {
            id: d.id,
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
      const q = query(collection(db, 'publications'), orderBy('submittedAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
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
        fileData: pub.fileData || null,
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
      await setDoc(docRef, cleanData, { merge: true });
      return true;
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
      return true;
    } catch (err) {
      console.error('Firebase deletePublication error:', err);
      return false;
    }
  },

  async getPublicationFileData(id: string): Promise<string | null> {
    const db = this.getDb();
    if (!db) return null;
    try {
      const docRef = doc(db, 'publications', id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return snap.data()?.fileData || null;
      }
      return null;
    } catch {
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
  }
};

