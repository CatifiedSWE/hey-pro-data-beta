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
 * @returns The access token or null if not authenticated
 */
export const getAccessToken = async (): Promise<string | null> => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
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
