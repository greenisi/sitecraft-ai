import { NextResponse } from 'next/server';
import { requireProjectOwner } from '@/lib/project-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateOpenAIImage, OpenAIConfigError } from '@/lib/ai/openai-image';

export const maxDuration = 120; // gpt-image-1 can take ~30-60s at high quality

// Generate an image with OpenAI and store it as a project asset.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const { error, user, supabase } = await requireProjectOwner(projectId);
    if (error) return error;

    // Media generation costs credits — same pool as site generation.
    const IMAGE_CREDIT_COST = 1;
    const { data: profile } = await supabase!
      .from('profiles')
      .select('generation_credits')
      .eq('id', user!.id)
      .single();
    if (!profile || profile.generation_credits < IMAGE_CREDIT_COST) {
      return NextResponse.json(
        { error: `Image generation costs ${IMAGE_CREDIT_COST} credit — you're out. Top up from Billing.` },
        { status: 402 }
      );
    }

    const body = await request.json();
    const prompt = (body.prompt || '').trim();
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const size =
      body.aspectRatio === '1:1' ? '1024x1024'
      : body.aspectRatio === '9:16' ? '1024x1536'
      : '1536x1024';

    const image = await generateOpenAIImage({
      prompt,
      size,
      quality: body.quality === 'low' || body.quality === 'medium' ? body.quality : 'high',
    });

    const buffer = Buffer.from(image.base64Data, 'base64');
    const fileName = `ai-image-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.png`;
    const storagePath = `${projectId}/media/${fileName}`;

    const admin = createAdminClient();
    const { error: uploadError } = await admin.storage
      .from('project-assets')
      .upload(storagePath, buffer, { contentType: image.mimeType, upsert: true });

    if (uploadError) {
      return NextResponse.json({ error: `Storage upload failed: ${uploadError.message}` }, { status: 500 });
    }

    const { data: { publicUrl } } = admin.storage.from('project-assets').getPublicUrl(storagePath);

    const { data: asset, error: insertError } = await admin
      .from('assets')
      .insert({
        project_id: projectId,
        file_name: fileName,
        file_type: 'ai_image',
        storage_path: storagePath,
        public_url: publicUrl,
        size_bytes: buffer.length,
      })
      .select('id, file_name, file_type, public_url, size_bytes, created_at')
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    await admin
      .from('profiles')
      .update({ generation_credits: Math.max(0, profile.generation_credits - IMAGE_CREDIT_COST) })
      .eq('id', user!.id);

    return NextResponse.json({ asset }, { status: 201 });
  } catch (err) {
    if (err instanceof OpenAIConfigError) {
      return NextResponse.json({ error: 'Image generation is not configured' }, { status: 503 });
    }
    const message = err instanceof Error ? err.message : 'Image generation failed';
    console.error('[Media] Image generation error:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
