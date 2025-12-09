import { NextRequest, NextResponse } from 'next/server';
import { validateAuthToken, successResponse, errorResponse } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

// GET /api/chat/conversations/[conversationId] - Get conversation details
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

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch conversation
    const { data: conversation, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (error || !conversation) {
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

    // Get other participant's details
    const otherUserId = conversation.user1_id === user.id ? conversation.user2_id : conversation.user1_id;
    
    const { data: otherUser } = await supabase
      .from('user_profiles')
      .select('user_id, first_name, surname, profile_photo_url')
      .eq('user_id', otherUserId)
      .single();

    return NextResponse.json(
      successResponse({
        id: conversation.id,
        participant: {
          id: otherUserId,
          name: otherUser ? `${otherUser.first_name || ''} ${otherUser.surname || ''}`.trim() : 'Unknown User',
          avatar: otherUser?.profile_photo_url || null,
        },
        createdAt: conversation.created_at,
        lastMessageAt: conversation.last_message_at,
      }, 'Conversation retrieved successfully')
    );

  } catch (error: any) {
    console.error('Error fetching conversation:', error);
    return NextResponse.json(
      errorResponse('Internal server error', error.message),
      { status: 500 }
    );
  }
}
