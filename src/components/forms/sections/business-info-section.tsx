'use client';

import type { UseFormRegister, FieldErrors } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { GenerationConfigFormValues } from '@/lib/utils/validators';
import { cn } from '@/lib/utils/cn';

const INDUSTRY_OPTIONS = [
  'Technology',
  'Healthcare',
  'Finance',
  'Education',
  'E-Commerce / Retail',
  'Real Estate',
  'Food & Beverage',
  'Travel & Hospitality',
  'Fitness & Wellness',
  'Marketing & Advertising',
  'Legal Services',
  'Creative & Design',
  'Construction',
  'Consulting',
  'Non-Profit',
  'Entertainment',
  'Automotive',
  'Agriculture',
  'Other',
] as const;

interface BusinessInfoSectionProps {
  register: UseFormRegister<GenerationConfigFormValues>;
  errors: FieldErrors<GenerationConfigFormValues>;
  onIndustryChange: (value: string) => void;
  industryValue: string;
}

export function BusinessInfoSection({
  register,
  errors,
  onIndustryChange,
  industryValue,
}: BusinessInfoSectionProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold">Business Information</h3>
        <p className="text-sm text-muted-foreground">
          Tell us about your business so we can generate tailored content.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Business Name */}
        <div className="space-y-2">
          <Label htmlFor="business.name">
            Business Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="business.name"
            placeholder="Acme Inc."
            {...register('business.name')}
            className={cn(
              errors.business?.name && 'border-destructive focus-visible:ring-destructive'
            )}
          />
          {errors.business?.name && (
            <p className="text-sm text-destructive">{errors.business.name.message}</p>
          )}
        </div>

        {/* Tagline */}
        <div className="space-y-2">
          <Label htmlFor="business.tagline">Tagline</Label>
          <Input
            id="business.tagline"
            placeholder="Building the future, one line of code at a time"
            {...register('business.tagline')}
            className={cn(
              errors.business?.tagline && 'border-destructive focus-visible:ring-destructive'
            )}
          />
          {errors.business?.tagline && (
            <p className="text-sm text-destructive">{errors.business.tagline.message}</p>
          )}
        </div>
      </div>

      {/* Industry */}
      <div className="space-y-2">
        <Label htmlFor="business.industry">
          Industry <span className="text-destructive">*</span>
        </Label>
        <Select value={industryValue} onValueChange={onIndustryChange}>
          <SelectTrigger
            id="business.industry"
            className={cn(
              errors.business?.industry && 'border-destructive focus-visible:ring-destructive'
            )}
          >
            <SelectValue placeholder="Select an industry" />
          </SelectTrigger>
          <SelectContent>
            {INDUSTRY_OPTIONS.map((industry) => (
              <SelectItem key={industry} value={industry}>
                {industry}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.business?.industry && (
          <p className="text-sm text-destructive">{errors.business.industry.message}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="business.description">
          Business Description <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="business.description"
          placeholder="Describe what your business does, the products or services you offer, and what makes you unique..."
          rows={4}
          {...register('business.description')}
          className={cn(
            errors.business?.description && 'border-destructive focus-visible:ring-destructive'
          )}
        />
        {errors.business?.description && (
          <p className="text-sm text-destructive">{errors.business.description.message}</p>
        )}
      </div>

      {/* Target Audience */}
      <div className="space-y-2">
        <Label htmlFor="business.targetAudience">
          Target Audience <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="business.targetAudience"
          placeholder="Describe your ideal customer. Consider demographics, interests, pain points, and what they're looking for..."
          rows={3}
          {...register('business.targetAudience')}
          className={cn(
            errors.business?.targetAudience && 'border-destructive focus-visible:ring-destructive'
          )}
        />
        {errors.business?.targetAudience && (
          <p className="text-sm text-destructive">{errors.business.targetAudience.message}</p>
        )}
      </div>
    </div>
  );
}
