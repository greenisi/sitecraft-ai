'use client';

import { useState, useCallback, useMemo } from 'react';
import type {
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  SECTION_TYPES,
  SECTION_LABELS,
  SECTION_VARIANTS,
  SECTION_MAX_ITEMS,
  SECTION_ITEM_TYPE,
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

// Item field definitions per section type
const ITEM_FIELDS: Record<string, { key: string; label: string; type: 'input' | 'textarea' }[]> = {
  faq: [
    { key: 'question', label: 'Question', type: 'input' },
    { key: 'answer', label: 'Answer', type: 'textarea' },
  ],
  testimonial: [
    { key: 'name', label: 'Name', type: 'input' },
    { key: 'role', label: 'Role/Company', type: 'input' },
    { key: 'quote', label: 'Quote', type: 'textarea' },
  ],
  feature: [
    { key: 'title', label: 'Title', type: 'input' },
    { key: 'description', label: 'Description', type: 'textarea' },
  ],
  team: [
    { key: 'name', label: 'Name', type: 'input' },
    { key: 'role', label: 'Role', type: 'input' },
    { key: 'bio', label: 'Bio', type: 'textarea' },
  ],
  pricing: [
    { key: 'name', label: 'Plan Name', type: 'input' },
    { key: 'price', label: 'Price', type: 'input' },
    { key: 'features', label: 'Features (comma separated)', type: 'textarea' },
  ],
  stat: [
    { key: 'number', label: 'Number/Value', type: 'input' },
    { key: 'label', label: 'Label', type: 'input' },
  ],
};

interface ContentSectionsProps {
  control: Control<GenerationConfigFormValues>;
  register: UseFormRegister<GenerationConfigFormValues>;
  setValue: UseFormSetValue<GenerationConfigFormValues>;
  watch: UseFormWatch<GenerationConfigFormValues>;
  errors: FieldErrors<GenerationConfigFormValues>;
}

interface SortableItemProps {
  id: string;
  index: number;
  sectionType: SectionType;
  register: UseFormRegister<GenerationConfigFormValues>;
  setValue: UseFormSetValue<GenerationConfigFormValues>;
  watch: UseFormWatch<GenerationConfigFormValues>;
  onRemove: () => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

function SortableSectionItem({
  id,
  index,
  sectionType,
  register,
  setValue,
  watch,
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
  const variants = SECTION_VARIANTS[sectionType];
  const currentVariant = watch(`sections.${index}.variant`);
  const itemType = SECTION_ITEM_TYPE[sectionType];
  const maxItems = SECTION_MAX_ITEMS[sectionType] || 0;
  const currentItems = watch(`sections.${index}.items`) || [];

  const handleAddItem = useCallback(() => {
    if (!itemType || currentItems.length >= maxItems) return;
    const newItems = [
      ...currentItems,
      { _type: itemType } as Record<string, string>,
    ];
    setValue(`sections.${index}.items` as `sections.${number}.content`, newItems as unknown as Record<string, string>, {
      shouldValidate: true,
    });
  }, [itemType, currentItems, maxItems, setValue, index]);

  const handleRemoveItem = useCallback(
    (itemIndex: number) => {
      const newItems = currentItems.filter((_: unknown, i: number) => i !== itemIndex);
      setValue(`sections.${index}.items` as `sections.${number}.content`, newItems as unknown as Record<string, string>, {
        shouldValidate: true,
      });
    },
    [currentItems, setValue, index]
  );

  const itemFields = itemType ? ITEM_FIELDS[itemType] : null;

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
          {currentVariant && (
            <Badge variant="secondary" className="text-[10px]">
              {currentVariant}
            </Badge>
          )}
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
      {isExpanded && (
        <div className="border-t px-4 py-4 space-y-4">
          {/* Variant Selector */}
          {variants && variants.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Layout Variant</Label>
              <Select
                value={currentVariant || ''}
                onValueChange={(val) =>
                  setValue(`sections.${index}.variant`, val || undefined, {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Auto (AI decides)" />
                </SelectTrigger>
                <SelectContent>
                  {variants.map((v) => (
                    <SelectItem key={v.value} value={v.value}>
                      {v.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground">
                Leave blank to let AI choose the best layout.
              </p>
            </div>
          )}

          {/* Content fields */}
          {contentFields.length > 0 && (
            <>
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
            </>
          )}

          {/* Section Items (FAQ, testimonials, features, team, pricing, stats) */}
          {itemFields && maxItems > 0 && (
            <div className="space-y-3 mt-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium capitalize">
                  {itemType} Items
                </Label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {currentItems.length} / {maxItems}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={handleAddItem}
                    disabled={currentItems.length >= maxItems}
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    Add
                  </Button>
                </div>
              </div>

              {currentItems.length > 0 ? (
                <div className="space-y-3">
                  {currentItems.map((item: Record<string, string>, itemIdx: number) => (
                    <div
                      key={itemIdx}
                      className="rounded-md border bg-muted/30 p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">
                          #{itemIdx + 1}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-destructive"
                          onClick={() => handleRemoveItem(itemIdx)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      {itemFields.map((field) => (
                        <div key={field.key} className="space-y-1">
                          <Label className="text-xs text-muted-foreground">
                            {field.label}
                          </Label>
                          {field.type === 'input' ? (
                            <Input
                              placeholder={field.label}
                              defaultValue={item[field.key] || ''}
                              onChange={(e) => {
                                const newItems = [...currentItems];
                                newItems[itemIdx] = {
                                  ...newItems[itemIdx],
                                  [field.key]: e.target.value,
                                };
                                setValue(
                                  `sections.${index}.items` as `sections.${number}.content`,
                                  newItems as unknown as Record<string, string>,
                                  { shouldValidate: true }
                                );
                              }}
                              className="h-8 text-sm"
                            />
                          ) : (
                            <Textarea
                              placeholder={field.label}
                              defaultValue={item[field.key] || ''}
                              onChange={(e) => {
                                const newItems = [...currentItems];
                                newItems[itemIdx] = {
                                  ...newItems[itemIdx],
                                  [field.key]: e.target.value,
                                };
                                setValue(
                                  `sections.${index}.items` as `sections.${number}.content`,
                                  newItems as unknown as Record<string, string>,
                                  { shouldValidate: true }
                                );
                              }}
                              rows={2}
                              className="text-sm"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-2">
                  No items added. AI will generate sample {itemType} content.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ContentSections({
  control,
  register,
  setValue,
  watch,
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
                  setValue={setValue}
                  watch={watch}
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
