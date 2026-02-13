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

  body {
    @apply bg-white text-neutral-900 antialiased;
    font-family: '${designSystem.typography.bodyFont}', sans-serif;
  }

  h1, h2, h3, h4, h5, h6 {
    font-family: '${designSystem.typography.headingFont}', sans-serif;
  }
}

@layer utilities {
  .text-balance {
    text-wrap: balance;
  }
}
`;
}
