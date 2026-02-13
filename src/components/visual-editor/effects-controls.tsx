'use client';

import { useCallback } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface EffectsControlsProps {
  opacity: string;
  boxShadow: string;
  display: string;
  overflow: string;
  cursor: string;
  onChange: (property: string, value: string) => void;
}

const SHADOW_PRESETS: { label: string; value: string }[] = [
  { label: 'None', value: 'none' },
  { label: 'Small', value: '0 1px 2px 0 rgb(0 0 0 / 0.05)' },
  { label: 'Medium', value: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' },
  { label: 'Large', value: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' },
  { label: 'XL', value: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)' },
  { label: '2XL', value: '0 25px 50px -12px rgb(0 0 0 / 0.25)' },
];

const DISPLAY_OPTIONS = [
  { label: 'Block', value: 'block' },
  { label: 'Flex', value: 'flex' },
  { label: 'Grid', value: 'grid' },
  { label: 'Inline Block', value: 'inline-block' },
  { label: 'Inline', value: 'inline' },
  { label: 'Hidden', value: 'none' },
];

const OVERFLOW_OPTIONS = [
  { label: 'Visible', value: 'visible' },
  { label: 'Hidden', value: 'hidden' },
  { label: 'Scroll', value: 'scroll' },
  { label: 'Auto', value: 'auto' },
];

const CURSOR_OPTIONS = [
  { label: 'Default', value: 'default' },
  { label: 'Pointer', value: 'pointer' },
  { label: 'Text', value: 'text' },
  { label: 'Move', value: 'move' },
  { label: 'Not Allowed', value: 'not-allowed' },
  { label: 'Grab', value: 'grab' },
];

export function EffectsControls({
  opacity,
  boxShadow,
  display,
  overflow,
  cursor,
  onChange,
}: EffectsControlsProps) {
  const opacityPct = Math.round(parseFloat(opacity || '1') * 100);

  const handleOpacityChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const pct = parseInt(e.target.value, 10);
      if (!isNaN(pct)) {
        onChange('opacity', String(Math.max(0, Math.min(100, pct)) / 100));
      }
    },
    [onChange]
  );

  const currentShadowLabel =
    SHADOW_PRESETS.find((s) => s.value === boxShadow)?.label || 'Custom';

  return (
    <div className="space-y-5">
      {/* Opacity */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Opacity</Label>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="0"
            max="100"
            value={opacityPct}
            onChange={handleOpacityChange}
            className="flex-1 h-1.5 accent-primary"
          />
          <Input
            value={opacityPct}
            onChange={handleOpacityChange}
            className="h-8 w-16 text-xs font-mono text-center"
          />
          <span className="text-[10px] text-muted-foreground">%</span>
        </div>
      </div>

      {/* Box Shadow */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Box Shadow</Label>
        <div className="grid grid-cols-3 gap-1.5">
          {SHADOW_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => onChange('boxShadow', preset.value)}
              className={`rounded-md border px-2 py-1.5 text-[10px] font-medium transition-all hover:border-primary/50 ${
                currentShadowLabel === preset.label
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Display */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Display</Label>
        <Select value={display || 'block'} onValueChange={(v) => onChange('display', v)}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DISPLAY_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} className="text-xs">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Overflow */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Overflow</Label>
        <Select value={overflow || 'visible'} onValueChange={(v) => onChange('overflow', v)}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {OVERFLOW_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} className="text-xs">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Cursor */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Cursor</Label>
        <Select value={cursor || 'default'} onValueChange={(v) => onChange('cursor', v)}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CURSOR_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} className="text-xs">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
