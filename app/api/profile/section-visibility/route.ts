import { NextRequest, NextResponse } from 'next/server';
import { validateAuthToken, successResponse, errorResponse } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * GET /api/profile/section-visibility
 * Get section visibility settings for a user
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    // If userId is provided, fetch that user's visibility (for viewing other profiles)
    // Otherwise, use authenticated user (for own profile)
    let targetUserId: string;
    
    if (userId) {
      targetUserId = userId;
    } else {
      const authHeader = request.headers.get('Authorization');
      const user = await validateAuthToken(authHeader);
      if (!user) {
        return NextResponse.json(
          errorResponse('Authentication required'),
          { status: 401 }
        );
      }
      targetUserId = user.id;
    }

    const { data, error } = await supabase
      .from('profile_section_visibility')
      .select('*')
      .eq('user_id', targetUserId);

    if (error) {
      console.error('Error fetching section visibility:', error);
      return NextResponse.json(
        errorResponse('Failed to fetch visibility settings', error.message),
        { status: 500 }
      );
    }

    // Convert to key-value object for easier frontend access
    const visibilityMap: Record<string, boolean> = {};
    
    // Default all sections to visible
    const defaultSections = ['about', 'skills', 'credits', 'languages', 'contact_details', 'available_to_travel'];
    defaultSections.forEach(section => {
      visibilityMap[section] = true;
    });
    
    // Override with actual database values
    if (data) {
      data.forEach(item => {
        visibilityMap[item.section_name] = item.is_visible;
      });
    }

    return NextResponse.json(
      successResponse(visibilityMap, 'Visibility settings retrieved successfully'),
      { status: 200 }
    );

  } catch (error: any) {
    console.error('GET section-visibility error:', error);
    return NextResponse.json(
      errorResponse('Internal server error', error.message),
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/profile/section-visibility
 * Update visibility for a specific section
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

    const body = await request.json();
    const { section_name, is_visible } = body;

    if (!section_name || typeof is_visible !== 'boolean') {
      return NextResponse.json(
        errorResponse('section_name and is_visible are required'),
        { status: 400 }
      );
    }

    // Valid section names
    const validSections = ['about', 'skills', 'credits', 'languages', 'contact_details', 'available_to_travel'];
    if (!validSections.includes(section_name)) {
      return NextResponse.json(
        errorResponse('Invalid section_name'),
        { status: 400 }
      );
    }

    // Upsert visibility setting
    const { data, error } = await supabase
      .from('profile_section_visibility')
      .upsert({
        user_id: user.id,
        section_name,
        is_visible,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,section_name'
      })
      .select()
      .single();

    if (error) {
      console.error('Error updating section visibility:', error);
      return NextResponse.json(
        errorResponse('Failed to update visibility', error.message),
        { status: 500 }
      );
    }

    return NextResponse.json(
      successResponse(data, 'Visibility updated successfully'),
      { status: 200 }
    );

  } catch (error: any) {
    console.error('PATCH section-visibility error:', error);
    return NextResponse.json(
      errorResponse('Internal server error', error.message),
      { status: 500 }
    );
  }
}
