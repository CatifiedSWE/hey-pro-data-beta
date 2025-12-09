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
    const authHeader = request.headers.get('Authorization');
    const user = await validateAuthToken(authHeader);
    
    if (!user) {
      return NextResponse.json(
        errorResponse('Authentication required'),
        { status: 401 }
      );
    }

    const { conversationId } = await params;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch conversation
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

    // Verify user is part of conversation
    if (conversation.user1_id !== user.id && conversation.user2_id !== user.id) {
      return NextResponse.json(
        errorResponse('Access denied'),
        { status: 403 }
      );
    }

    // Check if already approved
    if (conversation.is_approved) {
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
      console.error('Error fetching first message:', messageError);
      return NextResponse.json(
        errorResponse('Failed to fetch conversation messages', messageError.message),
        { status: 500 }
      );
    }

    if (!firstMessage) {
      return NextResponse.json(
        errorResponse('No messages found in this conversation'),
        { status: 400 }
      );
    }

    const initiatorId = firstMessage.sender_id;
    const recipientId = conversation.user1_id === initiatorId 
      ? conversation.user2_id 
      : conversation.user1_id;

    // Only the recipient can approve
    if (user.id !== recipientId) {
      return NextResponse.json(
        errorResponse('Only the message recipient can approve this conversation'),
        { status: 403 }
      );
    }

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
      return NextResponse.json(
        errorResponse('Failed to approve conversation', updateError.message),
        { status: 500 }
      );
    }

    // Get recipient's name for notification
    const { data: recipientProfile } = await supabase
      .from('user_profiles')
      .select('first_name, surname')
      .eq('user_id', user.id)
      .single();
    
    const recipientName = recipientProfile 
      ? `${recipientProfile.first_name || ''} ${recipientProfile.surname || ''}`.trim() || 'Someone'
      : 'Someone';

    // Create notification for the initiator
    await supabase
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
