import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, successResponse, errorResponse } from '@/lib/supabase/server';

/**
 * GET /api/explore/[userId]
 * Get detailed profile for a specific user
 * Public access
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const supabase = createServerClient();
    const { userId } = await params;

    // Get current authenticated user (if any)
    let currentUserId: string | null = null;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      currentUserId = user?.id || null;
    } catch (err) {
      // User not authenticated, continue as public access
      console.log('User not authenticated, proceeding with public access');
    }

    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return NextResponse.json(
        errorResponse('Failed to fetch profile', profileError.message),
        { status: 500 }
      );
    }

    if (!profile) {
      return NextResponse.json(
        errorResponse('Profile not found'),
        { status: 404 }
      );
    }

    // Fetch user roles
    const { data: roles } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId)
      .order('sort_order', { ascending: true });

    // Fetch user skills
    const { data: skills } = await supabase
      .from('applicant_skills')
      .select('*')
      .eq('user_id', userId)
      .order('sort_order', { ascending: true });

    // Fetch user links
    const { data: links } = await supabase
      .from('user_profile_links')
      .select('*')
      .eq('user_id', userId)
      .order('sort_order', { ascending: true });

    // Fetch user languages
    const { data: languages } = await supabase
      .from('user_languages')
      .select('*')
      .eq('user_id', userId);

    // Fetch travel countries
    const { data: travelCountries } = await supabase
      .from('user_travel_countries')
      .select('*')
      .eq('user_id', userId);

    // Fetch visa information
    const { data: visaInfo } = await supabase
      .from('user_visa_info')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    // Fetch credits with full details
    const { data: credits } = await supabase
      .from('user_credits')
      .select(`
        id,
        user_id,
        credit_title,
        description,
        start_date,
        end_date,
        image_url,
        sort_order,
        production_type,
        role,
        project_title,
        brand_client,
        local_company,
        international_company,
        country,
        release_year,
        is_unreleased,
        headline_stats,
        awards,
        created_at,
        updated_at
      `)
      .eq('user_id', userId)
      .order('start_date', { ascending: false });

    // Fetch highlights
    const { data: highlights } = await supabase
      .from('user_highlights')
      .select('*')
      .eq('user_id', userId)
      .order('sort_order', { ascending: true });

    // Enrich highlights with source data
    const enrichedHighlights = await Promise.all(
      (highlights || []).map(async (highlight) => {
        let sourceData = null;

        if (highlight.source_type === 'credit' && highlight.source_id) {
          const { data: credit } = await supabase
            .from('user_credits')
            .select('*')
            .eq('id', highlight.source_id)
            .single();
          sourceData = credit;
        } else if (highlight.source_type === 'slate_post' && highlight.source_id) {
          const { data: post } = await supabase
            .from('slate_posts')
            .select(`
              id,
              content,
              slug,
              likes_count,
              comments_count,
              created_at,
              media:slate_media(
                id,
                media_url,
                media_type,
                sort_order
              )
            `)
            .eq('id', highlight.source_id)
            .single();
          sourceData = post;
        }

        return {
          ...highlight,
          source_data: sourceData
        };
      })
    );

    // Fetch recommendations
    const { data: recommendations } = await supabase
      .from('user_recommendations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // Fetch availability (public access for profile viewing)
    const { data: availability } = await supabase
      .from('crew_availability')
      .select('*')
      .eq('user_id', userId)
      .order('availability_date', { ascending: true });

    // Fetch Google OAuth avatar as fallback
    let googleAvatar = null;
    try {
      const { data: authUser } = await supabase.auth.admin.getUserById(userId);
      if (authUser?.user?.user_metadata?.avatar_url || authUser?.user?.user_metadata?.picture) {
        googleAvatar = authUser.user.user_metadata.avatar_url || authUser.user.user_metadata.picture;
      }
    } catch (err) {
      console.error('Error fetching Google avatar:', err);
    }

    // Check if current user has saved this profile
    let userHasSaved = false;
    if (currentUserId) {
      const { data: savedProfile } = await supabase
        .from('profile_saves')
        .select('id')
        .eq('profile_user_id', userId)
        .eq('user_id', currentUserId)
        .maybeSingle();
      
      userHasSaved = !!savedProfile;
    }

    // Build display name with priority: alias_first_name + alias_surname (1st), first_name + surname (2nd)
    const aliasName = `${profile.alias_first_name || ''} ${profile.alias_surname || ''}`.trim();
    const realName = `${profile.first_name || ''} ${profile.surname || ''}`.trim();
    const displayName = aliasName || realName || 'Anonymous';
    
    // Priority: profile_photo_url > Google metadata avatar > null
    const profileAvatar = profile.profile_photo_url || googleAvatar || null;
    
    // Build comprehensive profile response
    const completeProfile = {
      id: profile.id,
      userId: profile.user_id,
      name: displayName,
      displayName: displayName,
      avatar: profileAvatar,
      banner: profile.banner_url,
      bio: profile.bio, // Short bio for profile card
      about: profile.about, // Detailed about section
      country: profile.country,
      city: profile.city,
      location: profile.city && profile.country 
        ? `${profile.city}, ${profile.country}` 
        : profile.country || 'Not specified',
      email: profile.email,
      phone: profile.phone,
      portfolioUrl: profile.portfolio_url,
      imdbUrl: profile.imdb_url,
      dayRate: profile.day_rate,
      currency: profile.day_rate_currency || 'AED',
      experienceLevel: profile.experience_level,
      availableForWork: profile.availability === "Available",
      visibleInExplore: profile.visible_in_explore,
      isProfileComplete: profile.is_profile_complete,
      profileCompletionPercentage: profile.profile_completion_percentage,
      roles: roles?.map(r => ({
        id: r.id,
        roleName: r.role_name,
        category: r.category,
        sortOrder: r.sort_order
      })) || [],
      skills: skills?.map(s => ({
        id: s.id,
        skillName: s.skill_name,
        proficiencyLevel: s.proficiency_level,
        sortOrder: s.sort_order
      })) || [],
      links: links?.map(l => ({
        id: l.id,
        platform: l.platform,
        url: l.url,
        label: l.label,
        sortOrder: l.sort_order
      })) || [],
      languages: languages?.map(lang => ({
        id: lang.id,
        language_name: lang.language_name,
        language: lang.language_name, // For backward compatibility
        can_speak: lang.can_speak,
        can_write: lang.can_write,
        proficiency: lang.proficiency
      })) || [],
      travelCountries: travelCountries?.map(tc => ({
        id: tc.id,
        country_name: tc.country_name,
        country: tc.country_name, // For backward compatibility
        country_code: tc.country_code
      })) || [],
      credits: credits?.map(c => ({
        id: c.id,
        creditTitle: c.credit_title,
        description: c.description,
        startDate: c.start_date,
        endDate: c.end_date,
        imgUrl: c.image_url,
        sortOrder: c.sort_order,
        productionType: c.production_type,
        role: c.role,
        projectTitle: c.project_title,
        brandClient: c.brand_client,
        localCompany: c.local_company,
        internationalCompany: c.international_company,
        country: c.country,
        releaseYear: c.release_year,
        isUnreleased: c.is_unreleased,
        headlineStats: c.headline_stats,
        awards: c.awards || [],
        createdAt: c.created_at,
        updatedAt: c.updated_at
      })) || [],
      highlights: enrichedHighlights?.map(h => ({
        id: h.id,
        highlight: h.highlight,
        sortOrder: h.sort_order,
        sourceType: h.source_type,
        sourceId: h.source_id,
        sourceData: h.source_data,
        title: h.title,
        description: h.description,
        imageUrl: h.image_url
      })) || [],
      recommendations: recommendations?.map(r => ({
        id: r.id,
        recommenderName: r.recommender_name,
        recommenderRole: r.recommender_role,
        recommendation: r.recommendation,
        createdAt: r.created_at
      })) || [],
      availability: availability?.map(a => ({
        id: a.id,
        date: a.availability_date,
        status: a.status
      })) || [],
      visa: visaInfo ? {
        nationality: visaInfo.nationality,
        visaType: visaInfo.visa_type,
        issuedBy: visaInfo.issued_by,
        expiryDate: visaInfo.expiry_date,
        passportExpiryDate: visaInfo.passport_expiry_date
      } : null,
      workIdentities: profile.work_identities,
      userHasSaved: userHasSaved,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at
    };

    return NextResponse.json(
      successResponse(completeProfile, 'Profile retrieved successfully'),
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error in GET /api/explore/[userId]:', error);
    return NextResponse.json(
      errorResponse('Internal server error', error.message),
      { status: 500 }
    );
  }
}
