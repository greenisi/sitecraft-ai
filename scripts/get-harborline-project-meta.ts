import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
config({ path: '.env.local' });
async function main() {
  const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
  const { data, error } = await client.from('projects').select('slug,vercel_project_name,vercel_project_id,published_url,status,published_version_id').eq('id','acc40ff7-46e1-4446-b408-71040677108e').single();
  if (error) throw error;
  console.log(JSON.stringify(data));
}
main().catch((error) => { console.error(error); process.exit(1); });
