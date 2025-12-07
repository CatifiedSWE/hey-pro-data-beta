import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, successResponse, errorResponse } from '@/lib/supabase/server';

/**
 * GET /api/explore
 * Search and filter crew profiles (Explore/Crew Directory)
 * Public access with optional authentication
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { searchParams } = new URL(request.url);
    
    // Get current logged-in user to exclude from results
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    const currentUserId = currentUser?.id;
    
    // Parse query parameters
    const keyword = searchParams.get('keyword');
    const role = searchParams.get('role');
    const category = searchParams.get('category');
    const availability = searchParams.get('availability');
    const productionType = searchParams.get('productionType');
    const location = searchParams.get('location');
    const experienceLevel = searchParams.get('experienceLevel');
    const minRate = searchParams.get('minRate');
    const maxRate = searchParams.get('maxRate');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const offset = (page - 1) * limit;

    // Build base query
    // Query only basic columns that exist in the database
    let query = supabase
      .from('user_profiles')
      .select(`
        id,
        user_id,
        alias_first_name,
        alias_surname,
        first_name,
        surname,
        profile_photo_url,
        banner_url,
        bio,
        country,
        city,
        created_at,
        updated_at
      `, { count: 'exact' });

    // Exclude current user from explore results
    if (currentUserId) {
      query = query.neq('user_id', currentUserId);
    }

    // Apply keyword search
    if (keyword) {
      query = query.or(`alias_first_name.ilike.%${keyword}%,alias_surname.ilike.%${keyword}%,first_name.ilike.%${keyword}%,surname.ilike.%${keyword}%,bio.ilike.%${keyword}%`);
    }

    // Apply location filter
    if (location) {
      query = query.or(`country.ilike.%${location}%,city.ilike.%${location}%`);
    }

    // Note: Availability, experience level, and rate filters are disabled
    // due to missing columns in the current database schema
    // These can be re-enabled when the columns are added to user_profiles table

    // Apply sorting
    const ascending = sortOrder === 'asc';
    
    // Check if random sorting is requested (for initial page loads)
    const seed = searchParams.get('seed');
    if (seed && page === 1) {
      // For randomization on first page, we'll fetch more and shuffle
      query = query.order('created_at', { ascending: false });
    } else {
      query = query.order(sortBy, { ascending });
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: profiles, error, count } = await query;

    if (error) {
      console.error('Error fetching profiles:', error);
      return NextResponse.json(
        errorResponse('Failed to fetch profiles', error.message),
        { status: 500 }
      );
    }

    // Fetch Google OAuth avatars for all users at once (batch query)
    const { data: authUsers } = await supabase.auth.admin.listUsers();
    
    // Create a map of user_id to Google avatar
    const googleAvatarMap = new Map<string, string>();
    if (authUsers?.users) {
      authUsers.users.forEach(authUser => {
        if (authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture) {
          googleAvatarMap.set(
            authUser.id, 
            authUser.user_metadata.avatar_url || authUser.user_metadata.picture
          );
        }
      });
    }

    // Enrich profiles with roles and Google avatars
    const enrichedProfiles = await Promise.all(
      (profiles || []).map(async (profile) => {
        // Fetch user roles
        const { data: roles } = await supabase
          .from('user_roles')
          .select('role_name')
          .eq('user_id', profile.user_id)
          .order('sort_order', { ascending: true });

        // Filter by role if specified
        if (role || category) {
          const roleNames = roles?.map(r => r.role_name.toLowerCase()) || [];
          const searchRole = (role || category || '').toLowerCase();
          if (!roleNames.some(r => r.includes(searchRole))) {
            return null; // Skip this profile
          }
        }

        // Build display name with priority: alias_first_name + alias_surname (1st), first_name + surname (2nd)
        const aliasName = `${profile.alias_first_name || ''} ${profile.alias_surname || ''}`.trim();
        const realName = `${profile.first_name || ''} ${profile.surname || ''}`.trim();
        const displayName = aliasName || realName || 'Anonymous';
        
        // Priority: profile_photo_url > Google metadata avatar > null
        const profileAvatar = profile.profile_photo_url || googleAvatarMap.get(profile.user_id) || null;
        
        return {
          id: profile.id,
          userId: profile.user_id,
          name: displayName,
          displayName: displayName,
          avatar: profileAvatar,
          banner: profile.banner_url,
          bio: profile.bio,
          location: profile.city && profile.country 
            ? `${profile.city}, ${profile.country}` 
            : profile.country || 'Not specified',
          country: profile.country,
          city: profile.city,
          roles: roles?.map(r => r.role_name) || [],
          createdAt: profile.created_at
        };
      })
    );

    // Filter out null profiles (those that didn't match role filter)
    const filteredProfiles = enrichedProfiles.filter(p => p !== null);

    // Use the database count for accurate pagination
    const totalProfiles = count || 0;
    const totalPages = Math.ceil(totalProfiles / limit);
    
    // Determine if there are more pages based on whether we got a full page of results
    // If we got fewer results than the limit, we're on the last page
    const hasNextPage = filteredProfiles.length >= limit;

    return NextResponse.json(
      successResponse(
        {
          profiles: filteredProfiles,
          pagination: {
            currentPage: page,
            totalPages,
            totalProfiles,
            limit,
            hasNextPage,
            hasPrevPage: page > 1
          }
        },
        'Profiles retrieved successfully'
      ),
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error in GET /api/explore:', error);
    return NextResponse.json(
      errorResponse('Internal server error', error.message),
      { status: 500 }
    );
  }
}
