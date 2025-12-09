/**
 * Chat API Helper Functions
 * Handles all chat-related API calls with authentication
 */

import axios from '@/lib/axios';

// ==================== TYPES ====================

export interface User {
  id: string;
  name: string;
  avatar: string | null;
}

export interface Message {
  id: string;
  conversation_id?: string;
  group_id?: string;
  sender_id: string;
  content: string;
  attachment_url?: string | null;
  attachment_type?: string | null;
  status: 'sent' | 'delivered' | 'read';
  created_at: string;
  deleted_at?: string | null;
}

export interface Conversation {
  id: string;
  user: User;
  lastMessage: {
    content: string;
    timestamp: string;
    senderId: string;
  } | null;
  unreadCount: number;
  isApproved: boolean;
  approvedAt: string | null;
  approvedBy: string | null;
  createdAt: string;
}

export interface Group {
  id: string;
  name: string;
  description: string | null;
  avatarUrls: string[];
  memberCount: number;
  role: 'admin' | 'member';
  lastMessage: {
    content: string;
    timestamp: string;
    senderId: string;
  } | null;
  unreadCount: number;
  hasUnread: boolean;
  joinedAt: string;
  createdAt: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

// ==================== CONVERSATIONS ====================

/**
 * Get all conversations for the current user
 */
export async function getConversations(): Promise<Conversation[]> {
  try {
    const response = await axios.get('/chat/conversations');
    return response.data.data.conversations || [];
  } catch (error: any) {
    console.error('Error fetching conversations:', error);
    throw error;
  }
}

/**
 * Start a new conversation or get existing one
 */
export async function startConversation(participantId: string): Promise<any> {
  try {
    const response = await axios.post('/chat/conversations', {
      participantId,
    });
    return response.data.data;
  } catch (error: any) {
    console.error('Error starting conversation:', error);
    throw error;
  }
}

/**
 * Approve a conversation request
 */
export async function approveConversation(conversationId: string): Promise<any> {
  try {
    const response = await axios.post(
      `/chat/conversations/${conversationId}/approve`
    );
    return response.data.data;
  } catch (error: any) {
    console.error('Error approving conversation:', error);
    throw error;
  }
}

/**
 * Get messages for a specific conversation
 */
export async function getConversationMessages(
  conversationId: string,
  page: number = 1,
  limit: number = 50
): Promise<{ messages: Message[]; pagination: PaginationInfo }> {
  try {
    const response = await axios.get(
      `/chat/conversations/${conversationId}/messages`,
      {
        params: { page, limit },
      }
    );
    return response.data.data;
  } catch (error: any) {
    console.error('Error fetching conversation messages:', error);
    throw error;
  }
}

/**
 * Send a message in a conversation
 */
export async function sendConversationMessage(
  conversationId: string,
  content: string,
  attachmentUrl?: string,
  attachmentType?: string
): Promise<Message> {
  try {
    const response = await axios.post(
      `/chat/conversations/${conversationId}/messages`,
      {
        content,
        attachmentUrl,
        attachmentType,
      }
    );
    return response.data.data;
  } catch (error: any) {
    console.error('Error sending message:', error);
    throw error;
  }
}

// ==================== GROUPS ====================

/**
 * Get all groups for the current user
 */
export async function getGroups(): Promise<Group[]> {
  try {
    const response = await axios.get('/chat/groups');
    return response.data.data.groups || [];
  } catch (error: any) {
    console.error('Error fetching groups:', error);
    throw error;
  }
}

/**
 * Get messages for a specific group
 */
export async function getGroupMessages(
  groupId: string,
  page: number = 1,
  limit: number = 50
): Promise<{ messages: Message[]; pagination: PaginationInfo }> {
  try {
    const response = await axios.get(
      `/chat/groups/${groupId}/messages`,
      {
        params: { page, limit },
      }
    );
    return response.data.data;
  } catch (error: any) {
    console.error('Error fetching group messages:', error);
    throw error;
  }
}

/**
 * Send a message in a group
 */
export async function sendGroupMessage(
  groupId: string,
  content: string,
  attachmentUrl?: string,
  attachmentType?: string
): Promise<Message> {
  try {
    const response = await axios.post(
      `/chat/groups/${groupId}/messages`,
      {
        content,
        attachmentUrl,
        attachmentType,
      }
    );
    return response.data.data;
  } catch (error: any) {
    console.error('Error sending group message:', error);
    throw error;
  }
}

/**
 * Create a new group
 */
export async function createGroup(
  name: string,
  description?: string,
  avatarUrls?: string[],
  memberIds?: string[]
): Promise<any> {
  try {
    const response = await axios.post('/chat/groups', {
      name,
      description,
      avatarUrls,
      memberIds,
    });
    return response.data.data;
  } catch (error: any) {
    console.error('Error creating group:', error);
    throw error;
  }
}

// ==================== UTILITIES ====================

/**
 * Mark a message as read
 */
export async function markMessageAsRead(messageId: string): Promise<void> {
  try {
    await axios.patch(`/chat/messages/${messageId}/read`);
  } catch (error: any) {
    console.error('Error marking message as read:', error);
    throw error;
  }
}

/**
 * Send typing indicator
 */
export async function sendTypingIndicator(
  conversationId?: string,
  groupId?: string
): Promise<void> {
  try {
    await axios.post('/chat/typing', {
      conversationId,
      groupId,
    });
  } catch (error: any) {
    console.error('Error sending typing indicator:', error);
    // Don't throw error for typing indicators
  }
}
