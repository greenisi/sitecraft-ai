import type { GenerationConfig, DesignSystem } from '@/types/project';

export function generateRootLayout(
  config: GenerationConfig,
  designSystem: DesignSystem
): string {
  const headingFont = designSystem.typography.headingFont.replace(/ /g, '_');
  const bodyFont = designSystem.typography.bodyFont.replace(/ /g, '_');

  // Escape single quotes to prevent syntax errors in generated code
  const esc = (s: string) => s.replace(/'/g, String.raw`\'`);

  const titleStr = config.business.tagline
    ? `${esc(config.business.name)} \u2014 ${esc(config.business.tagline)}`
    : esc(config.business.name);
  const descStr = esc(config.business.description.slice(0, 160));

  // Build Google Fonts URL for the chosen fonts
  const fontFamilies = new Set([designSystem.typography.headingFont, designSystem.typography.bodyFont]);
  const fontUrl = Array.from(fontFamilies)
    .map((f) => `family=${f.replace(/ /g, '+')}:wght@300;400;500;600;700;800`)
    .join('&');

  return `import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '${titleStr}',
  description: '${descStr}',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?${fontUrl}&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen antialiased overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
`;
}
