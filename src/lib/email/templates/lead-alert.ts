// Sent to the site OWNER the moment their published site captures a lead
// (contact form, quote request, booking request, etc). The goal is "your
// website just did work for you" — lead details up front, one click to reply.

export function leadAlertEmail(p: {
  projectName: string;
  formType: string;          // 'contact' | 'quote' | 'booking' | ...
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  message?: string | null;
  serviceNeeded?: string | null;
  preferredDate?: string | null;
  sourcePage?: string | null;
  imageCount?: number;
  leadsUrl: string;          // dashboard deep link to this project's leads page
  aiDraft?: string | null;   // AI-drafted reply shown for one-click approval
  replySendUrl?: string | null; // signed link that sends the draft to the lead
  bookingActions?: { confirmUrl: string; declineUrl: string } | null; // one-click booking decision
}) {
  const who = p.name || p.email || p.phone || 'A visitor';
  const kind = p.formType === 'contact' ? 'lead' : p.formType.replace(/_/g, ' ');
  const subject = `${esc0(who)} just ${p.formType === 'booking' ? 'requested a booking' : `sent you a new ${kind}`} — ${esc0(p.projectName)}`;

  const rows: Array<[string, string]> = [];
  if (p.name) rows.push(['Name', p.name]);
  if (p.email) rows.push(['Email', p.email]);
  if (p.phone) rows.push(['Phone', p.phone]);
  if (p.serviceNeeded) rows.push(['Service', p.serviceNeeded]);
  if (p.preferredDate) rows.push(['Preferred date', p.preferredDate]);
  if (p.message) rows.push(['Message', p.message]);
  if (p.imageCount) rows.push(['Photos', `${p.imageCount} attached (view in dashboard)`]);
  if (p.sourcePage) rows.push(['From page', p.sourcePage]);

  const text =
    `Your website just captured a new ${kind}.\n\n` +
    rows.map(([k, v]) => `${k}: ${v}`).join('\n') +
    (p.bookingActions
      ? `\n\nConfirm: ${p.bookingActions.confirmUrl}\nDecline: ${p.bookingActions.declineUrl}\n`
      : '') +
    (p.aiDraft
      ? `\n\n--- Suggested reply (written for you) ---\n${p.aiDraft}\n---\n` +
        (p.replySendUrl ? `Send it with one click: ${p.replySendUrl}\n` : '')
      : '') +
    `\n\nView and reply: ${p.leadsUrl}\n\n` +
    `Tip: leads contacted within 5 minutes are far more likely to close.\n— SiteCraft`;

  const html = `<!doctype html>
<html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:560px;margin:40px auto;padding:0 24px;color:#111;line-height:1.55">
  <p style="font-size:13px;color:#16a34a;font-weight:600;margin:0 0 4px;text-transform:uppercase;letter-spacing:.04em">Your website is working</p>
  <h1 style="font-size:21px;margin:0 0 16px">${esc(who)} just reached out via ${esc(p.projectName)}.</h1>
  <table style="width:100%;border-collapse:collapse;font-size:14px;margin:0 0 24px">
    ${rows.map(([k, v]) => `<tr>
      <td style="padding:8px 12px 8px 0;color:#666;vertical-align:top;white-space:nowrap">${esc(k)}</td>
      <td style="padding:8px 0;color:#111">${esc(v)}</td>
    </tr>`).join('\n')}
  </table>
  ${p.bookingActions ? `<p style="margin:0 0 20px">
    <a href="${p.bookingActions.confirmUrl}" style="display:inline-block;background:#16a34a;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600">Confirm booking ✓</a>
    <a href="${p.bookingActions.declineUrl}" style="display:inline-block;margin-left:12px;background:#fff;color:#b91c1c;border:1px solid #fca5a5;text-decoration:none;padding:11px 20px;border-radius:8px;font-weight:600">Decline</a>
  </p>` : ''}
  ${p.aiDraft ? `<div style="border:1px solid #e5e5e5;border-left:3px solid #7c3aed;border-radius:8px;padding:16px 18px;margin:0 0 20px;background:#faf9ff">
    <p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#7c3aed;text-transform:uppercase;letter-spacing:.04em">Suggested reply — written for you</p>
    <p style="margin:0;font-size:14px;color:#222;white-space:pre-line">${esc(p.aiDraft)}</p>
    ${p.replySendUrl ? `<p style="margin:14px 0 0">
      <a href="${p.replySendUrl}" style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;padding:10px 16px;border-radius:8px;font-weight:600;font-size:14px">Send this reply →</a>
    </p>` : ''}
  </div>` : ''}
  <p style="margin:0 0 28px">
    <a href="${p.leadsUrl}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600">View &amp; reply →</a>
    ${p.email ? `<a href="mailto:${escAttr(p.email)}" style="display:inline-block;margin-left:12px;color:#111;text-decoration:underline;padding:12px 0;font-weight:600">Reply by email</a>` : ''}
  </p>
  <p style="color:#666;font-size:13px;margin-top:32px">Leads contacted within 5 minutes are far more likely to close. This alert was sent by your SiteCraft website the moment the form was submitted.</p>
</body></html>`;

  return { subject, html, text };
}

// Generic wrapper used by the notification worker for queued notifications
// that were stored as plain text (subject + body) by other code paths.
export function plainNotificationEmail(p: { subject: string; body: string; leadsUrl?: string }) {
  const text = p.body + (p.leadsUrl ? `\n\nView in dashboard: ${p.leadsUrl}` : '');
  const html = `<!doctype html>
<html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:560px;margin:40px auto;padding:0 24px;color:#111;line-height:1.55">
  <h1 style="font-size:20px;margin:0 0 16px">${esc(p.subject)}</h1>
  <p style="white-space:pre-line;font-size:14px;color:#222">${esc(p.body)}</p>
  ${p.leadsUrl ? `<p style="margin:28px 0"><a href="${p.leadsUrl}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600">View in dashboard →</a></p>` : ''}
</body></html>`;
  return { subject: p.subject, html, text };
}

function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}

// Subjects don't need HTML escaping — keep raw but strip newlines.
function esc0(s: string) {
  return s.replace(/[\r\n]+/g, ' ').trim();
}

function escAttr(s: string) {
  return esc(s);
}
