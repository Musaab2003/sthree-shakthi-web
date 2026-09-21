export type PublicationType = 'pdf' | 'word' | 'flipbook' | 'drive' | 'article';

export type PublicationStatus = 'pending' | 'approved' | 'rejected';

export type PublicationCategory = 
  | 'newsletter'
  | 'story'
  | 'guide'
  | 'update';

export interface Publication {
  id: string;
  authorId?: string;
  title: string;
  subtitle?: string;
  authorName: string;
  authorEmail: string;
  authorClub?: string;
  category: PublicationCategory;
  type: PublicationType;
  summary: string;
  content?: string;
  embedUrl?: string;
  fileName?: string;
  fileSize?: string;
  fileData?: string;
  chunkCount?: number;
  coverImage: string;
  tags: string[];
  status: PublicationStatus;
  isFeatured?: boolean;
  submittedAt: string;
  approvedAt?: string;
  rejectedReason?: string;
  views: number;
  likes: number;
  readTimeMinutes?: number;
}

export interface ClubContact {
  id: string;
  name: string;
  presidentName: string;
  presidentPhone: string;
  presidentEmail: string;
  secretaryName: string;
  secretaryRole?: string;
  secretaryPhone: string;
  secretaryEmail: string;
  jointSecretaryName?: string;
  jointSecretaryPhone?: string;
  jointSecretaryEmail?: string;
  location?: string;
  logoBadge?: string;
}

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId: string;
  measurementId?: string;
}

export interface DatabaseConfig {
  type: 'firebase' | 'local';
  firebaseConfig?: FirebaseConfig;
  connected: boolean;
  lastSyncedAt?: string;
}

export interface AdminAccount {
  username: string;
  email?: string;
  passwordHash: string;
  updatedAt: string;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  club?: string;
  role?: 'contributor' | 'admin';
  registeredAt: string;
  updatedAt?: string;
}

export interface UserNotification {
  id: string;
  userId?: string;
  userEmail: string;
  type: 'rejection' | 'approval' | 'system';
  title: string;
  message: string;
  publicationId: string;
  publicationTitle: string;
  feedbackReason?: string;
  read: boolean;
  createdAt: string;
}

export interface EmailConfig {
  provider: 'web3forms' | 'emailjs' | 'smtp' | 'custom';
  web3formsAccessKey?: string;
  emailjsServiceId?: string;
  emailjsTemplateId?: string;
  emailjsPublicKey?: string;
  senderEmail?: string;
  senderName?: string;
}



