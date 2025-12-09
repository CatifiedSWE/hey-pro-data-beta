import { NextRequest, NextResponse } from 'next/server';
import { validateAuthToken, successResponse, errorResponse } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

// GET /api/chat/groups/[groupId] - Get group details
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
    const { data: membership, error: memberError } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .single();

    if (memberError || !membership) {
      return NextResponse.json(
        errorResponse('Group not found or access denied'),
        { status: 404 }
      );
    }

    // Get group details
    const { data: group, error: groupError } = await supabase
      .from('group_chats')
      .select('*')
      .eq('id', groupId)
      .single();

    if (groupError || !group) {
      return NextResponse.json(
        errorResponse('Group not found'),
        { status: 404 }
      );
    }

    // Get members
    const { data: members, error: membersError } = await supabase
      .from('group_members')
      .select(`
        user_id,
        role,
        joined_at,
        user_profiles (user_id, first_name, surname, profile_photo_url)
      `)
      .eq('group_id', groupId);

    if (membersError) {
      console.error('Failed to fetch members:', membersError);
    }

    const enrichedMembers = (members || []).map(m => ({
      id: m.user_id,
      name: m.user_profiles ? `${m.user_profiles.first_name || ''} ${m.user_profiles.surname || ''}`.trim() : 'Unknown',
      avatar: m.user_profiles?.profile_photo_url || null,
      role: m.role,
      joinedAt: m.joined_at,
    }));

    return NextResponse.json(
      successResponse({
        id: group.id,
        name: group.name,
        description: group.description,
        avatarUrls: group.avatar_urls || [],
        createdBy: group.created_by,
        createdAt: group.created_at,
        members: enrichedMembers,
        userRole: membership.role,
      }, 'Group retrieved successfully')
    );

  } catch (error: any) {
    console.error('Error fetching group:', error);
    return NextResponse.json(
      errorResponse('Internal server error', error.message),
      { status: 500 }
    );
  }
}

// PATCH /api/chat/groups/[groupId] - Update group details (admin only)
export async function PATCH(
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
    const { name, description, avatarUrls } = body;

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
        errorResponse('Only group admins can update group details'),
        { status: 403 }
      );
    }

    // Build update object
    const updates: any = {};
    if (name !== undefined) {
      if (!name || name.trim().length === 0) {
        return NextResponse.json(
          errorResponse('Group name cannot be empty'),
          { status: 400 }
        );
      }
      if (name.length > 200) {
        return NextResponse.json(
          errorResponse('Group name too long (max 200 characters)'),
          { status: 400 }
        );
      }
      updates.name = name.trim();
    }
    if (description !== undefined) {
      updates.description = description?.trim() || null;
    }
    if (avatarUrls !== undefined) {
      updates.avatar_urls = avatarUrls || [];
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        errorResponse('No valid fields to update'),
        { status: 400 }
      );
    }

    // Update group
    const { data: updatedGroup, error: updateError } = await supabase
      .from('group_chats')
      .update(updates)
      .eq('id', groupId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        errorResponse('Failed to update group', updateError.message),
        { status: 500 }
      );
    }

    return NextResponse.json(
      successResponse(updatedGroup, 'Group updated successfully')
    );

  } catch (error: any) {
    console.error('Error updating group:', error);
    return NextResponse.json(
      errorResponse('Internal server error', error.message),
      { status: 500 }
    );
  }
}

// DELETE /api/chat/groups/[groupId] - Delete group (admin only)
export async function DELETE(
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

    // Verify user is an admin
    const { data: membership, error: memberError } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .single();

    if (memberError || !membership || membership.role !== 'admin') {
      return NextResponse.json(
        errorResponse('Only group admins can delete groups'),
        { status: 403 }
      );
    }

    // Delete group (cascade will handle members and messages)
    const { error: deleteError } = await supabase
      .from('group_chats')
      .delete()
      .eq('id', groupId);

    if (deleteError) {
      return NextResponse.json(
        errorResponse('Failed to delete group', deleteError.message),
        { status: 500 }
      );
    }

    return NextResponse.json(
      successResponse(null, 'Group deleted successfully')
    );

  } catch (error: any) {
    console.error('Error deleting group:', error);
    return NextResponse.json(
      errorResponse('Internal server error', error.message),
      { status: 500 }
    );
  }
}
