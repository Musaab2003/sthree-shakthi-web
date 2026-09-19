export type PublicationType = 'pdf' | 'word' | 'flipbook' | 'drive' | 'article';

export type PublicationStatus = 'pending' | 'approved' | 'rejected';

export type PublicationCategory = 
  | 'newsletter'
  | 'story'
  | 'guide'
  | 'update';

export interface Publication {
  id: string;
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

export interface DatabaseConfig {
  type: 'turso' | 'local';
  databaseUrl: string;
  authToken: string;
  connected: boolean;
  lastSyncedAt?: string;
}

export interface AdminAccount {
  username: string;
  email?: string;
  passwordHash: string;
  updatedAt: string;
}

