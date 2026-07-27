/**
 * Motion layer for template previews.
 *
 * Two halves:
 *   - `enliven()` is a deterministic post-pass that marks up already-built HTML
 *     (both the hand-written homepages and the composed interior pages) with
 *     the attributes the runtime looks for, and slots shape dividers between
 *     sections that change background colour.
 *   - MOTION_CSS + MOTION_JS are the runtime itself.
 *
 * Fail-open is the hard rule: the CSS default state for every animated element
 * is *visible*. The script opts the page into the hidden-then-revealed
 * behaviour by setting `data-motion` on <html>, so if the script never runs, is
 * blocked, or the viewer prefers reduced motion, the page is a complete, fully
 * readable site rather than a wall of invisible divs.
 *
 * Parallax on <img> drifts `object-position`, never `transform` — a transform
 * would fight the Ken Burns keyframe that already owns it on header images.
 */
import { divider, type DividerVariant } from './preview-sections';
import type { MotionProfile } from './preview-variety';

// --------------------------------------------------------------------------
// Runtime
// --------------------------------------------------------------------------

export const MOTION_CSS = `
[data-parallax]{will-change:object-position,transform}
[data-reveal]{opacity:1}
html[data-motion] [data-reveal]{opacity:0;transform:translate3d(0,26px,0);transition:opacity .75s cubic-bezier(.16,1,.3,1),transform .75s cubic-bezier(.16,1,.3,1)}
html[data-motion] [data-reveal="left"]{transform:translate3d(-34px,0,0)}
html[data-motion] [data-reveal="right"]{transform:translate3d(34px,0,0)}
html[data-motion] [data-reveal="scale"]{transform:scale(.94)}
html[data-motion] [data-reveal].is-in{opacity:1;transform:none}
html[data-motion] [data-mask]{clip-path:inset(0 0 100% 0);transition:clip-path 1.1s cubic-bezier(.16,1,.3,1)}
html[data-motion] [data-mask].is-in{clip-path:inset(0 0 0 0)}
/* The header keeps a constant height. Shrinking its padding on scroll made it
   visibly morph under the visitor, which reads as instability rather than
   polish; a shadow alone is enough to lift it off the content. */
nav{transition:box-shadow .35s ease}
nav.is-stuck{box-shadow:0 10px 34px rgba(0,0,0,.16)}
#scroll-progress{position:fixed;top:0;left:0;height:3px;width:0;z-index:999;pointer-events:none;transition:width .12s linear}
[data-scrollout]{will-change:transform,opacity}
@media(prefers-reduced-motion:reduce){
  html[data-motion] [data-reveal],html[data-motion] [data-mask]{opacity:1!important;transform:none!important;clip-path:none!important;transition:none!important}
  [data-parallax],[data-scrollout]{will-change:auto;transform:none!important}
  #scroll-progress{display:none}
}`;

export const MOTION_JS = `(function(){
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.documentElement;

  // Reveal-on-scroll. Opt in only once we know we can also turn it back on.
  if (!reduce && 'IntersectionObserver' in window) {
    root.setAttribute('data-motion', '');
    var targets = document.querySelectorAll('[data-reveal],[data-mask]');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var delay = parseInt(el.getAttribute('data-delay') || '0', 10);
        setTimeout(function () {
          el.classList.add('is-in');
          el.style.transitionDelay = '';
        }, delay);
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    for (var i = 0; i < targets.length; i++) io.observe(targets[i]);
    // Anything already on screen at load reveals immediately, and a failsafe
    // sweep clears the rest so content can never be stranded invisible.
    setTimeout(function () {
      for (var j = 0; j < targets.length; j++) targets[j].classList.add('is-in');
    }, 2600);
  }

  // Scroll parallax. Images drift object-position so we never collide with a
  // transform-based keyframe; everything else translates.
  var layers = [].slice.call(document.querySelectorAll('[data-parallax]'));
  var outs = [].slice.call(document.querySelectorAll('[data-scrollout]'));
  var nav = document.querySelector('nav');
  var bar = document.getElementById('scroll-progress');
  var ticking = false;

  function frame() {
    ticking = false;
    var vh = window.innerHeight;
    for (var i = 0; i < layers.length; i++) {
      var el = layers[i];
      var rect = el.getBoundingClientRect();
      if (rect.bottom < -200 || rect.top > vh + 200) continue;
      var speed = parseFloat(el.getAttribute('data-parallax')) || 0.2;
      var progress = (rect.top + rect.height / 2 - vh / 2) / vh;
      if (el.tagName === 'IMG') {
        el.style.objectPosition = '50% ' + (50 + progress * speed * 42) + '%';
      } else if (el.hasAttribute('data-parallax-bg')) {
        el.style.backgroundPosition = '50% ' + (50 + progress * speed * 40) + '%';
      } else {
        el.style.transform = 'translate3d(0,' + (progress * speed * -90).toFixed(2) + 'px,0)';
      }
    }

    // Hero copy drifts up and dissolves as the page scrolls past it, so the
    // first screen feels like a layer being left behind rather than a slab.
    for (var n = 0; n < outs.length; n++) {
      var out = outs[n];
      var oRect = out.getBoundingClientRect();
      if (oRect.bottom < 0) continue;
      var travelled = Math.min(Math.max(-oRect.top / vh, 0), 1);
      out.style.transform = 'translate3d(0,' + (travelled * -70).toFixed(2) + 'px,0)';
      out.style.opacity = String(1 - travelled * 1.15 < 0 ? 0 : 1 - travelled * 1.15);
    }

    if (bar) {
      var max = document.body.scrollHeight - vh;
      bar.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + '%';
    }
    if (nav) nav.classList.toggle('is-stuck', window.scrollY > 40);
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(frame);
  }

  if (!reduce && (layers.length || outs.length || bar)) {
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
  } else if (nav) {
    window.addEventListener('scroll', function () {
      nav.classList.toggle('is-stuck', window.scrollY > 40);
    }, { passive: true });
  }
  frame();

  // Count-ups. The final value is already in the DOM, so a failure here leaves
  // the finished number on screen rather than a zero.
  if (!reduce && 'IntersectionObserver' in window) {
    var nums = document.querySelectorAll('[data-count]');
    var numObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        numObserver.unobserve(el);
        var full = el.textContent;
        var match = full.match(/[\\d.,]+/);
        if (!match) return;
        var target = parseFloat(match[0].replace(/,/g, ''));
        if (!isFinite(target) || target <= 0) return;
        var decimals = (match[0].split('.')[1] || '').length;
        var grouped = match[0].indexOf(',') > -1;
        var started = null;
        function step(now) {
          if (started === null) started = now;
          var t = Math.min((now - started) / 1400, 1);
          var eased = 1 - Math.pow(1 - t, 3);
          var value = (target * eased).toFixed(decimals);
          if (grouped) value = Number(value).toLocaleString('en-US');
          el.textContent = full.replace(match[0], value);
          if (t < 1) window.requestAnimationFrame(step);
          else el.textContent = full;
        }
        window.requestAnimationFrame(step);
      });
    }, { threshold: 0.5 });
    for (var k = 0; k < nums.length; k++) numObserver.observe(nums[k]);
  }
})();`;

// --------------------------------------------------------------------------
// Post-pass
// --------------------------------------------------------------------------

/** Pulls a solid background colour out of an inline style, if there is one. */
function backgroundOf(style: string): string | null {
  const url = /background(?:-image)?\s*:\s*url\(/i.test(style);
  if (url) return null;
  const match = style.match(/background(?:-color)?\s*:\s*(#[0-9a-f]{3,8}|rgba?\([^)]*\)|linear-gradient\([^)]*\))/i);
  if (!match) return null;
  // Gradients can't fill an SVG divider cleanly, so those seams stay plain.
  return /linear-gradient/i.test(match[1]) ? null : match[1];
}

function isTransparentish(color: string): boolean {
  return /rgba\([^)]*,\s*0?\.\d+\s*\)/i.test(color) || color === 'transparent';
}

function isImageBackground(style: string): boolean {
  return /background(?:-image)?\s*:\s*url\(/i.test(style);
}

function toRgb(color: string): [number, number, number] | null {
  const hex = color.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    const value = hex[1].length === 3 ? hex[1].split('').map((c) => c + c).join('') : hex[1];
    return [
      parseInt(value.slice(0, 2), 16),
      parseInt(value.slice(2, 4), 16),
      parseInt(value.slice(4, 6), 16),
    ];
  }
  const rgb = color.match(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i);
  return rgb ? [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])] : null;
}

/**
 * Two backgrounds only warrant a divider if the change is actually visible —
 * #fafaf9 against #fafaf5 is a seam nobody can see, and cutting a wave into it
 * just adds noise.
 */
function coloursDiffer(a: string, b: string): boolean {
  const left = toRgb(a);
  const right = toRgb(b);
  if (!left || !right) return a !== b;
  const distance =
    Math.abs(left[0] - right[0]) + Math.abs(left[1] - right[1]) + Math.abs(left[2] - right[2]);
  return distance > 40;
}

/**
 * True for decorative or shallow sections that a 90px divider would consume.
 * Vertical padding is the only height signal available in the markup, so a
 * section padded under 60px is treated as a band rather than a full section.
 */
function isShortBand(tag: string, style: string): boolean {
  if (/aria-hidden/.test(tag)) return true;
  const padding = style.match(/padding\s*:\s*(\d+)px/);
  return padding ? Number(padding[1]) < 60 : false;
}

/**
 * Marks up a built page for motion and slots dividers between colour changes.
 * Runs on the raw section markup, so it works identically for the hand-written
 * homepages and the composed interior pages.
 */
export function enliven(
  html: string,
  pageBackground: string,
  accent: string,
  motion: MotionProfile
): string {
  let out = html;

  // 1. Full-bleed backdrop images become parallax layers. Matching on the
  //    absolute-inset positioning keeps content photos and portraits out of it.
  out = out.replace(
    /<img((?=[^>]*style="[^"]*position:absolute[^"]*")(?=[^>]*style="[^"]*object-fit:cover[^"]*")[^>]*?)>/g,
    (match, attrs: string) => (attrs.includes('data-parallax') ? match : `<img data-parallax="${motion.backdrop}"${attrs}>`)
  );

  // 1b. The hand-written homepages build their heroes as `background:url(...)`
  //     sections rather than layered <img> elements, so those drift their
  //     background-position instead. Same effect, different property.
  out = out.replace(
    /<section\b([^>]*style="[^"]*background(?:-image)?\s*:\s*url\([^"]*")([^>]*)>/g,
    (match, head: string, tail: string) =>
      match.includes('data-parallax') ? match : `<section data-parallax="${motion.backdrop}" data-parallax-bg${head}${tail}>`
  );

  // 1c. In-flow content photography drifts too, at roughly a third of the
  //     backdrop rate. This is what stops the middle of a page feeling static
  //     once the hero has scrolled away.
  out = out.replace(
    /<img((?![^>]*data-parallax)(?=[^>]*style="[^"]*object-fit:cover[^"]*")[^>]*?)>/g,
    (match, attrs: string) =>
      /position:absolute/.test(attrs) ? match : `<img data-parallax="${motion.content}"${attrs}>`
  );

  // 1d. Decorative layers counter-drift against the content. Two layers moving
  //     at different rates in opposite directions is the whole trick behind
  //     depth — one layer alone just looks like a slow image.
  out = out.replace(
    /<div aria-hidden="true"((?![^>]*data-parallax)[^>]*style="[^"]*(?:position:absolute|-webkit-text-stroke)[^"]*")([^>]*)>/g,
    (match, head: string, tail: string) => `<div aria-hidden="true" data-parallax="-0.16"${head}${tail}>`
  );

  // 2. Headings, paragraphs, and cards reveal on scroll with a small stagger
  //    per section. Decorative and absolutely-positioned nodes are skipped so
  //    nothing that owns its own transform gets a second one.
  out = out.replace(/<section\b([^>]*)>([\s\S]*?)<\/section>/g, (match, attrs: string, body: string) => {
    let within = 0;
    let marked = body.replace(
      /<(h1|h2|h3|p|figure|blockquote|div class="card"|a href)\b([^>]*)>/g,
      (tag: string, name: string, rest: string) => {
        if (rest.includes('data-reveal') || rest.includes('aria-hidden')) return tag;
        if (/position:absolute/.test(rest)) return tag;
        if (within >= 10) return tag;
        const style = motion.reveals[within % motion.reveals.length];
        const delay = within * motion.stagger;
        within += 1;
        return `<${name}${rest} data-reveal${style ? `="${style}"` : ''} data-delay="${delay}">`;
      }
    );

    // Image frames wipe open from the bottom instead of just fading — a
    // photograph revealing itself reads as craft where a fade reads as a page
    // still loading.
    let masked = 0;
    marked = marked.replace(
      /<div((?=[^>]*style="[^"]*overflow:hidden[^"]*")(?=[^>]*style="[^"]*border-radius[^"]*")(?![^>]*data-mask)(?![^>]*position:absolute)[^>]*?)>/g,
      (tag: string, attrs: string) => {
        if (masked >= 3) return tag;
        masked += 1;
        return `<div data-mask data-delay="${masked * 110}"${attrs}>`;
      }
    );

    return `<section${attrs}>${marked}</section>`;
  });

  // 3. Shape dividers wherever two adjacent sections change background.
  //    Sections with no declared background inherit the page colour, so that is
  //    what they are compared against — otherwise almost every seam on a
  //    hand-written homepage looks like "no change" and gets skipped.
  const sections = [...out.matchAll(/<section\b[^>]*style="([^"]*)"[^>]*>/g)];
  const seams: Array<{ at: number; fill: string; variant: DividerVariant }> = [];
  for (let index = 0; index < sections.length - 1; index += 1) {
    const currentStyle = sections[index][1];
    const nextStyle = sections[index + 1][1];
    const next = backgroundOf(nextStyle) ?? (isImageBackground(nextStyle) ? null : pageBackground);
    if (!next || isTransparentish(next)) continue;

    // A photographic section always earns a cut into whatever follows it —
    // that shape over the bottom of a hero is the signature theme-demo move.
    const overImage = isImageBackground(currentStyle);
    const current = backgroundOf(currentStyle) ?? (overImage ? null : pageBackground);
    if (!overImage && (!current || !coloursDiffer(current, next))) continue;

    // A divider carves up to 90px out of the section above it, so a short band
    // (a marquee strip, a thin notice) would be eaten alive — and a seam on
    // each side of one would erase it completely. Leave those edges square.
    if (isShortBand(sections[index][0], currentStyle) || isShortBand(sections[index + 1][0], nextStyle)) continue;

    const end = out.indexOf('</section>', sections[index].index ?? 0);
    if (end === -1) continue;
    seams.push({ at: end + '</section>'.length, fill: next, variant: motion.dividers[seams.length % motion.dividers.length] as DividerVariant });
  }
  // Splice from the end so earlier offsets stay valid. The divider is pulled up
  // by its own height so the shape CARVES the section above it — sitting it
  // between two sections in normal flow just fills the gap with the colour
  // that is already there, which renders as nothing at all.
  for (let index = seams.length - 1; index >= 0; index -= 1) {
    const seam = seams[index];
    const shape = `<div style="position:relative;z-index:3;margin-top:calc(clamp(40px,6vw,90px) * -1);pointer-events:none">${divider(seam.variant, seam.fill)}</div>`;
    out = out.slice(0, seam.at) + shape + out.slice(seam.at);
  }

  // 3b. The first section's copy is the scroll-out layer: it rises and
  //     dissolves while the backdrop behind it drifts the other way.
  const firstSection = out.match(/<section\b[^>]*>/);
  if (firstSection && firstSection.index !== undefined) {
    const start = firstSection.index + firstSection[0].length;
    const contentDiv = out.slice(start).match(/<div class="ctn"([^>]*)>|<div style="position:relative;z-index:[^"]*"([^>]*)>/);
    if (contentDiv && contentDiv.index !== undefined && contentDiv.index < 900) {
      const at = start + contentDiv.index;
      out =
        out.slice(0, at) +
        contentDiv[0].replace('<div ', '<div data-scrollout ') +
        out.slice(at + contentDiv[0].length);
    }
  }

  // 3c. A brand-gradient progress rail across the top. Small, but it makes the
  //     whole page feel responsive to the scroll rather than indifferent to it.
  out = out.replace(
    '<body>',
    `<body><div id="scroll-progress" style="background:linear-gradient(90deg,${accent},${accent}55)"></div>`
  );

  // 4. Large standalone numerals count up. The value stays in the DOM, so this
  //    is additive — a script failure leaves the final figure on screen.
  out = out.replace(
    /<div style="([^"]*font-size:clamp\((?:3[4-9]|[4-9]\d)px[^"]*)"\s*>([$£€]?[\d][\d,.]*[%+KMB]?)<\/div>/g,
    (match, style: string, value: string) => `<div data-count style="${style}">${value}</div>`
  );

  return out;
}
