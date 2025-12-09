import { NextRequest, NextResponse } from 'next/server';
import { validateAuthToken, successResponse, errorResponse } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

// GET /api/chat/groups/[groupId]/members - Get group members
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

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verify user is a member
    const { data: userMembership, error: userMemberError } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .single();

    if (userMemberError || !userMembership) {
      return NextResponse.json(
        errorResponse('Group not found or access denied'),
        { status: 404 }
      );
    }

    // Get all members with their profiles
    const { data: members, error: membersError } = await supabase
      .from('group_members')
      .select('user_id, role, joined_at')
      .eq('group_id', groupId)
      .order('joined_at', { ascending: true });

    if (membersError) {
      return NextResponse.json(
        errorResponse('Failed to fetch members', membersError.message),
        { status: 500 }
      );
    }

    // Fetch user profiles for all members with alias names
    const userIds = (members || []).map(m => m.user_id);
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('user_id, first_name, surname, alias_first_name, alias_surname, profile_photo_url')
      .in('user_id', userIds);

    const profileMap = new Map(
      (profiles || []).map(p => [p.user_id, p])
    );

    // Fetch Google auth user metadata for profile pictures
    const enrichedMembers = await Promise.all((members || []).map(async (member) => {
      const profile = profileMap.get(member.user_id);
      
      // Prioritize alias names over regular names
      const firstName = profile?.alias_first_name || profile?.first_name || '';
      const surname = profile?.alias_surname || profile?.surname || '';
      const displayName = `${firstName} ${surname}`.trim() || 'Unknown User';
      
      // Get Google auth profile picture if profile_photo_url is not set
      let avatarUrl = profile?.profile_photo_url || null;
      if (!avatarUrl) {
        try {
          const { data: { user: authUser } } = await supabase.auth.admin.getUserById(member.user_id);
          if (authUser?.user_metadata) {
            avatarUrl = authUser.user_metadata.avatar_url || authUser.user_metadata.picture || null;
          }
        } catch (err) {
          // Ignore errors fetching auth metadata
          console.error('Error fetching auth metadata for user:', member.user_id, err);
        }
      }
      
      return {
        id: member.user_id,
        name: displayName,
        avatar: avatarUrl,
        role: member.role,
        joinedAt: member.joined_at,
      };
    }));

    return NextResponse.json(
      successResponse('Members retrieved successfully', {
        members: enrichedMembers,
      })
    );

  } catch (error: any) {
    console.error('Error fetching group members:', error);
    return NextResponse.json(
      errorResponse('Internal server error', error.message),
      { status: 500 }
    );
  }
}

// POST /api/chat/groups/[groupId]/members - Add members to group (admin only)
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
    const { memberIds } = body;

    // Validation
    if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
      return NextResponse.json(
        errorResponse('memberIds array is required'),
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verify user is an admin
    const { data: membership, error: memberError } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .single();

    if (memberError || !membership || membership.role !== 'admin') {
      return NextResponse.json(
        errorResponse('Only group admins can add members'),
        { status: 403 }
      );
    }

    // Check which users are already members
    const { data: existingMembers } = await supabase
      .from('group_members')
      .select('user_id')
      .eq('group_id', groupId)
      .in('user_id', memberIds);

    const existingMemberIds = new Set((existingMembers || []).map(m => m.user_id));
    const newMemberIds = memberIds.filter(id => !existingMemberIds.has(id));

    if (newMemberIds.length === 0) {
      return NextResponse.json(
        errorResponse('All specified users are already members'),
        { status: 400 }
      );
    }

    // Add new members
    const membersToAdd = newMemberIds.map(memberId => ({
      group_id: groupId,
      user_id: memberId,
      role: 'member',
    }));

    const { data: addedMembers, error: addError } = await supabase
      .from('group_members')
      .insert(membersToAdd)
      .select();

    if (addError) {
      return NextResponse.json(
        errorResponse('Failed to add members', addError.message),
        { status: 500 }
      );
    }

    // Create notifications for new members
    const notifications = newMemberIds.map(memberId => ({
      user_id: memberId,
      actor_id: user.id,
      type: 'group_added',
      message: 'You have been added to a group',
      metadata: {
        group_id: groupId,
      },
    }));

    await supabase.from('notifications').insert(notifications);

    return NextResponse.json(
      successResponse('Members added successfully', {
        addedCount: addedMembers?.length || 0,
        alreadyMemberCount: existingMemberIds.size,
      }),
      { status: 201 }
    );

  } catch (error: any) {
    console.error('Error adding group members:', error);
    return NextResponse.json(
      errorResponse('Internal server error', error.message),
      { status: 500 }
    );
  }
}
