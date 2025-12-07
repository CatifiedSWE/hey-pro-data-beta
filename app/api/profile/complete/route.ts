import { NextRequest, NextResponse } from 'next/server';
import { validateAuthToken, successResponse, errorResponse } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { ensureProfileCompletion } from '@/lib/profile-completion';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * GET /api/profile/complete
 * Get ALL profile data in a single aggregated call
 * 
 * This endpoint reduces 11 separate API calls into 1 call:
 * - /api/profile
 * - /api/profile/links
 * - /api/profile/recommendations
 * - /api/profile/roles
 * - /api/profile/visa
 * - /api/profile/languages
 * - /api/profile/travel-countries
 * - /api/profile/highlights
 * - /api/skills
 * - /api/profile/credits
 * - /api/availability (current month)
 * 
 * Expected reduction: 11 calls → 1 call (91% reduction on page load)
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

    // OPTIMIZED: Auto-calculate completion for old users with NULL values
    // This runs efficiently - only calculates if needed
    const completionCheck = await ensureProfileCompletion(user.id);
    
    if (completionCheck.wasCalculated) {
      console.log(`[Profile Complete API] Auto-calculated completion for user ${user.id}: ${completionCheck.completionPercentage}%`);
    }

    // Get current month for availability
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthStart = `${currentMonth}-01`;
    const monthEnd = `${currentMonth}-31`;

    // Execute all queries in parallel for maximum performance
    const [
      profileResult,
      linksResult,
      recommendationsListResult,
      rolesResult,
      visaResult,
      languagesResult,
      travelCountriesResult,
      highlightsResult,
      skillsResult,
      creditsResult,
      availabilityResult
    ] = await Promise.all([
      // Profile data
      supabase
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
        .single(),

      // Links
      supabase
        .from('user_links')
        .select('*')
        .eq('user_id', user.id)
        .order('sort_order', { ascending: true }),

      // Recommendations list (we'll fetch profiles separately)
      supabase
        .from('user_recommendations')
        .select('id, recommended_user_id, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),

      // Roles
      supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', user.id)
        .order('sort_order', { ascending: true }),

      // Visa info
      supabase
        .from('user_visa_info')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle(),

      // Languages
      supabase
        .from('user_languages')
        .select('*')
        .eq('user_id', user.id)
        .order('language_name', { ascending: true }),

      // Travel countries
      supabase
        .from('user_travel_countries')
        .select('*')
        .eq('user_id', user.id)
        .order('country_name', { ascending: true }),

      // Highlights
      supabase
        .from('user_highlights')
        .select('*')
        .eq('user_id', user.id)
        .order('sort_order', { ascending: true }),

      // Skills
      supabase
        .from('applicant_skills')
        .select('*')
        .eq('user_id', user.id)
        .order('sort_order', { ascending: true }),

      // Credits
      supabase
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
        .eq('user_id', user.id)
        .order('start_date', { ascending: false }),

      // Availability (current month)
      supabase
        .from('crew_availability')
        .select('*')
        .eq('user_id', user.id)
        .gte('availability_date', monthStart)
        .lte('availability_date', monthEnd)
        .order('availability_date', { ascending: true })
    ]);

    // Fetch recommended user profiles if there are any recommendations
    let recommendations = [];
    if (recommendationsListResult.data && recommendationsListResult.data.length > 0) {
      const recommendedUserIds = recommendationsListResult.data.map(rec => rec.recommended_user_id);
      
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('user_id, first_name, surname, profile_photo_url')
        .in('user_id', recommendedUserIds);

      // Combine recommendations with profile data
      recommendations = recommendationsListResult.data.map(rec => {
        const profile = profiles?.find(p => p.user_id === rec.recommended_user_id);
        return {
          id: rec.id,
          recommended_user_id: rec.recommended_user_id,
          created_at: rec.created_at,
          user_profiles: profile || null
        };
      });
    }

    // ENRICH HIGHLIGHTS WITH SOURCE DATA
    // This is critical for the UI to display credit/slate info without extra roundtrips
    let enrichedHighlights = [];
    const highlights = highlightsResult.data || [];
    const credits = creditsResult.data || [];

    // 1. Identify Slate Posts that need fetching
    const slatePostIds = highlights
      .filter(h => h.source_type === 'slate_post' && h.source_id)
      .map(h => h.source_id);

    let slatePosts = [];
    if (slatePostIds.length > 0) {
      const { data: fetchedPosts } = await supabase
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
        .in('id', slatePostIds);
      slatePosts = fetchedPosts || [];
    }

    // 2. Enrich each highlight
    enrichedHighlights = highlights.map(highlight => {
      let sourceData = null;

      if (highlight.source_type === 'credit' && highlight.source_id) {
        // Find in already-fetched credits
        sourceData = credits.find(c => c.id === highlight.source_id) || null;
      } else if (highlight.source_type === 'slate_post' && highlight.source_id) {
        // Find in newly-fetched slate posts
        sourceData = slatePosts.find(p => p.id === highlight.source_id) || null;
      }

      return {
        ...highlight,
        source_data: sourceData
      };
    });

    // Map visa data from database columns to frontend expected fields
    const mappedVisa = visaResult.data ? {
      ...visaResult.data,
      visa_issued_by: visaResult.data.issued_by,
      visa_expiry_date: visaResult.data.expiry_date,
      nationality: visaResult.data.nationality,
      passport_expiry_date: visaResult.data.passport_expiry_date
    } : null;

    // Check for critical errors (profile not found is acceptable)
    if (profileResult.error && profileResult.error.code !== 'PGRST116') {
      console.error('Profile fetch error:', profileResult.error);
      return NextResponse.json(
        errorResponse('Failed to fetch profile', profileResult.error.message),
        { status: 500 }
      );
    }

    // Log any non-critical errors for debugging
    if (linksResult.error) console.error('Links fetch error:', linksResult.error);
    if (recommendationsListResult.error) console.error('Recommendations fetch error:', recommendationsListResult.error);
    if (rolesResult.error) console.error('Roles fetch error:', rolesResult.error);
    if (visaResult.error) console.error('Visa fetch error:', visaResult.error);
    if (languagesResult.error) console.error('Languages fetch error:', languagesResult.error);
    if (travelCountriesResult.error) console.error('Travel countries fetch error:', travelCountriesResult.error);
    if (highlightsResult.error) console.error('Highlights fetch error:', highlightsResult.error);
    if (skillsResult.error) console.error('Skills fetch error:', skillsResult.error);
    if (creditsResult.error) console.error('Credits fetch error:', creditsResult.error);
    if (availabilityResult.error) console.error('Availability fetch error:', availabilityResult.error);

    // Return aggregated data
    const completeProfile = {
      profile: profileResult.data || null,
      links: linksResult.data || [],
      recommendations: recommendations,
      roles: rolesResult.data || [],
      visa: mappedVisa,
      languages: languagesResult.data || [],
      travelCountries: travelCountriesResult.data || [],
      highlights: enrichedHighlights, // Use the enriched version
      skills: skillsResult.data || [],
      credits: creditsResult.data || [],
      availability: availabilityResult.data || []
    };

    return NextResponse.json(
      successResponse(completeProfile, 'Complete profile data retrieved successfully'),
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Complete profile GET error:', error);
    return NextResponse.json(
      errorResponse('Internal server error', error.message),
      { status: 500 }
    );
  }
}
