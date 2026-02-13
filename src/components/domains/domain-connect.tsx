'use client';

import { useState } from 'react';
import {
  Globe,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Copy,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface DomainConnectProps {
  projectId: string;
  onConnected?: (domain: string) => void;
}

type Step = 'input' | 'instructions' | 'verified';

export function DomainConnect({ projectId, onConnected }: DomainConnectProps) {
  const [domain, setDomain] = useState('');
  const [step, setStep] = useState<Step>('input');
  const [connecting, setConnecting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [domainId, setDomainId] = useState<string | null>(null);
  const [instructions, setInstructions] = useState<string[]>([]);

  const handleConnect = async () => {
    if (!domain) return;

    setConnecting(true);
    try {
      const response = await fetch('/api/domains/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain, projectId }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || 'Connection failed');
      }

      const { data } = await response.json();

      if (data.verified) {
        setStep('verified');
        onConnected?.(domain);
        toast.success('Domain connected!');
      } else {
        setDomainId(data.domainId || null);
        setInstructions(data.instructions || []);
        setStep('instructions');
      }
    } catch (error) {
      toast.error('Failed to connect domain', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setConnecting(false);
    }
  };

  const handleVerify = async () => {
    if (!domainId) {
      // If we don't have a domainId, just re-connect which will check verification
      await handleConnect();
      return;
    }

    setVerifying(true);
    try {
      const response = await fetch('/api/domains/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domainId }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || 'Verification failed');
      }

      const { data } = await response.json();

      if (data.verified) {
        setStep('verified');
        onConnected?.(domain);
        toast.success('Domain verified and connected!');
      } else {
        toast.info(data.message || 'DNS not yet propagated. Try again in a few minutes.');
      }
    } catch (error) {
      toast.error('Verification failed', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  if (step === 'verified') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 rounded-lg border bg-green-50 dark:bg-green-950/30 p-4">
          <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium">Domain Connected!</p>
            <p className="text-sm text-muted-foreground">
              <strong>{domain}</strong> is now connected to your website.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'instructions') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 rounded-lg border bg-amber-50 dark:bg-amber-950/30 p-4">
          <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium">DNS Configuration Required</p>
            <p className="text-sm text-muted-foreground">
              Add the following DNS record to your domain provider:
            </p>
          </div>
        </div>

        {/* DNS Record Instructions */}
        <div className="rounded-lg border p-4 space-y-3">
          <div className="grid grid-cols-3 gap-2 text-xs font-medium text-muted-foreground border-b pb-2">
            <span>Type</span>
            <span>Name</span>
            <span>Value</span>
          </div>
          <div className="grid grid-cols-3 gap-2 items-center">
            <span className="text-sm font-mono">CNAME</span>
            <span className="text-sm font-mono truncate">{domain}</span>
            <div className="flex items-center gap-1">
              <span className="text-sm font-mono truncate">cname.vercel-dns.com</span>
              <button
                onClick={() => handleCopy('cname.vercel-dns.com')}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Copy className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>

        {instructions.length > 0 && (
          <div className="space-y-2">
            {instructions.map((instruction, i) => (
              <div key={i} className="flex items-start gap-2">
                <ArrowRight className="h-3.5 w-3.5 mt-0.5 text-muted-foreground flex-shrink-0" />
                <p className="text-xs text-muted-foreground">{instruction}</p>
              </div>
            ))}
          </div>
        )}

        <Button
          className="w-full"
          onClick={handleVerify}
          disabled={verifying}
        >
          {verifying ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          {verifying ? 'Checking DNS...' : 'Verify DNS Configuration'}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Enter the domain you want to connect to your website.
      </p>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="yourdomain.com"
            value={domain}
            onChange={(e) => setDomain(e.target.value.toLowerCase().trim())}
            className="pl-9"
            onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
          />
        </div>
        <Button onClick={handleConnect} disabled={connecting || !domain}>
          {connecting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            'Connect'
          )}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        You&apos;ll need access to your domain&apos;s DNS settings to complete the connection.
      </p>
    </div>
  );
}
