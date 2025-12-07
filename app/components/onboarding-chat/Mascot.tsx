import React from 'react';

interface MascotProps {
  emotion?: 'normal' | 'excited' | 'thinking';
}

export const Mascot: React.FC<MascotProps> = ({ emotion = 'normal' }) => (
  <div className={`w-24 h-24 md:w-32 md:h-32 flex-shrink-0 transition-all duration-500 ease-out ${
    emotion === 'excited' ? 'scale-110 rotate-3' : 'scale-100'
  }`}>
    <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-lg filter">
      {/* Antenna */}
      <line x1="100" y1="50" x2="100" y2="20" stroke="#1e293b" strokeWidth="8" strokeLinecap="round" />
      <circle cx="100" cy="20" r="10" fill="#ff5168" className={emotion === 'thinking' ? 'animate-pulse' : ''} />
      
      {/* Head Container */}
      <rect x="30" y="50" width="140" height="110" rx="30" fill="#ffffff" stroke="#1e293b" strokeWidth="8" />
      
      {/* Face Screen */}
      <rect x="50" y="75" width="100" height="60" rx="18" fill="#1e293b" />
      
      {/* Eyes */}
      {emotion === 'excited' ? (
        <>
          <path d="M 70 105 L 80 95 L 90 105" stroke="#25c9d0" strokeWidth="8" strokeLinecap="round" fill="none" />
          <path d="M 110 105 L 120 95 L 130 105" stroke="#25c9d0" strokeWidth="8" strokeLinecap="round" fill="none" />
        </>
      ) : emotion === 'thinking' ? (
        <>
          <circle cx="80" cy="105" r="10" fill="#25c9d0" />
          <line x1="110" y1="105" x2="130" y2="105" stroke="#25c9d0" strokeWidth="8" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="80" cy="105" r="12" fill="#25c9d0" />
          <circle cx="120" cy="105" r="12" fill="#25c9d0" />
        </>
      )}

      {/* Headphones/Ears */}
      <path d="M 25 90 L 30 90 L 30 125 L 25 125 Q 15 125 15 107 Q 15 90 25 90" fill="#ff5168" stroke="#1e293b" strokeWidth="6"/>
      <path d="M 175 90 L 170 90 L 170 125 L 175 125 Q 185 125 185 107 Q 185 90 175 90" fill="#ff5168" stroke="#1e293b" strokeWidth="6"/>
    </svg>
  </div>
);