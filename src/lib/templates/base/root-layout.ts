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

  return `import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '${titleStr}',
  description: '${descStr}',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
`;
}
