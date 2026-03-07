'use client';

import { useState, useCallback } from 'react';
import { X, Search, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useVisualEditorStore } from '@/stores/visual-editor-store';
import { sendToPreviewIframe } from '@/lib/visual-editor/iframe-ref';

const STOCK_CATEGORIES = [
  { label: 'Business', query: 'business office' },
  { label: 'Technology', query: 'technology laptop' },
  { label: 'Nature', query: 'nature landscape' },
  { label: 'People', query: 'people team' },
  { label: 'Food', query: 'food restaurant' },
  { label: 'Architecture', query: 'modern architecture' },
  { label: 'Abstract', query: 'abstract gradient' },
  { label: 'Fitness', query: 'fitness gym' },
];

export function MobileImagePicker() {
  const {
    isImagePickerOpen,
    imagePickerData,
    setImagePickerOpen,
    addPendingChange,
  } = useVisualEditorStore();

  const [imageUrl, setImageUrl] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const replaceImage = useCallback(
    (src: string) => {
      sendToPreviewIframe({ type: 'sitecraft:image-picker-result', src });
      if (imagePickerData) {
        addPendingChange({
          type: 'style',
          cssPath: imagePickerData.cssPath,
          property: 'src',
          oldValue: imagePickerData.currentSrc || '',
          newValue: src,
        });
      }
      setImagePickerOpen(false);
    },
    [imagePickerData, addPendingChange, setImagePickerOpen]
  );

  const handleUrlSubmit = useCallback(() => {
    if (imageUrl.trim()) replaceImage(imageUrl.trim());
  }, [imageUrl, replaceImage]);

  const handleUnsplash = useCallback(
    (query: string) => {
      const unsplashUrl = `https://source.unsplash.com/800x600/?${encodeURIComponent(query)}`;
      replaceImage(unsplashUrl);
    },
    [replaceImage]
  );

  if (!isImagePickerOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setImagePickerOpen(false)}
      />

      {/* Panel */}
      <div className="relative w-full max-h-[70vh] bg-background rounded-t-2xl border-t shadow-2xl animate-in slide-in-from-bottom duration-200 overflow-y-auto safe-area-bottom">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between px-4 py-3 border-b bg-background z-10">
          <span className="text-sm font-semibold">Replace Image</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setImagePickerOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-4 space-y-4">
          {/* Current image preview */}
          {imagePickerData?.currentSrc && (
            <div className="rounded-lg overflow-hidden border bg-muted/30">
              <img
                src={imagePickerData.currentSrc}
                alt="Current"
                className="w-full h-24 object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}

          {/* Direct URL input */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Image URL</Label>
            <div className="flex gap-2">
              <Input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="h-9 text-sm font-mono flex-1"
                placeholder="https://example.com/image.jpg"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleUrlSubmit();
                }}
              />
              <Button
                size="sm"
                variant="outline"
                className="h-9 px-3"
                onClick={handleUrlSubmit}
                disabled={!imageUrl.trim()}
              >
                <Link2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Stock photo categories */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              Quick Stock Photos
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {STOCK_CATEGORIES.map((cat) => (
                <button
                  key={cat.label}
                  onClick={() => handleUnsplash(cat.query)}
                  className="text-sm px-3 py-2.5 rounded-lg border border-border hover:bg-muted active:bg-muted/80 transition-colors text-left"
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom search */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              Search Photos
            </Label>
            <div className="flex gap-2">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 text-sm flex-1"
                placeholder="e.g. modern office"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    handleUnsplash(searchQuery.trim());
                  }
                }}
              />
              <Button
                size="sm"
                variant="outline"
                className="h-9 px-3"
                onClick={() => {
                  if (searchQuery.trim()) handleUnsplash(searchQuery.trim());
                }}
                disabled={!searchQuery.trim()}
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
