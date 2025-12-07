import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

/**
 * File Upload API for Onboarding
 * Uploads vendor trade license files to Supabase Storage
 * Returns public URL for webhook submission
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type (PDF, JPG, PNG)
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid file type. Only PDF, JPG, and PNG are allowed.' 
        },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'File too large. Maximum size is 5MB.' 
        },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const fileName = `onboarding/${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    console.log(`[File Upload] Uploading file: ${fileName} (${file.size} bytes)`);

    // Convert File to ArrayBuffer for upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('onboarding-documents')
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('[File Upload] Supabase storage error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('onboarding-documents')
      .getPublicUrl(fileName);

    console.log(`[File Upload] File uploaded successfully: ${publicUrl}`);

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName: file.name,
      size: file.size,
      type: file.type
    });
  } catch (error) {
    console.error('[File Upload] Unexpected error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Upload failed' 
      },
      { status: 500 }
    );
  }
}
