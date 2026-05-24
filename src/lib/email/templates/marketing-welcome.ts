// Auto-sent within seconds of a /for/<vertical> signup. Tone matches the
// landing page that captured the lead (specific to their trade, not generic).
//
// `verticalLabel` is the human-readable trade name ("pressure washing",
// "HVAC + heating/cooling") — already computed from the slug at the call site.

export function marketingWelcomeEmail(p: {
  businessName?: string | null;
  vertical: string;          // slug like 'pressure-washing'
  verticalLabel: string;     // human label like 'pressure washing'
  startUrl: string;          // /start link with token + vertical query
}) {
  const greeting = p.businessName ? esc(p.businessName) : 'there';
  const subject = `Build your ${p.verticalLabel} site (60 seconds)`;
  const text =
    `Hey ${greeting},\n\n` +
    `You dropped your email on the SiteCraft page for ${p.verticalLabel} businesses.\n` +
    `Your custom site is ready to build — should take you about 60 seconds.\n\n` +
    `Start here: ${p.startUrl}\n\n` +
    `A few things that already make this different from Wix or GoDaddy for your trade:\n` +
    `  • Quote form goes above the fold — leads first, brochure second\n` +
    `  • Mobile click-to-call always visible\n` +
    `  • Photo gallery built for ${p.verticalLabel}\n` +
    `  • Your own domain in one click (no DNS headaches)\n\n` +
    `Reply to this email if you get stuck. A real human reads every one.\n\n— SiteCraft`;
  const html = `<!doctype html>
<html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:560px;margin:40px auto;padding:0 24px;color:#111;line-height:1.55">
  <h1 style="font-size:22px;margin:0 0 16px">Hey ${greeting} — your ${esc(p.verticalLabel)} site is ready to build.</h1>
  <p>You dropped your email on the SiteCraft page for ${esc(p.verticalLabel)} businesses. The hard part (the design, the layout, the copy that actually books jobs) is already done. You just need to click in and tweak.</p>
  <p style="margin:28px 0">
    <a href="${p.startUrl}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600">Build my ${esc(p.verticalLabel)} site →</a>
  </p>
  <h3 style="font-size:14px;color:#444;margin:32px 0 8px">A few things that make this different from Wix/GoDaddy for your trade:</h3>
  <ul style="padding-left:18px;font-size:14px;color:#444">
    <li>Quote form sits above the fold — leads first, brochure second</li>
    <li>Mobile click-to-call always visible</li>
    <li>Photo gallery designed for ${esc(p.verticalLabel)}</li>
    <li>Your own domain in one click (no DNS headaches)</li>
  </ul>
  <p style="color:#666;font-size:13px;margin-top:32px">Reply to this email if anything's confusing — a real human reads every one.</p>
</body></html>`;
  return { subject, html, text };
}

function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}
