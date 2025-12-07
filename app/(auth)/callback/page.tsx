'use client';

import { useEffect } from 'react';
import Image from 'next/image';

/**
 * OAuth Callback page - Client-side redirect handler
 * The actual OAuth code exchange is handled server-side at /api/auth/callback
 * This page simply redirects browser to the API route which handles cookies properly
 */
export default function AuthCallback() {
  useEffect(() => {
    // Get the current URL with query parameters (including code)
    const currentUrl = new URL(window.location.href);
    
    // Redirect to server-side API route which will handle OAuth properly
    // This ensures cookies are set server-side for SSR middleware
    const apiCallbackUrl = new URL('/api/auth/callback', window.location.origin);
    
    // Copy all query parameters (code, state, etc.) to API route
    currentUrl.searchParams.forEach((value, key) => {
      apiCallbackUrl.searchParams.set(key, value);
    });

    // Check if there's a stored redirect destination from localStorage
    const storedRedirect = localStorage.getItem('auth_redirect_after_login');
    if (storedRedirect) {
      apiCallbackUrl.searchParams.set('next', storedRedirect);
      // Clean up localStorage
      localStorage.removeItem('auth_redirect_after_login');
    }

    console.log('[Callback Page] Redirecting to server-side handler...');
    window.location.href = apiCallbackUrl.toString();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center space-y-4">
        <Image
          src="https://customer-assets.emergentagent.com/job_2a9bf250-13c7-456d-9a61-1240d767c09d/artifacts/97u04lh8_hpd.png"
          alt="HeyProData"
          width={200}
          height={60}
          className="h-14 w-auto mx-auto"
        />
        <div className="space-y-2">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FA6E80] mx-auto"></div>
          <p className="text-gray-900 text-lg">Completing authentication...</p>
          <p className="text-gray-600 text-sm">Please wait</p>
        </div>
      </div>
    </div>
  );
}
