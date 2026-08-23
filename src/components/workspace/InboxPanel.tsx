'use client';

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import Link from 'next/link';
import { Inbox, Image as ImageIcon, ChevronRight } from 'lucide-react';
import { SubmissionDrawer } from './SubmissionDrawer';
import type { Submission, SubmissionStatus } from './types';

type StatusFilter = 'all' | SubmissionStatus;

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'new', label: 'New' },
  { value: 'read', label: 'Read' },
  { value: 'replied', label: 'Replied' },
  { value: 'archived', label: 'Archived' },
];

const statusColors: Record<string, string> = {
  new: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  read: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  replied: 'bg-green-500/20 text-green-400 border-green-500/30',
  archived: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function formatFormType(type: string): string {
  const labels: Record<string, string> = {
    contact: 'Contact',
    quote: 'Quote',
    appointment: 'Appointment',
    booking: 'Booking',
    inquiry: 'Inquiry',
    newsletter: 'Newsletter',
    service_request: 'Service Request',
    callback: 'Callback',
    estimate: 'Estimate',
    property_inquiry: 'Property',
    consultation: 'Consultation',
  };
  return labels[type] || type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

interface InboxPanelProps {
  projectId: string;
  /** Compact = workspace home (no filters, "View all" link, limited rows). Full = standalone /admin/leads page. */
  variant?: 'compact' | 'full';
  /** Number of rows to show in compact mode. Default 8. */
  compactLimit?: number;
  /** When variant="compact", link target for "View all" / empty state CTA. */
  viewAllHref?: string;
}

export function InboxPanel({
  projectId,
  variant = 'full',
  compactLimit = 8,
  viewAllHref,
}: InboxPanelProps) {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const queryKey = ['form-submissions', projectId, variant === 'compact' ? 'all' : statusFilter];

  const { data, isLoading, isError } = useQuery<{ submissions: Submission[] }>({
    queryKey,
    queryFn: async () => {
      const filterValue = variant === 'compact' ? 'all' : statusFilter;
      const url =
        filterValue === 'all'
          ? `/api/projects/${projectId}/form-submissions`
          : `/api/projects/${projectId}/form-submissions?status=${filterValue}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to load submissions');
      return res.json();
    },
    staleTime: 15_000,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: SubmissionStatus }) => {
      const res = await fetch(`/api/projects/${projectId}/form-submissions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to update status');
      }
      return res.json();
    },
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ['form-submissions', projectId] });
      const previousLists = queryClient.getQueriesData<{ submissions: Submission[] }>({
        queryKey: ['form-submissions', projectId],
      });
      previousLists.forEach(([key, oldData]) => {
        if (!oldData) return;
        queryClient.setQueryData(key, {
          submissions: oldData.submissions.map((s) =>
            s.id === id ? { ...s, status } : s
          ),
        });
      });
      return { previousLists };
    },
    onError: (err, _vars, context) => {
      context?.previousLists?.forEach(([key, oldData]) => {
        queryClient.setQueryData(key, oldData);
      });
      toast.error(err instanceof Error ? err.message : 'Update failed');
    },
    onSuccess: (_data, vars) => {
      toast.success(`Marked as ${vars.status}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['form-submissions', projectId] });
    },
  });

  const submissions = data?.submissions ?? [];

  const visibleRows = useMemo(() => {
    return variant === 'compact' ? submissions.slice(0, compactLimit) : submissions;
  }, [submissions, variant, compactLimit]);

  const newCount = submissions.filter((s) => s.status === 'new').length;
  const totalCount = submissions.length;

  const selected = useMemo(
    () => submissions.find((s) => s.id === selectedId) ?? null,
    [submissions, selectedId]
  );

  const handleStatusChange = (id: string, status: SubmissionStatus) => {
    updateStatusMutation.mutate({ id, status });
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 p-4 border-b border-gray-800">
        <div className="flex items-center gap-3 min-w-0">
          <Inbox className="h-4 w-4 text-purple-400 flex-shrink-0" />
          <h2 className="text-base font-semibold text-white">
            {variant === 'compact' ? 'Inbox' : 'Form Submissions'}
          </h2>
          {newCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
              {newCount} new
            </span>
          )}
          {variant === 'full' && totalCount > 0 && (
            <span className="text-xs text-gray-500">
              {totalCount} total
            </span>
          )}
        </div>
        {variant === 'compact' && viewAllHref && totalCount > 0 && (
          <Link
            href={viewAllHref}
            className="text-sm text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1 flex-shrink-0"
          >
            View all
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>

      {/* Filter chips (full mode only) */}
      {variant === 'full' && (
        <div className="flex flex-wrap gap-1.5 p-3 border-b border-gray-800">
          {STATUS_FILTERS.map((f) => {
            const isActive = statusFilter === f.value;
            return (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="divide-y divide-gray-800">
          {[0, 1, 2].map((i) => (
            <div key={i} className="px-4 py-3 flex items-center gap-3 animate-pulse">
              <div className="w-2 h-2 rounded-full bg-gray-700 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-32 bg-gray-800 rounded" />
                <div className="h-2 w-48 bg-gray-800 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="p-6 text-center text-sm text-red-400">
          Failed to load submissions. Try refreshing.
        </div>
      ) : visibleRows.length === 0 ? (
        <div className="p-6 text-center text-gray-500 text-sm">
          {statusFilter === 'all'
            ? "No form submissions yet. They'll appear here when visitors fill out forms on your website."
            : `No submissions with status "${statusFilter}".`}
        </div>
      ) : (
        <div className="divide-y divide-gray-800">
          {visibleRows.map((s) => {
            const uploaded = s.form_data?.uploaded_images;
            const hasImages = Array.isArray(uploaded) && uploaded.length > 0;
            return (
              <button
                key={s.id}
                onClick={() => setSelectedId(s.id)}
                className="w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-gray-800/50 transition-colors group"
              >
                <span
                  className={`w-2 h-2 rounded-full flex-shrink-0 mt-2 ${
                    s.status === 'new' ? 'bg-blue-400' : 'bg-gray-700'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-medium text-white truncate">
                      {s.name || s.email || 'Anonymous'}
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full border whitespace-nowrap flex-shrink-0 ${
                        statusColors[s.status] ||
                        'bg-gray-700 text-gray-300 border-gray-600'
                      }`}
                    >
                      {s.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                    <span>{formatFormType(s.form_type)}</span>
                    <span className="text-gray-700">·</span>
                    <span>{timeAgo(s.created_at)}</span>
                    {hasImages && (
                      <>
                        <span className="text-gray-700">·</span>
                        <ImageIcon className="h-3 w-3 text-purple-400" />
                      </>
                    )}
                  </div>
                  {s.message && (
                    <p className="text-xs text-gray-400 mt-1 line-clamp-1">{s.message}</p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      <SubmissionDrawer
        submission={selected}
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}
