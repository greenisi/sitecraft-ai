import Link from 'next/link';
import Image from 'next/image';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-background px-4 py-8 sm:py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center">
          <Link href="/" className="flex items-center gap-2 text-foreground">
            <Image
              src="/logo.png"
              alt="Innovated Marketing"
              width={200}
              height={50}
              className="h-10 w-auto dark:invert"
              priority
            />
            <span className="text-xs font-semibold bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
              BETA
            </span>
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}
