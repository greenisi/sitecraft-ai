import { z } from 'zod';
import { SECTION_TYPES, STYLE_OPTIONS, SITE_TYPES } from '@/lib/utils/constants';

export const businessSchema = z.object({
  name: z
    .string()
    .min(1, 'Business name is required')
    .max(100, 'Business name must be 100 characters or fewer'),
  tagline: z
    .string()
    .max(150, 'Tagline must be 150 characters or fewer')
    .optional()
    .or(z.literal('')),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(2000, 'Description must be 2000 characters or fewer'),
  industry: z
    .string()
    .min(1, 'Industry is required'),
  targetAudience: z
    .string()
    .min(10, 'Target audience must be at least 10 characters')
    .max(1000, 'Target audience must be 1000 characters or fewer'),
});

export const brandingSchema = z.object({
  primaryColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Must be a valid hex color'),
  secondaryColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Must be a valid hex color'),
  accentColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Must be a valid hex color'),
  fontHeading: z
    .string()
    .min(1, 'Heading font is required'),
  fontBody: z
    .string()
    .min(1, 'Body font is required'),
  logoUrl: z
    .string()
    .url('Must be a valid URL')
    .optional()
    .or(z.literal('')),
  style: z.enum(STYLE_OPTIONS, {
    message: 'Please select a style',
  }),
});

export const sectionSchema = z.object({
  id: z.string().min(1),
  type: z.enum(SECTION_TYPES),
  content: z.record(z.string(), z.string()).optional(),
  variant: z.string().optional(),
  order: z.number().int().min(0),
});

export const generationConfigSchema = z.object({
  siteType: z.enum(SITE_TYPES),
  business: businessSchema,
  branding: brandingSchema,
  sections: z
    .array(sectionSchema)
    .min(1, 'Add at least one section')
    .max(12, 'Maximum 12 sections allowed'),
  aiPrompt: z
    .string()
    .max(5000, 'Prompt must be 5000 characters or fewer')
    .optional()
    .or(z.literal('')),
  referenceUrls: z
    .array(z.string().url('Must be a valid URL'))
    .optional(),
});

export type GenerationConfigFormValues = z.infer<typeof generationConfigSchema>;
