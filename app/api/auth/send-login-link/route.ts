import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

/**
 * Send a magic login link to existing users with passwords
 * Uses Supabase's OTP (One-Time Password) magic link
 */
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    // Normalize email to lowercase and trim whitespace
    const normalizedEmail = email.toLowerCase().trim();

    const supabase = createServerClient();

    // Send magic link for login
    const { error } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/profile`,
        shouldCreateUser: false // Don't create new user if doesn't exist
      }
    });

    if (error) {
      console.error('[Send Login Link] Error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    console.log(`[Send Login Link] Link sent to ${normalizedEmail}`);

    return NextResponse.json({
      success: true,
      message: 'Login link sent to your email'
    });

  } catch (err) {
    console.error('[Send Login Link] Error:', err);
    return NextResponse.json({ error: 'Failed to send link' }, { status: 500 });
  }
}
