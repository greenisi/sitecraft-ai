// Domain renewal client. Separate from namecom.ts to keep that file focused
// on the purchase/search side. Both wrap the same Name.com v4 API.

const NAMECOM_API = process.env.NAMECOM_API_URL || 'https://api.name.com';
const NAMECOM_USERNAME = process.env.NAMECOM_USERNAME!;
const NAMECOM_TOKEN = process.env.NAMECOM_API_TOKEN!;

function authHeader() {
  return 'Basic ' + Buffer.from(`${NAMECOM_USERNAME}:${NAMECOM_TOKEN}`).toString('base64');
}

export type RenewResult = {
  domain: { domainName: string; expireDate: string };
  order: { orderId: number; totalPaid: number; currency: string };
};

/**
 * Get the renewal price for a domain. Note: differs from registration price.
 */
export async function getRenewalPrice(domain: string): Promise<number> {
  const res = await fetch(`${NAMECOM_API}/v4/domains:getPricingForDomain`, {
    method: 'POST',
    headers: { Authorization: authHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ domainName: domain }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`getRenewalPrice failed: ${err.message || res.statusText}`);
  }
  const j = await res.json();
  // Name.com returns renewalPrice as USD float.
  const p = Number(j.renewalPrice);
  if (!Number.isFinite(p) || p <= 0) {
    throw new Error('Renewal price not available');
  }
  return p;
}

/**
 * Renew a domain for one year. Idempotent within a ~24h window — Name.com
 * rejects duplicate renewals.
 */
export async function renewDomain(domain: string, expectedPrice: number): Promise<RenewResult> {
  const res = await fetch(`${NAMECOM_API}/v4/domains/${encodeURIComponent(domain)}:renew`, {
    method: 'POST',
    headers: { Authorization: authHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ purchasePrice: expectedPrice, years: 1 }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`renewDomain failed: ${err.message || res.statusText}`);
  }
  return res.json();
}
