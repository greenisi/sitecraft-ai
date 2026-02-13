'use client';

import { useCallback, useEffect } from 'react';
import { X, MousePointerClick, Save, Trash2, Undo2, Redo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useVisualEditorStore } from '@/stores/visual-editor-store';
import { sendToPreviewIframe } from '@/lib/visual-editor/iframe-ref';
import { ColorPicker } from './color-picker';
import { SpacingEditor } from './spacing-editor';
import { TypographyControls } from './typography-controls';
import { EffectsControls } from './effects-controls';

interface PropertiesPanelProps {
  onSave: () => void;
}

export function PropertiesPanel({ onSave }: PropertiesPanelProps) {
  const {
    selectedElement,
    propertiesPanelTab,
    setPropertiesPanelTab,
    pendingChanges,
    hasUnsavedChanges,
    isSaving,
    exitVisualEditor,
    addPendingChange,
    clearPendingChanges,
    undo,
    redo,
    undoStack,
    redoStack,
    isVisualEditorActive,
  } = useVisualEditorStore();

  // ── Keyboard shortcuts for undo/redo ──────────────────────────────────
  useEffect(() => {
    if (!isVisualEditorActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.ctrlKey || e.metaKey;
      if (!isMod) return;

      // Ctrl+Shift+Z or Ctrl+Y → redo
      if ((e.key === 'z' || e.key === 'Z') && e.shiftKey) {
        e.preventDefault();
        redo();
        return;
      }

      if (e.key === 'y' || e.key === 'Y') {
        e.preventDefault();
        redo();
        return;
      }

      // Ctrl+Z → undo
      if (e.key === 'z' || e.key === 'Z') {
        e.preventDefault();
        undo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisualEditorActive, undo, redo]);

  const sendToIframe = useCallback(
    (property: string, value: string) => {
      sendToPreviewIframe({ type: 'sitecraft:apply-style', property, value });
    },
    []
  );

  const handleStyleChange = useCallback(
    (property: string, value: string) => {
      if (!selectedElement) return;

      // Send live update to iframe
      sendToIframe(property, value);

      // Record pending change
      const styleKey = property as keyof typeof selectedElement.styles;
      addPendingChange({
        type: 'style',
        cssPath: selectedElement.cssPath,
        property,
        oldValue: selectedElement.styles[styleKey] || '',
        newValue: value,
      });
    },
    [selectedElement, sendToIframe, addPendingChange]
  );

  const handleBorderRadiusChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(/[^0-9.]/g, '');
      if (raw) handleStyleChange('borderRadius', `${raw}px`);
    },
    [handleStyleChange]
  );

  const parsePx = (val: string): string => {
    const num = parseFloat(val);
    return isNaN(num) ? '0' : String(Math.round(num));
  };

  // ── Size helpers ──────────────────────────────────────────────────────
  const parseSizeValue = (val: string): string => {
    if (!val || val === 'auto') return '';
    const num = parseFloat(val);
    return isNaN(num) ? '' : String(Math.round(num));
  };

  const handleSizeChange = useCallback(
    (property: 'width' | 'height', rawValue: string) => {
      const cleaned = rawValue.trim();
      if (cleaned === '' || cleaned.toLowerCase() === 'auto') {
        handleStyleChange(property, 'auto');
      } else {
        const numeric = cleaned.replace(/[^0-9.]/g, '');
        if (numeric) handleStyleChange(property, `${numeric}px`);
      }
    },
    [handleStyleChange]
  );

  // ── Border helpers ────────────────────────────────────────────────────
  const parseBorderWidth = (val: string): string => {
    const num = parseFloat(val);
    return isNaN(num) ? '0' : String(Math.round(num));
  };

  const handleBorderStyleChange = useCallback(
    (newStyle: string) => {
      handleStyleChange('borderStyle', newStyle);
      // When switching from 'none' to a visible style, auto-set borderWidth to 1px if currently 0px
      if (newStyle !== 'none' && selectedElement) {
        const currentBorderWidth = selectedElement.styles.borderWidth || '0px';
        if (parseBorderWidth(currentBorderWidth) === '0') {
          handleStyleChange('borderWidth', '1px');
        }
      }
    },
    [handleStyleChange, selectedElement]
  );

  const handleBorderWidthChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(/[^0-9.]/g, '');
      if (raw) handleStyleChange('borderWidth', `${raw}px`);
    },
    [handleStyleChange]
  );

  // ── Close with unsaved-changes guard ──────────────────────────────────
  const handleClose = useCallback(() => {
    if (hasUnsavedChanges()) {
      const confirmed = window.confirm(
        'You have unsaved changes. Are you sure you want to close the visual editor? All changes will be lost.'
      );
      if (!confirmed) return;
    }
    exitVisualEditor();
  }, [hasUnsavedChanges, exitVisualEditor]);

  const borderStyles: { value: string; label: string }[] = [
    { value: 'none', label: 'None' },
    { value: 'solid', label: 'Solid' },
    { value: 'dashed', label: 'Dashed' },
    { value: 'dotted', label: 'Dotted' },
  ];

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <MousePointerClick className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Visual Editor</span>
        </div>
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={undo}
            disabled={undoStack.length === 0}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={redo}
            disabled={redoStack.length === 0}
            title="Redo (Ctrl+Shift+Z)"
          >
            <Redo2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {!selectedElement ? (
        /* Empty state */
        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted mb-4">
            <MousePointerClick className="h-7 w-7 text-muted-foreground/50" />
          </div>
          <p className="text-sm font-medium">No element selected</p>
          <p className="text-xs text-muted-foreground mt-1">
            Click any element in the preview to select it. Double-click text to
            edit it inline.
          </p>
        </div>
      ) : (
        /* Properties editor */
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Selected element info */}
          <div className="border-b px-4 py-2 bg-muted/30">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                &lt;{selectedElement.tagName}&gt;
              </span>
              {selectedElement.isTextEditable && (
                <span className="text-[10px] text-muted-foreground">
                  double-click to edit text
                </span>
              )}
            </div>
            {selectedElement.textContent && (
              <p className="text-xs text-muted-foreground mt-1 truncate">
                {selectedElement.textContent}
              </p>
            )}
          </div>

          {/* Tab content */}
          <Tabs
            value={propertiesPanelTab}
            onValueChange={(v) =>
              setPropertiesPanelTab(v as 'style' | 'spacing' | 'typography' | 'effects')
            }
            className="flex-1 flex flex-col overflow-hidden"
          >
            <div className="px-4 pt-3">
              <TabsList className="w-full">
                <TabsTrigger value="style" className="flex-1 text-xs">
                  Style
                </TabsTrigger>
                <TabsTrigger value="spacing" className="flex-1 text-xs">
                  Spacing
                </TabsTrigger>
                <TabsTrigger value="typography" className="flex-1 text-xs">
                  Type
                </TabsTrigger>
                <TabsTrigger value="effects" className="flex-1 text-xs">
                  FX
                </TabsTrigger>
              </TabsList>
            </div>

            <ScrollArea className="flex-1">
              <div className="px-4 py-3">
                <TabsContent value="style" className="mt-0 space-y-4">
                  <ColorPicker
                    label="Text Color"
                    value={selectedElement.styles.color}
                    onChange={(v) => handleStyleChange('color', v)}
                  />
                  <ColorPicker
                    label="Background"
                    value={selectedElement.styles.backgroundColor}
                    onChange={(v) => handleStyleChange('backgroundColor', v)}
                  />
                  <ColorPicker
                    label="Border"
                    value={selectedElement.styles.borderColor}
                    onChange={(v) => handleStyleChange('borderColor', v)}
                  />

                  {/* Border Style */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">
                      Border Style
                    </Label>
                    <div className="flex gap-0.5 bg-muted rounded-md p-0.5">
                      {borderStyles.map((bs) => (
                        <button
                          key={bs.value}
                          onClick={() => handleBorderStyleChange(bs.value)}
                          className={`flex-1 px-1.5 py-1 rounded text-[10px] font-medium transition-colors ${
                            (selectedElement.styles.borderStyle || 'none') === bs.value
                              ? 'bg-background shadow-sm text-foreground'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {bs.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Border Width */}
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground w-24 flex-shrink-0">
                      Border W.
                    </Label>
                    <div className="flex items-center gap-1.5 flex-1">
                      <input
                        type="range"
                        min="0"
                        max="10"
                        value={parseBorderWidth(selectedElement.styles.borderWidth || '0')}
                        onChange={handleBorderWidthChange}
                        className="flex-1 h-1.5 accent-primary"
                      />
                      <Input
                        value={parseBorderWidth(selectedElement.styles.borderWidth || '0')}
                        onChange={handleBorderWidthChange}
                        className="h-8 text-xs font-mono w-14"
                      />
                      <span className="text-[10px] text-muted-foreground">
                        px
                      </span>
                    </div>
                  </div>

                  {/* Border Radius */}
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground w-24 flex-shrink-0">
                      Radius
                    </Label>
                    <div className="flex items-center gap-1.5 flex-1">
                      <input
                        type="range"
                        min="0"
                        max="50"
                        value={parsePx(selectedElement.styles.borderRadius)}
                        onChange={handleBorderRadiusChange}
                        className="flex-1 h-1.5 accent-primary"
                      />
                      <Input
                        value={parsePx(selectedElement.styles.borderRadius)}
                        onChange={handleBorderRadiusChange}
                        className="h-8 text-xs font-mono w-14"
                      />
                      <span className="text-[10px] text-muted-foreground">
                        px
                      </span>
                    </div>
                  </div>

                  {/* Size (Width & Height) */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Size</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-muted-foreground font-medium w-4">
                          W
                        </span>
                        <Input
                          value={parseSizeValue(selectedElement.styles.width || '')}
                          onChange={(e) => handleSizeChange('width', e.target.value)}
                          className="h-8 text-xs font-mono flex-1"
                          placeholder="auto"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-muted-foreground font-medium w-4">
                          H
                        </span>
                        <Input
                          value={parseSizeValue(selectedElement.styles.height || '')}
                          onChange={(e) => handleSizeChange('height', e.target.value)}
                          className="h-8 text-xs font-mono flex-1"
                          placeholder="auto"
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="spacing" className="mt-0">
                  <SpacingEditor
                    paddingTop={selectedElement.styles.paddingTop}
                    paddingRight={selectedElement.styles.paddingRight}
                    paddingBottom={selectedElement.styles.paddingBottom}
                    paddingLeft={selectedElement.styles.paddingLeft}
                    marginTop={selectedElement.styles.marginTop}
                    marginRight={selectedElement.styles.marginRight}
                    marginBottom={selectedElement.styles.marginBottom}
                    marginLeft={selectedElement.styles.marginLeft}
                    onChange={handleStyleChange}
                  />
                </TabsContent>

                <TabsContent value="typography" className="mt-0">
                  <TypographyControls
                    fontSize={selectedElement.styles.fontSize}
                    fontWeight={selectedElement.styles.fontWeight}
                    fontFamily={selectedElement.styles.fontFamily}
                    lineHeight={selectedElement.styles.lineHeight}
                    letterSpacing={selectedElement.styles.letterSpacing}
                    textAlign={selectedElement.styles.textAlign}
                    onChange={handleStyleChange}
                  />
                </TabsContent>

                <TabsContent value="effects" className="mt-0">
                  <EffectsControls
                    opacity={selectedElement.styles.opacity}
                    boxShadow={selectedElement.styles.boxShadow}
                    display={selectedElement.styles.display}
                    overflow={selectedElement.styles.overflow}
                    cursor={selectedElement.styles.cursor}
                    onChange={handleStyleChange}
                  />
                </TabsContent>
              </div>
            </ScrollArea>
          </Tabs>
        </div>
      )}

      {/* Footer with save/discard */}
      {pendingChanges.length > 0 && (
        <div className="border-t px-4 py-3 space-y-2 bg-muted/20">
          <p className="text-xs text-muted-foreground">
            {pendingChanges.length} unsaved{' '}
            {pendingChanges.length === 1 ? 'change' : 'changes'}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-8 text-xs"
              onClick={clearPendingChanges}
              disabled={isSaving}
            >
              <Trash2 className="h-3 w-3 mr-1.5" />
              Discard
            </Button>
            <Button
              size="sm"
              className="flex-1 h-8 text-xs"
              onClick={onSave}
              disabled={isSaving}
            >
              <Save className="h-3 w-3 mr-1.5" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
