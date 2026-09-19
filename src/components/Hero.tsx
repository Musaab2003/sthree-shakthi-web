import React from 'react';
import { 
  PlusCircle, 
  Play
} from 'lucide-react';

interface HeroProps {
  onOpenSubmitModal: () => void;
  onExplorePublications: () => void;
  onExploreAbout: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  onOpenSubmitModal,
  onExplorePublications,
}) => {
  return (
    <div id="hero" className="relative overflow-hidden pt-8 pb-16 lg:pt-16 lg:pb-24 bg-[#FDF9F6]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Headline & Action Buttons */}
          <div className="lg:col-span-7 space-y-6 text-left">
            
            {/* Sparkle Icon */}
            <div className="inline-flex items-center gap-2">
              <span className="text-2xl text-[#D95F7F] animate-pulse">✦</span>
              <span className="text-xs uppercase tracking-widest text-[#9E324F] font-bold">
                Project Sthree Shakthi • Cluster 05
              </span>
            </div>

            {/* Serif Main Headline */}
            <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-[#3E1028] leading-[1.12]">
              Your Voice is <br />
              <span className="italic font-normal text-[#D95F7F]">What Shapes Your</span> <br />
              Character & Future
            </h1>

            {/* Subtext */}
            <p className="text-base sm:text-lg text-[#5C1D3B]/80 max-w-xl leading-relaxed font-normal">
              A collaborative women's empowerment initiative by 10 Rotaract clubs under Cluster 05. Providing practical skills, leadership pathways, and a digital community platform to publish stories, magazines, and flipbooks.
            </p>

            {/* Action Buttons (Pill + Circular Play Button) */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={onOpenSubmitModal}
                className="px-8 py-3.5 rounded-full text-sm font-bold text-white bg-[#D95F7F] hover:bg-[#BE4465] shadow-lg shadow-[#D95F7F]/30 hover:scale-102 active:scale-98 transition-all"
              >
                Submit Blog
              </button>

              <button
                onClick={onExplorePublications}
                className="group flex items-center gap-3 text-sm font-bold text-[#3E1028] hover:text-[#D95F7F] transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-white border border-[#F4E5DA] shadow-xs group-hover:border-[#D95F7F] group-hover:scale-105 flex items-center justify-center transition-all">
                  <Play className="w-4 h-4 fill-[#D95F7F] text-[#D95F7F] ml-0.5" />
                </div>
                <span>View Blogs</span>
              </button>
            </div>

          </div>

          {/* Right Column: Arched Frame with Exact Official Sthree Shakthi Artwork */}
          <div className="lg:col-span-5 relative flex justify-center lg:justify-end">
            
            {/* Color Swatch Dots on Right Edge */}
            <div className="hidden sm:flex flex-col gap-2.5 absolute -right-6 top-1/2 -translate-y-1/2 z-20">
              <div className="w-5 h-5 rounded-full bg-[#FAF2EB] border border-[#F4E5DA] shadow-2xs" title="Soft Cream" />
              <div className="w-5 h-5 rounded-full bg-[#E8829C] shadow-2xs" title="Blush Rose" />
              <div className="w-5 h-5 rounded-full bg-[#5C1D3B] shadow-2xs" title="Deep Wine" />
            </div>

            {/* Arched Background Frame */}
            <div className="relative w-full max-w-sm sm:max-w-md aspect-[4/5] bg-gradient-to-br from-[#FFF8FA] via-[#FCE7EC] to-[#F8CAD5] rounded-[40px] rounded-tr-[140px] shadow-2xl p-6 sm:p-8 flex flex-col items-center justify-center border-4 border-white overflow-hidden group">
              
              {/* Background ambient light */}
              <div className="absolute w-72 h-72 bg-white/80 rounded-full blur-3xl -z-0 pointer-events-none" />
              
              {/* Exact Clean Artwork from User */}
              <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-2">
                <img
                  src="/logo.png"
                  alt="Sthree Shakthi Official Artwork"
                  className="w-full h-auto max-h-[350px] object-contain block group-hover:scale-105 transition-transform duration-500 ease-out"
                />
              </div>

              {/* Bottom Badge */}
              <div className="relative z-10 w-full mt-2 pt-2 border-t border-[#F8CAD5] flex items-center justify-between text-[11px] text-[#5C1D3B] font-semibold">
                <span>District 3220</span>
                <span className="flex items-center gap-1 text-[#D95F7F]">
                  <span>✦</span> Together Sri Lanka <span>✦</span>
                </span>
                <span>Cluster 05</span>
              </div>
            </div>

            {/* Botanical Leaf Sprig taped with Washi Tape */}
            <div className="absolute -left-6 bottom-10 z-20 pointer-events-none hidden sm:block">
              <div className="relative">
                <div className="w-16 h-5 washi-tape rounded-xs opacity-90 border border-white/40 mb-1" />
                <span className="text-3xl filter drop-shadow-xs">🌿</span>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
