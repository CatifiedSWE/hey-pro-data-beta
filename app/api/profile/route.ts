import { NextRequest, NextResponse } from 'next/server';
import { validateAuthToken, successResponse, errorResponse } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { calculateAndUpdateProfileCompletion, ensureProfileCompletion } from '@/lib/profile-completion';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Log if env variables are missing
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables!', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseServiceKey
  });
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * GET /api/profile
 * Get current user's profile with all related data
 * OPTIMIZED: Auto-calculates completion for old users on first access
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const user = await validateAuthToken(authHeader);

    if (!user) {
      return NextResponse.json(
        errorResponse('Authentication required'),
        { status: 401 }
      );
    }

    // Get profile from user_profiles table
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select(`
        user_id,
        first_name,
        surname,
        alias_first_name,
        alias_surname,
        profile_photo_url,
        banner_url,
        about,
        bio,
        country,
        city,
        email,
        phone,
        country_code,
        availability,
        profile_completion_percentage,
        is_profile_complete,
        visible_in_explore,
        day_rate,
        day_rate_currency,
        work_identities,
        created_at,
        updated_at
      `)
      .eq('user_id', user.id)
      .single();

    if (error) {
      // Profile doesn't exist yet - return null data
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          successResponse(null, 'No profile found'),
          { status: 200 }
        );
      }
      console.error('Profile fetch error:', error);
      return NextResponse.json(
        errorResponse('Failed to fetch profile', error.message),
        { status: 500 }
      );
    }

    // OPTIMIZED: Auto-calculate completion for old users with NULL values
    // This ensures all users have accurate completion data
    if (profile && (profile.profile_completion_percentage === null || profile.profile_completion_percentage === undefined)) {
      console.log(`[Profile GET API] Auto-calculating completion for user ${user.id} (was NULL)`);
      const completion = await ensureProfileCompletion(user.id);
      
      // Update the profile object with calculated values
      profile.profile_completion_percentage = completion.completionPercentage;
      profile.is_profile_complete = completion.isComplete;
    }

    return NextResponse.json(
      successResponse(profile, 'Profile retrieved successfully'),
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Profile GET error:', error);
    return NextResponse.json(
      errorResponse('Internal server error', error.message),
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/profile
 * Create or update user profile
 */
export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const user = await validateAuthToken(authHeader);

    if (!user) {
      return NextResponse.json(
        errorResponse('Authentication required'),
        { status: 401 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return NextResponse.json(
        errorResponse('Invalid request body'),
        { status: 400 }
      );
    }

    // Extract and validate new fields
    const { day_rate, day_rate_currency, work_identities } = body;

    // Validate day_rate if provided
    if (day_rate !== undefined && day_rate !== null) {
      if (typeof day_rate !== 'number' || day_rate <= 0) {
        return NextResponse.json(
          errorResponse('day_rate must be a positive number or null'),
          { status: 400 }
        );
      }
    }

    // Validate day_rate_currency if provided
    if (day_rate_currency !== undefined && day_rate_currency !== null) {
      const validCurrencies = ['USD', 'AED', 'EUR', 'GBP', 'INR', 'CAD', 'AUD', 'JPY', 'CNY', 'SGD'];
      if (!validCurrencies.includes(day_rate_currency)) {
        return NextResponse.json(
          errorResponse(`Invalid currency. Allowed: ${validCurrencies.join(', ')}`),
          { status: 400 }
        );
      }
    }

    // Validate work_identities structure if provided
    if (work_identities !== undefined && work_identities !== null) {
      if (typeof work_identities !== 'object') {
        return NextResponse.json(
          errorResponse('work_identities must be an object'),
          { status: 400 }
        );
      }

      // Validate required keys exist
      const requiredKeys = ['freelance', 'employee', 'businessOwner'];
      for (const key of requiredKeys) {
        if (!(key in work_identities)) {
          return NextResponse.json(
            errorResponse(`work_identities missing required key: ${key}`),
            { status: 400 }
          );
        }
      }

      // Validate freelance is boolean
      if (typeof work_identities.freelance !== 'boolean') {
        return NextResponse.json(
          errorResponse('work_identities.freelance must be boolean'),
          { status: 400 }
        );
      }

      // Validate employee structure
      if (
        typeof work_identities.employee !== 'object' ||
        !('enabled' in work_identities.employee) ||
        !('company' in work_identities.employee) ||
        !('designation' in work_identities.employee)
      ) {
        return NextResponse.json(
          errorResponse('work_identities.employee must have enabled, company, designation'),
          { status: 400 }
        );
      }

      // Validate businessOwner structure
      if (
        typeof work_identities.businessOwner !== 'object' ||
        !('enabled' in work_identities.businessOwner) ||
        !('designation' in work_identities.businessOwner) ||
        !('businessName' in work_identities.businessOwner) ||
        !('businessType' in work_identities.businessOwner)
      ) {
        return NextResponse.json(
          errorResponse('work_identities.businessOwner must have enabled, designation, businessName, businessType'),
          { status: 400 }
        );
      }
    }

    // Check if profile exists
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('user_id')
      .eq('user_id', user.id)
      .single();

    let result;

    if (existingProfile) {
      // Update existing profile
      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          ...body,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Profile update error:', error);
        return NextResponse.json(
          errorResponse('Failed to update profile', error.message),
          { status: 500 }
        );
      }

      result = data;
    } else {
      // Create new profile
      const { data, error } = await supabase
        .from('user_profiles')
        .insert({
          user_id: user.id,
          ...body
        })
        .select()
        .single();

      if (error) {
        console.error('Profile creation error:', error);
        return NextResponse.json(
          errorResponse('Failed to create profile', error.message),
          { status: 500 }
        );
      }

      result = data;
    }

    // Recalculate profile completion percentage
    const completion = await calculateAndUpdateProfileCompletion(user.id);
    
    // Merge completion data into result
    result = {
      ...result,
      profile_completion_percentage: completion.completionPercentage,
      is_profile_complete: completion.isComplete
    };

    return NextResponse.json(
      successResponse(result, 'Profile saved successfully'),
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Profile PATCH error:', error);
    return NextResponse.json(
      errorResponse('Internal server error', error.message),
      { status: 500 }
    );
  }
}
