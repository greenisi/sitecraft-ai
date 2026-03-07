'use client';

import { useState, useCallback } from 'react';
import { Image, Link2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { sendToPreviewIframe } from '@/lib/visual-editor/iframe-ref';
import { useVisualEditorStore } from '@/stores/visual-editor-store';

interface ImageReplacerProps {
  currentSrc?: string;
  cssPath: string;
}

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

export function ImageReplacer({ currentSrc, cssPath }: ImageReplacerProps) {
  const [imageUrl, setImageUrl] = useState(currentSrc || '');
  const [searchQuery, setSearchQuery] = useState('');
  const { addPendingChange } = useVisualEditorStore();

  const replaceImage = useCallback(
    (src: string) => {
      sendToPreviewIframe({ type: 'sitecraft:replace-image', src });
      addPendingChange({
        type: 'style',
        cssPath,
        property: 'src',
        oldValue: currentSrc || '',
        newValue: src,
      });
      setImageUrl(src);
    },
    [cssPath, currentSrc, addPendingChange]
  );

  const handleUrlSubmit = useCallback(() => {
    if (imageUrl.trim()) {
      replaceImage(imageUrl.trim());
    }
  }, [imageUrl, replaceImage]);

  const handleUnsplash = useCallback(
    (query: string) => {
      // Use Unsplash Source for random images (no API key needed)
      const src = `https://images.unsplash.com/photo-random?w=800&h=600&q=80&fit=crop&${query.replace(/\s+/g, ',')}`;
      // Actually use the search-based URL format
      const unsplashUrl = `https://source.unsplash.com/800x600/?${encodeURIComponent(query)}`;
      replaceImage(unsplashUrl);
    },
    [replaceImage]
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <Image className="h-3.5 w-3.5 text-violet-500" />
        <span className="text-xs font-medium">Replace Image</span>
      </div>

      {/* Current image preview */}
      {currentSrc && (
        <div className="rounded-md overflow-hidden border bg-muted/30">
          <img
            src={currentSrc}
            alt="Current"
            className="w-full h-20 object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      )}

      {/* Direct URL input */}
      <div className="space-y-1.5">
        <Label className="text-[10px] text-muted-foreground">Image URL</Label>
        <div className="flex gap-1.5">
          <Input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="h-7 text-[11px] font-mono flex-1"
            placeholder="https://example.com/image.jpg"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleUrlSubmit();
            }}
          />
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2"
            onClick={handleUrlSubmit}
            disabled={!imageUrl.trim()}
          >
            <Link2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Stock photo categories */}
      <div className="space-y-1.5">
        <Label className="text-[10px] text-muted-foreground">
          Quick Stock Photos
        </Label>
        <div className="grid grid-cols-2 gap-1">
          {STOCK_CATEGORIES.map((cat) => (
            <button
              key={cat.label}
              onClick={() => handleUnsplash(cat.query)}
              className="text-[10px] px-2 py-1.5 rounded border border-border hover:bg-muted transition-colors text-left truncate"
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom search */}
      <div className="space-y-1.5">
        <Label className="text-[10px] text-muted-foreground">
          Search Photos
        </Label>
        <div className="flex gap-1.5">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-7 text-[11px] flex-1"
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
            className="h-7 px-2"
            onClick={() => {
              if (searchQuery.trim()) handleUnsplash(searchQuery.trim());
            }}
            disabled={!searchQuery.trim()}
          >
            <Search className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
