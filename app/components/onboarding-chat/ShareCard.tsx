'use client';

import React, { useState } from 'react';
import { SocialIcons } from './SocialIcons';

export const ShareCard: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const link = "https://heyprodata.com";

  const handleCopy = () => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = (platform: string) => {
    const text = encodeURIComponent("Check out HeyProData. For people who make things happen in film, media and events.");
    const url = encodeURIComponent(link);
    let shareUrl = "";

    switch (platform) {
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${text}%20${url}`;
        break;
      case 'x':
        shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
        break;
      // case 'instagram':
      //   // Instagram web share is not directly supported via URL parameters
      //   shareUrl = "https://instagram.com";
      //   break;
    }
    if (shareUrl) window.open(shareUrl, '_blank');
  };

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center gap-6 md:gap-8 animate-fade-in delay-75">
      <div className="relative w-full flex items-center">
        <input 
          readOnly
          value={link}
          className="w-full p-4 md:p-5 pr-32 text-lg md:text-xl font-medium text-slate-700 bg-white border-2 border-slate-200 rounded-xl outline-none"
        />
        <button 
          onClick={handleCopy}
          className={`
            absolute right-2 top-2 bottom-2 px-4 md:px-6 rounded-lg font-bold text-sm md:text-base uppercase tracking-wider transition-all
            ${copied ? 'bg-green-500 text-white' : 'bg-[#25c9d0] text-white hover:bg-[#1da8ae]'}
          `}
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      <div className="flex items-center gap-6 md:gap-8">
        <button onClick={() => handleShare('whatsapp')} className="p-3 bg-white rounded-full shadow-sm border border-slate-100 hover:scale-110 transition-transform duration-200">
          <SocialIcons.WhatsApp />
        </button>
        {/* Instagram button hidden as requested/broken destination
        <button onClick={() => handleShare('instagram')} className="p-3 bg-white rounded-full shadow-sm border border-slate-100 hover:scale-110 transition-transform duration-200">
          <SocialIcons.Instagram />
        </button>
        */}
        <button onClick={() => handleShare('x')} className="p-3 bg-white rounded-full shadow-sm border border-slate-100 hover:scale-110 transition-transform duration-200">
          <SocialIcons.X />
        </button>
      </div>
    </div>
  );
};
