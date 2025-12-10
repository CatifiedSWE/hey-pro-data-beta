import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, getUserFromRequest, errorResponse, successResponse } from '@/lib/supabase/server';

/**
 * DELETE /api/settings/delete-account
 * Permanently delete user account and all associated data
 */
export async function DELETE(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        errorResponse('Authentication required'),
        { status: 401 }
      );
    }

    const body = await request.json();
    const { confirmation } = body;

    // Verify deletion confirmation
    if (confirmation !== 'DELETE') {
      return NextResponse.json(
        errorResponse('Please type DELETE to confirm account deletion'),
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    console.log(`[Delete Account] Starting account deletion for user: ${user.id}`);

    // Delete user data from various tables
    // Note: Tables with foreign key constraints should cascade delete automatically
    // But we'll explicitly delete from main tables for safety

    try {
      // Delete user profile
      await supabase
        .from('user_profiles')
        .delete()
        .eq('user_id', user.id);

      // Delete skills
      await supabase
        .from('user_skills')
        .delete()
        .eq('user_id', user.id);

      // Delete availability
      await supabase
        .from('availability')
        .delete()
        .eq('user_id', user.id);

      // Delete gigs created by user
      await supabase
        .from('gigs')
        .delete()
        .eq('creator_id', user.id);

      // Delete gig applications
      await supabase
        .from('gig_applications')
        .delete()
        .eq('applicant_id', user.id);

      // Delete collab posts
      await supabase
        .from('collab_posts')
        .delete()
        .eq('creator_id', user.id);

      // Delete slate posts
      await supabase
        .from('slate_posts')
        .delete()
        .eq('user_id', user.id);

      // Delete notifications
      await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id);

      // Delete events
      await supabase
        .from('whatson_events')
        .delete()
        .eq('creator_id', user.id);

      console.log(`[Delete Account] User data deleted successfully for: ${user.id}`);
    } catch (dbError) {
      console.error('[Delete Account] Database deletion error:', dbError);
      return NextResponse.json(
        errorResponse('Failed to delete user data from database'),
        { status: 500 }
      );
    }

    // Finally, delete the auth user
    const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(user.id);

    if (deleteAuthError) {
      console.error('[Delete Account] Auth deletion error:', deleteAuthError);
      return NextResponse.json(
        errorResponse('Failed to delete authentication account'),
        { status: 500 }
      );
    }

    console.log(`[Delete Account] ✅ Account fully deleted for user: ${user.id}`);

    return NextResponse.json(
      successResponse(
        { deleted: true },
        'Your account has been permanently deleted'
      )
    );
  } catch (error) {
    console.error('[Delete Account] Error:', error);
    return NextResponse.json(
      errorResponse('Internal server error'),
      { status: 500 }
    );
  }
}
