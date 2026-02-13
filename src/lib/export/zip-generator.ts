import JSZip from 'jszip';
import { VirtualFileTree } from '@/types/generation';
import type { GenerationConfig } from '@/types/project';

export async function generateProjectZip(
  fileTree: VirtualFileTree,
  config: GenerationConfig
): Promise<Blob> {
  const zip = new JSZip();

  // Add all files from the virtual file tree
  for (const [path, file] of fileTree.entries()) {
    zip.file(path, file.content);
  }

  // Add README
  zip.file('README.md', generateReadme(config));

  // Add .env.example
  zip.file('.env.example', generateEnvExample(config));

  return zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });
}

function generateReadme(config: GenerationConfig): string {
  return `# ${config.business.name}

${config.business.description}

## Getting Started

1. Install dependencies:

\`\`\`bash
npm install
\`\`\`

2. Copy the environment file:

\`\`\`bash
cp .env.example .env.local
\`\`\`

3. Start the development server:

\`\`\`bash
npm run dev
\`\`\`

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) 14 (App Router)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Language**: TypeScript

## Build for Production

\`\`\`bash
npm run build
npm start
\`\`\`

## Deploy

The easiest way to deploy is with [Vercel](https://vercel.com/):

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

---

Generated with [SiteCraft AI](https://sitecraft.ai)
`;
}

function generateEnvExample(config: GenerationConfig): string {
  let envContent = `# Site Configuration
NEXT_PUBLIC_SITE_NAME="${config.business.name}"
NEXT_PUBLIC_SITE_URL=http://localhost:3000
`;

  if (config.siteType === 'ecommerce') {
    envContent += `
# E-commerce (add your payment provider keys)
# STRIPE_SECRET_KEY=
# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
`;
  }

  if (config.siteType === 'saas') {
    envContent += `
# Auth (add your auth provider keys)
# NEXTAUTH_SECRET=
# NEXTAUTH_URL=http://localhost:3000

# Database
# DATABASE_URL=
`;
  }

  return envContent;
}
