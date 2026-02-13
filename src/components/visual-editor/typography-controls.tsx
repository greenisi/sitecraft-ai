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
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
} from 'lucide-react';
import { FONT_OPTIONS } from '@/lib/utils/constants';

interface TypographyControlsProps {
  fontSize: string;
  fontWeight: string;
  fontFamily: string;
  lineHeight: string;
  letterSpacing: string;
  textAlign: string;
  onChange: (property: string, value: string) => void;
}

const FONT_WEIGHTS = [
  { value: '100', label: 'Thin' },
  { value: '200', label: 'Extra Light' },
  { value: '300', label: 'Light' },
  { value: '400', label: 'Normal' },
  { value: '500', label: 'Medium' },
  { value: '600', label: 'Semi Bold' },
  { value: '700', label: 'Bold' },
  { value: '800', label: 'Extra Bold' },
  { value: '900', label: 'Black' },
];

function parsePx(val: string): string {
  const num = parseFloat(val);
  return isNaN(num) ? '' : String(Math.round(num * 10) / 10);
}

function parseFontFamily(val: string): string {
  // Extract the first font name from a CSS font-family string, e.g. "'Inter', sans-serif" → "Inter"
  return val.split(',')[0]?.replace(/['"]/g, '').trim() || '';
}

export function TypographyControls({
  fontSize,
  fontWeight,
  fontFamily,
  lineHeight,
  letterSpacing,
  textAlign,
  onChange,
}: TypographyControlsProps) {
  const handleFontSize = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(/[^0-9.]/g, '');
      if (raw) onChange('fontSize', `${raw}px`);
    },
    [onChange]
  );

  const handleLineHeight = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(/[^0-9.]/g, '');
      if (raw) onChange('lineHeight', `${raw}px`);
    },
    [onChange]
  );

  const handleLetterSpacing = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(/[^0-9.-]/g, '');
      if (raw) onChange('letterSpacing', `${raw}px`);
    },
    [onChange]
  );

  const alignments = [
    { value: 'left', icon: AlignLeft },
    { value: 'center', icon: AlignCenter },
    { value: 'right', icon: AlignRight },
    { value: 'justify', icon: AlignJustify },
  ];

  const currentFont = parseFontFamily(fontFamily);

  return (
    <div className="space-y-3">
      {/* Font Family */}
      <div className="flex items-center gap-2">
        <Label className="text-xs text-muted-foreground w-20 flex-shrink-0">
          Font
        </Label>
        <Select
          value={currentFont}
          onValueChange={(v) => onChange('fontFamily', `'${v}', sans-serif`)}
        >
          <SelectTrigger className="h-8 text-xs flex-1">
            <SelectValue placeholder="System" />
          </SelectTrigger>
          <SelectContent>
            {FONT_OPTIONS.map((font) => (
              <SelectItem key={font.value} value={font.value} className="text-xs">
                {font.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Font Size */}
      <div className="flex items-center gap-2">
        <Label className="text-xs text-muted-foreground w-20 flex-shrink-0">
          Size
        </Label>
        <div className="flex items-center gap-1 flex-1">
          <Input
            value={parsePx(fontSize)}
            onChange={handleFontSize}
            className="h-8 text-xs font-mono w-16"
            placeholder="16"
          />
          <span className="text-[10px] text-muted-foreground">px</span>
        </div>
      </div>

      {/* Font Weight */}
      <div className="flex items-center gap-2">
        <Label className="text-xs text-muted-foreground w-20 flex-shrink-0">
          Weight
        </Label>
        <Select value={fontWeight} onValueChange={(v) => onChange('fontWeight', v)}>
          <SelectTrigger className="h-8 text-xs flex-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FONT_WEIGHTS.map((fw) => (
              <SelectItem key={fw.value} value={fw.value} className="text-xs">
                {fw.label} ({fw.value})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Line Height */}
      <div className="flex items-center gap-2">
        <Label className="text-xs text-muted-foreground w-20 flex-shrink-0">
          Line H.
        </Label>
        <div className="flex items-center gap-1 flex-1">
          <Input
            value={parsePx(lineHeight)}
            onChange={handleLineHeight}
            className="h-8 text-xs font-mono w-16"
            placeholder="24"
          />
          <span className="text-[10px] text-muted-foreground">px</span>
        </div>
      </div>

      {/* Letter Spacing */}
      <div className="flex items-center gap-2">
        <Label className="text-xs text-muted-foreground w-20 flex-shrink-0">
          Spacing
        </Label>
        <div className="flex items-center gap-1 flex-1">
          <Input
            value={parsePx(letterSpacing)}
            onChange={handleLetterSpacing}
            className="h-8 text-xs font-mono w-16"
            placeholder="0"
          />
          <span className="text-[10px] text-muted-foreground">px</span>
        </div>
      </div>

      {/* Text Align */}
      <div className="flex items-center gap-2">
        <Label className="text-xs text-muted-foreground w-20 flex-shrink-0">
          Align
        </Label>
        <div className="flex gap-0.5 bg-muted rounded-md p-0.5">
          {alignments.map(({ value, icon: Icon }) => (
            <button
              key={value}
              onClick={() => onChange('textAlign', value)}
              className={`p-1.5 rounded transition-colors ${
                textAlign === value
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
