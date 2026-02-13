import { z } from 'zod';

// --------------------------------------------------------------------------
// Stage 2 -- Design System schema (returned as JSON from Claude)
// --------------------------------------------------------------------------

const colorPaletteSchema = z.record(z.string(), z.string());

export const designSystemSchema = z.object({
  colors: z.object({
    primary: colorPaletteSchema,
    secondary: colorPaletteSchema,
    accent: colorPaletteSchema,
    neutral: colorPaletteSchema,
  }),
  typography: z.object({
    headingFont: z.string(),
    bodyFont: z.string(),
    scale: z.record(
      z.string(),
      z.object({
        size: z.string(),
        lineHeight: z.string(),
        weight: z.string(),
      })
    ),
  }),
  spacing: z.record(z.string(), z.string()),
  borderRadius: z.record(z.string(), z.string()),
  shadows: z.record(z.string(), z.string()),
});

export type DesignSystemOutput = z.infer<typeof designSystemSchema>;

// --------------------------------------------------------------------------
// Stage 3 -- Page Blueprint schema (returned as JSON from Claude)
// --------------------------------------------------------------------------

const pageSectionSchema = z.object({
  componentName: z.string().min(1),
  props: z.record(z.string(), z.unknown()),
  order: z.number().int().min(0),
});

const pageSchema = z.object({
  path: z.string().min(1),
  title: z.string().min(1),
  sections: z.array(pageSectionSchema).min(1),
  metadata: z.object({
    title: z.string(),
    description: z.string(),
  }),
});

export const pageBlueprintSchema = z.object({
  pages: z.array(pageSchema).min(1),
  sharedComponents: z.array(z.string()),
  dataRequirements: z.record(z.string(), z.unknown()),
});

export type PageBlueprintOutput = z.infer<typeof pageBlueprintSchema>;

// --------------------------------------------------------------------------
// Component Output -- for parsing fenced code blocks from Claude's response
// --------------------------------------------------------------------------

export const componentOutputSchema = z.object({
  filePath: z
    .string()
    .min(1)
    .refine(
      (p) => p.startsWith('src/') || p.startsWith('./src/'),
      'File path must start with src/'
    ),
  content: z.string().min(1),
  language: z.string().min(1),
});

export type ComponentOutput = z.infer<typeof componentOutputSchema>;
