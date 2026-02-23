export const dynamic = 'force-dynamic';

export default function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 overflow-hidden bg-background">
      {children}
    </div>
  );
}
