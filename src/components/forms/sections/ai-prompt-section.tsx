'use client';

import { useCallback } from 'react';
import type { UseFormRegister, UseFormSetValue, UseFormWatch, FieldErrors } from 'react-hook-form';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import type { GenerationConfigFormValues } from '@/lib/utils/validators';
import { cn } from '@/lib/utils/cn';

const MAX_PROMPT_LENGTH = 5000;

const EXAMPLE_PROMPTS = [
  'Make it feel modern and tech-forward with subtle gradients',
  'Use a dark theme with neon accent colors',
  'Keep it minimal with lots of whitespace and large typography',
  'Make it warm and inviting, like a cozy coffee shop website',
  'Professional and corporate with clean data visualizations',
  'Playful and colorful with rounded shapes and illustrations',
  'Luxury feel with gold accents and serif typography',
  'Focus on social proof and trust signals above the fold',
] as const;

interface AiPromptSectionProps {
  register: UseFormRegister<GenerationConfigFormValues>;
  setValue: UseFormSetValue<GenerationConfigFormValues>;
  watch: UseFormWatch<GenerationConfigFormValues>;
  errors: FieldErrors<GenerationConfigFormValues>;
}

export function AiPromptSection({
  register,
  setValue,
  watch,
  errors,
}: AiPromptSectionProps) {
  const promptValue = watch('aiPrompt') || '';
  const charCount = promptValue.length;

  const handleExampleClick = useCallback(
    (example: string) => {
      const currentValue = watch('aiPrompt') || '';
      const separator = currentValue.trim() ? '. ' : '';
      const newValue = currentValue.trim() + separator + example;

      if (newValue.length <= MAX_PROMPT_LENGTH) {
        setValue('aiPrompt', newValue, { shouldValidate: true });
      }
    },
    [setValue, watch]
  );

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold">AI Creative Direction</h3>
        <p className="text-sm text-muted-foreground">
          Guide the AI with a free-form prompt describing the look, feel, tone, and
          special requirements for your website. The more detail you provide, the
          better the result.
        </p>
      </div>

      {/* Prompt Textarea */}
      <div className="space-y-2">
        <Label htmlFor="aiPrompt">Creative Prompt</Label>
        <Textarea
          id="aiPrompt"
          placeholder="Describe the style, tone, and any specific requirements for your website. For example: 'I want a modern, clean design with a dark hero section, animated feature cards, and a warm color palette...'"
          rows={6}
          maxLength={MAX_PROMPT_LENGTH}
          {...register('aiPrompt')}
          className={cn(
            'resize-y',
            errors.aiPrompt && 'border-destructive focus-visible:ring-destructive'
          )}
        />
        <div className="flex items-center justify-between">
          {errors.aiPrompt ? (
            <p className="text-sm text-destructive">{errors.aiPrompt.message}</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              This is optional but helps the AI understand your vision.
            </p>
          )}
          <span
            className={cn(
              'text-xs tabular-nums',
              charCount > MAX_PROMPT_LENGTH * 0.9
                ? 'text-destructive'
                : charCount > MAX_PROMPT_LENGTH * 0.7
                  ? 'text-yellow-600 dark:text-yellow-500'
                  : 'text-muted-foreground'
            )}
          >
            {charCount.toLocaleString()} / {MAX_PROMPT_LENGTH.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Example Prompts */}
      <div className="space-y-3">
        <Label className="text-sm">
          Example ideas{' '}
          <span className="font-normal text-muted-foreground">
            (click to append)
          </span>
        </Label>
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_PROMPTS.map((example) => (
            <Badge
              key={example}
              variant="outline"
              className="cursor-pointer transition-colors hover:bg-accent hover:text-accent-foreground"
              onClick={() => handleExampleClick(example)}
            >
              {example}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
