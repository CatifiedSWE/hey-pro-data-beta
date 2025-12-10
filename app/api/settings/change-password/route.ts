import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { errorResponse, successResponse } from '@/lib/supabase/server';

/**
 * POST /api/settings/change-password
 * Change user password with current password verification
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        errorResponse('Current password and new password are required'),
        { status: 400 }
      );
    }

    // Validate new password strength
    if (newPassword.length < 8) {
      return NextResponse.json(
        errorResponse('New password must be at least 8 characters long'),
        { status: 400 }
      );
    }

    if (!/(?=.*[a-z])/.test(newPassword)) {
      return NextResponse.json(
        errorResponse('New password must contain at least one lowercase letter'),
        { status: 400 }
      );
    }

    if (!/(?=.*[A-Z])/.test(newPassword)) {
      return NextResponse.json(
        errorResponse('New password must contain at least one uppercase letter'),
        { status: 400 }
      );
    }

    if (!/(?=.*[0-9])/.test(newPassword)) {
      return NextResponse.json(
        errorResponse('New password must contain at least one number'),
        { status: 400 }
      );
    }

    // Get the access token from the Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        errorResponse('Authentication required'),
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    // Create Supabase client with user's token
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        errorResponse('Authentication failed'),
        { status: 401 }
      );
    }

    // Verify current password by attempting to sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: currentPassword,
    });

    if (signInError) {
      return NextResponse.json(
        errorResponse('Current password is incorrect'),
        { status: 400 }
      );
    }

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      console.error('[Change Password] Update error:', updateError);
      return NextResponse.json(
        errorResponse('Failed to update password. Please try again.'),
        { status: 500 }
      );
    }

    console.log(`[Change Password] Password updated successfully for user: ${user.id}`);

    return NextResponse.json(
      successResponse({ updated: true }, 'Password changed successfully')
    );
  } catch (error) {
    console.error('[Change Password] Error:', error);
    return NextResponse.json(
      errorResponse('Internal server error'),
      { status: 500 }
    );
  }
}
