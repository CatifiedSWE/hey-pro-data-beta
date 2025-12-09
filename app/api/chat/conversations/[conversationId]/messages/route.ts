import { NextRequest, NextResponse } from 'next/server';
import { validateAuthToken, successResponse, errorResponse } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

// GET /api/chat/conversations/[conversationId]/messages - Get messages for a conversation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const authHeader = request.headers.get('Authorization');
    const user = await validateAuthToken(authHeader);
    
    if (!user) {
      return NextResponse.json(
        errorResponse('Authentication required'),
        { status: 401 }
      );
    }

    const { conversationId } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verify user is part of conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('user1_id, user2_id')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      return NextResponse.json(
        errorResponse('Conversation not found'),
        { status: 404 }
      );
    }

    if (conversation.user1_id !== user.id && conversation.user2_id !== user.id) {
      return NextResponse.json(
        errorResponse('Access denied'),
        { status: 403 }
      );
    }

    // Get messages
    const { data: messages, error: messagesError, count } = await supabase
      .from('messages')
      .select('*', { count: 'exact' })
      .eq('conversation_id', conversationId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (messagesError) {
      return NextResponse.json(
        errorResponse('Failed to fetch messages', messagesError.message),
        { status: 500 }
      );
    }

    // Reverse to show oldest first
    const sortedMessages = (messages || []).reverse();

    return NextResponse.json(
      successResponse('Messages retrieved successfully', {
        messages: sortedMessages,
        pagination: {
          page,
          limit,
          total: count || 0,
          hasMore: count ? offset + limit < count : false,
        },
      })
    );

  } catch (error: any) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      errorResponse('Internal server error', error.message),
      { status: 500 }
    );
  }
}

// POST /api/chat/conversations/[conversationId]/messages - Send a message
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const authHeader = request.headers.get('Authorization');
    const user = await validateAuthToken(authHeader);
    
    if (!user) {
      return NextResponse.json(
        errorResponse('Authentication required'),
        { status: 401 }
      );
    }

    const { conversationId } = await params;
    const body = await request.json();
    const { content, attachmentUrl, attachmentType } = body;

    // Validation
    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        errorResponse('Message content is required'),
        { status: 400 }
      );
    }

    if (content.length > 10000) {
      return NextResponse.json(
        errorResponse('Message content too long (max 10000 characters)'),
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verify user is part of conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      return NextResponse.json(
        errorResponse('Conversation not found'),
        { status: 404 }
      );
    }

    if (conversation.user1_id !== user.id && conversation.user2_id !== user.id) {
      return NextResponse.json(
        errorResponse('Access denied'),
        { status: 403 }
      );
    }

    // ⭐ APPROVAL LOGIC: Check if conversation is approved
    if (!conversation.is_approved) {
      // Determine who initiated the conversation (user with lower UUID is user1)
      const initiatorId = conversation.user1_id < conversation.user2_id 
        ? conversation.user1_id 
        : conversation.user2_id;
      
      // Check if current user is the initiator
      const isInitiator = user.id === initiatorId;

      if (isInitiator) {
        // Check if initiator has already sent a message
        const { count: messageCount, error: countError } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conversationId)
          .eq('sender_id', user.id)
          .is('deleted_at', null);

        if (countError) {
          return NextResponse.json(
            errorResponse('Failed to check message count', countError.message),
            { status: 500 }
          );
        }

        // Block if initiator already sent a message
        if (messageCount && messageCount >= 1) {
          return NextResponse.json(
            errorResponse(
              'Conversation pending approval. You can send more messages after the recipient approves.',
              'APPROVAL_REQUIRED'
            ),
            { status: 403 }
          );
        }
      }
    }

    // Insert message
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: content.trim(),
        attachment_url: attachmentUrl || null,
        attachment_type: attachmentType || null,
        status: 'sent',
      })
      .select()
      .single();

    if (messageError) {
      return NextResponse.json(
        errorResponse('Failed to send message', messageError.message),
        { status: 500 }
      );
    }

    // Update conversation's last_message_at
    await supabase
      .from('conversations')
      .update({
        last_message_id: message.id,
        last_message_at: message.created_at,
      })
      .eq('id', conversationId);

    // Create notification for the other user
    const recipientId = conversation.user1_id === user.id ? conversation.user2_id : conversation.user1_id;
    
    await supabase
      .from('notifications')
      .insert({
        user_id: recipientId,
        actor_id: user.id,
        type: 'direct_message',
        message: `New message: ${content.substring(0, 100)}`,
        metadata: {
          conversation_id: conversationId,
          message_id: message.id,
        },
      });

    return NextResponse.json(
      successResponse('Message sent successfully', message),
      { status: 201 }
    );

  } catch (error: any) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      errorResponse('Internal server error', error.message),
      { status: 500 }
    );
  }
}
