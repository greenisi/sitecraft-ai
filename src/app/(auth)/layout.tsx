import Image from 'next/image';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative" style={{ background: 'linear-gradient(135deg, #0a0e1a 0%, #111827 30%, #0f172a 60%, #0a0e1a 100%)' }}>
      {/* Starfield */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="stars-small" />
        <div className="stars-medium" />
        <div className="stars-large" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full opacity-25" style={{ background: 'radial-gradient(ellipse, rgba(139,92,246,0.2) 0%, transparent 70%)' }} />
      </div>

      {/* Logo */}
      <div className="relative z-10 mb-8">
        <Image
          src="/logo.png"
          alt="Innovated Marketing"
          width={844}
          height={563}
          className="brightness-0 invert w-auto"
          style={{ height: '56px' }}
          priority
        />
      </div>

      {/* Auth card */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="rounded-2xl p-8" style={{ background: 'rgba(30,41,59,0.6)', border: '1px solid rgba(71,85,105,0.3)', backdropFilter: 'blur(20px)' }}>
          {children}
        </div>
      </div>

      {/* Footer */}
      <p className="relative z-10 mt-8 text-sm text-gray-500">
        Powered by Innovated Marketing AI
      </p>
    </div>
  );
}
