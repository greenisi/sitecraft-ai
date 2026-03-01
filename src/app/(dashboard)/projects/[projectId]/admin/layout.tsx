'use client';

import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const params = useParams();
    const pathname = usePathname();
    const projectId = params.projectId as string;
    const basePath = `/projects/${projectId}/admin`;

  const navItems = [
    { label: 'Dashboard', href: basePath },
    { label: 'Setup', href: `${basePath}/setup` },
    { label: 'Services', href: `${basePath}/services` },
    { label: 'Products', href: `${basePath}/products` },
    { label: 'Properties', href: `${basePath}/properties` },
    { label: 'Orders', href: `${basePath}/orders` },
      ];

  return (
        <div className="space-y-6">
              <div className="border-b border-gray-800">
                      <nav className="flex gap-4 overflow-x-auto">
                        {navItems.map((item) => {
                      const isActive = pathname === item.href || (item.href !== basePath && pathname.startsWith(item.href));
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
                                      </Link>Link>
                                    );
        })}
                      </nav>nav>
              </div>div>
          {children}
        </div>div>
      );
}</div>
