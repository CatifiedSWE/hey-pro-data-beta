import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';
import supabase from '@/lib/supabase/client';

export interface Notification {
  id: string;
  type: string;
  title?: string;
  message: string;
  isRead: boolean;
  metadata: {
    conversation_id?: string;
    message_id?: string;
    sender_id?: string;
    content?: string;
    requires_approval?: boolean;
    [key: string]: any;
  };
  actor?: {
    id: string;
    name: string;
    avatar?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!user) {
      console.log('[useNotifications] No user found, skipping fetch');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('[useNotifications] Fetching notifications for user:', user.id);
      
      // Get auth token from Supabase
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        console.error('[useNotifications] No auth token available');
        throw new Error('No auth token available');
      }

      console.log('[useNotifications] Making API call to /api/notifications');
      const response = await axios.get('/api/notifications', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          limit: 20,
        },
      });

      console.log('[useNotifications] API Response:', {
        success: response.data.success,
        notificationCount: response.data.data?.notifications?.length || 0,
        unreadCount: response.data.data?.unreadCount || 0,
      });

      if (response.data.success) {
        const notifications = response.data.data.notifications || [];
        const unreadCount = response.data.data.unreadCount || 0;
        
        console.log('[useNotifications] Setting notifications:', notifications);
        console.log('[useNotifications] Setting unread count:', unreadCount);
        
        setNotifications(notifications);
        setUnreadCount(unreadCount);
      } else {
        console.error('[useNotifications] API returned success: false');
      }
    } catch (err: any) {
      console.error('[useNotifications] Error fetching notifications:', err);
      console.error('[useNotifications] Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const markAsRead = useCallback(async (notificationId: string) => {
    if (!user) return;

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) return;

      await axios.patch(
        `/api/notifications/${notificationId}/read`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Update local state
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, isRead: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  }, [user]);

  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) return;

      await axios.patch(
        '/api/notifications/mark-all-read',
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Update local state
      setNotifications(prev =>
        prev.map(n => ({ ...n, isRead: true }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  };
}
