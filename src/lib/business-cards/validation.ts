import { z } from 'zod';

const designSchema = z.object({
  template: z.string().max(40),
  orientation: z.enum(['landscape', 'portrait']),
  layout: z.enum(['editorial', 'split', 'minimal']),
  background: z.enum(['solid', 'gradient', 'mesh']),
  font: z.enum(['modern', 'classic', 'rounded']),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  textColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  photoUrl: z.string().max(2048).nullable(),
  logoUrl: z.string().max(2048).nullable(),
  showPhoto: z.boolean(),
  showLogo: z.boolean(),
  showQr: z.boolean(),
  cornerRadius: z.number().min(0).max(40),
});

export const businessCardInputSchema = z.object({
  project_id: z.string().uuid().nullable().optional(),
  name: z.string().trim().min(1).max(100),
  status: z.enum(['draft', 'published']),
  full_name: z.string().trim().min(1).max(120),
  job_title: z.string().trim().max(120),
  company: z.string().trim().max(120),
  bio: z.string().trim().max(500),
  email: z.string().trim().max(254),
  phone: z.string().trim().max(50),
  website: z.string().trim().max(500),
  location: z.string().trim().max(160),
  booking_url: z.string().trim().max(500),
  social_links: z.array(z.object({
    label: z.string().trim().min(1).max(40),
    url: z.string().trim().min(1).max(500),
  })).max(12),
  design: designSchema,
});

export const businessCardPatchSchema = businessCardInputSchema.partial();

export const cardLeadSchema = z.object({
  full_name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().max(50).optional().default(''),
  note: z.string().trim().max(500).optional().default(''),
});

