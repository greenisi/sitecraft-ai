// Lazy Resend client. Same lazy-init pattern as lib/stripe — errors only
// fire at use time, not at import, so missing env vars don't break the build.

import { Resend } from 'resend';

let _client: Resend | null = null;

export function getResend(): Resend {
  if (_client) return _client;
  const key = process.env.RESEND_API_KEY;
  if (!key || key.startsWith('your_')) {
    throw new EmailConfigError('RESEND_API_KEY is not configured.');
  }
  _client = new Resend(key);
  return _client;
}

export function defaultFrom(): string {
  const from = process.env.RESEND_FROM_EMAIL;
  if (!from || from.startsWith('your_')) {
    throw new EmailConfigError(
      'RESEND_FROM_EMAIL is not configured. Set it to a verified sender (e.g. "SiteCraft <hi@yourdomain.com>").'
    );
  }
  return from;
}

export function isEmailConfigured(): boolean {
  const k = process.env.RESEND_API_KEY;
  const f = process.env.RESEND_FROM_EMAIL;
  return !!(k && !k.startsWith('your_') && f && !f.startsWith('your_'));
}

export class EmailConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EmailConfigError';
  }
}
