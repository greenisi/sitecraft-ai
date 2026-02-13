'use client';

import { useState, useCallback, useEffect } from 'react';
import { Search, Loader2, ShoppingCart, Globe, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface DomainResult {
  domain: string;
  tld: string;
  price: number;
  renewalPrice: number;
  premium: boolean;
}

interface DomainSearchProps {
  projectId: string;
  onPurchased?: (domain: string) => void;
}

export function DomainSearch({ projectId, onPurchased }: DomainSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<DomainResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [purchasedDomain, setPurchasedDomain] = useState<string | null>(null);

  const handleSearch = useCallback(async () => {
    if (!query || query.length < 2) return;

    setSearching(true);
    try {
      const response = await fetch(
        `/api/domains/search?query=${encodeURIComponent(query)}`
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || 'Search failed');
      }

      const { data } = await response.json();
      setResults(data.results || []);
    } catch (error) {
      toast.error('Search failed', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setSearching(false);
    }
  }, [query]);

  // Debounced search
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      handleSearch();
    }, 500);

    return () => clearTimeout(timer);
  }, [query, handleSearch]);

  const handlePurchase = async (domain: string) => {
    setPurchasing(domain);
    try {
      const response = await fetch('/api/domains/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain, projectId }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || 'Purchase failed');
      }

      setPurchasedDomain(domain);
      toast.success('Domain purchased!', {
        description: 'DNS propagation may take 5-30 minutes.',
      });
      onPurchased?.(domain);
    } catch (error) {
      toast.error('Purchase failed', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setPurchasing(null);
    }
  };

  const formatPrice = (price: number) => {
    return `$${(price / 100).toFixed(2)}`;
  };

  if (purchasedDomain) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 rounded-lg border bg-green-50 dark:bg-green-950/30 p-4">
          <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium">Domain Purchased!</p>
            <p className="text-sm text-muted-foreground">
              <strong>{purchasedDomain}</strong> has been registered and is being
              connected to your site. DNS propagation typically takes 5-30 minutes.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search for a domain name..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
      </div>

      {searching && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Searching...</span>
        </div>
      )}

      {!searching && results.length > 0 && (
        <div className="space-y-2">
          {results.map((result) => (
            <div
              key={result.domain}
              className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{result.domain}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {formatPrice(result.price)}/yr
                    </span>
                    {result.premium && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        Premium
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <Button
                size="sm"
                className="h-7 px-3"
                onClick={() => handlePurchase(result.domain)}
                disabled={purchasing === result.domain}
              >
                {purchasing === result.domain ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <ShoppingCart className="h-3 w-3 mr-1" />
                )}
                Buy
              </Button>
            </div>
          ))}
        </div>
      )}

      {!searching && query.length >= 2 && results.length === 0 && (
        <div className="text-center py-8 text-sm text-muted-foreground">
          No available domains found. Try a different search term.
        </div>
      )}
    </div>
  );
}
