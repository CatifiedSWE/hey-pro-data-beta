import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { user_type, source, submitted_fields, timestamp, session_id, meta } = body;

    // 1. Validate required fields (basic)
    if (!user_type || !submitted_fields) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = createServerClient();

    // 2. Insert into database
    // We assume a table 'onboarding_submissions' exists as per plan
    const { data, error } = await supabase
      .from('onboarding_submissions')
      .insert([
        {
          user_type,
          source: source || 'Landing Guide',
          submitted_fields,
          session_id,
          meta: meta || {},
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      // Handle duplicates
      if (error.code === '23505') { // Unique violation
        return NextResponse.json({ error: 'Duplicate submission' }, { status: 409 });
      }
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // 3. TODO: Trigger Emails (Simulated for now)
    console.log(`[Email Mock] Sending confirmation to user`);
    console.log(`[Email Mock] Sending notification to admin for ${user_type}`);

    return NextResponse.json({ status: 'accepted', id: data.id });
  } catch (err) {
    console.error('Server error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
