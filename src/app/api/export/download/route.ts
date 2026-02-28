import { NextResponse } from 'next/server';
import { createRouteHandlerClient as createClient } from '@/lib/supabase/server';
import { VirtualFileTree } from '@/types/generation';
import { generateProjectZip } from '@/lib/export/zip-generator';
import { buildScaffoldingTree } from '@/lib/export/file-tree';
import { formatErrorResponse } from '@/lib/utils/errors';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: { message: 'Unauthorized', code: 'AUTH_ERROR' } }, { status: 401 });
    }

    const { projectId } = await request.json();

    // Fetch project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: { message: 'Project not found', code: 'NOT_FOUND' } }, { status: 404 });
    }

    // Get latest generation version
    const { data: version } = await supabase
      .from('generation_versions')
      .select('id')
      .eq('project_id', projectId)
      .eq('status', 'complete')
      .order('version_number', { ascending: false })
      .limit(1)
      .single();

    if (!version) {
      return NextResponse.json(
        { error: { message: 'No completed generation found', code: 'NOT_FOUND' } },
        { status: 404 }
      );
    }

    // Get generated files
    const { data: files, error: filesError } = await supabase
      .from('generated_files')
      .select('file_path, content, file_type')
      .eq('version_id', version.id);

    if (filesError || !files || files.length === 0) {
      return NextResponse.json(
        { error: { message: 'No generated files found', code: 'NOT_FOUND' } },
        { status: 404 }
      );
    }

    // Build the file tree: scaffolding + generated components
    const tree = buildScaffoldingTree(
      project.generation_config,
      project.design_system || {
        colors: { primary: {}, secondary: {}, accent: {}, neutral: {} },
        typography: { headingFont: 'Inter', bodyFont: 'Inter', scale: {} },
        spacing: {},
        borderRadius: {},
        shadows: {},
      }
    );

    // Add generated files
    for (const file of files) {
      tree.addFile(file.file_path, file.content, file.file_type);
    }

    // Generate ZIP
    const zipBlob = await generateProjectZip(tree, project.generation_config);
    const arrayBuffer = await zipBlob.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${project.slug || 'project'}.zip"`,
      },
    });
  } catch (error) {
    const { error: errBody, status } = formatErrorResponse(error);
    return NextResponse.json({ error: errBody }, { status });
  }
}
