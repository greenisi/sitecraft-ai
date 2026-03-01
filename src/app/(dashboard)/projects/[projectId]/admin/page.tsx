'use client';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function AdminDashboard() {
    const params = useParams();
    const projectId = params.projectId as string;
    const [stats, setStats] = useState({ services: 0, products: 0, properties: 0, orders: 0 });
    const [project, setProject] = useState<any>(null);

  useEffect(() => {
        async function loadData() {
                const [servRes, prodRes, propRes, ordRes, projRes] = await Promise.all([
                          fetch('/api/projects/' + projectId + '/services'),
                          fetch('/api/projects/' + projectId + '/products'),
                          fetch('/api/projects/' + projectId + '/properties'),
                          fetch('/api/projects/' + projectId + '/orders'),
                          fetch('/api/projects/' + projectId),
                        ]);
                const [servData, products, properties, orders, proj] = await Promise.all([
                          servRes.ok ? servRes.json() : { services: [] }, prodRes.ok ? prodRes.json() : [],
                          propRes.ok ? propRes.json() : [], ordRes.ok ? ordRes.json() : [],
                          projRes.ok ? projRes.json() : null,
                        ]);
                const services = servData.services || [];
                setStats({
                          services: Array.isArray(services) ? services.length : 0,
                          products: Array.isArray(products) ? products.length : 0,
                          properties: Array.isArray(properties) ? properties.length : 0,
                          orders: Array.isArray(orders) ? orders.length : 0,
                });
                setProject(proj);
        }
        loadData();
  }, [projectId]);

  const basePath = '/projects/' + projectId + '/admin';
    const cards = [
      { label: 'Services', count: stats.services, href: basePath + '/services', color: 'bg-blue-600' },
      { label: 'Products', count: stats.products, href: basePath + '/products', color: 'bg-green-600' },
      { label: 'Properties', count: stats.properties, href: basePath + '/properties', color: 'bg-yellow-600' },
      { label: 'Orders', count: stats.orders, href: basePath + '/orders', color: 'bg-purple-600' },
        ];

  return (
        <div className="space-y-6">
              <div className="flex items-center justify-between">
                      <h1 className="text-2xl font-bold text-white">Content Dashboard</h1>
                      <span className="text-sm text-gray-400">
                                Business Type: {project?.business_type || project?.site_type || 'Not set'}
                      </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {cards.map((card) => (
                    <Link key={card.label} href={card.href}
                                  className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-purple-500 transition-colors">
                                <div className={'inline-block px-2 py-1 rounded text-xs font-medium text-white ' + card.color + ' mb-3'}>
                                  {card.label}
                                </div>
                                <div className="text-3xl font-bold text-white">{card.count}</div>
                                <div className="text-sm text-gray-400 mt-1">Total {card.label.toLowerCase()}</div>
                    </Link>
                  ))}
              </div>
        </div>
      );
}
