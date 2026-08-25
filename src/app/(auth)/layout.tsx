import Image from 'next/image';
import Link from 'next/link';

/**
 * The first screen the iOS app shows to a signed-out person.
 *
 * The starfield came off here for the same reason it came off the app
 * shell: at phone width the specks landed on the form and read as dust.
 * What is left is the logo, one card, and the ground.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="ios-app relative flex min-h-dvh w-full flex-col items-center justify-center overflow-x-clip px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))]">
      <Link href="/" className="relative z-10 mb-6 block sm:mb-7">
        <Image
          src="/logo.png"
          alt="Innovated Marketing"
          width={844}
          height={563}
          className="h-14 w-auto brightness-0 invert sm:h-20"
          priority
        />
      </Link>

      <div className="relative z-10 w-full max-w-md">
        <div className="ios-card-raised p-5 sm:p-8">{children}</div>
      </div>

      <p className="ios-footnote relative z-10 mt-6 text-center">Powered by Innovated Marketing AI</p>
    </div>
  );
}
