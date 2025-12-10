/**
 * Hook to track total unread messages across all conversations and groups
 * Used for displaying unread count badge in the navbar
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getConversations, getGroups } from '@/lib/api/chat';
import { useAuth } from '@/contexts/AuthContext';

export function useChatUnreadCount() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const isFetchingRef = useRef(false); // Prevent duplicate fetches

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

  // Poll for updates every 30 seconds (reduced from 5 seconds)
  // This significantly reduces API calls while still keeping data reasonably fresh
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000); // Changed from 5000 to 30000 (30 seconds)

    return () => clearInterval(interval);
  }, [user, fetchUnreadCount]);

  return {
    unreadCount,
    loading,
    refetch: fetchUnreadCount,
  };
}
