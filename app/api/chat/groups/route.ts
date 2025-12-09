import { NextRequest, NextResponse } from 'next/server';
import { validateAuthToken, successResponse, errorResponse } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

// GET /api/chat/groups - List all groups user is a member of
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

    // Get groups where user is a member
    const { data: memberships, error: memberError } = await supabase
      .from('group_members')
      .select('group_id, role, joined_at')
      .eq('user_id', user.id);

    if (memberError) {
      return NextResponse.json(
        errorResponse('Failed to fetch groups', memberError.message),
        { status: 500 }
      );
    }

    if (!memberships || memberships.length === 0) {
      return NextResponse.json(
        successResponse({ groups: [] }, 'No groups found')
      );
    }

    const groupIds = memberships.map(m => m.group_id);

    // Get group details
    const { data: groups, error: groupError } = await supabase
      .from('group_chats')
      .select('*')
      .in('id', groupIds)
      .order('last_message_at', { ascending: false, nullsFirst: false });

    if (groupError) {
      return NextResponse.json(
        errorResponse('Failed to fetch group details', groupError.message),
        { status: 500 }
      );
    }

    // Enrich groups with additional data
    const enrichedGroups = await Promise.all(
      (groups || []).map(async (group) => {
        // Get member count
        const { count: memberCount } = await supabase
          .from('group_members')
          .select('*', { count: 'exact', head: true })
          .eq('group_id', group.id);

        // Get last message
        const { data: lastMessage } = await supabase
          .from('messages')
          .select('id, content, created_at, sender_id')
          .eq('group_id', group.id)
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        // Count unread messages
        const { count: unreadCount } = await supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('group_id', group.id)
          .is('deleted_at', null)
          .not('message_read_status', 'cs', `{"user_id": "${user.id}"}`);

        // Check if user has read the last message
        let hasUnread = false;
        if (lastMessage) {
          const { data: readStatus } = await supabase
            .from('message_read_status')
            .select('id')
            .eq('message_id', lastMessage.id)
            .eq('user_id', user.id)
            .single();
          
          hasUnread = !readStatus && lastMessage.sender_id !== user.id;
        }

        const membership = memberships.find(m => m.group_id === group.id);

        return {
          id: group.id,
          name: group.name,
          description: group.description,
          avatarUrls: group.avatar_urls || [],
          memberCount: memberCount || 0,
          role: membership?.role || 'member',
          lastMessage: lastMessage ? {
            content: lastMessage.content,
            timestamp: lastMessage.created_at,
            senderId: lastMessage.sender_id,
          } : null,
          unreadCount: unreadCount || 0,
          hasUnread,
          joinedAt: membership?.joined_at,
          createdAt: group.created_at,
        };
      })
    );

    return NextResponse.json(
      successResponse({
        groups: enrichedGroups,
      }, 'Groups retrieved successfully')
    );

  } catch (error: any) {
    console.error('Error fetching groups:', error);
    return NextResponse.json(
      errorResponse('Internal server error', error.message),
      { status: 500 }
    );
  }
}

// POST /api/chat/groups - Create a new group
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
    const { name, description, avatarUrls, memberIds } = body;

    // Validation
    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        errorResponse('Group name is required'),
        { status: 400 }
      );
    }

    if (name.length > 200) {
      return NextResponse.json(
        errorResponse('Group name too long (max 200 characters)'),
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Create group
    const { data: group, error: groupError } = await supabase
      .from('group_chats')
      .insert({
        name: name.trim(),
        description: description?.trim() || null,
        avatar_urls: avatarUrls || [],
        created_by: user.id,
      })
      .select()
      .single();

    if (groupError) {
      return NextResponse.json(
        errorResponse('Failed to create group', groupError.message),
        { status: 500 }
      );
    }

    // Add creator as admin
    const { error: creatorError } = await supabase
      .from('group_members')
      .insert({
        group_id: group.id,
        user_id: user.id,
        role: 'admin',
      });

    if (creatorError) {
      // Rollback: delete group
      await supabase.from('group_chats').delete().eq('id', group.id);
      return NextResponse.json(
        errorResponse('Failed to add creator to group', creatorError.message),
        { status: 500 }
      );
    }

    // Add other members if provided
    if (memberIds && Array.isArray(memberIds) && memberIds.length > 0) {
      const membersToAdd = memberIds
        .filter(id => id !== user.id) // Exclude creator
        .map(memberId => ({
          group_id: group.id,
          user_id: memberId,
          role: 'member',
        }));

      if (membersToAdd.length > 0) {
        const { error: membersError } = await supabase
          .from('group_members')
          .insert(membersToAdd);

        if (membersError) {
          console.error('Failed to add some members:', membersError);
          // Don't rollback, group is created successfully
        }
      }
    }

    return NextResponse.json(
      successResponse(group, 'Group created successfully'),
      { status: 201 }
    );

  } catch (error: any) {
    console.error('Error creating group:', error);
    return NextResponse.json(
      errorResponse('Internal server error', error.message),
      { status: 500 }
    );
  }
}
