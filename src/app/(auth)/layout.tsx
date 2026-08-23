import Image from 'next/image';
import Link from 'next/link';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="premium-auth relative flex min-h-dvh w-full flex-col items-center justify-center overflow-x-clip px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))]" style={{ background: 'linear-gradient(145deg, #070a12 0%, #0c1220 44%, #090d18 100%)' }}>
      {/* Starfield */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="stars-small" />
        <div className="stars-medium" />
        <div className="stars-large" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full opacity-25" style={{ background: 'radial-gradient(ellipse, rgba(139,92,246,0.2) 0%, transparent 70%)' }} />
      </div>

      {/* Logo */}
      <Link href="/" className="relative z-10 mb-4 block sm:mb-6">
        <Image
          src="/logo.png"
          alt="Innovated Marketing"
          width={844}
          height={563}
          className="h-16 w-auto brightness-0 invert sm:h-20"
          priority
        />
      </Link>

      {/* Auth card */}
      <div className="relative z-10 w-full max-w-md">
        <div className="premium-auth-card rounded-[24px] p-5 sm:p-8">
          {children}
        </div>
      </div>

      {/* Footer */}
      <p className="relative z-10 mt-5 text-center text-xs text-gray-500 sm:mt-7 sm:text-sm">
        Powered by Innovated Marketing AI
      </p>
    </div>
  );
}
