import { createAdminClient } from '@/lib/supabase/admin';
import { sendOwnerReply } from '@/lib/email/send';

// One-click "send this reply" link from the owner's lead-alert email.
// Auth is the single-use random token stored on the submission at creation —
// the owner clicks from their inbox, so there's no dashboard session here.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const submissionId = url.searchParams.get('sid');
  const token = url.searchParams.get('token');

  if (!submissionId || !token) {
    return htmlPage('Invalid link', 'This reply link is missing information.', 400);
  }

  const sb = createAdminClient();
  const { data: submission } = await sb
    .from('form_submissions')
    .select('id, project_id, name, email, status, form_data')
    .eq('id', submissionId)
    .single();

  if (!submission) {
    return htmlPage('Not found', 'This lead no longer exists.', 404);
  }

  const formData = (submission.form_data || {}) as Record<string, unknown>;
  const storedToken = formData.reply_token as string | undefined;
  const draft = formData.ai_draft as string | undefined;

  if (!storedToken || storedToken !== token) {
    return htmlPage('Invalid link', 'This reply link is not valid.', 403);
  }
  if (submission.status === 'responded') {
    return htmlPage('Already sent', 'You already replied to this lead — no duplicate was sent.', 200);
  }
  if (!draft || !submission.email) {
    return htmlPage('Cannot send', 'There is no draft or no email address for this lead. Reply from your dashboard instead.', 400);
  }

  const { data: project } = await sb
    .from('projects')
    .select('name, user_id')
    .eq('id', submission.project_id)
    .single();
  const { data: ownerUser } = project?.user_id
    ? await sb.auth.admin.getUserById(project.user_id)
    : { data: null };

  const result = await sendOwnerReply({
    to: submission.email,
    businessName: project?.name || 'the business',
    body: draft,
    ownerEmail: ownerUser?.user?.email || null,
  });

  if (!result.ok) {
    return htmlPage('Send failed', `The reply could not be sent (${result.error}). Try again from your dashboard.`, 500);
  }

  // DB check constraint allows: new, read, responded, archived.
  const { error: updateError } = await sb
    .from('form_submissions')
    .update({ status: 'responded' })
    .eq('id', submissionId);
  if (updateError) {
    console.error('[Lead Reply] Failed to mark submission responded:', updateError.message);
  }

  const who = submission.name || submission.email;
  return htmlPage('Reply sent ✓', `Your reply is on its way to ${who}. They'll see it as coming from your business, and if they respond it goes straight to your inbox.`, 200);
}

function htmlPage(title: string, message: string, status: number) {
  const esc = (s: string) =>
    s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
  return new Response(
    `<!doctype html>
<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#0a0a0f;color:#e5e5e5;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:24px">
  <div style="max-width:420px;text-align:center">
    <h1 style="font-size:24px;margin:0 0 12px;color:#fff">${esc(title)}</h1>
    <p style="font-size:15px;line-height:1.6;color:#a3a3a3">${esc(message)}</p>
  </div>
</body></html>`,
    { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  );
}
