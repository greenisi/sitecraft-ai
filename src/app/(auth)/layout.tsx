import Link from 'next/link';
import { Sparkles } from 'lucide-react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center">
          <Link href="/" className="flex items-center gap-2 text-foreground">
            <Sparkles className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold tracking-tight">
              SiteCraft AI
            </span>
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}
