'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Clock, Pencil, Trash2, Sparkles, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/lib/hooks/use-user';
import { usePageTour } from '@/components/tour/use-page-tour';
import { toast } from 'sonner';

interface Project {
  id: string;
  name: string;
  description: string | null;
  site_type: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  thumbnail_url: string | null;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useUser();
  usePageTour('dashboard');

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [credits, setCredits] = useState(0);
  const [plan, setPlan] = useState('free');

  useEffect(() => {
    if (user) {
      const supabase = createClient();

      // Fetch profile
      supabase
        .from('profiles')
        .select('generation_credits, plan')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (data) {
            setCredits(data.generation_credits);
            setPlan(data.plan);
          }
        });

      // Fetch projects
      supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .then(({ data }) => {
          if (data) setProjects(data);
          setLoading(false);
        });
    }
  }, [user]);

  const handleNewProject = async () => {
    setCreating(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('projects')
        .insert({
          user_id: user!.id,
          name: 'Untitled Project',
          status: 'draft',
        })
        .select()
        .single();

      if (error) throw error;
      if (data) router.push(`/projects/${data.id}`);
    } catch (err) {
      toast.error('Failed to create project');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const supabase = createClient();
      await supabase.from('projects').delete().eq('id', id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
      toast.success('Project deleted');
    } catch {
      toast.error('Failed to delete project');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="pt-4 md:pt-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">My Projects</h1>
          <p className="text-sm text-gray-400 mt-1">
            Create and manage your AI-generated websites
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Credits */}
          <div className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-amber-400" style={{ background: 'rgba(245,158,11,0.1)' }}>
            <Sparkles className="h-3 w-3" />
            <span className="tabular-nums">{credits >= 999999 ? '\u221e' : credits}</span>
          </div>

          {/* Plan badge */}
          {plan !== 'free' && (
            <div className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium" style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa' }}>
              <Sparkles className="h-3 w-3" />
              {plan === 'pro' ? 'Pro' : 'Beta Pro'}
            </div>
          )}

          {/* New Project button */}
          <button
            onClick={handleNewProject}
            disabled={creating}
            className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}
          >
            {creating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            New Project
          </button>
        </div>
      </div>

      {/* Projects grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-400 text-lg mb-4">No projects yet</p>
          <button
            onClick={handleNewProject}
            className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}
          >
            <Plus className="h-4 w-4" />
            Create Your First Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((project) => (
            <div
              key={project.id}
              className="group rounded-2xl overflow-hidden transition-all hover:-translate-y-1"
              style={{ background: 'rgba(30,41,59,0.5)', border: '1px solid rgba(71,85,105,0.3)' }}
            >
              {/* Thumbnail */}
              <div
                className="aspect-[16/10] overflow-hidden cursor-pointer"
                style={{ background: 'rgba(15,23,42,0.6)' }}
                onClick={() => router.push(`/projects/${project.id}`)}
              >
                {project.thumbnail_url ? (
                  <img
                    src={project.thumbnail_url}
                    alt={project.name}
                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-3xl text-gray-600">
                      {project.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-4">
                <h3 className="font-semibold text-white text-sm truncate">{project.name}</h3>
                <p className="text-xs text-gray-500 mt-0.5 truncate">
                  {project.description || project.site_type || 'No description'}
                </p>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    {formatDate(project.updated_at || project.created_at)}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDelete(project.id)}
                      disabled={deletingId === project.id}
                      className="text-gray-500 hover:text-red-400 transition-colors"
                    >
                      {deletingId === project.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </button>
                    <button
                      onClick={() => router.push(`/projects/${project.id}`)}
                      className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 font-medium transition-colors"
                    >
                      <Pencil className="h-3 w-3" />
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
