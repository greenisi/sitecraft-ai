import Anthropic from '@anthropic-ai/sdk';

let client: Anthropic | null = null;

/**
 * Returns a singleton Anthropic SDK client.
 * Only usable on the server side -- will throw if ANTHROPIC_API_KEY is missing.
 */
export function getAnthropicClient(): Anthropic {
  if (typeof window !== 'undefined') {
    throw new Error(
      'Anthropic client must only be used on the server side. ' +
      'Do not import this module in client components.'
    );
  }

  if (!client) {
    let apiKey = process.env.ANTHROPIC_API_KEY;

    // If the system env has an empty string, try loading from .env.local directly
    if (!apiKey) {
      try {
        const fs = require('fs');
        const path = require('path');
        const envPath = path.resolve(process.cwd(), '.env.local');
        const envContent = fs.readFileSync(envPath, 'utf8');
        const match = envContent.match(/^ANTHROPIC_API_KEY=(.+)$/m);
        if (match) {
          apiKey = match[1].trim();
        }
      } catch {
        // Ignore file read errors
      }
    }

    if (!apiKey) {
      throw new Error(
        'ANTHROPIC_API_KEY environment variable is not set. ' +
        'Please add it to your .env.local file.'
      );
    }

    client = new Anthropic({ apiKey });
  }

  return client;
}

/**
 * The model identifier used for all generation calls.
 * Using claude-sonnet-4 for fast, reliable generations that complete
 * well within Vercel function timeout limits.
 */
export const GENERATION_MODEL = 'claude-sonnet-4-20250514';

/** Token limits for different generation stages. */
export const TOKEN_LIMITS = {
  designSystem: 4096,
  blueprint: 4096,
  component: 32000,
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
