import { VirtualFileTree } from '@/types/generation';
import type { GenerationConfig, DesignSystem, PageBlueprint } from '@/types/project';
import { generatePackageJson } from '@/lib/templates/base/package-json';
import { generateNextConfig } from '@/lib/templates/base/next-config';
import { generateTsConfig } from '@/lib/templates/base/tsconfig';
import { generateTailwindConfig } from '@/lib/templates/base/tailwind-config';
import { generateGlobalsCss } from '@/lib/templates/base/globals-css';
import { generateRootLayout } from '@/lib/templates/base/root-layout';
import { generatePostcssConfig } from '@/lib/templates/base/postcss-config';
import { generateUtilsCn } from '@/lib/templates/base/utils';

const GITIGNORE = `# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts
`;

export function buildScaffoldingTree(
  config: GenerationConfig,
  designSystem: DesignSystem
): VirtualFileTree {
  const tree = new VirtualFileTree();

  // Config files
  tree.addFile('package.json', generatePackageJson(config), 'config');
  tree.addFile('next.config.js', generateNextConfig(), 'config');
  tree.addFile('tsconfig.json', generateTsConfig(), 'config');
  tree.addFile('tailwind.config.js', generateTailwindConfig(designSystem), 'config');
  tree.addFile('postcss.config.js', generatePostcssConfig(), 'config');
  tree.addFile('.gitignore', GITIGNORE, 'config');

  // Base source files
  tree.addFile('src/app/globals.css', generateGlobalsCss(designSystem), 'style');
  tree.addFile('src/app/layout.tsx', generateRootLayout(config, designSystem), 'page');
  tree.addFile('src/lib/utils.ts', generateUtilsCn(), 'data');

  return tree;
}

export function generatePageFile(
  pagePath: string,
  componentImports: { name: string; path: string }[],
  metadata: { title: string; description: string }
): string {
  const imports = componentImports
    .map((c) => `import ${c.name} from '${c.path}';`)
    .join('\n');

  const components = componentImports
    .map((c) => `      <${c.name} />`)
    .join('\n');

  return `import type { Metadata } from 'next';
${imports}

export const metadata: Metadata = {
  title: '${metadata.title.replace(/'/g, "\\'")}',
  description: '${metadata.description.replace(/'/g, "\\'")}',
};

export default function Page() {
  return (
    <main>
${components}
    </main>
  );
}
`;
}
