'use client';

import { Undo2, Redo2, SlidersHorizontal, Save, Layers, Link2, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useVisualEditorStore } from '@/stores/visual-editor-store';

interface MobileBottomBarProps {
  onSave: () => void;
}

export function MobileBottomBar({ onSave }: MobileBottomBarProps) {
  const {
    selectedElement,
    isInlineEditing,
    pendingChanges,
    isSaving,
    undo,
    redo,
    undoStack,
    redoStack,
    setStylesDrawerOpen,
    setMobileDrawerInitialTab,
    setImagePickerOpen,
  } = useVisualEditorStore();

  // Hide during inline editing to maximize keyboard space
  if (isInlineEditing) return null;

  const isLinkElement = selectedElement && (
    selectedElement.tagName === 'a' || selectedElement.tagName === 'A' ||
    selectedElement.tagName === 'button' || selectedElement.tagName === 'BUTTON'
  );

  const openDrawerOnTab = (tab: 'style' | 'spacing' | 'typography' | 'effects' | 'link') => {
    setMobileDrawerInitialTab(tab);
    setStylesDrawerOpen(true);
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 h-12 bg-background/95 backdrop-blur-sm border-t border-border/50 flex items-center px-3 gap-2 safe-area-bottom z-50">
      {/* Left: element info or sections button */}
      <div className="flex items-center gap-1.5 min-w-0 flex-1">
        {selectedElement ? (
          <>
            <span className="text-[11px] font-mono bg-violet-500/10 text-violet-600 dark:text-violet-400 px-1.5 py-0.5 rounded flex-shrink-0">
              &lt;{selectedElement.tagName}&gt;
            </span>
            {selectedElement.textContent && (
              <span className="text-[11px] text-muted-foreground truncate">
                {selectedElement.textContent.slice(0, 25)}
              </span>
            )}
          </>
        ) : (
          <button
            onClick={() => setStylesDrawerOpen(true)}
            className="flex items-center gap-1.5 text-[11px] text-muted-foreground active:text-foreground transition-colors"
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Sections</span>
          </button>
        )}
      </div>

      {/* Right: action buttons */}
      <div className="flex items-center gap-0.5 flex-shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={undo}
          disabled={undoStack.length === 0}
        >
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={redo}
          disabled={redoStack.length === 0}
        >
          <Redo2 className="h-4 w-4" />
        </Button>

        {/* Context-aware quick actions */}
        {selectedElement?.isImage && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() =>
              setImagePickerOpen(true, {
                cssPath: selectedElement.cssPath,
                currentSrc: selectedElement.imageSrc || '',
              })
            }
          >
            <ImageIcon className="h-4 w-4" />
          </Button>
        )}
        {isLinkElement && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => openDrawerOnTab('link')}
          >
            <Link2 className="h-4 w-4" />
          </Button>
        )}
        {selectedElement && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => openDrawerOnTab('style')}
          >
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        )}

        {pendingChanges.length > 0 && (
          <Button
            size="sm"
            className="h-8 px-3 text-xs ml-1"
            onClick={onSave}
            disabled={isSaving}
          >
            <Save className="h-3.5 w-3.5 mr-1" />
            {isSaving ? '...' : `Save (${pendingChanges.length})`}
          </Button>
        )}
      </div>
    </div>
  );
}
