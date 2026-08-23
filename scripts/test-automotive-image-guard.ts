import assert from 'node:assert/strict';
import { createGalleryContext, repairDeadImageUrls } from '../src/lib/ai/image-guard';
import { getIndustryGallery } from '../src/lib/ai/image-gallery';

const AUTOMOTIVE_IDS = [
  'photo-1503376780353-7e6692767b70',
  'photo-1492144534655-ae79c964c9d7',
  'photo-1487754180451-c456f719a1fc',
  'photo-1549317661-bd32c8ce0db2',
  'photo-1553440569-bcc63803a83d',
  'photo-1618843479313-40f8afb4b4d8',
];

async function main() {
  const gallery = getIndustryGallery('Mobile auto detailing', 'Harborline Auto Spa cleans and protects vehicles');
  assert.ok(gallery, 'automotive businesses should receive a curated gallery');
  assert.ok(gallery!.every((image) => AUTOMOTIVE_IDS.includes(image.id)), 'automotive gallery must contain only verified automotive IDs');

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(null, { status: 404 });
  try {
    const source = `export default function Hero(){return <section><h1>Harborline Auto Spa</h1><p>Mobile vehicle detailing and paint correction</p><img src="https://images.unsplash.com/photo-deadbeef-deadbeef?w=1200" alt="vehicle detailing" /></section>}`;
    const repaired = await repairDeadImageUrls(source);
    assert.ok(AUTOMOTIVE_IDS.some((id) => repaired.includes(id)), 'dead Auto Spa images must fall back to automotive photography');
    assert.doesNotMatch(repaired, /photo-1576091160399|photo-1559757148|photo-1579684385127/, 'Auto Spa must never fall through to healthcare imagery');
  } finally {
    globalThis.fetch = originalFetch;
  }

  globalThis.fetch = async () => new Response(null, { status: 200 });
  try {
    const liveButWrong = `export default function Service(){return <section><h2>Vehicle detailing</h2><img src="https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=1200" alt="seedlings" /></section>}`;
    const context = createGalleryContext(gallery);
    const repaired = await repairDeadImageUrls(liveButWrong, context);
    assert.doesNotMatch(repaired, /photo-1466692476868-aef1dfb1e735/, 'live images outside the curated automotive gallery must be replaced');
    assert.ok(AUTOMOTIVE_IDS.some((id) => repaired.includes(id)), 'live mismatched images must be replaced with verified automotive imagery');
  } finally {
    globalThis.fetch = originalFetch;
  }

  console.log('PASS automotive image guard');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
