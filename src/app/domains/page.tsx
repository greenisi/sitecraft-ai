'use client';

import { useState, useEffect } from 'react';
import { Globe, Search, ShoppingCart, ExternalLink, Plus, Check, X, ArrowLeft, Loader2, AlertCircle, Link2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Domain {
  id: string;
  project_id: string | null;
  domain: string;
  domain_type: string;
  status: string;
  dns_configured: boolean;
  created_at: string;
  project_name?: string;
}

interface DomainSearchResult {
  domain: string;
  available: boolean;
  price?: string;
  premium?: boolean;
}

export default function DomainsPage() {
  const router = useRouter();
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'my-domains' | 'search' | 'connect'>('my-domains');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<DomainSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [connectDomain, setConnectDomain] = useState('');
  const [connectProject, setConnectProject] = useState('');
  const [projects, setProjects] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [connecting, setConnecting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseDomain, setPurchaseDomain] = useState<string | null>(null);
  const [purchaseProject, setPurchaseProject] = useState('');

  useEffect(() => {
    fetchDomains();
    fetchProjects();
  }, []);

  async function fetchDomains() {
    try {
      const res = await fetch('/api/domains');
      if (res.ok) {
        const data = await res.json();
        setDomains(data.domains || []);
      }
    } catch (e) {
      console.error('Failed to fetch domains:', e);
    } finally {
      setLoading(false);
    }
  }

  async function fetchProjects() {
    try {
      const res = await fetch('/api/projects');
      if (res.ok) {
        const data = await res.json();
        setProjects((data.projects || []).filter((p: any) => p.status === 'published'));
      }
    } catch (e) {
      console.error('Failed to fetch projects:', e);
    }
  }

  async function searchDomainsFn() {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setSearchResults([]);
    try {
      const res = await fetch(`/api/domains/search?q=${encodeURIComponent(searchQuery)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.results || []);
      }
    } catch (e) {
      console.error('Domain search failed:', e);
    } finally {
      setSearching(false);
    }
  }

  async function handlePurchase(domain: string) {
    if (!purchaseProject) {
      setMessage({ type: 'error', text: 'Please select a project to assign this domain to.' });
      return;
    }
    setPurchasing(true);
    setMessage(null);
    try {
      const res = await fetch('/api/domains/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain, projectId: purchaseProject })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: 'Domain purchased successfully!' });
        setPurchaseDomain(null);
        setPurchaseProject('');
        setSearchResults([]);
        setSearchQuery('');
        fetchDomains();
        setActiveTab('my-domains');
      } else {
        setMessage({ type: 'error', text: data.error?.message || 'Failed to purchase domain' });
      }
    } catch (e) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setPurchasing(false);
    }
  }

    async function handleConnect() {
    if (!connectDomain.trim() || !connectProject) return;
    setConnecting(true);
    setMessage(null);
    try {
      const res = await fetch('/api/domains/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: connectDomain.trim().toLowerCase(),
          projectId: connectProject,
          domainType: 'external'
        })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: data.message || 'Domain connected successfully!' });
        setConnectDomain('');
        fetchDomains();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to connect domain' });
      }
    } catch (e) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setConnecting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => router.push('/dashboard')} className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold">Domain Management</h1>
            <p className="text-gray-400 mt-1">Buy, sell, and manage domains for your websites</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-900 p-1 rounded-xl mb-8">
          {[
            { id: 'my-domains' as const, label: 'My Domains', icon: Globe },
            { id: 'search' as const, label: 'Search & Buy', icon: Search },
            { id: 'connect' as const, label: 'Connect Domain', icon: Link2 },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* My Domains Tab */}
        {activeTab === 'my-domains' && (
          <div>
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
              </div>
            ) : domains.length === 0 ? (
              <div className="text-center py-20">
                <Globe className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No domains yet</h3>
                <p className="text-gray-400 mb-6">Search for a domain to buy or connect your existing domain</p>
                <div className="flex gap-3 justify-center">
                  <button onClick={() => { setActiveTab('search'); setMessage(null); }} className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors">
                    Search Domains
                  </button>
                  <button onClick={() => { setActiveTab('connect'); setMessage(null); }} className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-medium transition-colors">
                    Connect Existing
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {domains.map(domain => (
                  <div key={domain.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex items-center justify-between hover:border-gray-700 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        domain.status === 'active' ? 'bg-green-500/20 text-green-400' :
                        domain.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        <Globe className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{domain.domain}</h3>
                        <div className="flex items-center gap-3 text-sm text-gray-400">
                          <span className="capitalize">{domain.domain_type}</span>
                          {domain.project_name && (
                            <>
                              <span>•</span>
                              <span>{domain.project_name}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        domain.status === 'active' ? 'bg-green-500/20 text-green-400' :
                        domain.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {domain.status === 'active' ? 'Active' : domain.status === 'pending' ? 'Pending DNS' : domain.status}
                      </span>
                      <a href={`https://${domain.domain}`} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
                        <ExternalLink className="w-4 h-4 text-gray-400" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Search & Buy Tab */}
        {activeTab === 'search' && (
          <div>

            {message && (
              <div className={`p-4 rounded-lg mb-4 ${message.type === 'error' ? 'bg-red-500/20 border border-red-500/40 text-red-400' : 'bg-green-500/20 border border-green-500/40 text-green-400'}`}>
                <p className="flex items-center gap-2">
                  {message.type === 'error' ? '⚠️' : '✅'} {message.text}
                </p>
              </div>
            )}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8">
              <h3 className="text-lg font-semibold mb-4">Search for a domain</h3>
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && searchDomainsFn()}
                    placeholder="Enter a domain name (e.g. mybusiness.com)"
                    className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                  />
                </div>
                <button
                  onClick={searchDomainsFn}
                  disabled={searching || !searchQuery.trim()}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  Search
                </button>
              </div>
            </div>

            {searchResults.length > 0 && (
              <div className="space-y-3">
                {searchResults.map(result => (
                  <div key={result.domain} className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        result.available ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {result.available ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{result.domain}</h3>
                        <p className="text-sm text-gray-400">
                          {result.available ? (result.premium ? 'Premium domain' : 'Available') : 'Taken'}
                        </p>
                      </div>
                    </div>
                    {result.available && (
                      <div className="flex items-center gap-4">
                        {result.price && (
                          <span className="text-lg font-bold text-green-400">{result.price}/yr</span>
                        )}
                        {purchaseDomain === result.domain ? (
                          <div className="flex items-center gap-2">
                            <select value={purchaseProject} onChange={e => setPurchaseProject(e.target.value)} className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white">
                              <option value="">Assign to project...</option>
                              {projects.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
                            </select>
                            <button onClick={() => handlePurchase(result.domain)} disabled={purchasing || !purchaseProject} className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded-lg text-sm font-medium flex items-center gap-1">
                              {purchasing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} Confirm
                            </button>
                            <button onClick={() => { setPurchaseDomain(null); setPurchaseProject(''); }} className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => setPurchaseDomain(result.domain)} className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors flex items-center gap-2">
                            <ShoppingCart className="w-4 h-4" /> Buy Domain
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {!searching && searchResults.length === 0 && searchQuery && (
              <div className="text-center py-12 text-gray-400">
                <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                <p>No results found. Try a different domain name.</p>
              </div>
            )}

            <div className="mt-8 bg-gray-900/50 border border-gray-800 rounded-xl p-6">
              <h4 className="font-semibold mb-2">How domain purchasing works</h4>
              <p className="text-sm text-gray-400">
                Search for available domains and purchase them directly through our platform. 
                Once purchased, you can connect them to any of your published websites with one click. 
                DNS configuration is handled automatically.
              </p>
            </div>
          </div>
        )}

        {/* Connect Domain Tab */}
        {activeTab === 'connect' && (
          <div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-2">Connect your own domain</h3>
              <p className="text-gray-400 text-sm mb-6">
                Already own a domain? Connect it to one of your published projects.
              </p>

              {message && (
                <div className={`mb-4 p-4 rounded-lg flex items-center gap-3 ${
                  message.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                  'bg-red-500/10 text-red-400 border border-red-500/20'
                }`}>
                  {message.type === 'success' ? <Check className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
                  {message.text}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Domain name</label>
                  <input
                    type="text"
                    value={connectDomain}
                    onChange={e => setConnectDomain(e.target.value)}
                    placeholder="e.g. www.mybusiness.com"
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Connect to project</label>
                  <select
                    value={connectProject}
                    onChange={e => setConnectProject(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                  >
                    <option value="">Select a project...</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleConnect}
                  disabled={connecting || !connectDomain.trim() || !connectProject}
                  className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Connect Domain
                </button>
              </div>

              <div className="mt-6 p-4 bg-gray-800/50 rounded-lg">
                <h4 className="font-medium text-sm mb-2">DNS Configuration Required</h4>
                <p className="text-xs text-gray-400">
                  After connecting, you will need to add a CNAME record pointing your domain to 
                  <code className="px-1.5 py-0.5 bg-gray-700 rounded mx-1">cname.vercel-dns.com</code>. 
                  DNS changes typically take 5-30 minutes to propagate.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
