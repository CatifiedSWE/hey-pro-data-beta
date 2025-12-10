import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, validateAuthToken, successResponse, errorResponse } from '@/lib/supabase/server';

/**
 * POST /api/notifications/test
 * Test endpoint to verify notification creation works
 * This helps debug notification issues by testing the insert operation directly
 */
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

    const supabase = createServerClient();
    
    // Get user profile for display name
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('first_name, surname')
      .eq('user_id', user.id)
      .single();
    
    const userName = profile 
      ? `${profile.first_name} ${profile.surname}`.trim() 
      : 'Test User';

    // Attempt to create a test notification
    console.log('[TEST NOTIFICATION] Creating test notification for user:', user.id);
    
    const { data: notification, error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: user.id, // Send to self for testing
        actor_id: user.id,
        type: 'test_notification',
        message: `Test notification created at ${new Date().toISOString()}`,
        metadata: {
          test: true,
          timestamp: new Date().toISOString(),
        },
      })
      .select()
      .single();

    if (notificationError) {
      console.error('[TEST NOTIFICATION] Failed:', {
        error: notificationError,
        code: notificationError.code,
        message: notificationError.message,
        details: notificationError.details,
        hint: notificationError.hint,
      });

      return NextResponse.json(
        errorResponse('Failed to create test notification', {
          error: notificationError.message,
          code: notificationError.code,
          details: notificationError.details,
          hint: notificationError.hint,
        }),
        { status: 500 }
      );
    }

    console.log('[TEST NOTIFICATION] Success:', notification?.id);

    // Now try to fetch it back
    const { data: fetchedNotification, error: fetchError } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', notification.id)
      .single();

    if (fetchError) {
      return NextResponse.json(
        successResponse({
          notification,
          warning: 'Notification created but could not fetch it back',
          fetchError: fetchError.message,
        }, 'Test notification created but fetch failed - check RLS policies'),
        { status: 200 }
      );
    }

    return NextResponse.json(
      successResponse({
        notification: fetchedNotification,
        message: 'Notification system is working correctly!',
      }, 'Test notification created and fetched successfully'),
      { status: 201 }
    );

  } catch (error: any) {
    console.error('[TEST NOTIFICATION] Error:', error);
    return NextResponse.json(
      errorResponse('Internal server error', error.message),
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/notifications/test
 * Clean up test notifications
 */
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const user = await validateAuthToken(authHeader);

    if (!user) {
      return NextResponse.json(
        errorResponse('Authentication required'),
        { status: 401 }
      );
    }

    const supabase = createServerClient();
    
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', user.id)
      .eq('type', 'test_notification');

    if (error) {
      return NextResponse.json(
        errorResponse('Failed to delete test notifications', error.message),
        { status: 500 }
      );
    }

    return NextResponse.json(
      successResponse(null, 'Test notifications deleted successfully'),
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Error deleting test notifications:', error);
    return NextResponse.json(
      errorResponse('Internal server error', error.message),
      { status: 500 }
    );
  }
}
