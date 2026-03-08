'use client';

import { useState, useEffect, useCallback } from 'react';
import { Shield, Users, FolderOpen, RefreshCw, Save, ExternalLink, AlertCircle, MessageSquare, Inbox } from 'lucide-react';
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

interface Issue {
  id: string;
  user_id: string;
  project_id: string | null;
  category: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  projects: { name: string } | null;
  profiles: { display_name: string | null } | null;
}

interface Submission {
  id: string;
  project_id: string;
  project_name: string;
  form_type: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  message: string | null;
  service_needed: string | null;
  preferred_date: string | null;
  form_data: Record<string, any> | null;
  status: string;
  source_page: string | null;
  created_at: string;
}

export default function AdminPage() {
  const [tab, setTab] = useState<'users' | 'projects' | 'issues' | 'submissions'>('users');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [edits, setEdits] = useState<Record<string, Partial<UserProfile>>>({});
  const [issueEdits, setIssueEdits] = useState<Record<string, { status?: string; admin_notes?: string; priority?: string }>>({});
  const [expandedIssue, setExpandedIssue] = useState<string | null>(null);
  const [expandedSubmission, setExpandedSubmission] = useState<string | null>(null);
  const [subFilter, setSubFilter] = useState({ status: 'all', project: 'all', type: 'all' });

  const fetchUsers = useCallback(async () => {
    const res = await fetch('/api/admin/users');
    if (res.ok) { const data = await res.json(); setUsers(data.users || []); }
  }, []);

  const fetchProjects = useCallback(async () => {
    const res = await fetch('/api/admin/projects');
    if (res.ok) { const data = await res.json(); setProjects(data.projects || []); }
  }, []);

  const fetchIssues = useCallback(async () => {
    const res = await fetch('/api/admin/issues');
    if (res.ok) { const data = await res.json(); setIssues(data.issues || []); }
  }, []);

  const fetchSubmissions = useCallback(async () => {
    const res = await fetch('/api/admin/submissions');
    if (res.ok) { const data = await res.json(); setSubmissions(data.submissions || []); }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchUsers(), fetchProjects(), fetchIssues(), fetchSubmissions()]).finally(() => setLoading(false));
  }, [fetchUsers, fetchProjects, fetchIssues, fetchSubmissions]);

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

  const handleEditIssue = (issueId: string, field: string, value: string) => {
    setIssueEdits(prev => ({ ...prev, [issueId]: { ...prev[issueId], [field]: value } }));
  };

  const handleSaveIssue = async (issueId: string) => {
    const updates = issueEdits[issueId];
    if (!updates) return;
    setSaving(issueId);
    try {
      const res = await fetch('/api/admin/issues', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issueId, ...updates }),
      });
      if (res.ok) {
        await fetchIssues();
        setIssueEdits(prev => { const n = { ...prev }; delete n[issueId]; return n; });
      }
    } finally { setSaving(null); }
  };

  const handleSubmissionStatus = async (id: string, status: string) => {
    setSaving(id);
    try {
      const res = await fetch('/api/admin/submissions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) await fetchSubmissions();
    } finally { setSaving(null); }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString();
  const tabCls = (active: boolean) =>
    'flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ' +
    (active ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground');
  const statusCls = (s: string) =>
    'rounded-full px-2 py-0.5 text-xs ' +
    (s === 'published' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200');

  const issueStatusColor = (s: string) => {
    switch (s) {
      case 'open': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'resolved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'closed': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const priorityColor = (p: string) => {
    switch (p) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const openIssues = issues.filter(i => i.status === 'open').length;
  const inProgressIssues = issues.filter(i => i.status === 'in_progress').length;
  const newSubmissions = submissions.filter(s => s.status === 'new').length;

  const subStatusCls = (s: string) => {
    switch (s) {
      case 'new': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'read': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case 'replied': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'archived': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const formatFormType = (t: string) => {
    const labels: Record<string, string> = { contact: 'Contact', quote: 'Quote', appointment: 'Appointment', booking: 'Booking', inquiry: 'Inquiry', newsletter: 'Newsletter', service_request: 'Service Request', callback: 'Callback', estimate: 'Estimate' };
    return labels[t] || t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
  };

  // Filtered submissions
  const filteredSubs = submissions.filter(s => {
    if (subFilter.status !== 'all' && s.status !== subFilter.status) return false;
    if (subFilter.project !== 'all' && s.project_id !== subFilter.project) return false;
    if (subFilter.type !== 'all' && s.form_type !== subFilter.type) return false;
    return true;
  });

  // Unique projects and form types for filter dropdowns
  const uniqueProjects = [...new Map(submissions.map(s => [s.project_id, s.project_name])).entries()];
  const uniqueTypes = [...new Set(submissions.map(s => s.form_type))];

  if (loading) {
    return (<div className="flex items-center justify-center h-64"><RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" /></div>);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Admin Panel</h1>
          <p className="text-sm text-muted-foreground">Manage users, projects, and issue reports</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{users.length}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Projects</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{projects.length}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Pro Users</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{users.filter(u => u.plan === 'pro').length}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Published Sites</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{projects.filter(p => p.published_url).length}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Open Issues</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-orange-500">{openIssues}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Form Submissions</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{submissions.length}{newSubmissions > 0 && <span className="text-sm text-blue-500 ml-1">({newSubmissions} new)</span>}</p></CardContent></Card>
      </div>

      <div className="flex gap-2 border-b">
        <button onClick={() => setTab('users')} className={tabCls(tab === 'users')}><Users className="h-4 w-4" /> Users ({users.length})</button>
        <button onClick={() => setTab('projects')} className={tabCls(tab === 'projects')}><FolderOpen className="h-4 w-4" /> Projects ({projects.length})</button>
        <button onClick={() => setTab('issues')} className={tabCls(tab === 'issues')}><AlertCircle className="h-4 w-4" /> Issues ({issues.length}){openIssues > 0 && <span className="ml-1 rounded-full bg-orange-500 text-white text-xs px-1.5 py-0.5">{openIssues}</span>}</button>
        <button onClick={() => setTab('submissions')} className={tabCls(tab === 'submissions')}><Inbox className="h-4 w-4" /> Submissions ({submissions.length}){newSubmissions > 0 && <span className="ml-1 rounded-full bg-blue-500 text-white text-xs px-1.5 py-0.5">{newSubmissions}</span>}</button>
      </div>

      {tab === 'users' && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left"><th className="pb-2 pr-4 font-medium">User</th><th className="pb-2 pr-4 font-medium">Plan</th><th className="pb-2 pr-4 font-medium">Credits</th><th className="pb-2 pr-4 font-medium">Role</th><th className="pb-2 pr-4 font-medium">Joined</th><th className="pb-2 font-medium">Actions</th></tr></thead>
            <tbody>{users.map(user => {
              const edit = edits[user.id] || {};
              const hasEdits = Object.keys(edit).length > 0;
              return (<tr key={user.id} className="border-b"><td className="py-3 pr-4"><div className="font-medium">{user.display_name || '(no name)'}</div><div className="text-xs text-muted-foreground">{user.id.slice(0,8)}...</div></td><td className="py-3 pr-4"><select value={edit.plan ?? user.plan} onChange={e => handleEditUser(user.id,'plan',e.target.value)} className="rounded border px-2 py-1 text-sm bg-background"><option value="free">Free</option><option value="pro">Pro</option><option value="team">Team</option></select></td><td className="py-3 pr-4"><input type="number" value={edit.generation_credits ?? user.generation_credits} onChange={e => handleEditUser(user.id,'generation_credits',parseInt(e.target.value)||0)} className="w-20 rounded border px-2 py-1 text-sm bg-background" /></td><td className="py-3 pr-4"><select value={(edit.role as string) ?? user.role} onChange={e => handleEditUser(user.id,'role',e.target.value)} className="rounded border px-2 py-1 text-sm bg-background"><option value="user">User</option><option value="admin">Admin</option></select></td><td className="py-3 pr-4 text-muted-foreground">{formatDate(user.created_at)}</td><td className="py-3">{hasEdits ? (<Button size="sm" onClick={() => handleSaveUser(user.id)} disabled={saving === user.id}><Save className="h-3 w-3 mr-1" />{saving === user.id ? 'Saving...' : 'Save'}</Button>) : (<span className="text-xs text-muted-foreground">-</span>)}</td></tr>);
            })}</tbody>
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

      {tab === 'issues' && (
        <div className="space-y-3">
          {issues.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No issues reported yet</p>
            </div>
          ) : (
            issues.map(issue => {
              const edit = issueEdits[issue.id] || {};
              const hasEdits = Object.keys(edit).length > 0;
              const isExpanded = expandedIssue === issue.id;
              return (
                <div key={issue.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button onClick={() => setExpandedIssue(isExpanded ? null : issue.id)} className="font-medium text-sm text-left hover:underline">{issue.subject}</button>
                        <span className={`rounded-full px-2 py-0.5 text-xs ${issueStatusColor(edit.status ?? issue.status)}`}>{(edit.status ?? issue.status).replace('_', ' ')}</span>
                        <span className={`rounded-full px-2 py-0.5 text-xs ${priorityColor(edit.priority ?? issue.priority)}`}>{edit.priority ?? issue.priority}</span>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{issue.category}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span>By: {issue.profiles?.display_name || issue.user_id.slice(0, 8)}</span>
                        {issue.projects?.name && <span>Project: {issue.projects.name}</span>}
                        <span>{formatDate(issue.created_at)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <select value={edit.status ?? issue.status} onChange={e => handleEditIssue(issue.id, 'status', e.target.value)} className="rounded border px-2 py-1 text-xs bg-background">
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                      <select value={edit.priority ?? issue.priority} onChange={e => handleEditIssue(issue.id, 'priority', e.target.value)} className="rounded border px-2 py-1 text-xs bg-background">
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                      {hasEdits && (
                        <Button size="sm" onClick={() => handleSaveIssue(issue.id)} disabled={saving === issue.id}>
                          <Save className="h-3 w-3 mr-1" />{saving === issue.id ? '...' : 'Save'}
                        </Button>
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="space-y-3 pt-2 border-t">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Description</p>
                        <p className="text-sm whitespace-pre-wrap">{issue.description}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          <MessageSquare className="h-3 w-3 inline mr-1" />Admin Notes
                        </p>
                        <textarea
                          value={edit.admin_notes ?? issue.admin_notes ?? ''}
                          onChange={e => handleEditIssue(issue.id, 'admin_notes', e.target.value)}
                          placeholder="Add notes or a response to the user..."
                          className="w-full rounded border px-3 py-2 text-sm bg-background min-h-[80px] resize-y"
                        />
                        {(edit.admin_notes !== undefined && edit.admin_notes !== (issue.admin_notes ?? '')) && (
                          <Button size="sm" className="mt-2" onClick={() => handleSaveIssue(issue.id)} disabled={saving === issue.id}>
                            <Save className="h-3 w-3 mr-1" />{saving === issue.id ? 'Saving...' : 'Save Response'}
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {tab === 'submissions' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <select value={subFilter.status} onChange={e => setSubFilter(f => ({ ...f, status: e.target.value }))} className="rounded border px-3 py-1.5 text-sm bg-background">
              <option value="all">All Status</option>
              <option value="new">New</option>
              <option value="read">Read</option>
              <option value="replied">Replied</option>
              <option value="archived">Archived</option>
            </select>
            <select value={subFilter.project} onChange={e => setSubFilter(f => ({ ...f, project: e.target.value }))} className="rounded border px-3 py-1.5 text-sm bg-background">
              <option value="all">All Projects</option>
              {uniqueProjects.map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>
            <select value={subFilter.type} onChange={e => setSubFilter(f => ({ ...f, type: e.target.value }))} className="rounded border px-3 py-1.5 text-sm bg-background">
              <option value="all">All Types</option>
              {uniqueTypes.map(t => (
                <option key={t} value={t}>{formatFormType(t)}</option>
              ))}
            </select>
            <span className="text-sm text-muted-foreground self-center">{filteredSubs.length} results</span>
          </div>

          {filteredSubs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Inbox className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No form submissions found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredSubs.map(sub => {
                const isExpanded = expandedSubmission === sub.id;
                const hasImages = sub.form_data?.uploaded_images?.length > 0;
                return (
                  <div key={sub.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <button onClick={() => setExpandedSubmission(isExpanded ? null : sub.id)} className="font-medium text-sm text-left hover:underline">
                            {sub.name || sub.email || 'Anonymous'}
                          </button>
                          <span className={`rounded-full px-2 py-0.5 text-xs ${subStatusCls(sub.status)}`}>{sub.status}</span>
                          <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{formatFormType(sub.form_type)}</span>
                          {hasImages && (
                            <span className="rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 px-2 py-0.5 text-xs">
                              {sub.form_data!.uploaded_images.length} img
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="font-medium">{sub.project_name}</span>
                          {sub.email && <span>{sub.email}</span>}
                          <span>{timeAgo(sub.created_at)}</span>
                        </div>
                        {sub.message && !isExpanded && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{sub.message}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <select
                          value={sub.status}
                          onChange={e => handleSubmissionStatus(sub.id, e.target.value)}
                          disabled={saving === sub.id}
                          className="rounded border px-2 py-1 text-xs bg-background"
                        >
                          <option value="new">New</option>
                          <option value="read">Read</option>
                          <option value="replied">Replied</option>
                          <option value="archived">Archived</option>
                        </select>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="space-y-3 pt-3 border-t">
                        {/* Contact info */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {sub.email && (
                            <div className="bg-muted/50 rounded px-3 py-2">
                              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Email</div>
                              <a href={`mailto:${sub.email}`} className="text-sm text-blue-500 hover:underline">{sub.email}</a>
                            </div>
                          )}
                          {sub.phone && (
                            <div className="bg-muted/50 rounded px-3 py-2">
                              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Phone</div>
                              <span className="text-sm">{sub.phone}</span>
                            </div>
                          )}
                          {sub.service_needed && (
                            <div className="bg-muted/50 rounded px-3 py-2">
                              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Service</div>
                              <span className="text-sm">{sub.service_needed}</span>
                            </div>
                          )}
                          {sub.preferred_date && (
                            <div className="bg-muted/50 rounded px-3 py-2">
                              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Preferred Date</div>
                              <span className="text-sm">{sub.preferred_date}</span>
                            </div>
                          )}
                          {sub.source_page && (
                            <div className="bg-muted/50 rounded px-3 py-2">
                              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Source</div>
                              <span className="text-sm">{sub.source_page}</span>
                            </div>
                          )}
                        </div>

                        {/* Message */}
                        {sub.message && (
                          <div>
                            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Message</div>
                            <p className="text-sm whitespace-pre-wrap bg-muted/50 rounded p-3">{sub.message}</p>
                          </div>
                        )}

                        {/* Uploaded images */}
                        {hasImages && (
                          <div>
                            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Attachments ({sub.form_data!.uploaded_images.length})</div>
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                              {sub.form_data!.uploaded_images.map((url: string, i: number) => (
                                <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block aspect-square rounded-lg overflow-hidden border hover:border-primary transition-colors">
                                  <img src={url} alt={`Attachment ${i + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform" />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Extra form data */}
                        {sub.form_data && Object.entries(sub.form_data).filter(([k]) => k !== 'uploaded_images').length > 0 && (
                          <div>
                            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Additional Fields</div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {Object.entries(sub.form_data).filter(([k]) => k !== 'uploaded_images').map(([key, val]) => (
                                <div key={key} className="bg-muted/50 rounded px-3 py-2">
                                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">{key.replace(/_/g, ' ')}</div>
                                  <span className="text-sm">{String(val)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="text-xs text-muted-foreground">
                          Submitted: {new Date(sub.created_at).toLocaleString()} &middot; Project: {sub.project_name}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
