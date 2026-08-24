'use client';

import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const NAV_VISIBILITY: Record<string, string[]> = {
  service: ['Workspace', 'Setup', 'Services', 'Bookings', 'Blog', 'Gallery', 'Visual Studio', 'Reviews', 'Leads', 'Marketing', 'Business Info', 'Notifications'],
  ecommerce: ['Workspace', 'Setup', 'Products', 'Orders', 'Blog', 'Gallery', 'Visual Studio', 'Reviews', 'Leads', 'Marketing', 'Business Info', 'Notifications'],
  realestate: ['Workspace', 'Setup', 'Properties', 'Blog', 'Gallery', 'Visual Studio', 'Reviews', 'Leads', 'Marketing', 'Business Info', 'Notifications'],
  general: ['Workspace', 'Setup', 'Services', 'Products', 'Blog', 'Gallery', 'Visual Studio', 'Reviews', 'Leads', 'Marketing', 'Business Info', 'Notifications'],
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const pathname = usePathname();
  const projectId = params.projectId as string;
  const basePath = `/projects/${projectId}/admin`;

  const [businessType, setBusinessType] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/projects/${projectId}`)
      .then(r => r.ok ? r.json() : null)
      .then(p => {
        if (p?.business_type) setBusinessType(p.business_type);
        else if (p?.site_type) setBusinessType(p.site_type);
                          else if (p?.generation_config?.siteType) setBusinessType(p.generation_config.siteType);
        else setBusinessType('');
      })
      .catch(() => setBusinessType(''));
  }, [projectId]);

  const groups = [
    {
      label: 'Site setup',
      items: [
        { label: 'Workspace', href: `/projects/${projectId}/workspace` },
        { label: 'Setup', href: `${basePath}/setup` },
        { label: 'Business Info', href: `${basePath}/business-info` },
        { label: 'Bookings', href: `${basePath}/bookings` },
      ],
    },
    {
      label: 'Content',
      items: [
        { label: 'Services', href: `${basePath}/services` },
        { label: 'Products', href: `${basePath}/products` },
        { label: 'Properties', href: `${basePath}/properties` },
        { label: 'Blog', href: `${basePath}/blog` },
        { label: 'Gallery', href: `${basePath}/gallery` },
        { label: 'Visual Studio', href: `${basePath}/media` },
      ],
    },
    {
      label: 'Grow',
      items: [
        { label: 'Orders', href: `${basePath}/orders` },
        { label: 'Reviews', href: `${basePath}/reviews` },
        { label: 'Leads', href: `${basePath}/leads` },
        { label: 'Marketing', href: `${basePath}/marketing` },
        { label: 'Notifications', href: `${basePath}/notifications` },
      ],
    },
  ];
  const allItems = groups.flatMap(group => group.items);

  const normalizeType = (t: string): string => {
    const lower = t.toLowerCase().replace(/[^a-z]/g, '');
        if (lower.includes('service') || lower === 'business' || lower === 'localservice') return 'service';
    if (lower.includes('ecom') || lower.includes('commerce') || lower.includes('shop') || lower.includes('store')) return 'ecommerce';
    if (lower.includes('real') || lower.includes('estate') || lower.includes('property')) return 'realestate';
        if (lower.includes('general') || lower.includes('other') || lower === 'saas' || lower === 'landingpage') return 'general';
    return '';
  };

  const resolved = businessType ? normalizeType(businessType) : '';
  const allowed = resolved && NAV_VISIBILITY[resolved] ? NAV_VISIBILITY[resolved] : null;
  const navItems = allowed ? allItems.filter(i => allowed.includes(i.label)) : allItems;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-800 bg-gray-950/40 p-2">
        <div className="flex items-center gap-2 border-b border-gray-800 px-2 pb-2">
          <Link
            href={`/projects/${projectId}`}
            className="flex items-center gap-1.5 px-4 py-3 md:px-3 md:py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors whitespace-nowrap min-h-[44px] md:min-h-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Editor
          </Link>
        </div>
        <nav className="grid gap-3 px-2 py-3 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => {
            const visibleItems = group.items.filter(item => navItems.some(navItem => navItem.href === item.href));
            if (visibleItems.length === 0) return null;
            return (
              <section key={group.label}>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500">{group.label}</p>
                <div className="flex flex-wrap gap-1">
                  {visibleItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== basePath && pathname.startsWith(item.href));
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`rounded-md px-3 py-2 text-sm font-medium transition-colors min-h-[40px] ${
                          isActive
                            ? 'bg-purple-500/15 text-purple-300 ring-1 ring-purple-500/30'
                            : 'text-gray-400 hover:bg-gray-800 hover:text-gray-100'
                        }`}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </nav>
      </div>
      {children}
    </div>
  );
}
