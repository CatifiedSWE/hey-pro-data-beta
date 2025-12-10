/**
 * Hook to track total unread messages across all conversations and groups
 * Used for displaying unread count badge in the navbar
 */

import { useState, useEffect, useCallback } from 'react';
import { getConversations, getGroups } from '@/lib/api/chat';
import { useAuth } from '@/contexts/AuthContext';

export function useChatUnreadCount() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchUnreadCount = useCallback(async () => {
    if (!user) {
      setUnreadCount(0);
      setLoading(false);
      return;
    }

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
    }
  }, [user]);

  // Initial fetch
  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  // Poll for updates every 5 seconds
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 5000);

    return () => clearInterval(interval);
  }, [user, fetchUnreadCount]);

  return {
    unreadCount,
    loading,
    refetch: fetchUnreadCount,
  };
}
