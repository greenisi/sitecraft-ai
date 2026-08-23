'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Copy, Mail, Phone, Archive, ExternalLink, Check } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetBody,
  SheetFooter,
} from '@/components/ui/sheet';
import type { Submission, SubmissionStatus } from './types';

const STATUS_OPTIONS: SubmissionStatus[] = ['new', 'read', 'replied', 'archived'];

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
  return labels[type] || type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatKey(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

interface SubmissionDrawerProps {
  submission: Submission | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange: (id: string, status: SubmissionStatus) => void;
}

export function SubmissionDrawer({
  submission,
  open,
  onOpenChange,
  onStatusChange,
}: SubmissionDrawerProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!submission) return null;

  const copy = async (value: string, field: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      toast.success(`${field} copied`);
      setTimeout(() => setCopiedField(null), 1500);
    } catch {
      toast.error('Could not copy to clipboard');
    }
  };

  const extraFields = submission.form_data
    ? Object.entries(submission.form_data).filter(([key]) => key !== 'uploaded_images')
    : [];

  const attachments =
    submission.form_data?.uploaded_images && Array.isArray(submission.form_data.uploaded_images)
      ? (submission.form_data.uploaded_images as string[])
      : [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right">
        <SheetHeader>
          <div className="flex items-center gap-3">
            <SheetTitle>{submission.name || 'Anonymous'}</SheetTitle>
            <span
              className={`text-xs px-2 py-0.5 rounded-full border ${
                statusColors[submission.status] || 'bg-gray-700 text-gray-300 border-gray-600'
              }`}
            >
              {submission.status}
            </span>
          </div>
          <p className="text-sm text-gray-400">
            {formatFormType(submission.form_type)} &middot;{' '}
            {new Date(submission.created_at).toLocaleString()}
          </p>
        </SheetHeader>

        <SheetBody className="space-y-5 mt-2">
          {/* Quick contact actions */}
          {(submission.email || submission.phone) && (
            <div className="flex flex-wrap gap-2">
              {submission.email && (
                <>
                  <a
                    href={`mailto:${submission.email}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition-colors"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    Reply
                  </a>
                  <button
                    onClick={() => copy(submission.email!, 'Email')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 text-sm font-medium transition-colors"
                  >
                    {copiedField === 'Email' ? (
                      <Check className="h-3.5 w-3.5 text-green-400" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    Copy email
                  </button>
                </>
              )}
              {submission.phone && (
                <>
                  <a
                    href={`tel:${submission.phone}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 text-sm font-medium transition-colors"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    Call
                  </a>
                  <button
                    onClick={() => copy(submission.phone!, 'Phone')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 text-sm font-medium transition-colors"
                  >
                    {copiedField === 'Phone' ? (
                      <Check className="h-3.5 w-3.5 text-green-400" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    Copy phone
                  </button>
                </>
              )}
            </div>
          )}

          {/* Contact info grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {submission.email && (
              <div className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-3">
                <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Email</div>
                <a
                  href={`mailto:${submission.email}`}
                  className="text-sm text-blue-400 hover:underline break-all"
                >
                  {submission.email}
                </a>
              </div>
            )}
            {submission.phone && (
              <div className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-3">
                <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Phone</div>
                <a href={`tel:${submission.phone}`} className="text-sm text-white">
                  {submission.phone}
                </a>
              </div>
            )}
            {submission.service_needed && (
              <div className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-3">
                <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">
                  Service Needed
                </div>
                <div className="text-sm text-white">{submission.service_needed}</div>
              </div>
            )}
            {submission.preferred_date && (
              <div className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-3">
                <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">
                  Preferred Date
                </div>
                <div className="text-sm text-white">{submission.preferred_date}</div>
              </div>
            )}
          </div>

          {/* Message */}
          {submission.message && (
            <div>
              <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">Message</div>
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-sm text-gray-200 whitespace-pre-wrap">
                {submission.message}
              </div>
            </div>
          )}

          {/* Attachments */}
          {attachments.length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">
                Attachments ({attachments.length})
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {attachments.map((url, i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block aspect-square rounded-lg overflow-hidden border border-gray-800 hover:border-purple-500 transition-colors group relative"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={`Attachment ${i + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <ExternalLink className="absolute top-1.5 right-1.5 h-3.5 w-3.5 text-white/80 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Extra form data */}
          {extraFields.length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">
                Additional Fields
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {extraFields.map(([key, val]) => (
                  <div
                    key={key}
                    className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-3"
                  >
                    <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">
                      {formatKey(key)}
                    </div>
                    <div className="text-sm text-white break-words">{String(val)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Source page */}
          {submission.source_page && (
            <div className="text-xs text-gray-500">
              Submitted from:{' '}
              <span className="text-gray-400 break-all">{submission.source_page}</span>
            </div>
          )}
        </SheetBody>

        <SheetFooter>
          <div className="flex flex-wrap items-center gap-2 w-full">
            <span className="text-[10px] uppercase tracking-wider text-gray-500 mr-1">
              Status
            </span>
            {STATUS_OPTIONS.filter((s) => s !== 'archived').map((status) => (
              <button
                key={status}
                onClick={() => onStatusChange(submission.id, status)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-colors ${
                  submission.status === status
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {status}
              </button>
            ))}
            <button
              onClick={() => onStatusChange(submission.id, 'archived')}
              className={`ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                submission.status === 'archived'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <Archive className="h-3 w-3" />
              {submission.status === 'archived' ? 'Archived' : 'Archive'}
            </button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
