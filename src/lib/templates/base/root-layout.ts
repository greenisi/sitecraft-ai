import type { GenerationConfig, DesignSystem } from '@/types/project';

export function generateRootLayout(
  config: GenerationConfig,
  designSystem: DesignSystem
): string {
  const headingFont = designSystem.typography.headingFont.replace(/ /g, '_');
  const bodyFont = designSystem.typography.bodyFont.replace(/ /g, '_');

  return `import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '${config.business.name}${config.business.tagline ? ` — ${config.business.tagline}` : ''}',
  description: '${config.business.description.slice(0, 160).replace(/'/g, "\\'")}',
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
