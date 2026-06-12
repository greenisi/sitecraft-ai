// OpenAI image generation — used by the Media Studio.
// Tries the OpenAI API directly first, then falls back to the same OpenAI
// models served through OpenRouter (useful when one account is out of budget).
// Plain REST so we don't pull in the openai SDK for one endpoint.

const OPENAI_IMAGE_MODEL = 'gpt-image-1';
// OpenRouter model ids for OpenAI's image family, by quality tier.
const OPENROUTER_IMAGE_MODELS = {
  low: 'openai/gpt-5-image-mini',
  medium: 'openai/gpt-5-image',
  high: 'openai/gpt-5-image',
} as const;

export interface OpenAIImageOptions {
  prompt: string;
  /** gpt-image-1 sizes: square, landscape, portrait */
  size?: '1024x1024' | '1536x1024' | '1024x1536';
  quality?: 'low' | 'medium' | 'high';
}

export interface GeneratedImageResult {
  base64Data: string;
  mimeType: string;
}

export class OpenAIConfigError extends Error {}

export async function generateOpenAIImage(
  options: OpenAIImageOptions
): Promise<GeneratedImageResult> {
  const openaiKey = process.env.OPENAI_API_KEY;
  const openrouterKey = process.env.OPENROUTER_API_KEY;
  if (!openaiKey && !openrouterKey) {
    throw new OpenAIConfigError('Neither OPENAI_API_KEY nor OPENROUTER_API_KEY is set');
  }

  if (openaiKey) {
    try {
      return await generateDirect(openaiKey, options);
    } catch (err) {
      if (!openrouterKey) throw err;
      console.warn('[Image Gen] Direct OpenAI failed, falling back to OpenRouter:', err);
    }
  }
  return generateViaOpenRouter(openrouterKey!, options);
}

async function generateDirect(
  apiKey: string,
  options: OpenAIImageOptions
): Promise<GeneratedImageResult> {
  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: OPENAI_IMAGE_MODEL,
      prompt: options.prompt,
      size: options.size || '1536x1024',
      quality: options.quality || 'high',
      n: 1,
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    let message = `OpenAI image generation failed (${res.status})`;
    try {
      const parsed = JSON.parse(errBody);
      if (parsed?.error?.message) message = parsed.error.message;
    } catch {
      // keep generic message
    }
    throw new Error(message);
  }

  const json = await res.json();
  const b64 = json?.data?.[0]?.b64_json;
  if (!b64) {
    throw new Error('OpenAI returned no image data');
  }

  return { base64Data: b64, mimeType: 'image/png' };
}

// OpenRouter serves OpenAI's image models through chat/completions with
// modalities: ['image'] — the image comes back as a base64 data URL on the
// assistant message.
async function generateViaOpenRouter(
  apiKey: string,
  options: OpenAIImageOptions
): Promise<GeneratedImageResult> {
  const aspectRatio =
    options.size === '1024x1024' ? '1:1'
    : options.size === '1024x1536' ? '9:16'
    : '16:9';
  const model = OPENROUTER_IMAGE_MODELS[options.quality || 'high'];

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: options.prompt }],
      modalities: ['image'],
      image_config: { aspect_ratio: aspectRatio },
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    let message = `OpenRouter image generation failed (${res.status})`;
    try {
      const parsed = JSON.parse(errBody);
      if (parsed?.error?.message) message = parsed.error.message;
    } catch {
      // keep generic message
    }
    throw new Error(message);
  }

  const json = await res.json();
  const dataUrl = json?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  if (!dataUrl || typeof dataUrl !== 'string') {
    throw new Error('OpenRouter returned no image data');
  }

  const match = dataUrl.match(/^data:(image\/[a-z+]+);base64,(.+)$/);
  if (!match) {
    throw new Error('OpenRouter returned an unexpected image format');
  }

  return { base64Data: match[2], mimeType: match[1] };
}
