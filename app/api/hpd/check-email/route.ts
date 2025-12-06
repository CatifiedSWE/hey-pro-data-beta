import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    const supabase = await createClient();
    
    // Check in profiles or users table
    // Assuming 'profiles' table has an email field or we check auth.users (admin only)
    // Since we might not have admin access to check auth.users directly without service key,
    // we'll check the public 'profiles' table if it exists and has emails.
    // NOTE: In many setups, emails are private. 
    // For this MVP, we will simulate a check or check a "waiting list" table if profiles isn't accessible.
    
    // Let's try to query a profiles table.
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    const exists = !!data;

    // Log the check
    console.log(`[Lookup] Checking email ${email}: ${exists ? 'Found' : 'Not Found'}`);

    // If we want to simulate "sending activation link"
    if (exists) {
        // Trigger magic link logic here if needed
    }

    return NextResponse.json({ exists });

  } catch (err) {
    return NextResponse.json({ error: 'Check failed' }, { status: 500 });
  }
}
