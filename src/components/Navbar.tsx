import React, { useState } from 'react';
import { 
  PlusCircle, 
  Menu, 
  X
} from 'lucide-react';

interface NavbarProps {
  onOpenSubmitModal: () => void;
  activeSection: string;
  setActiveSection: (section: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenSubmitModal,
  activeSection,
  setActiveSection,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { id: 'hero', label: 'Home' },
    { id: 'about', label: 'About Project' },
    { id: 'transformations', label: 'Empowerment' },
    { id: 'publications', label: 'Publications' },
  ];

  const handleNavClick = (id: string) => {
    setActiveSection(id);
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FDF9F6]/95 backdrop-blur-md border-b border-[#F4E5DA]/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo Brand with Authentic Logos */}
          <div 
            onClick={() => handleNavClick('hero')} 
            className="flex items-center gap-3 sm:gap-4 cursor-pointer group"
          >
            {/* Sthree Shakthi Logo */}
            <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl overflow-hidden bg-transparent flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <img src="/logo.png" alt="Sthree Shakthi Logo" className="w-full h-full object-contain" />
            </div>

            {/* Brand Title */}
            <div className="flex flex-col justify-center">
              <span className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-[#3E1028] italic leading-tight">
                Sthree <span className="text-[#D95F7F] not-italic font-normal">Shakthi</span>
              </span>
              <span className="text-[8.5px] sm:text-[10px] uppercase tracking-widest text-[#9E324F] font-bold">
                Cluster 05 • District 3220
              </span>
            </div>

            {/* Clean Divider */}
            <div className="hidden lg:block h-10 w-[1.5px] bg-[#D95F7F]/30 mx-1" />

            {/* Partner Logo 1: Together Sri Lanka (Refined medium size) */}
            <div className="hidden lg:flex items-center h-11 sm:h-12 shrink-0 group-hover:scale-105 transition-transform" title="Together Sri Lanka">
              <img src="/together-sl-logo.png" alt="Together Sri Lanka Logo" className="h-full w-auto object-contain" />
            </div>

            {/* Partner Logo 2: Rotaract (Enlarged size) */}
            <div className="hidden lg:flex items-center h-8 sm:h-9 shrink-0 group-hover:scale-105 transition-transform" title="Rotaract District 3220">
              <img src="/rotaract-logo.png" alt="Rotaract Logo" className="h-full w-auto object-contain" />
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => {
              const isActive = activeSection === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => handleNavClick(link.id)}
                  className={`text-sm font-medium transition-colors tracking-wide ${
                    isActive
                      ? 'text-[#D95F7F] font-bold border-b-2 border-[#D95F7F] pb-0.5'
                      : 'text-[#5C1D3B]/80 hover:text-[#D95F7F]'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>

          {/* Action CTA: Clean Submit Blog Button */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={onOpenSubmitModal}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold text-white bg-[#D95F7F] hover:bg-[#BE4465] shadow-md shadow-[#D95F7F]/25 hover:scale-102 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Submit Blog</span>
            </button>
          </div>

          {/* Mobile menu trigger */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={onOpenSubmitModal}
              className="p-2 rounded-full bg-[#D95F7F] text-white"
            >
              <PlusCircle className="w-4 h-4" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-[#3E1028] hover:bg-rose-50"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-[#F4E5DA] bg-[#FDF9F6] px-4 pt-2 pb-6 space-y-3">
          <div className="flex flex-col gap-2 pt-2">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => handleNavClick(link.id)}
                className="text-left px-3 py-2 text-sm font-semibold text-[#3E1028] hover:text-[#D95F7F] hover:bg-white rounded-xl"
              >
                {link.label}
              </button>
            ))}
          </div>

          <div className="pt-3 border-t border-[#F4E5DA] flex flex-col gap-3">
            <button
              onClick={() => { setMobileMenuOpen(false); onOpenSubmitModal(); }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full font-bold text-white bg-[#D95F7F] text-xs shadow-md"
            >
              <PlusCircle className="w-4 h-4" />
              Submit Blog
            </button>

            {/* Partner Logos in Mobile Drawer */}
            <div className="flex items-center justify-center gap-4 pt-2">
              <div className="flex items-center justify-center p-2 rounded-2xl bg-white border border-[#F4E5DA] shadow-2xs">
                <img src="/together-sl-logo.png" alt="Together Sri Lanka" className="h-9 w-auto object-contain" />
              </div>
              <div className="flex items-center justify-center p-2 rounded-2xl bg-white border border-[#F4E5DA] shadow-2xs">
                <img src="/rotaract-logo.png" alt="Rotaract District 3220" className="h-7 w-auto object-contain" />
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
