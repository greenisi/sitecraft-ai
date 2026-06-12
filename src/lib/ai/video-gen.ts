// Gemini Veo video generation — used by the Media Studio.
// Video generation is a long-running operation (1-4 minutes), so this module
// exposes start + poll separately: the POST route starts the operation and the
// client polls a GET route until the video is ready, at which point we download
// the bytes and store them in Supabase storage.

import { GoogleGenAI } from '@google/genai';

// Fast variant: ~4x cheaper than full Veo 3 and fine for website hero/promo clips.
const VEO_MODEL = 'veo-3.0-fast-generate-001';
// Same family served through OpenRouter, used as automatic fallback when the
// direct Google API is unavailable (missing key, quota, billing).
const OPENROUTER_VIDEO_MODEL = 'google/veo-3.1-fast';
const OPENROUTER_OP_PREFIX = 'openrouter:';

let genAIClient: GoogleGenAI | null = null;

function getGenAIClient(): GoogleGenAI {
  if (!genAIClient) {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_AI_API_KEY environment variable is not set');
    }
    genAIClient = new GoogleGenAI({ apiKey });
  }
  return genAIClient;
}

export interface StartVideoOptions {
  prompt: string;
  aspectRatio?: '16:9' | '9:16';
}

/** Start a Veo generation. Returns the operation name to poll with. */
export async function startVideoGeneration(options: StartVideoOptions): Promise<string> {
  const openrouterKey = process.env.OPENROUTER_API_KEY;

  if (process.env.GOOGLE_AI_API_KEY) {
    try {
      return await startDirect(options);
    } catch (err) {
      if (!openrouterKey) throw err;
      console.warn('[Video Gen] Direct Veo failed, falling back to OpenRouter:', err);
    }
  }

  if (!openrouterKey) {
    throw new Error('Neither GOOGLE_AI_API_KEY nor OPENROUTER_API_KEY is set');
  }
  return startViaOpenRouter(openrouterKey, options);
}

async function startDirect(options: StartVideoOptions): Promise<string> {
  const ai = getGenAIClient();
  const operation = await ai.models.generateVideos({
    model: VEO_MODEL,
    prompt: options.prompt,
    config: {
      aspectRatio: options.aspectRatio || '16:9',
    },
  });
  if (!operation?.name) {
    throw new Error('Veo did not return an operation name');
  }
  return operation.name;
}

async function startViaOpenRouter(apiKey: string, options: StartVideoOptions): Promise<string> {
  const res = await fetch('https://openrouter.ai/api/v1/videos', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: OPENROUTER_VIDEO_MODEL,
      prompt: options.prompt,
      aspect_ratio: options.aspectRatio || '16:9',
      resolution: '720p',
      duration: 8,
    }),
  });

  const json = await res.json();
  if (!res.ok || !json?.id) {
    throw new Error(json?.error?.message || `OpenRouter video start failed (${res.status})`);
  }
  return `${OPENROUTER_OP_PREFIX}${json.id}`;
}

export type VideoOperationStatus =
  | { done: false }
  | { done: true; error: string }
  | { done: true; error: null; videoBytes: Buffer; mimeType: string };

/** Poll a video operation (direct Veo or OpenRouter); when complete, download the bytes. */
export async function checkVideoOperation(operationName: string): Promise<VideoOperationStatus> {
  if (operationName.startsWith(OPENROUTER_OP_PREFIX)) {
    return checkOpenRouterJob(operationName.slice(OPENROUTER_OP_PREFIX.length));
  }

  const apiKeyForPoll = process.env.GOOGLE_AI_API_KEY;
  if (!apiKeyForPoll) {
    throw new Error('GOOGLE_AI_API_KEY environment variable is not set');
  }

  // Poll the operation via REST — the SDK's getVideosOperation requires the
  // original Operation instance, which we don't have across serverless requests.
  const pollRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/${operationName}`,
    { headers: { 'x-goog-api-key': apiKeyForPoll } }
  );
  if (!pollRes.ok) {
    throw new Error(`Failed to poll video operation (${pollRes.status})`);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const operation: any = await pollRes.json();

  if (!operation.done) return { done: false };

  if (operation.error) {
    return { done: true, error: operation.error.message || 'Video generation failed' };
  }

  // Response shape differs between API revisions — handle both.
  const video =
    operation.response?.generateVideoResponse?.generatedSamples?.[0]?.video ||
    operation.response?.generatedVideos?.[0]?.video;
  if (!video?.uri) {
    return { done: true, error: 'Veo completed but returned no video' };
  }

  // The file URI requires the API key for download.
  const apiKey = process.env.GOOGLE_AI_API_KEY!;
  const res = await fetch(video.uri, { headers: { 'x-goog-api-key': apiKey } });
  if (!res.ok) {
    return { done: true, error: `Failed to download generated video (${res.status})` };
  }
  const arrayBuffer = await res.arrayBuffer();

  return {
    done: true,
    error: null,
    videoBytes: Buffer.from(arrayBuffer),
    mimeType: video.mimeType || 'video/mp4',
  };
}

async function checkOpenRouterJob(jobId: string): Promise<VideoOperationStatus> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY environment variable is not set');
  }
  const headers = { Authorization: `Bearer ${apiKey}` };

  const res = await fetch(`https://openrouter.ai/api/v1/videos/${jobId}`, { headers });
  if (!res.ok) {
    throw new Error(`Failed to poll OpenRouter video job (${res.status})`);
  }
  const job = await res.json();

  if (job.status === 'failed') {
    return { done: true, error: job.error?.message || 'Video generation failed' };
  }
  if (job.status !== 'completed') {
    return { done: false };
  }

  const url = job.unsigned_urls?.[0] || `https://openrouter.ai/api/v1/videos/${jobId}/content`;
  const dl = await fetch(url, { headers });
  if (!dl.ok) {
    return { done: true, error: `Failed to download generated video (${dl.status})` };
  }
  const arrayBuffer = await dl.arrayBuffer();

  return {
    done: true,
    error: null,
    videoBytes: Buffer.from(arrayBuffer),
    mimeType: dl.headers.get('content-type')?.split(';')[0] || 'video/mp4',
  };
}
