import { NextRequest, NextResponse } from 'next/server';
import { validateAuthToken, successResponse, errorResponse } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

// GET /api/chat/groups/[groupId]/messages - Get group messages
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
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

    const { groupId } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verify user is a member
    const { data: membership, error: memberError } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .single();

    if (memberError || !membership) {
      return NextResponse.json(
        errorResponse('Group not found or access denied'),
        { status: 404 }
      );
    }

    // Get messages
    const { data: messages, error: messagesError, count } = await supabase
      .from('messages')
      .select('*', { count: 'exact' })
      .eq('group_id', groupId)
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
      successResponse({
        messages: sortedMessages,
        pagination: {
          page,
          limit,
          total: count || 0,
          hasMore: count ? offset + limit < count : false,
        },
      }, 'Messages retrieved successfully')
    );

  } catch (error: any) {
    console.error('Error fetching group messages:', error);
    return NextResponse.json(
      errorResponse('Internal server error', error.message),
      { status: 500 }
    );
  }
}

// POST /api/chat/groups/[groupId]/messages - Send a group message
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
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

    const { groupId } = await params;
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

    // Verify user is a member
    const { data: membership, error: memberError } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .single();

    if (memberError || !membership) {
      return NextResponse.json(
        errorResponse('Group not found or access denied'),
        { status: 404 }
      );
    }

    // Insert message
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert({
        group_id: groupId,
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

    // Update group's last_message_at
    await supabase
      .from('group_chats')
      .update({
        last_message_id: message.id,
        last_message_at: message.created_at,
      })
      .eq('id', groupId);

    // Create notifications for other group members
    const { data: members } = await supabase
      .from('group_members')
      .select('user_id')
      .eq('group_id', groupId)
      .neq('user_id', user.id);

    if (members && members.length > 0) {
      const notifications = members.map(member => ({
        user_id: member.user_id,
        actor_id: user.id,
        type: 'group_message',
        title: 'New Group Message',  // ✅ ADDED: Required field
        message: `New message in group: ${content.substring(0, 100)}`,
        metadata: {
          group_id: groupId,
          message_id: message.id,
        },
      }));

      await supabase.from('notifications').insert(notifications);
    }

    return NextResponse.json(
      successResponse(message, 'Message sent successfully'),
      { status: 201 }
    );

  } catch (error: any) {
    console.error('Error sending group message:', error);
    return NextResponse.json(
      errorResponse('Internal server error', error.message),
      { status: 500 }
    );
  }
}
