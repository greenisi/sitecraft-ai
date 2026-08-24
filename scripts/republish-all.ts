/**
 * Republishes live sites so they pick up the current FormAutoWire.
 *
 * Form wiring is injected at publish time and never stored in generated_files,
 * so a site published before the wiring existed has a contact form that posts
 * nowhere. The only way an already-published site gets it is another publish.
 *
 *   npx tsx scripts/republish-all.ts --dry-run
 *   npx tsx scripts/republish-all.ts --only <projectId>
 *   npx tsx scripts/republish-all.ts
 *
 * VERCEL_PLATFORM_TOKEN lives only in the production environment:
 *   npx vercel env pull /tmp/vercel.env --environment=production --yes
 * Pass its location with --env <path> (defaults to /tmp/vercel.env).
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { existsSync, readFileSync } from 'fs';

config({ path: '.env.local' });

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const only = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;
const envPath = args.includes('--env') ? args[args.indexOf('--env') + 1] : '/tmp/vercel.env';

if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const match = line.match(/^([A-Z_]+)="?(.*?)"?$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2];
  }
}

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  let query = supabase
    .from('projects')
    .select('id, name, slug, user_id, published_url')
    .not('published_url', 'is', null)
    .order('created_at', { ascending: false });

  if (only) query = query.eq('id', only);

  const { data: projects, error } = await query;
  if (error) throw error;
  if (!projects?.length) {
    console.log('No published projects matched.');
    return;
  }

  console.log(`${projects.length} published site(s)${dryRun ? ' (dry run)' : ''}\n`);

  // Sites without a finished generation cannot be republished at all, and
  // finding that out mid-run is worse than knowing up front.
  const skipped: string[] = [];
  const ok: string[] = [];
  const failed: Array<{ name: string; reason: string }> = [];

  for (const project of projects) {
    const label = `${(project.name || project.slug || project.id).slice(0, 42)}`;

    const { data: version } = await supabase
      .from('generation_versions')
      .select('id')
      .eq('project_id', project.id)
      .eq('status', 'complete')
      .order('version_number', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!version) {
      console.log(`  skip  ${label} — no complete generation`);
      skipped.push(label);
      continue;
    }

    if (dryRun) {
      console.log(`  would ${label}`);
      ok.push(label);
      continue;
    }

    try {
      const { publishToSubdomain } = await import('../src/lib/export/platform-publisher');
      const result = await publishToSubdomain(project.id, project.user_id);
      console.log(`  ok    ${label} → ${result.url}`);
      ok.push(label);
    } catch (e) {
      const reason = e instanceof Error ? e.message : String(e);
      console.log(`  FAIL  ${label} — ${reason.slice(0, 120)}`);
      failed.push({ name: label, reason });
    }
  }

  console.log(
    `\ndone: ${ok.length} published, ${skipped.length} skipped, ${failed.length} failed`
  );
  if (failed.length) {
    console.log('\nfailures:');
    for (const f of failed) console.log(`  ${f.name}: ${f.reason.slice(0, 200)}`);
  }
  process.exit(failed.length ? 1 : 0);
}

main().catch((e) => {
  console.error('FAILED:', e?.message || e);
  process.exit(1);
});
