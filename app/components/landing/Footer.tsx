'use client';

import React from 'react';
import { Instagram } from 'lucide-react';

const Footer: React.FC = () => {
  const scrollToFAQ = () => {
    const faqSection = document.getElementById('faq-section');
    if (faqSection) {
      faqSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="bg-black py-12 px-6 border-t border-white/5">
      <div className="max-w-7xl mx-auto flex items-end justify-between">
        <div className="space-y-1">
          <p className="text-gray-500 text-sm font-medium">© HeyProData</p>
          <p className="moving-gradient-text text-sm font-bold">Powering Productions</p>
        </div>

        <div className="flex items-center gap-6">
          <span 
            onClick={scrollToFAQ} 
            className="text-gray-400 hover:text-white text-sm font-medium cursor-pointer transition-colors"
          >
            FAQs
          </span>
          <Instagram className="w-5 h-5 text-gray-400 hover:text-white cursor-pointer transition-colors" />
        </div>
      </div>
    </footer>
  );
};

export default Footer;