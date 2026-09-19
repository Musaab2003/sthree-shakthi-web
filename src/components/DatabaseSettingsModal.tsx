import React, { useState } from 'react';
import { 
  X, 
  Database, 
  CheckCircle2, 
  Copy, 
  Check, 
  ExternalLink, 
  Server, 
  ShieldCheck, 
  HardDrive,
  Code
} from 'lucide-react';
import { DatabaseConfig } from '../types';

interface DatabaseSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: DatabaseConfig;
  onSaveConfig: (cfg: DatabaseConfig) => void;
}

const SAMPLE_SQL_SCHEMA = `-- 1. Create Publications Table (Supports PDF, Word, Flipbook, Blogs)
CREATE TABLE IF NOT EXISTS publications (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  author_name TEXT NOT NULL,
  author_email TEXT NOT NULL,
  author_club TEXT,
  category TEXT NOT NULL,
  type TEXT NOT NULL, -- 'pdf', 'word', 'flipbook', 'drive', 'article'
  summary TEXT NOT NULL,
  content TEXT,
  embed_url TEXT,
  file_name TEXT,
  file_size TEXT,
  file_data TEXT,
  cover_image TEXT NOT NULL,
  tags TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  is_featured INTEGER DEFAULT 0,
  submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  approved_at DATETIME,
  rejected_reason TEXT,
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  read_time_minutes INTEGER DEFAULT 5
);

-- 2. Newsletter Subscribers
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  subscribed_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Admin Credentials & Cryptographic SHA-256 Hashed Passwords
CREATE TABLE IF NOT EXISTS admin_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'admin',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert Default Admin Account (SHA-256 hash of 'admin123')
INSERT OR IGNORE INTO admin_users (username, password_hash, role)
VALUES (
  'admin',
  '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9',
  'superadmin'
);`;

export const DatabaseSettingsModal: React.FC<DatabaseSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
}) => {
  const [dbUrl, setDbUrl] = useState(config.databaseUrl || '');
  const [token, setToken] = useState(config.authToken || '');
  const [copiedSql, setCopiedSql] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleCopySql = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(SAMPLE_SQL_SCHEMA);
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 2000);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig({
      type: 'turso',
      databaseUrl: dbUrl.trim(),
      authToken: token.trim(),
      connected: !!(dbUrl.trim() && token.trim()),
      lastSyncedAt: new Date().toISOString()
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-brand-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-purple-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-purple-100 bg-emerald-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-900 font-display">
                  Database Setup: Turso (LibSQL/SQLite)
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase border border-emerald-300">
                  9 GB Free Tier
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Zero server maintenance, instant edge queries, and built-in web document browser.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-200/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-grow overflow-y-auto p-6 space-y-6">
          
          {/* Quick Advantage Badges */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1">
              <HardDrive className="w-4 h-4 text-emerald-600 mx-auto" />
              <div className="text-xs font-bold text-slate-800">9 GB Storage</div>
              <div className="text-[10px] text-slate-500">100% Free Forever</div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1">
              <Server className="w-4 h-4 text-brand-600 mx-auto" />
              <div className="text-xs font-bold text-slate-800">1 Billion Reads</div>
              <div className="text-[10px] text-slate-500">Fast Edge Cloud</div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1">
              <ShieldCheck className="w-4 h-4 text-purple-600 mx-auto" />
              <div className="text-xs font-bold text-slate-800">Web Dashboard</div>
              <div className="text-[10px] text-slate-500">View all tables online</div>
            </div>
          </div>

          {/* 3 Step Setup Guide */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 font-display">
              How to Connect Your Free Turso Database:
            </h3>

            <div className="space-y-2 text-xs text-slate-700">
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-purple-50/60 border border-purple-100">
                <span className="w-5 h-5 rounded-full bg-brand-700 text-white font-bold flex items-center justify-center text-[10px] shrink-0">1</span>
                <div>
                  Sign up for free at <a href="https://turso.tech" target="_blank" rel="noreferrer" className="text-brand-700 font-bold underline inline-flex items-center gap-1">turso.tech <ExternalLink className="w-3 h-3" /></a> and create a database (e.g. <code>sthree-shakthi-db</code>).
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-purple-50/60 border border-purple-100">
                <span className="w-5 h-5 rounded-full bg-brand-700 text-white font-bold flex items-center justify-center text-[10px] shrink-0">2</span>
                <div>
                  Run the SQL migration below in the <strong>Turso Cloud Web Shell</strong> (or CLI) to create the tables.
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-purple-50/60 border border-purple-100">
                <span className="w-5 h-5 rounded-full bg-brand-700 text-white font-bold flex items-center justify-center text-[10px] shrink-0">3</span>
                <div>
                  Copy your <strong>Database URL</strong> (<code>libsql://...</code>) and <strong>Auth Token</strong> into the fields below.
                </div>
              </div>
            </div>
          </div>

          {/* SQL Schema Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Code className="w-4 h-4 text-brand-600" />
                Turso SQL Schema (Copy & Paste)
              </span>
              <button
                type="button"
                onClick={handleCopySql}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-100 text-brand-800 text-[11px] font-bold hover:bg-purple-200 transition-colors"
              >
                {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSql ? 'Copied!' : 'Copy SQL'}</span>
              </button>
            </div>
            <pre className="p-3.5 rounded-xl bg-slate-900 text-purple-200 font-mono text-[11px] overflow-x-auto max-h-40 border border-slate-800">
              {SAMPLE_SQL_SCHEMA}
            </pre>
          </div>

          {/* Configuration Form */}
          <form onSubmit={handleSave} className="space-y-4 pt-2 border-t border-slate-100">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800">
                Turso Database URL (libsql://...)
              </label>
              <input
                type="text"
                placeholder="libsql://sthree-shakthi-db-yourname.turso.io"
                value={dbUrl}
                onChange={(e) => setDbUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800">
                Turso Auth Token
              </label>
              <input
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            {savedSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Configuration saved successfully!</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-500">
                * Built-in local persistence keeps data active even before cloud sync.
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md transition-colors"
                >
                  Save Connection
                </button>
              </div>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
};
