'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import {
  MousePointerClick,
  ChevronDown,
  Save,
  Trash2,
  Undo2,
  Redo2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useVisualEditorStore } from '@/stores/visual-editor-store';
import { sendToPreviewIframe } from '@/lib/visual-editor/iframe-ref';
import { ColorPicker } from './color-picker';
import { SpacingEditor } from './spacing-editor';
import { TypographyControls } from './typography-controls';
import { EffectsControls } from './effects-controls';
import { ImageReplacer } from './image-replacer';

type SheetState = 'collapsed' | 'peek' | 'half' | 'full';

const COLLAPSED_HEIGHT = 44;
const PEEK_HEIGHT = 88;
const HALF_RATIO = 0.45;
const FULL_RATIO = 0.85;

interface MobilePropertiesSheetProps {
  onSave: () => void;
}

export function MobilePropertiesSheet({ onSave }: MobilePropertiesSheetProps) {
  const [sheetState, setSheetState] = useState<SheetState>('collapsed');
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef(0);
  const dragStartHeight = useRef(COLLAPSED_HEIGHT);
  const currentHeight = useRef(COLLAPSED_HEIGHT);
  const isDragging = useRef(false);

  const {
    selectedElement,
    propertiesPanelTab,
    setPropertiesPanelTab,
    pendingChanges,
    isSaving,
    clearPendingChanges,
    addPendingChange,
    undo,
    redo,
    undoStack,
    redoStack,
  } = useVisualEditorStore();

  // Auto-expand to peek when element is selected, collapse when deselected
  useEffect(() => {
    if (selectedElement && sheetState === 'collapsed') {
      setSheetState('peek');
    } else if (!selectedElement && sheetState !== 'collapsed') {
      setSheetState('collapsed');
    }
  }, [selectedElement]); // eslint-disable-line react-hooks/exhaustive-deps

  const getHeightForState = useCallback((state: SheetState) => {
    const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
    switch (state) {
      case 'collapsed':
        return COLLAPSED_HEIGHT;
      case 'peek':
        return PEEK_HEIGHT;
      case 'half':
        return vh * HALF_RATIO;
      case 'full':
        return vh * FULL_RATIO;
    }
  }, []);

  // Touch drag handling
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      isDragging.current = true;
      dragStartY.current = e.touches[0].clientY;
      dragStartHeight.current = getHeightForState(sheetState);
      currentHeight.current = dragStartHeight.current;
      if (sheetRef.current) {
        sheetRef.current.style.transition = 'none';
      }
    },
    [sheetState, getHeightForState]
  );

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current || !sheetRef.current) return;
    const dy = dragStartY.current - e.touches[0].clientY;
    const maxH =
      (typeof window !== 'undefined' ? window.innerHeight : 800) * FULL_RATIO;
    const newHeight = Math.max(COLLAPSED_HEIGHT, Math.min(maxH, dragStartHeight.current + dy));
    currentHeight.current = newHeight;
    sheetRef.current.style.height = `${newHeight}px`;
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging.current || !sheetRef.current) return;
    isDragging.current = false;
    sheetRef.current.style.transition =
      'height 0.3s cubic-bezier(0.4, 0, 0.2, 1)';

    const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
    const h = currentHeight.current;

    // Snap to nearest state
    const snapPoints: { state: SheetState; height: number }[] = [
      { state: 'collapsed', height: COLLAPSED_HEIGHT },
      { state: 'peek', height: PEEK_HEIGHT },
      { state: 'half', height: vh * HALF_RATIO },
      { state: 'full', height: vh * FULL_RATIO },
    ];

    let closest = snapPoints[0];
    let minDist = Infinity;
    for (const sp of snapPoints) {
      const dist = Math.abs(h - sp.height);
      if (dist < minDist) {
        minDist = dist;
        closest = sp;
      }
    }

    // If no element selected, don't snap above peek
    if (
      !selectedElement &&
      closest.state !== 'collapsed' &&
      closest.state !== 'peek'
    ) {
      closest = snapPoints[0]; // collapse
    }

    setSheetState(closest.state);
    currentHeight.current = closest.height;
  }, [selectedElement]);

  // Sync currentHeight when state changes programmatically
  useEffect(() => {
    currentHeight.current = getHeightForState(sheetState);
  }, [sheetState, getHeightForState]);

  // Style change handlers
  const sendToIframe = useCallback((property: string, value: string) => {
    sendToPreviewIframe({ type: 'sitecraft:apply-style', property, value });
  }, []);

  const handleStyleChange = useCallback(
    (property: string, value: string) => {
      if (!selectedElement) return;
      sendToIframe(property, value);
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

  const handleTapHeader = useCallback(() => {
    if (!selectedElement) return;
    switch (sheetState) {
      case 'collapsed':
        setSheetState('peek');
        break;
      case 'peek':
        setSheetState('half');
        break;
      case 'half':
        setSheetState('full');
        break;
      case 'full':
        setSheetState('half');
        break;
    }
  }, [sheetState, selectedElement]);

  const sheetHeight = getHeightForState(sheetState);

  return (
    <div
      ref={sheetRef}
      className="absolute bottom-0 left-0 right-0 bg-background border-t border-border/50 rounded-t-2xl shadow-[0_-4px_24px_rgba(0,0,0,0.12)] z-50 flex flex-col overflow-hidden safe-area-bottom"
      style={{
        height: sheetHeight,
        transition: isDragging.current
          ? 'none'
          : 'height 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {/* Drag handle */}
      <div
        className="flex items-center justify-center pt-2 pb-1 cursor-grab active:cursor-grabbing flex-shrink-0 touch-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
      </div>

      {/* Header bar */}
      <div
        className="flex items-center justify-between px-3 pb-1.5 flex-shrink-0"
        onClick={handleTapHeader}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {selectedElement ? (
            <>
              <span className="text-[11px] font-mono bg-violet-500/10 text-violet-600 dark:text-violet-400 px-1.5 py-0.5 rounded flex-shrink-0">
                &lt;{selectedElement.tagName}&gt;
              </span>
              {selectedElement.textContent && (
                <span className="text-[11px] text-muted-foreground truncate">
                  {selectedElement.textContent}
                </span>
              )}
            </>
          ) : (
            <div className="flex items-center gap-1.5">
              <MousePointerClick className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-[11px] text-muted-foreground">
                Tap an element to edit
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-0.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={undo}
            disabled={undoStack.length === 0}
          >
            <Undo2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={redo}
            disabled={redoStack.length === 0}
          >
            <Redo2 className="h-3.5 w-3.5" />
          </Button>
          {sheetState !== 'collapsed' && sheetState !== 'peek' && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                setSheetState('collapsed');
              }}
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Tab content - only when expanded past peek */}
      {selectedElement && (sheetState === 'half' || sheetState === 'full') && (
        <div className="flex flex-1 flex-col overflow-hidden min-h-0">
          <Tabs
            value={propertiesPanelTab}
            onValueChange={(v) =>
              setPropertiesPanelTab(
                v as 'style' | 'spacing' | 'typography' | 'effects' | 'link'
              )
            }
            className="flex-1 flex flex-col overflow-hidden"
          >
            <div className="px-3 flex-shrink-0">
              <TabsList className="w-full h-8">
                <TabsTrigger value="style" className="flex-1 text-[10px] h-7">
                  Style
                </TabsTrigger>
                <TabsTrigger
                  value="spacing"
                  className="flex-1 text-[10px] h-7"
                >
                  Space
                </TabsTrigger>
                <TabsTrigger
                  value="typography"
                  className="flex-1 text-[10px] h-7"
                >
                  Type
                </TabsTrigger>
                <TabsTrigger
                  value="effects"
                  className="flex-1 text-[10px] h-7"
                >
                  FX
                </TabsTrigger>
              </TabsList>
            </div>

            <ScrollArea className="flex-1 min-h-0">
              <div className="px-3 py-2">
                <TabsContent value="style" className="mt-0 space-y-3">
                  {selectedElement.isImage && (
                    <ImageReplacer
                      currentSrc={selectedElement.imageSrc}
                      cssPath={selectedElement.cssPath}
                    />
                  )}
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

      {/* Quick actions in peek mode */}
      {selectedElement && sheetState === 'peek' && (
        <div className="flex items-center gap-2 px-3 pb-1 flex-shrink-0">
          <button
            onClick={() => setSheetState('half')}
            className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg bg-muted text-[11px] font-medium text-muted-foreground active:bg-muted/80 transition-colors"
          >
            Edit Styles
          </button>
          {selectedElement.isTextEditable && (
            <button
              onClick={() => {
                sendToPreviewIframe({ type: 'sitecraft:trigger-inline-edit' });
                setSheetState('collapsed');
              }}
              className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg bg-violet-500/10 text-[11px] font-medium text-violet-600 dark:text-violet-400 active:bg-violet-500/20 transition-colors"
            >
              Edit Text
            </button>
          )}
        </div>
      )}

      {/* Save/Discard footer */}
      {pendingChanges.length > 0 && sheetState !== 'collapsed' && (
        <div className="border-t px-3 py-2 flex items-center gap-2 bg-muted/20 flex-shrink-0">
          <span className="text-[10px] text-muted-foreground flex-shrink-0">
            {pendingChanges.length} change
            {pendingChanges.length > 1 ? 's' : ''}
          </span>
          <div className="flex gap-1.5 flex-1 justify-end">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-[10px] px-2"
              onClick={clearPendingChanges}
              disabled={isSaving}
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Discard
            </Button>
            <Button
              size="sm"
              className="h-7 text-[10px] px-2"
              onClick={onSave}
              disabled={isSaving}
            >
              <Save className="h-3 w-3 mr-1" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
