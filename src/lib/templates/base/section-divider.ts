/**
 * Section divider template -- deterministic scaffolding for generated sites.
 *
 * Two rounds of prompt mandates produced ZERO dividers -- the model simply
 * ignores "add SVG wave dividers between contrasting sections". So, like the
 * image guard, we stop trusting the model: this file ships a dependency-free
 * SectionDivider component with every generated site, and divider-injector.ts
 * inserts it between dark/light section boundaries as a deterministic
 * post-pass.
 *
 * Like the other modules in templates/base, the generator returns the STRING
 * contents of the target file (src/components/SectionDivider.tsx).
 */

/**
 * Contents of src/components/SectionDivider.tsx for a generated site.
 *
 * Design notes (why the markup looks the way it does):
 * - The SVG paints with fill="currentColor", so callers pass the NEXT
 *   section's background as a text-* class. The shape then reads as the next
 *   section bleeding organically into the previous one.
 * - The wrapper pulls itself up over the previous section's bottom padding
 *   (negative top margin equal to its own height). Without the overlap, the
 *   transparent part of the SVG would expose the page body as a white sliver
 *   between sections -- the classic broken-divider look.
 * - -mb-px kills the subpixel hairline seam against the next section.
 * - preserveAspectRatio="none" stretches the fixed 1440x88 path to any
 *   viewport width without changing the divider's height.
 */
export function generateSectionDividerComponent(): string {
  return `interface SectionDividerProps {
  /** Shape of the divider: an organic wave or an angled skew band. */
  variant?: 'wave' | 'skew';
  /** Rotate 180deg for use at the TOP of a section instead of the bottom. */
  flip?: boolean;
  /**
   * Carries the divider color as a text-* class matching the NEXT section's
   * background (the SVG fills with currentColor), e.g. "text-neutral-50".
   */
  className?: string;
}

/**
 * Decorative transition between two sections with contrasting backgrounds.
 * Place it immediately after a section; color it like the section below.
 */
export default function SectionDivider({
  variant = 'wave',
  flip = false,
  className = 'text-white',
}: SectionDividerProps) {
  if (variant === 'skew') {
    return (
      <div
        aria-hidden="true"
        className={\`relative -mb-px -mt-10 md:-mt-16 h-10 md:h-16 overflow-hidden pointer-events-none \${flip ? 'rotate-180 ' : ''}\${className}\`}
      >
        {/* Band is taller than its clipping box so the skewed corners can
            never expose a gap against the section below. */}
        <div className="absolute left-0 top-1/3 h-[200%] w-full -skew-y-2 bg-current" />
      </div>
    );
  }

  return (
    <div
      aria-hidden="true"
      className={\`relative -mb-px -mt-12 md:-mt-20 pointer-events-none \${flip ? 'rotate-180 ' : ''}\${className}\`}
    >
      <svg
        viewBox="0 0 1440 88"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-12 md:h-20 block w-full"
      >
        <path
          d="M0,48 C180,84 360,10 560,26 C760,42 900,78 1080,64 C1230,52 1340,20 1440,34 L1440,88 L0,88 Z"
          fill="currentColor"
        />
      </svg>
    </div>
  );
}
`;
}
