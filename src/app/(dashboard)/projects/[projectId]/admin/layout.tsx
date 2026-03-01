'use client';

import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const NAV_VISIBILITY: Record<string, string[]> = {
  service: ['Dashboard', 'Setup', 'Services', 'Bookings', 'Blog', 'Gallery', 'Reviews', 'Leads', 'Business Info', 'Notifications'],
  ecommerce: ['Dashboard', 'Setup', 'Products', 'Orders', 'Blog', 'Gallery', 'Reviews', 'Leads', 'Business Info', 'Notifications'],
  realestate: ['Dashboard', 'Setup', 'Properties', 'Blog', 'Gallery', 'Reviews', 'Leads', 'Business Info', 'Notifications'],
  general: ['Dashboard', 'Setup', 'Services', 'Products', 'Blog', 'Gallery', 'Reviews', 'Leads', 'Business Info', 'Notifications'],
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
        else setBusinessType('');
      })
      .catch(() => setBusinessType(''));
  }, [projectId]);

  const allItems = [
    { label: 'Dashboard', href: basePath },
    { label: 'Setup', href: `${basePath}/setup` },
    { label: 'Services', href: `${basePath}/services` },
    { label: 'Products', href: `${basePath}/products` },
    { label: 'Properties', href: `${basePath}/properties` },
    { label: 'Orders', href: `${basePath}/orders` },
    { label: 'Bookings', href: `${basePath}/bookings` },
    { label: 'Blog', href: `${basePath}/blog` },
    { label: 'Gallery', href: `${basePath}/gallery` },
    { label: 'Reviews', href: `${basePath}/reviews` },
    { label: 'Leads', href: `${basePath}/leads` },
    { label: 'Business Info', href: `${basePath}/business-info` },
    { label: 'Notifications', href: `${basePath}/notifications` },
  ];

  const normalizeType = (t: string): string => {
    const lower = t.toLowerCase().replace(/[^a-z]/g, '');
    if (lower.includes('service')) return 'service';
    if (lower.includes('ecom') || lower.includes('commerce') || lower.includes('shop') || lower.includes('store')) return 'ecommerce';
    if (lower.includes('real') || lower.includes('estate') || lower.includes('property')) return 'realestate';
    if (lower.includes('general') || lower.includes('other')) return 'general';
    return '';
  };

  const resolved = businessType ? normalizeType(businessType) : '';
  const allowed = resolved && NAV_VISIBILITY[resolved] ? NAV_VISIBILITY[resolved] : null;
  const navItems = allowed ? allItems.filter(i => allowed.includes(i.label)) : allItems;

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-800">
        <nav className="flex gap-4 overflow-x-auto">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== basePath && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  isActive
                    ? 'border-purple-500 text-purple-400'
                    : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-600'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
      {children}
    </div>
  );
}
