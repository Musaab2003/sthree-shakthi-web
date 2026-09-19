import React from 'react';
import { 
  ShieldCheck, 
  Coins, 
  Briefcase, 
  Palette, 
  ArrowRight
} from 'lucide-react';

export const TransformationsSection: React.FC = () => {
  const transformations = [
    {
      id: 0,
      icon: ShieldCheck,
      title: "Voice & Self-Advocacy",
      desc: "Equipping women with situational awareness, assertive communication, and the confidence to command personal space.",
    },
    {
      id: 1,
      icon: Coins,
      title: "Financial Confidence",
      desc: "Empowering women with household budgeting tools, smart savings habits, and formal banking independence.",
    },
    {
      id: 2,
      icon: Briefcase,
      title: "Career & Leadership",
      desc: "Crafting modern ATS-ready CVs, LinkedIn profile polish, digital portfolios, and interview presentation mastery.",
    },
    {
      id: 3,
      icon: Palette,
      title: "Creative Enterprise",
      desc: "Step-by-step guidance on digital Canva branding, setting up online stores, and monetizing unique artisanal skills.",
    }
  ];

  return (
    <section id="transformations" className="py-20 bg-[#FDF9F6] border-y border-[#F4E5DA]/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-14">
          <div className="flex items-center justify-center gap-2">
            <span className="text-[#D95F7F]">✦</span>
            <span className="text-xs uppercase tracking-widest text-[#9E324F] font-bold">
              Our Core Pathways
            </span>
            <span className="text-[#D95F7F]">✦</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-[#3E1028]">
            We Can Help <span className="text-[#D95F7F] italic font-normal">Transform You</span>
          </h2>
          <p className="text-sm sm:text-base text-[#5C1D3B]/80 leading-relaxed font-normal">
            Four practical pathways designed to turn individual potential into lifelong capability and independence.
          </p>
        </div>

        {/* 4 Cards Grid - All in solid Rosewood Pink with White Text */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {transformations.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className="rounded-3xl p-6 sm:p-8 flex flex-col justify-between space-y-6 bg-[#D95F7F] hover:bg-[#BE4465] text-white shadow-xl shadow-[#D95F7F]/25 hover:shadow-2xl hover:shadow-[#D95F7F]/40 transition-all duration-300 hover:-translate-y-2 group"
              >
                <div className="space-y-4">
                  {/* Translucent Icon Pill */}
                  <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs text-white flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6" />
                  </div>

                  <h3 className="font-serif text-xl font-bold text-white">
                    {item.title}
                  </h3>

                  <p className="text-xs sm:text-sm leading-relaxed text-white/90 font-normal">
                    {item.desc}
                  </p>
                </div>

                <div className="pt-2 flex items-center gap-1.5 text-xs font-bold text-white group-hover:translate-x-1 transition-transform">
                  <span>Explore Pathway</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
