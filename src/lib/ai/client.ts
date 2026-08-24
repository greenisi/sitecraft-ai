import Anthropic from '@anthropic-ai/sdk';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { ModelConfig } from './models';

let client: Anthropic | null = null;

/**
 * Returns a singleton client for OpenRouter's Anthropic-compatible Messages API.
 * Only usable on the server side -- will throw if OPENROUTER_API_KEY is missing.
 */
export function getAnthropicClient(): Anthropic {
  if (typeof window !== 'undefined') {
    throw new Error(
      'Anthropic client must only be used on the server side. ' +
      'Do not import this module in client components.'
    );
  }

  if (!client) {
    let apiKey = process.env.OPENROUTER_API_KEY;

    // If the system env has an empty string, try loading from .env.local directly
    if (!apiKey) {
      try {
        const envPath = resolve(process.cwd(), '.env.local');
        const envContent = readFileSync(envPath, 'utf8');
        const match = envContent.match(/^OPENROUTER_API_KEY=(.+)$/m);
        if (match) {
          apiKey = match[1].trim();
        }
      } catch {
        // Ignore file read errors
      }
    }

    if (!apiKey) {
      throw new Error(
        'OPENROUTER_API_KEY environment variable is not set. ' +
        'Please add it to your .env.local file.'
      );
    }

    client = new Anthropic({
      apiKey,
      baseURL: 'https://openrouter.ai/api',
      defaultHeaders: {
        'HTTP-Referer': 'https://app.innovated.marketing',
        'X-Title': 'SiteCraft AI',
      },
    });
  }

  return client;
}

/**
 * Default model identifier (used when no tier is specified).
 * All SiteCraft generations use Kimi K3 through OpenRouter.
 */
export const GENERATION_MODEL = 'moonshotai/kimi-k3';

/**
 * Makes a chat completion request to OpenRouter (for free-tier models).
 */
export async function callOpenRouter(
  modelId: string,
  messages: Array<{ role: string; content: string }>,
  maxTokens: number = 64000,
  options: {
    reasoningEffort?: ModelConfig['reasoningEffort'];
    jsonOutput?: boolean;
  } = {},
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY environment variable is not set.');
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://app.innovated.marketing',
      'X-Title': 'SiteCraft AI',
    },
    body: JSON.stringify({
      model: modelId,
      messages,
      max_tokens: maxTokens,
      reasoning: options.reasoningEffort && options.reasoningEffort !== 'none'
        ? { effort: options.reasoningEffort, exclude: true }
        : { effort: 'none', exclude: true },
      ...(options.jsonOutput ? { response_format: { type: 'json_object' } } : {}),
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    if (response.status === 402) {
      throw new Error(
        'This OpenRouter-powered generation option is connected, but the OpenRouter balance is empty. ' +
        'Add credits at https://openrouter.ai/settings/credits and try again.'
      );
    }
    throw new Error(`OpenRouter API error (${response.status}): ${err}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? '';
}

/**
 * Completes one generation request through the provider selected by the
 * branded model tier. OpenRouter reasoning stays private (`exclude: true`)
 * so parsers receive only the requested JSON or code.
 */
export async function completeGenerationText(
  model: ModelConfig,
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number,
  options: {
    jsonOutput?: boolean;
    reasoningEffort?: ModelConfig['reasoningEffort'];
  } = {},
): Promise<string> {
  if (model.provider === 'openrouter') {
    return callOpenRouter(
      model.modelId,
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      Math.min(model.maxTokens, maxTokens),
      {
        reasoningEffort: options.reasoningEffort ?? model.reasoningEffort,
        jsonOutput: options.jsonOutput,
      },
    );
  }

  const useAdaptiveThinking = model.modelId === 'claude-opus-5';
  const anthropicEffort = options.reasoningEffort ?? model.reasoningEffort;
  const response = await getAnthropicClient().messages.create({
    model: model.modelId,
    max_tokens: Math.min(model.maxTokens, maxTokens),
    thinking: useAdaptiveThinking ? { type: 'adaptive' } : { type: 'disabled' },
    ...(useAdaptiveThinking && anthropicEffort && anthropicEffort !== 'none'
      ? {
          output_config: {
            effort: anthropicEffort === 'minimal' || anthropicEffort === 'xhigh'
              ? 'high' as const
              : anthropicEffort,
          },
        }
      : {}),
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });
  const textBlock = response.content.find((block) => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error(`No text content returned by ${model.displayName}`);
  }
  return textBlock.text;
}

let anthropicDirect: Anthropic | null = null;

/**
 * A client that actually talks to Anthropic.
 *
 * getAnthropicClient above is misleadingly named: it points the SDK at
 * OpenRouter's baseURL, so everything it sends is an OpenRouter request and a
 * bare model id like "claude-opus-5" would be rejected as unknown. Power Mode
 * needs the real API, so it gets its own client with no baseURL override.
 */
export function getRealAnthropicClient(): Anthropic {
  if (typeof window !== 'undefined') {
    throw new Error(
      'Anthropic client must only be used on the server side. ' +
      'Do not import this module in client components.'
    );
  }

  if (!anthropicDirect) {
    let apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      try {
        const envPath = resolve(process.cwd(), '.env.local');
        const match = readFileSync(envPath, 'utf8').match(/^ANTHROPIC_API_KEY=(.+)$/m);
        if (match) apiKey = match[1].trim();
      } catch {
        // Ignore file read errors
      }
    }

    if (!apiKey) {
      throw new Error(
        'Power Mode needs ANTHROPIC_API_KEY, which is not set. ' +
        'Add it to the environment, or choose Standard to build through OpenRouter.'
      );
    }

    anthropicDirect = new Anthropic({ apiKey });
  }

  return anthropicDirect;
}

/**
 * Streams a chat completion from OpenRouter, yielding text deltas, so the
 * generation pipeline can consume OpenRouter exactly like the Anthropic
 * stream. streamGenerationText below dispatches to it by model.provider.
 */
export async function* streamOpenRouter(
  modelId: string,
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number,
  reasoningEffort: ModelConfig['reasoningEffort'] = 'none',
): AsyncGenerator<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY environment variable is not set.');

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://app.innovated.marketing',
      'X-Title': 'SiteCraft AI',
    },
    body: JSON.stringify({
      model: modelId,
      max_tokens: maxTokens,
      reasoning: reasoningEffort && reasoningEffort !== 'none'
        ? { effort: reasoningEffort, exclude: true }
        : { effort: 'none', exclude: true },
      stream: true,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  });

  if (!res.ok || !res.body) {
    const err = await res.text().catch(() => '');
    if (res.status === 402) {
      throw new Error(
        'This OpenRouter-powered generation option is connected, but the OpenRouter balance is empty. ' +
        'Add credits at https://openrouter.ai/settings/credits and try again.'
      );
    }
    throw new Error(`OpenRouter stream error (${res.status}): ${err}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const raw of lines) {
      const line = raw.trim();
      if (!line.startsWith('data:')) continue;
      const data = line.slice(5).trim();
      if (data === '[DONE]') return;
      try {
        const json = JSON.parse(data);
        const delta = json.choices?.[0]?.delta?.content;
        if (delta) yield delta as string;
      } catch {
        // ignore keepalive / partial lines
      }
    }
  }
}

/** Streams generation text through Anthropic or OpenRouter with one shape. */
export async function* streamGenerationText(
  model: ModelConfig,
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number,
  options: { reasoningEffort?: ModelConfig['reasoningEffort'] } = {},
): AsyncGenerator<string> {
  const effectiveMaxTokens = Math.min(model.maxTokens, maxTokens);
  if (model.provider === 'openrouter') {
    yield* streamOpenRouter(
      model.modelId,
      systemPrompt,
      userPrompt,
      effectiveMaxTokens,
      options.reasoningEffort ?? model.reasoningEffort,
    );
    return;
  }

  const useAdaptiveThinking = model.modelId === 'claude-opus-5';
  const anthropicEffort = options.reasoningEffort ?? model.reasoningEffort;
  const stream = getRealAnthropicClient().messages.stream({
    model: model.modelId,
    max_tokens: effectiveMaxTokens,
    thinking: useAdaptiveThinking ? { type: 'adaptive' } : { type: 'disabled' },
    ...(useAdaptiveThinking && anthropicEffort && anthropicEffort !== 'none'
      ? {
          output_config: {
            effort: anthropicEffort === 'minimal' || anthropicEffort === 'xhigh'
              ? 'high' as const
              : anthropicEffort,
          },
        }
      : {}),
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });
  for await (const event of stream) {
    if (
      event.type === 'content_block_delta' &&
      event.delta.type === 'text_delta'
    ) {
      yield event.delta.text;
    }
  }
}

/** Token limits for different generation stages. Sized for Sonnet 5's
 *  tokenizer (~30% more tokens for the same text than Sonnet 4.6) so full
 *  sites don't truncate at the old caps. */
export const TOKEN_LIMITS = {
  designSystem: 8192,
  blueprint: 8192,
  component: 96000,
} as const;

// --------------------------------------------------------------------------
// Retry wrapper for Anthropic API calls
// --------------------------------------------------------------------------

interface RetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
}

/**
 * Wraps an async function with exponential backoff retry logic.
 * Retries on transient errors (rate limits, timeouts, 5xx).
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { maxRetries = 3, baseDelayMs = 1000, maxDelayMs = 15000 } = options;

  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));

      // Don't retry on non-transient errors
      if (!isRetryableError(lastError)) {
        throw lastError;
      }

      // Don't retry if we've exhausted attempts
      if (attempt >= maxRetries) {
        break;
      }

      // Exponential backoff with jitter
      const delay = Math.min(
        baseDelayMs * Math.pow(2, attempt) + Math.random() * 500,
        maxDelayMs
      );
      console.warn(
        '[AI Client] Attempt ' + (attempt + 1) + ' failed: ' + lastError.message + '. Retrying in ' + Math.round(delay) + 'ms...'
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError ?? new Error('All retry attempts exhausted');
}

/**
 * Determines whether an error is transient and worth retrying.
 */
function isRetryableError(err: Error): boolean {
  const message = err.message.toLowerCase();

  // Rate limit errors (429)
  if (message.includes('rate limit') || message.includes('429') || message.includes('too many requests')) {
    return true;
  }

  // Server errors (5xx)
  if (message.includes('500') || message.includes('502') || message.includes('503') || message.includes('529')) {
    return true;
  }

  // Overloaded
  if (message.includes('overloaded') || message.includes('capacity')) {
    return true;
  }

  // Timeout errors
  if (message.includes('timeout') || message.includes('timed out') || message.includes('ETIMEDOUT')) {
    return true;
  }

  // Network errors
  if (message.includes('ECONNRESET') || message.includes('ECONNREFUSED') || message.includes('network')) {
    return true;
  }

  // Anthropic API specific transient errors
  if (message.includes('internal_error') || message.includes('api_error')) {
    return true;
  }

  return false;
}
