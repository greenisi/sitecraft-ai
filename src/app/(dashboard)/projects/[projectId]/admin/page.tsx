'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import OnboardingChecklist from '@/components/admin/OnboardingChecklist';

export default function AdminDashboard() {
        const params = useParams();
        const projectId = params.projectId as string;
        const [stats, setStats] = useState({ services: 0, products: 0, properties: 0, orders: 0 });
        const [project, setProject] = useState<any>(null);
        const [config, setConfig] = useState<any>(null);

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
                                      servRes.ok ? servRes.json() : { services: [] },
                                      prodRes.ok ? prodRes.json() : [],
                                      propRes.ok ? propRes.json() : [],
                                      ordRes.ok ? ordRes.json() : [],
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
                        if (proj?.generation_config) {
                                      setConfig(proj.generation_config);
                        }
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

  const biz = config?.business || {};
        const branding = config?.branding || {};
        const primaryColor = branding.primaryColor || branding.colors?.primary || '#9333ea';

  return (
            <div className="space-y-6">
                  {/* Project Identity Header */}
                  <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-6 relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: primaryColor }} />
                          <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                                <h1 className="text-2xl font-bold text-white truncate">
                                                      {project?.name || biz.name || 'Content Dashboard'}
                                                </h1>
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
                                          {biz.targetAudience && (
                                <p className="mt-1 text-xs text-gray-500">
                                                <span className="text-gray-600">Target:</span> {biz.targetAudience}
                                </p>
                                                )}
                                    </div>
                                    <div className="flex-shrink-0 ml-4 text-right">
                                                <span className="text-xs text-gray-500 block">Type</span>
                                                <span className="text-sm font-medium text-white">
                                                      {project?.business_type || config?.siteType || 'N/A'}
                                                </span>
                                          {branding.style && (
                                <>
                                                <span className="text-xs text-gray-500 block mt-2">Style</span>
                                                <span className="text-sm text-gray-300">{branding.style}</span>
                                </>
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
            
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {cards.map((card) => (
                            <Link
                                              key={card.label}
                                              href={card.href}
                                              className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-purple-500 transition-colors"
                                            >
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
