// Auto-sent to the VISITOR the moment they submit a form on a published site —
// the business responds instantly even when the owner is on a roof somewhere.
// Branded as the business (not SiteCraft); replies go to the owner.

export function leadAcknowledgmentEmail(p: {
  businessName: string;
  visitorName?: string | null;
  formType: string;
  phone?: string | null;
  serviceNeeded?: string | null;
  preferredDate?: string | null;
}) {
  const greeting = p.visitorName ? `Hi ${esc0(p.visitorName)}` : 'Hi there';
  const isBooking = p.formType === 'booking' || p.formType === 'appointment';
  const subject = isBooking
    ? `We got your booking request — ${esc0(p.businessName)}`
    : `We got your message — ${esc0(p.businessName)}`;

  const specifics = [
    p.serviceNeeded && `Requested: ${p.serviceNeeded}`,
    p.preferredDate && `Preferred date: ${p.preferredDate}`,
  ].filter(Boolean) as string[];

  const text =
    `${greeting},\n\n` +
    `Thanks for reaching out to ${p.businessName} — your ${isBooking ? 'booking request' : 'message'} just came through and we'll get back to you shortly.\n\n` +
    (specifics.length ? specifics.join('\n') + '\n\n' : '') +
    (p.phone ? `Need us sooner? Call ${p.phone}.\n\n` : '') +
    `— ${p.businessName}`;

  const html = `<!doctype html>
<html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:560px;margin:40px auto;padding:0 24px;color:#111;line-height:1.55">
  <h1 style="font-size:20px;margin:0 0 16px">${esc(greeting)} — we got your ${isBooking ? 'booking request' : 'message'}.</h1>
  <p>Thanks for reaching out to <strong>${esc(p.businessName)}</strong>. It just came through and we'll get back to you shortly.</p>
  ${specifics.length ? `<p style="background:#f5f5f5;border-radius:8px;padding:12px 16px;font-size:14px;color:#333">${specifics.map(esc).join('<br>')}</p>` : ''}
  ${p.phone ? `<p>Need us sooner? Call <a href="tel:${escAttr(p.phone.replace(/[^+\d]/g, ''))}" style="color:#111;font-weight:600">${esc(p.phone)}</a>.</p>` : ''}
  <p style="color:#666;font-size:13px;margin-top:32px">— ${esc(p.businessName)}</p>
</body></html>`;

  return { subject, html, text };
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
