import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, validateAuthToken, successResponse, errorResponse } from '@/lib/supabase/server';
import { calculateAndUpdateProfileCompletion } from '@/lib/profile-completion';

/**
 * GET /api/skills
 * Get user's skills
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

    const supabase = createServerClient();

    // Fetch skills ordered by sort_order
    const { data: skills, error } = await supabase
      .from('applicant_skills')
      .select('*')
      .eq('user_id', user.id)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Skills fetch error:', error);
      return NextResponse.json(
        errorResponse('Failed to fetch skills', error.message),
        { status: 500 }
      );
    }

    return NextResponse.json(
      successResponse(skills || [], 'Skills retrieved successfully'),
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error in GET /api/skills:', error);
    return NextResponse.json(
      errorResponse('Internal server error', error.message),
      { status: 500 }
    );
  }
}

/**
 * POST /api/skills
 * Add a new skill
 */
export async function POST(request: NextRequest) {
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
    const { 
      skill_name, 
      description, 
      department, 
      role, 
      proficiency_level, 
      experience_level, 
      day_rate, 
      day_rate_currency, 
      is_public, 
      sort_order 
    } = body;

    // Validate required fields
    if (!skill_name || typeof skill_name !== 'string' || skill_name.trim().length === 0) {
      return NextResponse.json(
        errorResponse('Skill name is required'),
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Build insert object with all available fields
    const insertData: any = {
      user_id: user.id,
      skill_name: skill_name.trim(),
      description: description || null,
      sort_order: sort_order || 0
    };

    // Add optional fields if provided
    if (department !== undefined) insertData.department = department;
    if (role !== undefined) insertData.role = role;
    if (proficiency_level !== undefined) insertData.proficiency_level = proficiency_level;
    if (experience_level !== undefined) insertData.experience_level = experience_level;
    if (day_rate !== undefined) insertData.day_rate = day_rate;
    if (day_rate_currency !== undefined) insertData.day_rate_currency = day_rate_currency;
    if (is_public !== undefined) insertData.is_public = is_public;

    // Insert skill
    const { data: skill, error } = await supabase
      .from('applicant_skills')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      // Handle unique constraint violation
      if (error.code === '23505') {
        return NextResponse.json(
          errorResponse('This skill already exists in your profile'),
          { status: 409 }
        );
      }
      console.error('Skill creation error:', error);
      return NextResponse.json(
        errorResponse('Failed to add skill', error.message),
        { status: 500 }
      );
    }

    // Recalculate profile completion percentage
    await calculateAndUpdateProfileCompletion(user.id);

    return NextResponse.json(
      successResponse(skill, 'Skill added successfully'),
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error in POST /api/skills:', error);
    return NextResponse.json(
      errorResponse('Internal server error', error.message),
      { status: 500 }
    );
  }
}
