/**
 * DynamicsRuntime — deterministic scroll dynamics for every generated site.
 *
 * Verbatim prompt templates for parallax/sticky/marquee were ignored by the
 * model even with MANDATORY headers (system prompt saturation), so — like
 * the divider injector and image guard — the motion the owner can *feel*
 * ships as code, not as a request. This scaffolded client component is
 * injected into the generated layout and applies, at runtime:
 *
 *   1. Parallax drift on hero/full-bleed backdrop images (any absolutely
 *      positioned img covering its section, or anything with [data-parallax])
 *   2. Fail-open count-up on stat numerals when they enter the viewport
 *      (text is already the final value; animation is progressive polish)
 *   3. A thin brand-colored scroll progress bar at the top of the page
 *
 * Everything respects prefers-reduced-motion and degrades to fully static,
 * fully visible content when JavaScript is unavailable.
 */
export function generateDynamicsRuntimeComponent(
  primaryHex = '#4f772d',
  accentHex = '#c3512f',
  /** Per-site motion personality; see motion-variety.ts. */
  motion: { stagger: number; reveals: string[]; content: number } = {
    stagger: 90,
    reveals: ['', 'right', 'scale'],
    content: 0.1,
  }
): string {
  const revealSet = JSON.stringify(motion.reveals);
  return `'use client';

import { useEffect } from 'react';

export default function DynamicsRuntime() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const cleanups: Array<() => void> = [];

    // ── 1. Parallax on backdrop imagery ─────────────────────────────────
    const candidates = new Set<HTMLElement>(
      Array.from(document.querySelectorAll<HTMLElement>('[data-parallax]'))
    );
    document.querySelectorAll<HTMLImageElement>('section img').forEach((img) => {
      const cs = window.getComputedStyle(img);
      const rect = img.getBoundingClientRect();
      if (cs.position === 'absolute' && rect.height > window.innerHeight * 0.45) {
        candidates.add(img);
      }
    });

    const layers = Array.from(candidates).map((el) => ({
      el,
      speed: parseFloat(el.dataset.parallax || '0.14') || 0.14,
    }));

    if (layers.length > 0) {
      // Images drive object-position (composes with transform animations
      // like kenburns, which own the transform property); other elements
      // drive transform directly.
      layers.forEach(({ el }) => {
        el.style.willChange = el instanceof HTMLImageElement ? 'object-position' : 'transform';
      });
      let raf = 0;
      const onScroll = () => {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          for (const { el, speed } of layers) {
            const rect = el.getBoundingClientRect();
            if (rect.bottom < 0 || rect.top > window.innerHeight) continue;
            const offset = (rect.top + rect.height / 2 - window.innerHeight / 2) * speed;
            if (el instanceof HTMLImageElement) {
              el.style.objectPosition = '50% calc(50% + ' + offset.toFixed(1) + 'px)';
            } else {
              el.style.transform = 'translate3d(0,' + offset.toFixed(1) + 'px,0)';
            }
          }
        });
      };
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
      cleanups.push(() => {
        window.removeEventListener('scroll', onScroll);
        cancelAnimationFrame(raf);
      });
    }

    // ── 1b. Gentle drift on in-flow content photography ────────────────
    // Backdrops alone leave the middle of a page static once the hero has
    // gone; content images drift at roughly a third of the rate.
    document.querySelectorAll<HTMLImageElement>('section img').forEach((img) => {
      if (img.dataset.parallax) return;
      const cs = window.getComputedStyle(img);
      if (cs.position === 'absolute' || cs.objectFit !== 'cover') return;
      img.dataset.parallax = '${motion.content}';
    });

    // ── 1c. Reveal on scroll ───────────────────────────────────────────
    // Elements are selected from the DOM rather than requiring the model to
    // author attributes, and the hidden state lives behind [data-motion] on
    // <html> which only this script sets — so with JavaScript off or reduced
    // motion on, every element stays visible.
    if ('IntersectionObserver' in window) {
      const REVEALS: string[] = ${revealSet};
      const targets: HTMLElement[] = [];
      document.querySelectorAll('section').forEach((section) => {
        const kids = Array.from(
          section.querySelectorAll<HTMLElement>('h1,h2,h3,p,figure,blockquote,img,a[class],div[class*="rounded"]')
        )
          .filter((el) => window.getComputedStyle(el).position !== 'absolute')
          .filter((el) => !el.closest('nav') && !el.closest('footer'))
          .slice(0, 8);
        kids.forEach((el, index) => {
          if (el.dataset.reveal !== undefined) return;
          el.dataset.reveal = REVEALS[index % REVEALS.length];
          el.dataset.delay = String(index * ${motion.stagger});
          targets.push(el);
        });
      });

      if (targets.length > 0) {
        document.documentElement.setAttribute('data-motion', '');
        const io = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (!entry.isIntersecting) return;
              const el = entry.target as HTMLElement;
              window.setTimeout(() => el.classList.add('is-in'), Number(el.dataset.delay || 0));
              io.unobserve(el);
            });
          },
          { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
        );
        targets.forEach((el) => io.observe(el));
        // Failsafe: nothing may remain invisible, whatever the observer does.
        const sweep = window.setTimeout(() => {
          targets.forEach((el) => el.classList.add('is-in'));
        }, 2600);
        cleanups.push(() => {
          io.disconnect();
          window.clearTimeout(sweep);
        });
      }
    }

    // ── 2. Fail-open stat count-up ──────────────────────────────────────
    // Only bare numerals (optionally with +, %, or commas) inside headings/
    // display text. The final value is already rendered — if the observer
    // never fires, nothing is lost.
    const statEls: HTMLElement[] = [];
    document.querySelectorAll<HTMLElement>('h1,h2,h3,p,span,div').forEach((el) => {
      if (el.childElementCount !== 0) return;
      const t = (el.textContent || '').trim();
      if (!/^[$]?\\d{1,3}(,\\d{3})*(\\+|%)?$/.test(t)) return;
      const size = parseFloat(window.getComputedStyle(el).fontSize);
      if (size >= 28) statEls.push(el);
    });

    if (statEls.length > 0 && 'IntersectionObserver' in window) {
      const seen = new WeakSet<HTMLElement>();
      const io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            const el = entry.target as HTMLElement;
            if (!entry.isIntersecting || seen.has(el)) continue;
            seen.add(el);
            io.unobserve(el);
            const raw = (el.textContent || '').trim();
            const m = raw.match(/^([$]?)(\\d{1,3}(?:,\\d{3})*)(\\+|%)?$/);
            if (!m) continue;
            const target = parseInt(m[2].replace(/,/g, ''), 10);
            if (!Number.isFinite(target) || target <= 0) continue;
            const prefix = m[1] || '';
            const suffix = m[3] || '';
            const grouped = m[2].includes(',');
            const start = performance.now();
            const dur = 1400;
            const tick = (now: number) => {
              const p = Math.min(1, (now - start) / dur);
              const eased = 1 - Math.pow(1 - p, 3);
              const val = Math.round(target * eased);
              el.textContent = prefix + (grouped ? val.toLocaleString('en-US') : String(val)) + suffix;
              if (p < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
          }
        },
        { threshold: 0.4 }
      );
      statEls.forEach((el) => io.observe(el));
      cleanups.push(() => io.disconnect());
    }

    // ── 3. Scroll progress bar ──────────────────────────────────────────
    const bar = document.createElement('div');
    bar.setAttribute('aria-hidden', 'true');
    bar.style.cssText =
      'position:fixed;top:0;left:0;height:3px;width:0%;z-index:9999;pointer-events:none;' +
      'background:linear-gradient(90deg,${primaryHex},${accentHex});' +
      'transition:width 80ms linear;';
    document.body.appendChild(bar);
    let barRaf = 0;
    const onBar = () => {
      cancelAnimationFrame(barRaf);
      barRaf = requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        bar.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0).toFixed(2) + '%';
      });
    };
    onBar();
    window.addEventListener('scroll', onBar, { passive: true });
    cleanups.push(() => {
      window.removeEventListener('scroll', onBar);
      cancelAnimationFrame(barRaf);
      bar.remove();
    });

    return () => cleanups.forEach((fn) => fn());
  }, []);

  return null;
}
`;
}
