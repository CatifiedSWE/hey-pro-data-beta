'use client';

import React from 'react';
import Header from './Header';
import Hero from './Hero';
import GalleryHoverCarousel from './GalleryHoverCarousel';
import TierSections from './TierSections';
import FAQ from './FAQ';
import Footer from './Footer';

export const LandingHero: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <main className="flex-grow">
        <Hero />
        
        {/* Gallery Hover Carousel - Replaced the old auto-ticker */}
        <GalleryHoverCarousel />

        <TierSections />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
};