import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Globe, Zap, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="Innovated Marketing"
              width={160}
              height={40}
              className="h-8 w-auto dark:invert"
              priority
            />
            <span className="text-[10px] font-semibold bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
              BETA
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost">
              <Link href="/login">Log in</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="container mx-auto px-4 py-16 sm:py-24 text-center">
          <h1 className="mx-auto max-w-3xl text-3xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Generate high-end websites{' '}
            <span className="text-primary">with AI</span>
          </h1>
          <p className="mx-auto mt-4 sm:mt-6 max-w-2xl text-base sm:text-lg text-muted-foreground">
            Describe your vision, customize the details, and let AI build a
            production-ready Next.js website. Landing pages, portfolios,
            e-commerce, and SaaS apps — deployed in minutes.
          </p>
          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href="/signup">
                Start building
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
              <Link href="/login">View demo</Link>
            </Button>
          </div>
        </section>

        <section className="border-t bg-muted/50">
          <div className="container mx-auto grid gap-8 px-4 py-16 sm:py-24 sm:grid-cols-3">
            <div className="space-y-3 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">AI-Powered Generation</h3>
              <p className="text-sm text-muted-foreground">
                Describe what you want and Claude generates production-quality
                React components with Tailwind CSS.
              </p>
            </div>
            <div className="space-y-3 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Globe className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">Live Preview</h3>
              <p className="text-sm text-muted-foreground">
                See your site come to life in real-time. Edit sections, regenerate
                components, and perfect every detail.
              </p>
            </div>
            <div className="space-y-3 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Download className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">Export & Deploy</h3>
              <p className="text-sm text-muted-foreground">
                Download a complete Next.js project or deploy directly to Vercel
                with one click.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          Innovated Marketing — Built with Next.js, Tailwind CSS, and Claude
        </div>
      </footer>
    </div>
  );
}
