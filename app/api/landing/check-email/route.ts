import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    // Normalize email to lowercase and trim whitespace
    const normalizedEmail = email.toLowerCase().trim();

    const supabase = createServerClient();
    
    // Check auth.users table (Supabase authentication)
    let allUsers: any[] = [];
    let page = 1;
    const perPage = 1000;
    
    // Fetch all users with pagination
    while (true) {
      const { data: authUsersData, error: authListError } = await supabase.auth.admin.listUsers({
        page,
        perPage
      });
      
      if (authListError) {
        console.error('[Landing Email Check] Error listing auth users:', authListError);
        return NextResponse.json(
          { error: 'Database error. Please try again.' },
          { status: 500 }
        );
      }
      
      if (!authUsersData.users || authUsersData.users.length === 0) {
        break;
      }
      
      allUsers = allUsers.concat(authUsersData.users);
      
      if (authUsersData.users.length < perPage) {
        break;
      }
      
      page++;
    }
    
    console.log(`[Landing Email Check] Checked ${allUsers.length} auth users`);

    // Find user by email in auth.users
    const authUser = allUsers.find(u => u.email?.toLowerCase() === normalizedEmail);
    
    if (authUser) {
      console.log(`[Landing Email Check] ${normalizedEmail}: Found in auth.users - existing user`);
      return NextResponse.json({
        exists: true,
        message: 'Email exists in database'
      });
    }

    // Check user_profiles table as well
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('user_id')
      .ilike('email', normalizedEmail)
      .maybeSingle();

    if (profileError) {
      console.error('[Landing Email Check] Profile query error:', profileError);
      return NextResponse.json(
        { error: 'Database error. Please try again.' },
        { status: 500 }
      );
    }

    const exists = !!profileData;

    console.log(`[Landing Email Check] ${normalizedEmail}: exists=${exists}`);

    return NextResponse.json({ 
      exists,
      message: exists ? 'Email exists in database' : 'Email not found'
    });

  } catch (err) {
    console.error('[Landing Email Check] Error:', err);
    return NextResponse.json({ error: 'Check failed' }, { status: 500 });
  }
}
