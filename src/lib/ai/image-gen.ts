import { GoogleGenAI } from '@google/genai';

const NANO_BANANA_MODEL = 'gemini-3.1-flash-image-preview';

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

interface GenerateImageOptions {
  prompt: string;
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
}

interface GeneratedImage {
  base64Data: string;
  mimeType: string;
}

/**
 * Generate an image using Nano Banana 2 (Gemini 3.1 Flash Image)
 * Returns the raw base64 image data and mimeType
 */
export async function generateImage(
  options: GenerateImageOptions
): Promise<GeneratedImage | null> {
  try {
    const ai = getGenAIClient();

    const response = await ai.models.generateContent({
      model: NANO_BANANA_MODEL,
      contents: options.prompt,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
        imageConfig: {
          aspectRatio: options.aspectRatio || '16:9',
        },
      },
    });

    // Find the image part in the response
    const candidates = response.candidates;
    if (!candidates || candidates.length === 0) return null;

    const parts = candidates[0].content?.parts;
    if (!parts) return null;

    for (const part of parts) {
      if (part.inlineData?.data && part.inlineData?.mimeType) {
        return {
          base64Data: part.inlineData.data,
          mimeType: part.inlineData.mimeType,
        };
      }
    }

    return null;
  } catch (error) {
    console.error('Nano Banana 2 image generation failed:', error);
    return null;
  }
}

/**
 * Generate an ad image and upload it to Supabase storage.
 * Returns the public URL or null on failure.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
export async function generateAndUploadAdImage(
  supabase: any,
  projectId: string,
  prompt: string,
  fileName: string,
  aspectRatio?: GenerateImageOptions['aspectRatio']
): Promise<string | null> {
  const image = await generateImage({ prompt, aspectRatio });
  if (!image) return null;

  // Convert base64 to buffer
  const buffer = Buffer.from(image.base64Data, 'base64');
  const ext = image.mimeType === 'image/png' ? 'png' : 'jpg';
  const storagePath = `${projectId}/marketing/${fileName}.${ext}`;

  const { error } = await (supabase as any).storage
    .from('project-assets')
    .upload(storagePath, buffer, {
      contentType: image.mimeType,
      upsert: true,
    });

  if (error) {
    console.error('Failed to upload ad image:', error);
    return null;
  }

  const {
    data: { publicUrl },
  } = (supabase as any).storage.from('project-assets').getPublicUrl(storagePath);

  return publicUrl;
}
