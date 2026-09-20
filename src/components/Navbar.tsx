import React, { useState } from 'react';
import { 
  PlusCircle, 
  Menu, 
  X,
  User,
  LayoutDashboard,
  LogIn
} from 'lucide-react';
import { UserAccount } from '../types';

interface NavbarProps {
  onOpenSubmitModal: () => void;
  activeSection: string;
  setActiveSection: (section: string) => void;
  currentUser?: UserAccount | null;
  onOpenAuthModal: () => void;
  onOpenDashboard: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenSubmitModal,
  activeSection,
  setActiveSection,
  currentUser,
  onOpenAuthModal,
  onOpenDashboard,
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

            {/* Partner Logo 1: Together Sri Lanka */}
            <div className="hidden lg:flex items-center h-11 sm:h-12 shrink-0 group-hover:scale-105 transition-transform" title="Together Sri Lanka">
              <img src="/together-sl-logo.png" alt="Together Sri Lanka Logo" className="h-full w-auto object-contain" />
            </div>

            {/* Partner Logo 2: Rotaract */}
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
                  className={`text-sm font-medium transition-colors tracking-wide cursor-pointer ${
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

          {/* Action CTAs: Submit Blog + User Profile / Login */}
          <div className="hidden md:flex items-center gap-3">
            {currentUser ? (
              <button
                type="button"
                onClick={onOpenDashboard}
                className="flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-bold text-[#3E1028] bg-white hover:bg-[#FAF2EB] border border-[#F4E5DA] shadow-2xs hover:scale-102 transition-all cursor-pointer"
                title="Open your contributor dashboard"
              >
                <div className="w-6 h-6 rounded-full bg-[#D95F7F] text-white flex items-center justify-center text-[10px] font-bold uppercase">
                  {currentUser.name.slice(0, 2)}
                </div>
                <span className="max-w-[120px] truncate">{currentUser.name.split(' ')[0]}</span>
                <span className="px-1.5 py-0.5 rounded-full bg-[#D95F7F]/15 text-[#D95F7F] text-[9px] font-extrabold uppercase">
                  Dashboard
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenAuthModal}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-[#5C1D3B] hover:text-[#D95F7F] bg-white hover:bg-[#FAF2EB] border border-[#F4E5DA] shadow-2xs transition-all cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In / Register</span>
              </button>
            )}

            <button
              onClick={onOpenSubmitModal}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold text-white bg-[#D95F7F] hover:bg-[#BE4465] shadow-md shadow-[#D95F7F]/25 hover:scale-102 transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Submit Blog</span>
            </button>
          </div>

          {/* Mobile menu trigger */}
          <div className="flex md:hidden items-center gap-2">
            {currentUser ? (
              <button
                onClick={onOpenDashboard}
                className="w-9 h-9 rounded-full bg-[#D95F7F] text-white flex items-center justify-center text-xs font-bold uppercase shadow-2xs"
                title="My Dashboard"
              >
                {currentUser.name.slice(0, 2)}
              </button>
            ) : (
              <button
                onClick={onOpenAuthModal}
                className="p-2 rounded-full bg-white text-[#5C1D3B] border border-[#F4E5DA]"
                title="Sign In"
              >
                <User className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={onOpenSubmitModal}
              className="p-2 rounded-full bg-[#D95F7F] text-white"
              title="Submit Blog"
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
        <div className="md:hidden border-b border-[#F4E5DA] bg-[#FDF9F6] px-4 pt-2 pb-6 space-y-3 animate-in slide-in-from-top-2 duration-200">
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

          <div className="pt-3 border-t border-[#F4E5DA] flex flex-col gap-2.5">
            {currentUser ? (
              <button
                onClick={() => { setMobileMenuOpen(false); onOpenDashboard(); }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full font-bold text-[#3E1028] bg-white border border-[#F4E5DA] text-xs shadow-2xs"
              >
                <LayoutDashboard className="w-4 h-4 text-[#D95F7F]" />
                <span>My Submissions & Dashboard ({currentUser.name})</span>
              </button>
            ) : (
              <button
                onClick={() => { setMobileMenuOpen(false); onOpenAuthModal(); }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full font-bold text-[#5C1D3B] bg-white border border-[#F4E5DA] text-xs shadow-2xs"
              >
                <LogIn className="w-4 h-4 text-[#D95F7F]" />
                <span>Contributor Sign In / Register</span>
              </button>
            )}

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
