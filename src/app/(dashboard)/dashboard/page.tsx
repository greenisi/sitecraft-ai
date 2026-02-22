'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Clock, Pencil, Trash2, Sparkles, Loader2, X } from 'lucide-react';
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

  // New Project Modal state
  const [showModal, setShowModal] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');

  useEffect(() => {
    if (user) {
      const supabase = createClient();
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

  const openNewProjectModal = () => {
    setProjectName('');
    setProjectDescription('');
    setShowModal(true);
  };

  const handleCreateProject = async () => {
    if (!projectName.trim()) {
      toast.error('Please enter a project name');
      return;
    }
    setCreating(true);
    try {
      const supabase = createClient();
      const slug = projectName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now().toString(36);
      const { data, error } = await supabase
        .from('projects')
        .insert({
          user_id: user!.id,
          name: projectName.trim(),
          slug,
          site_type: 'business',
          status: 'draft',
        })
        .select()
        .single();

      if (error) throw error;
      setShowModal(false);
      if (data) {
        const params = new URLSearchParams();
        if (projectDescription.trim()) params.set('desc', projectDescription.trim());
        const qs = params.toString();
        router.push(`/projects/${data.id}${qs ? '?' + qs : ''}`);
      }
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
          <div className="hidden sm:flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-amber-400"
            style={{ background: 'rgba(245,158,11,0.1)' }}>
            <Sparkles className="h-3 w-3" />
            <span className="tabular-nums">{credits >= 999999 ? '\u221e' : credits}</span>
          </div>
          {plan !== 'free' && (
            <div className="hidden sm:flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium"
              style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa' }}>
              <Sparkles className="h-3 w-3" />
              {plan === 'pro' ? 'Pro' : 'Beta Pro'}
            </div>
          )}
          <button
            onClick={openNewProjectModal}
            className="flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all w-full sm:w-auto"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}
          >
            <Plus className="h-4 w-4" />
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
            onClick={openNewProjectModal}
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

      {/* New Project Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-md rounded-2xl p-6"
            style={{ background: 'linear-gradient(135deg, #1e293b, #0f172a)', border: '1px solid rgba(139,92,246,0.2)' }}>
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}>
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">New Project</h2>
                <p className="text-xs text-gray-400">Tell us about your website</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Project Name *</label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g. My Coffee Shop Website"
                  className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-violet-500/50"
                  style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(71,85,105,0.4)' }}
                  autoFocus
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) handleCreateProject(); }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Description</label>
                <textarea
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  placeholder="Briefly describe what your business does and what you want the website to include..."
                  rows={3}
                  className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-violet-500/50 resize-none"
                  style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(71,85,105,0.4)' }}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-400 transition-colors hover:text-white"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateProject}
                disabled={creating || !projectName.trim()}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}
              >
                {creating ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Creating...</>
                ) : (
                  <><Sparkles className="h-4 w-4" /> Create Project</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
