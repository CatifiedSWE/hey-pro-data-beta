import { createBrowserClient } from '@supabase/ssr';
import { User } from '@supabase/supabase-js';

// Use fallback values if environment variables are not set
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder_anon_key';

// Storage key for persistence preference
const STORAGE_PREFERENCE_KEY = 'supabase-storage-preference';

/**
 * Create Supabase browser client for use in Client Components
 * Uses @supabase/ssr for proper SSR cookie integration
 * Note: OAuth callbacks are handled server-side via /api/auth/callback
 */
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

/**
 * Ensure session is initialized and valid
 * This is useful to call before making authenticated API requests
 * @returns Promise that resolves to true if session is valid
 */
export const ensureSession = (): Promise<boolean> => {
  return supabase.auth.getSession().then(({ data: { session }, error }) => {
    if (error) {
      console.error('[ensureSession] Error:', error.message);
      return false;
    }
    
    if (!session) {
      console.warn('[ensureSession] No active session');
      return false;
    }
    
    // Check if token is expired
    const expiresAt = session.expires_at;
    if (expiresAt) {
      const now = Math.floor(Date.now() / 1000);
      if (now >= expiresAt) {
        console.warn('[ensureSession] Session expired, refreshing...');
        // Refresh the session
        return supabase.auth.refreshSession().then(({ data, error: refreshError }) => {
          if (refreshError || !data.session) {
            console.error('[ensureSession] Refresh failed:', refreshError?.message);
            return false;
          }
          console.log('[ensureSession] Session refreshed successfully');
          return true;
        });
      }
    }
    
    console.log('[ensureSession] Session valid');
    return true;
  }).catch((error) => {
    console.error('[ensureSession] Unexpected error:', error);
    return false;
  });
};

/**
 * Set storage preference for "Keep me logged in" functionality
 * @param keepLoggedIn - true for localStorage (persistent), false for sessionStorage
 */
export const setStoragePreference = (keepLoggedIn: boolean): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_PREFERENCE_KEY, keepLoggedIn ? 'true' : 'false');
};

/**
 * Get storage preference
 */
export const getStoragePreference = (): boolean => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(STORAGE_PREFERENCE_KEY) === 'true';
};

/**
 * Get the current access token from the session
 * Uses promise-based approach as recommended by Next.js
 * @returns Promise that resolves to the access token or null if not authenticated
 */
export const getAccessToken = (): Promise<string | null> => {
  return supabase.auth.getSession().then(({ data: { session }, error }) => {
    if (error) {
      console.error('[getAccessToken] Error retrieving session:', error.message);
      return null;
    }
    
    if (!session) {
      console.warn('[getAccessToken] No active session found');
      return null;
    }
    
    if (!session.access_token) {
      console.warn('[getAccessToken] Session exists but no access token');
      return null;
    }
    
    // Check if token is expired
    const expiresAt = session.expires_at;
    if (expiresAt) {
      const now = Math.floor(Date.now() / 1000);
      if (now >= expiresAt) {
        console.warn('[getAccessToken] Token expired, refreshing session');
        // Token expired, refresh it
        return supabase.auth.refreshSession().then(({ data, error: refreshError }) => {
          if (refreshError || !data.session) {
            console.error('[getAccessToken] Failed to refresh session:', refreshError?.message);
            return null;
          }
          console.log('[getAccessToken] Session refreshed successfully');
          return data.session.access_token || null;
        });
      }
    }
    
    console.log('[getAccessToken] Valid token retrieved');
    return session.access_token;
  }).catch((error) => {
    console.error('[getAccessToken] Unexpected error:', error);
    return null;
  });
};

/**
 * Get the current authenticated user
 * @returns The user object or null if not authenticated
 */
export const getCurrentUser = async (): Promise<User | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

/**
 * Check if user is currently authenticated
 * @returns true if user has an active session
 */
export const isAuthenticated = async (): Promise<boolean> => {
  const { data: { session } } = await supabase.auth.getSession();
  return !!session;
};

/**
 * Sign out the current user and clear all auth data
 */
export const signOut = async (): Promise<void> => {
  await supabase.auth.signOut();
  // Clear storage preference on logout
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_PREFERENCE_KEY);
  }
};

export default supabase;
