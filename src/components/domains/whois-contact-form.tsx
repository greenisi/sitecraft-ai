'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

type Contact = {
  firstName: string;
  lastName: string;
  organization?: string;
  email: string;
  phone: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
};

const BLANK: Contact = {
  firstName: '', lastName: '', organization: '', email: '', phone: '',
  address1: '', address2: '', city: '', state: '', zip: '', country: 'US',
};

/**
 * One-time setup form for ICANN-required WHOIS contact info.
 *
 * Opens automatically when domain-search.tsx dispatches `whois-required`,
 * or can be opened manually via the `open` prop. On successful save,
 * dispatches `whois-saved` so the buy flow can be retried.
 */
export function WhoisContactForm({
  open: openProp,
  onOpenChange,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [contact, setContact] = useState<Contact>(BLANK);

  const isControlled = openProp !== undefined;
  const effectiveOpen = isControlled ? openProp! : open;

  const setEffectiveOpen = useCallback((v: boolean) => {
    if (isControlled) onOpenChange?.(v);
    else setOpen(v);
  }, [isControlled, onOpenChange]);

  // Open automatically when domain checkout returns WHOIS_REQUIRED.
  useEffect(() => {
    const handler = () => setEffectiveOpen(true);
    window.addEventListener('whois-required', handler);
    return () => window.removeEventListener('whois-required', handler);
  }, [setEffectiveOpen]);

  // Load existing contact when the dialog opens.
  useEffect(() => {
    if (!effectiveOpen) return;
    setLoading(true);
    fetch('/api/profile/whois')
      .then(r => r.json())
      .then(j => { if (j.contact) setContact({ ...BLANK, ...j.contact }); })
      .finally(() => setLoading(false));
  }, [effectiveOpen]);

  function update<K extends keyof Contact>(k: K, v: Contact[K]) {
    setContact(prev => ({ ...prev, [k]: v }));
  }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch('/api/profile/whois', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contact),
      });
      const j = await res.json();
      if (!res.ok) {
        toast.error('Could not save', { description: j.error?.message || 'Unknown error' });
        return;
      }
      toast.success('Contact info saved');
      setEffectiveOpen(false);
      // Let other components (e.g. domain-search) retry the action they were doing.
      window.dispatchEvent(new CustomEvent('whois-saved'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={effectiveOpen} onOpenChange={setEffectiveOpen}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Your contact info</DialogTitle>
          <DialogDescription>
            ICANN requires real contact info for domain registrations. We register every domain
            with WHOIS privacy enabled where the TLD supports it, so this stays out of public records.
            One-time setup — reused for every domain you buy.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <Field label="First name *">
              <Input value={contact.firstName} onChange={(e) => update('firstName', e.target.value)} />
            </Field>
            <Field label="Last name *">
              <Input value={contact.lastName} onChange={(e) => update('lastName', e.target.value)} />
            </Field>
            <Field label="Organization" className="col-span-2">
              <Input value={contact.organization ?? ''} onChange={(e) => update('organization', e.target.value)} placeholder="Optional" />
            </Field>
            <Field label="Email *" className="col-span-2">
              <Input type="email" value={contact.email} onChange={(e) => update('email', e.target.value)} placeholder="you@example.com" />
            </Field>
            <Field label="Phone (E.164) *" className="col-span-2">
              <Input value={contact.phone} onChange={(e) => update('phone', e.target.value)} placeholder="+15555550100" />
            </Field>
            <Field label="Address line 1 *" className="col-span-2">
              <Input value={contact.address1} onChange={(e) => update('address1', e.target.value)} />
            </Field>
            <Field label="Address line 2" className="col-span-2">
              <Input value={contact.address2 ?? ''} onChange={(e) => update('address2', e.target.value)} placeholder="Optional" />
            </Field>
            <Field label="City *">
              <Input value={contact.city} onChange={(e) => update('city', e.target.value)} />
            </Field>
            <Field label="State / Region *">
              <Input value={contact.state} onChange={(e) => update('state', e.target.value)} />
            </Field>
            <Field label="ZIP / Postal *">
              <Input value={contact.zip} onChange={(e) => update('zip', e.target.value)} />
            </Field>
            <Field label="Country (ISO-2) *">
              <Input value={contact.country} onChange={(e) => update('country', e.target.value.toUpperCase())} maxLength={2} />
            </Field>
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => setEffectiveOpen(false)} disabled={saving}>Cancel</Button>
          <Button onClick={save} disabled={saving || loading}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, className = '', children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <Label className="text-xs text-muted-foreground mb-1 block">{label}</Label>
      {children}
    </div>
  );
}
