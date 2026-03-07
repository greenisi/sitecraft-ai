'use client';
import { useParams } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';

interface Submission {
  id: string;
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

const STATUS_OPTIONS = ['new', 'read', 'replied', 'archived'] as const;

const statusColors: Record<string, string> = {
  new: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  read: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  replied: 'bg-green-500/20 text-green-400 border-green-500/30',
  archived: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
};

function formatFormType(type: string): string {
  const labels: Record<string, string> = {
    contact: 'Contact Form',
    quote: 'Quote Request',
    appointment: 'Appointment',
    booking: 'Booking',
    inquiry: 'Inquiry',
    consultation: 'Consultation',
    newsletter: 'Newsletter',
    property_inquiry: 'Property Inquiry',
    service_request: 'Service Request',
    callback: 'Callback Request',
    estimate: 'Free Estimate',
  };
  return labels[type] || type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function formatKey(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function LeadsPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selected, setSelected] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSubmissions = useCallback(async () => {
    const url = statusFilter === 'all'
      ? `/api/projects/${projectId}/form-submissions`
      : `/api/projects/${projectId}/form-submissions?status=${statusFilter}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      setSubmissions(data.submissions || []);
    }
    setLoading(false);
  }, [projectId, statusFilter]);

  useEffect(() => { loadSubmissions(); }, [loadSubmissions]);

  async function updateStatus(id: string, status: string) {
    const res = await fetch(`/api/projects/${projectId}/form-submissions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      toast.success(`Marked as ${status}`);
      loadSubmissions();
      if (selected?.id === id) {
        setSelected({ ...selected, status });
      }
    } else {
      toast.error('Failed to update status');
    }
  }

  const newCount = submissions.filter(s => s.status === 'new').length;

  // Group by form_type for the summary
  const typeCounts: Record<string, number> = {};
  for (const s of submissions) {
    const t = s.form_type || 'general';
    typeCounts[t] = (typeCounts[t] || 0) + 1;
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-white">Form Submissions</h1>
        <div className="text-gray-400">Loading submissions...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Form Submissions</h1>
          <p className="text-sm text-gray-400 mt-1">
            {submissions.length} total{newCount > 0 && <> &middot; <span className="text-blue-400">{newCount} new</span></>}
          </p>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
        >
          <option value="all">All Status</option>
          {STATUS_OPTIONS.map(s => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>

      {/* Type summary badges */}
      {Object.keys(typeCounts).length > 1 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(typeCounts).map(([type, count]) => (
            <span key={type} className="text-xs bg-gray-800 text-gray-300 px-2.5 py-1 rounded-full">
              {formatFormType(type)} ({count})
            </span>
          ))}
        </div>
      )}

      {/* Content */}
      {submissions.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center text-gray-500">
          <p className="mb-2">No form submissions yet.</p>
          <p className="text-sm">They will appear here once visitors submit contact forms, booking requests, or any other forms on your website.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* List */}
          <div className="lg:col-span-2 space-y-2 max-h-[70vh] overflow-y-auto">
            {submissions.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelected(s)}
                className={`w-full text-left bg-gray-900 border rounded-lg p-4 transition-colors ${
                  selected?.id === s.id
                    ? 'border-purple-500 bg-purple-500/5'
                    : 'border-gray-800 hover:border-gray-700'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium text-white truncate">
                    {s.name || s.email || 'Anonymous'}
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border whitespace-nowrap ${statusColors[s.status] || 'bg-gray-700 text-gray-300 border-gray-600'}`}>
                    {s.status}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-500">{formatFormType(s.form_type)}</span>
                  <span className="text-gray-700">&middot;</span>
                  <span className="text-xs text-gray-500">{timeAgo(s.created_at)}</span>
                </div>
                {s.message && (
                  <p className="text-xs text-gray-400 mt-1.5 line-clamp-2">{s.message}</p>
                )}
              </button>
            ))}
          </div>

          {/* Detail Panel */}
          <div className="lg:col-span-3">
            {selected ? (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5 sticky top-4">
                {/* Header */}
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-xl font-semibold text-white">
                      {selected.name || 'Anonymous'}
                    </h2>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColors[selected.status] || 'bg-gray-700 text-gray-300 border-gray-600'}`}>
                      {selected.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">
                    {formatFormType(selected.form_type)} &middot; {new Date(selected.created_at).toLocaleString()}
                  </p>
                </div>

                {/* Contact Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selected.email && (
                    <div className="bg-gray-800/50 rounded-lg px-4 py-3">
                      <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Email</div>
                      <a href={`mailto:${selected.email}`} className="text-sm text-blue-400 hover:underline">{selected.email}</a>
                    </div>
                  )}
                  {selected.phone && (
                    <div className="bg-gray-800/50 rounded-lg px-4 py-3">
                      <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Phone</div>
                      <a href={`tel:${selected.phone}`} className="text-sm text-white">{selected.phone}</a>
                    </div>
                  )}
                  {selected.service_needed && (
                    <div className="bg-gray-800/50 rounded-lg px-4 py-3">
                      <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Service Needed</div>
                      <div className="text-sm text-white">{selected.service_needed}</div>
                    </div>
                  )}
                  {selected.preferred_date && (
                    <div className="bg-gray-800/50 rounded-lg px-4 py-3">
                      <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Preferred Date</div>
                      <div className="text-sm text-white">{selected.preferred_date}</div>
                    </div>
                  )}
                </div>

                {/* Message */}
                {selected.message && (
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">Message</div>
                    <div className="bg-gray-800/50 rounded-lg p-4 text-sm text-gray-200 whitespace-pre-wrap">
                      {selected.message}
                    </div>
                  </div>
                )}

                {/* Extra form data */}
                {selected.form_data && Object.keys(selected.form_data).length > 0 && (
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">Additional Fields</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {Object.entries(selected.form_data).map(([key, val]) => (
                        <div key={key} className="bg-gray-800/50 rounded-lg px-4 py-3">
                          <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">{formatKey(key)}</div>
                          <div className="text-sm text-white">{String(val)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Source page */}
                {selected.source_page && (
                  <div className="text-xs text-gray-500">
                    Submitted from: <span className="text-gray-400">{selected.source_page}</span>
                  </div>
                )}

                {/* Status actions */}
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">Update Status</div>
                  <div className="flex flex-wrap gap-2">
                    {STATUS_OPTIONS.map((status) => (
                      <button
                        key={status}
                        onClick={() => updateStatus(selected.id, status)}
                        className={`px-3 py-1.5 text-sm rounded-lg capitalize transition-colors ${
                          selected.status === status
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center text-gray-500">
                <p>Select a submission to view details</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
