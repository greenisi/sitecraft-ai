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
import { MoreHorizontal, Pencil, Trash2, ExternalLink, Globe } from 'lucide-react';
import { SITE_TYPE_LABELS } from '@/lib/utils/constants';
import type { Project } from '@/types/project';

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'destructive'> = {
  draft: 'secondary',
  generating: 'warning',
  generated: 'success',
  deployed: 'success',
  error: 'destructive',
};

interface ProjectCardProps {
  project: Project;
  onDelete: (id: string) => void;
}

export function ProjectCard({ project, onDelete }: ProjectCardProps) {
  return (
    <Card className="group relative flex flex-col transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <Link
              href={`/projects/${project.id}`}
              className="text-lg font-semibold hover:underline"
            >
              {project.name}
            </Link>
            <p className="text-sm text-muted-foreground">
              {SITE_TYPE_LABELS[project.site_type]}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
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
              {project.vercel_deployment_url && (
                <DropdownMenuItem asChild>
                  <a
                    href={project.vercel_deployment_url}
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
                className="text-destructive"
                onClick={() => onDelete(project.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="flex-1">
        <div className="aspect-video rounded-md bg-muted flex items-center justify-center overflow-hidden">
          {project.thumbnail_url ? (
            <img
              src={project.thumbnail_url}
              alt={project.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <Globe className="h-8 w-8 text-muted-foreground/50" />
          )}
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between pt-0">
        <Badge variant={STATUS_VARIANTS[project.status] || 'secondary'}>
          {project.status}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {formatDistanceToNow(project.updated_at)}
        </span>
      </CardFooter>
    </Card>
  );
}
