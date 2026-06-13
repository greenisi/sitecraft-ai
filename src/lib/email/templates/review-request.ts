// Sent to the customer when their booking is marked completed — the moment
// satisfaction peaks. Reviews are the #1 local-SEO lever; this closes the
// loop automatically: leads → bookings → reviews → more leads.

export function reviewRequestEmail(p: {
  businessName: string;
  customerName?: string | null;
  serviceType?: string | null;
  reviewUrl: string;
}) {
  const greeting = p.customerName ? `Hi ${esc0(p.customerName)}` : 'Hi there';
  const subject = `How did we do? — ${esc0(p.businessName)}`;

  const text =
    `${greeting},\n\n` +
    `Thanks for choosing ${p.businessName}${p.serviceType ? ` for your ${p.serviceType}` : ''}. ` +
    `If you have 30 seconds, a quick review would mean a lot — it's how small businesses like ours grow.\n\n` +
    `Leave a review: ${p.reviewUrl}\n\n` +
    `Thank you!\n— ${p.businessName}`;

  const html = `<!doctype html>
<html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:560px;margin:40px auto;padding:0 24px;color:#111;line-height:1.55">
  <h1 style="font-size:20px;margin:0 0 16px">${esc(greeting)} — how did we do?</h1>
  <p>Thanks for choosing <strong>${esc(p.businessName)}</strong>${p.serviceType ? ` for your ${esc(p.serviceType)}` : ''}. If you have 30 seconds, a quick review would mean a lot — it's how small businesses like ours grow.</p>
  <p style="margin:28px 0">
    <a href="${p.reviewUrl}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600">Leave a review ★</a>
  </p>
  <p style="color:#666;font-size:13px;margin-top:32px">Thank you!<br>— ${esc(p.businessName)}</p>
</body></html>`;

  return { subject, html, text };
}

function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}

function esc0(s: string) {
  return s.replace(/[\r\n]+/g, ' ').trim();
}
