import type { DesignSystem } from '@/types/project';

/**
 * Deterministic contrast enforcement for AI-generated design systems.
 *
 * The generation prompts instruct the model to keep shades 50-200 light and
 * 700-950 dark, but prompts are probabilistic. This module makes readability
 * a mathematical guarantee: every scale is clamped so that
 *   - 50/100/200 always pass WCAG AA (4.5:1) against dark text (gray-900)
 *   - 700/800/900/950 always pass WCAG AA against white text
 *   - shades darken monotonically from 50 → 950 (sane gradients)
 * Hue and saturation are preserved — only lightness is adjusted, so the
 * brand character survives while white-on-white / black-on-black becomes
 * impossible at the token level.
 */

// --------------------------------------------------------------------------
// Color math
// --------------------------------------------------------------------------

interface Hsl { h: number; s: number; l: number }

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = hex.trim().match(/^#?([0-9a-f]{6})$/i);
  if (!m) {
    // Expand shorthand #abc → #aabbcc
    const short = hex.trim().match(/^#?([0-9a-f]{3})$/i);
    if (!short) return null;
    const [r, g, b] = short[1].split('');
    return hexToRgb(`#${r}${r}${g}${g}${b}${b}`);
  }
  const n = parseInt(m[1], 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbToHex(r: number, g: number, b: number): string {
  const to = (v: number) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`;
}

function rgbToHsl(r: number, g: number, b: number): Hsl {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return { h, s, l };
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  if (s === 0) {
    const v = l * 255;
    return { r: v, g: v, b: v };
  }
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return {
    r: hue2rgb(p, q, h + 1 / 3) * 255,
    g: hue2rgb(p, q, h) * 255,
    b: hue2rgb(p, q, h - 1 / 3) * 255,
  };
}

function hexToHsl(hex: string): Hsl | null {
  const rgb = hexToRgb(hex);
  return rgb ? rgbToHsl(rgb.r, rgb.g, rgb.b) : null;
}

function hslToHex(hsl: Hsl): string {
  const { r, g, b } = hslToRgb(hsl.h, hsl.s, hsl.l);
  return rgbToHex(r, g, b);
}

/** WCAG relative luminance of a hex color (0 = black, 1 = white). */
export function relativeLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0.5;
  const lin = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin(rgb.r) + 0.7152 * lin(rgb.g) + 0.0722 * lin(rgb.b);
}

/** WCAG contrast ratio between two hex colors (1:1 to 21:1). */
export function contrastRatio(hexA: string, hexB: string): number {
  const la = relativeLuminance(hexA);
  const lb = relativeLuminance(hexB);
  const [hi, lo] = la >= lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

// --------------------------------------------------------------------------
// Scale enforcement
// --------------------------------------------------------------------------

const WHITE = '#ffffff';
const DARK_TEXT = '#111827'; // gray-900 — the darkest text the prompts pair with light shades
const AA = 4.5;

/** Shades that serve as light backgrounds — must hold AA against dark text. */
const LIGHT_BG_SHADES = new Set(['50', '100', '200']);
/** Shades that serve as dark backgrounds — must hold AA against white text. */
const DARK_BG_SHADES = new Set(['700', '800', '900', '950']);

/** Neutral-gray fallbacks per shade for unparseable hex values. */
const FALLBACK_GRAY: Record<string, string> = {
  '50': '#fafafa', '100': '#f5f5f5', '200': '#e5e5e5', '300': '#d4d4d4',
  '400': '#a3a3a3', '500': '#737373', '600': '#525252', '700': '#404040',
  '800': '#262626', '900': '#171717', '950': '#0a0a0a',
};

/**
 * Repairs a single shade ONLY if it fails its WCAG requirement. Shades that
 * already pass are returned byte-identical, which keeps the whole guard
 * idempotent and leaves well-formed palettes (e.g. stock Tailwind scales)
 * completely untouched. Contrast is evaluated directly (not via lightness
 * bands) because HSL lightness is hue-blind — a saturated yellow at L=0.40
 * is still far too luminous for white text.
 */
function enforceShade(hex: string, shade: string): string {
  const hsl = hexToHsl(hex);
  if (!hsl) return FALLBACK_GRAY[shade] ?? hex;

  if (LIGHT_BG_SHADES.has(shade)) {
    if (contrastRatio(hex, DARK_TEXT) >= AA) return hex;
    let out = hex;
    let guard = 0;
    while (contrastRatio(out, DARK_TEXT) < AA && hsl.l < 0.995 && guard++ < 100) {
      hsl.l = Math.min(0.995, hsl.l + 0.01);
      out = hslToHex(hsl);
    }
    return out;
  }

  if (DARK_BG_SHADES.has(shade)) {
    if (contrastRatio(hex, WHITE) >= AA) return hex;
    let out = hex;
    let guard = 0;
    while (contrastRatio(out, WHITE) < AA && hsl.l > 0.02 && guard++ < 100) {
      hsl.l = Math.max(0.02, hsl.l - 0.01);
      out = hslToHex(hsl);
    }
    // High-chroma hues (yellow, lime, cyan) can stay too luminous even at
    // very low lightness — bleed saturation as a last resort.
    guard = 0;
    while (contrastRatio(out, WHITE) < AA && hsl.s > 0.05 && guard++ < 30) {
      hsl.s = Math.max(0.05, hsl.s - 0.05);
      out = hslToHex(hsl);
    }
    return out;
  }

  // Mid shades (300-600) are never mandated as text-bearing backgrounds;
  // leave them untouched except for the monotonicity pass below.
  return hex;
}

const SHADE_ORDER = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];

function enforceScale(scale: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = { ...scale };

  for (const shade of SHADE_ORDER) {
    if (typeof out[shade] === 'string' && out[shade].trim()) {
      out[shade] = enforceShade(out[shade], shade);
    } else if (shade in out) {
      // Empty/garbage value would emit a no-op utility class — substitute
      // the neutral fallback for this shade.
      out[shade] = FALLBACK_GRAY[shade] ?? out[shade];
    }
  }

  // Monotonic darkening 50 → 950 so gradients and hover shifts read sanely.
  //
  // Light trio (50/100/200): repaired shades can sit exactly at the AA
  // boundary, so darkening them to fix ordering would break readability.
  // Instead walk 200 → 50 and LIGHTEN the earlier shade — raising lightness
  // is always AA-safe against dark text.
  for (let i = SHADE_ORDER.indexOf('100'); i >= 0; i--) {
    const shade = SHADE_ORDER[i];
    const next = SHADE_ORDER[i + 1];
    if (!out[shade] || !out[next]) continue;
    const nextLum = relativeLuminance(out[next]);
    let lum = relativeLuminance(out[shade]);
    if (lum <= nextLum) {
      const hsl = hexToHsl(out[shade]);
      if (hsl) {
        let guard = 0;
        while (lum <= nextLum && hsl.l < 0.998 && guard++ < 100) {
          hsl.l = Math.min(0.998, hsl.l + 0.01);
          out[shade] = hslToHex(hsl);
          lum = relativeLuminance(out[shade]);
        }
      }
    }
  }

  // 300 → 950: nudge later shades darker (never lighter). Darkening only
  // improves the dark-shade white-text constraint, and mid shades carry no
  // text-bearing constraint of their own.
  let prev = out['200'] ? relativeLuminance(out['200']) : null;
  for (const shade of SHADE_ORDER.slice(SHADE_ORDER.indexOf('300'))) {
    if (!out[shade]) continue;
    let lum = relativeLuminance(out[shade]);
    if (prev !== null && lum >= prev) {
      const hsl = hexToHsl(out[shade]);
      if (hsl) {
        let guard = 0;
        while (lum >= prev && hsl.l > 0.02 && guard++ < 100) {
          hsl.l = Math.max(0.02, hsl.l - 0.01);
          out[shade] = hslToHex(hsl);
          lum = relativeLuminance(out[shade]);
        }
      }
    }
    prev = lum;
  }

  return out;
}

/**
 * Clamps every color scale in a design system into readable territory.
 * Idempotent — running it on an already-valid system is a no-op.
 */
export function enforceReadableScales(designSystem: DesignSystem): DesignSystem {
  return {
    ...designSystem,
    colors: {
      primary: enforceScale(designSystem.colors.primary),
      secondary: enforceScale(designSystem.colors.secondary),
      accent: enforceScale(designSystem.colors.accent),
      neutral: enforceScale(designSystem.colors.neutral),
    },
  };
}
