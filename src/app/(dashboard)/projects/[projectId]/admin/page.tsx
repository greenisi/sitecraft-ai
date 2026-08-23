import { redirect } from 'next/navigation';

export default async function AdminDashboardRedirect({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  redirect(`/projects/${projectId}/workspace`);
}
