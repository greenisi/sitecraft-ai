'use client';

import { useCallback } from 'react';

interface SpacingEditorProps {
  paddingTop: string;
  paddingRight: string;
  paddingBottom: string;
  paddingLeft: string;
  marginTop: string;
  marginRight: string;
  marginBottom: string;
  marginLeft: string;
  onChange: (property: string, value: string) => void;
}

function parsePx(val: string): string {
  const num = parseFloat(val);
  return isNaN(num) ? '0' : String(Math.round(num));
}

function SpacingInput({
  value,
  onChange,
  position,
}: {
  value: string;
  onChange: (val: string) => void;
  position: string;
}) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(/[^0-9.-]/g, '');
      onChange(raw ? `${raw}px` : '0px');
    },
    [onChange]
  );

  const positionClasses: Record<string, string> = {
    'margin-top': 'top-0 left-1/2 -translate-x-1/2',
    'margin-right': 'right-0 top-1/2 -translate-y-1/2',
    'margin-bottom': 'bottom-0 left-1/2 -translate-x-1/2',
    'margin-left': 'left-0 top-1/2 -translate-y-1/2',
    'padding-top': 'top-0 left-1/2 -translate-x-1/2',
    'padding-right': 'right-0 top-1/2 -translate-y-1/2',
    'padding-bottom': 'bottom-0 left-1/2 -translate-x-1/2',
    'padding-left': 'left-0 top-1/2 -translate-y-1/2',
  };

  return (
    <input
      type="text"
      value={parsePx(value)}
      onChange={handleChange}
      className={`absolute ${positionClasses[position] || ''} w-8 h-5 text-[10px] text-center bg-transparent border border-transparent hover:border-border focus:border-primary focus:outline-none rounded font-mono`}
    />
  );
}

export function SpacingEditor({
  paddingTop,
  paddingRight,
  paddingBottom,
  paddingLeft,
  marginTop,
  marginRight,
  marginBottom,
  marginLeft,
  onChange,
}: SpacingEditorProps) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">Box Model</p>
      {/* Outer = margin, inner = padding */}
      <div className="relative bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg p-6 text-center">
        <span className="absolute top-1 left-1.5 text-[9px] text-orange-400 font-medium">
          margin
        </span>
        {/* Margin inputs */}
        <SpacingInput
          value={marginTop}
          onChange={(v) => onChange('marginTop', v)}
          position="margin-top"
        />
        <SpacingInput
          value={marginRight}
          onChange={(v) => onChange('marginRight', v)}
          position="margin-right"
        />
        <SpacingInput
          value={marginBottom}
          onChange={(v) => onChange('marginBottom', v)}
          position="margin-bottom"
        />
        <SpacingInput
          value={marginLeft}
          onChange={(v) => onChange('marginLeft', v)}
          position="margin-left"
        />

        {/* Inner = padding */}
        <div className="relative bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded p-6">
          <span className="absolute top-1 left-1.5 text-[9px] text-green-500 font-medium">
            padding
          </span>
          <SpacingInput
            value={paddingTop}
            onChange={(v) => onChange('paddingTop', v)}
            position="padding-top"
          />
          <SpacingInput
            value={paddingRight}
            onChange={(v) => onChange('paddingRight', v)}
            position="padding-right"
          />
          <SpacingInput
            value={paddingBottom}
            onChange={(v) => onChange('paddingBottom', v)}
            position="padding-bottom"
          />
          <SpacingInput
            value={paddingLeft}
            onChange={(v) => onChange('paddingLeft', v)}
            position="padding-left"
          />

          {/* Center content label */}
          <div className="text-[10px] text-muted-foreground font-mono py-1">
            content
          </div>
        </div>
      </div>
    </div>
  );
}
