'use client';

import { useCallback } from 'react';
import { X, MousePointerClick, Save, Trash2 } from 'lucide-react';
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
  } = useVisualEditorStore();

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

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <MousePointerClick className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Visual Editor</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={exitVisualEditor}
        >
          <X className="h-4 w-4" />
        </Button>
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
              setPropertiesPanelTab(v as 'style' | 'spacing' | 'typography')
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
