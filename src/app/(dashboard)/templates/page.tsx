'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Loader2,
  Sparkles,
  ArrowRight,
  Tag,
  Check,
  Eye,
} from 'lucide-react';
import {
  PREMIUM_TEMPLATES,
  TEMPLATE_CATEGORIES,
  type PremiumTemplate,
} from '@/lib/templates/premium-templates';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TemplatePreviewModal } from '@/components/templates/template-preview-modal';

export default function TemplatesPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] =
    useState<PremiumTemplate | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [navigatingTemplate, setNavigatingTemplate] =
    useState<PremiumTemplate | null>(null);

  const filteredTemplates =
    selectedCategory === 'All'
      ? PREMIUM_TEMPLATES
      : PREMIUM_TEMPLATES.filter((t) => t.category === selectedCategory);

  const handleUseTemplate = async (template: PremiumTemplate) => {
    if (loadingId) return;
    setLoadingId(template.id);
    setNavigatingTemplate(template);
    // Close the preview modal immediately for a cleaner transition
    setIsPreviewOpen(false);

    try {
      const res = await fetch('/api/templates/use', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId: template.id }),
      });
      if (!res.ok) throw new Error('Failed to create project from template');
      const { projectId } = await res.json();
      router.push(`/projects/${projectId}`);
    } catch (err) {
      console.error(err);
      setLoadingId(null);
      setNavigatingTemplate(null);
    }
  };

  const handlePreview = (template: PremiumTemplate) => {
    setPreviewTemplate(template);
    setIsPreviewOpen(true);
  };

  const handleClosePreview = () => {
    setIsPreviewOpen(false);
    setTimeout(() => setPreviewTemplate(null), 300);
  };

  return (
    <>
      {/* Full-screen loading overlay when navigating to editor */}
      {navigatingTemplate && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/95 backdrop-blur-md animate-in fade-in duration-300">
          <div className="flex flex-col items-center gap-6 text-center px-6">
            {/* Animated spinner ring */}
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-[3px] border-violet-500/20 border-t-violet-500 animate-spin" />
              <Sparkles className="absolute inset-0 m-auto h-6 w-6 text-violet-500 animate-pulse" />
            </div>

            <div className="space-y-2">
              <h2 className="text-lg sm:text-xl font-semibold text-foreground">
                Setting up your project...
              </h2>
              <p className="text-sm text-muted-foreground max-w-sm">
                Loading{' '}
                <span className="font-medium text-violet-500">
                  {navigatingTemplate.name}
                </span>{' '}
                into the editor. AI generation will start automatically.
              </p>
            </div>

            {/* Animated dots */}
            <div className="flex gap-1.5">
              <div className="w-2 h-2 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: '0s' }} />
              <div className="w-2 h-2 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: '0.15s' }} />
              <div className="w-2 h-2 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: '0.3s' }} />
            </div>
          </div>
        </div>
      )}

      <div className="space-y-5 sm:space-y-8">
        {/* Header */}
        <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-5 sm:p-8 text-white">
          <div className="absolute -top-20 -right-20 w-48 sm:w-64 h-48 sm:h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-10 -left-10 w-36 sm:w-48 h-36 sm:h-48 bg-white/5 rounded-full blur-2xl" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-300" />
              <span className="text-xs sm:text-sm font-medium text-white/80 uppercase tracking-wider">
                Premium Templates
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-3">
              Launch with a $10,000 Design
            </h1>
            <p className="text-white/70 text-sm sm:text-lg max-w-2xl leading-relaxed">
              Choose a professionally designed template, customize it with your
              business details, and let AI generate a stunning website in seconds.
            </p>
          </div>
        </div>

        {/* Category filter */}
        <div className="relative">
          <div className="-mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto scrollbar-none">
            <div className="flex gap-2 min-w-max sm:min-w-0 sm:flex-wrap pb-2">
              {TEMPLATE_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 sm:px-4 py-2 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap min-h-[36px] sm:min-h-[auto] ${
                    selectedCategory === cat
                      ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/25'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <div className="absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none sm:hidden" />
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="group relative flex flex-col rounded-xl sm:rounded-2xl border border-border bg-card overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/10 hover:border-violet-500/30 active:scale-[0.99]"
              onMouseEnter={() => setHoveredId(template.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              {/* Preview gradient */}
              <div
                className={`relative h-40 sm:h-40 bg-gradient-to-br ${template.previewGradient} flex items-center justify-center overflow-hidden`}
              >
                <div
                  className="absolute -top-8 -right-8 w-24 sm:w-32 h-24 sm:h-32 rounded-full blur-2xl opacity-40"
                  style={{ backgroundColor: template.accentColor }}
                />
                <div
                  className="absolute -bottom-8 -left-8 w-20 sm:w-24 h-20 sm:h-24 rounded-full blur-2xl opacity-30"
                  style={{ backgroundColor: template.accentColor }}
                />

                <div className="relative z-10 text-center px-4">
                  <p className="text-white/30 text-[10px] sm:text-xs uppercase tracking-widest font-medium mb-1">
                    Template
                  </p>
                  <p className="text-white font-bold text-base sm:text-lg leading-tight">
                    {template.name}
                  </p>
                  <div className="flex items-center justify-center gap-1 mt-1.5 sm:mt-2">
                    <div
                      className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ring-2 ring-white/20"
                      style={{ backgroundColor: template.accentColor }}
                    />
                    <span className="text-white/60 text-[10px] sm:text-xs">
                      {template.style}
                    </span>
                  </div>
                </div>

                <div
                  className={`absolute inset-0 bg-black/50 items-center justify-center gap-3 transition-opacity duration-200 hidden sm:flex ${
                    hoveredId === template.id ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  <button
                    onClick={() => handlePreview(template)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white/10 backdrop-blur-sm text-white border border-white/20 rounded-full text-sm font-semibold hover:bg-white/20 transition-all duration-200 hover:scale-105"
                  >
                    <Eye className="h-4 w-4" />
                    Preview
                  </button>
                  <button
                    onClick={() => handleUseTemplate(template)}
                    disabled={loadingId !== null}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white text-gray-900 rounded-full text-sm font-semibold hover:bg-white/90 transition-all duration-200 hover:scale-105 disabled:opacity-50"
                  >
                    {loadingId === template.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    Use
                  </button>
                </div>
              </div>

              {/* Card body */}
              <div className="flex flex-col flex-1 p-3.5 sm:p-4 gap-2.5 sm:gap-3">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-semibold text-sm sm:text-base text-foreground leading-tight">
                      {template.name}
                    </h3>
                    <Badge
                      variant="outline"
                      className="text-[10px] sm:text-xs flex-shrink-0"
                    >
                      {template.category}
                    </Badge>
                  </div>
                  <p className="text-xs sm:text-xs text-muted-foreground leading-relaxed line-clamp-2">
                    {template.description}
                  </p>
                </div>

                <div className="flex flex-wrap gap-1">
                  {template.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-md bg-muted text-muted-foreground text-[10px] sm:text-xs"
                    >
                      <Tag className="h-2.5 w-2.5 sm:h-2.5 sm:w-2.5" />
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="flex flex-wrap gap-x-3 gap-y-0.5 sm:block sm:space-y-1 pt-1 border-t border-border">
                  {[
                    'Scroll animations',
                    'Mobile responsive',
                    'SEO optimized',
                  ].map((feat) => (
                    <div
                      key={feat}
                      className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs text-muted-foreground"
                    >
                      <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-green-500 flex-shrink-0" />
                      {feat}
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 mt-auto pt-1">
                  <Button
                    onClick={() => handlePreview(template)}
                    variant="outline"
                    className="flex-1 h-10 sm:h-9 text-xs sm:text-sm"
                    size="sm"
                  >
                    <Eye className="mr-1.5 h-3.5 w-3.5 sm:h-3.5 sm:w-3.5" />
                    Preview
                  </Button>
                  <Button
                    onClick={() => handleUseTemplate(template)}
                    disabled={loadingId !== null}
                    className="flex-1 h-10 sm:h-9 text-xs sm:text-sm bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white border-0"
                    size="sm"
                  >
                    {loadingId === template.id ? (
                      <>
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 sm:h-3.5 sm:w-3.5 animate-spin" />
                        <span className="hidden sm:inline">Creating...</span>
                        <span className="sm:hidden">...</span>
                      </>
                    ) : (
                      <>
                        Use
                        <ArrowRight className="ml-1.5 h-3.5 w-3.5 sm:h-3.5 sm:w-3.5" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="text-center py-12 sm:py-16 text-muted-foreground">
            <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-3 opacity-30" />
            <p className="text-sm sm:text-base">
              No templates in this category yet. More coming soon!
            </p>
          </div>
        )}

        <TemplatePreviewModal
          template={previewTemplate}
          isOpen={isPreviewOpen}
          onClose={handleClosePreview}
          onUseTemplate={handleUseTemplate}
          isLoading={loadingId !== null}
        />
      </div>
    </>
  );
}
