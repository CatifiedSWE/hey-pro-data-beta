import { NextRequest, NextResponse } from 'next/server';
import { validateAuthToken, successResponse, errorResponse } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/chat/conversations/[conversationId]/approve
 * Approve a conversation request
 * Only the recipient (user2) can approve
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    console.log('[Approve Conversation] Starting approval process...');
    
    const authHeader = request.headers.get('Authorization');
    const user = await validateAuthToken(authHeader);
    
    if (!user) {
      console.error('[Approve Conversation] Authentication failed');
      return NextResponse.json(
        errorResponse('Authentication required'),
        { status: 401 }
      );
    }

    console.log('[Approve Conversation] User authenticated:', user.id);

    const { conversationId } = await params;
    console.log('[Approve Conversation] Conversation ID:', conversationId);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    console.log('[Approve Conversation] Fetching conversation details...');

    // Fetch conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (convError) {
      console.error('[Approve Conversation] Error fetching conversation:', convError);
      return NextResponse.json(
        errorResponse('Failed to fetch conversation', convError.message),
        { status: 500 }
      );
    }

    if (!conversation) {
      console.error('[Approve Conversation] Conversation not found');
      return NextResponse.json(
        errorResponse('Conversation not found'),
        { status: 404 }
      );
    }

    console.log('[Approve Conversation] Conversation found:', {
      id: conversation.id,
      user1_id: conversation.user1_id,
      user2_id: conversation.user2_id,
      is_approved: conversation.is_approved
    });

    // Verify user is part of conversation
    if (conversation.user1_id !== user.id && conversation.user2_id !== user.id) {
      console.error('[Approve Conversation] Access denied - User not part of conversation');
      return NextResponse.json(
        errorResponse('Access denied'),
        { status: 403 }
      );
    }

    console.log('[Approve Conversation] User verified as participant');

    // Check if already approved
    if (conversation.is_approved) {
      console.log('[Approve Conversation] Conversation already approved');
      return NextResponse.json(
        successResponse({
          conversation: {
            id: conversation.id,
            is_approved: true,
            approved_at: conversation.approved_at,
            approved_by: conversation.approved_by,
          },
        }, 'Conversation is already approved')
      );
    }

    console.log('[Approve Conversation] Fetching first message to determine initiator...');

    // Determine who the initiator is by checking the first message
    // The initiator is the person who sent the first message
    const { data: firstMessage, error: messageError } = await supabase
      .from('messages')
      .select('sender_id')
      .eq('conversation_id', conversationId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    if (messageError) {
      console.error('[Approve Conversation] Error fetching first message:', {
        code: messageError.code,
        message: messageError.message,
        details: messageError.details,
        hint: messageError.hint
      });
      return NextResponse.json(
        errorResponse('Failed to fetch conversation messages', messageError.message),
        { status: 500 }
      );
    }

    if (!firstMessage) {
      console.error('[Approve Conversation] No messages found in conversation');
      return NextResponse.json(
        errorResponse('No messages found in this conversation'),
        { status: 400 }
      );
    }

    console.log('[Approve Conversation] First message sender:', firstMessage.sender_id);

    const initiatorId = firstMessage.sender_id;
    const recipientId = conversation.user1_id === initiatorId 
      ? conversation.user2_id 
      : conversation.user1_id;

    console.log('[Approve Conversation] Determined roles:', {
      initiatorId,
      recipientId,
      currentUserId: user.id,
      isRecipient: user.id === recipientId
    });

    // Only the recipient can approve
    if (user.id !== recipientId) {
      console.error('[Approve Conversation] User is not the recipient - cannot approve');
      return NextResponse.json(
        errorResponse('Only the message recipient can approve this conversation'),
        { status: 403 }
      );
    }

    console.log('[Approve Conversation] Updating conversation approval status...');

    // Approve the conversation
    const { data: updatedConversation, error: updateError } = await supabase
      .from('conversations')
      .update({
        is_approved: true,
        approved_at: new Date().toISOString(),
        approved_by: user.id,
      })
      .eq('id', conversationId)
      .select()
      .single();

    if (updateError) {
      console.error('[Approve Conversation] Failed to update conversation:', {
        code: updateError.code,
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint
      });
      return NextResponse.json(
        errorResponse('Failed to approve conversation', updateError.message),
        { status: 500 }
      );
    }

    console.log('[Approve Conversation] Conversation approved successfully');

    // Get recipient's name for notification
    console.log('[Approve Conversation] Fetching recipient profile for notification...');
    const { data: recipientProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('first_name, surname')
      .eq('user_id', user.id)
      .single();
    
    if (profileError) {
      console.warn('[Approve Conversation] Could not fetch recipient profile:', profileError.message);
    }
    
    const recipientName = recipientProfile 
      ? `${recipientProfile.first_name || ''} ${recipientProfile.surname || ''}`.trim() || 'Someone'
      : 'Someone';

    console.log('[Approve Conversation] Creating notification for initiator...');

    // Create notification for the initiator
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: initiatorId,
        actor_id: user.id,
        type: 'conversation_approved',
        message: `${recipientName} approved your message request`,
        metadata: {
          conversation_id: conversationId,
        },
      });

    if (notificationError) {
      console.warn('[Approve Conversation] Failed to create notification:', notificationError.message);
      // Don't fail the request if notification fails
    } else {
      console.log('[Approve Conversation] Notification created successfully');
    }

    console.log('[Approve Conversation] Process completed successfully');

    return NextResponse.json(
      successResponse({
        conversation: updatedConversation,
      }, 'Conversation approved successfully'),
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Error approving conversation:', error);
    return NextResponse.json(
      errorResponse('Internal server error', error.message),
      { status: 500 }
    );
  }
}
