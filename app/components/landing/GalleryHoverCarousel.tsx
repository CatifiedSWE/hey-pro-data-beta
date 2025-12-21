'use client';

import React from 'react';

interface GalleryHoverCarouselItem {
  id: string;
  title: string;
  summary: string;
  image: string;
}

interface GalleryHoverCarouselProps {
  heading?: string;
  subHeading?: string;
  items?: GalleryHoverCarouselItem[];
}

export default function GalleryHoverCarousel({
  heading = "FEATURES OF HEYPRODATA",
  subHeading = "Discover the powerful tools built specifically for the film, media, and event infrastructure in the MENA region.",
  items = [
    {
      id: "feature-profile",
      title: "Profiles That Speak Before You Do",
      summary: "Let your work, work for you and introduce you to decision makers and collaborators who matter.",
      image: "https://optimizpro.com/wp-content/uploads/2025/12/1.png",
    },
    {
      id: "feature-chat",
      title: "Where Conversations Turn Into Content",
      summary: "From first message to final wrap - connect, chat and collaborate seamlessly with your crew.",
      image: "/Messages.png",
    },
    {
      id: "feature-directory",
      title: "The Backbone of Every Production",
      summary: "Access a powerful network of professionals to help your productions move faster, smarter and stronger.",
      image: "/profile-group.png",
    }
  ],
}: GalleryHoverCarouselProps) {
  const displayItems = [...items, ...items, ...items, ...items, ...items, ...items];

  return (
    <section className="py-16 lg:py-32 bg-white overflow-hidden">
      <div className="relative w-full overflow-hidden">
        <div 
          className="animate-ticker flex gap-4 sm:gap-8 px-4 sm:px-6 py-10 lg:py-16 hover:[animation-play-state:paused]"
          style={{ animationDuration: '40s' }}
        >
          {displayItems.map((item, idx) => (
            <div key={`${item.id}-${idx}`} className="flex-shrink-0 w-[280px] sm:w-[380px] lg:w-[480px] group">
              <div className="block relative h-[420px] sm:h-[560px] w-full rounded-[2rem] sm:rounded-[3rem] bg-white border border-gray-100 shadow-[0_15px_35px_rgba(0,0,0,0.06)] hover:shadow-[0_40px_100px_rgba(0,0,0,0.12)] transition-all duration-700 transform hover:-translate-y-4 overflow-hidden">
                <div className="relative h-[60%] lg:h-[65%] w-full transition-all duration-700 group-hover:h-1/2">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="h-full w-full object-cover object-top scale-100 group-hover:scale-110 transition-transform duration-1000"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-100 group-hover:opacity-0 transition-opacity duration-700" />
                </div>

                <div className="absolute bottom-0 left-0 w-full h-[40%] lg:h-[35%] group-hover:h-1/2 flex flex-col justify-start p-8 sm:p-12 bg-white transition-all duration-700">
                  <h4 className="text-xl sm:text-2xl lg:text-3xl font-black text-gray-900 uppercase tracking-tight mb-2 sm:mb-4 leading-none">
                    {item.title}
                  </h4>
                  <p className="text-gray-500 text-sm sm:text-lg leading-relaxed line-clamp-3 lg:line-clamp-4 font-medium">
                    {item.summary}
                  </p>
                  
                  <div className="mt-auto opacity-0 group-hover:opacity-100 transition-opacity duration-700 delay-300">
                    <div className="h-1 w-12 bg-gradient-to-r from-[#FF7A8B] to-[#45B1A8] rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}