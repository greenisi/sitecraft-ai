import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { runGenerationPipeline } from '@/lib/ai/pipeline';
import { createSSEStream } from '@/lib/ai/stream-handler';
import type { GenerationConfig } from '@/types/project';
import type { GenerationEvent, VirtualFile } from '@/types/generation';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes — Vercel Pro tier limit

interface RequestBody {
    projectId: string;
    config: GenerationConfig;
}

export async function POST(request: NextRequest) {
    // ── Auth ──────────────────────────────────────────────────────────────
  const supabase = await createClient();
    const {
          data: { user },
          error: authError,
    } = await supabase.auth.getUser();

  if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ── Parse request body ────────────────────────────────────────────────
  let body: RequestBody;
    try {
          body = await request.json();
    } catch {
          return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

  const { projectId, config } = body;

  if (!projectId || !config) {
        return NextResponse.json(
          { error: 'Missing projectId or config' },
          { status: 400 }
              );
  }

  // ── Verify project ownership ──────────────────────────────────────────
  const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, user_id, status')
      .eq('id', projectId)
      .single();

  if (projectError || !project) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  if (project.user_id !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // ── Check subscription plan ─────────────────────────────────────────
  const { data: profile } = await supabase
      .from('profiles')
      .select('generation_credits, plan')
      .eq('id', user.id)
      .single();

  if (!profile) {
        return NextResponse.json(
          { error: 'Profile not found' },
          { status: 404 }
              );
  }

  if (profile.plan === 'free') {
        return NextResponse.json(
          { error: 'subscription_required', message: 'Please subscribe to the Beta plan to generate websites.' },
          { status: 402 }
              );
  }

  // ── Check generation credits ──────────────────────────────────────────
  if (profile.generation_credits <= 0) {
        return NextResponse.json(
          { error: 'No generation credits remaining' },
          { status: 402 }
              );
  }

  // ── Create generation version record ──────────────────────────────────
  // Compute next version number for this project
  const { data: latestVersion } = await supabase
      .from('generation_versions')
      .select('version_number')
      .eq('project_id', projectId)
      .order('version_number', { ascending: false })
      .limit(1)
      .maybeSingle();

  const nextVersionNumber = (latestVersion?.version_number ?? 0) + 1;

  const { data: version, error: versionError } = await supabase
      .from('generation_versions')
      .insert({
              project_id: projectId,
              version_number: nextVersionNumber,
              status: 'generating',
              trigger_type: project.status === 'draft' ? 'initial' : 'full-regenerate',
              model_used: 'claude-sonnet-4-20250514',
              total_tokens_used: 0,
      })
      .select('id, version_number')
      .single();

  if (versionError || !version) {
        return NextResponse.json(
          { error: 'Failed to create generation version' },
          { status: 500 }
              );
  }

  // ── Update project status ─────────────────────────────────────────────
  await supabase
      .from('projects')
      .update({ status: 'generating' })
      .eq('id', projectId);

  // ── Run pipeline and stream results ───────────────────────────────────
  const startTime = Date.now();
    const collectedFiles: Array<{ path: string; content: string; type: VirtualFile['type'] }> = [];

  const pipelineWithPersistence = async function* (): AsyncGenerator<GenerationEvent> {
        let hasError = false;

        try {
                for await (const event of runGenerationPipeline(config)) {
                          // Collect files as they complete
                  if (event.type === 'component-complete' && event.file) {
                              collectedFiles.push({
                                            path: event.file.path,
                                            content: event.file.content,
                                            type: inferFileType(event.file.path),
                              });
                  }

                  if (event.type === 'error') {
                              hasError = true;
                  }

                  yield event;
                }
        } catch (err) {
                hasError = true;
                yield {
                          type: 'error' as const,
                          stage: 'error' as const,
                          error: err instanceof Error ? err.message : 'Pipeline failed unexpectedly',
                };
        }

        // ── Persist results after pipeline completes ────────────────────────
        const elapsedMs = Date.now() - startTime;

        if (hasError) {
                // Mark version as errored
          await supabase
                  .from('generation_versions')
                  .update({
                              status: 'error',
                              generation_time_ms: elapsedMs,
                              completed_at: new Date().toISOString(),
                  })
                  .eq('id', version.id);

          await supabase
                  .from('projects')
                  .update({ status: 'error' })
                  .eq('id', projectId);
        } else {
                // Store generated files
          if (collectedFiles.length > 0) {
                    const fileRecords = collectedFiles.map((f) => ({
                                project_id: projectId,
                                version_id: version.id,
                                file_path: f.path,
                                content: f.content,
                                file_type: f.type,
                                section_type: inferSectionType(f.path),
                    }));

                  await supabase.from('generated_files').insert(fileRecords);
          }

          // Update generation version
          await supabase
                  .from('generation_versions')
                  .update({
                              status: 'complete',
                              generation_time_ms: elapsedMs,
                              completed_at: new Date().toISOString(),
                  })
                  .eq('id', version.id);

          // Update project
          await supabase
                  .from('projects')
                  .update({
                              status: 'generated',
                              generation_config: config,
                              last_generated_at: new Date().toISOString(),
                  })
                  .eq('id', projectId);

          // Decrement generation credits
          await supabase
                  .from('profiles')
                  .update({ generation_credits: profile.generation_credits - 1 })
                  .eq('id', user.id);
        }
  };

  // Build SSE response stream
  const sseStream = createSSEStream(pipelineWithPersistence());

  return new Response(sseStream, {
        headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache, no-transform',
                Connection: 'keep-alive',
                'X-Accel-Buffering': 'no', // Disable nginx buffering
        },
  });
}

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

function inferFileType(filePath: string): VirtualFile['type'] {
    if (filePath.includes('/app/') && filePath.endsWith('page.tsx')) return 'page';
    if (filePath.includes('/app/') && filePath.endsWith('layout.tsx')) return 'page';
    if (filePath.endsWith('.css')) return 'style';
    if (filePath.endsWith('.json')) return 'config';
    if (filePath.includes('/data/') || filePath.includes('/lib/')) return 'data';
    return 'component';
}

function inferSectionType(filePath: string): string | null {
    const sectionMap: Record<string, string> = {
          Hero: 'hero',
          Features: 'features',
          Pricing: 'pricing',
          Testimonials: 'testimonials',
          CallToAction: 'cta',
          CTA: 'cta',
          Contact: 'contact',
          About: 'about',
          Gallery: 'gallery',
          FAQ: 'faq',
          Stats: 'stats',
          Team: 'team',
          Footer: 'footer',
          Navbar: 'navbar',
    };

  for (const [component, section] of Object.entries(sectionMap)) {
        if (filePath.includes(`/${component}.`) || filePath.includes(`/${component}/`)) {
                return section;
        }
  }

  return null;
}
