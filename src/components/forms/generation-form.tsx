'use client';

import { useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useProject, useUpdateProject } from '@/lib/hooks/use-project';
import {
  generationConfigSchema,
  type GenerationConfigFormValues,
} from '@/lib/utils/validators';
import type { GenerationConfig } from '@/types/project';
import { BusinessInfoSection } from './sections/business-info-section';
import { BrandingSection } from './sections/branding-section';
import { ContentSections } from './sections/content-sections';
import { AiPromptSection } from './sections/ai-prompt-section';
import { NavigationSection } from './sections/navigation-section';

interface GenerationFormProps {
  projectId: string;
  onSubmit: (config: GenerationConfig) => void;
  isGenerating?: boolean;
}

const DEFAULT_VALUES: GenerationConfigFormValues = {
  siteType: 'landing-page',
  business: {
    name: '',
    tagline: '',
    description: '',
    industry: '',
    targetAudience: '',
  },
  branding: {
    primaryColor: '#0f172a',
    secondaryColor: '#64748b',
    accentColor: '#3b82f6',
    surfaceColor: '#ffffff',
    fontHeading: 'Inter',
    fontBody: 'Inter',
    logoUrl: '',
    style: 'minimal',
  },
  sections: [],
  aiPrompt: '',
  referenceUrls: [],
  navigation: {
    navbarStyle: undefined,
    navbarPosition: undefined,
    footerStyle: undefined,
    socialLinks: [],
  },
};

export function GenerationForm({
  projectId,
  onSubmit,
  isGenerating = false,
}: GenerationFormProps) {
  const { data: project, isLoading: isProjectLoading } = useProject(projectId);
  const updateProject = useUpdateProject(projectId);

  const form = useForm<GenerationConfigFormValues>({
    resolver: zodResolver(generationConfigSchema),
    defaultValues: DEFAULT_VALUES,
    mode: 'onBlur',
  });

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isValid, isDirty },
  } = form;

  // Populate form from existing project data
  useEffect(() => {
    if (project?.generation_config) {
      const config = project.generation_config;
      reset({
        siteType: config.siteType,
        business: {
          name: config.business.name || '',
          tagline: config.business.tagline || '',
          description: config.business.description || '',
          industry: config.business.industry || '',
          targetAudience: config.business.targetAudience || '',
        },
        branding: {
          primaryColor: config.branding.primaryColor || '#0f172a',
          secondaryColor: config.branding.secondaryColor || '#64748b',
          accentColor: config.branding.accentColor || '#3b82f6',
          surfaceColor: config.branding.surfaceColor || '#ffffff',
          fontHeading: config.branding.fontHeading || 'Inter',
          fontBody: config.branding.fontBody || 'Inter',
          logoUrl: config.branding.logoUrl || '',
          style: config.branding.style || 'minimal',
        },
        sections: config.sections.map((s, i) => ({
          id: s.id || `section-${i}-${Date.now()}`,
          type: s.type,
          content: s.content || {},
          items: s.items,
          variant: s.variant,
          order: s.order ?? i,
        })),
        aiPrompt: config.aiPrompt || '',
        referenceUrls: config.referenceUrls || [],
        navigation: config.navigation || {
          navbarStyle: undefined,
          navbarPosition: undefined,
          footerStyle: undefined,
          socialLinks: [],
        },
      });
    }
  }, [project, reset]);

  // Auto-save draft when values change (debounced via blur mode)
  const handleAutoSave = useCallback(async () => {
    if (!isDirty || isGenerating) return;

    const values = form.getValues();
    try {
      await updateProject.mutateAsync({
        generation_config: {
          ...values,
          aiPrompt: values.aiPrompt || '',
          sections: values.sections.map((s, i) => ({
            ...s,
            order: i,
          })),
        } as GenerationConfig,
      });
    } catch {
      // Silent fail on auto-save; user can still submit
    }
  }, [isDirty, isGenerating, form, updateProject]);

  const onFormSubmit = useCallback(
    (values: GenerationConfigFormValues) => {
      const config: GenerationConfig = {
        ...values,
        aiPrompt: values.aiPrompt || '',
        sections: values.sections.map((s, i) => ({
          ...s,
          order: i,
        })),
      };

      onSubmit(config);
    },
    [onSubmit]
  );

  if (isProjectLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <Tabs defaultValue="business" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="business" className="text-xs sm:text-sm">
            Business
            {errors.business && (
              <span className="ml-1.5 inline-flex h-2 w-2 rounded-full bg-destructive" />
            )}
          </TabsTrigger>
          <TabsTrigger value="branding" className="text-xs sm:text-sm">
            Branding
            {errors.branding && (
              <span className="ml-1.5 inline-flex h-2 w-2 rounded-full bg-destructive" />
            )}
          </TabsTrigger>
          <TabsTrigger value="sections" className="text-xs sm:text-sm">
            Sections
            {errors.sections && (
              <span className="ml-1.5 inline-flex h-2 w-2 rounded-full bg-destructive" />
            )}
          </TabsTrigger>
          <TabsTrigger value="layout" className="text-xs sm:text-sm">
            Layout
          </TabsTrigger>
          <TabsTrigger value="ai" className="text-xs sm:text-sm">
            AI Prompt
          </TabsTrigger>
        </TabsList>

        <TabsContent value="business">
          <Card>
            <CardContent className="pt-6">
              <BusinessInfoSection
                register={register}
                errors={errors}
                industryValue={watch('business.industry')}
                onIndustryChange={(value) =>
                  setValue('business.industry', value, { shouldValidate: true })
                }
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branding">
          <Card>
            <CardContent className="pt-6">
              <BrandingSection
                register={register}
                setValue={setValue}
                watch={watch}
                errors={errors}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sections">
          <Card>
            <CardContent className="pt-6">
              <ContentSections
                control={control}
                register={register}
                setValue={setValue}
                watch={watch}
                errors={errors}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="layout">
          <Card>
            <CardContent className="pt-6">
              <NavigationSection
                control={control}
                setValue={setValue}
                watch={watch}
                errors={errors}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai">
          <Card>
            <CardContent className="pt-6">
              <AiPromptSection
                register={register}
                setValue={setValue}
                watch={watch}
                errors={errors}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Separator />

      {/* Form Actions */}
      <div className="flex items-center justify-between gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={handleAutoSave}
          disabled={!isDirty || updateProject.isPending || isGenerating}
        >
          {updateProject.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Draft'
          )}
        </Button>

        <Button
          type="submit"
          size="lg"
          disabled={isGenerating}
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Site
            </>
          )}
        </Button>
      </div>

      {/* Global Validation Errors */}
      {Object.keys(errors).length > 0 && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4">
          <p className="text-sm font-medium text-destructive">
            Please fix the following errors before generating:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-destructive">
            {errors.business?.name && <li>Business: {errors.business.name.message}</li>}
            {errors.business?.description && (
              <li>Business: {errors.business.description.message}</li>
            )}
            {errors.business?.industry && (
              <li>Business: {errors.business.industry.message}</li>
            )}
            {errors.business?.targetAudience && (
              <li>Business: {errors.business.targetAudience.message}</li>
            )}
            {errors.branding?.style && <li>Branding: {errors.branding.style.message}</li>}
            {errors.sections && !Array.isArray(errors.sections) && (
              <li>Sections: {errors.sections.message}</li>
            )}
            {errors.sections?.root && (
              <li>Sections: {errors.sections.root.message}</li>
            )}
          </ul>
        </div>
      )}
    </form>
  );
}
