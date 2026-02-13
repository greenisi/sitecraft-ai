import type { GenerationConfig } from '@/types/project';

export function generatePackageJson(config: GenerationConfig): string {
  const deps: Record<string, string> = {
    next: '^14.2.0',
    react: '^18.3.0',
    'react-dom': '^18.3.0',
    tailwindcss: '^3.4.0',
    autoprefixer: '^10.4.0',
    postcss: '^8.4.0',
    clsx: '^2.1.0',
    'tailwind-merge': '^2.4.0',
    'lucide-react': '^0.400.0',
  };

  if (config.siteType === 'ecommerce') {
    deps['zustand'] = '^4.5.0';
  }

  if (config.siteType === 'saas') {
    deps['zustand'] = '^4.5.0';
  }

  const pkg = {
    name: config.business.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'generated-site',
    version: '0.1.0',
    private: true,
    scripts: {
      dev: 'next dev',
      build: 'next build',
      start: 'next start',
      lint: 'next lint',
    },
    dependencies: deps,
    devDependencies: {
      '@types/node': '^20.0.0',
      '@types/react': '^18.3.0',
      '@types/react-dom': '^18.3.0',
      typescript: '^5.4.0',
      eslint: '^8.57.0',
      'eslint-config-next': '^14.2.0',
    },
  };

  return JSON.stringify(pkg, null, 2);
}
