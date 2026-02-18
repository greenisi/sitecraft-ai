import { NextRequest, NextResponse } from 'next/server';
import { getTemplateById } from '@/lib/templates/premium-templates';

interface RouteContext {
  params: Promise<{ templateId: string }>;
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

  const { config, name, description } = template;
  const { branding, business, sections } = config;

  const isDark =
    branding.style === 'dark' || branding.style === 'bold';

  const bgColor = isDark ? '#09090b' : '#fafaf9';
  const textColor = isDark ? '#fafaf9' : '#09090b';
  const mutedColor = isDark ? '#a1a1aa' : '#71717a';
  const cardBg = isDark ? '#18181b' : '#ffffff';
  const borderColor = isDark ? '#27272a' : '#e4e4e7';

  const primaryColor = branding.primaryColor || '#7c3aed';
  const secondaryColor = branding.secondaryColor || '#0ea5e9';
  const accentColor = branding.accentColor || '#a78bfa';

  const fontHeading = branding.fontHeading || 'Inter';
  const fontBody = branding.fontBody || 'Inter';

  const sectionOrder = (sections || []).map((s) => s.type);

  function renderSection(type: string, index: number): string {
    switch (type) {
      case 'hero':
        return `
          <section style="position:relative;min-height:80vh;display:flex;align-items:center;justify-content:center;overflow:hidden;background:${isDark ? 'linear-gradient(135deg, ' + bgColor + ' 0%, ' + primaryColor + '15 50%, ' + bgColor + ' 100%)' : 'linear-gradient(135deg, ' + bgColor + ' 0%, ' + primaryColor + '08 50%, ' + bgColor + ' 100%)'};">
            <div style="position:absolute;top:-100px;right:-100px;width:400px;height:400px;border-radius:50%;background:${primaryColor};opacity:0.08;filter:blur(80px);"></div>
            <div style="position:absolute;bottom:-80px;left:-80px;width:300px;height:300px;border-radius:50%;background:${secondaryColor};opacity:0.06;filter:blur(60px);"></div>
            <div style="text-align:center;max-width:800px;padding:80px 24px;position:relative;z-index:1;">
              <p style="font-size:14px;font-weight:600;text-transform:uppercase;letter-spacing:3px;color:${primaryColor};margin-bottom:16px;font-family:'${fontBody}',sans-serif;">${business.industry || 'Premium Template'}</p>
              <h1 style="font-size:clamp(36px,6vw,72px);font-weight:800;line-height:1.1;margin-bottom:24px;font-family:'${fontHeading}',serif;color:${textColor};background:linear-gradient(135deg,${textColor} 0%,${primaryColor} 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">${business.tagline || business.name}</h1>
              <p style="font-size:18px;line-height:1.7;color:${mutedColor};max-width:600px;margin:0 auto 40px;font-family:'${fontBody}',sans-serif;">${business.description || ''}</p>
              <div style="display:flex;gap:16px;justify-content:center;flex-wrap:wrap;">
                <a href="#" style="display:inline-flex;align-items:center;padding:14px 32px;background:${primaryColor};color:white;border-radius:12px;font-weight:600;text-decoration:none;font-size:15px;box-shadow:0 4px 24px ${primaryColor}40;transition:all 0.3s;font-family:'${fontBody}',sans-serif;">Get Started</a>
                <a href="#" style="display:inline-flex;align-items:center;padding:14px 32px;border:1.5px solid ${borderColor};color:${textColor};border-radius:12px;font-weight:600;text-decoration:none;font-size:15px;font-family:'${fontBody}',sans-serif;">Learn More</a>
              </div>
            </div>
          </section>
        `;

      case 'features':
        return `
          <section style="padding:100px 24px;background:${bgColor};">
            <div style="max-width:1200px;margin:0 auto;">
              <div style="text-align:center;margin-bottom:64px;">
                <p style="font-size:14px;font-weight:600;text-transform:uppercase;letter-spacing:2px;color:${primaryColor};margin-bottom:12px;font-family:'${fontBody}',sans-serif;">Features</p>
                <h2 style="font-size:clamp(28px,4vw,48px);font-weight:700;color:${textColor};font-family:'${fontHeading}',serif;">Why Choose Us</h2>
              </div>
              <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:32px;">
                ${[1,2,3].map(i => `
                  <div style="padding:32px;border-radius:16px;background:${cardBg};border:1px solid ${borderColor};transition:all 0.3s;">
                    <div style="width:48px;height:48px;border-radius:12px;background:${primaryColor}15;display:flex;align-items:center;justify-content:center;margin-bottom:20px;">
                      <div style="width:24px;height:24px;border-radius:6px;background:${primaryColor};opacity:0.8;"></div>
                    </div>
                    <h3 style="font-size:18px;font-weight:600;color:${textColor};margin-bottom:8px;font-family:'${fontHeading}',serif;">Feature ${i}</h3>
                    <p style="font-size:14px;line-height:1.7;color:${mutedColor};font-family:'${fontBody}',sans-serif;">Premium quality with attention to every detail, designed to help your business grow.</p>
                  </div>
                `).join('')}
              </div>
            </div>
          </section>
        `;

      case 'stats':
        return `
          <section style="padding:80px 24px;background:${isDark ? primaryColor + '10' : primaryColor + '05'};">
            <div style="max-width:1000px;margin:0 auto;display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:40px;text-align:center;">
              ${[{n:'500+',l:'Happy Clients'},{n:'98%',l:'Satisfaction'},{n:'10+',l:'Years Experience'},{n:'24/7',l:'Support'}].map(s => `
                <div>
                  <div style="font-size:clamp(32px,4vw,48px);font-weight:800;color:${primaryColor};font-family:'${fontHeading}',serif;">${s.n}</div>
                  <div style="font-size:14px;color:${mutedColor};margin-top:4px;font-family:'${fontBody}',sans-serif;">${s.l}</div>
                </div>
              `).join('')}
            </div>
          </section>
        `;

      case 'testimonials':
        return `
          <section style="padding:100px 24px;background:${bgColor};">
            <div style="max-width:1200px;margin:0 auto;">
              <div style="text-align:center;margin-bottom:64px;">
                <p style="font-size:14px;font-weight:600;text-transform:uppercase;letter-spacing:2px;color:${primaryColor};margin-bottom:12px;font-family:'${fontBody}',sans-serif;">Testimonials</p>
                <h2 style="font-size:clamp(28px,4vw,48px);font-weight:700;color:${textColor};font-family:'${fontHeading}',serif;">What People Say</h2>
              </div>
              <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:24px;">
                ${[{name:'Alex Chen',role:'CEO'},{name:'Sarah Kim',role:'Designer'},{name:'Mike Ross',role:'Developer'}].map(t => `
                  <div style="padding:32px;border-radius:16px;background:${cardBg};border:1px solid ${borderColor};">
                    <p style="font-size:15px;line-height:1.7;color:${mutedColor};margin-bottom:20px;font-style:italic;font-family:'${fontBody}',sans-serif;">"Outstanding work that exceeded all of our expectations. Highly recommend!"</p>
                    <div style="display:flex;align-items:center;gap:12px;">
                      <div style="width:40px;height:40px;border-radius:50%;background:${primaryColor}20;"></div>
                      <div>
                        <div style="font-weight:600;color:${textColor};font-size:14px;font-family:'${fontBody}',sans-serif;">${t.name}</div>
                        <div style="font-size:12px;color:${mutedColor};font-family:'${fontBody}',sans-serif;">${t.role}</div>
                      </div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          </section>
        `;

      case 'pricing':
        return `
          <section style="padding:100px 24px;background:${isDark ? primaryColor + '08' : bgColor};">
            <div style="max-width:1200px;margin:0 auto;">
              <div style="text-align:center;margin-bottom:64px;">
                <p style="font-size:14px;font-weight:600;text-transform:uppercase;letter-spacing:2px;color:${primaryColor};margin-bottom:12px;font-family:'${fontBody}',sans-serif;">Pricing</p>
                <h2 style="font-size:clamp(28px,4vw,48px);font-weight:700;color:${textColor};font-family:'${fontHeading}',serif;">Simple Pricing</h2>
              </div>
              <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:24px;max-width:900px;margin:0 auto;">
                ${[{name:'Starter',price:'29'},{name:'Pro',price:'79',featured:true},{name:'Enterprise',price:'299'}].map(p => `
                  <div style="padding:32px;border-radius:16px;background:${cardBg};border:${p.featured ? '2px solid ' + primaryColor : '1px solid ' + borderColor};${p.featured ? 'box-shadow:0 8px 32px ' + primaryColor + '20;transform:scale(1.05);' : ''}">
                    <h3 style="font-size:18px;font-weight:600;color:${textColor};margin-bottom:8px;font-family:'${fontHeading}',serif;">${p.name}</h3>
                    <div style="font-size:40px;font-weight:800;color:${p.featured ? primaryColor : textColor};margin-bottom:24px;font-family:'${fontHeading}',serif;">$${p.price}<span style="font-size:16px;font-weight:400;color:${mutedColor};">/mo</span></div>
                    ${[1,2,3,4].map(() => `<div style="padding:8px 0;font-size:14px;color:${mutedColor};border-bottom:1px solid ${borderColor};font-family:'${fontBody}',sans-serif;">\u2713 Feature included</div>`).join('')}
                    <a href="#" style="display:block;text-align:center;padding:12px;margin-top:24px;border-radius:10px;font-weight:600;font-size:14px;text-decoration:none;font-family:'${fontBody}',sans-serif;${p.featured ? 'background:' + primaryColor + ';color:white;box-shadow:0 4px 16px ' + primaryColor + '40;' : 'border:1.5px solid ' + borderColor + ';color:' + textColor + ';'}">Get Started</a>
                  </div>
                `).join('')}
              </div>
            </div>
          </section>
        `;

      case 'cta':
        return `
          <section style="padding:100px 24px;background:linear-gradient(135deg,${primaryColor} 0%,${secondaryColor || primaryColor} 100%);text-align:center;">
            <div style="max-width:600px;margin:0 auto;">
              <h2 style="font-size:clamp(28px,4vw,44px);font-weight:700;color:white;margin-bottom:16px;font-family:'${fontHeading}',serif;">Ready to Get Started?</h2>
              <p style="font-size:16px;color:rgba(255,255,255,0.8);margin-bottom:32px;font-family:'${fontBody}',sans-serif;">Join thousands of happy customers and transform your business today.</p>
              <a href="#" style="display:inline-flex;align-items:center;padding:14px 32px;background:white;color:${primaryColor};border-radius:12px;font-weight:700;text-decoration:none;font-size:15px;box-shadow:0 4px 24px rgba(0,0,0,0.15);font-family:'${fontBody}',sans-serif;">Start Now</a>
            </div>
          </section>
        `;

      case 'contact':
        return `
          <section style="padding:100px 24px;background:${bgColor};">
            <div style="max-width:600px;margin:0 auto;text-align:center;">
              <p style="font-size:14px;font-weight:600;text-transform:uppercase;letter-spacing:2px;color:${primaryColor};margin-bottom:12px;font-family:'${fontBody}',sans-serif;">Contact</p>
              <h2 style="font-size:clamp(28px,4vw,48px);font-weight:700;color:${textColor};margin-bottom:16px;font-family:'${fontHeading}',serif;">Get in Touch</h2>
              <p style="font-size:16px;color:${mutedColor};margin-bottom:40px;font-family:'${fontBody}',sans-serif;">Have questions? We'd love to hear from you.</p>
              <div style="display:flex;flex-direction:column;gap:16px;">
                <input type="text" placeholder="Your Name" style="padding:14px 16px;border-radius:10px;border:1px solid ${borderColor};background:${cardBg};color:${textColor};font-size:14px;font-family:'${fontBody}',sans-serif;" />
                <input type="email" placeholder="Your Email" style="padding:14px 16px;border-radius:10px;border:1px solid ${borderColor};background:${cardBg};color:${textColor};font-size:14px;font-family:'${fontBody}',sans-serif;" />
                <textarea placeholder="Your Message" rows="4" style="padding:14px 16px;border-radius:10px;border:1px solid ${borderColor};background:${cardBg};color:${textColor};font-size:14px;resize:vertical;font-family:'${fontBody}',sans-serif;"></textarea>
                <a href="#" style="display:block;text-align:center;padding:14px;background:${primaryColor};color:white;border-radius:10px;font-weight:600;text-decoration:none;font-size:15px;font-family:'${fontBody}',sans-serif;">Send Message</a>
              </div>
            </div>
          </section>
        `;

      case 'gallery':
        return `
          <section style="padding:100px 24px;background:${isDark ? primaryColor + '05' : bgColor};">
            <div style="max-width:1200px;margin:0 auto;">
              <div style="text-align:center;margin-bottom:64px;">
                <p style="font-size:14px;font-weight:600;text-transform:uppercase;letter-spacing:2px;color:${primaryColor};margin-bottom:12px;font-family:'${fontBody}',sans-serif;">Gallery</p>
                <h2 style="font-size:clamp(28px,4vw,48px);font-weight:700;color:${textColor};font-family:'${fontHeading}',serif;">Our Work</h2>
              </div>
              <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:16px;">
                ${[1,2,3,4,5,6].map(i => `
                  <div style="aspect-ratio:4/3;border-radius:12px;background:linear-gradient(${120 + i * 30}deg,${primaryColor}20,${secondaryColor || primaryColor}20);border:1px solid ${borderColor};"></div>
                `).join('')}
              </div>
            </div>
          </section>
        `;

      case 'about':
        return `
          <section style="padding:100px 24px;background:${bgColor};">
            <div style="max-width:1100px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:64px;align-items:center;">
              <div style="aspect-ratio:4/3;border-radius:16px;background:linear-gradient(135deg,${primaryColor}15,${secondaryColor || primaryColor}15);border:1px solid ${borderColor};"></div>
              <div>
                <p style="font-size:14px;font-weight:600;text-transform:uppercase;letter-spacing:2px;color:${primaryColor};margin-bottom:12px;font-family:'${fontBody}',sans-serif;">About Us</p>
                <h2 style="font-size:clamp(24px,3vw,40px);font-weight:700;color:${textColor};margin-bottom:16px;font-family:'${fontHeading}',serif;">Our Story</h2>
                <p style="font-size:16px;line-height:1.8;color:${mutedColor};font-family:'${fontBody}',sans-serif;">${business.description || 'We are a dedicated team passionate about delivering excellence. With years of experience and a commitment to quality, we help businesses achieve their goals.'}</p>
              </div>
            </div>
          </section>
        `;

      case 'team':
        return `
          <section style="padding:100px 24px;background:${isDark ? primaryColor + '05' : bgColor};">
            <div style="max-width:1200px;margin:0 auto;">
              <div style="text-align:center;margin-bottom:64px;">
                <p style="font-size:14px;font-weight:600;text-transform:uppercase;letter-spacing:2px;color:${primaryColor};margin-bottom:12px;font-family:'${fontBody}',sans-serif;">Team</p>
                <h2 style="font-size:clamp(28px,4vw,48px);font-weight:700;color:${textColor};font-family:'${fontHeading}',serif;">Meet Our Team</h2>
              </div>
              <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:32px;">
                ${[{name:'John Smith',role:'Founder'},{name:'Emily Chen',role:'Director'},{name:'David Park',role:'Lead Designer'},{name:'Lisa Wang',role:'Manager'}].map(m => `
                  <div style="text-align:center;">
                    <div style="width:120px;height:120px;border-radius:50%;background:${primaryColor}15;margin:0 auto 16px;border:2px solid ${borderColor};"></div>
                    <h3 style="font-size:16px;font-weight:600;color:${textColor};font-family:'${fontBody}',sans-serif;">${m.name}</h3>
                    <p style="font-size:13px;color:${mutedColor};font-family:'${fontBody}',sans-serif;">${m.role}</p>
                  </div>
                `).join('')}
              </div>
            </div>
          </section>
        `;

      case 'faq':
        return `
          <section style="padding:100px 24px;background:${bgColor};">
            <div style="max-width:700px;margin:0 auto;">
              <div style="text-align:center;margin-bottom:64px;">
                <p style="font-size:14px;font-weight:600;text-transform:uppercase;letter-spacing:2px;color:${primaryColor};margin-bottom:12px;font-family:'${fontBody}',sans-serif;">FAQ</p>
                <h2 style="font-size:clamp(28px,4vw,48px);font-weight:700;color:${textColor};font-family:'${fontHeading}',serif;">Common Questions</h2>
              </div>
              ${[{q:'How does it work?',a:'Our streamlined process makes getting started easy. Simply reach out and we will guide you through every step.'},{q:'What is included?',a:'Everything you need to succeed. Full support, regular updates, and premium features.'},{q:'Can I cancel anytime?',a:'Absolutely. No long-term contracts or hidden fees. Cancel whenever you want.'}].map(f => `
                <div style="padding:24px;border-bottom:1px solid ${borderColor};">
                  <h3 style="font-size:16px;font-weight:600;color:${textColor};margin-bottom:8px;font-family:'${fontBody}',sans-serif;">${f.q}</h3>
                  <p style="font-size:14px;line-height:1.7;color:${mutedColor};font-family:'${fontBody}',sans-serif;">${f.a}</p>
                </div>
              `).join('')}
            </div>
          </section>
        `;

      case 'product-grid':
        return `
          <section style="padding:100px 24px;background:${bgColor};">
            <div style="max-width:1200px;margin:0 auto;">
              <div style="text-align:center;margin-bottom:64px;">
                <h2 style="font-size:clamp(28px,4vw,48px);font-weight:700;color:${textColor};font-family:'${fontHeading}',serif;">Shop Collection</h2>
              </div>
              <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:24px;">
                ${[{name:'Product One',price:'85'},{name:'Product Two',price:'195'},{name:'Product Three',price:'340'},{name:'Product Four',price:'280'}].map(p => `
                  <div style="border-radius:12px;overflow:hidden;border:1px solid ${borderColor};background:${cardBg};">
                    <div style="aspect-ratio:3/4;background:${primaryColor}08;"></div>
                    <div style="padding:16px;">
                      <h3 style="font-size:15px;font-weight:500;color:${textColor};font-family:'${fontBody}',sans-serif;">${p.name}</h3>
                      <p style="font-size:14px;color:${mutedColor};margin-top:4px;font-family:'${fontBody}',sans-serif;">$${p.price}</p>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          </section>
        `;

      default:
        return '';
    }
  }

  const navbar = `
    <nav style="position:fixed;top:0;left:0;right:0;z-index:50;padding:16px 24px;display:flex;align-items:center;justify-content:space-between;background:${isDark ? bgColor + 'ee' : 'rgba(255,255,255,0.9)'};backdrop-filter:blur(12px);border-bottom:1px solid ${borderColor};">
      <div style="font-size:20px;font-weight:700;color:${textColor};font-family:'${fontHeading}',serif;">${business.name}</div>
      <div style="display:flex;gap:24px;align-items:center;">
        <a href="#" style="font-size:14px;color:${mutedColor};text-decoration:none;font-family:'${fontBody}',sans-serif;">Home</a>
        <a href="#" style="font-size:14px;color:${mutedColor};text-decoration:none;font-family:'${fontBody}',sans-serif;">Features</a>
        <a href="#" style="font-size:14px;color:${mutedColor};text-decoration:none;font-family:'${fontBody}',sans-serif;">Pricing</a>
        <a href="#" style="font-size:14px;color:${mutedColor};text-decoration:none;font-family:'${fontBody}',sans-serif;">Contact</a>
        <a href="#" style="display:inline-flex;padding:8px 20px;background:${primaryColor};color:white;border-radius:8px;font-weight:600;font-size:13px;text-decoration:none;font-family:'${fontBody}',sans-serif;">Get Started</a>
      </div>
    </nav>
  `;

  const footer = `
    <footer style="padding:60px 24px;background:${isDark ? '#09090b' : '#18181b'};color:#a1a1aa;">
      <div style="max-width:1200px;margin:0 auto;display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:40px;">
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
      <div style="max-width:1200px;margin:40px auto 0;padding-top:24px;border-top:1px solid #27272a;text-align:center;font-size:12px;">
        \u00A9 2025 ${business.name}. All rights reserved.
      </div>
    </footer>
  `;

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
    body {
      font-family: '${fontBody}', sans-serif;
      background: ${bgColor};
      color: ${textColor};
      -webkit-font-smoothing: antialiased;
    }
    a { cursor: pointer; }
    input, textarea { outline: none; }
    input:focus, textarea:focus { border-color: ${primaryColor} !important; }
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    section { animation: fadeInUp 0.6s ease-out both; }
    section:nth-child(2) { animation-delay: 0.1s; }
    section:nth-child(3) { animation-delay: 0.2s; }
    section:nth-child(4) { animation-delay: 0.3s; }
    @media (max-width: 768px) {
      nav > div:last-child > a:not(:last-child) { display: none !important; }
      section div[style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; }
    }
  </style>
</head>
<body>
  ${navbar}
  <div style="padding-top:64px;">
    ${sectionOrder.map((type, i) => renderSection(type, i)).join('')}
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
