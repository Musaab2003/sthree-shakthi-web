import React from 'react';
import { 
  Sparkles, 
  Heart, 
  BookOpen, 
  Lock
} from 'lucide-react';

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
  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="bg-[#3E1028] text-white pt-14 pb-12 border-t border-[#5C1D3B]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

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
          </div>
        </div>

      </div>
    </footer>
  );
};
