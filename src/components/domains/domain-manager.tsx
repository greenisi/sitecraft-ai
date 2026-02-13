'use client';

import { useState } from 'react';
import { Globe, ExternalLink, ShoppingCart, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DomainSearch } from './domain-search';
import { DomainConnect } from './domain-connect';
import type { Project } from '@/types/project';

interface DomainManagerProps {
  project: Project;
  defaultTab?: string;
  defaultAction?: string;
}

export function DomainManager({ project, defaultTab, defaultAction }: DomainManagerProps) {
  const [activeTab, setActiveTab] = useState(defaultAction || defaultTab || 'overview');

  const platformDomain = 'innovated.site';
  const tempDomain = project.slug ? `${project.slug}.${platformDomain}` : null;

  return (
    <div className="space-y-6">
      {/* Current domains overview */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium">Current Domains</h3>

        {/* Temporary domain */}
        {project.published_url && (
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center gap-3 min-w-0">
              <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">
                  {tempDomain || project.published_url.replace('https://', '')}
                </p>
                <p className="text-xs text-muted-foreground">Temporary subdomain</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="success" className="text-[10px]">Active</Badge>
              <a
                href={project.published_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        )}

        {/* Custom domain */}
        {project.custom_domain && (
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center gap-3 min-w-0">
              <Globe className="h-4 w-4 text-primary flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{project.custom_domain}</p>
                <p className="text-xs text-muted-foreground">Custom domain</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="default" className="text-[10px]">Custom</Badge>
              <a
                href={`https://${project.custom_domain}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        )}

        {!project.published_url && !project.custom_domain && (
          <div className="text-center py-6 text-sm text-muted-foreground border rounded-lg">
            <Globe className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
            <p>No domains configured yet.</p>
            <p className="text-xs mt-1">Publish your site to get a temporary domain.</p>
          </div>
        )}
      </div>

      {/* Domain actions */}
      {project.published_url && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="search" className="text-xs">
              <ShoppingCart className="h-3 w-3 mr-1.5" />
              Buy Domain
            </TabsTrigger>
            <TabsTrigger value="connect" className="text-xs">
              <Link2 className="h-3 w-3 mr-1.5" />
              Connect Domain
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="mt-4">
            <DomainSearch
              projectId={project.id}
              onPurchased={() => {
                // Could refresh project data here
              }}
            />
          </TabsContent>

          <TabsContent value="connect" className="mt-4">
            <DomainConnect
              projectId={project.id}
              onConnected={() => {
                // Could refresh project data here
              }}
            />
          </TabsContent>

          <TabsContent value="overview" className="mt-4">
            <div className="grid gap-3">
              <button
                onClick={() => setActiveTab('search')}
                className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors text-left"
              >
                <ShoppingCart className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Buy a New Domain</p>
                  <p className="text-xs text-muted-foreground">
                    Search and register a domain name for your site
                  </p>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('connect')}
                className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors text-left"
              >
                <Link2 className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Connect Your Domain</p>
                  <p className="text-xs text-muted-foreground">
                    Use a domain you already own with your site
                  </p>
                </div>
              </button>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
