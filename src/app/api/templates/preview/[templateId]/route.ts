import { NextRequest, NextResponse } from 'next/server';
import { getTemplateById } from '@/lib/templates/premium-templates';

interface RouteContext {
  params: Promise<{ templateId: string }>;
}

// Industry-specific Unsplash images (free, no API key needed)
const TEMPLATE_IMAGES: Record<string, {
  hero: string;
  gallery: string[];
  team: string[];
  products: string[];
}> = {
  'obsidian-saas': {
    hero: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=1400&h=800&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=450&fit=crop',
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=450&fit=crop',
      'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&h=450&fit=crop',
      'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&h=450&fit=crop',
      'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=600&h=450&fit=crop',
      'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=600&h=450&fit=crop',
    ],
    team: [
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face',
    ],
    products: [],
  },
  'ivory-realty': {
    hero: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1400&h=800&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=450&fit=crop',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&h=450&fit=crop',
      'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=600&h=450&fit=crop',
      'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=600&h=450&fit=crop',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&h=450&fit=crop',
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600&h=450&fit=crop',
    ],
    team: [
      'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&h=200&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&h=200&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&crop=face',
    ],
    products: [],
  },
  'titan-fitness': {
    hero: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1400&h=800&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&h=450&fit=crop',
      'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=600&h=450&fit=crop',
      'https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=600&h=450&fit=crop',
      'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&h=450&fit=crop',
      'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=600&h=450&fit=crop',
      'https://images.unsplash.com/photo-1576678927484-cc907957088c?w=600&h=450&fit=crop',
    ],
    team: [
      'https://images.unsplash.com/photo-1567013127542-490d757e51fc?w=200&h=200&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1548690312-e3b507d8c110?w=200&h=200&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=200&h=200&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1594381898411-846e7d193883?w=200&h=200&fit=crop&crop=face',
    ],
    products: [],
  },
  'maison-restaurant': {
    hero: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1400&h=800&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=450&fit=crop',
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=450&fit=crop',
      'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=600&h=450&fit=crop',
      'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=600&h=450&fit=crop',
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&h=450&fit=crop',
      'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=600&h=450&fit=crop',
    ],
    team: [
      'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=200&h=200&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1583394293214-28ez9e9bL830?w=200&h=200&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1542178243-bc20204b769f?w=200&h=200&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1512485694743-9c9538b4e6e0?w=200&h=200&fit=crop&crop=face',
    ],
    products: [],
  },
  'nova-agency': {
    hero: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1400&h=800&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600&h=450&fit=crop',
      'https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=600&h=450&fit=crop',
      'https://images.unsplash.com/photo-1542744094-3a31f272c490?w=600&h=450&fit=crop',
      'https://images.unsplash.com/photo-1523726491678-bf852e717f6a?w=600&h=450&fit=crop',
      'https://images.unsplash.com/photo-1559028012-481c04fa702d?w=600&h=450&fit=crop',
      'https://images.unsplash.com/photo-1572044162444-ad60f128bdea?w=600&h=450&fit=crop',
    ],
    team: [
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face',
    ],
    products: [],
  },
  'meridian-health': {
    hero: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1400&h=800&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=600&h=450&fit=crop',
      'https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=600&h=450&fit=crop',
      'https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=600&h=450&fit=crop',
      'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=600&h=450&fit=crop',
      'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&h=450&fit=crop',
      'https://images.unsplash.com/photo-1581595220892-b0739db3ba8c?w=600&h=450&fit=crop',
    ],
    team: [
      'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&h=200&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200&h=200&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&h=200&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=200&h=200&fit=crop&crop=face',
    ],
    products: [],
  },
  'luxe-ecommerce': {
    hero: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1400&h=800&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=450&fit=crop',
      'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=600&h=450&fit=crop',
      'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=600&h=450&fit=crop',
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=450&fit=crop',
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=450&fit=crop',
      'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&h=450&fit=crop',
    ],
    team: [],
    products: [
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=500&fit=crop',
      'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&h=500&fit=crop',
      'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&h=500&fit=crop',
      'https://images.unsplash.com/photo-1434389677669-e08b4cda3f0a?w=400&h=500&fit=crop',
    ],
  },
  'axiom-law': {
    hero: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=1400&h=800&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1450101499163-c8848e968095?w=600&h=450&fit=crop',
      'https://images.unsplash.com/photo-1521791055366-0d553872125f?w=600&h=450&fit=crop',
      'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&h=450&fit=crop',
      'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&h=450&fit=crop',
      'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&h=450&fit=crop',
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&h=450&fit=crop',
    ],
    team: [
      'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&h=200&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1556157382-97ede2916cd2?w=200&h=200&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&h=200&fit=crop&crop=face',
    ],
    products: [],
  },
};

function getImages(templateId: string) {
  return TEMPLATE_IMAGES[templateId] || TEMPLATE_IMAGES['obsidian-saas'];
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  const { templateId } = await context.params;
  const template = getTemplateById(templateId);

  if (!template) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  }

  const { config, name } = template;
  const { branding, business, sections } = config;
  const images = getImages(templateId);

  const isDark = branding.style === 'dark' || branding.style === 'bold';
  const bgColor = isDark ? '#09090b' : '#fafaf9';
  const textColor = isDark ? '#fafaf9' : '#09090b';
  const mutedColor = isDark ? '#a1a1aa' : '#71717a';
  const cardBg = isDark ? '#18181b' : '#ffffff';
  const borderColor = isDark ? '#27272a' : '#e4e4e7';
  const primaryColor = branding.primaryColor || '#7c3aed';
  const secondaryColor = branding.secondaryColor || '#0ea5e9';
  const fontHeading = branding.fontHeading || 'Inter';
  const fontBody = branding.fontBody || 'Inter';
  const sectionOrder = (sections || []).map((s) => s.type);

  function renderSection(type: string): string {
    switch (type) {
      case 'hero':
        return `
        <section style="position:relative;min-height:80vh;display:flex;align-items:center;justify-content:center;overflow:hidden;background:url('${images.hero}') center/cover no-repeat;">
          <div style="position:absolute;inset:0;background:${isDark ? 'linear-gradient(to bottom,rgba(0,0,0,0.6),rgba(0,0,0,0.8))' : 'linear-gradient(to bottom,rgba(0,0,0,0.3),rgba(0,0,0,0.6))'}"></div>
          <div style="text-align:center;max-width:800px;padding:60px 20px;position:relative;z-index:1;">
            <p style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:3px;color:${primaryColor};margin-bottom:16px;font-family:'${fontBody}',sans-serif;">${business.industry || 'Premium Template'}</p>
            <h1 class="hero-title" style="font-weight:800;line-height:1.1;margin-bottom:24px;font-family:'${fontHeading}',serif;color:white;">${business.tagline || business.name}</h1>
            <p class="hero-desc" style="line-height:1.7;color:rgba(255,255,255,0.8);max-width:600px;margin:0 auto 32px;font-family:'${fontBody}',sans-serif;">${business.description || ''}</p>
            <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
              <a href="#" class="btn-primary" style="display:inline-flex;align-items:center;background:${primaryColor};color:white;border-radius:12px;font-weight:600;text-decoration:none;box-shadow:0 4px 24px ${primaryColor}40;font-family:'${fontBody}',sans-serif;">Get Started</a>
              <a href="#" class="btn-outline" style="display:inline-flex;align-items:center;border:1.5px solid rgba(255,255,255,0.3);color:white;border-radius:12px;font-weight:600;text-decoration:none;font-family:'${fontBody}',sans-serif;">Learn More</a>
            </div>
          </div>
        </section>`;

      case 'features':
        return `
        <section class="section-pad" style="background:${bgColor};">
          <div class="container">
            <div style="text-align:center;margin-bottom:48px;">
              <p class="section-label" style="font-weight:600;text-transform:uppercase;letter-spacing:2px;color:${primaryColor};margin-bottom:12px;font-family:'${fontBody}',sans-serif;">Features</p>
              <h2 class="section-title" style="font-weight:700;color:${textColor};font-family:'${fontHeading}',serif;">Why Choose Us</h2>
            </div>
            <div class="grid-3">
              ${[{t:'Premium Quality',d:'Crafted with attention to every detail for an exceptional experience.'},{t:'Fast & Reliable',d:'Lightning-fast performance with 99.9% uptime guaranteed.'},{t:'Expert Support',d:'Dedicated team available around the clock for your needs.'}].map(f => `
              <div class="card" style="padding:28px;border-radius:16px;background:${cardBg};border:1px solid ${borderColor};transition:all 0.3s;">
                <div style="width:48px;height:48px;border-radius:12px;background:${primaryColor}15;display:flex;align-items:center;justify-content:center;margin-bottom:20px;">
                  <div style="width:24px;height:24px;border-radius:6px;background:${primaryColor};opacity:0.8;"></div>
                </div>
                <h3 style="font-size:18px;font-weight:600;color:${textColor};margin-bottom:8px;font-family:'${fontHeading}',serif;">${f.t}</h3>
                <p style="font-size:14px;line-height:1.7;color:${mutedColor};font-family:'${fontBody}',sans-serif;">${f.d}</p>
              </div>`).join('')}
            </div>
          </div>
        </section>`;

      case 'stats':
        return `
        <section style="padding:60px 20px;background:${isDark ? primaryColor + '10' : primaryColor + '05'};">
          <div class="stats-grid">
            ${[{n:'500+',l:'Happy Clients'},{n:'98%',l:'Satisfaction'},{n:'10+',l:'Years Experience'},{n:'24/7',l:'Support'}].map(s => `
            <div style="text-align:center;">
              <div class="stat-number" style="font-weight:800;color:${primaryColor};font-family:'${fontHeading}',serif;">${s.n}</div>
              <div style="font-size:13px;color:${mutedColor};margin-top:4px;font-family:'${fontBody}',sans-serif;">${s.l}</div>
            </div>`).join('')}
          </div>
        </section>`;

      case 'testimonials':
        return `
        <section class="section-pad" style="background:${bgColor};">
          <div class="container">
            <div style="text-align:center;margin-bottom:48px;">
              <p class="section-label" style="font-weight:600;text-transform:uppercase;letter-spacing:2px;color:${primaryColor};margin-bottom:12px;font-family:'${fontBody}',sans-serif;">Testimonials</p>
              <h2 class="section-title" style="font-weight:700;color:${textColor};font-family:'${fontHeading}',serif;">What People Say</h2>
            </div>
            <div class="grid-3">
              ${[{name:'Alex Chen',role:'CEO',img:images.team[0]||''},{name:'Sarah Kim',role:'Designer',img:images.team[1]||''},{name:'Mike Ross',role:'Developer',img:images.team[2]||''}].map(t => `
              <div class="card" style="padding:28px;border-radius:16px;background:${cardBg};border:1px solid ${borderColor};">
                <div style="font-size:28px;color:${primaryColor};margin-bottom:12px;opacity:0.3;font-family:serif;">&ldquo;</div>
                <p style="font-size:14px;line-height:1.8;color:${mutedColor};margin-bottom:20px;font-family:'${fontBody}',sans-serif;">Outstanding work that exceeded all of our expectations. The attention to detail and quality is truly remarkable.</p>
                <div style="display:flex;align-items:center;gap:12px;">
                  <img src="${t.img}" alt="${t.name}" style="width:44px;height:44px;border-radius:50%;object-fit:cover;border:2px solid ${borderColor};" onerror="this.style.display='none'" />
                  <div>
                    <div style="font-weight:600;color:${textColor};font-size:14px;font-family:'${fontBody}',sans-serif;">${t.name}</div>
                    <div style="font-size:12px;color:${mutedColor};font-family:'${fontBody}',sans-serif;">${t.role}</div>
                  </div>
                </div>
              </div>`).join('')}
            </div>
          </div>
        </section>`;

      case 'pricing':
        return `
        <section class="section-pad" style="background:${isDark ? primaryColor + '08' : bgColor};">
          <div class="container">
            <div style="text-align:center;margin-bottom:48px;">
              <p class="section-label" style="font-weight:600;text-transform:uppercase;letter-spacing:2px;color:${primaryColor};margin-bottom:12px;font-family:'${fontBody}',sans-serif;">Pricing</p>
              <h2 class="section-title" style="font-weight:700;color:${textColor};font-family:'${fontHeading}',serif;">Simple Pricing</h2>
            </div>
            <div class="pricing-grid">
              ${[{name:'Starter',price:'29',features:['5 Projects','10GB Storage','Basic Analytics','Email Support']},{name:'Pro',price:'79',featured:true,features:['Unlimited Projects','100GB Storage','Advanced Analytics','Priority Support','API Access']},{name:'Enterprise',price:'299',features:['Everything in Pro','Custom Integrations','SSO','Dedicated Support','SLA Guarantee']}].map(p => `
              <div class="card ${p.featured ? 'pricing-featured' : ''}" style="padding:28px;border-radius:16px;background:${cardBg};border:${p.featured ? '2px solid ' + primaryColor : '1px solid ' + borderColor};${p.featured ? 'box-shadow:0 8px 32px ' + primaryColor + '20;' : ''}">
                <h3 style="font-size:18px;font-weight:600;color:${textColor};margin-bottom:8px;font-family:'${fontHeading}',serif;">${p.name}</h3>
                <div style="font-size:40px;font-weight:800;color:${p.featured ? primaryColor : textColor};margin-bottom:24px;font-family:'${fontHeading}',serif;">$${p.price}<span style="font-size:16px;font-weight:400;color:${mutedColor};">/mo</span></div>
                ${p.features.map(f => `<div style="padding:8px 0;font-size:14px;color:${mutedColor};border-bottom:1px solid ${borderColor};font-family:'${fontBody}',sans-serif;">\u2713 ${f}</div>`).join('')}
                <a href="#" style="display:block;text-align:center;padding:12px;margin-top:24px;border-radius:10px;font-weight:600;font-size:14px;text-decoration:none;font-family:'${fontBody}',sans-serif;${p.featured ? 'background:' + primaryColor + ';color:white;box-shadow:0 4px 16px ' + primaryColor + '40;' : 'border:1.5px solid ' + borderColor + ';color:' + textColor + ';'}">Get Started</a>
              </div>`).join('')}
            </div>
          </div>
        </section>`;

      case 'gallery':
        return `
        <section class="section-pad" style="background:${isDark ? primaryColor + '05' : bgColor};">
          <div class="container">
            <div style="text-align:center;margin-bottom:48px;">
              <p class="section-label" style="font-weight:600;text-transform:uppercase;letter-spacing:2px;color:${primaryColor};margin-bottom:12px;font-family:'${fontBody}',sans-serif;">Gallery</p>
              <h2 class="section-title" style="font-weight:700;color:${textColor};font-family:'${fontHeading}',serif;">Our Work</h2>
            </div>
            <div class="grid-gallery">
              ${images.gallery.map(img => `
              <div style="border-radius:12px;overflow:hidden;border:1px solid ${borderColor};">
                <img src="${img}" alt="Gallery" style="width:100%;height:100%;object-fit:cover;aspect-ratio:4/3;display:block;" loading="lazy" />
              </div>`).join('')}
            </div>
          </div>
        </section>`;

      case 'team':
        return `
        <section class="section-pad" style="background:${isDark ? primaryColor + '05' : bgColor};">
          <div class="container">
            <div style="text-align:center;margin-bottom:48px;">
              <p class="section-label" style="font-weight:600;text-transform:uppercase;letter-spacing:2px;color:${primaryColor};margin-bottom:12px;font-family:'${fontBody}',sans-serif;">Team</p>
              <h2 class="section-title" style="font-weight:700;color:${textColor};font-family:'${fontHeading}',serif;">Meet Our Team</h2>
            </div>
            <div class="grid-team">
              ${[{name:'John Smith',role:'Founder'},{name:'Emily Chen',role:'Director'},{name:'David Park',role:'Lead Designer'},{name:'Lisa Wang',role:'Manager'}].map((m,i) => `
              <div style="text-align:center;">
                <img src="${images.team[i] || ''}" alt="${m.name}" style="width:120px;height:120px;border-radius:50%;object-fit:cover;margin:0 auto 16px;display:block;border:3px solid ${borderColor};" onerror="this.style.background='${primaryColor}15';this.style.display='block'" />
                <h3 style="font-size:15px;font-weight:600;color:${textColor};font-family:'${fontBody}',sans-serif;">${m.name}</h3>
                <p style="font-size:13px;color:${mutedColor};font-family:'${fontBody}',sans-serif;">${m.role}</p>
              </div>`).join('')}
            </div>
          </div>
        </section>`;

      case 'cta':
        return `
        <section style="padding:80px 20px;background:linear-gradient(135deg,${primaryColor} 0%,${secondaryColor || primaryColor} 100%);text-align:center;">
          <div style="max-width:600px;margin:0 auto;">
            <h2 class="section-title" style="font-weight:700;color:white;margin-bottom:16px;font-family:'${fontHeading}',serif;">Ready to Get Started?</h2>
            <p style="font-size:15px;color:rgba(255,255,255,0.8);margin-bottom:32px;font-family:'${fontBody}',sans-serif;">Join thousands of happy customers and transform your business today.</p>
            <a href="#" class="btn-primary" style="display:inline-flex;align-items:center;background:white;color:${primaryColor};border-radius:12px;font-weight:700;text-decoration:none;box-shadow:0 4px 24px rgba(0,0,0,0.15);font-family:'${fontBody}',sans-serif;">Start Now</a>
          </div>
        </section>`;

      case 'contact':
        return `
        <section class="section-pad" style="background:${bgColor};">
          <div style="max-width:600px;margin:0 auto;text-align:center;padding:0 4px;">
            <p class="section-label" style="font-weight:600;text-transform:uppercase;letter-spacing:2px;color:${primaryColor};margin-bottom:12px;font-family:'${fontBody}',sans-serif;">Contact</p>
            <h2 class="section-title" style="font-weight:700;color:${textColor};margin-bottom:16px;font-family:'${fontHeading}',serif;">Get in Touch</h2>
            <p style="font-size:15px;color:${mutedColor};margin-bottom:32px;font-family:'${fontBody}',sans-serif;">Have questions? We'd love to hear from you.</p>
            <div style="display:flex;flex-direction:column;gap:14px;">
              <input type="text" placeholder="Your Name" style="padding:12px 16px;border-radius:10px;border:1px solid ${borderColor};background:${cardBg};color:${textColor};font-size:16px;font-family:'${fontBody}',sans-serif;" />
              <input type="email" placeholder="Your Email" style="padding:12px 16px;border-radius:10px;border:1px solid ${borderColor};background:${cardBg};color:${textColor};font-size:16px;font-family:'${fontBody}',sans-serif;" />
              <textarea placeholder="Your Message" rows="4" style="padding:12px 16px;border-radius:10px;border:1px solid ${borderColor};background:${cardBg};color:${textColor};font-size:16px;resize:vertical;font-family:'${fontBody}',sans-serif;"></textarea>
              <a href="#" class="btn-primary" style="display:block;text-align:center;background:${primaryColor};color:white;border-radius:10px;font-weight:600;text-decoration:none;font-family:'${fontBody}',sans-serif;">Send Message</a>
            </div>
          </div>
        </section>`;

      case 'about':
        return `
        <section class="section-pad" style="background:${bgColor};">
          <div class="container about-grid">
            <div style="border-radius:16px;overflow:hidden;border:1px solid ${borderColor};">
              <img src="${images.gallery[0] || ''}" alt="About us" style="width:100%;aspect-ratio:4/3;object-fit:cover;display:block;" loading="lazy" />
            </div>
            <div>
              <p class="section-label" style="font-weight:600;text-transform:uppercase;letter-spacing:2px;color:${primaryColor};margin-bottom:12px;font-family:'${fontBody}',sans-serif;">About Us</p>
              <h2 class="section-title" style="font-weight:700;color:${textColor};margin-bottom:16px;font-family:'${fontHeading}',serif;">Our Story</h2>
              <p style="font-size:15px;line-height:1.8;color:${mutedColor};font-family:'${fontBody}',sans-serif;">${business.description || 'We are a dedicated team passionate about delivering excellence.'}</p>
            </div>
          </div>
        </section>`;

      case 'faq':
        return `
        <section class="section-pad" style="background:${bgColor};">
          <div style="max-width:700px;margin:0 auto;padding:0 4px;">
            <div style="text-align:center;margin-bottom:48px;">
              <p class="section-label" style="font-weight:600;text-transform:uppercase;letter-spacing:2px;color:${primaryColor};margin-bottom:12px;font-family:'${fontBody}',sans-serif;">FAQ</p>
              <h2 class="section-title" style="font-weight:700;color:${textColor};font-family:'${fontHeading}',serif;">Common Questions</h2>
            </div>
            ${[{q:'How does it work?',a:'Our streamlined process makes getting started easy. Simply reach out and we will guide you through every step.'},{q:'What is included?',a:'Everything you need to succeed. Full support, regular updates, and premium features.'},{q:'Can I cancel anytime?',a:'Absolutely. No long-term contracts or hidden fees. Cancel whenever you want.'}].map(f => `
            <div style="padding:20px 0;border-bottom:1px solid ${borderColor};">
              <h3 style="font-size:15px;font-weight:600;color:${textColor};margin-bottom:8px;font-family:'${fontBody}',sans-serif;">${f.q}</h3>
              <p style="font-size:14px;line-height:1.7;color:${mutedColor};font-family:'${fontBody}',sans-serif;">${f.a}</p>
            </div>`).join('')}
          </div>
        </section>`;

      case 'product-grid':
        return `
        <section class="section-pad" style="background:${bgColor};">
          <div class="container">
            <div style="text-align:center;margin-bottom:48px;">
              <h2 class="section-title" style="font-weight:700;color:${textColor};font-family:'${fontHeading}',serif;">Shop Collection</h2>
            </div>
            <div class="grid-products">
              ${[{name:'Essential Tee',price:'85'},{name:'Linen Trousers',price:'195'},{name:'Leather Tote',price:'340'},{name:'Cashmere Sweater',price:'280'}].map((p,i) => `
              <div style="border-radius:12px;overflow:hidden;border:1px solid ${borderColor};background:${cardBg};">
                <img src="${images.products[i] || images.gallery[i] || ''}" alt="${p.name}" style="width:100%;aspect-ratio:3/4;object-fit:cover;display:block;" loading="lazy" />
                <div style="padding:14px;">
                  <h3 style="font-size:15px;font-weight:500;color:${textColor};font-family:'${fontBody}',sans-serif;">${p.name}</h3>
                  <p style="font-size:14px;color:${mutedColor};margin-top:4px;font-family:'${fontBody}',sans-serif;">$${p.price}</p>
                </div>
              </div>`).join('')}
            </div>
          </div>
        </section>`;

      default:
        return '';
    }
  }

  const navbar = `
  <nav class="navbar" style="position:fixed;top:0;left:0;right:0;z-index:50;display:flex;align-items:center;justify-content:space-between;background:${isDark ? bgColor + 'ee' : 'rgba(255,255,255,0.9)'};backdrop-filter:blur(12px);border-bottom:1px solid ${borderColor};">
    <div style="font-size:18px;font-weight:700;color:${textColor};font-family:'${fontHeading}',serif;white-space:nowrap;">${business.name}</div>
    <div class="nav-links">
      <a href="#" style="font-size:14px;color:${mutedColor};text-decoration:none;font-family:'${fontBody}',sans-serif;">Home</a>
      <a href="#" style="font-size:14px;color:${mutedColor};text-decoration:none;font-family:'${fontBody}',sans-serif;">Features</a>
      <a href="#" style="font-size:14px;color:${mutedColor};text-decoration:none;font-family:'${fontBody}',sans-serif;">Pricing</a>
      <a href="#" style="font-size:14px;color:${mutedColor};text-decoration:none;font-family:'${fontBody}',sans-serif;">Contact</a>
    </div>
    <a href="#" class="nav-cta" style="display:inline-flex;padding:8px 20px;background:${primaryColor};color:white;border-radius:8px;font-weight:600;font-size:13px;text-decoration:none;font-family:'${fontBody}',sans-serif;white-space:nowrap;">Get Started</a>
  </nav>`;

  const footer = `
  <footer style="padding:48px 20px;background:${isDark ? '#09090b' : '#18181b'};color:#a1a1aa;">
    <div class="footer-grid">
      <div>
        <div style="font-size:18px;font-weight:700;color:white;margin-bottom:12px;font-family:'${fontHeading}',serif;">${business.name}</div>
        <p style="font-size:13px;line-height:1.7;font-family:'${fontBody}',sans-serif;">${business.description ? business.description.substring(0, 100) + '...' : 'Building the future, one step at a time.'}</p>
      </div>
      <div>
        <div style="font-size:13px;font-weight:600;color:white;text-transform:uppercase;letter-spacing:1px;margin-bottom:16px;font-family:'${fontBody}',sans-serif;">Company</div>
        <div style="display:flex;flex-direction:column;gap:8px;">
          <a href="#" style="font-size:13px;color:#a1a1aa;text-decoration:none;font-family:'${fontBody}',sans-serif;">About</a>
          <a href="#" style="font-size:13px;color:#a1a1aa;text-decoration:none;font-family:'${fontBody}',sans-serif;">Careers</a>
          <a href="#" style="font-size:13px;color:#a1a1aa;text-decoration:none;font-family:'${fontBody}',sans-serif;">Blog</a>
        </div>
      </div>
      <div>
        <div style="font-size:13px;font-weight:600;color:white;text-transform:uppercase;letter-spacing:1px;margin-bottom:16px;font-family:'${fontBody}',sans-serif;">Legal</div>
        <div style="display:flex;flex-direction:column;gap:8px;">
          <a href="#" style="font-size:13px;color:#a1a1aa;text-decoration:none;font-family:'${fontBody}',sans-serif;">Privacy</a>
          <a href="#" style="font-size:13px;color:#a1a1aa;text-decoration:none;font-family:'${fontBody}',sans-serif;">Terms</a>
        </div>
      </div>
    </div>
    <div style="max-width:1200px;margin:32px auto 0;padding-top:20px;border-top:1px solid #27272a;text-align:center;font-size:12px;">
      \u00A9 2025 ${business.name}. All rights reserved.
    </div>
  </footer>`;

  const googleFontsUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontHeading)}:wght@400;600;700;800&family=${encodeURIComponent(fontBody)}:wght@400;500;600&display=swap`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${name} - Preview</title>
  <link href="${googleFontsUrl}" rel="stylesheet" />
  <style>
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body { font-family: '${fontBody}', sans-serif; background: ${bgColor}; color: ${textColor}; -webkit-font-smoothing: antialiased; }
    a { cursor: pointer; }
    img { max-width: 100%; }
    input, textarea { outline: none; }
    input:focus, textarea:focus { border-color: ${primaryColor} !important; }
    .container { max-width: 1200px; margin: 0 auto; }
    .section-pad { padding: 80px 20px; }
    .section-label { font-size: 13px; }
    .section-title { font-size: clamp(26px, 4vw, 48px); }
    .hero-title { font-size: clamp(32px, 6vw, 72px); }
    .hero-desc { font-size: 16px; }
    .stat-number { font-size: clamp(28px, 4vw, 48px); }
    .btn-primary { padding: 12px 28px; font-size: 15px; }
    .btn-outline { padding: 12px 28px; font-size: 15px; }
    .navbar { padding: 12px 16px; }
    .nav-links { display: flex; gap: 24px; align-items: center; }
    .nav-cta { flex-shrink: 0; }
    .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
    .stats-grid { max-width: 1000px; margin: 0 auto; display: grid; grid-template-columns: repeat(4, 1fr); gap: 32px; }
    .pricing-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; max-width: 900px; margin: 0 auto; }
    .about-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; align-items: center; }
    .grid-team { display: grid; grid-template-columns: repeat(4, 1fr); gap: 32px; }
    .grid-gallery { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
    .grid-products { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
    .footer-grid { max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 40px; }
    .pricing-featured { transform: scale(1.03); }
    .card { transition: transform 0.3s, box-shadow 0.3s; }
    .card:hover { transform: translateY(-4px); box-shadow: 0 12px 40px rgba(0,0,0,0.1); }
    @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    section { animation: fadeInUp 0.6s ease-out both; }
    section:nth-child(2) { animation-delay: 0.1s; }
    section:nth-child(3) { animation-delay: 0.2s; }
    section:nth-child(4) { animation-delay: 0.3s; }
    @media (max-width: 1024px) {
      .grid-3 { grid-template-columns: repeat(2, 1fr); }
      .grid-team { grid-template-columns: repeat(2, 1fr); }
      .grid-products { grid-template-columns: repeat(2, 1fr); }
      .pricing-grid { grid-template-columns: repeat(2, 1fr); }
      .pricing-featured { transform: none; }
    }
    @media (max-width: 640px) {
      .section-pad { padding: 60px 16px; }
      .navbar { padding: 10px 14px; }
      .nav-links { display: none; }
      .nav-cta { padding: 7px 16px; font-size: 12px; }
      .hero-title { font-size: clamp(28px, 8vw, 44px); }
      .hero-desc { font-size: 14px; }
      .btn-primary { padding: 11px 22px; font-size: 14px; }
      .btn-outline { padding: 11px 22px; font-size: 14px; }
      .grid-3 { grid-template-columns: 1fr; }
      .stats-grid { grid-template-columns: repeat(2, 1fr); gap: 24px; }
      .pricing-grid { grid-template-columns: 1fr; max-width: 400px; }
      .pricing-featured { transform: none; }
      .about-grid { grid-template-columns: 1fr; gap: 32px; }
      .grid-team { grid-template-columns: repeat(2, 1fr); gap: 24px; }
      .grid-gallery { grid-template-columns: repeat(2, 1fr); }
      .grid-products { grid-template-columns: repeat(2, 1fr); gap: 12px; }
      .footer-grid { grid-template-columns: 1fr; gap: 32px; }
      .stat-number { font-size: clamp(24px, 6vw, 36px); }
    }
  </style>
</head>
<body>
  ${navbar}
  <div style="padding-top:52px;">
    ${sectionOrder.map((type) => renderSection(type)).join('')}
  </div>
  ${footer}
</body>
</html>`;

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
