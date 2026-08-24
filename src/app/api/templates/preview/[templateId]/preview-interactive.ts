/**
 * Working site features for template previews: a real navigation menu on
 * mobile, and a booking calendar you can actually click through.
 *
 * Up to now every preview was a scrolling brochure — the nav links vanished
 * under 768px with no hamburger to replace them, and nothing demonstrated the
 * booking flow the product actually sells. Both are built here as genuine
 * interactions rather than pictures of interactions.
 *
 * Fail-open, same as the motion layer: the calendar grid and every nav link are
 * server-rendered, so with JavaScript off you still get a readable month and a
 * reachable menu. The script only adds selection, month paging, and the slide
 * -down panel.
 */
import type { PreviewTheme } from './preview-pages';
import type { Palette } from './preview-sections';
import { eyebrow, heading } from './preview-sections';
import { getPreviewPages, previewHref } from '@/lib/templates/preview-nav';

export const INTERACTIVE_CSS = `
.mnav-btn{display:none;align-items:center;justify-content:center;width:42px;height:42px;border-radius:10px;border:1px solid currentColor;background:transparent;cursor:pointer;padding:0}
.mnav-btn span{display:block;width:18px;height:2px;background:currentColor;position:relative}
.mnav-btn span::before,.mnav-btn span::after{content:"";position:absolute;left:0;width:18px;height:2px;background:currentColor;transition:transform .3s}
.mnav-btn span::before{top:-6px}.mnav-btn span::after{top:6px}
.mnav-btn[aria-expanded="true"] span{background:transparent}
.mnav-btn[aria-expanded="true"] span::before{transform:translateY(6px) rotate(45deg)}
.mnav-btn[aria-expanded="true"] span::after{transform:translateY(-6px) rotate(-45deg)}
.mnav-panel{position:fixed;left:0;right:0;z-index:49;display:none;flex-direction:column;padding:14px 20px 22px;box-shadow:0 18px 50px rgba(0,0,0,.28)}
.mnav-panel.is-open{display:flex}
.mnav-panel a{padding:14px 4px;font-size:16px;font-weight:600;border-bottom:1px solid rgba(128,128,128,.22)}
@media(max-width:768px){.mnav-btn{display:inline-flex}}
@media(min-width:769px){.mnav-panel{display:none!important}}

.cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:6px}
.cal-dow{font-size:11px;letter-spacing:1px;text-transform:uppercase;text-align:center;padding-bottom:6px;opacity:.6}
.cal-day{aspect-ratio:1;display:flex;align-items:center;justify-content:center;border-radius:10px;border:1px solid transparent;font-size:14px;font-family:inherit;background:transparent;color:inherit;cursor:pointer;transition:background .2s,color .2s,border-color .2s}
.cal-day[disabled]{opacity:.28;cursor:default}
.cal-day.is-free:hover{border-color:currentColor}
.cal-day.is-picked{color:#fff!important}
.cal-slot{padding:11px 8px;border-radius:9px;font-size:13.5px;font-weight:600;font-family:inherit;cursor:pointer;background:transparent;transition:background .2s,color .2s,border-color .2s}
.cal-slot:hover{border-color:currentColor}
.cal-slot.is-picked{color:#fff!important}
.cal-empty{visibility:hidden}
@media(max-width:768px){.cal-cols{grid-template-columns:1fr!important}}`;

export const INTERACTIVE_JS = `(function(){
  // ---- Mobile navigation -------------------------------------------------
  var toggle = document.querySelector('[data-menu-toggle]');
  var panel = document.querySelector('[data-menu-panel]');
  if (toggle && panel) {
    toggle.addEventListener('click', function () {
      var open = panel.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    panel.addEventListener('click', function (event) {
      if (event.target.tagName === 'A') {
        panel.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 768) {
        panel.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // ---- Booking calendar --------------------------------------------------
  var cal = document.querySelector('[data-calendar]');
  if (!cal) return;

  var accent = cal.getAttribute('data-accent') || '#333';
  var grid = cal.querySelector('[data-cal-grid]');
  var label = cal.querySelector('[data-cal-label]');
  var summary = cal.querySelector('[data-cal-summary]');
  var confirm = cal.querySelector('[data-cal-confirm]');
  var slots = [].slice.call(cal.querySelectorAll('.cal-slot'));
  var MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  var DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

  var today = new Date();
  today.setHours(0, 0, 0, 0);
  var view = new Date(today.getFullYear(), today.getMonth(), 1);
  var picked = null;
  var pickedSlot = null;

  function paint() {
    if (!grid) return;
    label.textContent = MONTHS[view.getMonth()] + ' ' + view.getFullYear();
    grid.innerHTML = '';
    var first = new Date(view.getFullYear(), view.getMonth(), 1).getDay();
    var count = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
    for (var blank = 0; blank < first; blank++) {
      var spacer = document.createElement('div');
      spacer.className = 'cal-day cal-empty';
      grid.appendChild(spacer);
    }
    for (var day = 1; day <= count; day++) {
      var date = new Date(view.getFullYear(), view.getMonth(), day);
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'cal-day';
      button.textContent = String(day);
      // Past dates and Sundays read as unavailable, which is what makes a
      // calendar look like a real booking system rather than a date picker.
      if (date < today || date.getDay() === 0) {
        button.disabled = true;
      } else {
        button.classList.add('is-free');
        button.setAttribute('data-date', date.toISOString().slice(0, 10));
        if (picked && button.getAttribute('data-date') === picked) {
          button.classList.add('is-picked');
          button.style.background = accent;
        }
      }
      grid.appendChild(button);
    }
  }

  function fieldValue(name) {
    var el = cal.querySelector('[data-book-field="' + name + '"]');
    return el ? el.value.trim() : '';
  }

  function describe() {
    if (!summary) return;
    if (!picked) {
      summary.textContent = 'Choose a date to get started.';
      if (confirm) confirm.setAttribute('disabled', 'disabled');
      return;
    }
    var parts = picked.split('-');
    var date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    var text = DAYS[date.getDay()] + ' ' + date.getDate() + ' ' + MONTHS[date.getMonth()];

    if (!pickedSlot) {
      summary.textContent = text + ' — now pick a time.';
      if (confirm) confirm.setAttribute('disabled', 'disabled');
      return;
    }

    // Details travel with the slot, so the booking is only requestable once we
    // know who is asking.
    var name = fieldValue('name');
    var email = fieldValue('email');
    var choice = fieldValue('choice');
    var line = text + ' at ' + pickedSlot + (choice ? ' · ' + choice : '');

    if (!name || !email) {
      summary.textContent = line + ' — add your name and email to confirm.';
      if (confirm) confirm.setAttribute('disabled', 'disabled');
      return;
    }

    summary.textContent = line + ' · ' + name + ' (' + email + ')';
    if (confirm) confirm.removeAttribute('disabled');
  }

  var fields = [].slice.call(cal.querySelectorAll('[data-book-field]'));
  fields.forEach(function (field) {
    field.addEventListener('input', describe);
    field.addEventListener('change', describe);
  });

  grid.addEventListener('click', function (event) {
    var button = event.target.closest ? event.target.closest('.cal-day') : null;
    if (!button || button.disabled) return;
    picked = button.getAttribute('data-date');
    paint();
    describe();
  });

  slots.forEach(function (slot) {
    slot.addEventListener('click', function () {
      slots.forEach(function (other) {
        other.classList.remove('is-picked');
        other.style.background = '';
      });
      slot.classList.add('is-picked');
      slot.style.background = accent;
      pickedSlot = slot.textContent.trim();
      describe();
    });
  });

  var prev = cal.querySelector('[data-cal-prev]');
  var next = cal.querySelector('[data-cal-next]');
  if (prev) prev.addEventListener('click', function () {
    view = new Date(view.getFullYear(), view.getMonth() - 1, 1);
    if (view < new Date(today.getFullYear(), today.getMonth(), 1)) {
      view = new Date(today.getFullYear(), today.getMonth(), 1);
    }
    paint();
  });
  if (next) next.addEventListener('click', function () {
    view = new Date(view.getFullYear(), view.getMonth() + 1, 1);
    paint();
  });

  if (confirm) confirm.addEventListener('click', function () {
    if (!picked || !pickedSlot || !fieldValue('name') || !fieldValue('email')) return;
    // Echo back everything that would have been submitted together, so it is
    // obvious the details and the slot are one request rather than two.
    var parts = picked.split('-');
    var date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    var lines = [
      DAYS[date.getDay()] + ' ' + date.getDate() + ' ' + MONTHS[date.getMonth()] + ' at ' + pickedSlot,
      fieldValue('choice'),
      fieldValue('name') + ' · ' + fieldValue('email') + (fieldValue('phone') ? ' · ' + fieldValue('phone') : ''),
      fieldValue('notes'),
    ].filter(Boolean);
    summary.innerHTML = '<strong>Request ready to send</strong><br>' + lines.join('<br>');
    confirm.setAttribute('disabled', 'disabled');
    confirm.textContent = 'Requested';
  });

  paint();
  describe();
})();`;

// --------------------------------------------------------------------------
// Mobile navigation
// --------------------------------------------------------------------------

/**
 * Replaces whatever <nav> a page shipped with the shared one, so every page of
 * a template has an identical header.
 *
 * The hand-written homepages each carried their own nav with their own link set
 * (Ivory's listed "Agents", a page that does not exist) and their own tinted
 * background, while interior pages used the shared chrome — so the header
 * visibly changed on every navigation. The shared nav is themed per template,
 * so each site keeps its character without the header moving underneath the
 * visitor.
 */
export function unifyNav(html: string, navHtml: string): string {
  const open = html.indexOf('<nav');
  if (open === -1) return html;
  const close = html.indexOf('</nav>', open);
  if (close === -1) return html;
  return html.slice(0, open) + navHtml + html.slice(close + '</nav>'.length);
}

/**
 * Adds a hamburger to the nav plus a slide-down panel carrying the same links.
 */
export function injectMobileNav(html: string, templateId: string, theme: PreviewTheme): string {
  // Guard on the rendered markup, not the attribute name: INTERACTIVE_JS
  // contains the `[data-menu-toggle]` selector, so testing for the attribute
  // matches this page's own runtime and short-circuits every injection.
  if (html.includes('class="mnav-panel"')) return html;

  const pages = getPreviewPages(templateId);
  const surface = theme.isDark ? '#111113' : '#ffffff';
  const text = theme.isDark ? '#fafaf9' : '#09090b';

  const button = `<button class="mnav-btn" data-menu-toggle aria-expanded="false" aria-label="Open menu" style="color:${text};margin-left:10px"><span></span></button>`;

  const panel = `<div class="mnav-panel" data-menu-panel style="top:64px;background:${surface};color:${text}">
${pages.map((page) => `<a href="${previewHref(templateId, page.key)}" style="color:${text}">${page.label}</a>`).join('')}
<a href="${previewHref(templateId, 'contact')}" style="margin-top:14px;padding:14px;text-align:center;border-radius:9px;background:${theme.secondary};color:#fff;border-bottom:0">${theme.cta}</a>
</div>`;

  // The button goes just inside the closing </nav> so it sits at the end of the
  // existing flex row; the panel goes immediately after it.
  const closing = html.indexOf('</nav>');
  if (closing === -1) return html;
  return html.slice(0, closing) + button + html.slice(closing, closing + '</nav>'.length) + panel + html.slice(closing + '</nav>'.length);
}

// --------------------------------------------------------------------------
// Booking calendar
// --------------------------------------------------------------------------

const SLOTS = ['9:00 am', '10:30 am', '12:00 pm', '1:30 pm', '3:00 pm', '4:30 pm'];
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Server-rendered month so the calendar is readable before any script runs. */
function staticMonth(theme: PreviewTheme, p: Palette): string {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1).getDay();
  const count = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const cells: string[] = [];
  for (let blank = 0; blank < first; blank += 1) {
    cells.push('<div class="cal-day cal-empty"></div>');
  }
  for (let day = 1; day <= count; day += 1) {
    const date = new Date(now.getFullYear(), now.getMonth(), day);
    const unavailable = day < now.getDate() || date.getDay() === 0;
    cells.push(
      `<button type="button" class="cal-day${unavailable ? '' : ' is-free'}"${unavailable ? ' disabled' : ''} style="color:${p.txt}">${day}</button>`
    );
  }
  return `<div class="cal-grid" style="margin-bottom:8px">${DOW.map((d) => `<div class="cal-dow" style="color:${p.muted}">${d}</div>`).join('')}</div>
<div class="cal-grid" data-cal-grid>${cells.join('')}</div>`;
}


/**
 * One booking form: the calendar, the time, what it is about, and who you are,
 * submitted together. Splitting "send a message" from "request a booking" put
 * two competing submits on one page and forced the visitor to decide which one
 * the business actually reads — so the details live inside the booking flow and
 * travel with the slot.
 */
export function bookingSection(
  templateId: string,
  theme: PreviewTheme,
  p: Palette,
  options: { title: string; intro: string; choiceLabel: string; choices: string[] }
): string {
  const now = new Date();
  const monthLabel = `${['January','February','March','April','May','June','July','August','September','October','November','December'][now.getMonth()]} ${now.getFullYear()}`;

  const field = (label: string, name: string, tag: 'input' | 'textarea', type = 'text', required = false) =>
    `<label style="display:block">
<span style="display:block;font-size:11.5px;font-weight:700;letter-spacing:1.6px;text-transform:uppercase;color:${theme.secondary};margin-bottom:8px">${label}${required ? '' : ' <span style="opacity:.6;font-weight:600">(optional)</span>'}</span>
${
  tag === 'input'
    ? `<input type="${type}" data-book-field="${name}"${required ? ' required' : ''} style="width:100%;padding:12px 14px;border:1px solid ${p.brd};border-radius:9px;background:${p.surface};color:${p.txt};font-family:inherit;font-size:14.5px"/>`
    : `<textarea rows="3" data-book-field="${name}" style="width:100%;padding:12px 14px;border:1px solid ${p.brd};border-radius:9px;background:${p.surface};color:${p.txt};font-family:inherit;font-size:14.5px;resize:vertical"></textarea>`
}</label>`;

  return `<section class="sp" style="padding:96px 20px;background:${p.alt}" id="book">
<div class="ctn">
<div style="margin-bottom:44px">${eyebrow('Availability', theme)}${heading(options.title, theme, p)}
<p style="margin-top:16px;font-size:16px;line-height:1.75;color:${p.muted};max-width:56ch">${options.intro}</p></div>

<div data-calendar data-accent="${theme.secondary}" style="border:1px solid ${p.brd};border-radius:20px;background:${p.card};overflow:hidden">

  <div class="g2 cal-cols" style="display:grid;grid-template-columns:1.05fr .95fr">
    <div style="padding:28px;border-right:1px solid ${p.brd}">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px">
        <div style="font-size:11.5px;font-weight:700;letter-spacing:1.6px;text-transform:uppercase;color:${theme.secondary}">Step 1 — Pick a date</div>
        <div style="display:flex;gap:8px">
          <button type="button" data-cal-prev aria-label="Previous month" style="width:32px;height:32px;border-radius:9px;border:1px solid ${p.brd};background:transparent;color:${p.txt};cursor:pointer;font-family:inherit">&lsaquo;</button>
          <button type="button" data-cal-next aria-label="Next month" style="width:32px;height:32px;border-radius:9px;border:1px solid ${p.brd};background:transparent;color:${p.txt};cursor:pointer;font-family:inherit">&rsaquo;</button>
        </div>
      </div>
      <div data-cal-label style="font-family:'${theme.fHead}',serif;font-size:19px;font-weight:700;color:${p.txt};margin-bottom:16px">${monthLabel}</div>
      ${staticMonth(theme, p)}
      <p style="margin-top:16px;font-size:12.5px;color:${p.muted}">Sundays and past dates are shown as unavailable.</p>
    </div>

    <div style="padding:28px">
      <div style="font-size:11.5px;font-weight:700;letter-spacing:1.6px;text-transform:uppercase;color:${theme.secondary};margin-bottom:14px">Step 2 — Pick a time</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:26px">
        ${SLOTS.map((slot) => `<button type="button" class="cal-slot" style="border:1px solid ${p.brd};color:${p.txt}">${slot}</button>`).join('')}
      </div>

      <label style="display:block">
        <span style="display:block;font-size:11.5px;font-weight:700;letter-spacing:1.6px;text-transform:uppercase;color:${theme.secondary};margin-bottom:8px">${options.choiceLabel}</span>
        <select data-book-field="choice" style="width:100%;padding:12px 14px;border:1px solid ${p.brd};border-radius:9px;background:${p.surface};color:${p.txt};font-family:inherit;font-size:14.5px">
          ${options.choices.map((choice) => `<option>${choice}</option>`).join('')}
        </select>
      </label>
    </div>
  </div>

  <div style="padding:28px;border-top:1px solid ${p.brd}">
    <div style="font-size:11.5px;font-weight:700;letter-spacing:1.6px;text-transform:uppercase;color:${theme.secondary};margin-bottom:16px">Step 3 — Your details</div>
    <div class="g2" style="display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-bottom:18px">
      ${field('Name', 'name', 'input', 'text', true)}
      ${field('Email', 'email', 'input', 'email', true)}
    </div>
    <div class="g2" style="display:grid;grid-template-columns:1fr 1fr;gap:18px">
      ${field('Phone', 'phone', 'input', 'tel')}
      ${field('Anything we should know', 'notes', 'textarea')}
    </div>
  </div>

  <div style="padding:24px 28px;border-top:1px solid ${p.brd};background:${theme.secondary}12;display:flex;flex-wrap:wrap;gap:18px;align-items:center;justify-content:space-between">
    <div style="min-width:240px;flex:1">
      <div style="font-size:11.5px;font-weight:700;letter-spacing:1.6px;text-transform:uppercase;color:${theme.secondary};margin-bottom:6px">Your booking</div>
      <div data-cal-summary style="font-size:15px;line-height:1.6;color:${p.txt}">Choose a date to get started.</div>
    </div>
    <button type="button" data-cal-confirm disabled style="padding:15px 34px;background:${theme.secondary};color:#fff;border:0;border-radius:9px;font-weight:700;font-size:15px;font-family:inherit;cursor:pointer">Request this booking</button>
  </div>
</div>

<p style="margin-top:16px;font-size:12.5px;color:${p.muted}">This is a template preview — nothing is sent. On a published site this books the slot and emails you both.</p>
</div></section>`;
}
