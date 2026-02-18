'use client';

import { useState, useEffect, useCallback } from 'react';
import { Shield, Users, FolderOpen, RefreshCw, Save, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface UserProfile {
  id: string;
  display_name: string | null;
  plan: string;
  role: string;
  generation_credits: number;
  stripe_customer_id: string | null;
  created_at: string;
}

interface Project {
  id: string;
  user_id: string;
  name: string;
  slug: string | null;
  site_type: string;
  status: string;
  thumbnail_url: string | null;
  published_url: string | null;
  created_at: string;
  last_generated_at: string | null;
  user_display_name: string;
}

export default function AdminPage() {
  const [tab, setTab] = useState<'users' | 'projects'>('users');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [edits, setEdits] = useState<Record<string, Partial<UserProfile>>>({});

  const fetchUsers = useCallback(async () => {
    const res = await fetch('/api/admin/users');
    if (res.ok) { const data = await res.json(); setUsers(data.users || []); }
  }, []);

  const fetchProjects = useCallback(async () => {
    const res = await fetch('/api/admin/projects');
    if (res.ok) { const data = await res.json(); setProjects(data.projects || []); }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchUsers(), fetchProjects()]).finally(() => setLoading(false));
  }, [fetchUsers, fetchProjects]);

  const handleEditUser = (userId: string, field: string, value: string | number) => {
    setEdits(prev => ({ ...prev, [userId]: { ...prev[userId], [field]: value } }));
  };

  const handleSaveUser = async (userId: string) => {
    const updates = edits[userId];
    if (!updates) return;
    setSaving(userId);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...updates }),
      });
      if (res.ok) {
        await fetchUsers();
        setEdits(prev => { const n = { ...prev }; delete n[userId]; return n; });
      }
    } finally { setSaving(null); }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString();
  const tabCls = (active: boolean) => 'flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ' + (active ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground');
  const statusCls = (s: string) => 'rounded-full px-2 py-0.5 text-xs ' + (s === 'published' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200');

  if (loading) {
    return (<div className="flex items-center justify-center h-64"><RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" /></div>);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Admin Panel</h1>
          <p className="text-sm text-muted-foreground">Manage users and view all site generations</p>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{users.length}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Projects</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{projects.length}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Pro Users</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{users.filter(u => u.plan === 'pro').length}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Published Sites</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{projects.filter(p => p.published_url).length}</p></CardContent></Card>
      </div>
      <div className="flex gap-2 border-b">
        <button onClick={() => setTab('users')} className={tabCls(tab === 'users')}><Users className="h-4 w-4" /> Users ({users.length})</button>
        <button onClick={() => setTab('projects')} className={tabCls(tab === 'projects')}><FolderOpen className="h-4 w-4" /> Projects ({projects.length})</button>
      </div>
      {tab === 'users' && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left"><th className="pb-2 pr-4 font-medium">User</th><th className="pb-2 pr-4 font-medium">Plan</th><th className="pb-2 pr-4 font-medium">Credits</th><th className="pb-2 pr-4 font-medium">Role</th><th className="pb-2 pr-4 font-medium">Joined</th><th className="pb-2 font-medium">Actions</th></tr></thead>
            <tbody>{users.map(user => { const edit = edits[user.id] || {}; const hasEdits = Object.keys(edit).length > 0; return (<tr key={user.id} className="border-b"><td className="py-3 pr-4"><div className="font-medium">{user.display_name || '(no name)'}</div><div className="text-xs text-muted-foreground">{user.id.slice(0,8)}...</div></td><td className="py-3 pr-4"><select value={edit.plan ?? user.plan} onChange={e => handleEditUser(user.id,'plan',e.target.value)} className="rounded border px-2 py-1 text-sm bg-background"><option value="free">Free</option><option value="pro">Pro</option><option value="team">Team</option></select></td><td className="py-3 pr-4"><input type="number" value={edit.generation_credits ?? user.generation_credits} onChange={e => handleEditUser(user.id,'generation_credits',parseInt(e.target.value)||0)} className="w-20 rounded border px-2 py-1 text-sm bg-background" /></td><td className="py-3 pr-4"><select value={(edit.role as string) ?? user.role} onChange={e => handleEditUser(user.id,'role',e.target.value)} className="rounded border px-2 py-1 text-sm bg-background"><option value="user">User</option><option value="admin">Admin</option></select></td><td className="py-3 pr-4 text-muted-foreground">{formatDate(user.created_at)}</td><td className="py-3">{hasEdits ? (<Button size="sm" onClick={() => handleSaveUser(user.id)} disabled={saving === user.id}><Save className="h-3 w-3 mr-1" />{saving === user.id ? 'Saving...' : 'Save'}</Button>) : (<span className="text-xs text-muted-foreground">—</span>)}</td></tr>); })}</tbody>
          </table>
        </div>
      )}
      {tab === 'projects' && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left"><th className="pb-2 pr-4 font-medium">Project</th><th className="pb-2 pr-4 font-medium">Owner</th><th className="pb-2 pr-4 font-medium">Type</th><th className="pb-2 pr-4 font-medium">Status</th><th className="pb-2 pr-4 font-medium">Created</th><th className="pb-2 font-medium">Actions</th></tr></thead>
            <tbody>{projects.map(project => (<tr key={project.id} className="border-b"><td className="py-3 pr-4"><div className="font-medium">{project.name || 'Untitled'}</div><div className="text-xs text-muted-foreground">{project.id.slice(0,8)}...</div></td><td className="py-3 pr-4">{project.user_display_name}</td><td className="py-3 pr-4"><span className="rounded-full bg-muted px-2 py-0.5 text-xs">{project.site_type}</span></td><td className="py-3 pr-4"><span className={statusCls(project.status)}>{project.status}</span></td><td className="py-3 pr-4 text-muted-foreground">{formatDate(project.created_at)}</td><td className="py-3"><Button size="sm" variant="outline" onClick={() => window.open('/projects/' + project.id, '_blank')}><ExternalLink className="h-3 w-3 mr-1" /> View</Button></td></tr>))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}
