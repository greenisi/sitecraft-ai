'use client';

import { useCallback } from 'react';
import type { UseFormSetValue, UseFormWatch, FieldErrors, Control } from 'react-hook-form';
import { useFieldArray } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  NAVBAR_STYLES,
  NAVBAR_STYLE_LABELS,
  NAVBAR_POSITIONS,
  FOOTER_STYLES,
  FOOTER_STYLE_LABELS,
  SOCIAL_PLATFORMS,
  type NavbarStyle,
  type NavbarPosition,
  type FooterStyle,
  type SocialPlatform,
} from '@/lib/utils/constants';
import type { GenerationConfigFormValues } from '@/lib/utils/validators';
import { cn } from '@/lib/utils/cn';

interface NavigationSectionProps {
  control: Control<GenerationConfigFormValues>;
  setValue: UseFormSetValue<GenerationConfigFormValues>;
  watch: UseFormWatch<GenerationConfigFormValues>;
  errors: FieldErrors<GenerationConfigFormValues>;
}

const NAVBAR_POSITION_LABELS: Record<NavbarPosition, string> = {
  fixed: 'Fixed (stays visible)',
  sticky: 'Sticky (sticks on scroll)',
  static: 'Static (scrolls away)',
};

const SOCIAL_LABELS: Record<SocialPlatform, string> = {
  facebook: 'Facebook',
  twitter: 'Twitter / X',
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
  youtube: 'YouTube',
  tiktok: 'TikTok',
  github: 'GitHub',
};

export function NavigationSection({
  control,
  setValue,
  watch,
  errors,
}: NavigationSectionProps) {
  const navbarStyle = watch('navigation.navbarStyle');
  const navbarPosition = watch('navigation.navbarPosition');
  const footerStyle = watch('navigation.footerStyle');

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'navigation.socialLinks' as 'sections',
  });

  const handleAddSocialLink = useCallback(() => {
    // Find the first platform not already used
    const usedPlatforms = new Set(
      fields.map((f) => (f as unknown as { platform: string }).platform)
    );
    const available = SOCIAL_PLATFORMS.find((p) => !usedPlatforms.has(p));
    if (!available) return;

    (append as (value: Record<string, unknown>) => void)({
      platform: available,
      url: '',
    });
  }, [fields, append]);

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold">Navigation & Layout</h3>
        <p className="text-sm text-muted-foreground">
          Customize navbar, footer, and social links for your website.
        </p>
      </div>

      {/* Navbar Style */}
      <div className="space-y-3">
        <Label className="text-base font-medium">Navbar Style</Label>
        <p className="text-xs text-muted-foreground">
          Choose the visual style for your navigation bar.
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {NAVBAR_STYLES.map((style) => (
            <button
              key={style}
              type="button"
              onClick={() =>
                setValue('navigation.navbarStyle', style, { shouldValidate: true })
              }
              className={cn(
                'flex flex-col gap-1 rounded-lg border-2 p-3 text-left transition-all hover:border-primary/50 hover:shadow-sm',
                navbarStyle === style
                  ? 'border-primary bg-primary/5'
                  : 'border-muted bg-background'
              )}
            >
              <span className="text-sm font-medium capitalize">{style}</span>
              <span className="text-xs text-muted-foreground leading-tight">
                {NAVBAR_STYLE_LABELS[style]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Navbar Position */}
      <div className="space-y-3">
        <Label className="text-base font-medium">Navbar Position</Label>
        <div className="flex flex-wrap gap-2">
          {NAVBAR_POSITIONS.map((pos) => (
            <button
              key={pos}
              type="button"
              onClick={() =>
                setValue('navigation.navbarPosition', pos, { shouldValidate: true })
              }
              className={cn(
                'rounded-full border-2 px-4 py-1.5 text-sm font-medium transition-all hover:border-primary/50',
                navbarPosition === pos
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-muted bg-background text-muted-foreground hover:text-foreground'
              )}
            >
              {NAVBAR_POSITION_LABELS[pos]}
            </button>
          ))}
        </div>
      </div>

      {/* Footer Style */}
      <div className="space-y-3">
        <Label className="text-base font-medium">Footer Style</Label>
        <p className="text-xs text-muted-foreground">
          Choose the footer layout for your website.
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {FOOTER_STYLES.map((style) => (
            <button
              key={style}
              type="button"
              onClick={() =>
                setValue('navigation.footerStyle', style, { shouldValidate: true })
              }
              className={cn(
                'flex flex-col gap-1 rounded-lg border-2 p-3 text-left transition-all hover:border-primary/50 hover:shadow-sm',
                footerStyle === style
                  ? 'border-primary bg-primary/5'
                  : 'border-muted bg-background'
              )}
            >
              <span className="text-sm font-medium capitalize">
                {style.replace('-', ' ')}
              </span>
              <span className="text-xs text-muted-foreground leading-tight">
                {FOOTER_STYLE_LABELS[style]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Social Links */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-base font-medium">Social Links</Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              Add social media links to show in the footer.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddSocialLink}
            disabled={fields.length >= SOCIAL_PLATFORMS.length}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add
          </Button>
        </div>

        {fields.length > 0 ? (
          <div className="space-y-2">
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-center gap-2">
                <Select
                  value={(field as unknown as { platform: string }).platform || ''}
                  onValueChange={(val) => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (setValue as any)(
                      `navigation.socialLinks.${index}.platform`,
                      val,
                      { shouldValidate: true }
                    );
                  }}
                >
                  <SelectTrigger className="w-36 shrink-0">
                    <SelectValue placeholder="Platform" />
                  </SelectTrigger>
                  <SelectContent>
                    {SOCIAL_PLATFORMS.map((p) => (
                      <SelectItem key={p} value={p}>
                        {SOCIAL_LABELS[p]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="https://..."
                  defaultValue={(field as unknown as { url: string }).url || ''}
                  onChange={(e) => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (setValue as any)(
                      `navigation.socialLinks.${index}.url`,
                      e.target.value,
                      { shouldValidate: true }
                    );
                  }}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => remove(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed py-6 text-center">
            <p className="text-xs text-muted-foreground">
              No social links added. The AI will generate appropriate social icons.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
