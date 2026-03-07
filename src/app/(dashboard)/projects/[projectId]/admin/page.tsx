'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import OnboardingChecklist from '@/components/admin/OnboardingChecklist';

interface Submission {
  id: string;
  form_type: string;
  name: string | null;
  email: string | null;
  message: string | null;
  status: string;
  created_at: string;
}

const CARD_CONFIG: Record<string, { label: string; key: string; color: string; path: string }[]> = {
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

function normalizeType(t: string): string {
  const lower = t.toLowerCase().replace(/[^a-z]/g, '');
  if (lower.includes('service') || lower === 'business' || lower === 'localservice') return 'service';
  if (lower.includes('ecom') || lower.includes('commerce') || lower.includes('shop') || lower.includes('store')) return 'ecommerce';
  if (lower.includes('real') || lower.includes('estate') || lower.includes('property')) return 'realestate';
  return 'general';
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function formatFormType(type: string): string {
  const labels: Record<string, string> = {
    contact: 'Contact', quote: 'Quote', appointment: 'Appointment',
    booking: 'Booking', inquiry: 'Inquiry', newsletter: 'Newsletter',
    service_request: 'Service Request', callback: 'Callback', estimate: 'Estimate',
  };
  return labels[type] || type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export default function AdminDashboard() {
  const params = useParams();
  const projectId = params.projectId as string;
  const [stats, setStats] = useState<Record<string, number>>({});
  const [project, setProject] = useState<any>(null);
  const [config, setConfig] = useState<any>(null);
  const [recentLeads, setRecentLeads] = useState<Submission[]>([]);
  const [newLeadCount, setNewLeadCount] = useState(0);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadData() {
      const [servRes, prodRes, propRes, ordRes, projRes, blogRes, reviewRes, galleryRes, leadsRes] = await Promise.all([
        fetch(`/api/projects/${projectId}/services`),
        fetch(`/api/projects/${projectId}/products`),
        fetch(`/api/projects/${projectId}/properties`),
        fetch(`/api/projects/${projectId}/orders`),
        fetch(`/api/projects/${projectId}`),
        fetch(`/api/projects/${projectId}/blog`),
        fetch(`/api/projects/${projectId}/reviews`),
        fetch(`/api/projects/${projectId}/gallery`),
        fetch(`/api/projects/${projectId}/form-submissions`),
      ]);
      const [servData, products, properties, orders, proj, blogData, reviewData, galleryData, leadsData] = await Promise.all([
        servRes.ok ? servRes.json() : { services: [] },
        prodRes.ok ? prodRes.json() : [],
        propRes.ok ? propRes.json() : [],
        ordRes.ok ? ordRes.json() : [],
        projRes.ok ? projRes.json() : null,
        blogRes.ok ? blogRes.json() : [],
        reviewRes.ok ? reviewRes.json() : [],
        galleryRes.ok ? galleryRes.json() : { images: [] },
        leadsRes.ok ? leadsRes.json() : { submissions: [] },
      ]);
      const services = servData.services || [];
      const blog = Array.isArray(blogData) ? blogData : blogData.posts || [];
      const reviews = Array.isArray(reviewData) ? reviewData : reviewData.reviews || [];
      const gallery = Array.isArray(galleryData) ? galleryData : galleryData.images || [];
      const submissions = leadsData.submissions || [];

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

      // Recent leads (top 5)
      setRecentLeads(submissions.slice(0, 5));
      setNewLeadCount(submissions.filter((s: Submission) => s.status === 'new').length);
    }
    loadData();
  }, [projectId]);

  const basePath = `/projects/${projectId}/admin`;
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
      <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: primaryColor }} />
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              {editingName ? (
                <Input
                  ref={nameInputRef}
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  onBlur={saveName}
                  onKeyDown={(e) => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditingName(false); }}
                  className="text-2xl font-bold h-auto py-0 px-1 -ml-1 bg-transparent border-purple-500"
                  autoFocus
                />
              ) : (
                <h1
                  className="text-2xl font-bold text-white truncate cursor-pointer hover:text-purple-300 transition-colors"
                  onClick={() => { setNameValue(project?.name || ''); setEditingName(true); }}
                  title="Click to edit project name"
                >
                  {project?.name || biz.name || 'Content Dashboard'}
                </h1>
              )}
              {isPublished ? (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  Live
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-700/50 text-gray-400 border border-gray-600">
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
          <div className="flex-shrink-0 ml-4 flex flex-col gap-2">
            <Link
              href={`/projects/${projectId}`}
              className="flex items-center justify-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              Edit Site
            </Link>
            {isPublished && project?.published_url && (
              <a
                href={project.published_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors border border-gray-700"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                View Live
              </a>
            )}
          </div>
        </div>
        {/* Color palette preview */}
        {(branding.primaryColor || branding.colors) && (
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-800">
            <span className="text-xs text-gray-500 mr-1">Brand Colors:</span>
            {[
              branding.primaryColor || branding.colors?.primary,
              branding.secondaryColor || branding.colors?.secondary,
              branding.accentColor || branding.colors?.accent,
            ].filter(Boolean).map((c: string, i: number) => (
              <div key={i} className="flex items-center gap-1">
                <div className="w-4 h-4 rounded-full border border-gray-700" style={{ backgroundColor: c }} />
                <span className="text-xs text-gray-500">{c}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <OnboardingChecklist projectId={projectId} />

      {/* Stat Cards - business-type aware */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={`${basePath}/${card.path}`}
            className="bg-gray-900 border border-gray-800 rounded-lg p-5 hover:border-purple-500 transition-colors group"
          >
            <div className={'inline-block px-2 py-0.5 rounded text-xs font-medium text-white ' + card.color + ' mb-2'}>
              {card.label}
            </div>
            <div className="text-3xl font-bold text-white">{stats[card.key] || 0}</div>
            <div className="text-xs text-gray-500 mt-1 group-hover:text-gray-400">Manage &rarr;</div>
          </Link>
        ))}
      </div>

      {/* Recent Form Submissions */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold text-white">Recent Leads</h2>
            {newLeadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
                {newLeadCount} new
              </span>
            )}
          </div>
          <Link
            href={`${basePath}/leads`}
            className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
          >
            View all &rarr;
          </Link>
        </div>
        {recentLeads.length === 0 ? (
          <div className="p-6 text-center text-gray-500 text-sm">
            No form submissions yet. They'll appear here when visitors fill out forms on your website.
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {recentLeads.map((lead) => (
              <Link
                key={lead.id}
                href={`${basePath}/leads`}
                className="flex items-center justify-between px-4 py-3 hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${lead.status === 'new' ? 'bg-blue-400' : 'bg-gray-600'}`} />
                  <div className="min-w-0">
                    <div className="text-sm text-white truncate">
                      {lead.name || lead.email || 'Anonymous'}
                    </div>
                    {lead.message && (
                      <p className="text-xs text-gray-500 truncate max-w-xs">{lead.message}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                  <span className="text-[10px] text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">
                    {formatFormType(lead.form_type)}
                  </span>
                  <span className="text-xs text-gray-500">{timeAgo(lead.created_at)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
