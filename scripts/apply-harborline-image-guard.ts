import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { createGalleryContext, repairDeadImageUrls } from '../src/lib/ai/image-guard';
import { getIndustryGallery } from '../src/lib/ai/image-gallery';

config({ path: '.env.local' });

const PROJECT_ID = 'acc40ff7-46e1-4446-b408-71040677108e';
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) throw new Error('Supabase server environment is unavailable');

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const gallery = getIndustryGallery(
  'Mobile auto detailing',
  'Harborline Auto Spa provides vehicle detailing, ceramic coating, paint correction, and automotive care',
);
if (!gallery) throw new Error('Automotive gallery was not selected');
const allowedIds = new Set(gallery.map((image) => image.id));
const unsplashIdPattern = /https:\/\/images\.unsplash\.com\/(photo-[0-9a-z]+-[0-9a-z]+)(\?[^"'`\s)]*)?/gi;

function remainingOutOfGallery(content: string): string[] {
  return [...content.matchAll(unsplashIdPattern)]
    .map((match) => match[1])
    .filter((id) => !allowedIds.has(id));
}

async function main() {
  const { data: latest, error: versionLookupError } = await supabase
    .from('generation_versions')
    .select('id, version_number')
    .eq('project_id', PROJECT_ID)
    .eq('status', 'complete')
    .order('version_number', { ascending: false })
    .limit(1)
    .single();
  if (versionLookupError || !latest) throw versionLookupError ?? new Error('No completed version');

  const { data: files, error: fileLookupError } = await supabase
    .from('generated_files')
    .select('file_path, content, file_type, section_type')
    .eq('version_id', latest.id);
  if (fileLookupError || !files?.length) throw fileLookupError ?? new Error('No generated files');

  let changedFiles = 0;
  let outOfGalleryBefore = 0;
  let outOfGalleryAfter = 0;
  const repairedFiles = [] as Array<{
    path: string;
    content: string;
    type: string;
    sectionType: string | null;
  }>;

  for (const file of files) {
    let content = file.content;
    if (file.file_path.endsWith('.tsx')) {
      outOfGalleryBefore += remainingOutOfGallery(content).length;
      const repaired = await repairDeadImageUrls(content, createGalleryContext(gallery));
      content = repaired
        .replace(
          'Comprehensive before-and-after documentation ensuring transparency and showcasing the transformation.',
          'Photo documentation at handoff provides a clear record of the completed service.',
        )
        .replace(
          'Premium ceramic coating application for long-lasting protection and deep shine.',
          'Ceramic coating service presented with a polished, exterior-focused finish.',
        )
        .replace(
          "Harborline Auto Spa delivers exceptional mobile detailing services directly to your doorstep in South Florida. Our certified technicians use premium products and advanced techniques to restore and protect your vehicle's finish.",
          'Harborline Auto Spa provides mobile vehicle detailing in South Florida through an inspection-led, paint-safe process and a photo-documented handoff.',
        )
        .replace(
          "Service duration varies based on the package selected and vehicle condition. Basic exterior detailing takes 2-3 hours, full interior detailing 3-4 hours, and our Signature Ceramic Coating service requires 1-2 days. We'll provide a specific timeline when scheduling.",
          "Service duration depends on the selected service and the vehicle's condition. We confirm the expected timing after reviewing the request.",
        )
        .replace(
          "Yes, we're a fully mobile detailing service. Our technicians bring all necessary equipment to your location - whether that's your home, workplace, or marina. We work efficiently in outdoor environments without compromising quality.",
          "Yes. Mobile service can be requested for a home, workplace, or marina location, subject to access and scheduling availability.",
        )
        .replace(
          "We exclusively use professional-grade detailing products from top manufacturers including Chemical Guys, Meguiar's, and Adam's Polishes. All products are specifically chosen for their effectiveness in South Florida's challenging coastal climate.",
          "Products and techniques are selected according to the vehicle surface, condition, and requested service. Specific product questions can be discussed before the appointment.",
        )
        .replace(
          "For optimal protection in South Florida, we recommend exterior detailing every 3-4 months and interior detailing every 2-3 months. Ceramic coating applications require annual maintenance to preserve their protective properties.",
          "Detailing frequency depends on vehicle use, storage, surface condition, and any product or manufacturer care instructions.",
        )
        .replace(
          "Absolutely. We offer a 100% satisfaction guarantee on all services. If you're not completely satisfied with our work, we'll re-perform the service or provide a refund. Our ceramic coating comes with a 5-year warranty against defects.",
          "Questions or concerns about a completed service are reviewed individually. Any applicable terms are confirmed in writing before work begins.",
        )
        .replace(
          'The extent of correction depends on the damage depth and type, which we assess during our free consultation.',
          'The extent of correction depends on the depth and type of damage, which is assessed during the initial inspection.',
        )
        .replace(
          'Schedule your premium mobile detailing service in South Florida. Our certified technicians will come to your location.',
          'Request a mobile detailing service in South Florida and share the location that works for you.',
        )
        .replace('Insured Mobile Service', 'Mobile Service Planning')
        .replace(
          'Fully insured mobile detailing with premium equipment protection',
          'Location and access details are confirmed before the appointment',
        )
        .replace('Final Walk-Through', 'Documented Handoff')
        .replace(
          'Client approval process ensuring 100% satisfaction',
          'Service summary and photo documentation provided at handoff',
        )
        .replace(
          'Fully insured mobile detailing service for your peace of mind',
          'Location and access details are confirmed before the appointment',
        )
        .replace(
          'Detailed before/after photos documenting every step of our process',
          'Inspection and handoff photos provide a clear service record',
        )
        .replace('Our Proven Process', 'Our Detailing Process')
        .replace(
          'Precision cleaning using premium products and time-tested techniques',
          'Careful cleaning using vehicle-appropriate products and paint-safe techniques',
        );

      if (file.file_path === 'src/components/ReviewsPreview.tsx') {
        content = `export default function ReviewsPreview() {
  const expectations = [
    { title: 'Share the vehicle details', description: 'Tell us the vehicle type, requested service, and preferred location.' },
    { title: 'Confirm the service plan', description: 'The requested scope and scheduling details are reviewed before work begins.' },
    { title: 'Receive a documented handoff', description: 'The completed service is reviewed with a clear photo record at handoff.' },
  ];
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-14">
          <p className="text-xs tracking-[0.3em] uppercase text-accent font-semibold mb-4">What to expect</p>
          <h2 className="font-heading text-3xl md:text-4xl text-gray-900">A clear service-request workflow</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {expectations.map((item, index) => (
            <article key={item.title} className="rounded-2xl border border-gray-200 bg-gray-50 p-8">
              <p className="font-heading text-5xl text-accent/30 mb-5">0{index + 1}</p>
              <h3 className="font-heading text-xl text-gray-900 mb-3">{item.title}</h3>
              <p className="text-gray-600">{item.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}`;
      }

      if (file.file_path === 'src/components/ContactInfo.tsx') {
        content = `import { ClipboardList, MapPin, Camera } from 'lucide-react';

export default function ContactInfo() {
  const steps = [
    { icon: ClipboardList, title: 'Share the request', description: 'Include the vehicle type, requested service, and any areas that need attention.' },
    { icon: MapPin, title: 'Confirm the location', description: 'Provide a South Florida service location so access and scheduling can be reviewed.' },
    { icon: Camera, title: 'Document the handoff', description: 'The service request can include a photo-documented inspection and handoff.' },
  ];
  return (
    <aside className="rounded-3xl bg-gray-900 p-8 text-white shadow-xl">
      <p className="text-xs tracking-[0.3em] uppercase text-accent font-semibold mb-4">How requests work</p>
      <h3 className="font-heading text-2xl mb-8">Details that help us plan the service</h3>
      <div className="space-y-7">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <div key={step.title} className="flex gap-4">
              <div className="h-11 w-11 shrink-0 rounded-xl bg-accent/15 flex items-center justify-center"><Icon className="h-5 w-5 text-accent" /></div>
              <div><h4 className="font-heading text-lg mb-1">{step.title}</h4><p className="text-gray-300 leading-relaxed">{step.description}</p></div>
            </div>
          );
        })}
      </div>
      <p className="mt-8 border-t border-gray-700 pt-6 text-sm text-gray-400">Availability and service details are confirmed after the request is reviewed.</p>
    </aside>
  );
}`;
      }

      if (file.file_path === 'src/components/Footer.tsx') {
        content = `import Link from 'next/link';
import { ArrowRight, MapPin, Sparkles } from 'lucide-react';

export default function Footer() {
  const links = [
    { label: 'Home', href: '/' },
    { label: 'Services', href: '/services' },
    { label: 'About', href: '/about' },
    { label: 'Request Service', href: '/contact' },
  ];
  return (
    <footer className="bg-gray-950 text-gray-300 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 border-b border-gray-800 pb-12 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-3 mb-5"><div className="h-11 w-11 rounded-xl bg-accent/15 flex items-center justify-center"><Sparkles className="h-5 w-5 text-accent" /></div><div><p className="font-heading text-xl font-bold text-white">Harborline</p><p className="text-sm text-cyan-200">Auto Spa</p></div></div>
            <p className="max-w-sm text-gray-400">Mobile vehicle detailing built around a careful inspection, paint-safe process, and documented handoff.</p>
          </div>
          <div>
            <h3 className="font-heading text-white text-lg mb-5">Explore</h3>
            <nav className="grid grid-cols-2 gap-3">{links.map((link) => <Link key={link.href} href={link.href} className="text-gray-400 hover:text-white transition-colors">{link.label}</Link>)}</nav>
          </div>
          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
            <div className="flex items-center gap-2 text-cyan-200 mb-3"><MapPin className="h-5 w-5" /><span>South Florida mobile service</span></div>
            <p className="text-sm text-gray-400 mb-5">Share the preferred location and vehicle details so availability can be reviewed.</p>
            <Link href="/contact" className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-3 font-bold text-gray-950 hover:bg-cyan-300 transition-colors">Request Service <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500"><p>© {new Date().getFullYear()} Harborline Auto Spa.</p><p>Service details are confirmed after request review.</p></div>
      </div>
    </footer>
  );
}`;
      }

      outOfGalleryAfter += remainingOutOfGallery(content).length;
      if (content !== file.content) changedFiles += 1;
    }
    repairedFiles.push({
      path: file.file_path,
      content,
      type: file.file_type,
      sectionType: file.section_type,
    });
  }

  if (outOfGalleryAfter !== 0) {
    throw new Error(`Repair incomplete: ${outOfGalleryAfter} out-of-gallery image references remain`);
  }

  const nextVersionNumber = latest.version_number + 1;
  const { data: nextVersion, error: versionCreateError } = await supabase
    .from('generation_versions')
    .insert({
      project_id: PROJECT_ID,
      version_number: nextVersionNumber,
      status: 'generating',
      trigger_type: 'full-regenerate',
      model_used: 'automotive-image-guard',
      total_tokens_used: 0,
    })
    .select('id, version_number')
    .single();
  if (versionCreateError || !nextVersion) throw versionCreateError ?? new Error('Could not create repair version');

  const records = repairedFiles.map((file) => ({
    project_id: PROJECT_ID,
    version_id: nextVersion.id,
    file_path: file.path,
    content: file.content,
    file_type: file.type,
    section_type: file.sectionType,
  }));
  const { error: insertError } = await supabase.from('generated_files').insert(records);
  if (insertError) throw insertError;

  const completedAt = new Date().toISOString();
  const { error: completeError } = await supabase
    .from('generation_versions')
    .update({ status: 'complete', generation_time_ms: 0, completed_at: completedAt })
    .eq('id', nextVersion.id);
  if (completeError) throw completeError;
  const { error: projectUpdateError } = await supabase
    .from('projects')
    .update({ status: 'generated', last_generated_at: completedAt })
    .eq('id', PROJECT_ID);
  if (projectUpdateError) throw projectUpdateError;

  console.log(JSON.stringify({
    sourceVersion: latest.version_number,
    repairedVersion: nextVersion.version_number,
    fileCount: repairedFiles.length,
    changedFiles,
    outOfGalleryBefore,
    outOfGalleryAfter,
  }));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
