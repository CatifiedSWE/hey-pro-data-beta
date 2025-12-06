import * as React from "react";
import Image from "next/image";

// HighlightsText
// - Uses Tailwind breakpoints so mobile/desktop visibility is simpler
// - Applies a proper gradient text using Tailwind + inline WebKit clip fallback
// - Uses lg (>=1024px) to match your original ~1020px breakpoint

export default function HighlightsText({ className = "" }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      {/* Desktop: show vertical image at large sizes */}
      <div className="hidden lg:block">
        <Image
          src="/heylights-vertical.png"
          alt="HEYLIGHTS"
          width={28}
          height={200}
          className=" lg:origin-top-left lg:ml-0"
          style={{ objectFit: "contain" }}
          priority
        />
      </div>

      {/* Mobile: gradient text with line (visible < lg) */}
      <div className="block lg:hidden w-full flex items-center gap-3">
        <div
          className="text-2xl font-bold bg-gradient-to-r from-[#FA6E80] via-[#6A89BE] to-[#31A7AC] text-transparent bg-clip-text"
          style={{ WebkitBackgroundClip: 'text', backgroundClip: 'text' }}
        >
          HEYLIGHTS
        </div>
        <div 
          className="flex-1 h-[3px] rounded-full"
          style={{
            background: 'linear-gradient(90deg, #31A7AC 0%, #85AAB7 30%, #6A89BE 60%, #FA6E80 100%)',
          }}
        />
      </div>

      {/*
        If you still want to use the previous CSS media query rotation instead of Tailwind
        utilities, add a <style jsx>{`...`}</style> block here. Tailwind's rotate classes
        require the utility to be enabled in your Tailwind config (they normally are).
      */}
    </div>
  );
}
