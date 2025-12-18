import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, validateAuthToken, successResponse, errorResponse } from '@/lib/supabase/server';
import { calculateAndUpdateProfileCompletion } from '@/lib/profile-completion';

/**
 * PATCH /api/skills/[id]
 * Update a skill
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const body = await request.json();
    const { id: skillId } = await params;
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

    // Build update object with only provided fields
    const updateData: any = {};
    if (skill_name !== undefined) updateData.skill_name = skill_name;
    if (description !== undefined) updateData.description = description;
    if (department !== undefined) updateData.department = department;
    if (role !== undefined) updateData.role = role;
    if (proficiency_level !== undefined) updateData.proficiency_level = proficiency_level;
    if (experience_level !== undefined) updateData.experience_level = experience_level;
    if (day_rate !== undefined) updateData.day_rate = day_rate;
    if (day_rate_currency !== undefined) updateData.day_rate_currency = day_rate_currency;
    if (is_public !== undefined) updateData.is_public = is_public;
    if (sort_order !== undefined) updateData.sort_order = sort_order;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        errorResponse('No fields to update'),
        { status: 400 }
      );
    }

    // Update skill
    const { data: skill, error } = await supabase
      .from('applicant_skills')
      .update(updateData)
      .eq('id', skillId)
      .eq('user_id', user.id)
      .select()
      .maybeSingle();

    if (error) {
      console.error('Skill update error:', error);
      return NextResponse.json(
        errorResponse('Failed to update skill', error.message),
        { status: 500 }
      );
    }

    if (!skill) {
      return NextResponse.json(
        errorResponse('Skill not found or unauthorized'),
        { status: 404 }
      );
    }

    // Recalculate profile completion percentage
    await calculateAndUpdateProfileCompletion(user.id);

    return NextResponse.json(
      successResponse(skill, 'Skill updated successfully'),
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error in PATCH /api/skills/[id]:', error);
    return NextResponse.json(
      errorResponse('Internal server error', error.message),
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/skills/[id]
 * Delete a skill
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id: skillId } = await params;

    // Delete skill
    const { data, error } = await supabase
      .from('applicant_skills')
      .delete()
      .eq('id', skillId)
      .eq('user_id', user.id)
      .select()
      .maybeSingle();

    if (error) {
      console.error('Skill deletion error:', error);
      return NextResponse.json(
        errorResponse('Failed to delete skill', error.message),
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        errorResponse('Skill not found or unauthorized'),
        { status: 404 }
      );
    }

    // Recalculate profile completion percentage
    await calculateAndUpdateProfileCompletion(user.id);

    return NextResponse.json(
      successResponse(null, 'Skill deleted successfully'),
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error in DELETE /api/skills/[id]:', error);
    return NextResponse.json(
      errorResponse('Internal server error', error.message),
      { status: 500 }
    );
  }
}
