import React, { useState } from 'react';
import { 
  Sparkles, 
  Send, 
  CheckCircle2, 
  Heart, 
  BookOpen, 
  Lock
} from 'lucide-react';
import { storageService } from '../services/storageService';

interface FooterProps {
  onOpenSubmitModal: () => void;
  onOpenAdminPortal: () => void;
  setActiveSection: (sec: string) => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenSubmitModal,
  onOpenAdminPortal,
  setActiveSection,
}) => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim() && email.includes('@')) {
      storageService.subscribeEmail(email);
      setSubscribed(true);
      setEmail('');
    }
  };

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="bg-[#3E1028] text-white pt-16 pb-12 border-t border-[#5C1D3B]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Newsletter Card */}
        <div className="mb-16 p-8 sm:p-10 rounded-[32px] bg-gradient-to-r from-[#5C1D3B] via-[#4A0E35] to-[#3E1028] border border-[#7E253E] shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            <div className="lg:col-span-7 space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D95F7F]/20 text-[#F8CAD5] text-xs font-bold border border-[#D95F7F]/30">
                <span>✦</span>
                <span>Stay Connected with Cluster 05</span>
              </div>
              <h3 className="font-serif text-2xl sm:text-4xl font-bold text-white">
                Subscribe to the Sthree Shakthi Newsletter
              </h3>
              <p className="text-xs sm:text-sm text-[#F8CAD5]/80 leading-relaxed">
                Receive monthly community publications, articles, and stories directly in your inbox.
              </p>
            </div>

            <div className="lg:col-span-5">
              {subscribed ? (
                <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>You're subscribed! You'll receive all upcoming community editions.</span>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="email"
                    required
                    placeholder="Enter your email address..."
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="px-4 py-3 rounded-full bg-white/10 border border-white/20 text-white placeholder-rose-200/50 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#D95F7F] flex-grow"
                  />
                  <button
                    type="submit"
                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#D95F7F] hover:bg-[#BE4465] text-white text-xs sm:text-sm font-bold shadow-lg shrink-0 transition-all"
                  >
                    <span>Subscribe</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              )}
            </div>

          </div>
        </div>

        {/* Main Footer Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-[#5C1D3B]/80">
          
          {/* Col 1 & 2: Branding */}
          <div className="lg:col-span-2 space-y-4 text-left">
            <div className="flex items-center gap-2">
              <span className="text-xl text-[#D95F7F]">✦</span>
              <span className="font-serif text-2xl font-bold text-white italic">
                Sthree <span className="text-[#D95F7F] not-italic font-normal">Shakthi</span>
              </span>
            </div>

            <p className="text-xs text-[#F8CAD5]/70 leading-relaxed max-w-sm">
              An initiative by <strong>Rotaract District 3220 Cluster 05</strong> empowering women across Sri Lanka through confidence, capability, and digital community publishing.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={onOpenSubmitModal}
                className="px-5 py-2.5 rounded-full bg-[#D95F7F] hover:bg-[#BE4465] text-xs font-bold text-white shadow-md transition-all"
              >
                + Submit Blog / Document
              </button>

              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-white/10 p-1 flex items-center justify-center border border-white/15 backdrop-blur-xs" title="Together Sri Lanka">
                  <img src="/together-sl-logo.png" alt="Together Sri Lanka" className="w-full h-full object-contain" />
                </div>
                <div className="h-8 rounded-2xl bg-white/10 px-3 py-1 flex items-center justify-center border border-white/15 backdrop-blur-xs" title="Rotaract District 3220">
                  <img src="/rotaract-logo.png" alt="Rotaract Logo" className="h-full w-auto object-contain" />
                </div>
              </div>
            </div>
          </div>

          {/* Col 3: Navigation */}
          <div className="space-y-3 text-left">
            <h4 className="font-serif text-sm font-bold uppercase tracking-wider text-[#F8CAD5]">
              Initiative
            </h4>
            <ul className="space-y-2 text-xs text-[#F8CAD5]/70">
              <li>
                <button onClick={() => scrollToSection('hero')} className="hover:text-white transition-colors">
                  Home
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('about')} className="hover:text-white transition-colors">
                  About Sthree Shakthi
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('transformations')} className="hover:text-white transition-colors">
                  Empowerment Pathways
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Publications */}
          <div className="space-y-3 text-left">
            <h4 className="font-serif text-sm font-bold uppercase tracking-wider text-[#F8CAD5]">
              Publications
            </h4>
            <ul className="space-y-2 text-xs text-[#F8CAD5]/70">
              <li>
                <button onClick={() => scrollToSection('publications')} className="hover:text-white transition-colors">
                  All Publications
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('publications')} className="hover:text-white transition-colors">
                  Articles & Stories
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('publications')} className="hover:text-white transition-colors">
                  Documents & Reports
                </button>
              </li>
              <li>
                <button onClick={onOpenSubmitModal} className="hover:text-white transition-colors text-[#F8CAD5] font-bold">
                  Submit Publication &rarr;
                </button>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Credits & Hidden Admin Access */}
        <div className="pt-8 flex flex-col items-center justify-center gap-2 text-center text-xs text-[#F8CAD5]/70">
          <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
            <p>© 2026 Project Sthree Shakthi | Rotaract District 3220 Cluster 05.</p>
            <span className="hidden sm:inline text-[#F8CAD5]/40">•</span>
            <p>
              Developed by <strong className="text-white font-semibold">Transformative Matrix Technologies</strong>
            </p>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] text-[#F8CAD5]/60 pt-1">
            <p>Find your voice; Build your future.</p>
            <span className="hidden sm:inline text-[#F8CAD5]/30">•</span>
            {/* Admin Portal Button */}
            <button
              onClick={onOpenAdminPortal}
              title="Admin Moderation Portal (or press Ctrl+Shift+A)"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-[#F8CAD5] hover:text-white transition-all border border-white/15 text-xs font-semibold shadow-2xs cursor-pointer"
            >
              <Lock className="w-3 h-3 text-[#D95F7F]" />
              <span>Admin Portal</span>
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
};
