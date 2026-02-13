/**
 * Name.com Reseller API v4 Client
 * Docs: https://www.name.com/api-docs
 */

const NAMECOM_API = process.env.NAMECOM_API_URL || 'https://api.name.com';
const NAMECOM_USERNAME = process.env.NAMECOM_USERNAME!;
const NAMECOM_TOKEN = process.env.NAMECOM_API_TOKEN!;

function getAuthHeader(): string {
  return 'Basic ' + Buffer.from(`${NAMECOM_USERNAME}:${NAMECOM_TOKEN}`).toString('base64');
}

function buildHeaders() {
  return {
    Authorization: getAuthHeader(),
    'Content-Type': 'application/json',
  };
}

async function apiRequest<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const response = await fetch(`${NAMECOM_API}${path}`, {
    method,
    headers: buildHeaders(),
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(`Name.com API error: ${err.message || err.details || response.statusText}`);
  }

  return response.json();
}

// ─── Domain Search & Availability ────────────────────────────────────────

export interface DomainSearchResult {
  domainName: string;
  sld: string;
  tld: string;
  purchasable: boolean;
  purchasePrice: number;
  purchaseType: string;
  renewalPrice: number;
  premium: boolean;
}

export interface SearchResponse {
  results: DomainSearchResult[];
}

/**
 * Search for available domains matching a keyword.
 */
export async function searchDomains(keyword: string): Promise<DomainSearchResult[]> {
  const data = await apiRequest<SearchResponse>('POST', '/v4/domains:search', {
    keyword,
  });
  return data.results || [];
}

/**
 * Check availability of specific domain names.
 */
export async function checkAvailability(
  domainNames: string[]
): Promise<DomainSearchResult[]> {
  const data = await apiRequest<SearchResponse>('POST', '/v4/domains:checkAvailability', {
    domainNames,
  });
  return data.results || [];
}

// ─── Domain Purchase ─────────────────────────────────────────────────────

export interface ContactInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address1: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  organization?: string;
}

export interface PurchaseResponse {
  domain: {
    domainName: string;
    createDate: string;
    expireDate: string;
    autorenewEnabled: boolean;
  };
  order: {
    orderId: number;
    status: string;
    totalPaid: number;
    currency: string;
  };
}

/**
 * Purchase/register a domain.
 */
export async function purchaseDomain(
  domainName: string,
  contacts: ContactInfo,
  years: number = 1
): Promise<PurchaseResponse> {
  return apiRequest<PurchaseResponse>('POST', '/v4/domains', {
    domain: { domainName },
    purchasePrice: undefined, // Let API determine price
    years,
    contacts: {
      registrant: contacts,
      admin: contacts,
      tech: contacts,
      billing: contacts,
    },
  });
}

// ─── Domain Management ───────────────────────────────────────────────────

export interface DomainInfo {
  domainName: string;
  nameservers: string[];
  createDate: string;
  expireDate: string;
  autorenewEnabled: boolean;
  locked: boolean;
}

/**
 * Get domain details.
 */
export async function getDomain(domainName: string): Promise<DomainInfo> {
  return apiRequest<DomainInfo>('GET', `/v4/domains/${domainName}`);
}

/**
 * Set nameservers for a domain.
 */
export async function setNameservers(
  domainName: string,
  nameservers: string[]
): Promise<void> {
  await apiRequest('POST', `/v4/domains/${domainName}:setNameservers`, {
    nameservers,
  });
}

// ─── DNS Record Management ───────────────────────────────────────────────

export interface DnsRecord {
  id?: number;
  domainName?: string;
  host: string;
  fqdn?: string;
  type: 'A' | 'AAAA' | 'CNAME' | 'MX' | 'NS' | 'SRV' | 'TXT';
  answer: string;
  ttl: number;
  priority?: number;
}

export interface DnsRecordListResponse {
  records: DnsRecord[];
}

/**
 * List all DNS records for a domain.
 */
export async function listDnsRecords(domainName: string): Promise<DnsRecord[]> {
  const data = await apiRequest<DnsRecordListResponse>(
    'GET',
    `/v4/domains/${domainName}/records`
  );
  return data.records || [];
}

/**
 * Create a DNS record.
 */
export async function createDnsRecord(
  domainName: string,
  record: Omit<DnsRecord, 'id' | 'domainName' | 'fqdn'>
): Promise<DnsRecord> {
  return apiRequest<DnsRecord>(
    'POST',
    `/v4/domains/${domainName}/records`,
    record
  );
}

/**
 * Delete a DNS record.
 */
export async function deleteDnsRecord(
  domainName: string,
  recordId: number
): Promise<void> {
  await apiRequest('DELETE', `/v4/domains/${domainName}/records/${recordId}`);
}
