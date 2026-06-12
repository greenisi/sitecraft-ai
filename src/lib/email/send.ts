import { getResend, defaultFrom, EmailConfigError } from './client';
import { marketingWelcomeEmail } from './templates/marketing-welcome';
import { leadAlertEmail, plainNotificationEmail } from './templates/lead-alert';
import { leadAcknowledgmentEmail } from './templates/lead-acknowledgment';
import { bookingDecisionEmail } from './templates/booking-decision';
import { weeklyReportEmail } from './templates/weekly-report';
import type { WeeklyTotals, WeeklyProjectStats } from '@/lib/ai/weekly-report';

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

export function sendLeadAlert(p: {
  to: string;
  projectName: string;
  formType: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  message?: string | null;
  serviceNeeded?: string | null;
  preferredDate?: string | null;
  sourcePage?: string | null;
  imageCount?: number;
  leadsUrl: string;
  aiDraft?: string | null;
  replySendUrl?: string | null;
  bookingActions?: { confirmUrl: string; declineUrl: string } | null;
}) {
  const t = leadAlertEmail(p);
  return send({
    to: p.to,
    ...t,
    replyTo: p.email || undefined,
    tags: [
      { name: 'kind', value: 'lead_alert' },
      { name: 'form_type', value: p.formType },
    ],
  });
}

// Instant acknowledgment to the visitor, branded as the business.
export function sendLeadAcknowledgment(p: {
  to: string;
  businessName: string;
  visitorName?: string | null;
  formType: string;
  phone?: string | null;
  serviceNeeded?: string | null;
  preferredDate?: string | null;
  ownerEmail?: string | null; // replies from the visitor go to the owner
}) {
  const t = leadAcknowledgmentEmail(p);
  return send({
    to: p.to,
    ...t,
    replyTo: p.ownerEmail || undefined,
    tags: [{ name: 'kind', value: 'lead_acknowledgment' }],
  });
}

// Booking confirmed/declined notice to the customer, branded as the business.
export function sendBookingDecision(p: {
  to: string;
  businessName: string;
  customerName?: string | null;
  decision: 'confirmed' | 'cancelled';
  bookingDate: string;
  bookingTime: string;
  serviceType?: string | null;
  phone?: string | null;
  ownerEmail?: string | null;
}) {
  const t = bookingDecisionEmail(p);
  return send({
    to: p.to,
    ...t,
    replyTo: p.ownerEmail || undefined,
    tags: [{ name: 'kind', value: `booking_${p.decision}` }],
  });
}

// The Monday morning "what your website did for you" report.
export function sendWeeklyReport(p: {
  to: string;
  narrative: string;
  totals: WeeklyTotals;
  projects: WeeklyProjectStats[];
}) {
  const t = weeklyReportEmail(p);
  return send({
    to: p.to,
    ...t,
    tags: [{ name: 'kind', value: 'weekly_report' }],
  });
}

// The owner-approved reply, sent to the lead on the business's behalf.
export function sendOwnerReply(p: {
  to: string;
  businessName: string;
  body: string;
  ownerEmail?: string | null;
}) {
  const html = `<!doctype html>
<html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:560px;margin:40px auto;padding:0 24px;color:#111;line-height:1.55">
  <p style="white-space:pre-line;font-size:15px;color:#111">${p.body.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))}</p>
  <p style="color:#666;font-size:13px;margin-top:32px">— ${p.businessName.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))}</p>
</body></html>`;
  return send({
    to: p.to,
    subject: `Re: your message to ${p.businessName}`,
    html,
    text: `${p.body}\n\n— ${p.businessName}`,
    replyTo: p.ownerEmail || undefined,
    tags: [{ name: 'kind', value: 'owner_reply' }],
  });
}

// Used by the notification worker to deliver queued notifications that were
// stored as plain subject/body text by other code paths (bookings, etc).
export function sendQueuedNotification(p: {
  to: string;
  subject: string;
  body: string;
  leadsUrl?: string;
}) {
  const t = plainNotificationEmail({ subject: p.subject, body: p.body, leadsUrl: p.leadsUrl });
  return send({
    to: p.to,
    ...t,
    tags: [{ name: 'kind', value: 'queued_notification' }],
  });
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
