'use client';

import Link from 'next/link';
import { formatDistanceToNow } from '@/lib/utils/date';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Pencil, Trash2, ExternalLink, Globe, ArrowUpRight } from 'lucide-react';
import { SITE_TYPE_LABELS } from '@/lib/utils/constants';
import type { Project } from '@/types/project';

const STATUS_CONFIG: Record<string, { variant: 'default' | 'secondary' | 'success' | 'warning' | 'destructive'; dot: string }> = {
  draft: { variant: 'secondary', dot: 'bg-gray-400' },
  generating: { variant: 'warning', dot: 'bg-amber-400 animate-pulse' },
  generated: { variant: 'success', dot: 'bg-emerald-400' },
  deployed: { variant: 'success', dot: 'bg-emerald-400' },
  published: { variant: 'default', dot: 'bg-violet-400' },
  error: { variant: 'destructive', dot: 'bg-red-400' },
};

interface ProjectCardProps {
  project: Project;
  onDelete: (id: string) => void;
}

export function ProjectCard({ project, onDelete }: ProjectCardProps) {
  const statusConfig = STATUS_CONFIG[project.status] || STATUS_CONFIG.draft;

  return (
    <Card className="group relative flex flex-col overflow-hidden border-border/50 transition-all duration-300 hover:border-violet-500/20 hover:shadow-xl hover:shadow-violet-500/5 hover:-translate-y-0.5">
      {/* Thumbnail */}
      <div className="relative aspect-video bg-muted overflow-hidden">
        {project.thumbnail_url ? (
          <img
            src={project.thumbnail_url}
            alt={project.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-muted/50">
            <Globe className="h-8 w-8 text-muted-foreground/30" />
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all duration-200 group-hover:bg-black/30">
          <Link
            href={`/projects/${project.id}`}
            className="flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-medium text-gray-900 opacity-0 transition-all duration-200 hover:bg-white/90 group-hover:opacity-100 group-hover:scale-100 scale-95"
          >
            Open Project
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Status badge */}
        <div className="absolute top-3 left-3">
          <Badge variant={statusConfig.variant} className="gap-1.5 text-[10px] font-semibold uppercase tracking-wide shadow-sm">
            <span className={`h-1.5 w-1.5 rounded-full ${statusConfig.dot}`} />
            {project.status}
          </Badge>
        </div>

        {/* Actions dropdown */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 bg-black/30 text-white hover:bg-black/50 hover:text-white backdrop-blur-sm rounded-lg"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/projects/${project.id}`}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </DropdownMenuItem>
              {(project.published_url || project.vercel_deployment_url) && (
                <DropdownMenuItem asChild>
                  <a
                    href={project.published_url || project.vercel_deployment_url!}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View live
                  </a>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDelete(project.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Card body */}
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <Link
            href={`/projects/${project.id}`}
            className="text-sm font-semibold hover:text-violet-600 dark:hover:text-violet-400 transition-colors line-clamp-1"
          >
            {project.name}
          </Link>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          {SITE_TYPE_LABELS[project.site_type]}
        </p>
        <p className="text-[11px] text-muted-foreground/60 mt-auto">
          {formatDistanceToNow(project.updated_at)}
        </p>
      </div>
    </Card>
  );
}
