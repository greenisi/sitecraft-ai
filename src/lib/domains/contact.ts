// Validation + normalization for ICANN WHOIS contact info.
// Used by /api/profile/whois (set) and the domain checkout/fulfill flows (read).

export type WhoisContact = {
  firstName: string;
  lastName: string;
  organization?: string;
  email: string;
  phone: string;       // E.164: "+15555550100"
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;     // ISO-3166 alpha-2
};

const ISO2 = /^[A-Z]{2}$/;
const E164 = /^\+[1-9]\d{6,14}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateWhois(raw: unknown): { ok: true; value: WhoisContact } | { ok: false; error: string } {
  if (!raw || typeof raw !== 'object') return { ok: false, error: 'Contact info required' };
  const r = raw as Record<string, unknown>;
  const need = ['firstName', 'lastName', 'email', 'phone', 'address1', 'city', 'state', 'zip', 'country'];
  for (const k of need) {
    const v = r[k];
    if (typeof v !== 'string' || !v.trim()) return { ok: false, error: `${k} is required` };
  }
  const email = String(r.email).trim();
  if (!EMAIL.test(email)) return { ok: false, error: 'Invalid email' };
  const phone = String(r.phone).trim();
  if (!E164.test(phone)) return { ok: false, error: 'Phone must be E.164 format (e.g. +15555550100)' };
  const country = String(r.country).trim().toUpperCase();
  if (!ISO2.test(country)) return { ok: false, error: 'Country must be a 2-letter ISO code (e.g. US)' };

  return {
    ok: true,
    value: {
      firstName: String(r.firstName).trim(),
      lastName:  String(r.lastName).trim(),
      organization: r.organization ? String(r.organization).trim() : undefined,
      email,
      phone,
      address1: String(r.address1).trim(),
      address2: r.address2 ? String(r.address2).trim() : undefined,
      city:     String(r.city).trim(),
      state:    String(r.state).trim(),
      zip:      String(r.zip).trim(),
      country,
    },
  };
}

/**
 * Convert our internal WhoisContact to Name.com's ContactInfo shape.
 * They line up 1:1 today but isolating the mapping protects us if either changes.
 */
export function toNamecomContact(c: WhoisContact) {
  return {
    firstName: c.firstName,
    lastName: c.lastName,
    organization: c.organization,
    email: c.email,
    phone: c.phone,
    address1: c.address1,
    city: c.city,
    state: c.state,
    zip: c.zip,
    country: c.country,
  };
}
