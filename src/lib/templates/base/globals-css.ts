import type { DesignSystem } from '@/types/project';

export function generateGlobalsCss(designSystem: DesignSystem): string {
  return `@tailwind base;
@tailwind components;
@tailwind utilities;

@import url('https://fonts.googleapis.com/css2?family=${designSystem.typography.headingFont.replace(/ /g, '+')}:wght@400;500;600;700;800&family=${designSystem.typography.bodyFont.replace(/ /g, '+')}:wght@300;400;500;600&display=swap');

@layer base {
  * {
    @apply border-neutral-200;
  }

  html {
    overflow-x: hidden;
    -webkit-overflow-scrolling: touch;
  }

  body {
    @apply bg-white text-neutral-900 antialiased;
    font-family: '${designSystem.typography.bodyFont}', sans-serif;
    overflow-x: hidden;
    max-width: 100vw;
  }

  h1, h2, h3, h4, h5, h6 {
    font-family: '${designSystem.typography.headingFont}', sans-serif;
  }

  /* Prevent decorative absolute elements from causing horizontal scroll */
  section {
    overflow-x: hidden;
    max-width: 100vw;
  }
}

@layer utilities {
  .text-balance {
    text-wrap: balance;
  }
}


/* Scroll-reveal states. The DEFAULT is visible; the hidden state applies only
   under html[data-motion], which DynamicsRuntime sets after confirming it can
   also remove it. No script, no reduced motion -> nothing is ever hidden. */
html[data-motion] [data-reveal] {
  opacity: 0;
  transform: translate3d(0, 26px, 0);
  transition: opacity .75s cubic-bezier(.16,1,.3,1), transform .75s cubic-bezier(.16,1,.3,1);
}
html[data-motion] [data-reveal="right"] { transform: translate3d(34px, 0, 0); }
html[data-motion] [data-reveal="left"] { transform: translate3d(-34px, 0, 0); }
html[data-motion] [data-reveal="scale"] { transform: scale(.94); }
html[data-motion] [data-reveal].is-in { opacity: 1; transform: none; }

@media (prefers-reduced-motion: reduce) {
  html[data-motion] [data-reveal] {
    opacity: 1 !important;
    transform: none !important;
    transition: none !important;
  }
}
`;
}
