import { EditorLayout } from '@/components/editor/editor-layout';

export default async function EditorPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  return <EditorLayout projectId={projectId} />;
}
