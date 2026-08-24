/**
 * Work gallery -- shipped when the owner accepts the work-gallery suggestion.
 *
 * The promise is "add photos from the dashboard and the site updates itself",
 * so this reads the owner's real gallery at runtime rather than baking images
 * into the page. Uploading a photo in the dashboard is the only step; nothing
 * needs regenerating.
 *
 *   GET /api/sites/{id}/gallery              -> every image, sort_order first
 *   GET /api/sites/{id}/gallery?category=... -> one category
 *
 * The whole set is fetched once and filtered client-side: these galleries are
 * a few dozen images at most, and a refetch per filter click makes the tabs
 * feel broken on a slow connection.
 *
 * NOTE ON BEFORE-AND-AFTER: gallery_images has a free-text `category` and no
 * pairing between rows, so there is no honest way to render true before/after
 * pairs from this data. Categories become filter tabs instead, which means an
 * owner who tags photos "Before" and "After" gets those as tabs. Inventing
 * pairs by guessing at upload order would put wrong images side by side on a
 * page whose entire job is proving the work is real.
 *
 * Renders nothing at all while the gallery is empty, rather than showing a
 * heading over blank space on a site that just launched.
 *
 * `PROJECT_ID` is substituted at publish time by platform-publisher.
 */

export interface WorkGalleryOptions {
  heading: string;
  intro: string;
}

export function generateWorkGalleryComponent(options: WorkGalleryOptions): string {
  const heading = escapeText(options.heading);
  const intro = escapeText(options.intro);

  return `'use client';

import { useEffect, useMemo, useState } from 'react';

const API_BASE = 'https://app.innovated.marketing/api/sites/PROJECT_ID';

interface GalleryImage {
  id: string;
  image_url: string;
  title: string | null;
  description: string | null;
  category: string | null;
}

export default function WorkGallery() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [active, setActive] = useState<string>('All');
  const [lightbox, setLightbox] = useState<GalleryImage | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(API_BASE + '/gallery')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return;
        const list = data && Array.isArray(data.images) ? data.images : [];
        setImages(list.filter((image: GalleryImage) => Boolean(image && image.image_url)));
      })
      .catch(() => {
        if (!cancelled) setImages([]);
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Close the lightbox on Escape: a full-screen overlay with no keyboard exit
  // is a trap for anyone not using a mouse.
  useEffect(() => {
    if (!lightbox) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setLightbox(null);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox]);

  const categories = useMemo(() => {
    const found: string[] = [];
    for (const image of images) {
      const category = (image.category || '').trim();
      if (category && found.indexOf(category) === -1) found.push(category);
    }
    return found;
  }, [images]);

  const shown = useMemo(() => {
    if (active === 'All') return images;
    return images.filter((image) => (image.category || '').trim() === active);
  }, [images, active]);

  if (!loaded || images.length === 0) return null;

  return (
    <section id="gallery" className="bg-primary-50 py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center">
          <h2 className="font-heading text-3xl font-bold text-primary-900 sm:text-4xl">
            ${heading}
          </h2>
          <p className="mx-auto mt-4 max-w-[52ch] leading-relaxed text-primary-700">
            ${intro}
          </p>
        </div>

        {categories.length > 1 ? (
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {['All', ...categories].map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setActive(category)}
                aria-pressed={active === category}
                className={
                  'rounded-full px-4 py-2 text-sm font-semibold transition-colors ' +
                  (active === category
                    ? 'bg-primary-900 text-white'
                    : 'bg-white text-primary-700 hover:bg-primary-100')
                }
              >
                {category}
              </button>
            ))}
          </div>
        ) : null}

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((image) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setLightbox(image)}
              className="group overflow-hidden rounded-xl bg-white text-left shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={image.image_url}
                  alt={image.title || 'Our work'}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
              </div>
              {image.title || image.description ? (
                <div className="p-4">
                  {image.title ? (
                    <div className="text-sm font-semibold text-primary-900">{image.title}</div>
                  ) : null}
                  {image.description ? (
                    <p className="mt-1 text-sm leading-relaxed text-primary-600">{image.description}</p>
                  ) : null}
                </div>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      {lightbox ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={lightbox.title || 'Gallery image'}
          onClick={() => setLightbox(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
        >
          <button
            type="button"
            onClick={() => setLightbox(null)}
            aria-label="Close"
            className="absolute right-4 top-4 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20"
          >
            Close
          </button>
          <figure onClick={(event) => event.stopPropagation()} className="max-h-full max-w-3xl">
            <img
              src={lightbox.image_url}
              alt={lightbox.title || 'Our work'}
              className="max-h-[75vh] w-full rounded-lg object-contain"
            />
            {lightbox.title || lightbox.description ? (
              <figcaption className="mt-3 text-center text-sm text-white/80">
                {lightbox.title ? <span className="font-semibold text-white">{lightbox.title}</span> : null}
                {lightbox.title && lightbox.description ? ' — ' : ''}
                {lightbox.description}
              </figcaption>
            ) : null}
          </figure>
        </div>
      ) : null}
    </section>
  );
}
`;
}

/** Strips characters that would break out of the generated template literal. */
function escapeText(value: string): string {
  return value.replace(/[`\\]/g, '').replace(/\$\{/g, '');
}

/**
 * Gallery framing per trade. "Our work" is right for a contractor and wrong
 * for a salon, where the proof is the result rather than the job.
 */
export function deriveWorkGalleryOptions(siteType: string, industry: string): WorkGalleryOptions {
  const trade = `${siteType} ${industry}`.toLowerCase();

  if (/roof|gutter|siding|construction|remodel|renovat|contractor|paving|fencing|flooring|painting/.test(trade)) {
    return {
      heading: 'Recent work',
      intro: 'Jobs we have finished. Every photo is our own work, not stock.',
    };
  }
  if (/landscap|lawn|garden|tree|pool/.test(trade)) {
    return {
      heading: 'Before and after',
      intro: 'Spaces we have transformed. Every photo is our own work, not stock.',
    };
  }
  if (/salon|spa|barber|beauty|hair|nail|aesthetic|tattoo/.test(trade)) {
    return {
      heading: 'Our work',
      intro: 'A look at what we do, photographed in the studio.',
    };
  }
  if (/clean|restoration|detail|repair/.test(trade)) {
    return {
      heading: 'Before and after',
      intro: 'The difference on real jobs. Every photo is our own work, not stock.',
    };
  }
  if (/photograph|design|architect|interior|creative|studio/.test(trade)) {
    return {
      heading: 'Selected work',
      intro: 'A selection of recent projects.',
    };
  }

  return {
    heading: 'Our work',
    intro: 'A look at what we have done. Every photo is our own work, not stock.',
  };
}
