import { getResend, defaultFrom, EmailConfigError } from './client';
import { marketingWelcomeEmail } from './templates/marketing-welcome';

export type SendResult =
  | { ok: true; id: string }
  | { ok: false; error: string; code: 'not_configured' | 'send_failed' };

async function send(opts: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  tags?: { name: string; value: string }[];
}): Promise<SendResult> {
  let resend, from;
  try {
    resend = getResend();
    from = defaultFrom();
  } catch (e) {
    if (e instanceof EmailConfigError) {
      return { ok: false, error: e.message, code: 'not_configured' };
    }
    throw e;
  }
  const { data, error } = await resend.emails.send({
    from,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
    replyTo: opts.replyTo,
    tags: opts.tags,
  });
  if (error) return { ok: false, error: error.message, code: 'send_failed' };
  return { ok: true, id: data?.id ?? '' };
}

export function sendMarketingWelcome(p: {
  to: string;
  businessName?: string | null;
  vertical: string;
  verticalLabel: string;
  startUrl: string;
}) {
  const t = marketingWelcomeEmail({
    businessName: p.businessName,
    vertical: p.vertical,
    verticalLabel: p.verticalLabel,
    startUrl: p.startUrl,
  });
  return send({
    to: p.to,
    ...t,
    tags: [
      { name: 'kind', value: 'marketing_welcome' },
      { name: 'vertical', value: p.vertical },
    ],
  });
}
