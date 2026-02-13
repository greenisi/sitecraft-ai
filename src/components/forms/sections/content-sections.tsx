'use client';

import { useState, useCallback, useMemo } from 'react';
import type {
  UseFormRegister,
  FieldErrors,
  Control,
} from 'react-hook-form';
import { useFieldArray } from 'react-hook-form';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { GripVertical, Trash2, Plus, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  SECTION_TYPES,
  SECTION_LABELS,
  MAX_SECTIONS,
  type SectionType,
} from '@/lib/utils/constants';
import type { GenerationConfigFormValues } from '@/lib/utils/validators';
import { cn } from '@/lib/utils/cn';

const SECTION_DESCRIPTIONS: Partial<Record<SectionType, string>> = {
  hero: 'The main banner area at the top of your page',
  features: 'Showcase your key features or services',
  pricing: 'Display pricing tiers and plans',
  testimonials: 'Show customer reviews and testimonials',
  cta: 'A call-to-action block to drive conversions',
  contact: 'Contact form or contact information',
  about: 'Tell visitors about your company or team',
  gallery: 'Image gallery or portfolio showcase',
  faq: 'Frequently asked questions section',
  stats: 'Key numbers and statistics',
  team: 'Introduce your team members',
  'blog-preview': 'Preview of latest blog posts',
  'product-grid': 'Grid display of products',
  custom: 'A fully custom section',
};

const SECTION_CONTENT_FIELDS: Record<SectionType, { key: string; label: string; type: 'input' | 'textarea' }[]> = {
  hero: [
    { key: 'heading', label: 'Heading', type: 'input' },
    { key: 'subheading', label: 'Subheading', type: 'input' },
    { key: 'description', label: 'Description', type: 'textarea' },
    { key: 'ctaText', label: 'CTA Button Text', type: 'input' },
  ],
  features: [
    { key: 'heading', label: 'Section Heading', type: 'input' },
    { key: 'description', label: 'Section Description', type: 'textarea' },
  ],
  pricing: [
    { key: 'heading', label: 'Section Heading', type: 'input' },
    { key: 'description', label: 'Section Description', type: 'textarea' },
  ],
  testimonials: [
    { key: 'heading', label: 'Section Heading', type: 'input' },
  ],
  cta: [
    { key: 'heading', label: 'Heading', type: 'input' },
    { key: 'description', label: 'Description', type: 'textarea' },
    { key: 'buttonText', label: 'Button Text', type: 'input' },
  ],
  contact: [
    { key: 'heading', label: 'Section Heading', type: 'input' },
    { key: 'description', label: 'Description', type: 'textarea' },
  ],
  about: [
    { key: 'heading', label: 'Section Heading', type: 'input' },
    { key: 'description', label: 'Description', type: 'textarea' },
  ],
  gallery: [
    { key: 'heading', label: 'Section Heading', type: 'input' },
  ],
  faq: [
    { key: 'heading', label: 'Section Heading', type: 'input' },
  ],
  stats: [
    { key: 'heading', label: 'Section Heading', type: 'input' },
  ],
  team: [
    { key: 'heading', label: 'Section Heading', type: 'input' },
    { key: 'description', label: 'Description', type: 'textarea' },
  ],
  'blog-preview': [
    { key: 'heading', label: 'Section Heading', type: 'input' },
  ],
  'product-grid': [
    { key: 'heading', label: 'Section Heading', type: 'input' },
    { key: 'description', label: 'Description', type: 'textarea' },
  ],
  custom: [
    { key: 'heading', label: 'Section Heading', type: 'input' },
    { key: 'description', label: 'Description', type: 'textarea' },
  ],
};

interface ContentSectionsProps {
  control: Control<GenerationConfigFormValues>;
  register: UseFormRegister<GenerationConfigFormValues>;
  errors: FieldErrors<GenerationConfigFormValues>;
}

interface SortableItemProps {
  id: string;
  index: number;
  sectionType: SectionType;
  register: UseFormRegister<GenerationConfigFormValues>;
  onRemove: () => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

function SortableSectionItem({
  id,
  index,
  sectionType,
  register,
  onRemove,
  isExpanded,
  onToggleExpand,
}: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    transition,
  };

  const contentFields = SECTION_CONTENT_FIELDS[sectionType] || [];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'rounded-lg border bg-card transition-shadow',
        isDragging && 'shadow-lg ring-2 ring-primary/20 z-50'
      )}
    >
      {/* Section Header */}
      <div className="flex items-center gap-2 p-3">
        <button
          type="button"
          className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={onToggleExpand}
          className="flex flex-1 items-center gap-2 text-left"
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="font-medium text-sm">
            {SECTION_LABELS[sectionType]}
          </span>
          <Badge variant="outline" className="text-xs">
            {sectionType}
          </Badge>
        </button>

        <span className="text-xs text-muted-foreground tabular-nums">
          #{index + 1}
        </span>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={onRemove}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Expandable Content Fields */}
      {isExpanded && contentFields.length > 0 && (
        <div className="border-t px-4 py-4 space-y-4">
          <p className="text-xs text-muted-foreground">
            Provide optional content hints. Leave blank to let AI generate content.
          </p>
          {contentFields.map((field) => (
            <div key={field.key} className="space-y-1.5">
              <Label htmlFor={`sections.${index}.content.${field.key}`} className="text-sm">
                {field.label}
              </Label>
              {field.type === 'input' ? (
                <Input
                  id={`sections.${index}.content.${field.key}`}
                  placeholder={`Optional ${field.label.toLowerCase()}...`}
                  {...register(
                    `sections.${index}.content.${field.key}` as `sections.${number}.content.${string}`
                  )}
                />
              ) : (
                <Textarea
                  id={`sections.${index}.content.${field.key}`}
                  placeholder={`Optional ${field.label.toLowerCase()}...`}
                  rows={2}
                  {...register(
                    `sections.${index}.content.${field.key}` as `sections.${number}.content.${string}`
                  )}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ContentSections({
  control,
  register,
  errors,
}: ContentSectionsProps) {
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'sections',
  });

  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const usedSectionTypes = useMemo(
    () => new Set(fields.map((f) => f.type)),
    [fields]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = fields.findIndex((f) => f.id === active.id);
      const newIndex = fields.findIndex((f) => f.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        move(oldIndex, newIndex);
      }
    },
    [fields, move]
  );

  const handleAddSection = useCallback(
    (type: SectionType) => {
      const newId = `section-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      append({
        id: newId,
        type,
        content: {},
        order: fields.length,
      });
      setExpandedSections((prev) => new Set(prev).add(newId));
      setAddDialogOpen(false);
    },
    [append, fields.length]
  );

  const handleRemove = useCallback(
    (index: number, id: string) => {
      remove(index);
      setExpandedSections((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    },
    [remove]
  );

  const toggleExpand = useCallback((id: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const canAddMore = fields.length < MAX_SECTIONS;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">Page Sections</h3>
          <p className="text-sm text-muted-foreground">
            Add and arrange the sections for your website. Drag to reorder.
          </p>
        </div>
        <Badge variant="outline" className="shrink-0">
          {fields.length} / {MAX_SECTIONS}
        </Badge>
      </div>

      {/* Sections List */}
      {fields.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={fields.map((f) => f.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {fields.map((field, index) => (
                <SortableSectionItem
                  key={field.id}
                  id={field.id}
                  index={index}
                  sectionType={field.type}
                  register={register}
                  onRemove={() => handleRemove(index, field.id)}
                  isExpanded={expandedSections.has(field.id)}
                  onToggleExpand={() => toggleExpand(field.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Plus className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">No sections added</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Add sections to define the structure of your website.
          </p>
        </div>
      )}

      {errors.sections && !Array.isArray(errors.sections) && (
        <p className="text-sm text-destructive">{errors.sections.message}</p>
      )}
      {errors.sections?.root && (
        <p className="text-sm text-destructive">{errors.sections.root.message}</p>
      )}

      {/* Add Section Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={!canAddMore}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Section
            {!canAddMore && (
              <span className="ml-2 text-xs text-muted-foreground">
                (max {MAX_SECTIONS})
              </span>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add a Section</DialogTitle>
            <DialogDescription>
              Choose a section type to add to your page layout.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2 max-h-[60vh] overflow-y-auto py-2">
            {SECTION_TYPES.map((type) => {
              const isCustom = type === 'custom';
              const alreadyAdded = !isCustom && usedSectionTypes.has(type);
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleAddSection(type)}
                  disabled={alreadyAdded}
                  className={cn(
                    'flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-all hover:border-primary/50 hover:bg-accent/50',
                    alreadyAdded && 'cursor-not-allowed opacity-50'
                  )}
                >
                  <div className="flex w-full items-center justify-between">
                    <span className="text-sm font-medium">
                      {SECTION_LABELS[type]}
                    </span>
                    {alreadyAdded && (
                      <Badge variant="secondary" className="text-[10px]">
                        Added
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground leading-snug">
                    {SECTION_DESCRIPTIONS[type]}
                  </span>
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
