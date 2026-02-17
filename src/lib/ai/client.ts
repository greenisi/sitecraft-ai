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

/** The model identifier used for all generation calls. */
export const GENERATION_MODEL = 'claude-sonnet-4-20250514';

/** Token limits for different generation stages. */
export const TOKEN_LIMITS = {
  designSystem: 4096,
  blueprint: 8192,
  component: 32768,
} as const;
