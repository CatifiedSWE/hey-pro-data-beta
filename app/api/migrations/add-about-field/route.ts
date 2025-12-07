import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * POST /api/migrations/add-about-field
 * Run migration to add 'about' field to user_profiles table
 * This is a one-time migration endpoint
 */
export async function POST(request: NextRequest) {
  try {
    // Check if the column already exists by trying to query it
    const { data: testData, error: testError } = await supabase
      .from('user_profiles')
      .select('about')
      .limit(1);

    if (!testError) {
      return NextResponse.json({
        success: true,
        message: 'Migration already completed - about column already exists',
        alreadyExists: true
      });
    }

    // If we get a column not found error, we need to add it
    // Note: Supabase doesn't allow DDL via client, so this needs to be done manually
    return NextResponse.json({
      success: false,
      message: 'Please run the migration SQL manually in Supabase SQL Editor',
      sql: `
-- Add about column to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS about TEXT;

-- Add comments
COMMENT ON COLUMN user_profiles.about IS 'About section - separate from bio';
COMMENT ON COLUMN user_profiles.bio IS 'Bio section - separate from about';
      `.trim()
    }, { status: 400 });

  } catch (error: any) {
    console.error('Migration check error:', error);
    return NextResponse.json({
      success: false,
      message: 'Error checking migration status',
      error: error.message,
      sql: `
-- Add about column to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS about TEXT;

-- Add comments
COMMENT ON COLUMN user_profiles.about IS 'About section - separate from bio';
COMMENT ON COLUMN user_profiles.bio IS 'Bio section - separate from about';
      `.trim()
    }, { status: 500 });
  }
}
