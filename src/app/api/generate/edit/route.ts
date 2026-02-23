import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAnthropicClient, GENERATION_MODEL } from '@/lib/ai/client';
import { buildSystemPrompt } from '@/lib/ai/prompts/system-prompt';
import { parseDesignSystem } from '@/lib/ai/parsers';
import { extractCompletedBlocks } from '@/lib/ai/parsers';
import { createSSEStream } from '@/lib/ai/stream-handler';
import type { GenerationEvent, VirtualFile } from '@/types/generation';
import type { DesignSystem } from '@/types/project';

export const runtime = 'nodejs';
export const maxDuration = 120;

interface RequestBody {
    projectId: string;
    editInstructions: string;
    targetFiles: string[];
}

export async function POST(request: NextRequest) {
    const supabase = await createClient();

    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: RequestBody;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { projectId, editInstructions, targetFiles } = body;

    if (!projectId || !editInstructions) {
        return NextResponse.json(
            { error: 'Missing projectId or editInstructions' },
            { status: 400 }
        );
    }

    // Verify project ownership
    const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('id, user_id, generation_config')
        .eq('id', projectId)
        .single();

    if (projectError || !project) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (project.user_id !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check credits
    const { data: profile } = await supabase
        .from('profiles')
        .select('generation_credits, plan')
        .eq('id', user.id)
        .single();

    if (!profile || profile.plan === 'free' || profile.generation_credits <= 0) {
        return NextResponse.json(
            { error: 'no_credits' },
            { status: 402 }
        );
    }

    // Get the latest completed version
    const { data: latestVersion } = await supabase
        .from('generation_versions')
        .select('id, version_number')
        .eq('project_id', projectId)
        .eq('status', 'complete')
        .order('version_number', { ascending: false })
        .limit(1)
        .single();

    if (!latestVersion) {
        return NextResponse.json(
            { error: 'No existing website to edit. Generate one first.' },
            { status: 400 }
        );
    }

    // Fetch ALL existing files from the latest version
    const { data: existingFiles } = await supabase
        .from('generated_files')
        .select('file_path, content, file_type, section_type')
        .eq('version_id', latestVersion.id);

    if (!existingFiles || existingFiles.length === 0) {
        return NextResponse.json(
            { error: 'No files found in the latest version.' },
            { status: 400 }
        );
    }

    // Build a map of existing files
    const fileMap = new Map<string, { content: string; file_type: string; section_type: string | null }>();
    for (const f of existingFiles) {
        fileMap.set(f.file_path, {
            content: f.content,
            file_type: f.file_type,
            section_type: f.section_type,
        });
    }

    // Get the design system from existing files
    let designSystem: DesignSystem | null = null;
    const dsFile = fileMap.get('src/lib/design-system.json');
    if (dsFile) {
        try {
            designSystem = JSON.parse(dsFile.content);
        } catch {
            // ignore parse error
        }
    }

    // Identify files to edit - match target files against existing files
    const filesToEdit: Array<{ path: string; content: string }> = [];
    const requestedTargets = targetFiles && targetFiles.length > 0
        ? targetFiles
        : []; // If no target files specified, we'll figure it out from instructions

    if (requestedTargets.length > 0) {
        for (const target of requestedTargets) {
            const existing = fileMap.get(target);
            if (existing) {
                filesToEdit.push({ path: target, content: existing.content });
            } else {
                // File doesn't exist yet - it's a new file to create
                filesToEdit.push({ path: target, content: '// New file' });
            }
        }
    } else {
        // No target files specified - send all component files for the AI to decide
        for (const [path, data] of fileMap.entries()) {
            if (path.endsWith('.tsx') || path.endsWith('.ts') || path.endsWith('.css')) {
                filesToEdit.push({ path, content: data.content });
            }
        }
    }

    // Create a new version record
    const nextVersionNumber = latestVersion.version_number + 1;
    const { data: newVersion, error: versionError } = await supabase
        .from('generation_versions')
        .insert({
            project_id: projectId,
            version_number: nextVersionNumber,
            status: 'generating',
            trigger_type: 'edit',
            model_used: 'claude-sonnet-4-20250514',
            total_tokens_used: 0,
        })
        .select('id, version_number')
        .single();

    if (versionError || !newVersion) {
        return NextResponse.json(
            { error: 'Failed to create edit version' },
            { status: 500 }
        );
    }

    // Update project status
    await supabase
        .from('projects')
        .update({ status: 'generating' })
        .eq('id', projectId);

    const startTime = Date.now();

    // Build the edit pipeline as an async generator
    const editPipeline = async function* (): AsyncGenerator<GenerationEvent> {
        yield { type: 'stage-start', stage: 'config-assembly' };
        yield { type: 'stage-complete', stage: 'config-assembly' };

        // Skip design system generation - reuse existing
        yield { type: 'stage-start', stage: 'design-system' };
        yield { type: 'stage-complete', stage: 'design-system' };

        // Skip blueprint - we know which files to edit
        yield { type: 'stage-start', stage: 'blueprint' };
        yield { type: 'stage-complete', stage: 'blueprint' };

        // Component editing stage
        const totalFiles = filesToEdit.length;
        yield {
            type: 'stage-start',
            stage: 'components',
            totalFiles,
            completedFiles: 0,
        };

        try {
            const client = getAnthropicClient();

            // Build the edit prompt with current file contents
            const fileContents = filesToEdit
                .map((f) => '--- ' + f.path + ' ---\n' + f.content)
                .join('\n\n');

            const systemPrompt = designSystem
                ? buildSystemPrompt(designSystem)
                : 'You are an expert React, Next.js 14, TypeScript, and Tailwind CSS developer.';

            const editPrompt = 'EDIT REQUEST: ' + editInstructions + '\n\n' +
                'Here are the CURRENT files that need to be modified. ' +
                'Return ONLY the modified files as fenced code blocks with their file paths. ' +
                'Keep the same file paths. Only change what is requested - preserve everything else in each file exactly as-is.\n\n' +
                'CRITICAL RULES:\n' +
                '- Return COMPLETE file contents for each modified file (not just the changed parts)\n' +
                '- Use the exact same code block format: \x60\x60\x60tsx:filepath\n...code...\n\x60\x60\x60\n' +
                '- Preserve all imports, types, and unchanged code\n' +
                '- Only return files that actually change - skip unchanged files\n' +
                '- If adding a new section, also return the updated page.tsx that imports it\n\n' +
                'CURRENT FILES:\n\n' + fileContents;

            // Stream the edit response
            const stream = client.messages.stream({
                model: GENERATION_MODEL,
                max_tokens: 16000,
                system: systemPrompt,
                messages: [{ role: 'user', content: editPrompt }],
            });

            let buffer = '';
            let completedCount = 0;
            const editedFiles: Array<{ path: string; content: string; type: string }> = [];
            const seenFiles = new Set<string>();
            let currentComponent: string | null = null;

            for await (const event of stream) {
                if (
                    event.type === 'content_block_delta' &&
                    event.delta.type === 'text_delta'
                ) {
                    const chunk = event.delta.text;
                    buffer += chunk;

                    // Detect component start
                    const headerMatch = chunk.match(/\x60\x60\x60\w+:([^\n]+)/);
                    if (headerMatch) {
                        const filePath = headerMatch[1].trim().replace(/^\.\//, '');
                        const componentName = filePath.split('/').pop()?.replace(/\.[^.]+$/, '') || filePath;
                        if (componentName !== currentComponent) {
                            currentComponent = componentName;
                            yield {
                                type: 'component-start',
                                stage: 'components',
                                componentName: currentComponent,
                            };
                        }
                    }

                    // Stream chunks
                    if (currentComponent) {
                        yield {
                            type: 'component-chunk',
                            stage: 'components',
                            componentName: currentComponent,
                            chunk,
                        };
                    }

                    // Check for completed code blocks
                    const { blocks, remaining } = extractCompletedBlocks(buffer);
                    buffer = remaining;

                    for (const block of blocks) {
                        if (seenFiles.has(block.filePath)) continue;
                        seenFiles.add(block.filePath);
                        completedCount++;

                        const fileType = inferFileType(block.filePath);
                        editedFiles.push({
                            path: block.filePath,
                            content: block.content,
                            type: fileType,
                        });

                        const cName = block.filePath.split('/').pop()?.replace(/\.[^.]+$/, '') || block.filePath;
                        yield {
                            type: 'component-complete',
                            stage: 'components',
                            componentName: cName,
                            file: { path: block.filePath, content: block.content },
                            totalFiles: totalFiles,
                            completedFiles: completedCount,
                        };
                        currentComponent = null;
                    }
                }
            }

            // Process remaining buffer
            if (buffer.trim()) {
                const { blocks } = extractCompletedBlocks(buffer + '\n\x60\x60\x60');
                for (const block of blocks) {
                    if (seenFiles.has(block.filePath)) continue;
                    seenFiles.add(block.filePath);
                    completedCount++;
                    const fileType = inferFileType(block.filePath);
                    editedFiles.push({
                        path: block.filePath,
                        content: block.content,
                        type: fileType,
                    });
                    const cName = block.filePath.split('/').pop()?.replace(/\.[^.]+$/, '') || block.filePath;
                    yield {
                        type: 'component-complete',
                        stage: 'components',
                        componentName: cName,
                        file: { path: block.filePath, content: block.content },
                        totalFiles: totalFiles,
                        completedFiles: completedCount,
                    };
                }
            }

            yield {
                type: 'stage-complete',
                stage: 'components',
                totalFiles: completedCount,
                completedFiles: completedCount,
            };

            // Assembly stage - merge edited files with unchanged files
            yield { type: 'stage-start', stage: 'assembly' };

            // Build the final file set: start with ALL existing files, then overlay edits
            const finalFiles: Array<{ path: string; content: string; type: string; section_type: string | null }> = [];
            const editedPaths = new Set(editedFiles.map((f) => f.path));

            // Copy ALL unchanged files from the previous version
            for (const [path, data] of fileMap.entries()) {
                if (!editedPaths.has(path)) {
                    finalFiles.push({
                        path,
                        content: data.content,
                        type: data.file_type,
                        section_type: data.section_type,
                    });
                    yield {
                        type: 'component-complete',
                        stage: 'assembly',
                        componentName: path,
                        file: { path, content: data.content },
                    };
                }
            }

            // Add the edited files
            for (const ef of editedFiles) {
                finalFiles.push({
                    path: ef.path,
                    content: ef.content,
                    type: ef.type,
                    section_type: inferSectionType(ef.path),
                });
                yield {
                    type: 'component-complete',
                    stage: 'assembly',
                    componentName: ef.path + ' (edited)',
                    file: { path: ef.path, content: ef.content },
                };
            }

            yield { type: 'stage-complete', stage: 'assembly' };

            // Persist all files to the new version
            const elapsedMs = Date.now() - startTime;

            if (finalFiles.length > 0) {
                const fileRecords = finalFiles.map((f) => ({
                    project_id: projectId,
                    version_id: newVersion.id,
                    file_path: f.path,
                    content: f.content,
                    file_type: f.type,
                    section_type: f.section_type,
                }));
                await supabase.from('generated_files').insert(fileRecords);
            }

            // Update version status
            await supabase
                .from('generation_versions')
                .update({
                    status: 'complete',
                    generation_time_ms: elapsedMs,
                    completed_at: new Date().toISOString(),
                })
                .eq('id', newVersion.id);

            // Update project
            await supabase
                .from('projects')
                .update({
                    status: 'generated',
                    last_generated_at: new Date().toISOString(),
                })
                .eq('id', projectId);

            // Decrement credits
            const { data: currentProfile } = await supabase
                .from('profiles')
                .select('generation_credits')
                .eq('id', user.id)
                .single();

            if (currentProfile) {
                await supabase
                    .from('profiles')
                    .update({
                        generation_credits: Math.max(0, currentProfile.generation_credits - 1),
                    })
                    .eq('id', user.id);
            }

            yield {
                type: 'generation-complete',
                stage: 'complete',
                totalFiles: finalFiles.length,
            };

        } catch (err) {
            const elapsedMs = Date.now() - startTime;

            await supabase
                .from('generation_versions')
                .update({
                    status: 'error',
                    generation_time_ms: elapsedMs,
                    completed_at: new Date().toISOString(),
                })
                .eq('id', newVersion.id);

            await supabase
                .from('projects')
                .update({ status: 'error' })
                .eq('id', projectId);

            yield {
                type: 'error',
                stage: 'components',
                error: err instanceof Error ? err.message : 'Edit failed',
            };
        }
    };

    // Build SSE response stream
    const sseStream = createSSEStream(editPipeline());

    return new Response(sseStream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            Connection: 'keep-alive',
            'X-Accel-Buffering': 'no',
        },
    });
}

function inferFileType(filePath: string): string {
    if (filePath.includes('/app/') && filePath.endsWith('page.tsx')) return 'page';
    if (filePath.includes('/app/') && filePath.endsWith('layout.tsx')) return 'page';
    if (filePath.endsWith('.css')) return 'style';
    if (filePath.endsWith('.json')) return 'config';
    if (filePath.includes('/data/') || filePath.includes('/lib/')) return 'data';
    return 'component';
}

function inferSectionType(filePath: string): string | null {
    const sectionMap: Record<string, string> = {
        Hero: 'hero', Features: 'features', Pricing: 'pricing',
        Testimonials: 'testimonials', CallToAction: 'cta', CTA: 'cta',
        Contact: 'contact', About: 'about', Gallery: 'gallery',
        FAQ: 'faq', Stats: 'stats', Team: 'team',
        Footer: 'footer', Navbar: 'navbar',
    };
    for (const [component, section] of Object.entries(sectionMap)) {
        if (filePath.includes('/' + component + '.') || filePath.includes('/' + component + '/')) {
            return section;
        }
    }
    return null;
}
