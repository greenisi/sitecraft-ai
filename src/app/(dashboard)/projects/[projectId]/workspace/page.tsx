'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import OnboardingChecklist from '@/components/admin/OnboardingChecklist';
import { InboxPanel } from '@/components/workspace/InboxPanel';
import { CapabilitySuggestions } from '@/components/workspace/CapabilitySuggestions';
import { LogoPrompt } from '@/components/workspace/LogoPrompt';

const CARD_CONFIG: Record<
  string,
  { label: string; key: string; color: string; path: string }[]
> = {
  service: [
    { label: 'Services', key: 'services', color: 'bg-blue-600', path: 'services' },
    { label: 'Bookings', key: 'orders', color: 'bg-purple-600', path: 'bookings' },
    { label: 'Blog Posts', key: 'blog', color: 'bg-indigo-600', path: 'blog' },
    { label: 'Reviews', key: 'reviews', color: 'bg-yellow-600', path: 'reviews' },
  ],
  ecommerce: [
    { label: 'Products', key: 'products', color: 'bg-green-600', path: 'products' },
    { label: 'Orders', key: 'orders', color: 'bg-purple-600', path: 'orders' },
    { label: 'Blog Posts', key: 'blog', color: 'bg-indigo-600', path: 'blog' },
    { label: 'Reviews', key: 'reviews', color: 'bg-yellow-600', path: 'reviews' },
  ],
  realestate: [
    { label: 'Properties', key: 'properties', color: 'bg-yellow-600', path: 'properties' },
    { label: 'Blog Posts', key: 'blog', color: 'bg-indigo-600', path: 'blog' },
    { label: 'Reviews', key: 'reviews', color: 'bg-green-600', path: 'reviews' },
    { label: 'Gallery', key: 'gallery', color: 'bg-pink-600', path: 'gallery' },
  ],
  general: [
    { label: 'Services', key: 'services', color: 'bg-blue-600', path: 'services' },
    { label: 'Products', key: 'products', color: 'bg-green-600', path: 'products' },
    { label: 'Blog Posts', key: 'blog', color: 'bg-indigo-600', path: 'blog' },
    { label: 'Orders', key: 'orders', color: 'bg-purple-600', path: 'orders' },
  ],
};

interface WorkspaceProject {
  name?: string;
  status?: string;
  business_type?: string;
  published_url?: string;
  generation_config?: WorkspaceConfig;
}

interface WorkspaceConfig {
  siteType?: string;
  business?: {
    name?: string;
    industry?: string;
    description?: string;
  };
  branding?: {
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
    colors?: {
      primary?: string;
      secondary?: string;
      accent?: string;
    };
  };
}

function normalizeType(t: string): string {
  const lower = t.toLowerCase().replace(/[^a-z]/g, '');
  if (lower.includes('service') || lower === 'business' || lower === 'localservice') return 'service';
  if (
    lower.includes('ecom') ||
    lower.includes('commerce') ||
    lower.includes('shop') ||
    lower.includes('store')
  )
    return 'ecommerce';
  if (lower.includes('real') || lower.includes('estate') || lower.includes('property'))
    return 'realestate';
  return 'general';
}

export default function WorkspacePage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const [stats, setStats] = useState<Record<string, number>>({});
  const [project, setProject] = useState<WorkspaceProject | null>(null);
  const [config, setConfig] = useState<WorkspaceConfig | null>(null);
  const [seoScore, setSeoScore] = useState<number | null>(null);
  const [marketingAssetCount, setMarketingAssetCount] = useState(0);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Persist last-active project for the SpaceNavbar Workspace link.
  useEffect(() => {
    try {
      localStorage.setItem('lastProjectId', projectId);
    } catch {
      // localStorage may be unavailable (private mode) — non-fatal.
    }
  }, [projectId]);

  useEffect(() => {
    async function loadData() {
      const [servRes, prodRes, propRes, ordRes, projRes, blogRes, reviewRes, galleryRes] =
        await Promise.all([
          fetch(`/api/projects/${projectId}/services`),
          fetch(`/api/projects/${projectId}/products`),
          fetch(`/api/projects/${projectId}/properties`),
          fetch(`/api/projects/${projectId}/orders`),
          fetch(`/api/projects/${projectId}`),
          fetch(`/api/projects/${projectId}/blog`),
          fetch(`/api/projects/${projectId}/reviews`),
          fetch(`/api/projects/${projectId}/gallery`),
        ]);
      const [servData, products, properties, orders, proj, blogData, reviewData, galleryData] =
        await Promise.all([
          servRes.ok ? servRes.json() : { services: [] },
          prodRes.ok ? prodRes.json() : [],
          propRes.ok ? propRes.json() : [],
          ordRes.ok ? ordRes.json() : [],
          projRes.ok ? projRes.json() : null,
          blogRes.ok ? blogRes.json() : [],
          reviewRes.ok ? reviewRes.json() : [],
          galleryRes.ok ? galleryRes.json() : { images: [] },
        ]);
      const services = servData.services || [];
      const blog = Array.isArray(blogData) ? blogData : blogData.posts || [];
      const reviews = Array.isArray(reviewData) ? reviewData : reviewData.reviews || [];
      const gallery = Array.isArray(galleryData) ? galleryData : galleryData.images || [];

      setStats({
        services: Array.isArray(services) ? services.length : 0,
        products: Array.isArray(products) ? products.length : 0,
        properties: Array.isArray(properties) ? properties.length : 0,
        orders: Array.isArray(orders) ? orders.length : 0,
        blog: Array.isArray(blog) ? blog.length : 0,
        reviews: Array.isArray(reviews) ? reviews.length : 0,
        gallery: Array.isArray(gallery) ? gallery.length : 0,
      });
      setProject(proj);
      if (proj?.generation_config) {
        setConfig(proj.generation_config);
      }

      // Marketing stats (fire-and-forget, non-blocking)
      Promise.all([
        fetch(`/api/projects/${projectId}/seo/score`).then((r) => (r.ok ? r.json() : null)),
        fetch(`/api/projects/${projectId}/marketing`).then((r) => (r.ok ? r.json() : null)),
      ])
        .then(([scoreData, assetsData]) => {
          if (scoreData?.overall != null) setSeoScore(scoreData.overall);
          if (assetsData?.assets) setMarketingAssetCount(assetsData.assets.length);
        })
        .catch(() => {});
    }
    loadData();
  }, [projectId]);

  const adminBasePath = `/projects/${projectId}/admin`;
  const biz = config?.business || {};
  const branding = config?.branding || {};
  const primaryColor = branding.primaryColor || branding.colors?.primary || '#9333ea';
  const bizType = normalizeType(project?.business_type || config?.siteType || 'general');
  const cards = CARD_CONFIG[bizType] || CARD_CONFIG.general;

  async function saveName() {
    const trimmed = nameValue.trim();
    if (!trimmed || trimmed === project?.name) {
      setEditingName(false);
      return;
    }
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      });
      if (res.ok) {
        setProject({ ...project, name: trimmed });
        toast.success('Project name updated');
      } else {
        toast.error('Failed to update name');
      }
    } catch {
      toast.error('Failed to update name');
    }
    setEditingName(false);
  }

  const isPublished = project?.status === 'published';

  return (
    <div className="space-y-6">
      {/* Project Identity Header */}
      <div className="relative overflow-hidden rounded-xl border border-gray-800 bg-gray-900/80 p-4 sm:p-6">
        <div
          className="absolute top-0 left-0 w-full h-1"
          style={{ backgroundColor: primaryColor }}
        />
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex min-w-0 flex-wrap items-center gap-3">
              {editingName ? (
                <Input
                  ref={nameInputRef}
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  onBlur={saveName}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveName();
                    if (e.key === 'Escape') setEditingName(false);
                  }}
                  className="text-2xl font-bold h-auto py-0 px-1 -ml-1 bg-transparent border-purple-500"
                  autoFocus
                />
              ) : (
                <h1
                  className="text-2xl font-bold text-white truncate cursor-pointer hover:text-purple-300 transition-colors"
                  onClick={() => {
                    setNameValue(project?.name || '');
                    setEditingName(true);
                  }}
                  title="Click to edit project name"
                >
                  {project?.name || biz.name || 'Workspace'}
                </h1>
              )}
              {isPublished ? (
                <span className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30 min-h-[32px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  Live
                </span>
              ) : (
                <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-gray-700/50 text-gray-400 border border-gray-600 min-h-[32px] flex items-center">
                  Draft
                </span>
              )}
            </div>
            {biz.industry && (
              <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium bg-gray-800 text-gray-300 border border-gray-700">
                {biz.industry}
              </span>
            )}
            {biz.description && (
              <p className="mt-3 text-sm text-gray-400 line-clamp-2 max-w-2xl">
                {biz.description}
              </p>
            )}
          </div>
          <div className="grid w-full grid-cols-1 gap-2 sm:ml-4 sm:w-auto sm:flex-shrink-0 sm:flex sm:flex-col">
            <Link
              href={`/projects/${projectId}`}
              className="flex items-center justify-center gap-1.5 px-5 py-3 md:px-4 md:py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-lg transition-colors min-h-[44px] md:min-h-0"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Edit Site
            </Link>
            {isPublished && project?.published_url && (
              <a
                href={project.published_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 px-5 py-3 md:px-4 md:py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors border border-gray-700 min-h-[44px] md:min-h-0"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
                View Live
              </a>
            )}
          </div>
        </div>
        {(branding.primaryColor || branding.colors) && (
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-gray-800 pt-4">
            <span className="text-xs text-gray-500 mr-1">Brand Colors:</span>
            {[
              branding.primaryColor || branding.colors?.primary,
              branding.secondaryColor || branding.colors?.secondary,
              branding.accentColor || branding.colors?.accent,
            ]
              .filter((c): c is string => Boolean(c))
              .map((c, i) => (
                <div key={i} className="flex items-center gap-1">
                  <div
                    className="w-4 h-4 rounded-full border border-gray-700"
                    style={{ backgroundColor: c }}
                  />
                  <span className="text-xs text-gray-500">{c}</span>
                </div>
              ))}
          </div>
        )}
      </div>

      <OnboardingChecklist projectId={projectId} />

      <LogoPrompt projectId={projectId} />

      <CapabilitySuggestions projectId={projectId} />

      {/* Stat Cards - business-type aware */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={`${adminBasePath}/${card.path}`}
            className="bg-gray-900 border border-gray-800 rounded-lg p-5 hover:border-purple-500 transition-colors group"
          >
            <div
              className={
                'inline-block px-2 py-0.5 rounded text-xs font-medium text-white ' +
                card.color +
                ' mb-2'
              }
            >
              {card.label}
            </div>
            <div className="text-3xl font-bold text-white">{stats[card.key] || 0}</div>
            <div className="text-xs text-gray-500 mt-1 group-hover:text-gray-400">
              Manage &rarr;
            </div>
          </Link>
        ))}
      </div>

      {/* Site essentials (Domains, Payments) — visible regardless of business type */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
        <Link
          href={`/projects/${projectId}/payments`}
          className="bg-gray-900 border border-gray-800 rounded-lg p-5 hover:border-purple-500 transition-colors group block"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="inline-block px-2 py-0.5 rounded text-xs font-medium text-white bg-[#635bff] mb-2">
                Payments
              </div>
              <div className="text-base font-semibold text-white">Connect Stripe</div>
              <div className="text-xs text-gray-500 mt-1 group-hover:text-gray-400">
                Take real payments on your site &rarr;
              </div>
            </div>
          </div>
        </Link>
        <Link
          href={`/domains?projectId=${projectId}`}
          className="bg-gray-900 border border-gray-800 rounded-lg p-5 hover:border-purple-500 transition-colors group block"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="inline-block px-2 py-0.5 rounded text-xs font-medium text-white bg-emerald-600 mb-2">
                Domain
              </div>
              <div className="text-base font-semibold text-white">Get a custom domain</div>
              <div className="text-xs text-gray-500 mt-1 group-hover:text-gray-400">
                Search, buy, or connect &rarr;
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Marketing Quick Stats */}
      {(seoScore !== null || marketingAssetCount > 0) && (
        <Link
          href={`${adminBasePath}/marketing`}
          className="bg-gray-900 border border-gray-800 rounded-lg p-5 hover:border-purple-500 transition-colors group block"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 mb-1">SEO Score</span>
                <span className="text-2xl font-bold text-white">
                  {seoScore ?? '—'}
                  <span className="text-sm text-gray-500">/100</span>
                </span>
              </div>
              <div className="w-px h-10 bg-gray-800" />
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 mb-1">Marketing Assets</span>
                <span className="text-2xl font-bold text-white">{marketingAssetCount}</span>
              </div>
            </div>
            <span className="text-xs text-gray-500 group-hover:text-gray-400">
              View Marketing &rarr;
            </span>
          </div>
        </Link>
      )}

      {/* Interactive Inbox */}
      <InboxPanel
        projectId={projectId}
        variant="compact"
        compactLimit={8}
        viewAllHref={`${adminBasePath}/leads`}
      />
    </div>
  );
}
