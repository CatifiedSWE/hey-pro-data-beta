'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase/client';

interface GoogleAuthButtonProps {
  disabled?: boolean;
}

export const GoogleAuthButton: React.FC<GoogleAuthButtonProps> = ({ disabled = false }) => {
  const [loading, setLoading] = useState(false);

  const handleGoogleAuth = async () => {
    if (loading || disabled) return;
    
    setLoading(true);
    
    try {
      // Initiate OAuth flow with redirect to profile page
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/callback?next=/profile`
        }
      });

      if (error) {
        console.error('[Google Auth] Error:', error);
        setLoading(false);
        // Show error in UI
        alert('Failed to sign in with Google. Please try again.');
      }
      // OAuth redirects to Google - loading state will persist
    } catch (err) {
      console.error('[Google Auth] Exception:', err);
      setLoading(false);
      alert('Failed to sign in with Google. Please try again.');
    }
  };

  return (
    <button
      type="button"
      onClick={handleGoogleAuth}
      disabled={disabled || loading}
      className={`
        group relative flex items-center justify-center gap-4 p-6 rounded-2xl border-[3px] w-full max-w-3xl mx-auto transition-all duration-150
        ${
          loading || disabled
            ? 'border-slate-200 bg-slate-100 cursor-not-allowed opacity-70'
            : 'border-slate-200 bg-white shadow-[0_5px_0_0_#cbd5e1] hover:bg-slate-50 hover:border-slate-300 hover:-translate-y-[1px] hover:shadow-[0_6px_0_0_#cbd5e1] active:shadow-[0_2px_0_0_#cbd5e1] active:translate-y-[3px] cursor-pointer'
        }
      `}
    >
      {/* Google Icon */}
      <div className={`
        p-3 rounded-xl flex-shrink-0 transition-colors
        ${loading ? 'bg-slate-100' : 'bg-white shadow-sm group-hover:shadow-md'}
      `}>
        <Image
          src="/assets/icons/google.svg"
          alt="Google"
          width={32}
          height={32}
          className="w-8 h-8"
        />
      </div>
      
      {/* Text */}
      <span className="text-2xl md:text-3xl font-bold text-slate-700 group-hover:text-slate-900 transition-colors">
        {loading ? 'Opening Google...' : 'Continue with Google'}
      </span>
      
      {/* Loading spinner */}
      {loading && (
        <div className="absolute right-6">
          <div className="w-6 h-6 border-3 border-slate-300 border-t-[#25c9d0] rounded-full animate-spin"></div>
        </div>
      )}
    </button>
  );
};
