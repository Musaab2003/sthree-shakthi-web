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
  Code,
  Eye,
  EyeOff
} from 'lucide-react';
import { DatabaseConfig, FirebaseConfig } from '../types';
import { firebaseService } from '../services/firebaseService';

interface DatabaseSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: DatabaseConfig;
  onSaveConfig: (cfg: DatabaseConfig) => void;
}

const FIRESTORE_RULES_SNIPPET = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}`;

export const DatabaseSettingsModal: React.FC<DatabaseSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
}) => {
  const currentFb = config.firebaseConfig || firebaseService.getConfig();
  const [apiKey, setApiKey] = useState(currentFb.apiKey || '');
  const [projectId, setProjectId] = useState(currentFb.projectId || '');
  const [appId, setAppId] = useState(currentFb.appId || '');
  const [authDomain, setAuthDomain] = useState(currentFb.authDomain || '');
  const [storageBucket, setStorageBucket] = useState(currentFb.storageBucket || '');
  const [messagingSenderId, setMessagingSenderId] = useState(currentFb.messagingSenderId || '');
  const [showApiKey, setShowApiKey] = useState(false);
  const [copiedRules, setCopiedRules] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleCopyRules = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(FIRESTORE_RULES_SNIPPET);
      setCopiedRules(true);
      setTimeout(() => setCopiedRules(false), 2000);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const fbConfig: FirebaseConfig = {
      apiKey: apiKey.trim(),
      projectId: projectId.trim(),
      appId: appId.trim(),
      authDomain: authDomain.trim(),
      storageBucket: storageBucket.trim(),
      messagingSenderId: messagingSenderId.trim()
    };
    firebaseService.saveConfig(fbConfig);
    onSaveConfig({
      type: 'firebase',
      firebaseConfig: fbConfig,
      connected: !!(fbConfig.apiKey && fbConfig.projectId && fbConfig.appId),
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
        className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-amber-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-amber-100 bg-amber-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-600 text-white flex items-center justify-center font-bold shadow-xs">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-900 font-display">
                  Database Setup: Google Firebase Cloud Firestore
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase border border-emerald-300">
                  Realtime Cloud
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Instant WebSocket sync, live multi-device publications, and persistent cloud storage.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-grow overflow-y-auto p-6 space-y-6">
          
          {/* Quick Advantage Badges */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1">
              <HardDrive className="w-4 h-4 text-amber-600 mx-auto" />
              <div className="text-xs font-bold text-slate-800">Cloud Firestore</div>
              <div className="text-[10px] text-slate-500">Global Google Cloud</div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1">
              <Server className="w-4 h-4 text-emerald-600 mx-auto" />
              <div className="text-xs font-bold text-slate-800">Realtime WebSocket</div>
              <div className="text-[10px] text-slate-500">Zero-Delay Live Sync</div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1">
              <ShieldCheck className="w-4 h-4 text-purple-600 mx-auto" />
              <div className="text-xs font-bold text-slate-800">Firebase Console</div>
              <div className="text-[10px] text-slate-500">Online Database Editor</div>
            </div>
          </div>

          {/* 3 Step Setup Guide */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 font-display">
              How to Connect Your Firebase Project:
            </h3>

            <div className="space-y-2 text-xs text-slate-700">
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50/60 border border-amber-100">
                <span className="w-5 h-5 rounded-full bg-amber-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0">1</span>
                <div>
                  Create a free project at <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" className="text-amber-700 font-bold underline inline-flex items-center gap-1">Firebase Console <ExternalLink className="w-3 h-3" /></a> and add a Web App.
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50/60 border border-amber-100">
                <span className="w-5 h-5 rounded-full bg-amber-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0">2</span>
                <div>
                  Under <strong>Build &gt; Firestore Database</strong>, click <strong>Create Database</strong> and set Security Rules.
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50/60 border border-amber-100">
                <span className="w-5 h-5 rounded-full bg-amber-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0">3</span>
                <div>
                  Paste your <code>apiKey</code>, <code>projectId</code>, and <code>appId</code> below.
                </div>
              </div>
            </div>
          </div>

          {/* Firestore Rules Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Code className="w-4 h-4 text-amber-600" />
                Firestore Security Rules
              </span>
              <button
                type="button"
                onClick={handleCopyRules}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 text-[11px] font-bold hover:bg-amber-200 transition-colors"
              >
                {copiedRules ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedRules ? 'Copied!' : 'Copy Rules'}</span>
              </button>
            </div>
            <pre className="p-3.5 rounded-xl bg-slate-900 text-amber-200 font-mono text-[11px] overflow-x-auto max-h-32 border border-slate-800">
              {FIRESTORE_RULES_SNIPPET}
            </pre>
          </div>

          {/* Configuration Form */}
          <form onSubmit={handleSave} className="space-y-4 pt-2 border-t border-slate-100">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  Firebase API Key <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    required
                    placeholder="AIzaSy..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700"
                  >
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-amber-600" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  Firebase Project ID <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="sthree-shakthi-12345"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  Firebase App ID <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="1:1234567890:web:abcdef12345"
                  value={appId}
                  onChange={(e) => setAppId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  Auth Domain (Optional)
                </label>
                <input
                  type="text"
                  placeholder="sthree-shakthi-12345.firebaseapp.com"
                  value={authDomain}
                  onChange={(e) => setAuthDomain(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  Storage Bucket (Optional)
                </label>
                <input
                  type="text"
                  placeholder="sthree-shakthi-12345.firebasestorage.app"
                  value={storageBucket}
                  onChange={(e) => setStorageBucket(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  Messaging Sender ID (Optional)
                </label>
                <input
                  type="text"
                  placeholder="123456789012"
                  value={messagingSenderId}
                  onChange={(e) => setMessagingSenderId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
            </div>

            {savedSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Firebase configuration saved successfully!</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-500">
                * Automatic local cache fallback keeps app fast & resilient.
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
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 shadow-md transition-colors"
                >
                  Save Firebase Connection
                </button>
              </div>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
};
