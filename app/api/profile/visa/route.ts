import { NextRequest, NextResponse } from 'next/server';
import { validateAuthToken, successResponse, errorResponse } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * GET /api/profile/visa
 * Get user's visa information (1:1 relationship)
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

    const { data: visaInfo, error } = await supabase
      .from('user_visa_info')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      // No visa info found
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          successResponse(null, 'No visa information found'),
          { status: 200 }
        );
      }
      console.error('Visa info fetch error:', error);
      return NextResponse.json(
        errorResponse('Failed to fetch visa information', error.message),
        { status: 500 }
      );
    }

    // Map database columns to frontend expected fields
    const mappedVisaInfo = visaInfo ? {
      ...visaInfo,
      visa_issued_by: visaInfo.issued_by,
      visa_expiry_date: visaInfo.expiry_date,
      nationality: visaInfo.nationality,
      passport_expiry_date: visaInfo.passport_expiry_date
    } : null;

    return NextResponse.json(
      successResponse(mappedVisaInfo, 'Visa information retrieved successfully'),
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      errorResponse('Internal server error', error.message),
      { status: 500 }
    );
  }
}

/**
 * POST /api/profile/visa
 * Create visa information
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
    const { visa_type, issued_by, expiry_date } = body;

    const { data, error } = await supabase
      .from('user_visa_info')
      .insert({
        user_id: user.id,
        visa_type,
        issued_by,
        expiry_date
      })
      .select()
      .single();

    if (error) {
      // Check for unique constraint violation
      if (error.code === '23505') {
        return NextResponse.json(
          errorResponse('Visa information already exists. Use PATCH to update.'),
          { status: 409 }
        );
      }
      console.error('Visa creation error:', error);
      return NextResponse.json(
        errorResponse('Failed to create visa information', error.message),
        { status: 500 }
      );
    }

    return NextResponse.json(
      successResponse(data, 'Visa information created successfully'),
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      errorResponse('Internal server error', error.message),
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/profile/visa
 * Update or create visa information (upsert)
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
    const { nationality, passport_expiry_date, visa_type, visa_issued_by, visa_expiry_date } = body;

    // Map frontend fields to database columns
    const updateData: any = { user_id: user.id };
    // Store nationality and passport_expiry_date
    if (nationality !== undefined) updateData.nationality = nationality;
    if (passport_expiry_date !== undefined) updateData.passport_expiry_date = passport_expiry_date;
    if (visa_type !== undefined) updateData.visa_type = visa_type;
    // Map visa_issued_by -> issued_by (database column)
    if (visa_issued_by !== undefined) updateData.issued_by = visa_issued_by;
    // Map visa_expiry_date -> expiry_date (database column)
    if (visa_expiry_date !== undefined) updateData.expiry_date = visa_expiry_date;
    updateData.updated_at = new Date().toISOString();

    // Use upsert to handle both create and update
    const { data, error } = await supabase
      .from('user_visa_info')
      .upsert(updateData, {
        onConflict: 'user_id',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (error) {
      console.error('Visa update error:', error);
      return NextResponse.json(
        errorResponse('Failed to update visa information', error.message),
        { status: 500 }
      );
    }

    // Map database columns back to frontend expected fields
    const mappedData = {
      ...data,
      visa_issued_by: data.issued_by,
      visa_expiry_date: data.expiry_date,
      nationality: null,
      passport_expiry_date: null
    };

    return NextResponse.json(
      successResponse(mappedData, 'Visa information updated successfully'),
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Visa update error:', error);
    return NextResponse.json(
      errorResponse('Internal server error', error.message),
      { status: 500 }
    );
  }
}
