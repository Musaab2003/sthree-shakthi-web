import React, { useState } from 'react';
import { Users, Phone, Mail, MapPin, Search } from 'lucide-react';
import { PARTICIPATING_CLUBS } from '../data/projectData';

export const ClubsDirectory: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredClubs = PARTICIPATING_CLUBS.filter(club => 
    club.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    club.presidentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    club.secretaryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (club.location && club.location.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <section id="clubs" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-12">
          <div className="flex items-center justify-center gap-2">
            <span className="text-[#D95F7F]">✦</span>
            <span className="text-xs uppercase tracking-widest text-[#9E324F] font-bold">
              Rotaract District 3220
            </span>
            <span className="text-[#D95F7F]">✦</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-[#3E1028]">
            10 Participating <span className="text-[#D95F7F] italic font-normal">Clubs</span>
          </h2>
          <p className="text-sm sm:text-base text-[#5C1D3B]/80 leading-relaxed font-normal">
            United across academic institutions and community circles under Cluster 05.
          </p>

          {/* Search Filter */}
          <div className="max-w-md mx-auto relative pt-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-5" />
            <input
              type="text"
              placeholder="Search by club name, president, or city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-full bg-[#FAF2EB]/60 border border-[#F4E5DA] text-xs sm:text-sm text-[#3E1028] focus:outline-none focus:ring-2 focus:ring-[#D95F7F]/30 focus:border-[#D95F7F]"
            />
          </div>
        </div>

        {/* Clubs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClubs.map((club) => (
            <div
              key={club.id}
              className="p-6 rounded-3xl bg-[#FDF9F6] border border-[#F4E5DA] shadow-2xs hover:shadow-lg hover:border-[#D95F7F] transition-all duration-300 flex flex-col justify-between space-y-4 group"
            >
              {/* Header */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="w-10 h-10 rounded-2xl bg-[#FAF2EB] text-[#D95F7F] font-bold text-xs flex items-center justify-center border border-[#F4E5DA]">
                    {club.logoBadge}
                  </span>
                  {club.location && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#9E324F]">
                      <MapPin className="w-3 h-3 text-[#D95F7F]" />
                      {club.location}
                    </span>
                  )}
                </div>

                <h3 className="font-serif text-base font-bold text-[#3E1028] group-hover:text-[#D95F7F] transition-colors">
                  {club.name}
                </h3>
              </div>

              {/* Contacts */}
              <div className="space-y-2.5 pt-3 border-t border-[#F4E5DA] text-xs">
                
                {/* President */}
                <div className="p-3 rounded-2xl bg-white border border-[#F4E5DA] space-y-1">
                  <div className="text-[10px] uppercase font-bold text-[#D95F7F] tracking-wider">
                    Club President
                  </div>
                  <div className="font-bold text-[#3E1028]">{club.presidentName}</div>
                  <div className="flex flex-wrap items-center gap-3 pt-1 text-[#5C1D3B]/80 text-[11px]">
                    <a href={`tel:${club.presidentPhone.replace(/\s+/g, '')}`} className="flex items-center gap-1 hover:text-[#D95F7F]">
                      <Phone className="w-3 h-3 text-[#D95F7F]" />
                      {club.presidentPhone}
                    </a>
                    <a href={`mailto:${club.presidentEmail}`} className="flex items-center gap-1 hover:text-[#D95F7F] truncate max-w-[170px]" title={club.presidentEmail}>
                      <Mail className="w-3 h-3 text-[#D95F7F]" />
                      {club.presidentEmail}
                    </a>
                  </div>
                </div>

                {/* Secretary */}
                <div className="p-3 rounded-2xl bg-[#FAF2EB]/70 border border-[#F4E5DA] space-y-1">
                  <div className="text-[10px] uppercase font-bold text-[#5C1D3B]/70 tracking-wider">
                    {club.secretaryRole || 'Club Secretary'}
                  </div>
                  <div className="font-bold text-[#3E1028]">{club.secretaryName}</div>
                  <div className="flex flex-wrap items-center gap-3 pt-1 text-[#5C1D3B]/80 text-[11px]">
                    <a href={`tel:${club.secretaryPhone.replace(/\s+/g, '')}`} className="flex items-center gap-1 hover:text-[#D95F7F]">
                      <Phone className="w-3 h-3 text-[#D95F7F]" />
                      {club.secretaryPhone}
                    </a>
                    <a href={`mailto:${club.secretaryEmail}`} className="flex items-center gap-1 hover:text-[#D95F7F] truncate max-w-[170px]" title={club.secretaryEmail}>
                      <Mail className="w-3 h-3 text-[#D95F7F]" />
                      {club.secretaryEmail}
                    </a>
                  </div>
                </div>

              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
