import type { PendingChange } from '@/stores/visual-editor-store';

interface FileRecord {
  file_path: string;
  content: string;
}

/**
 * Apply accumulated visual editor changes to the source files.
 *
 * Strategy:
 * - Text changes: find the exact old text in .tsx files and replace with new text.
 * - Style changes: group by cssPath, then find the element in TSX by matching
 *   text content, and inject/merge a style={{...}} attribute.
 *
 * Returns a new array of modified file records.
 */
export function applyVisualEdits(
  files: FileRecord[],
  changes: PendingChange[]
): FileRecord[] {
  // Deep clone
  const result = files.map((f) => ({ ...f, content: f.content }));

  // Separate text and style changes
  const textChanges = changes.filter((c) => c.type === 'text');
  const styleChanges = changes.filter((c) => c.type === 'style');

  // Apply text changes
  for (const change of textChanges) {
    if (!change.oldText || !change.newText) continue;
    if (change.oldText === change.newText) continue;

    // Search all TSX files for the old text
    let applied = false;
    for (const file of result) {
      if (!file.file_path.endsWith('.tsx')) continue;

      // Try exact match first
      if (file.content.includes(change.oldText)) {
        // Replace only the first occurrence
        file.content = file.content.replace(change.oldText, change.newText);
        applied = true;
        break;
      }
    }

    // If exact match failed, try trimmed match
    if (!applied) {
      const trimmedOld = change.oldText.trim();
      for (const file of result) {
        if (!file.file_path.endsWith('.tsx')) continue;
        if (file.content.includes(trimmedOld)) {
          file.content = file.content.replace(trimmedOld, change.newText.trim());
          break;
        }
      }
    }
  }

  // Group style changes by cssPath
  const stylesByElement = new Map<string, Map<string, string>>();
  for (const change of styleChanges) {
    if (!change.property || change.newValue === undefined) continue;
    if (!stylesByElement.has(change.cssPath)) {
      stylesByElement.set(change.cssPath, new Map());
    }
    stylesByElement.get(change.cssPath)!.set(change.property, change.newValue);
  }

  // For each element with style changes, try to find & modify the TSX
  for (const [, styles] of stylesByElement) {
    // Build the style object string
    const styleEntries: string[] = [];
    for (const [prop, val] of styles) {
      // Convert camelCase to the format React expects (already camelCase)
      styleEntries.push(`${prop}: '${val}'`);
    }

    if (styleEntries.length === 0) continue;

    const styleObjStr = `{ ${styleEntries.join(', ')} }`;

    // We need to find the right element in the TSX.
    // For now, we'll look for text-change-associated elements
    // or attempt to match based on text content from earlier text changes.
    // This is the pragmatic approach — find elements that have associated text.

    // For style-only changes, we'll create a simple wrapper approach:
    // append a CSS override block to globals.css instead of modifying TSX.
    // This is much more reliable than trying to parse TSX AST.

    // This will be handled below in the CSS approach.
  }

  // For style changes that couldn't be applied directly,
  // append CSS overrides to globals.css
  if (stylesByElement.size > 0) {
    const globalsCssFile = result.find(
      (f) => f.file_path === 'src/app/globals.css'
    );

    if (globalsCssFile) {
      let cssOverrides = '\n\n/* Visual Editor Overrides */\n';
      let overrideIndex = 0;

      for (const [cssPath, styles] of stylesByElement) {
        overrideIndex++;
        const cssProperties: string[] = [];

        for (const [prop, val] of styles) {
          // Convert camelCase to kebab-case
          const kebab = prop.replace(
            /[A-Z]/g,
            (m) => '-' + m.toLowerCase()
          );
          cssProperties.push(`  ${kebab}: ${val} !important;`);
        }

        if (cssProperties.length > 0) {
          // Convert CSS path to a CSS selector
          // The cssPath from the bridge uses nth-of-type which works directly
          const selector = cssPath;
          cssOverrides += `${selector} {\n${cssProperties.join('\n')}\n}\n`;
        }
      }

      globalsCssFile.content += cssOverrides;
    }
  }

  return result;
}
