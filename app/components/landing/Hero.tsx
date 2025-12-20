'use client';

import React, { useState, useEffect } from 'react';
import SphereImageGrid, { ImageData } from './SphereImageGrid';

// Generate a larger set of unique images using different seeds to prevent side-by-side repetition
const IMAGES: ImageData[] = Array.from({ length: 45 }).map((_, i) => {
  // Changed offset from 10 to 60 to generate a fresh set of faces and remove the previous set (including the cucumber lady)
  let src = `https://i.pravatar.cc/300?u=${i + 60}`;
  
  // Replace specific images with user provided URLs
  // Placing them at distributed indices for better visibility on the sphere
  if (i === 12) {
    src = "https://optimizpro.com/wp-content/uploads/2025/12/ACg8ocKSjKZ6taK4GGvpnI9xeDEAsXqN4rsTj8X5Lsa0992ak2TdVios96-c-1.png";
  } else if (i === 25) {
    src = "https://optimizpro.com/wp-content/uploads/2025/12/WhatsApp-Image-2025-12-08-at-20.23.37.jpeg";
  } else if (i === 19) {
    // New profile added
    src = "https://optimizpro.com/wp-content/uploads/2025/12/premium_photo-1689568126014-06fea9d5d341.jpg";
  } else if (i === 17) {
    // Replaced cucumber lady profile
    src = "https://optimizpro.com/wp-content/uploads/2025/12/eugene-chystiakov-YUvt38btMHw-unsplash-scaled.jpg";
  }

  return {
    id: `hero-img-${i}`,
    src,
    alt: `Industry Professional ${i}`,
    title: `Professional ${i}`,
    description: "MENA Region Production Specialist"
  };
});

const SPHERE_CONFIG = {
  containerSize: 640, 
  sphereRadius: 260,  
  dragSensitivity: 0.8,
  momentumDecay: 0.96,
  maxRotationSpeed: 5,
  baseImageScale: 0.16, 
  hoverScale: 1.2,
  perspective: 1200,
  autoRotate: true,
  autoRotateSpeed: 0.1
};

const Hero: React.FC = () => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const duration = 2000;
    const target = 100;
    const loopInterval = 10000;

    const runAnimation = () => {
      let startTime: number | null = null;
      
      const animate = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const progress = timestamp - startTime;
        const percentage = Math.min(progress / duration, 1);
        const easeOutQuart = 1 - Math.pow(1 - percentage, 4);
        setCount(Math.floor(easeOutQuart * target));
        if (percentage < 1) requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
    };

    // Initial run
    runAnimation();

    // Loop every 10 seconds
    const intervalId = setInterval(runAnimation, loopInterval);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <section className="bg-black text-white min-h-[calc(100vh-80px)] px-6 lg:px-12 py-8 lg:py-0 flex items-center justify-center relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[1400px] h-[800px] bg-gradient-to-r from-[#FF7A8B]/10 to-[#45B1A8]/10 blur-[200px] rounded-full pointer-events-none"></div>
      
      <div className="max-w-[1600px] w-full flex flex-col lg:grid lg:grid-cols-2 gap-8 lg:gap-12 items-center z-10">
        
        {/* Sphere Container: Top on Mobile, Left on PC */}
        {/* Added fixed height for mobile/tablet to eliminate the large gap caused by scaling a 640px container */}
        <div className="w-full h-[280px] xs:h-[340px] sm:h-[450px] lg:h-auto flex justify-center lg:justify-start items-center order-1 lg:order-1 animate-in fade-in zoom-in duration-1000 overflow-visible">
          <div className="relative transform scale-[0.45] xs:scale-[0.55] sm:scale-[0.75] lg:scale-[0.85] xl:scale-100 origin-center lg:origin-left pointer-events-auto">
            <SphereImageGrid
              images={IMAGES}
              {...SPHERE_CONFIG}
            />
          </div>
        </div>

        {/* Text Content: Bottom on Mobile, Right on PC */}
        <div className="w-full flex flex-col items-center lg:items-start text-center lg:text-left order-2 lg:order-2 animate-in fade-in slide-in-from-bottom-12 lg:slide-in-from-right-12 duration-1000">
          <div className="w-full">
            <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-6xl xl:text-7xl 2xl:text-8xl font-black tracking-tighter mb-4 lg:mb-6 uppercase leading-[0.9] moving-gradient-text drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)] break-words">
              Powering <br className="hidden lg:block" /> Productions
            </h1>
            <p className="text-lg sm:text-2xl md:text-3xl text-white max-w-2xl font-bold leading-tight mb-8 lg:mb-10">
              For <span className="text-[#FF7A8B]">people</span> who <span className="text-[#FF7A8B]">make things happen</span> in film, media and events.
            </p>
          </div>
          
          <div className="space-y-4 lg:space-y-8 pt-6 lg:pt-12 border-t border-white/10 w-full max-w-2xl">
            <span className="block text-gray-500 font-bold uppercase tracking-[0.3em] text-sm sm:text-base">
              <span className="tabular-nums inline-block min-w-[2ch]">{count}</span>+ profiles already inside
            </span>
            <div className="space-y-2 lg:space-y-4">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">MENA's crew infrastructure</h2>
              <p className="text-gray-400 text-base sm:text-lg md:text-xl font-medium max-w-lg mx-auto lg:mx-0">
                Showing who's here, what they do and how to connect.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;