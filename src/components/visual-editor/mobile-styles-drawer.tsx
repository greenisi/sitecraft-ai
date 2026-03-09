'use client';

import { useState, useCallback, useEffect } from 'react';
import { X, Trash2, Save, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useVisualEditorStore } from '@/stores/visual-editor-store';
import { sendToPreviewIframe } from '@/lib/visual-editor/iframe-ref';
import { ColorPicker } from './color-picker';
import { SpacingEditor } from './spacing-editor';
import { TypographyControls } from './typography-controls';
import { EffectsControls } from './effects-controls';
import { ImageReplacer } from './image-replacer';
import { SectionManager } from './section-manager';

interface MobileStylesDrawerProps {
  onSave: () => void;
}

type DrawerTab = 'style' | 'spacing' | 'typography' | 'effects' | 'link';

const borderStyles = [
  { value: 'none', label: 'None' },
  { value: 'solid', label: 'Solid' },
  { value: 'dashed', label: 'Dashed' },
  { value: 'dotted', label: 'Dotted' },
];

const quickLinks = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Services', href: '/services' },
  { label: 'Contact', href: '/contact' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Email', href: 'mailto:' },
  { label: 'Phone', href: 'tel:' },
  { label: 'External', href: 'https://' },
];

const parsePx = (val: string): string => {
  const num = parseFloat(val);
  return isNaN(num) ? '0' : String(Math.round(num));
};

const parseSizeValue = (val: string): string => {
  if (!val || val === 'auto') return '';
  const num = parseFloat(val);
  return isNaN(num) ? '' : String(Math.round(num));
};

export function MobileStylesDrawer({ onSave }: MobileStylesDrawerProps) {
  const {
    selectedElement,
    isStylesDrawerOpen,
    setStylesDrawerOpen,
    mobileDrawerInitialTab,
    setMobileDrawerInitialTab,
    pendingChanges,
    isSaving,
    clearPendingChanges,
    addPendingChange,
    updateSelectedElementStyle,
  } = useVisualEditorStore();

  // Local tab state — decoupled from desktop PropertiesPanel
  const [activeTab, setActiveTab] = useState<DrawerTab>('style');

  // When drawer opens with a specific initial tab, apply it
  useEffect(() => {
    if (isStylesDrawerOpen && mobileDrawerInitialTab) {
      setActiveTab(mobileDrawerInitialTab);
      setMobileDrawerInitialTab(null);
    }
  }, [isStylesDrawerOpen, mobileDrawerInitialTab, setMobileDrawerInitialTab]);

  // Reset to style tab when drawer opens fresh
  useEffect(() => {
    if (isStylesDrawerOpen && !mobileDrawerInitialTab) {
      setActiveTab('style');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStylesDrawerOpen]);

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
      // Optimistically update the style in store so controls stay in sync
      updateSelectedElementStyle(property, value);
    },
    [selectedElement, sendToIframe, addPendingChange, updateSelectedElementStyle]
  );

  const handleBorderStyleChange = useCallback(
    (newStyle: string) => {
      handleStyleChange('borderStyle', newStyle);
      if (newStyle !== 'none' && selectedElement) {
        const currentBW = parseFloat(selectedElement.styles.borderWidth || '0');
        if (isNaN(currentBW) || currentBW === 0) {
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

  const handleBorderRadiusChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(/[^0-9.]/g, '');
      if (raw) handleStyleChange('borderRadius', `${raw}px`);
    },
    [handleStyleChange]
  );

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

  const handleAttributeChange = useCallback(
    (attribute: string, value: string) => {
      if (!selectedElement) return;
      sendToPreviewIframe({
        type: 'sitecraft:apply-attribute',
        attribute,
        value,
      });
      addPendingChange({
        type: 'style',
        cssPath: selectedElement.cssPath,
        property: attribute,
        oldValue: (selectedElement as Record<string, unknown>)[attribute] as string || '',
        newValue: value,
      });
    },
    [selectedElement, addPendingChange]
  );

  if (!isStylesDrawerOpen) return null;

  const isLinkElement = selectedElement && (
    selectedElement.tagName === 'a' || selectedElement.tagName === 'A' ||
    selectedElement.tagName === 'button' || selectedElement.tagName === 'BUTTON'
  );

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-background animate-in slide-in-from-bottom duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0">
        <div className="flex items-center gap-2">
          {selectedElement && (
            <span className="text-[11px] font-mono bg-violet-500/10 text-violet-600 dark:text-violet-400 px-1.5 py-0.5 rounded">
              &lt;{selectedElement.tagName}&gt;
            </span>
          )}
          <span className="text-sm font-medium">
            {selectedElement ? 'Styles' : 'Sections'}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setStylesDrawerOpen(false)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Body: Section manager when no element, Tabs when element selected */}
      {!selectedElement ? (
        <ScrollArea className="flex-1 min-h-0">
          <div className="px-4 py-3">
            <SectionManager />
          </div>
        </ScrollArea>
      ) : (
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as DrawerTab)}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <div className="px-4 pt-2 flex-shrink-0">
            <TabsList className="w-full h-9">
              <TabsTrigger value="style" className="flex-1 text-xs">
                Style
              </TabsTrigger>
              <TabsTrigger value="spacing" className="flex-1 text-xs">
                Space
              </TabsTrigger>
              <TabsTrigger value="typography" className="flex-1 text-xs">
                Type
              </TabsTrigger>
              <TabsTrigger value="effects" className="flex-1 text-xs">
                FX
              </TabsTrigger>
              {isLinkElement && (
                <TabsTrigger value="link" className="flex-1 text-xs">
                  <Link2 className="h-3 w-3 mr-1" />
                  Link
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          <ScrollArea className="flex-1 min-h-0">
            <div className="px-4 py-3">
              {/* ═══ STYLE TAB ═══ */}
              <TabsContent value="style" className="mt-0 space-y-4">
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
                  label="Border Color"
                  value={selectedElement.styles.borderColor}
                  onChange={(v) => handleStyleChange('borderColor', v)}
                />

                {/* Border Style */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Border Style</Label>
                  <div className="flex gap-0.5 bg-muted rounded-md p-0.5">
                    {borderStyles.map((bs) => (
                      <button
                        key={bs.value}
                        onClick={() => handleBorderStyleChange(bs.value)}
                        className={`flex-1 px-2 py-2 rounded text-xs font-medium transition-colors ${
                          (selectedElement.styles.borderStyle || 'none') === bs.value
                            ? 'bg-background shadow-sm text-foreground'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {bs.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Border Width */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Border Width</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={parsePx(selectedElement.styles.borderWidth || '0')}
                      onChange={handleBorderWidthChange}
                      className="flex-1 h-1.5 accent-primary"
                    />
                    <Input
                      value={parsePx(selectedElement.styles.borderWidth || '0')}
                      onChange={handleBorderWidthChange}
                      className="h-10 text-xs font-mono w-16"
                    />
                    <span className="text-xs text-muted-foreground">px</span>
                  </div>
                </div>

                {/* Border Radius */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Border Radius</Label>
                  <div className="flex items-center gap-2">
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
                      className="h-10 text-xs font-mono w-16"
                    />
                    <span className="text-xs text-muted-foreground">px</span>
                  </div>
                </div>

                {/* Size (Width & Height) */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Size</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground font-medium">W</span>
                      <Input
                        value={parseSizeValue(selectedElement.styles.width || '')}
                        onChange={(e) => handleSizeChange('width', e.target.value)}
                        className="h-10 text-xs font-mono flex-1"
                        placeholder="auto"
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground font-medium">H</span>
                      <Input
                        value={parseSizeValue(selectedElement.styles.height || '')}
                        onChange={(e) => handleSizeChange('height', e.target.value)}
                        className="h-10 text-xs font-mono flex-1"
                        placeholder="auto"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* ═══ SPACING TAB ═══ */}
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

              {/* ═══ TYPOGRAPHY TAB ═══ */}
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

              {/* ═══ EFFECTS TAB ═══ */}
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

              {/* ═══ LINK TAB ═══ */}
              {isLinkElement && (
                <TabsContent value="link" className="mt-0 space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">URL / Href</Label>
                    <Input
                      value={selectedElement.href || ''}
                      onChange={(e) => handleAttributeChange('href', e.target.value)}
                      className="h-10 text-xs font-mono"
                      placeholder="https://example.com or /about"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Open In</Label>
                    <div className="flex gap-0.5 bg-muted rounded-md p-0.5">
                      {[
                        { value: '_self', label: 'Same Tab' },
                        { value: '_blank', label: 'New Tab' },
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => handleAttributeChange('target', opt.value)}
                          className={`flex-1 px-2 py-2.5 rounded text-xs font-medium transition-colors ${
                            (selectedElement.target || '_self') === opt.value
                              ? 'bg-background shadow-sm text-foreground'
                              : 'text-muted-foreground'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Title (tooltip)</Label>
                    <Input
                      value={selectedElement.title || ''}
                      onChange={(e) => handleAttributeChange('title', e.target.value)}
                      className="h-10 text-xs"
                      placeholder="Hover tooltip text"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Quick Links</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {quickLinks.map((ql) => (
                        <button
                          key={ql.label}
                          onClick={() => handleAttributeChange('href', ql.href)}
                          className="text-xs px-3 py-2.5 rounded-lg border border-border hover:bg-muted active:bg-muted/80 transition-colors text-left"
                        >
                          {ql.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              )}
            </div>
          </ScrollArea>
        </Tabs>
      )}

      {/* Footer */}
      {pendingChanges.length > 0 && (
        <div className="border-t px-4 py-3 flex items-center gap-2 bg-muted/20 flex-shrink-0 safe-area-bottom">
          <span className="text-xs text-muted-foreground flex-shrink-0">
            {pendingChanges.length} change{pendingChanges.length > 1 ? 's' : ''}
          </span>
          <div className="flex gap-2 flex-1 justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={clearPendingChanges}
              disabled={isSaving}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              Discard
            </Button>
            <Button size="sm" onClick={onSave} disabled={isSaving}>
              <Save className="h-3.5 w-3.5 mr-1" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
