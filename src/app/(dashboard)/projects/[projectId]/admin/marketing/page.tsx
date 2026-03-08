'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

type Tab = 'seo' | 'social' | 'ads';

interface SeoEntry {
  id: string;
  page_path: string;
  meta_title: string;
  meta_description: string;
  keywords: string[];
  og_title: string;
  og_description: string;
  canonical_url: string;
  robots: string;
  schema_markup: Record<string, unknown>;
  updated_at: string;
}

interface SeoScore {
  score: number;
  maxScore: number;
  categories: Record<string, { score: number; max: number }>;
  checklist: { id: string; label: string; description?: string; status: 'pass' | 'fail' | 'warning'; points: number; maxPoints: number; category: string }[];
}

interface MarketingAsset {
  id: string;
  asset_type: string;
  platform: string | null;
  title: string | null;
  content: string;
  metadata: Record<string, unknown>;
  status: string;
  created_at: string;
  updated_at: string;
}

export default function MarketingPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const [activeTab, setActiveTab] = useState<Tab>('seo');

  const [seoEntries, setSeoEntries] = useState<SeoEntry[]>([]);
  const [seoScore, setSeoScore] = useState<SeoScore | null>(null);
  const [assets, setAssets] = useState<MarketingAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const loadSeoData = useCallback(async () => {
    try {
      const [entriesRes, scoreRes] = await Promise.all([
        fetch(`/api/projects/${projectId}/seo`),
        fetch(`/api/projects/${projectId}/seo/score`),
      ]);
      if (entriesRes.ok) {
        const data = await entriesRes.json();
        setSeoEntries(data.seo || data.entries || []);
      }
      if (scoreRes.ok) {
        const data = await scoreRes.json();
        setSeoScore(data);
      }
    } catch {
      // silent
    }
  }, [projectId]);

  const loadAssets = useCallback(async (type?: string) => {
    try {
      const url = type
        ? `/api/projects/${projectId}/marketing?type=${type}`
        : `/api/projects/${projectId}/marketing`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setAssets(data.assets || []);
      }
    } catch {
      // silent
    }
  }, [projectId]);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadSeoData(), loadAssets()]).finally(() => setLoading(false));
  }, [loadSeoData, loadAssets]);

  const handleGenerateSeo = async () => {
    setGenerating(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/seo/generate`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to generate SEO');
      toast.success('SEO metadata generated');
      await loadSeoData();
    } catch {
      toast.error('Failed to generate SEO metadata');
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateSocial = async () => {
    setGenerating(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/marketing/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'social_posts', options: {} }),
      });
      if (!res.ok) throw new Error('Failed to generate posts');
      toast.success('Social posts generated');
      await loadAssets();
    } catch {
      toast.error('Failed to generate social posts');
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateAds = async () => {
    setGenerating(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/marketing/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'ad_copy', options: {} }),
      });
      if (!res.ok) throw new Error('Failed to generate ads');
      toast.success('Ad copy generated');
      await loadAssets();
    } catch {
      toast.error('Failed to generate ad copy');
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteAsset = async (assetId: string) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/marketing/${assetId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete');
      setAssets((prev) => prev.filter((a) => a.id !== assetId));
      toast.success('Asset deleted');
    } catch {
      toast.error('Failed to delete asset');
    }
  };

  const handleCopyContent = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success('Copied to clipboard');
  };

  const socialAssets = assets.filter((a) => a.asset_type === 'social_post');
  const adAssets = assets.filter((a) => a.asset_type === 'ad_copy');

  const tabs: { key: Tab; label: string }[] = [
    { key: 'seo', label: 'SEO' },
    { key: 'social', label: 'Social' },
    { key: 'ads', label: 'Ads' },
  ];

  const scoreColor = (score: number, max: number) => {
    const pct = max > 0 ? (score / max) * 100 : 0;
    if (pct >= 80) return 'text-green-400';
    if (pct >= 60) return 'text-blue-400';
    if (pct >= 40) return 'text-yellow-400';
    return 'text-red-400';
  };

  const categoryLabel = (key: string) => {
    const labels: Record<string, string> = {
      meta_tags: 'Meta Tags',
      content_quality: 'Content Quality',
      business_presence: 'Business Presence',
      technical: 'Technical',
    };
    return labels[key] || key;
  };

  const statusIcon = (status: string) => {
    if (status === 'pass') return '✓';
    if (status === 'warning') return '!';
    return '✗';
  };

  const statusColor = (status: string) => {
    if (status === 'pass') return 'text-green-400';
    if (status === 'warning') return 'text-yellow-400';
    return 'text-red-400';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Marketing</h1>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 border-b border-gray-800 pb-0">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* SEO Tab */}
      {activeTab === 'seo' && (
        <div className="space-y-6">
          {/* Score Overview */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">SEO Score</h2>
              <button
                onClick={handleGenerateSeo}
                disabled={generating}
                className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
              >
                {generating ? 'Generating...' : 'Generate SEO'}
              </button>
            </div>

            {seoScore ? (
              <div className="space-y-4">
                <div className="flex items-center gap-6">
                  <div className="flex items-center justify-center w-20 h-20 rounded-full border-4 border-gray-700">
                    <span className={`text-2xl font-bold ${scoreColor(seoScore.score, seoScore.maxScore)}`}>
                      {seoScore.score}
                    </span>
                  </div>
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    {Object.entries(seoScore.categories).map(([key, cat]) => (
                      <div key={key} className="text-sm">
                        <div className="flex justify-between text-gray-400 mb-1">
                          <span>{categoryLabel(key)}</span>
                          <span>{cat.score}/{cat.max}</span>
                        </div>
                        <div className="w-full bg-gray-800 rounded-full h-1.5">
                          <div
                            className="bg-purple-500 h-1.5 rounded-full transition-all"
                            style={{ width: `${cat.max > 0 ? (cat.score / cat.max) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Checklist */}
                <div className="border-t border-gray-800 pt-4">
                  <h3 className="text-sm font-medium text-gray-300 mb-3">Checklist</h3>
                  <div className="space-y-2">
                    {seoScore.checklist.map((item) => (
                      <div key={item.id} className="flex items-start gap-2 text-sm">
                        <span className={`font-mono ${statusColor(item.status)}`}>
                          [{statusIcon(item.status)}]
                        </span>
                        <div>
                          <span className="text-gray-300">{item.label}</span>
                          {item.description && item.status !== 'pass' && (
                            <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">
                No SEO data yet. Click &quot;Generate SEO&quot; to get started.
              </p>
            )}
          </div>

          {/* Per-page SEO Metadata */}
          {seoEntries.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-white">Page Metadata</h2>
              {seoEntries.map((entry) => (
                <div key={entry.id} className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-mono text-purple-400">{entry.page_path}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(entry.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-500">Title: </span>
                      <span className="text-gray-300">{entry.meta_title}</span>
                      <span className="text-xs text-gray-600 ml-2">
                        ({entry.meta_title?.length || 0} chars)
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Description: </span>
                      <span className="text-gray-300">{entry.meta_description}</span>
                      <span className="text-xs text-gray-600 ml-2">
                        ({entry.meta_description?.length || 0} chars)
                      </span>
                    </div>
                    {entry.keywords && entry.keywords.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {entry.keywords.map((kw, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 text-xs bg-gray-800 text-gray-400 rounded-full"
                          >
                            {kw}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Social Tab */}
      {activeTab === 'social' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Social Posts</h2>
            <button
              onClick={handleGenerateSocial}
              disabled={generating}
              className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              {generating ? 'Generating...' : 'Generate Posts'}
            </button>
          </div>

          {socialAssets.length === 0 ? (
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 text-center">
              <p className="text-gray-500 text-sm">
                No social posts yet. Click &quot;Generate Posts&quot; or ask in the chat.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {socialAssets.map((asset) => {
                const meta = asset.metadata || {};
                const imageUrl = (meta.image_url as string) || '';
                const visualHeadline = (meta.visual_headline as string) || '';
                const visualSubtext = (meta.visual_subtext as string) || '';
                const postType = (meta.post_type as string) || '';
                const bestTime = (meta.best_time as string) || '';

                return (
                  <div key={asset.id} className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
                    {/* Branded Graphic */}
                    {imageUrl && (
                      <div className="relative w-full bg-gray-800">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={imageUrl}
                          alt={visualHeadline || 'Social media graphic'}
                          className="w-full aspect-square object-cover"
                        />
                        <span className="absolute top-2 right-2 px-2 py-0.5 text-[10px] font-medium bg-black/60 text-white rounded-full backdrop-blur-sm">
                          Nano Banana 2
                        </span>
                      </div>
                    )}

                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {asset.platform && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-full">
                              {asset.platform}
                            </span>
                          )}
                          {postType && (
                            <span className="px-2 py-0.5 text-xs bg-gray-800 text-gray-400 rounded-full">
                              {postType}
                            </span>
                          )}
                          <span className={`px-2 py-0.5 text-xs rounded-full ${
                            asset.status === 'approved'
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                              : asset.status === 'published'
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                              : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                          }`}>
                            {asset.status}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(asset.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Visual headline & subtext preview (if graphic was generated) */}
                      {visualHeadline && (
                        <div className="mb-2 py-2 border-b border-gray-800">
                          <p className="text-sm font-bold text-white">{visualHeadline}</p>
                          {visualSubtext && (
                            <p className="text-xs text-gray-400 mt-0.5">{visualSubtext}</p>
                          )}
                        </div>
                      )}

                      <p className="text-sm text-gray-300 whitespace-pre-wrap mb-3">{asset.content}</p>

                      {Array.isArray(asset.metadata?.hashtags) && asset.metadata.hashtags.length > 0 && (
                        <p className="text-xs text-purple-400 mb-3">
                          {(asset.metadata.hashtags as string[]).join(' ')}
                        </p>
                      )}

                      {bestTime && (
                        <p className="text-xs text-gray-500 mb-3">Best time: {bestTime}</p>
                      )}

                      <div className="flex gap-2 pt-2 border-t border-gray-800">
                        <button
                          onClick={() => handleCopyContent(asset.content)}
                          className="px-3 py-1.5 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
                        >
                          Copy Caption
                        </button>
                        <button
                          onClick={() => handleDeleteAsset(asset.id)}
                          className="px-3 py-1.5 text-xs bg-gray-700 text-red-400 rounded hover:bg-gray-600 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Ads Tab */}
      {activeTab === 'ads' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Ad Copy</h2>
            <button
              onClick={handleGenerateAds}
              disabled={generating}
              className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              {generating ? 'Generating...' : 'Generate Ads'}
            </button>
          </div>

          {adAssets.length === 0 ? (
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 text-center">
              <p className="text-gray-500 text-sm">
                No ad copy yet. Click &quot;Generate Ads&quot; to create Google and Meta ad variations.
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {adAssets.map((asset) => {
                const meta = asset.metadata || {};
                const headlines = (meta.headlines as string[]) || [];
                const descriptions = (meta.descriptions as string[]) || [];
                const variation = (meta.variation as string) || '';
                const targeting = (meta.targeting_suggestion as string) || '';
                const imageUrl = (meta.image_url as string) || '';

                return (
                  <div key={asset.id} className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
                    {/* Ad Image */}
                    {imageUrl && (
                      <div className="relative w-full bg-gray-800">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={imageUrl}
                          alt={headlines[0] || 'Ad visual'}
                          className="w-full h-48 object-cover"
                        />
                        <span className="absolute top-2 right-2 px-2 py-0.5 text-[10px] font-medium bg-black/60 text-white rounded-full backdrop-blur-sm">
                          Nano Banana 2
                        </span>
                      </div>
                    )}
                    <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {asset.platform && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-full">
                            {asset.platform === 'google_ads' ? 'Google Ads' : 'Meta Ads'}
                          </span>
                        )}
                        {variation && (
                          <span className="px-2 py-0.5 text-xs bg-gray-800 text-gray-400 rounded-full">
                            {variation}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(asset.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Headlines */}
                    {headlines.length > 0 && (
                      <div className="mb-2">
                        <span className="text-[10px] uppercase tracking-wider text-gray-500">Headlines</span>
                        {headlines.map((h, i) => (
                          <p key={i} className="text-sm font-medium text-white">
                            {h}
                            <span className="text-xs text-gray-600 ml-1">({h.length})</span>
                          </p>
                        ))}
                      </div>
                    )}

                    {/* Descriptions */}
                    {descriptions.length > 0 && (
                      <div className="mb-2">
                        <span className="text-[10px] uppercase tracking-wider text-gray-500">Descriptions</span>
                        {descriptions.map((d, i) => (
                          <p key={i} className="text-sm text-gray-300">{d}</p>
                        ))}
                      </div>
                    )}

                    {/* CTA */}
                    {typeof meta.cta === 'string' && meta.cta && (
                      <div className="mb-2">
                        <span className="text-[10px] uppercase tracking-wider text-gray-500">CTA</span>
                        <p className="text-sm text-purple-400 font-medium">{meta.cta}</p>
                      </div>
                    )}

                    {/* Targeting */}
                    {targeting && (
                      <p className="text-xs text-gray-500 italic mb-3">Targeting: {targeting}</p>
                    )}

                    <div className="flex gap-2 pt-2 border-t border-gray-800">
                      <button
                        onClick={() => {
                          const text = [
                            ...headlines.map(h => `Headline: ${h}`),
                            ...descriptions.map(d => `Description: ${d}`),
                            `CTA: ${meta.cta || ''}`,
                          ].join('\n');
                          handleCopyContent(text);
                        }}
                        className="px-3 py-1.5 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
                      >
                        Copy
                      </button>
                      <button
                        onClick={() => handleDeleteAsset(asset.id)}
                        className="px-3 py-1.5 text-xs bg-gray-700 text-red-400 rounded hover:bg-gray-600 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
