import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, getUserFromRequest, errorResponse, successResponse } from '@/lib/supabase/server';

/**
 * POST /api/settings/request-password-reset
 * Send password reset email to authenticated user
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        errorResponse('Authentication required'),
        { status: 401 }
      );
    }

    const supabase = createServerClient();

    // Get user email
    const email = user.email;
    if (!email) {
      return NextResponse.json(
        errorResponse('User email not found'),
        { status: 400 }
      );
    }

    // Remove trailing slash from base URL
    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
    const redirectUrl = `${baseUrl}/set-password`;

    console.log('[Request Password Reset] Sending email to:', email);
    console.log('[Request Password Reset] Redirect URL:', redirectUrl);

    // Send password reset email
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    if (error) {
      console.error('[Request Password Reset] Error:', error);
      return NextResponse.json(
        errorResponse('Failed to send password reset email'),
        { status: 500 }
      );
    }

    console.log(`[Request Password Reset] Reset email sent to: ${email}`);

    return NextResponse.json(
      successResponse(
        { emailSent: true },
        'Password reset link has been sent to your email'
      )
    );
  } catch (error) {
    console.error('[Request Password Reset] Error:', error);
    return NextResponse.json(
      errorResponse('Internal server error'),
      { status: 500 }
    );
  }
}
