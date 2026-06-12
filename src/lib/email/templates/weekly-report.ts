// The Monday morning report: what the owner's website(s) did for them last
// week. The narrative comes from Claude; the numbers table is deterministic.

import type { WeeklyTotals, WeeklyProjectStats } from '@/lib/ai/weekly-report';

export function weeklyReportEmail(p: {
  narrative: string;
  totals: WeeklyTotals;
  projects: WeeklyProjectStats[];
}) {
  const hasActivity = p.totals.leads + p.totals.bookings + p.totals.orders > 0;
  const subject = hasActivity
    ? `Your website's week: ${[
        p.totals.leads && `${p.totals.leads} lead${p.totals.leads === 1 ? '' : 's'}`,
        p.totals.bookings && `${p.totals.bookings} booking${p.totals.bookings === 1 ? '' : 's'}`,
        p.totals.orders && `${p.totals.orders} order${p.totals.orders === 1 ? '' : 's'}`,
      ].filter(Boolean).join(', ')}`
    : 'Your website checked in — quiet week, standing by';

  const text =
    `${p.narrative}\n\n` +
    p.projects.map((proj) =>
      `${proj.name}\n` +
      `  Leads: ${proj.leads} · Bookings: ${proj.bookings}${proj.bookingsConfirmed ? ` (${proj.bookingsConfirmed} confirmed)` : ''} · Orders: ${proj.orders}${proj.revenue ? ` ($${proj.revenue.toFixed(2)})` : ''}` +
      (proj.topPages.length ? `\n  Top pages: ${proj.topPages.map(([page, n]) => `${page} (${n})`).join(', ')}` : '')
    ).join('\n\n') +
    `\n\n— SiteCraft, working for you 24/7`;

  const html = `<!doctype html>
<html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:560px;margin:40px auto;padding:0 24px;color:#111;line-height:1.55">
  <p style="font-size:13px;color:#7c3aed;font-weight:600;margin:0 0 4px;text-transform:uppercase;letter-spacing:.04em">Your Monday report</p>
  <p style="font-size:17px;color:#111;margin:0 0 24px">${esc(p.narrative)}</p>
  ${p.projects.map((proj) => `
  <div style="border:1px solid #e5e5e5;border-radius:10px;padding:16px 18px;margin:0 0 14px">
    <p style="margin:0 0 10px;font-weight:600;font-size:15px">${esc(proj.name)}</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px;color:#333">
      <tr>
        <td style="padding:4px 0">Leads</td><td style="text-align:right;font-weight:600">${proj.leads}</td>
      </tr>
      <tr>
        <td style="padding:4px 0">Bookings</td><td style="text-align:right;font-weight:600">${proj.bookings}${proj.bookingsConfirmed ? ` <span style="color:#16a34a;font-weight:500">(${proj.bookingsConfirmed} confirmed)</span>` : ''}</td>
      </tr>
      <tr>
        <td style="padding:4px 0">Orders</td><td style="text-align:right;font-weight:600">${proj.orders}${proj.revenue ? ` <span style="color:#16a34a;font-weight:500">($${proj.revenue.toFixed(2)})</span>` : ''}</td>
      </tr>
    </table>
    ${proj.topPages.length ? `<p style="margin:10px 0 0;font-size:13px;color:#666">Top pages: ${proj.topPages.map(([page, n]) => `${esc(page)} (${n})`).join(' · ')}</p>` : ''}
  </div>`).join('')}
  <p style="color:#666;font-size:13px;margin-top:28px">— SiteCraft, working for you 24/7</p>
</body></html>`;

  return { subject, html, text };
}

function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}
