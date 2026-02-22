import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Code2, Zap, Globe } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen relative" style={{ background: 'linear-gradient(135deg, #0a0e1a 0%, #111827 30%, #0f172a 60%, #0a0e1a 100%)' }}>
      {/* Starfield background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="stars-small" />
        <div className="stars-medium" />
        <div className="stars-large" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full opacity-30"
          style={{ background: 'radial-gradient(ellipse, rgba(139,92,246,0.15) 0%, rgba(59,130,246,0.08) 40%, transparent 70%)' }} />
        <div className="absolute top-1/3 right-0 w-[500px] h-[500px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(ellipse, rgba(139,92,246,0.1) 0%, transparent 60%)' }} />
      </div>

      {/* Navbar */}
      <header className="relative z-20 flex items-center justify-between px-4 md:px-8 lg:px-12 py-4">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="Innovated Marketing"
            width={844}
            height={563}
            className="brightness-0 invert w-auto"
            style={{ height: '120px' }}
            priority
          />
        </Link>
        <nav className="flex items-center gap-1 md:gap-2">
          <Link href="/login"
            className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
            Log in
          </Link>
          <Link href="/signup"
            className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-all"
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }}>
            Get Started
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="relative z-10">
        <section className="flex flex-col items-center justify-center text-center px-4 pt-16 sm:pt-24 md:pt-32 pb-20">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 mb-8">
            <span className="w-2 h-2 rounded-full" style={{ background: '#22c55e' }} />
            <span className="text-sm text-gray-400 font-medium">AI-Powered Website Builder</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight max-w-4xl"
            style={{ color: 'rgba(255,255,255,0.85)' }}>
            What will you build today?
          </h1>

          {/* Subheading */}
          <p className="mt-6 text-base sm:text-lg text-gray-400 max-w-2xl leading-relaxed">
            Create stunning, multi-page websites in minutes by simply describing your vision. No code. No templates.
          </p>

          {/* CTA */}
          <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
            <Link href="/signup"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-base font-medium text-white transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }}>
              <Zap className="h-4 w-4" />
              Start Building
              <ArrowRight className="h-4 w-4" />
            </Link>
            <span className="text-sm text-gray-500">&#10024; Free to sign up &#8226; No credit card required</span>
          </div>
        </section>

        {/* Features */}
        <section className="px-4 md:px-8 lg:px-12 pb-24">
          <div className="max-w-5xl mx-auto grid sm:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                style={{ background: 'linear-gradient(135deg, #06b6d4, #3b82f6)' }}>
                <Code2 className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">No Code Required</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Just describe what you want in plain language. AI handles all the coding for you.
              </p>
            </div>

            {/* Feature 2 */}
            <div>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                style={{ background: 'linear-gradient(135deg, #a855f7, #8b5cf6)' }}>
                <Zap className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Real-time Preview</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                See your changes instantly as AI builds your website live in front of you.
              </p>
            </div>

            {/* Feature 3 */}
            <div>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                style={{ background: 'linear-gradient(135deg, #f43f5e, #e11d48)' }}>
                <Globe className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Export &amp; Deploy</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Download your code or get a shareable link when you&apos;re done building.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center py-8 text-sm text-gray-500">
        Powered by Innovated Marketing AI
      </footer>
    </div>
  );
}
