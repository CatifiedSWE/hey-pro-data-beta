import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, validateAuthToken, successResponse, errorResponse } from '@/lib/supabase/server';

/**
 * GET /api/notifications
 * Get user's notifications with pagination
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
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const unreadOnly = searchParams.get('unread_only') === 'true';
    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from('notifications')
      .select(`
        id,
        user_id,
        type,
        title,
        message,
        is_read,
        metadata,
        actor_id,
        created_at,
        updated_at
      `, { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filter by unread only if requested
    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    const { data: notifications, error, count } = await query;

    if (error) {
      console.error('Error fetching notifications:', error);
      return NextResponse.json(
        errorResponse('Failed to fetch notifications', error.message),
        { status: 500 }
      );
    }

    // Enrich notifications with actor information
    const enrichedNotifications = await Promise.all(
      (notifications || []).map(async (notification) => {
        let actor = null;
        
        if (notification.actor_id) {
          const { data: actorProfile } = await supabase
            .from('user_profiles')
            .select('user_id, first_name, surname, alias_first_name, alias_surname, profile_photo_url')
            .eq('user_id', notification.actor_id)
            .maybeSingle();
          
          if (actorProfile) {
            // Prioritize alias names over regular names
            const firstName = actorProfile.alias_first_name || actorProfile.first_name || '';
            const surname = actorProfile.alias_surname || actorProfile.surname || '';
            const fullName = `${firstName} ${surname}`.trim() || 'User';
            
            actor = {
              id: actorProfile.user_id,
              name: fullName,
              avatar: actorProfile.profile_photo_url
            };
          }
        }

        return {
          id: notification.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          isRead: notification.is_read,
          metadata: notification.metadata,
          actor,
          createdAt: notification.created_at,
          updatedAt: notification.updated_at
        };
      })
    );

    const totalNotifications = count || 0;
    const totalPages = Math.ceil(totalNotifications / limit);

    // Count unread notifications
    const { count: unreadCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    return NextResponse.json(
      successResponse(
        {
          notifications: enrichedNotifications,
          pagination: {
            currentPage: page,
            totalPages,
            totalNotifications,
            limit,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
          },
          unreadCount: unreadCount || 0
        },
        'Notifications retrieved successfully'
      ),
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error in GET /api/notifications:', error);
    return NextResponse.json(
      errorResponse('Internal server error', error.message),
      { status: 500 }
    );
  }
}
