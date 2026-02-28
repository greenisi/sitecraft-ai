import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient as createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { applyVisualEdits } from '@/lib/visual-editor/apply-edits';
import type { PendingChange } from '@/stores/visual-editor-store';

export const runtime = 'nodejs';

interface RequestBody {
  projectId: string;
  changes: PendingChange[];
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

  // ── Parse body ────────────────────────────────────────────────────────
  let body: RequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { projectId, changes } = body;
  if (!projectId || !changes || changes.length === 0) {
    return NextResponse.json(
      { error: 'Missing projectId or changes' },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // ── Verify project ownership ──────────────────────────────────────────
  const { data: project } = await admin
    .from('projects')
    .select('id, user_id, status')
    .eq('id', projectId)
    .single();

  if (!project || project.user_id !== user.id) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  // ── Get latest completed version ─────────────────────────────────────
  const { data: latestVersion } = await admin
    .from('generation_versions')
    .select('id, version_number')
    .eq('project_id', projectId)
    .eq('status', 'complete')
    .order('version_number', { ascending: false })
    .limit(1)
    .single();

  if (!latestVersion) {
    return NextResponse.json(
      { error: 'No completed version found' },
      { status: 400 }
    );
  }

  // ── Get all files for this version ───────────────────────────────────
  const { data: files } = await admin
    .from('generated_files')
    .select('file_path, content, file_type, section_type')
    .eq('version_id', latestVersion.id)
    .order('file_path');

  if (!files || files.length === 0) {
    return NextResponse.json({ error: 'No files found' }, { status: 400 });
  }

  // ── Apply visual edits ───────────────────────────────────────────────
  const modifiedFiles = applyVisualEdits(
    files.map((f) => ({ file_path: f.file_path, content: f.content })),
    changes
  );

  // ── Create new version ───────────────────────────────────────────────
  const newVersionNumber = latestVersion.version_number + 1;

  const { data: newVersion, error: versionError } = await admin
    .from('generation_versions')
    .insert({
      project_id: projectId,
      version_number: newVersionNumber,
      status: 'complete',
      trigger_type: 'section-edit',
      model_used: 'visual-editor',
      total_tokens_used: 0,
      generation_time_ms: 0,
      completed_at: new Date().toISOString(),
    })
    .select('id, version_number')
    .single();

  if (versionError || !newVersion) {
    return NextResponse.json(
      { error: 'Failed to create version' },
      { status: 500 }
    );
  }

  // ── Insert modified files ────────────────────────────────────────────
  const fileRecords = modifiedFiles.map((f) => {
    // Find original file metadata
    const original = files.find((o) => o.file_path === f.file_path);
    return {
      project_id: projectId,
      version_id: newVersion.id,
      file_path: f.file_path,
      content: f.content,
      file_type: original?.file_type || 'component',
      section_type: original?.section_type || null,
    };
  });

  const { error: insertError } = await admin
    .from('generated_files')
    .insert(fileRecords);

  if (insertError) {
    // Rollback the version
    await admin
      .from('generation_versions')
      .delete()
      .eq('id', newVersion.id);

    return NextResponse.json(
      { error: 'Failed to save files' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    versionId: newVersion.id,
    versionNumber: newVersion.version_number,
    changesApplied: changes.length,
  });
}
