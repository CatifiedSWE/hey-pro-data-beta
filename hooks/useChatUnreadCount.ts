/**
 * Hook to track total unread messages across all conversations and groups
 * Used for displaying unread count badge in the navbar
 * 
 * OPTIMIZED VERSION:
 * - Increased polling from 30s to 60s
 * - Added Page Visibility API to pause when tab is inactive
 * - Only polls when user is authenticated
 * - Reduced API calls by 50%
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getConversations, getGroups } from '@/lib/api/chat';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname } from 'next/navigation';

export function useChatUnreadCount() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const isFetchingRef = useRef(false); // Prevent duplicate fetches
  const isInboxRoute = pathname?.startsWith('/inbox');

  const fetchUnreadCount = useCallback(async () => {
    if (!user) {
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    // Prevent duplicate simultaneous fetches
    if (isFetchingRef.current) {
      return;
    }

    isFetchingRef.current = true;

    try {
      // Fetch conversations and groups in parallel
      const [conversations, groups] = await Promise.all([
        getConversations().catch(() => []),
        getGroups().catch(() => []),
      ]);

      // Sum up unread counts from both conversations and groups
      const conversationUnread = conversations.reduce(
        (total, conv) => total + (conv.unreadCount || 0),
        0
      );
      
      const groupUnread = groups.reduce(
        (total, group) => total + (group.unreadCount || 0),
        0
      );

      const totalUnread = conversationUnread + groupUnread;
      setUnreadCount(totalUnread);
    } catch (error) {
      console.error('Error fetching unread count:', error);
      setUnreadCount(0);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [user]);

  // Initial fetch - only when user changes, not when fetchUnreadCount changes
  useEffect(() => {
    if (user) {
      fetchUnreadCount();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]); // Only re-fetch when user changes

  // OPTIMIZED: Poll for updates every 60 seconds (reduced from 30 seconds)
  // Only poll when:
  // 1. User is authenticated
  // 2. Page is visible (tab is active)
  // 3. NOT on inbox route (inbox has its own polling)
  useEffect(() => {
    if (!user || isInboxRoute) return;

    // Check if page is visible
    const isPageVisible = () => !document.hidden;

    const interval = setInterval(() => {
      // Only fetch if page is visible
      if (isPageVisible()) {
        fetchUnreadCount();
      }
    }, 60000); // Changed from 30000 to 60000 (60 seconds)

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, [user, fetchUnreadCount, isInboxRoute]);

  // OPTIMIZED: Refresh when user returns to tab (visibility change)
  useEffect(() => {
    if (!user) return;

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // User returned to tab, refresh unread count
        fetchUnreadCount();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user, fetchUnreadCount]);

  return {
    unreadCount,
    loading,
    refetch: fetchUnreadCount,
  };
}
