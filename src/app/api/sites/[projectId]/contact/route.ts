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
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

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
  try {
    const { projectId } = await params;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify project exists
    const { data: project } = await supabase
      .from('projects')
      .select('id, user_id')
      .eq('id', projectId)
      .single();

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404, headers: CORS_HEADERS });
    }

    // Parse body — support both JSON and FormData
    let name: string | null = null;
    let email: string | null = null;
    let phone: string | null = null;
    let message: string | null = null;
    let imageFiles: File[] = [];

    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      name = formData.get('name') as string | null;
      email = formData.get('email') as string | null;
      phone = formData.get('phone') as string | null;
      message = formData.get('message') as string | null;

      const images = formData.getAll('images');
      for (const img of images) {
        if (img instanceof File && img.size > 0) imageFiles.push(img);
      }
      const singleImage = formData.get('image');
      if (singleImage instanceof File && singleImage.size > 0) imageFiles.push(singleImage);
      imageFiles = imageFiles.slice(0, MAX_IMAGES);
    } else {
      const body = await request.json();
      name = body.name || null;
      email = body.email || null;
      phone = body.phone || null;
      message = body.message || null;
    }

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400, headers: CORS_HEADERS });
    }

    // Upload images if any
    const uploadedImageUrls: string[] = [];
    for (const file of imageFiles) {
      const url = await uploadImage(supabase, file, project.user_id, projectId);
      if (url) uploadedImageUrls.push(url);
    }

    const formDataJson: Record<string, any> = {};
    if (uploadedImageUrls.length > 0) {
      formDataJson.uploaded_images = uploadedImageUrls;
    }

    // Write to form_submissions (unified table)
    const { data: submission, error: insertError } = await supabase
      .from('form_submissions')
      .insert({
        project_id: projectId,
        form_type: 'contact',
        name,
        email,
        phone: phone || null,
        message: message || null,
        form_data: Object.keys(formDataJson).length > 0 ? formDataJson : {},
        source_page: 'contact',
        ip_address: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown',
        status: 'new',
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500, headers: CORS_HEADERS });
    }

    // Create notification for new lead
    const hasImages = uploadedImageUrls.length > 0;
    await supabase.from('notifications').insert({
      project_id: projectId,
      type: 'new_lead',
      recipient_email: email,
      subject: `New contact form submission from ${name}${hasImages ? ` (${uploadedImageUrls.length} image${uploadedImageUrls.length > 1 ? 's' : ''})` : ''}`,
      body: `Name: ${name}\nEmail: ${email}\nPhone: ${phone || 'N/A'}\nMessage: ${message || 'N/A'}${hasImages ? `\nImages: ${uploadedImageUrls.length} attached` : ''}`,
      status: 'pending',
    });

    return NextResponse.json({ success: true, submission }, { status: 201, headers: CORS_HEADERS });
  } catch {
    return NextResponse.json({ error: 'Failed to submit contact form' }, { status: 500, headers: CORS_HEADERS });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}
