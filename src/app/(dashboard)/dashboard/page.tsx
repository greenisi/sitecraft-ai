'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Loader2, FolderOpen, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ProjectCard } from '@/components/dashboard/project-card';
import { useProjects, useCreateProject, useDeleteProject } from '@/lib/hooks/use-projects';

export default function DashboardPage() {
  const router = useRouter();
  const { data: projects, isLoading } = useProjects();
  const createProject = useCreateProject();
  const deleteProject = useDeleteProject();
  const [isCreating, setIsCreating] = useState(false);

  const handleNewProject = async () => {
    if (isCreating) return;
    setIsCreating(true);
    try {
      const project = await createProject.mutateAsync({
        name: 'Untitled Project',
        siteType: 'landing-page',
      });
      router.push(`/projects/${project.id}`);
    } catch {
      setIsCreating(false);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this project?')) {
      deleteProject.mutate(id);
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in">
      {/* Welcome header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground mt-1 hidden sm:block">
            Create and manage your AI-generated websites
          </p>
        </div>
        <Button
          onClick={handleNewProject}
          disabled={isCreating}
          className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white border-0 shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 transition-all h-10 px-5"
        >
          {isCreating ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Plus className="h-4 w-4 mr-2" />
          )}
          New Project
        </Button>
      </div>

      {/* Quick actions for empty state */}
      {!isLoading && (!projects || projects.length === 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in-up">
          <button
            onClick={handleNewProject}
            disabled={isCreating}
            className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card p-6 text-left transition-all duration-300 hover:border-violet-500/30 hover:shadow-xl hover:shadow-violet-500/5 hover:-translate-y-0.5"
          >
            <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-gradient-to-br from-violet-500/10 to-purple-500/10 blur-2xl transition-all group-hover:scale-150" />
            <div className="relative">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10">
                <Plus className="h-5 w-5 text-violet-500" />
              </div>
              <h3 className="font-semibold mb-1">Start from Scratch</h3>
              <p className="text-sm text-muted-foreground">
                Describe your website and let AI build it
              </p>
            </div>
          </button>

          <button
            onClick={() => router.push('/templates')}
            className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card p-6 text-left transition-all duration-300 hover:border-violet-500/30 hover:shadow-xl hover:shadow-violet-500/5 hover:-translate-y-0.5"
          >
            <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-gradient-to-br from-purple-500/10 to-pink-500/10 blur-2xl transition-all group-hover:scale-150" />
            <div className="relative">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10">
                <Sparkles className="h-5 w-5 text-purple-500" />
              </div>
              <h3 className="font-semibold mb-1">Use a Template</h3>
              <p className="text-sm text-muted-foreground">
                Start with a professionally designed template
              </p>
            </div>
          </button>
        </div>
      )}

      {/* Projects grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="pb-3">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="aspect-video w-full rounded-lg" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : projects && projects.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project, i) => (
            <div
              key={project.id}
              className="animate-fade-in-up"
              style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'backwards' }}
            >
              <ProjectCard project={project} onDelete={handleDelete} />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
