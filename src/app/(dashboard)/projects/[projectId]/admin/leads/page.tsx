'use client';

import { useParams } from 'next/navigation';
import { InboxPanel } from '@/components/workspace/InboxPanel';

export default function LeadsPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Form Submissions</h1>
        <p className="text-sm text-gray-400 mt-1">
          Every contact, quote, and inquiry from your website — click any row to see details
          and update status.
        </p>
      </div>
      <InboxPanel projectId={projectId} variant="full" />
    </div>
  );
}
