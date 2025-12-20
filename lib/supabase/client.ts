import { createBrowserClient } from '@supabase/ssr';
import { User } from '@supabase/supabase-js';

// Use fallback values if environment variables are not set
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder_anon_key';

// Storage key for persistence preference
const STORAGE_PREFERENCE_KEY = 'supabase-storage-preference';

// OPTIMIZATION: Session cache to reduce excessive getSession() calls
// Cache session for 5 minutes to prevent repeated auth requests
interface SessionCache {
  session: any;
  expiresAt: number;
}

let sessionCache: SessionCache | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

/**
 * Get cached session or fetch new one
 * This reduces auth requests by caching the session for 5 minutes
 */
const getCachedSession = async () => {
  const now = Date.now();
  
  // Return cached session if still valid
  if (sessionCache && now < sessionCache.expiresAt) {
    console.log('[getCachedSession] Using cached session');
    return sessionCache.session;
  }
  
  // Fetch new session
  console.log('[getCachedSession] Fetching new session');
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (!error && session) {
    // Cache the session
    sessionCache = {
      session,
      expiresAt: now + CACHE_DURATION
    };
  }
  
  return error ? null : session;
};

/**
 * Clear the session cache
 * Call this when user logs out or when you need to force a fresh session fetch
 */
export const clearSessionCache = () => {
  sessionCache = null;
};

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
 * OPTIMIZED: Uses cached session to reduce auth requests
 * @returns Promise that resolves to the access token or null if not authenticated
 */
export const getAccessToken = async (): Promise<string | null> => {
  try {
    // Use cached session instead of always fetching
    const session = await getCachedSession();
    
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
        // Clear cache and refresh
        clearSessionCache();
        const { data, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError || !data.session) {
          console.error('[getAccessToken] Failed to refresh session:', refreshError?.message);
          return null;
        }
        
        // Update cache with new session
        sessionCache = {
          session: data.session,
          expiresAt: Date.now() + CACHE_DURATION
        };
        
        console.log('[getAccessToken] Session refreshed successfully');
        return data.session.access_token || null;
      }
    }
    
    console.log('[getAccessToken] Valid token retrieved');
    return session.access_token;
  } catch (error) {
    console.error('[getAccessToken] Unexpected error:', error);
    return null;
  }
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
 * OPTIMIZED: Also clears session cache
 */
export const signOut = async (): Promise<void> => {
  await supabase.auth.signOut();
  // Clear session cache on logout
  clearSessionCache();
  // Clear storage preference on logout
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_PREFERENCE_KEY);
  }
};

export default supabase;
