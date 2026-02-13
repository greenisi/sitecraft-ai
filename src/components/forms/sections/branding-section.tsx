'use client';

import { useCallback } from 'react';
import type { UseFormRegister, UseFormSetValue, UseFormWatch, FieldErrors } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FONT_OPTIONS, STYLE_OPTIONS, COLOR_PALETTE_PRESETS, type StyleOption } from '@/lib/utils/constants';
import type { GenerationConfigFormValues } from '@/lib/utils/validators';
import { cn } from '@/lib/utils/cn';

const STYLE_DESCRIPTIONS: Record<StyleOption, string> = {
  minimal: 'Clean lines, whitespace, understated elegance',
  bold: 'Strong typography, vibrant colors, high contrast',
  elegant: 'Refined details, serif fonts, sophisticated palette',
  playful: 'Rounded shapes, bright colors, friendly feel',
  corporate: 'Professional, structured, trustworthy appearance',
  dark: 'Dark backgrounds, glowing accents, cinematic feel',
  vibrant: 'Saturated colors, gradients, energetic personality',
};

const STYLE_ICONS: Record<StyleOption, string> = {
  minimal: 'M',
  bold: 'B',
  elegant: 'E',
  playful: 'P',
  corporate: 'C',
  dark: 'D',
  vibrant: 'V',
};

interface BrandingSectionProps {
  register: UseFormRegister<GenerationConfigFormValues>;
  setValue: UseFormSetValue<GenerationConfigFormValues>;
  watch: UseFormWatch<GenerationConfigFormValues>;
  errors: FieldErrors<GenerationConfigFormValues>;
}

export function BrandingSection({
  register,
  setValue,
  watch,
  errors,
}: BrandingSectionProps) {
  const selectedStyle = watch('branding.style');
  const primaryColor = watch('branding.primaryColor');
  const secondaryColor = watch('branding.secondaryColor');
  const accentColor = watch('branding.accentColor');
  const surfaceColor = watch('branding.surfaceColor') || '#ffffff';
  const headingFont = watch('branding.fontHeading');
  const bodyFont = watch('branding.fontBody');

  const handleStyleSelect = useCallback(
    (style: StyleOption) => {
      setValue('branding.style', style, { shouldValidate: true });
    },
    [setValue]
  );

  const handlePaletteSelect = useCallback(
    (preset: (typeof COLOR_PALETTE_PRESETS)[number]) => {
      setValue('branding.primaryColor', preset.primary, { shouldValidate: true });
      setValue('branding.secondaryColor', preset.secondary, { shouldValidate: true });
      setValue('branding.accentColor', preset.accent, { shouldValidate: true });
      setValue('branding.surfaceColor', preset.surface, { shouldValidate: true });
    },
    [setValue]
  );

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold">Branding & Design</h3>
        <p className="text-sm text-muted-foreground">
          Define the visual identity for your generated website.
        </p>
      </div>

      {/* Color Palette Presets */}
      <div className="space-y-3">
        <Label className="text-base font-medium">Quick Palettes</Label>
        <p className="text-xs text-muted-foreground">
          Click a preset to apply all 4 colors instantly, or customize individually below.
        </p>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {COLOR_PALETTE_PRESETS.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => handlePaletteSelect(preset)}
              className={cn(
                'group flex flex-col items-center gap-1.5 rounded-lg border-2 p-2 transition-all hover:border-primary/50 hover:shadow-sm shrink-0',
                primaryColor === preset.primary &&
                  secondaryColor === preset.secondary &&
                  accentColor === preset.accent
                  ? 'border-primary bg-primary/5'
                  : 'border-muted bg-background'
              )}
            >
              <div className="flex gap-0.5 rounded overflow-hidden">
                <div className="h-6 w-5" style={{ backgroundColor: preset.primary }} />
                <div className="h-6 w-5" style={{ backgroundColor: preset.secondary }} />
                <div className="h-6 w-5" style={{ backgroundColor: preset.accent }} />
                <div className="h-6 w-5 border-r" style={{ backgroundColor: preset.surface }} />
              </div>
              <span className="text-[10px] font-medium text-muted-foreground whitespace-nowrap">
                {preset.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Colors */}
      <div className="space-y-4">
        <Label className="text-base font-medium">Brand Colors</Label>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Primary Color */}
          <div className="space-y-2">
            <Label htmlFor="branding.primaryColor" className="text-sm">
              Primary
            </Label>
            <div className="flex items-center gap-3">
              <div className="relative">
                <input
                  type="color"
                  id="branding.primaryColor"
                  value={primaryColor}
                  onChange={(e) =>
                    setValue('branding.primaryColor', e.target.value, {
                      shouldValidate: true,
                    })
                  }
                  className="h-10 w-10 cursor-pointer rounded-md border border-input bg-transparent p-0.5"
                />
              </div>
              <Input
                value={primaryColor}
                onChange={(e) =>
                  setValue('branding.primaryColor', e.target.value, {
                    shouldValidate: true,
                  })
                }
                className={cn(
                  'flex-1 font-mono text-sm uppercase',
                  errors.branding?.primaryColor &&
                    'border-destructive focus-visible:ring-destructive'
                )}
                maxLength={7}
              />
            </div>
            {errors.branding?.primaryColor && (
              <p className="text-sm text-destructive">
                {errors.branding.primaryColor.message}
              </p>
            )}
          </div>

          {/* Secondary Color */}
          <div className="space-y-2">
            <Label htmlFor="branding.secondaryColor" className="text-sm">
              Secondary
            </Label>
            <div className="flex items-center gap-3">
              <div className="relative">
                <input
                  type="color"
                  id="branding.secondaryColor"
                  value={secondaryColor}
                  onChange={(e) =>
                    setValue('branding.secondaryColor', e.target.value, {
                      shouldValidate: true,
                    })
                  }
                  className="h-10 w-10 cursor-pointer rounded-md border border-input bg-transparent p-0.5"
                />
              </div>
              <Input
                value={secondaryColor}
                onChange={(e) =>
                  setValue('branding.secondaryColor', e.target.value, {
                    shouldValidate: true,
                  })
                }
                className={cn(
                  'flex-1 font-mono text-sm uppercase',
                  errors.branding?.secondaryColor &&
                    'border-destructive focus-visible:ring-destructive'
                )}
                maxLength={7}
              />
            </div>
            {errors.branding?.secondaryColor && (
              <p className="text-sm text-destructive">
                {errors.branding.secondaryColor.message}
              </p>
            )}
          </div>

          {/* Accent Color */}
          <div className="space-y-2">
            <Label htmlFor="branding.accentColor" className="text-sm">
              Accent
            </Label>
            <div className="flex items-center gap-3">
              <div className="relative">
                <input
                  type="color"
                  id="branding.accentColor"
                  value={accentColor}
                  onChange={(e) =>
                    setValue('branding.accentColor', e.target.value, {
                      shouldValidate: true,
                    })
                  }
                  className="h-10 w-10 cursor-pointer rounded-md border border-input bg-transparent p-0.5"
                />
              </div>
              <Input
                value={accentColor}
                onChange={(e) =>
                  setValue('branding.accentColor', e.target.value, {
                    shouldValidate: true,
                  })
                }
                className={cn(
                  'flex-1 font-mono text-sm uppercase',
                  errors.branding?.accentColor &&
                    'border-destructive focus-visible:ring-destructive'
                )}
                maxLength={7}
              />
            </div>
            {errors.branding?.accentColor && (
              <p className="text-sm text-destructive">
                {errors.branding.accentColor.message}
              </p>
            )}
          </div>

          {/* Surface Color */}
          <div className="space-y-2">
            <Label htmlFor="branding.surfaceColor" className="text-sm">
              Surface / BG
            </Label>
            <div className="flex items-center gap-3">
              <div className="relative">
                <input
                  type="color"
                  id="branding.surfaceColor"
                  value={surfaceColor}
                  onChange={(e) =>
                    setValue('branding.surfaceColor', e.target.value, {
                      shouldValidate: true,
                    })
                  }
                  className="h-10 w-10 cursor-pointer rounded-md border border-input bg-transparent p-0.5"
                />
              </div>
              <Input
                value={surfaceColor}
                onChange={(e) =>
                  setValue('branding.surfaceColor', e.target.value, {
                    shouldValidate: true,
                  })
                }
                className={cn(
                  'flex-1 font-mono text-sm uppercase',
                  errors.branding?.surfaceColor &&
                    'border-destructive focus-visible:ring-destructive'
                )}
                maxLength={7}
              />
            </div>
            {errors.branding?.surfaceColor && (
              <p className="text-sm text-destructive">
                {errors.branding.surfaceColor.message}
              </p>
            )}
          </div>
        </div>

        {/* Color Preview */}
        <div className="flex gap-1 rounded-lg border p-3">
          <div
            className="h-8 flex-1 rounded-l-md"
            style={{ backgroundColor: primaryColor }}
          />
          <div
            className="h-8 flex-1"
            style={{ backgroundColor: secondaryColor }}
          />
          <div
            className="h-8 flex-1"
            style={{ backgroundColor: accentColor }}
          />
          <div
            className="h-8 flex-1 rounded-r-md border"
            style={{ backgroundColor: surfaceColor }}
          />
        </div>
      </div>

      {/* Fonts */}
      <div className="space-y-4">
        <Label className="text-base font-medium">Typography</Label>
        <div className="grid gap-6 sm:grid-cols-2">
          {/* Heading Font */}
          <div className="space-y-2">
            <Label htmlFor="branding.fontHeading" className="text-sm">
              Heading Font
            </Label>
            <Select
              value={headingFont}
              onValueChange={(value) =>
                setValue('branding.fontHeading', value, { shouldValidate: true })
              }
            >
              <SelectTrigger
                id="branding.fontHeading"
                className={cn(
                  errors.branding?.fontHeading &&
                    'border-destructive focus-visible:ring-destructive'
                )}
              >
                <SelectValue placeholder="Select a font" />
              </SelectTrigger>
              <SelectContent>
                {FONT_OPTIONS.map((font) => (
                  <SelectItem key={font.value} value={font.value}>
                    {font.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.branding?.fontHeading && (
              <p className="text-sm text-destructive">
                {errors.branding.fontHeading.message}
              </p>
            )}
            {headingFont && (
              <p className="text-lg font-bold text-muted-foreground">
                The quick brown fox
              </p>
            )}
          </div>

          {/* Body Font */}
          <div className="space-y-2">
            <Label htmlFor="branding.fontBody" className="text-sm">
              Body Font
            </Label>
            <Select
              value={bodyFont}
              onValueChange={(value) =>
                setValue('branding.fontBody', value, { shouldValidate: true })
              }
            >
              <SelectTrigger
                id="branding.fontBody"
                className={cn(
                  errors.branding?.fontBody &&
                    'border-destructive focus-visible:ring-destructive'
                )}
              >
                <SelectValue placeholder="Select a font" />
              </SelectTrigger>
              <SelectContent>
                {FONT_OPTIONS.map((font) => (
                  <SelectItem key={font.value} value={font.value}>
                    {font.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.branding?.fontBody && (
              <p className="text-sm text-destructive">
                {errors.branding.fontBody.message}
              </p>
            )}
            {bodyFont && (
              <p className="text-sm text-muted-foreground">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Style */}
      <div className="space-y-4">
        <div>
          <Label className="text-base font-medium">Design Style</Label>
          <p className="text-sm text-muted-foreground">
            Choose a visual direction for your website.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {STYLE_OPTIONS.map((style) => (
            <button
              key={style}
              type="button"
              onClick={() => handleStyleSelect(style)}
              className={cn(
                'group relative flex flex-col items-center gap-2 rounded-lg border-2 p-4 text-center transition-all hover:border-primary/50 hover:shadow-sm',
                selectedStyle === style
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-muted bg-background'
              )}
            >
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold transition-colors',
                  selectedStyle === style
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
                )}
              >
                {STYLE_ICONS[style]}
              </div>
              <span className="text-sm font-medium capitalize">{style}</span>
              <span className="text-xs text-muted-foreground leading-tight">
                {STYLE_DESCRIPTIONS[style]}
              </span>
              {selectedStyle === style && (
                <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                  &#10003;
                </div>
              )}
            </button>
          ))}
        </div>
        {errors.branding?.style && (
          <p className="text-sm text-destructive">{errors.branding.style.message}</p>
        )}
      </div>
    </div>
  );
}
