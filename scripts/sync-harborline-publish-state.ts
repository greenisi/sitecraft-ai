import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const PROJECT_ID = 'acc40ff7-46e1-4446-b408-71040677108e';
const PUBLIC_URL = 'https://harborline-auto-spa-ym70.innovated.site';
const DEPLOYMENT_URL = 'https://sc-harborline-auto-spa-ym70-1w2dg3706-innovated-marketing.vercel.app';

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase server environment unavailable');
  const supabase = createClient(url, key, { auth: { persistSession: false } });

  const { data: version, error: versionError } = await supabase
    .from('generation_versions')
    .select('id, version_number, status')
    .eq('project_id', PROJECT_ID)
    .eq('status', 'complete')
    .order('version_number', { ascending: false })
    .limit(1)
    .single();
  if (versionError || !version) throw versionError ?? new Error('Latest version not found');

  const publishedAt = new Date().toISOString();
  const { error: updateError } = await supabase
    .from('projects')
    .update({
      status: 'published',
      published_version_id: version.id,
      published_url: PUBLIC_URL,
      vercel_deployment_url: DEPLOYMENT_URL,
      published_at: publishedAt,
    })
    .eq('id', PROJECT_ID);
  if (updateError) throw updateError;

  const { data: project, error: verifyError } = await supabase
    .from('projects')
    .select('status, published_version_id, published_url, vercel_deployment_url')
    .eq('id', PROJECT_ID)
    .single();
  if (verifyError || !project) throw verifyError ?? new Error('Publish state verification failed');

  console.log(JSON.stringify({
    versionNumber: version.version_number,
    versionId: version.id,
    status: project.status,
    publishedVersionId: project.published_version_id,
    publishedUrl: project.published_url,
    deploymentUrl: project.vercel_deployment_url,
  }));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
