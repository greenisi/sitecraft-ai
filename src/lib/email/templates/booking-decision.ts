// Sent to the CUSTOMER when the owner confirms or declines their booking
// request — branded as the business, replies go to the owner.

export function bookingDecisionEmail(p: {
  businessName: string;
  customerName?: string | null;
  decision: 'confirmed' | 'cancelled';
  bookingDate: string;   // YYYY-MM-DD
  bookingTime: string;
  serviceType?: string | null;
  phone?: string | null;
}) {
  const greeting = p.customerName ? `Hi ${esc0(p.customerName)}` : 'Hi there';
  const confirmed = p.decision === 'confirmed';
  const niceDate = formatDate(p.bookingDate);
  const when = `${niceDate}${p.bookingTime && p.bookingTime !== 'flexible' ? ` at ${p.bookingTime}` : ''}`;

  const subject = confirmed
    ? `You're booked for ${niceDate} — ${esc0(p.businessName)}`
    : `About your booking request — ${esc0(p.businessName)}`;

  const text = confirmed
    ? `${greeting},\n\nGood news — your booking with ${p.businessName} is confirmed.\n\n` +
      `When: ${when}\n` +
      (p.serviceType ? `Service: ${p.serviceType}\n` : '') +
      (p.phone ? `\nQuestions or need to reschedule? Call ${p.phone}.\n` : '\nNeed to reschedule? Just reply to this email.\n') +
      `\nSee you then!\n— ${p.businessName}`
    : `${greeting},\n\nUnfortunately we can't take your booking for ${when}.\n\n` +
      (p.phone ? `We'd still love to help — call ${p.phone} or reply to this email and we'll find a time that works.\n` : `We'd still love to help — reply to this email and we'll find a time that works.\n`) +
      `\n— ${p.businessName}`;

  const html = `<!doctype html>
<html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:560px;margin:40px auto;padding:0 24px;color:#111;line-height:1.55">
  <h1 style="font-size:20px;margin:0 0 16px">${confirmed ? `${esc(greeting)} — you're booked! ✓` : `${esc(greeting)} — about your booking request`}</h1>
  ${confirmed
    ? `<p>Your booking with <strong>${esc(p.businessName)}</strong> is confirmed.</p>
  <p style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:14px 16px;font-size:15px;color:#14532d">
    <strong>When:</strong> ${esc(when)}${p.serviceType ? `<br><strong>Service:</strong> ${esc(p.serviceType)}` : ''}
  </p>
  <p>${p.phone ? `Questions or need to reschedule? Call <a href="tel:${escAttr(p.phone.replace(/[^+\d]/g, ''))}" style="color:#111;font-weight:600">${esc(p.phone)}</a>.` : 'Need to reschedule? Just reply to this email.'}</p>`
    : `<p>Unfortunately we can't take your booking for <strong>${esc(when)}</strong>.</p>
  <p>${p.phone ? `We'd still love to help — call <a href="tel:${escAttr(p.phone.replace(/[^+\d]/g, ''))}" style="color:#111;font-weight:600">${esc(p.phone)}</a> or reply to this email and we'll find a time that works.` : `We'd still love to help — reply to this email and we'll find a time that works.`}</p>`}
  <p style="color:#666;font-size:13px;margin-top:32px">— ${esc(p.businessName)}</p>
</body></html>`;

  return { subject, html, text };
}

function formatDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}

function esc0(s: string) {
  return s.replace(/[\r\n]+/g, ' ').trim();
}

function escAttr(s: string) {
  return esc(s);
}
