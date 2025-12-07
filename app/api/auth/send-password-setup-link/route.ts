import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

/**
 * Send a password setup link (magic link) to users who exist but don't have passwords
 * Uses Supabase's password recovery flow
 */
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    const supabase = createServerClient();

    // Use Supabase's resetPasswordForEmail to send magic link
    // This will redirect to /set-password page
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/set-password`
    });

    if (error) {
      console.error('[Send Password Setup] Error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    console.log(`[Send Password Setup] Link sent to ${email}`);

    return NextResponse.json({
      success: true,
      message: 'Password setup link sent to your email'
    });

  } catch (err) {
    console.error('[Send Password Setup] Error:', err);
    return NextResponse.json({ error: 'Failed to send link' }, { status: 500 });
  }
}
