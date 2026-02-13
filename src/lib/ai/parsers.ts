import type { DesignSystem, PageBlueprint } from '@/types/project';
import { designSystemSchema, pageBlueprintSchema } from './schema';
import type { ComponentOutput } from './schema';

// --------------------------------------------------------------------------
// Parse fenced code blocks with `language:filepath` headers
// --------------------------------------------------------------------------

/**
 * Regex that matches fenced code blocks of the form:
 *   ```language:path/to/file.ext
 *   ... content ...
 *   ```
 *
 * Captures:
 *   [1] language  (tsx, ts, css, json, etc.)
 *   [2] file path (src/components/Hero.tsx)
 *   [3] content   (everything between the fences)
 */
const CODE_BLOCK_REGEX = /```(\w+):([^\n]+)\n([\s\S]*?)```/g;

/**
 * Extracts all file blocks from Claude's raw text output.
 * Returns an array of { filePath, content, language } objects.
 */
export function parseComponentOutput(raw: string): ComponentOutput[] {
  const results: ComponentOutput[] = [];
  let match: RegExpExecArray | null;

  // Reset lastIndex for safety
  CODE_BLOCK_REGEX.lastIndex = 0;

  while ((match = CODE_BLOCK_REGEX.exec(raw)) !== null) {
    const language = match[1].trim();
    let filePath = match[2].trim();
    const content = match[3];

    // Normalise path: strip leading "./"
    if (filePath.startsWith('./')) {
      filePath = filePath.slice(2);
    }

    // Skip empty blocks
    if (!content.trim()) {
      continue;
    }

    results.push({ filePath, content: content.trimEnd(), language });
  }

  return results;
}

/**
 * Incrementally accumulates streamed text and extracts completed code blocks.
 * Returns the extracted blocks and the remaining unprocessed buffer.
 *
 * This is useful for streaming: feed chunks in, get completed files out.
 */
export function extractCompletedBlocks(buffer: string): {
  blocks: ComponentOutput[];
  remaining: string;
} {
  const blocks: ComponentOutput[] = [];
  let remaining = buffer;

  // We look for complete code blocks only (opening ``` ... closing ```)
  const completeBlockRegex = /```(\w+):([^\n]+)\n([\s\S]*?)```/g;
  let lastEnd = 0;
  let match: RegExpExecArray | null;

  completeBlockRegex.lastIndex = 0;

  while ((match = completeBlockRegex.exec(remaining)) !== null) {
    const language = match[1].trim();
    let filePath = match[2].trim();
    const content = match[3];

    if (filePath.startsWith('./')) {
      filePath = filePath.slice(2);
    }

    if (content.trim()) {
      blocks.push({ filePath, content: content.trimEnd(), language });
    }

    lastEnd = completeBlockRegex.lastIndex;
  }

  // Keep only the unprocessed tail (potentially an incomplete block)
  if (lastEnd > 0) {
    remaining = remaining.slice(lastEnd);
  }

  return { blocks, remaining };
}

// --------------------------------------------------------------------------
// Parse JSON Design System from Claude's output
// --------------------------------------------------------------------------

/**
 * Parses and validates a DesignSystem JSON object from Claude's raw response.
 * The response may contain the JSON inside a fenced code block or bare.
 */
export function parseDesignSystem(raw: string): DesignSystem {
  const jsonStr = extractJsonFromResponse(raw);

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch (err) {
    throw new Error(
      `Failed to parse design system JSON: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  const result = designSystemSchema.safeParse(parsed);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Design system validation failed:\n${issues}`);
  }

  return result.data;
}

// --------------------------------------------------------------------------
// Parse JSON Blueprint from Claude's output
// --------------------------------------------------------------------------

/**
 * Parses and validates a PageBlueprint JSON object from Claude's raw response.
 */
export function parseBlueprint(raw: string): PageBlueprint {
  const jsonStr = extractJsonFromResponse(raw);

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch (err) {
    throw new Error(
      `Failed to parse blueprint JSON: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  const result = pageBlueprintSchema.safeParse(parsed);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Blueprint validation failed:\n${issues}`);
  }

  return result.data;
}

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

/**
 * Extracts a JSON string from Claude's response.
 * Handles cases where JSON is wrapped in a fenced code block (```json ... ```)
 * or returned bare.
 */
function extractJsonFromResponse(raw: string): string {
  // Try to extract from a fenced json block first
  const jsonBlockMatch = raw.match(/```(?:json)?\s*\n([\s\S]*?)```/);
  if (jsonBlockMatch) {
    return jsonBlockMatch[1].trim();
  }

  // Try to find raw JSON object
  const firstBrace = raw.indexOf('{');
  const lastBrace = raw.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return raw.slice(firstBrace, lastBrace + 1);
  }

  // Return the whole thing and let JSON.parse handle the error
  return raw.trim();
}
