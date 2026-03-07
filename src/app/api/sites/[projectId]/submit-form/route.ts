import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const MAX_IMAGES = 3;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

async function uploadImage(
  supabase: ReturnType<typeof createClient>,
  file: File,
  userId: string,
  projectId: string
): Promise<string | null> {
  if (!file.type.startsWith('image/')) return null;
  if (file.size > MAX_IMAGE_SIZE) return null;

  const ext = file.name.split('.').pop() || 'png';
  const fileName = `submission-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const storagePath = `${userId}/${projectId}/submissions/${fileName}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);

  const { error } = await supabase.storage
    .from('project-assets')
    .upload(storagePath, buffer, { contentType: file.type, upsert: true });

  if (error) {
    console.error('Image upload error:', error);
    return null;
  }

  const { data: { publicUrl } } = supabase.storage.from('project-assets').getPublicUrl(storagePath);
  return publicUrl;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify project exists and get owner info
    const { data: project } = await supabase
      .from('projects')
      .select('id, user_id')
      .eq('id', projectId)
      .single();

    if (!project) {
      return NextResponse.json({ error: 'Invalid project' }, { status: 404, headers: CORS_HEADERS });
    }

    // Parse body — support both JSON and FormData
    let name: string | null = null;
    let email: string | null = null;
    let phone: string | null = null;
    let message: string | null = null;
    let service_needed: string | null = null;
    let preferred_date: string | null = null;
    let form_type = 'contact';
    let source_page: string | null = null;
    let extraFields: Record<string, any> = {};
    let imageFiles: File[] = [];

    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      name = formData.get('name') as string | null;
      email = formData.get('email') as string | null;
      phone = formData.get('phone') as string | null;
      message = formData.get('message') as string | null;
      service_needed = formData.get('service_needed') as string | null;
      preferred_date = formData.get('preferred_date') as string | null;
      form_type = (formData.get('form_type') as string) || 'contact';
      source_page = formData.get('source_page') as string | null;

      // Collect image files
      const images = formData.getAll('images');
      for (const img of images) {
        if (img instanceof File && img.size > 0) {
          imageFiles.push(img);
        }
      }
      // Also check singular 'image' field
      const singleImage = formData.get('image');
      if (singleImage instanceof File && singleImage.size > 0) {
        imageFiles.push(singleImage);
      }
      imageFiles = imageFiles.slice(0, MAX_IMAGES);

      // Collect extra string fields
      const knownKeys = new Set(['name', 'email', 'phone', 'message', 'service_needed', 'preferred_date', 'form_type', 'source_page', 'images', 'image']);
      for (const [key, value] of formData.entries()) {
        if (!knownKeys.has(key) && typeof value === 'string') {
          extraFields[key] = value;
        }
      }
    } else {
      // JSON body (backward compatible)
      const body = await request.json();
      name = body.name || null;
      email = body.email || null;
      phone = body.phone || null;
      message = body.message || null;
      service_needed = body.service_needed || null;
      preferred_date = body.preferred_date || null;
      form_type = body.form_type || 'contact';
      source_page = body.source_page || null;

      const { name: _, email: _e, phone: _p, message: _m, service_needed: _s, preferred_date: _pd, form_type: _ft, source_page: _sp, ...rest } = body;
      extraFields = rest;
    }

    // Basic validation
    if (!name && !email && !phone) {
      return NextResponse.json(
        { error: 'At least one of name, email, or phone is required' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // Upload images if any
    const uploadedImageUrls: string[] = [];
    for (const file of imageFiles) {
      const url = await uploadImage(supabase, file, project.user_id, projectId);
      if (url) uploadedImageUrls.push(url);
    }

    // Build form_data with extra fields and image URLs
    const formDataJson: Record<string, any> = { ...extraFields };
    if (uploadedImageUrls.length > 0) {
      formDataJson.uploaded_images = uploadedImageUrls;
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';

    // Insert submission
    const { data: submission, error } = await supabase
      .from('form_submissions')
      .insert({
        project_id: projectId,
        form_type,
        name: name || null,
        email: email || null,
        phone: phone || null,
        message: message || null,
        service_needed: service_needed || null,
        preferred_date: preferred_date || null,
        form_data: Object.keys(formDataJson).length > 0 ? formDataJson : {},
        source_page: source_page || null,
        ip_address: ip,
        status: 'new',
      })
      .select('id, created_at')
      .single();

    if (error) {
      console.error('Form submission error:', error);
      return NextResponse.json({ error: 'Failed to submit form' }, { status: 500, headers: CORS_HEADERS });
    }

    // Create notification for project owner
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', project.user_id)
        .single();

      if (profile) {
        const submitterName = name || email || 'Someone';
        const hasImages = uploadedImageUrls.length > 0;
        await supabase.from('notifications').insert({
          project_id: projectId,
          type: 'new_lead',
          recipient_email: email || '',
          subject: `New ${form_type} submission from ${submitterName}${hasImages ? ` (${uploadedImageUrls.length} image${uploadedImageUrls.length > 1 ? 's' : ''})` : ''}`,
          body: [
            name && `Name: ${name}`,
            email && `Email: ${email}`,
            phone && `Phone: ${phone}`,
            message && `Message: ${message}`,
            service_needed && `Service: ${service_needed}`,
            hasImages && `Images: ${uploadedImageUrls.length} attached`,
          ].filter(Boolean).join('\n'),
          status: 'pending',
        });
      }
    } catch (notifErr) {
      console.error('Notification creation error:', notifErr);
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Form submitted successfully',
        id: submission.id,
        timestamp: submission.created_at,
        images: uploadedImageUrls.length,
      },
      { status: 201, headers: CORS_HEADERS }
    );
  } catch (err) {
    console.error('Form submission error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: CORS_HEADERS });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}
