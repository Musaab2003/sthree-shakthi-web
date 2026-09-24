import React, { useState } from 'react';
import { 
  PlusCircle, 
  Menu, 
  X, 
  User, 
  LayoutDashboard, 
  LogIn,
  Bell
} from 'lucide-react';
import { UserAccount } from '../types';

interface NavbarProps {
  onOpenSubmitModal: () => void;
  activeSection: string;
  setActiveSection: (section: string) => void;
  currentUser?: UserAccount | null;
  onOpenAuthModal: () => void;
  onOpenDashboard: () => void;
  unreadNotificationsCount?: number;
  onOpenNotifications?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenSubmitModal,
  activeSection,
  setActiveSection,
  currentUser,
  onOpenAuthModal,
  onOpenDashboard,
  unreadNotificationsCount = 0,
  onOpenNotifications,
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
        <div className="flex items-center justify-between h-20 gap-4">
          
          {/* Logo Brand with Balanced Authentic Logos */}
          <div 
            onClick={() => handleNavClick('hero')} 
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group select-none shrink-0"
          >
            {/* Sthree Shakthi Logo */}
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden bg-transparent flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <img src="/logo.png" alt="Sthree Shakthi Logo" className="w-full h-full object-contain" />
            </div>

            {/* Brand Title */}
            <div className="flex flex-col justify-center">
              <span className="font-serif text-lg sm:text-xl font-bold tracking-tight text-[#3E1028] italic leading-none">
                Sthree <span className="text-[#D95F7F] not-italic font-normal">Shakthi</span>
              </span>
              <span className="text-[8px] sm:text-[9px] uppercase tracking-widest text-[#9E324F] font-bold mt-1 leading-none">
                Cluster 05 • District 3220
              </span>
            </div>

            {/* Clean Subtle Divider */}
            <div className="hidden lg:block h-6 w-[1.5px] bg-[#D95F7F]/20 mx-1.5" />

            {/* Partner Logo 1: Together Sri Lanka */}
            <div className="hidden lg:flex items-center h-8 sm:h-9 shrink-0 group-hover:scale-105 transition-transform" title="Together Sri Lanka">
              <img src="/together-sl-logo.png" alt="Together Sri Lanka Logo" className="h-full w-auto object-contain max-h-8 sm:max-h-9" />
            </div>

            {/* Partner Logo 2: Rotaract */}
            <div className="hidden lg:flex items-center h-6 sm:h-7 shrink-0 group-hover:scale-105 transition-transform" title="Rotaract District 3220">
              <img src="/rotaract-logo.png" alt="Rotaract Logo" className="h-full w-auto object-contain max-h-6 sm:max-h-7" />
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8">
            {navLinks.map((link) => {
              const isActive = activeSection === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => handleNavClick(link.id)}
                  className={`text-sm tracking-wide cursor-pointer transition-all ${
                    isActive
                      ? 'text-[#D95F7F] font-bold border-b-2 border-[#D95F7F] pb-0.5'
                      : 'text-[#5C1D3B]/80 font-medium hover:text-[#D95F7F]'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>

          {/* Action CTAs: Submit Blog + User Profile / Login + Notifications */}
          <div className="hidden md:flex items-center gap-2.5">
            {currentUser && onOpenNotifications && (
              <button
                type="button"
                onClick={onOpenNotifications}
                className="relative h-10 w-10 flex items-center justify-center rounded-full bg-white hover:bg-[#FAF2EB] border border-[#F4E5DA] shadow-2xs transition-all text-[#5C1D3B] hover:text-[#D95F7F] cursor-pointer"
                title="View Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center shadow-xs animate-pulse">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>
            )}

            {currentUser ? (
              <button
                type="button"
                onClick={onOpenDashboard}
                className="h-10 flex items-center gap-2 px-4 rounded-full text-xs font-bold text-[#3E1028] bg-white hover:bg-[#FAF2EB] border border-[#F4E5DA] shadow-2xs hover:scale-102 transition-all cursor-pointer"
                title="Open your contributor dashboard"
              >
                <div className="w-6 h-6 rounded-full bg-[#D95F7F] text-white flex items-center justify-center text-[10px] font-bold uppercase">
                  {currentUser.name.slice(0, 2)}
                </div>
                <span className="max-w-[120px] truncate">{currentUser.name.split(' ')[0]}</span>
                <span className="px-2 py-0.5 rounded-full bg-[#D95F7F]/15 text-[#D95F7F] text-[9px] font-extrabold uppercase tracking-wide">
                  Dashboard
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenAuthModal}
                className="h-10 flex items-center gap-2 px-4 rounded-full text-xs font-bold text-[#5C1D3B] hover:text-[#D95F7F] bg-white hover:bg-[#FAF2EB] border border-[#F4E5DA] shadow-2xs transition-all cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In / Register</span>
              </button>
            )}

            <button
              onClick={onOpenSubmitModal}
              className="h-10 flex items-center gap-2 px-5 rounded-full text-xs font-bold text-white bg-[#D95F7F] hover:bg-[#BE4465] shadow-md shadow-[#D95F7F]/20 hover:scale-102 transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Submit Blog</span>
            </button>
          </div>

          {/* Mobile menu trigger */}
          <div className="flex md:hidden items-center gap-2">
            {currentUser && onOpenNotifications && (
              <button
                onClick={onOpenNotifications}
                className="relative w-9 h-9 flex items-center justify-center rounded-full bg-white text-[#5C1D3B] border border-[#F4E5DA] shadow-2xs cursor-pointer"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-rose-500 text-white text-[8px] font-black flex items-center justify-center">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>
            )}

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
                className="w-9 h-9 flex items-center justify-center rounded-full bg-white text-[#5C1D3B] border border-[#F4E5DA] shadow-2xs"
                title="Sign In"
              >
                <User className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={onOpenSubmitModal}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-[#D95F7F] text-white shadow-2xs"
              title="Submit Blog"
            >
              <PlusCircle className="w-4 h-4" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="w-9 h-9 flex items-center justify-center rounded-xl text-[#3E1028] hover:bg-rose-50"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
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
              <>
                {onOpenNotifications && (
                  <button
                    onClick={() => { setMobileMenuOpen(false); onOpenNotifications(); }}
                    className="w-full flex items-center justify-between px-4 py-2.5 rounded-full font-bold text-[#3E1028] bg-white border border-[#F4E5DA] text-xs shadow-2xs"
                  >
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-[#D95F7F]" />
                      <span>Notifications & Feedback</span>
                    </div>
                    {unreadNotificationsCount > 0 ? (
                      <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black">
                        {unreadNotificationsCount} new
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-semibold">0 unread</span>
                    )}
                  </button>
                )}
                <button
                  onClick={() => { setMobileMenuOpen(false); onOpenDashboard(); }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full font-bold text-[#3E1028] bg-white border border-[#F4E5DA] text-xs shadow-2xs"
                >
                  <LayoutDashboard className="w-4 h-4 text-[#D95F7F]" />
                  <span>My Submissions & Dashboard ({currentUser.name})</span>
                </button>
              </>
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
            <div className="flex items-center justify-center gap-4 pt-3">
              <div className="flex items-center justify-center p-2 rounded-2xl bg-white border border-[#F4E5DA] shadow-2xs">
                <img src="/together-sl-logo.png" alt="Together Sri Lanka" className="h-8 w-auto object-contain" />
              </div>
              <div className="flex items-center justify-center p-2 rounded-2xl bg-white border border-[#F4E5DA] shadow-2xs">
                <img src="/rotaract-logo.png" alt="Rotaract District 3220" className="h-6.5 w-auto object-contain" />
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
