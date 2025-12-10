import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, getUserFromRequest, successResponse, errorResponse } from '@/lib/supabase/server';

/**
 * GET /api/settings
 * Get user account settings and profile information
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        errorResponse('Authentication required'),
        { status: 401 }
      );
    }

    const supabase = createServerClient();

    // Get user profile data
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('email, phone, first_name, surname')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      console.error('[Settings GET] Profile error:', profileError);
      return NextResponse.json(
        errorResponse('Failed to fetch profile data'),
        { status: 500 }
      );
    }

    // Get auth email as fallback
    const email = profile?.email || user.email;

    return NextResponse.json(
      successResponse({
        email,
        phone: profile?.phone || '',
        firstName: profile?.first_name || '',
        surname: profile?.surname || '',
        notificationPreferences: {
          emailNotifications: true,
          applicationUpdates: true,
          collabInvites: true,
          eventReminders: true,
        },
        privacySettings: {
          profileVisibility: 'public',
          showEmail: false,
          showPhone: false,
        },
      })
    );
  } catch (error) {
    console.error('[Settings GET] Error:', error);
    return NextResponse.json(
      errorResponse('Internal server error'),
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/settings
 * Update user account settings
 */
export async function PATCH(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        errorResponse('Authentication required'),
        { status: 401 }
      );
    }

    const body = await request.json();
    const { email, phone, notificationPreferences, privacySettings } = body;

    const supabase = createServerClient();

    // Prepare update data
    const updateData: any = {};

    if (phone !== undefined) updateData.phone = phone;
    // Note: notification_preferences and privacy_settings are not stored in database
    // These settings would need database columns added if persistence is required

    // Update profile (only if there's data to update)
    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('user_id', user.id);

      if (updateError) {
        console.error('[Settings PATCH] Update error:', updateError);
        return NextResponse.json(
          errorResponse('Failed to update settings'),
          { status: 500 }
        );
      }
    }

    // If email is being updated, update in auth as well
    if (email && email !== user.email) {
      const { error: emailError } = await supabase.auth.admin.updateUserById(
        user.id,
        { email }
      );

      if (emailError) {
        console.error('[Settings PATCH] Email update error:', emailError);
        return NextResponse.json(
          errorResponse('Failed to update email. Please verify the email is not already in use.'),
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      successResponse({ updated: true }, 'Settings updated successfully')
    );
  } catch (error) {
    console.error('[Settings PATCH] Error:', error);
    return NextResponse.json(
      errorResponse('Internal server error'),
      { status: 500 }
    );
  }
}
