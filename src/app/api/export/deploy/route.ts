import { NextResponse } from 'next/server';
import { createRouteHandlerClient as createClient } from '@/lib/supabase/server';
import { VirtualFileTree } from '@/types/generation';
import { deployToVercel } from '@/lib/export/vercel-deployer';
import { buildScaffoldingTree } from '@/lib/export/file-tree';
import { formatErrorResponse } from '@/lib/utils/errors';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: { message: 'Unauthorized', code: 'AUTH_ERROR' } },
        { status: 401 }
      );
    }

    const { projectId, vercelToken, projectName, teamId } = await request.json();

    if (!vercelToken || !projectName) {
      return NextResponse.json(
        { error: { message: 'Vercel token and project name are required', code: 'VALIDATION_ERROR' } },
        { status: 400 }
      );
    }

    // Fetch project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: { message: 'Project not found', code: 'NOT_FOUND' } },
        { status: 404 }
      );
    }

    // Get latest completed generation version
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
    const { data: files } = await supabase
      .from('generated_files')
      .select('file_path, content, file_type')
      .eq('version_id', version.id);

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: { message: 'No generated files found', code: 'NOT_FOUND' } },
        { status: 404 }
      );
    }

    // Build file tree
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

    for (const file of files) {
      tree.addFile(file.file_path, file.content, file.file_type);
    }

    // Deploy to Vercel
    const deployment = await deployToVercel(tree, {
      vercelToken,
      projectName,
      teamId,
    });

    // Update project with deployment info
    await supabase
      .from('projects')
      .update({
        status: 'deployed',
        vercel_project_id: deployment.deploymentId,
        vercel_deployment_url: deployment.url,
      })
      .eq('id', projectId);

    return NextResponse.json({ data: deployment });
  } catch (error) {
    const { error: errBody, status } = formatErrorResponse(error);
    return NextResponse.json({ error: errBody }, { status });
  }
}
