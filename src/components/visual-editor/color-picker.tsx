'use client';

import { useCallback, useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

/** Convert any CSS color (rgb, rgba, etc.) to a hex string for the color input */
function cssColorToHex(color: string): string {
  if (!color || color === 'transparent' || color === 'rgba(0, 0, 0, 0)') return '#00000000';
  if (color.startsWith('#')) return color;

  // Parse rgb/rgba
  const match = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (match) {
    const r = parseInt(match[1]).toString(16).padStart(2, '0');
    const g = parseInt(match[2]).toString(16).padStart(2, '0');
    const b = parseInt(match[3]).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
  }
  return '#000000';
}

export function ColorPicker({ label, value, onChange }: ColorPickerProps) {
  const [hexValue, setHexValue] = useState(() => cssColorToHex(value));

  useEffect(() => {
    setHexValue(cssColorToHex(value));
  }, [value]);

  const handleColorInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const hex = e.target.value;
      setHexValue(hex);
      onChange(hex);
    },
    [onChange]
  );

  const handleTextInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      let val = e.target.value;
      setHexValue(val);
      // Only send valid hex colors
      if (/^#[0-9a-fA-F]{6}$/.test(val)) {
        onChange(val);
      }
    },
    [onChange]
  );

  const isTransparent = value === 'transparent' || value === 'rgba(0, 0, 0, 0)';

  return (
    <div className="flex items-center gap-2">
      <Label className="text-xs text-muted-foreground w-24 flex-shrink-0">
        {label}
      </Label>
      <div className="flex items-center gap-1.5 flex-1">
        <div className="relative">
          <input
            type="color"
            value={hexValue.startsWith('#') ? hexValue.substring(0, 7) : '#000000'}
            onChange={handleColorInput}
            className="w-8 h-8 rounded border cursor-pointer bg-transparent p-0.5"
            style={{ WebkitAppearance: 'none' }}
          />
          {isTransparent && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-6 h-6 rounded bg-[repeating-conic-gradient(#ccc_0%_25%,transparent_0%_50%)] bg-[length:8px_8px]" />
            </div>
          )}
        </div>
        <Input
          value={hexValue}
          onChange={handleTextInput}
          className="h-8 text-xs font-mono flex-1"
          placeholder="#000000"
        />
      </div>
    </div>
  );
}
