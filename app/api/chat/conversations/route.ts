import { NextRequest, NextResponse } from 'next/server';
import { validateAuthToken, successResponse, errorResponse } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

// GET /api/chat/conversations - List all conversations for current user
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const user = await validateAuthToken(authHeader);
    
    if (!user) {
      return NextResponse.json(
        errorResponse('Authentication required'),
        { status: 401 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get conversations where user is participant
    const { data: conversations, error } = await supabase
      .from('conversations')
      .select('*')
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .order('last_message_at', { ascending: false, nullsFirst: false });

    if (error) {
      return NextResponse.json(
        errorResponse('Failed to fetch conversations', error.message),
        { status: 500 }
      );
    }

    // Enrich conversations with participant details and unread counts
    const enrichedConversations = await Promise.all(
      (conversations || []).map(async (conv) => {
        const otherUserId = conv.user1_id === user.id ? conv.user2_id : conv.user1_id;
        
        // Fetch other user's profile
        const { data: otherUser } = await supabase
          .from('user_profiles')
          .select('user_id, first_name, surname, profile_photo_url')
          .eq('user_id', otherUserId)
          .single();

        // Get last message
        const { data: lastMessage } = await supabase
          .from('messages')
          .select('id, content, created_at, sender_id, status')
          .eq('conversation_id', conv.id)
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        // Count unread messages (messages from other user not marked as read)
        const { count: unreadCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conv.id)
          .eq('sender_id', otherUserId)
          .neq('status', 'read')
          .is('deleted_at', null);

        return {
          id: conv.id,
          user: {
            id: otherUserId,
            name: otherUser ? `${otherUser.first_name || ''} ${otherUser.surname || ''}`.trim() : 'Unknown User',
            avatar: otherUser?.profile_photo_url || null,
          },
          lastMessage: lastMessage ? {
            content: lastMessage.content,
            timestamp: lastMessage.created_at,
            senderId: lastMessage.sender_id,
          } : null,
          unreadCount: unreadCount || 0,
          isApproved: conv.is_approved ?? true, // Default to true if field doesn't exist
          approvedAt: conv.approved_at || null,
          approvedBy: conv.approved_by || null,
          createdAt: conv.created_at,
        };
      })
    );

    return NextResponse.json(
      successResponse('Conversations retrieved successfully', {
        conversations: enrichedConversations,
      })
    );

  } catch (error: any) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      errorResponse('Internal server error', error.message),
      { status: 500 }
    );
  }
}

// POST /api/chat/conversations - Start a new conversation or get existing one
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const user = await validateAuthToken(authHeader);
    
    if (!user) {
      return NextResponse.json(
        errorResponse('Authentication required'),
        { status: 401 }
      );
    }

    const body = await request.json();
    const { participantId } = body;

    // Validation
    if (!participantId) {
      return NextResponse.json(
        errorResponse('participantId is required'),
        { status: 400 }
      );
    }

    if (participantId === user.id) {
      return NextResponse.json(
        errorResponse('Cannot create conversation with yourself'),
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Ensure user1_id < user2_id for consistency (ordered_users constraint)
    const [user1Id, user2Id] = [user.id, participantId].sort();

    // Check if conversation already exists
    const { data: existing, error: fetchError } = await supabase
      .from('conversations')
      .select('*')
      .eq('user1_id', user1Id)
      .eq('user2_id', user2Id)
      .maybeSingle();

    if (fetchError) {
      return NextResponse.json(
        errorResponse('Failed to check existing conversation', fetchError.message),
        { status: 500 }
      );
    }

    if (existing) {
      return NextResponse.json(
        successResponse('Conversation already exists', existing)
      );
    }

    // Verify participant exists
    const { data: participant, error: userError } = await supabase
      .from('user_profiles')
      .select('user_id')
      .eq('user_id', participantId)
      .single();

    if (userError || !participant) {
      return NextResponse.json(
        errorResponse('Participant not found'),
        { status: 404 }
      );
    }

    // Create new conversation (unapproved by default)
    const { data: newConversation, error: createError } = await supabase
      .from('conversations')
      .insert({
        user1_id: user1Id,
        user2_id: user2Id,
        is_approved: false, // New conversations require approval
      })
      .select()
      .single();

    if (createError) {
      return NextResponse.json(
        errorResponse('Failed to create conversation', createError.message),
        { status: 500 }
      );
    }

    return NextResponse.json(
      successResponse('Conversation created successfully', newConversation),
      { status: 201 }
    );

  } catch (error: any) {
    console.error('Error creating conversation:', error);
    return NextResponse.json(
      errorResponse('Internal server error', error.message),
      { status: 500 }
    );
  }
}
