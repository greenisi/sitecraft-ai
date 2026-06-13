import { NextResponse } from 'next/server';
import { requireProjectOwner } from '@/lib/project-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { startVideoGeneration, checkVideoOperation } from '@/lib/ai/video-gen';

export const maxDuration = 120; // GET downloads the finished video (can be 10-20MB)

// Start a Veo video generation. Returns an operation name for the client to poll.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const { error, user, supabase } = await requireProjectOwner(projectId);
    if (error) return error;

    // Video is the most expensive thing the platform generates — paid plans
    // only, and 10 credits per clip. Charged up front when the job starts.
    const VIDEO_CREDIT_COST = 10;
    const { data: profile } = await supabase!
      .from('profiles')
      .select('generation_credits, plan')
      .eq('id', user!.id)
      .single();
    if (!profile || profile.plan === 'free') {
      return NextResponse.json(
        { error: 'subscription_required', message: 'Video generation is a Pro feature. Upgrade to generate videos.' },
        { status: 402 }
      );
    }
    if (profile.generation_credits < VIDEO_CREDIT_COST) {
      return NextResponse.json(
        { error: `Video generation costs ${VIDEO_CREDIT_COST} credits — you have ${profile.generation_credits}. Top up from Billing.` },
        { status: 402 }
      );
    }

    const body = await request.json();
    const prompt = (body.prompt || '').trim();
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const operationName = await startVideoGeneration({
      prompt,
      aspectRatio: body.aspectRatio === '9:16' ? '9:16' : '16:9',
    });

    const admin = createAdminClient();
    await admin.rpc('deduct_generation_credits', { p_user_id: user!.id, p_amount: VIDEO_CREDIT_COST });

    return NextResponse.json({ operationName }, { status: 202 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Video generation failed to start';
    console.error('[Media] Video start error:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Poll a Veo operation. When done, store the video as a project asset.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const { error } = await requireProjectOwner(projectId);
    if (error) return error;

    const operationName = new URL(request.url).searchParams.get('op');
    if (!operationName) {
      return NextResponse.json({ error: 'Missing op parameter' }, { status: 400 });
    }

    const status = await checkVideoOperation(operationName);

    if (!status.done) {
      return NextResponse.json({ done: false });
    }
    if (status.error !== null) {
      return NextResponse.json({ done: true, error: status.error });
    }

    const fileName = `ai-video-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.mp4`;
    const storagePath = `${projectId}/media/${fileName}`;

    const admin = createAdminClient();
    const { error: uploadError } = await admin.storage
      .from('project-assets')
      .upload(storagePath, status.videoBytes, { contentType: status.mimeType, upsert: true });

    if (uploadError) {
      return NextResponse.json({ error: `Storage upload failed: ${uploadError.message}` }, { status: 500 });
    }

    const { data: { publicUrl } } = admin.storage.from('project-assets').getPublicUrl(storagePath);

    const { data: asset, error: insertError } = await admin
      .from('assets')
      .insert({
        project_id: projectId,
        file_name: fileName,
        file_type: 'ai_video',
        storage_path: storagePath,
        public_url: publicUrl,
        size_bytes: status.videoBytes.length,
      })
      .select('id, file_name, file_type, public_url, size_bytes, created_at')
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ done: true, asset });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Video poll failed';
    console.error('[Media] Video poll error:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
