import { GoogleGenAI } from '@google/genai';

// Imagen 4 — Google's highest quality dedicated image generation model
const IMAGEN_MODEL = 'imagen-4.0-generate-001';
// Gemini 3.1 Flash Image — fast multimodal fallback
const GEMINI_IMAGE_MODEL = 'gemini-3.1-flash-image-preview';

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

export interface GenerateImageOptions {
  prompt: string;
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
  /** Use '2K' for highest quality marketing images, '1K' for faster generation */
  imageSize?: '1K' | '2K';
}

interface GeneratedImage {
  base64Data: string;
  mimeType: string;
}

/**
 * Generate an image using Imagen 4 (primary) with Gemini 3.1 Flash Image fallback.
 * Returns the raw base64 image data and mimeType.
 */
export async function generateImage(
  options: GenerateImageOptions
): Promise<GeneratedImage | null> {
  // Try Imagen 4 first (highest quality dedicated image model)
  const imagen4Result = await generateWithImagen4(options);
  if (imagen4Result) return imagen4Result;

  // Fallback to Gemini 3.1 Flash Image (multimodal)
  console.warn('[Image Gen] Imagen 4 failed, falling back to Gemini 3.1 Flash Image');
  return generateWithGemini(options);
}

/**
 * Generate using Imagen 4 — dedicated high-quality image generation.
 * Produces 2K resolution marketing-grade images.
 */
async function generateWithImagen4(
  options: GenerateImageOptions
): Promise<GeneratedImage | null> {
  try {
    const ai = getGenAIClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await (ai.models as any).generateImages({
      model: IMAGEN_MODEL,
      prompt: options.prompt,
      config: {
        numberOfImages: 1,
        aspectRatio: options.aspectRatio || '16:9',
        imageSize: options.imageSize || '2K',
        personGeneration: 'allow_adult',
      },
    });

    const generatedImages = response?.generatedImages;
    if (!generatedImages || generatedImages.length === 0) {
      console.warn('[Image Gen] Imagen 4 returned no images');
      return null;
    }

    const imgBytes = generatedImages[0]?.image?.imageBytes;
    if (!imgBytes) {
      console.warn('[Image Gen] Imagen 4 returned empty image bytes');
      return null;
    }

    return {
      base64Data: imgBytes,
      mimeType: 'image/png',
    };
  } catch (error) {
    console.error('[Image Gen] Imagen 4 generation failed:', error);
    return null;
  }
}

/**
 * Generate using Gemini 3.1 Flash Image — multimodal fallback.
 */
async function generateWithGemini(
  options: GenerateImageOptions
): Promise<GeneratedImage | null> {
  try {
    const ai = getGenAIClient();

    const response = await ai.models.generateContent({
      model: GEMINI_IMAGE_MODEL,
      contents: options.prompt,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
        imageConfig: {
          aspectRatio: options.aspectRatio || '16:9',
        },
      },
    });

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
    console.error('[Image Gen] Gemini Flash Image generation failed:', error);
    return null;
  }
}

/**
 * Generate an image with retry logic (tries up to 2 times).
 */
async function generateWithRetry(
  options: GenerateImageOptions
): Promise<GeneratedImage | null> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const result = await generateImage(options);
    if (result) return result;
    if (attempt < 1) {
      // Brief delay before retry
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  return null;
}

/**
 * Generate an ad/marketing image and upload it to Supabase storage.
 * Uses Imagen 4 at 2K resolution for highest quality marketing visuals.
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
  const image = await generateWithRetry({
    prompt,
    aspectRatio,
    imageSize: '2K', // Always use highest quality for marketing
  });
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
    console.error('[Image Gen] Failed to upload image:', error);
    return null;
  }

  const {
    data: { publicUrl },
  } = (supabase as any).storage.from('project-assets').getPublicUrl(storagePath);

  return publicUrl;
}

// ---------------------------------------------------------------------------
// Marketing Image Prompt Builders
// ---------------------------------------------------------------------------

export interface BrandContext {
  businessName: string;
  industry?: string;
  brandColor?: string;
  description?: string;
}

/**
 * Build a high-quality social media graphic prompt.
 * Produces professional, scroll-stopping visuals with bold typography.
 */
export function buildSocialImagePrompt(
  brand: BrandContext,
  headline: string,
  subtext: string,
  platform: string
): string {
  const color = brand.brandColor || 'orange';
  const industryHint = brand.industry
    ? ` in the ${brand.industry} industry`
    : '';

  const platformStyle =
    platform === 'x'
      ? 'wide banner format, Twitter/X optimized'
      : 'square social media post, Instagram/Facebook optimized';

  return [
    `Create a premium, professional social media marketing graphic for "${brand.businessName}"${industryHint}.`,
    '',
    'DESIGN SPECIFICATIONS:',
    `- Format: ${platformStyle}`,
    '- Background: Rich, dark gradient background (#0a0a0a to #1a1a2e) with subtle abstract geometric patterns, light grain texture, and soft bokeh light effects',
    `- Primary accent color: ${color} (used for highlights, borders, gradient accents, and decorative elements)`,
    '- Typography: Clean, modern sans-serif font',
    `- Main headline text: "${headline}" — render in LARGE, bold white text, centered, with slight drop shadow for depth`,
    `- Supporting text: "${subtext}" — render in smaller, lighter gray text below the headline`,
    `- Add a thin ${color} accent line or gradient bar as a visual separator`,
    `- Include subtle ${color} glow/gradient accents in corners or edges`,
    '',
    'QUALITY REQUIREMENTS:',
    '- Ultra-sharp, crisp text rendering — every letter must be clearly readable',
    '- Professional marketing agency quality — this should look like it was designed in Adobe Photoshop by a professional',
    '- Clean layout with generous white space around text elements',
    '- No stock photos, no people, no cluttered elements',
    '- Modern, sleek, dark-mode aesthetic',
    '- High contrast between text and background for maximum readability',
    '- Smooth gradients, no banding artifacts',
    '',
    'STYLE REFERENCE: Think premium SaaS marketing, tech startup social media, or luxury brand social posts. Dark, clean, bold.',
  ].join('\n');
}

/**
 * Build a high-quality ad visual prompt.
 * Produces professional advertising imagery for paid campaigns.
 */
export function buildAdImagePrompt(
  brand: BrandContext,
  headline: string,
  platform: string,
  variation: string
): string {
  const industryHint = brand.industry
    ? ` in the ${brand.industry} industry`
    : '';

  const platformDesc =
    platform === 'google_ads'
      ? 'Google Display Network banner ad'
      : 'Meta (Facebook/Instagram) sponsored ad';

  const variationStyle =
    variation === 'urgency'
      ? 'Create a sense of energy and urgency with warm, bold colors and dynamic composition.'
      : variation === 'social_proof'
        ? 'Convey trust and credibility with cool, professional tones and clean layout.'
        : 'Emphasize the key benefit with inviting, aspirational imagery.';

  return [
    `Create a professional ${platformDesc} visual for "${brand.businessName}"${industryHint}.`,
    '',
    'DESIGN SPECIFICATIONS:',
    `- Headline: "${headline}"`,
    `- Style direction: ${variationStyle}`,
    '- Background: Sophisticated gradient or abstract design — NO generic stock photos',
    '- Text should be prominent, bold, and immediately readable',
    '- Include subtle brand elements and professional design touches',
    '- Color palette: Modern, high-contrast, commercial-grade',
    '',
    'QUALITY REQUIREMENTS:',
    '- Ad-agency quality — looks like a professionally designed paid advertisement',
    '- Crystal clear text rendering, no blur or artifacts',
    '- Clean, uncluttered composition that draws the eye to the headline',
    '- No watermarks, no stock photo people, no generic clip art',
    '- Optimized for the ad platform — attention-grabbing in a feed scroll',
    '',
    'IMPORTANT: The text must be perfectly readable. This is a real advertisement, not concept art.',
  ].join('\n');
}
