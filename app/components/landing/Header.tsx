'use client';

import React from 'react';

const Header: React.FC = () => {
  return (
    <nav className="bg-black py-4 px-6 md:px-12 flex justify-between items-center z-50">
      <div className="flex items-center">
        <span className="text-[#FF7A8B] font-bold text-2xl tracking-tight">Hey</span>
        <span className="text-white font-bold text-2xl tracking-tight">Pro</span>
        <span className="text-[#45B1A8] font-bold text-2xl tracking-tight">Data</span>
      </div>
    </nav>
  );
};

export default Header;