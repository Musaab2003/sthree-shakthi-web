import React from 'react';
import { Sparkles, HeartHandshake, Award, Users, BookOpen } from 'lucide-react';
import { PROJECT_INFO } from '../data/projectData';

export const AboutSection: React.FC = () => {
  return (
    <section id="about" className="py-20 bg-white relative">
      
      {/* Top Wave Curve Divider */}
      <div className="absolute top-0 left-0 right-0 overflow-hidden leading-none z-10 -translate-y-[99%]">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-12 text-white fill-current">
          <path d="M0,0 C300,90 900,90 1200,0 L1200,120 L0,120 Z"></path>
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Column: Asymmetric Arched Frame with Full Official Poster (2nd Picture) */}
          <div className="lg:col-span-5 relative flex justify-center lg:justify-start order-2 lg:order-1">
            
            {/* Swatch dots on Left Edge */}
            <div className="hidden sm:flex flex-col gap-2.5 absolute -left-6 top-1/2 -translate-y-1/2 z-20">
              <div className="w-5 h-5 rounded-full bg-[#FAF2EB] border border-[#F4E5DA] shadow-2xs" />
              <div className="w-5 h-5 rounded-full bg-[#E8829C] shadow-2xs" />
              <div className="w-5 h-5 rounded-full bg-[#5C1D3B] shadow-2xs" />
            </div>

            {/* Arched Poster Card Frame */}
            <div className="relative w-full max-w-[340px] sm:max-w-[390px] rounded-[36px] rounded-tl-[120px] shadow-2xl overflow-hidden border-4 border-white bg-white group">
              <img
                src="/campaign-poster.jpg"
                alt="Sthree Shakthi Official Poster - Find Your Voice, Build Your Future"
                className="w-full h-auto object-contain block group-hover:scale-[1.02] transition-transform duration-500"
              />
            </div>

            {/* Botanical Accent with Washi Tape on Right */}
            <div className="absolute -right-6 bottom-12 z-20 pointer-events-none hidden sm:block">
              <div className="relative">
                <div className="w-16 h-5 washi-tape rounded-xs opacity-90 border border-white/40 mb-1" />
                <span className="text-3xl filter drop-shadow-xs">🌾</span>
              </div>
            </div>

          </div>

          {/* Right Column: Text & 3 Stat Cards (Matches Reference Image) */}
          <div className="lg:col-span-7 space-y-8 order-1 lg:order-2">
            
            <div className="space-y-4">
              <span className="text-sm font-bold uppercase tracking-widest text-[#D95F7F]">
                Our Story & Purpose
              </span>
              <h2 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-[#3E1028] leading-tight">
                Welcome To <span className="text-[#D95F7F] italic font-normal">Sthree Shakthi</span>
              </h2>
              <p className="text-base text-[#5C1D3B]/80 leading-relaxed font-normal">
                Project Sthree Shakthi was born from a clear vision: to bridge the gap between high educational attainment and active leadership among women in Sri Lanka. By bringing together 10 Rotaract clubs under Cluster 05, we provide women with real-world skills, personal confidence, and an open digital platform to share their voices.
              </p>
            </div>

            {/* 3 Stat Cards (Exact match to reference design) */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4 pt-2">
              
              {/* Card 1: Active Rose Card */}
              <div className="p-4 sm:p-6 rounded-2xl bg-[#D95F7F] text-white shadow-lg shadow-[#D95F7F]/20 text-center space-y-1">
                <div className="font-serif text-2xl sm:text-4xl font-bold">10</div>
                <div className="text-[11px] sm:text-xs uppercase tracking-wider font-semibold opacity-90">
                  Clubs United
                </div>
              </div>

              {/* Card 2: Soft Cream Card */}
              <div className="p-4 sm:p-6 rounded-2xl bg-[#FAF2EB] border border-[#F4E5DA] text-[#3E1028] shadow-xs text-center space-y-1">
                <div className="font-serif text-2xl sm:text-4xl font-bold text-[#D95F7F]">100%</div>
                <div className="text-[11px] sm:text-xs uppercase tracking-wider font-semibold text-[#5C1D3B]/80">
                  Free Platform
                </div>
              </div>

              {/* Card 3: Soft Blush Card */}
              <div className="p-4 sm:p-6 rounded-2xl bg-[#FDF4F6] border border-[#F8CAD5] text-[#3E1028] shadow-xs text-center space-y-1">
                <div className="font-serif text-2xl sm:text-4xl font-bold text-[#3E1028]">04</div>
                <div className="text-[11px] sm:text-xs uppercase tracking-wider font-semibold text-[#5C1D3B]/80">
                  Core Values
                </div>
              </div>

            </div>

            {/* Core Mission & Vision Quotes */}
            <div className="p-5 rounded-2xl bg-[#FAF2EB]/60 border-l-4 border-[#D95F7F] space-y-2">
              <div className="font-serif font-bold text-sm text-[#3E1028]">Our Guiding Vision</div>
              <p className="text-xs sm:text-sm text-[#5C1D3B]/80 italic">
                "{PROJECT_INFO.vision}"
              </p>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
};
