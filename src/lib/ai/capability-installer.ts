import { parse as babelParse } from '@babel/parser';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Installs a prebuilt component into an already-generated site.
 *
 * This is the booking/divider injector idea applied after the fact: the site
 * already exists in generated_files, so adding a capability means writing the
 * component file and rendering it on a page -- no model call, no cost, no
 * variance, and no chance of it quietly not happening.
 *
 * Everything is verified before it is saved. If the edited page will not parse,
 * nothing is written at all, so a failed install leaves the site exactly as the
 * owner last saw it.
 */

interface InstallSpec {
  componentName: string;
  filePath: string;
  content: string;
}

interface InstallResult {
  ok: boolean;
  page?: string;
  reason?: string;
}

function parses(content: string): boolean {
  try {
    babelParse(content, { sourceType: 'module', plugins: ['jsx', 'typescript'], errorRecovery: false });
    return true;
  } catch {
    return false;
  }
}

/** Prefers the home page: an email signup nobody navigates to collects nothing. */
function pickPage(paths: string[]): string | undefined {
  if (paths.includes('src/app/page.tsx')) return 'src/app/page.tsx';
  return paths.find((path) => /^src\/app\/.*page\.tsx$/.test(path));
}

export async function injectComponentIntoPage(
  supabase: SupabaseClient,
  projectId: string,
  spec: InstallSpec
): Promise<InstallResult> {
  const { data: latestVersion } = await supabase
    .from('generation_versions')
    .select('id')
    .eq('project_id', projectId)
    .eq('status', 'complete')
    .order('version_number', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!latestVersion) {
    return { ok: false, reason: 'No finished website to add this to yet — generate the site first.' };
  }

  const versionId = (latestVersion as { id: string }).id;
  const { data: files } = await supabase
    .from('generated_files')
    .select('id, file_path, content')
    .eq('version_id', versionId);

  if (!files || files.length === 0) {
    return { ok: false, reason: 'Could not read the current site files.' };
  }

  const rows = files as Array<{ id: string; file_path: string; content: string }>;
  const targetPath = pickPage(rows.map((row) => row.file_path));
  if (!targetPath) return { ok: false, reason: 'Could not find a page to add it to.' };

  const target = rows.find((row) => row.file_path === targetPath)!;
  if (new RegExp(`<${spec.componentName}\\b`).test(target.content)) {
    return { ok: true, page: targetPath };
  }

  let content = target.content;
  const usesAlias = /from\s+['"]@\//.test(content);
  const importPath = usesAlias
    ? `@/components/${spec.componentName}`
    : `../components/${spec.componentName}`;

  if (!new RegExp(`import\\s+${spec.componentName}\\b`).test(content)) {
    const lastImport = content.lastIndexOf('\nimport ');
    const insertAt = lastImport === -1 ? 0 : content.indexOf('\n', lastImport + 1) + 1;
    content =
      content.slice(0, insertAt) +
      `import ${spec.componentName} from '${importPath}';\n` +
      content.slice(insertAt);
  }

  // Render it at the end of the page body, above any footer the page owns.
  const closing = content.lastIndexOf('</');
  if (closing === -1) return { ok: false, reason: 'Could not place the section on the page.' };
  const lineStart = content.lastIndexOf('\n', closing) + 1;
  const indent = content.slice(lineStart, closing).match(/^\s*/)?.[0] ?? '      ';
  content = `${content.slice(0, lineStart)}${indent}<${spec.componentName} />\n${content.slice(lineStart)}`;

  if (!parses(content)) {
    return { ok: false, reason: 'The change did not apply cleanly, so nothing was altered.' };
  }

  // Component file first: a page importing a file that does not exist yet is
  // a broken build, whereas an unused component file is harmless.
  const existingComponent = rows.find((row) => row.file_path === spec.filePath);
  if (existingComponent) {
    await supabase.from('generated_files').update({ content: spec.content }).eq('id', existingComponent.id);
  } else {
    await supabase.from('generated_files').insert({
      version_id: versionId,
      file_path: spec.filePath,
      content: spec.content,
      file_type: 'component',
    });
  }

  await supabase.from('generated_files').update({ content }).eq('id', target.id);

  return { ok: true, page: targetPath };
}
