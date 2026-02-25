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
`;
}
