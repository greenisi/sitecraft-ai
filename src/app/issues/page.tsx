'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/lib/hooks/use-user';
import { useRouter } from 'next/navigation';
import { AlertCircle, Send, CheckCircle, Clock, ArrowLeft, Bug, Lightbulb, CreditCard, Globe, Cpu, Upload, ChevronDown } from 'lucide-react';

const CATEGORIES = [
  { value: 'bug', label: 'Bug Report', icon: Bug, color: '#ef4444' },
  { value: 'feature', label: 'Feature Request', icon: Lightbulb, color: '#f59e0b' },
  { value: 'billing', label: 'Billing Issue', icon: CreditCard, color: '#10b981' },
  { value: 'domain', label: 'Domain Issue', icon: Globe, color: '#3b82f6' },
  { value: 'generation', label: 'Generation Problem', icon: Cpu, color: '#8b5cf6' },
  { value: 'publishing', label: 'Publishing Issue', icon: Upload, color: '#ec4899' },
  { value: 'other', label: 'Other', icon: AlertCircle, color: '#6b7280' },
];

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  open: { bg: 'rgba(59,130,246,0.15)', text: '#60a5fa', label: 'Open' },
  in_progress: { bg: 'rgba(245,158,11,0.15)', text: '#fbbf24', label: 'In Progress' },
  resolved: { bg: 'rgba(16,185,129,0.15)', text: '#34d399', label: 'Resolved' },
  closed: { bg: 'rgba(107,114,128,0.15)', text: '#9ca3af', label: 'Closed' },
};

export default function IssuesPage() {
  const user = useUser();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'report' | 'history'>('report');
  const [category, setCategory] = useState('bug');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState('');
  const [projects, setProjects] = useState<any[]>([]);
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingIssues, setLoadingIssues] = useState(false);

  useEffect(() => {
    if (!user) return;
    // Load user projects
    const supabase = createClient();
    supabase
      .from('projects')
      .select('id, name, status')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setProjects(data);
      });
  }, [user]);

  useEffect(() => {
    if (activeTab === 'history') {
      loadIssues();
    }
  }, [activeTab]);

  const loadIssues = async () => {
    setLoadingIssues(true);
    try {
      const resp = await fetch('/api/issues');
      const data = await resp.json();
      if (data.issues) setIssues(data.issues);
    } catch (err) {
      console.error('Failed to load issues:', err);
    } finally {
      setLoadingIssues(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      setError('Please fill in both subject and description');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch('/api/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          subject: subject.trim(),
          description: description.trim(),
          project_id: projectId || null,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Failed to submit issue');
      setSuccess(true);
      setSubject('');
      setDescription('');
      setProjectId('');
      setCategory('bug');
      setTimeout(() => setSuccess(false), 4000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const selectedCategory = CATEGORIES.find(c => c.value === category);

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0a0e1a 0%, #111827 50%, #0a0e1a 100%)' }}>
        <p style={{ color: '#9ca3af' }}>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a0e1a 0%, #111827 30%, #0f172a 60%, #0a0e1a 100%)' }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '16px 24px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => router.push('/dashboard')}
            style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: '#9ca3af', display: 'flex' }}
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 style={{ color: 'white', fontSize: '20px', fontWeight: 600, margin: 0 }}>Report an Issue</h1>
            <p style={{ color: '#6b7280', fontSize: '13px', margin: '2px 0 0' }}>Let us know about any problems or suggestions</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px 24px 0' }}>
        <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '4px', marginBottom: '24px' }}>
          <button
            onClick={() => { setActiveTab('report'); setError(null); }}
            style={{
              flex: 1, padding: '10px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 500, transition: 'all 0.2s',
              background: activeTab === 'report' ? 'rgba(139,92,246,0.2)' : 'transparent',
              color: activeTab === 'report' ? '#c4b5fd' : '#6b7280',
            }}
          >
            <Send size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
            Submit Report
          </button>
          <button
            onClick={() => { setActiveTab('history'); setError(null); }}
            style={{
              flex: 1, padding: '10px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 500, transition: 'all 0.2s',
              background: activeTab === 'history' ? 'rgba(139,92,246,0.2)' : 'transparent',
              color: activeTab === 'history' ? '#c4b5fd' : '#6b7280',
            }}
          >
            <Clock size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
            My Reports
          </button>
        </div>

        {/* Success message */}
        {success && (
          <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '12px', padding: '16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CheckCircle size={18} style={{ color: '#34d399' }} />
            <p style={{ color: '#34d399', fontSize: '14px', margin: 0 }}>Issue reported successfully! Our team will review it shortly.</p>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '12px', padding: '16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertCircle size={18} style={{ color: '#f87171' }} />
            <p style={{ color: '#f87171', fontSize: '14px', margin: 0 }}>{error}</p>
          </div>
        )}

        {/* ===== REPORT TAB ===== */}
        {activeTab === 'report' && (
          <form onSubmit={handleSubmit}>
            {/* Category selector */}
            <label style={{ display: 'block', color: '#9ca3af', fontSize: '13px', fontWeight: 500, marginBottom: '8px' }}>
              Category
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '8px', marginBottom: '20px' }}>
              {CATEGORIES.map(cat => {
                const Icon = cat.icon;
                const isSelected = category === cat.value;
                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setCategory(cat.value)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: 500, transition: 'all 0.2s',
                      background: isSelected ? `${cat.color}20` : 'rgba(255,255,255,0.03)',
                      border: isSelected ? `1px solid ${cat.color}50` : '1px solid rgba(255,255,255,0.06)',
                      color: isSelected ? cat.color : '#9ca3af',
                    }}
                  >
                    <Icon size={15} />
                    {cat.label}
                  </button>
                );
              })}
            </div>

            {/* Related project (optional) */}
            <label style={{ display: 'block', color: '#9ca3af', fontSize: '13px', fontWeight: 500, marginBottom: '8px' }}>
              Related Project (optional)
            </label>
            <div style={{ position: 'relative', marginBottom: '20px' }}>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: '10px', fontSize: '14px', appearance: 'none', cursor: 'pointer',
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'white',
                }}
              >
                <option value="">None</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name} {p.status === 'published' ? '(Published)' : ''}</option>
                ))}
              </select>
              <ChevronDown size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280', pointerEvents: 'none' }} />
            </div>

            {/* Subject */}
            <label style={{ display: 'block', color: '#9ca3af', fontSize: '13px', fontWeight: 500, marginBottom: '8px' }}>
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief description of the issue..."
              style={{
                width: '100%', padding: '10px 14px', borderRadius: '10px', fontSize: '14px', marginBottom: '20px',
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', outline: 'none',
              }}
            />

            {/* Description */}
            <label style={{ display: 'block', color: '#9ca3af', fontSize: '13px', fontWeight: 500, marginBottom: '8px' }}>
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please describe the issue in detail. Include steps to reproduce if applicable..."
              rows={6}
              style={{
                width: '100%', padding: '12px 14px', borderRadius: '10px', fontSize: '14px', marginBottom: '24px', resize: 'vertical',
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', outline: 'none', fontFamily: 'inherit',
              }}
            />

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading || !subject.trim() || !description.trim()}
              style={{
                width: '100%', padding: '14px', borderRadius: '12px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '15px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s',
                background: loading || !subject.trim() || !description.trim() ? 'rgba(139,92,246,0.2)' : 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                color: loading || !subject.trim() || !description.trim() ? '#6b7280' : 'white',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? (
                <>
                  <div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                  Submitting...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Submit Report
                </>
              )}
            </button>
          </form>
        )}

        {/* ===== HISTORY TAB ===== */}
        {activeTab === 'history' && (
          <div>
            {loadingIssues ? (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ width: '24px', height: '24px', border: '2px solid rgba(139,92,246,0.3)', borderTopColor: '#8b5cf6', borderRadius: '50%', animation: 'spin 0.6s linear infinite', margin: '0 auto 12px' }} />
                <p style={{ color: '#6b7280', fontSize: '14px' }}>Loading your reports...</p>
              </div>
            ) : issues.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <AlertCircle size={40} style={{ color: '#374151', margin: '0 auto 12px' }} />
                <p style={{ color: '#6b7280', fontSize: '15px', fontWeight: 500 }}>No reports yet</p>
                <p style={{ color: '#4b5563', fontSize: '13px', marginTop: '4px' }}>Submit a report and it will appear here</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {issues.map((issue: any) => {
                  const cat = CATEGORIES.find(c => c.value === issue.category);
                  const status = STATUS_COLORS[issue.status] || STATUS_COLORS.open;
                  const CatIcon = cat?.icon || AlertCircle;
                  return (
                    <div
                      key={issue.id}
                      style={{
                        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '16px', transition: 'all 0.2s',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                          <CatIcon size={16} style={{ color: cat?.color || '#6b7280', flexShrink: 0 }} />
                          <h3 style={{ color: 'white', fontSize: '14px', fontWeight: 600, margin: 0 }}>{issue.subject}</h3>
                        </div>
                        <span style={{ background: status.bg, color: status.text, fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '20px', whiteSpace: 'nowrap' }}>
                          {status.label}
                        </span>
                      </div>
                      <p style={{ color: '#9ca3af', fontSize: '13px', margin: '0 0 10px', lineHeight: '1.5', paddingLeft: '26px' }}>
                        {issue.description.length > 200 ? issue.description.substring(0, 200) + '...' : issue.description}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingLeft: '26px' }}>
                        <span style={{ color: '#4b5563', fontSize: '12px' }}>
                          {new Date(issue.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        {issue.projects?.name && (
                          <span style={{ color: '#4b5563', fontSize: '12px' }}>
                            Project: {issue.projects.name}
                          </span>
                        )}
                      </div>
                      {issue.admin_notes && (
                        <div style={{ marginTop: '12px', paddingLeft: '26px' }}>
                          <div style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '8px', padding: '10px 14px' }}>
                            <p style={{ color: '#a78bfa', fontSize: '11px', fontWeight: 600, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Team Response</p>
                            <p style={{ color: '#c4b5fd', fontSize: '13px', margin: 0, lineHeight: '1.5' }}>{issue.admin_notes}</p>
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

        <div style={{ height: '40px' }} />
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        select option {
          background: #1a1a2e;
          color: white;
        }
      `}</style>
    </div>
  );
}
