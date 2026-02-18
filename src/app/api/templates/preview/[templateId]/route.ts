import { NextRequest, NextResponse } from 'next/server';
import { getTemplateById } from '@/lib/templates/premium-templates';

interface RouteContext {
  params: Promise<{ templateId: string }>;
}

const IMG: Record<string, { hero: string; gallery: string[]; team: string[]; products: string[] }> = {
  'obsidian-saas': {
    hero: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=1400&h=800&fit=crop',
    gallery: ['https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop','https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop','https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&h=400&fit=crop','https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&h=400&fit=crop'],
    team: ['https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face','https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face','https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face'],
    products: [],
  },
  'ivory-realty': {
    hero: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1400&h=800&fit=crop',
    gallery: ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=400&fit=crop','https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&h=400&fit=crop','https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=600&h=400&fit=crop','https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&h=400&fit=crop','https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600&h=400&fit=crop','https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=600&h=400&fit=crop'],
    team: ['https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&h=200&fit=crop&crop=face','https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=face','https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&h=200&fit=crop&crop=face'],
    products: [],
  },
  'titan-fitness': {
    hero: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1400&h=800&fit=crop',
    gallery: ['https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&h=400&fit=crop','https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=600&h=400&fit=crop','https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=600&h=400&fit=crop','https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&h=400&fit=crop','https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=600&h=400&fit=crop','https://images.unsplash.com/photo-1576678927484-cc907957088c?w=600&h=400&fit=crop'],
    team: ['https://images.unsplash.com/photo-1567013127542-490d757e51fc?w=200&h=200&fit=crop&crop=face','https://images.unsplash.com/photo-1548690312-e3b507d8c110?w=200&h=200&fit=crop&crop=face','https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=200&h=200&fit=crop&crop=face'],
    products: [],
  },
  'maison-restaurant': {
    hero: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1400&h=800&fit=crop',
    gallery: ['https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=400&fit=crop','https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=400&fit=crop','https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=600&h=400&fit=crop','https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=600&h=400&fit=crop','https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&h=400&fit=crop','https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=600&h=400&fit=crop'],
    team: ['https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=200&h=200&fit=crop&crop=face','https://images.unsplash.com/photo-1542178243-bc20204b769f?w=200&h=200&fit=crop&crop=face'],
    products: [],
  },
  'nova-agency': {
    hero: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1400&h=800&fit=crop',
    gallery: ['https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600&h=400&fit=crop','https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=600&h=400&fit=crop','https://images.unsplash.com/photo-1542744094-3a31f272c490?w=600&h=400&fit=crop','https://images.unsplash.com/photo-1523726491678-bf852e717f6a?w=600&h=400&fit=crop'],
    team: ['https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face','https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face','https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop&crop=face','https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face'],
    products: [],
  },
  'meridian-health': {
    hero: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1400&h=800&fit=crop',
    gallery: ['https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=600&h=400&fit=crop','https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=600&h=400&fit=crop','https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=600&h=400&fit=crop','https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&h=400&fit=crop'],
    team: ['https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&h=200&fit=crop&crop=face','https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200&h=200&fit=crop&crop=face','https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&h=200&fit=crop&crop=face'],
    products: [],
  },
  'luxe-ecommerce': {
    hero: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1400&h=800&fit=crop',
    gallery: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=400&fit=crop','https://images.unsplash.com/photo-1560343090-f0409e92791a?w=600&h=400&fit=crop'],
    team: [],
    products: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=500&fit=crop','https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&h=500&fit=crop','https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&h=500&fit=crop','https://images.unsplash.com/photo-1434389677669-e08b4cda3f0a?w=400&h=500&fit=crop','https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=400&h=500&fit=crop','https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=500&fit=crop'],
  },
  'axiom-law': {
    hero: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=1400&h=800&fit=crop',
    gallery: ['https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&h=400&fit=crop','https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&h=400&fit=crop','https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&h=400&fit=crop','https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&h=400&fit=crop'],
    team: ['https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&h=200&fit=crop&crop=face','https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=face','https://images.unsplash.com/photo-1556157382-97ede2916cd2?w=200&h=200&fit=crop&crop=face','https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&h=200&fit=crop&crop=face'],
    products: [],
  },
};

function getImages(id: string) { return IMG[id] || IMG['obsidian-saas']; }

function css(isDark: boolean, primary: string, secondary: string, fHead: string, fBody: string) {
  const bg = isDark ? '#09090b' : '#fafaf9';
  const txt = isDark ? '#fafaf9' : '#09090b';
  const muted = isDark ? '#a1a1aa' : '#71717a';
  const card = isDark ? '#18181b' : '#ffffff';
  const brd = isDark ? '#27272a' : '#e4e4e7';
  return `*{margin:0;padding:0;box-sizing:border-box}body{font-family:'${fBody}',sans-serif;background:${bg};color:${txt};-webkit-font-smoothing:antialiased}a{text-decoration:none;cursor:pointer}img{max-width:100%}
.ctn{max-width:1200px;margin:0 auto;padding:0 20px}
@keyframes fadeUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
section{animation:fadeUp .7s ease both}section:nth-child(2){animation-delay:.1s}section:nth-child(3){animation-delay:.2s}section:nth-child(4){animation-delay:.3s}
.card{transition:transform .3s,box-shadow .3s}.card:hover{transform:translateY(-4px);box-shadow:0 12px 40px rgba(0,0,0,.12)}
.glass{background:rgba(255,255,255,.05);backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,.08);border-radius:16px}
@media(max-width:768px){.hide-m{display:none!important}.g1{grid-template-columns:1fr!important}.g2{grid-template-columns:1fr!important}.g3{grid-template-columns:1fr!important}.g4{grid-template-columns:repeat(2,1fr)!important}.sp{padding:60px 16px!important}}`;
}

function nav(name: string, links: string[], ctaText: string, isDark: boolean, primary: string, fHead: string, fBody: string) {
  const bg = isDark ? 'rgba(9,9,11,.85)' : 'rgba(255,255,255,.9)';
  const brd = isDark ? '#27272a' : '#e4e4e7';
  const txt = isDark ? '#fafaf9' : '#09090b';
  const muted = isDark ? '#a1a1aa' : '#71717a';
  return `<nav style="position:fixed;top:0;left:0;right:0;z-index:50;padding:14px 20px;background:${bg};backdrop-filter:blur(12px);border-bottom:1px solid ${brd};display:flex;align-items:center;justify-content:space-between">
<div style="font-family:'${fHead}',serif;font-size:18px;font-weight:700;color:${txt};white-space:nowrap">${name}</div>
<div class="hide-m" style="display:flex;gap:24px;align-items:center">${links.map(l=>`<a href="#" style="font-size:14px;color:${muted}">${l}</a>`).join('')}</div>
<a href="#" style="padding:8px 20px;background:${primary};color:#fff;border-radius:8px;font-size:13px;font-weight:600;white-space:nowrap">${ctaText}</a></nav>`;
}

function footer(name: string, desc: string, isDark: boolean, fHead: string, fBody: string) {
  return `<footer style="padding:48px 20px;background:${isDark ? '#09090b' : '#18181b'};color:#a1a1aa;border-top:1px solid #27272a">
<div class="ctn g4" style="display:grid;grid-template-columns:2fr 1fr 1fr;gap:40px">
<div><div style="font-family:'${fHead}',serif;font-size:18px;font-weight:700;color:#fff;margin-bottom:12px">${name}</div><p style="font-size:13px;line-height:1.7;color:#71717a">${desc.substring(0,120)}</p></div>
<div><div style="font-size:12px;font-weight:600;color:#a1a1aa;text-transform:uppercase;letter-spacing:1px;margin-bottom:16px">Company</div><a href="#" style="display:block;font-size:13px;color:#71717a;margin-bottom:8px">About</a><a href="#" style="display:block;font-size:13px;color:#71717a;margin-bottom:8px">Careers</a><a href="#" style="display:block;font-size:13px;color:#71717a;margin-bottom:8px">Blog</a></div>
<div><div style="font-size:12px;font-weight:600;color:#a1a1aa;text-transform:uppercase;letter-spacing:1px;margin-bottom:16px">Legal</div><a href="#" style="display:block;font-size:13px;color:#71717a;margin-bottom:8px">Privacy</a><a href="#" style="display:block;font-size:13px;color:#71717a;margin-bottom:8px">Terms</a></div>
</div><div class="ctn" style="margin-top:32px;padding-top:20px;border-top:1px solid #27272a;text-align:center;font-size:12px;color:#52525b">\u00A9 2025 ${name}. All rights reserved.</div></footer>`;
}

function wrap(title: string, fHead: string, fBody: string, isDark: boolean, primary: string, secondary: string, body: string) {
  const gf = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fHead)}:wght@400;600;700;800&family=${encodeURIComponent(fBody)}:wght@400;500;600&display=swap`;
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>${title}</title><link href="${gf}" rel="stylesheet"/><style>${css(isDark,primary,secondary,fHead,fBody)}</style></head><body>${body}</body></html>`;
}

/* ============ SAAS ============ */
function buildSaas(im: typeof IMG[string]): string {
  const d = true, p = '#7c3aed', s = '#0ea5e9', fH = 'Space Grotesk', fB = 'Inter';
  let b = nav('\u2B22 Obsidian','Features,Pricing,Docs'.split(','),'Start Free',d,p,fH,fB);
  b += `<section style="min-height:100vh;display:flex;align-items:center;position:relative;overflow:hidden;padding:120px 20px 80px">
<div style="position:absolute;top:-100px;right:-100px;width:500px;height:500px;background:radial-gradient(circle,${p}30 0%,transparent 70%);border-radius:50%"></div>
<div style="position:absolute;bottom:-80px;left:-60px;width:400px;height:400px;background:radial-gradient(circle,${s}20 0%,transparent 70%);border-radius:50%"></div>
<div class="ctn g2" style="display:grid;grid-template-columns:1fr 1fr;gap:60px;align-items:center">
<div>
<div style="display:inline-flex;align-items:center;gap:8px;padding:6px 14px;border-radius:20px;background:${p}18;border:1px solid ${p}40;margin-bottom:24px"><div style="width:8px;height:8px;border-radius:50%;background:${p}"></div><span style="font-size:12px;color:#a78bfa;font-weight:600">NOW IN BETA</span></div>
<h1 style="font-family:'${fH}',sans-serif;font-size:clamp(36px,5vw,64px);font-weight:700;line-height:1.1;margin-bottom:20px">The Future of<br/><span style="background:linear-gradient(135deg,${p},${s});-webkit-background-clip:text;-webkit-text-fill-color:transparent">Work, Automated</span></h1>
<p style="font-size:17px;line-height:1.7;color:#a1a1aa;max-width:500px;margin-bottom:32px">AI-powered platform that transforms how teams collaborate, automate and ship products 3x faster.</p>
<div style="display:flex;gap:12px;flex-wrap:wrap"><a href="#" style="padding:14px 32px;background:${p};color:#fff;border-radius:12px;font-weight:600;box-shadow:0 4px 30px ${p}50">Start Free Trial</a><a href="#" style="padding:14px 32px;border:1px solid #27272a;color:#fafaf9;border-radius:12px;font-weight:600">Watch Demo \u25B6</a></div>
<div style="display:flex;gap:20px;margin-top:24px;font-size:12px;color:#71717a"><span>\u2713 No credit card</span><span>\u2713 14-day trial</span><span>\u2713 Cancel anytime</span></div>
</div>
<div class="hide-m glass" style="padding:20px;animation:float 4s ease-in-out infinite">
<div style="display:flex;gap:8px;margin-bottom:14px"><div style="width:12px;height:12px;border-radius:50%;background:#ef4444"></div><div style="width:12px;height:12px;border-radius:50%;background:#f59e0b"></div><div style="width:12px;height:12px;border-radius:50%;background:#22c55e"></div></div>
<div style="background:#18181b;border-radius:12px;padding:20px;border:1px solid #27272a">
<div style="display:flex;justify-content:space-between;margin-bottom:16px"><span style="font-size:14px;font-weight:600">Dashboard</span><span style="font-size:12px;color:#22c55e">\u2191 24%</span></div>
<div style="display:flex;gap:6px;margin-bottom:16px">${[75,45,90,60,85,40,95].map(h=>`<div style="flex:1;background:linear-gradient(to top,${p},${s});border-radius:4px;height:${h}px;opacity:.7"></div>`).join('')}</div>
<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px">${[{v:'12.4k',l:'Users'},{v:'$48.2k',l:'Revenue'},{v:'+24%',l:'Growth'}].map(x=>`<div style="background:#09090b;border-radius:8px;padding:10px;text-align:center;border:1px solid #27272a"><div style="font-size:15px;font-weight:700;color:${p}">${x.v}</div><div style="font-size:10px;color:#71717a">${x.l}</div></div>`).join('')}</div>
</div></div></div></section>`;

  b += `<section style="padding:40px 20px;border-top:1px solid #27272a;border-bottom:1px solid #27272a"><div class="ctn" style="text-align:center"><p style="font-size:12px;color:#52525b;text-transform:uppercase;letter-spacing:2px;margin-bottom:16px">Trusted by 500+ teams</p><div style="display:flex;justify-content:center;gap:40px;flex-wrap:wrap;opacity:.4">${['Stripe','Notion','Slack','Linear','Vercel'].map(n=>`<span style="font-family:'${fH}',sans-serif;font-size:17px;font-weight:700;color:#71717a">${n}</span>`).join('')}</div></div></section>`;

  b += `<section style="padding:100px 20px"><div class="ctn"><div style="text-align:center;margin-bottom:60px"><p style="font-size:13px;color:${p};text-transform:uppercase;letter-spacing:2px;font-weight:600;margin-bottom:12px">Features</p><h2 style="font-family:'${fH}',sans-serif;font-size:clamp(28px,4vw,44px);font-weight:700">Everything You Need to Ship Faster</h2></div>
<div class="g3" style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px">${[{i:'\u26A1',t:'AI Automation',d:'Automate repetitive workflows with intelligent AI agents.'},{i:'\u{1F91D}',t:'Team Collaboration',d:'Real-time collaboration with live cursors and instant sync.'},{i:'\u{1F4CA}',t:'Analytics Dashboard',d:'Powerful insights with beautiful charts and reports.'},{i:'\u{1F50C}',t:'200+ Integrations',d:'Connect your favorite tools via REST API and webhooks.'},{i:'\u{1F512}',t:'Enterprise Security',d:'SOC2 compliant with SSO, RBAC and audit logs.'},{i:'\u{1F680}',t:'99.9% Uptime',d:'Global CDN with auto-scaling for any workload.'}].map(f=>`<div class="glass card" style="padding:28px"><div style="font-size:28px;margin-bottom:14px">${f.i}</div><h3 style="font-family:'${fH}',sans-serif;font-size:17px;font-weight:600;margin-bottom:8px">${f.t}</h3><p style="font-size:14px;line-height:1.7;color:#a1a1aa">${f.d}</p></div>`).join('')}</div></div></section>`;

  b += `<section style="padding:80px 20px;background:linear-gradient(135deg,${p}10,${s}10)"><div class="ctn g4" style="display:grid;grid-template-columns:repeat(4,1fr);gap:32px;text-align:center">${[{n:'50K+',l:'Active Users'},{n:'99.9%',l:'Uptime'},{n:'2M+',l:'API Calls/Day'},{n:'150+',l:'Integrations'}].map(x=>`<div><div style="font-family:'${fH}',sans-serif;font-size:clamp(28px,4vw,48px);font-weight:800;background:linear-gradient(135deg,${p},${s});-webkit-background-clip:text;-webkit-text-fill-color:transparent">${x.n}</div><div style="font-size:14px;color:#71717a;margin-top:4px">${x.l}</div></div>`).join('')}</div></section>`;

  b += `<section style="padding:100px 20px"><div class="ctn"><div style="text-align:center;margin-bottom:60px"><p style="font-size:13px;color:${p};text-transform:uppercase;letter-spacing:2px;font-weight:600;margin-bottom:12px">Pricing</p><h2 style="font-family:'${fH}',sans-serif;font-size:clamp(28px,4vw,44px);font-weight:700">Start Free, Scale as You Grow</h2></div>
<div class="g3" style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px;max-width:960px;margin:0 auto">${[{n:'Starter',pr:'0',s:'Free forever',f:['5 projects','1GB storage','Community support'],ft:false},{n:'Pro',pr:'79',s:'/month',f:['Unlimited projects','100GB storage','Priority support','API access','Custom domains'],ft:true},{n:'Enterprise',pr:'299',s:'/month',f:['Everything in Pro','SSO & SAML','Dedicated CSM','SLA guarantee'],ft:false}].map(t=>`<div class="card" style="padding:32px;border-radius:20px;background:${t.ft?p+'10':'#18181b'};border:${t.ft?'2px solid '+p:'1px solid #27272a'};${t.ft?'box-shadow:0 8px 40px '+p+'20;':''}">
${t.ft?'<div style="font-size:11px;color:'+p+';text-transform:uppercase;letter-spacing:2px;font-weight:700;margin-bottom:12px">\u2B50 Most Popular</div>':''}
<h3 style="font-family:\''+fH+'\',sans-serif;font-size:20px;font-weight:600;margin-bottom:8px">${t.n}</h3>
<div style="margin-bottom:24px"><span style="font-family:\''+fH+'\',sans-serif;font-size:40px;font-weight:800;color:${t.ft?p:'#fafaf9'}">$${t.pr}</span><span style="font-size:14px;color:#71717a"> ${t.s}</span></div>
${t.f.map(x=>`<div style="padding:7px 0;font-size:14px;color:#a1a1aa"><span style="color:${p};margin-right:8px">\u2713</span>${x}</div>`).join('')}
<a href="#" style="display:block;text-align:center;padding:14px;margin-top:24px;border-radius:12px;font-weight:600;font-size:14px;${t.ft?'background:'+p+';color:#fff;box-shadow:0 4px 20px '+p+'40':'border:1px solid #27272a;color:#fafaf9'}">Get Started</a></div>`).join('')}</div></div></section>`;

  b += `<section style="padding:100px 20px"><div class="ctn"><div style="text-align:center;margin-bottom:60px"><h2 style="font-family:'${fH}',sans-serif;font-size:clamp(28px,4vw,44px);font-weight:700">Loved by Teams</h2></div>
<div class="g3" style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px">${[{n:'Sarah Chen',r:'CTO, TechFlow',img:im.team[1]},{n:'Alex Rivera',r:'PM, ScaleUp',img:im.team[0]},{n:'Jordan Lee',r:'Dev Lead, Nexus',img:im.team[2]}].map(t=>`<div class="glass" style="padding:28px"><div style="margin-bottom:8px;color:#f59e0b">\u2605\u2605\u2605\u2605\u2605</div><p style="font-size:14px;line-height:1.8;color:#a1a1aa;margin-bottom:20px">"This tool completely changed how our team ships. We went from weekly to daily deploys."</p><div style="display:flex;align-items:center;gap:12px"><img src="${t.img}" style="width:40px;height:40px;border-radius:50%;object-fit:cover" onerror="this.style.display='none'"/><div><div style="font-weight:600;font-size:14px">${t.n}</div><div style="font-size:12px;color:#71717a">${t.r}</div></div></div></div>`).join('')}</div></div></section>`;

  b += `<section style="padding:100px 20px;text-align:center;position:relative;overflow:hidden"><div style="position:absolute;inset:0;background:radial-gradient(ellipse at center,${p}15 0%,transparent 70%)"></div><div style="position:relative;max-width:600px;margin:0 auto"><h2 style="font-family:'${fH}',sans-serif;font-size:clamp(28px,4vw,44px);font-weight:700;margin-bottom:16px">Ready to Ship Faster?</h2><p style="font-size:16px;color:#a1a1aa;margin-bottom:32px">Join 50,000+ developers building with Obsidian.</p><a href="#" style="padding:16px 40px;background:${p};color:#fff;border-radius:12px;font-weight:700;font-size:16px;box-shadow:0 4px 30px ${p}50;display:inline-block">Get Started Free \u2192</a></div></section>`;

  b += footer('Obsidian','AI-powered platform for modern teams.',d,fH,fB);
  return wrap('Obsidian SaaS',fH,fB,d,p,s,b);
}

/* ============ REAL ESTATE ============ */
function buildRealty(im: typeof IMG[string]): string {
  const d = false, p = '#1c1917', s = '#d4af37', fH = 'Playfair Display', fB = 'Inter';
  let b = `<nav style="position:fixed;top:0;left:0;right:0;z-index:50;padding:14px 20px;background:rgba(250,250,249,.92);backdrop-filter:blur(12px);border-bottom:1px solid #e4e4e7;display:flex;align-items:center;justify-content:space-between">
<div style="font-family:'${fH}',serif;font-size:20px;font-weight:700;color:${p}">Ivory <span style="color:${s}">Realty</span></div>
<div class="hide-m" style="display:flex;gap:24px"><a href="#" style="font-size:14px;color:#71717a">Listings</a><a href="#" style="font-size:14px;color:#71717a">About</a><a href="#" style="font-size:14px;color:#71717a">Agents</a><a href="#" style="font-size:14px;color:#71717a">Contact</a></div>
<a href="#" style="padding:8px 20px;background:${p};color:#fff;border-radius:8px;font-size:13px;font-weight:600">Schedule Tour</a></nav>`;

  b += `<section style="min-height:90vh;display:flex;align-items:center;position:relative;overflow:hidden;background:url('${im.hero}') center/cover no-repeat">
<div style="position:absolute;inset:0;background:linear-gradient(to bottom,rgba(0,0,0,.3),rgba(0,0,0,.65))"></div>
<div style="position:relative;z-index:1;text-align:center;max-width:800px;margin:0 auto;padding:120px 20px 80px">
<div style="width:60px;height:2px;background:${s};margin:0 auto 20px"></div>
<h1 style="font-family:'${fH}',serif;font-size:clamp(36px,6vw,68px);font-weight:700;color:#fff;line-height:1.1;margin-bottom:20px">Where Luxury<br/>Meets Home</h1>
<p style="font-size:17px;color:rgba(255,255,255,.8);max-width:550px;margin:0 auto 32px;line-height:1.7">Exclusive properties in the most prestigious neighborhoods. White-glove service for discerning buyers.</p>
<div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
<a href="#" style="padding:14px 32px;background:${s};color:${p};border-radius:8px;font-weight:600">View Listings</a>
<a href="#" style="padding:14px 32px;border:1.5px solid rgba(255,255,255,.4);color:#fff;border-radius:8px;font-weight:600">Schedule a Tour</a></div>
</div></section>`;

  // FEATURED LISTINGS with beds/baths/sqft
  b += `<section class="sp" style="padding:100px 20px"><div class="ctn">
<div style="text-align:center;margin-bottom:60px"><p style="font-size:13px;color:${s};text-transform:uppercase;letter-spacing:3px;font-weight:600;margin-bottom:12px">Featured Listings</p><h2 style="font-family:'${fH}',serif;font-size:clamp(28px,4vw,44px);font-weight:700;color:${p}">Exceptional Properties</h2></div>
<div class="g3" style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px">
${[{img:im.gallery[0],price:'$2,450,000',addr:'1847 Sunset Ridge Dr',city:'Beverly Hills, CA',beds:5,baths:4,sqft:'4,200'},{img:im.gallery[1],price:'$1,875,000',addr:'320 Ocean View Terrace',city:'Malibu, CA',beds:4,baths:3,sqft:'3,800'},{img:im.gallery[2],price:'$3,200,000',addr:'9 Hillcrest Estate Lane',city:'Bel Air, CA',beds:6,baths:5,sqft:'5,600'}].map(l=>`
<div class="card" style="border-radius:16px;overflow:hidden;border:1px solid #e4e4e7;background:#fff">
<div style="position:relative"><img src="${l.img}" style="width:100%;height:220px;object-fit:cover;display:block" loading="lazy"/>
<div style="position:absolute;top:12px;left:12px;background:${s};color:${p};padding:4px 12px;border-radius:6px;font-size:12px;font-weight:700">Featured</div></div>
<div style="padding:20px">
<div style="font-family:'${fH}',serif;font-size:24px;font-weight:700;color:${p};margin-bottom:4px">${l.price}</div>
<div style="font-size:15px;font-weight:600;color:#1c1917;margin-bottom:2px">${l.addr}</div>
<div style="font-size:13px;color:#71717a;margin-bottom:16px">${l.city}</div>
<div style="display:flex;gap:16px;padding-top:14px;border-top:1px solid #e4e4e7">
<div style="display:flex;align-items:center;gap:4px;font-size:13px;color:#71717a"><strong style="color:#1c1917">${l.beds}</strong> Beds</div>
<div style="display:flex;align-items:center;gap:4px;font-size:13px;color:#71717a"><strong style="color:#1c1917">${l.baths}</strong> Baths</div>
<div style="display:flex;align-items:center;gap:4px;font-size:13px;color:#71717a"><strong style="color:#1c1917">${l.sqft}</strong> Sq Ft</div>
</div></div></div>`).join('')}</div></div></section>`;

  // STATS
  b += `<section style="padding:80px 20px;background:${p}"><div class="ctn g4" style="display:grid;grid-template-columns:repeat(4,1fr);gap:32px;text-align:center">${[{n:'$2B+',l:'In Sales Volume'},{n:'500+',l:'Homes Sold'},{n:'15+',l:'Years Experience'},{n:'98%',l:'Client Satisfaction'}].map(x=>`<div><div style="font-family:'${fH}',serif;font-size:clamp(28px,4vw,44px);font-weight:700;color:${s}">${x.n}</div><div style="font-size:13px;color:rgba(255,255,255,.6);margin-top:4px">${x.l}</div></div>`).join('')}</div></section>`;

  // WHY CHOOSE US
  b += `<section class="sp" style="padding:100px 20px"><div class="ctn"><div style="text-align:center;margin-bottom:60px"><p style="font-size:13px;color:${s};text-transform:uppercase;letter-spacing:3px;font-weight:600;margin-bottom:12px">Why Choose Us</p><h2 style="font-family:'${fH}',serif;font-size:clamp(28px,4vw,44px);font-weight:700;color:${p}">The Ivory Difference</h2></div>
<div class="g3" style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px">${[{i:'\u{1F3E0}',t:'Exclusive Listings',d:'Access to off-market and pre-launch luxury properties.'},{i:'\u{1F4B0}',t:'Market Expertise',d:'Data-driven pricing strategies to maximize your investment.'},{i:'\u{1F91D}',t:'White-Glove Service',d:'Dedicated concierge from first viewing to closing day.'}].map(f=>`<div class="card" style="padding:32px;border-radius:16px;border:1px solid #e4e4e7;background:#fff;text-align:center"><div style="font-size:32px;margin-bottom:16px">${f.i}</div><h3 style="font-family:'${fH}',serif;font-size:18px;font-weight:600;color:${p};margin-bottom:8px">${f.t}</h3><p style="font-size:14px;line-height:1.7;color:#71717a">${f.d}</p></div>`).join('')}</div></div></section>`;

  // AGENTS
  b += `<section class="sp" style="padding:80px 20px;background:#fafaf5"><div class="ctn"><div style="text-align:center;margin-bottom:60px"><p style="font-size:13px;color:${s};text-transform:uppercase;letter-spacing:3px;font-weight:600;margin-bottom:12px">Our Agents</p><h2 style="font-family:'${fH}',serif;font-size:clamp(28px,4vw,44px);font-weight:700;color:${p}">Meet Your Advisors</h2></div>
<div class="g3" style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px">${[{n:'James Mitchell',r:'Senior Partner',s:'$500M+ in Sales',img:im.team[0]},{n:'Victoria Chen',r:'Luxury Specialist',s:'Top 1% Agent',img:im.team[1]},{n:'Robert Davis',r:'Commercial Director',s:'20+ Years Exp.',img:im.team[2]}].map(a=>`<div style="text-align:center"><img src="${a.img}" style="width:140px;height:140px;border-radius:50%;object-fit:cover;margin:0 auto 16px;display:block;border:3px solid ${s}" onerror="this.style.display='none'"/><h3 style="font-family:'${fH}',serif;font-size:18px;font-weight:600;color:${p}">${a.n}</h3><p style="font-size:13px;color:#71717a">${a.r}</p><p style="font-size:12px;color:${s};font-weight:600;margin-top:4px">${a.s}</p></div>`).join('')}</div></div></section>`;

  // TESTIMONIAL
  b += `<section class="sp" style="padding:100px 20px;background:${p}"><div style="max-width:700px;margin:0 auto;text-align:center">
<div style="font-family:'${fH}',serif;font-size:64px;color:${s};opacity:.3">&ldquo;</div>
<p style="font-family:'${fH}',serif;font-size:clamp(18px,3vw,24px);line-height:1.7;color:rgba(255,255,255,.9);margin-bottom:24px;font-style:italic">They found us our dream home in a neighborhood we never thought we could afford. The service was impeccable from start to finish.</p>
<div style="width:40px;height:2px;background:${s};margin:0 auto 16px"></div>
<p style="font-size:14px;color:rgba(255,255,255,.7)">Michael & Sarah Thompson</p>
</div></section>`;

  // CTA
  b += `<section style="padding:100px 20px;background:url('${im.gallery[3]}') center/cover no-repeat;position:relative"><div style="position:absolute;inset:0;background:rgba(0,0,0,.6)"></div><div style="position:relative;z-index:1;text-align:center;max-width:600px;margin:0 auto"><div style="width:60px;height:2px;background:${s};margin:0 auto 20px"></div><h2 style="font-family:'${fH}',serif;font-size:clamp(28px,4vw,44px);font-weight:700;color:#fff;margin-bottom:16px">Find Your Dream Home</h2><p style="font-size:16px;color:rgba(255,255,255,.8);margin-bottom:32px">Schedule a private consultation with one of our expert advisors.</p><a href="#" style="padding:14px 36px;background:${s};color:${p};border-radius:8px;font-weight:700;font-size:15px;display:inline-block">Book a Consultation</a></div></section>`;

  b += footer('Ivory Realty','Premier luxury real estate with white-glove service.',false,fH,fB);
  return wrap('Ivory Realty',fH,fB,false,p,s,b);
}

/* ============ FITNESS ============ */
function buildFitness(im: typeof IMG[string]): string {
  const d = true, p = '#f97316', s = '#f97316', fH = 'Outfit', fB = 'Inter';
  let b = `<nav style="position:fixed;top:0;left:0;right:0;z-index:50;padding:14px 20px;background:rgba(9,9,11,.9);backdrop-filter:blur(12px);border-bottom:1px solid #27272a;display:flex;align-items:center;justify-content:space-between">
<div style="font-family:'${fH}',sans-serif;font-size:20px;font-weight:700;color:#fff">TITAN <span style="color:${p}">FITNESS</span></div>
<div class="hide-m" style="display:flex;gap:24px"><a href="#" style="font-size:14px;color:#a1a1aa">Classes</a><a href="#" style="font-size:14px;color:#a1a1aa">Trainers</a><a href="#" style="font-size:14px;color:#a1a1aa">Pricing</a><a href="#" style="font-size:14px;color:#a1a1aa">Contact</a></div>
<a href="#" style="padding:8px 20px;background:${p};color:#fff;border-radius:8px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px">Join Now</a></nav>`;

  b += `<section style="min-height:100vh;display:flex;align-items:center;position:relative;overflow:hidden;background:url('${im.hero}') center/cover no-repeat">
<div style="position:absolute;inset:0;background:linear-gradient(135deg,rgba(0,0,0,.8),rgba(0,0,0,.6))"></div>
<div style="position:absolute;top:0;right:0;width:400px;height:400px;background:radial-gradient(circle,${p}20 0%,transparent 70%)"></div>
<div style="position:relative;z-index:1;padding:120px 20px 80px;max-width:700px;margin:0 auto;text-align:center">
<div style="display:inline-block;padding:6px 16px;background:${p}20;border:1px solid ${p}40;border-radius:20px;font-size:12px;color:${p};font-weight:700;text-transform:uppercase;letter-spacing:2px;margin-bottom:20px">\u{1F525} NOW OPEN</div>
<h1 style="font-family:'${fH}',sans-serif;font-size:clamp(40px,7vw,80px);font-weight:800;color:#fff;line-height:1;margin-bottom:20px;text-transform:uppercase">FORGED IN<br/><span style="color:${p}">IRON</span></h1>
<p style="font-size:17px;color:#a1a1aa;max-width:500px;margin:0 auto 32px">Premium training facility with world-class coaches. Transform your body. Transform your life.</p>
<div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
<a href="#" style="padding:16px 36px;background:${p};color:#fff;border-radius:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;box-shadow:0 4px 30px ${p}40">Start Free Trial</a>
<a href="#" style="padding:16px 36px;border:2px solid #27272a;color:#fff;border-radius:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px">View Schedule</a></div></div></section>`;

  // STATS
  b += `<section style="padding:60px 20px;background:#18181b;border-top:2px solid ${p}"><div class="ctn g4" style="display:grid;grid-template-columns:repeat(4,1fr);gap:32px;text-align:center">${[{n:'5,000+',l:'Members Strong'},{n:'50+',l:'Classes/Week'},{n:'15',l:'Expert Trainers'},{n:'98%',l:'Reach Their Goals'}].map(x=>`<div><div style="font-family:'${fH}',sans-serif;font-size:clamp(28px,4vw,48px);font-weight:800;color:${p}">${x.n}</div><div style="font-size:13px;color:#71717a;text-transform:uppercase;letter-spacing:1px;margin-top:4px">${x.l}</div></div>`).join('')}</div></section>`;

  // CLASSES
  b += `<section class="sp" style="padding:100px 20px;background:#09090b"><div class="ctn"><div style="text-align:center;margin-bottom:60px"><p style="font-size:13px;color:${p};text-transform:uppercase;letter-spacing:3px;font-weight:700;margin-bottom:12px">Our Classes</p><h2 style="font-family:'${fH}',sans-serif;font-size:clamp(28px,4vw,44px);font-weight:800;color:#fff;text-transform:uppercase">Train Your Way</h2></div>
<div class="g3" style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px">${[{img:im.gallery[0],t:'HIIT Training',d:'45 min \u2022 All Levels',cal:'600-800 cal'},{img:im.gallery[1],t:'Strength & Power',d:'60 min \u2022 Intermediate',cal:'500-700 cal'},{img:im.gallery[2],t:'Boxing Cardio',d:'45 min \u2022 All Levels',cal:'700-900 cal'},{img:im.gallery[3],t:'Yoga Flow',d:'60 min \u2022 All Levels',cal:'300-400 cal'},{img:im.gallery[4],t:'Spin Cycle',d:'45 min \u2022 All Levels',cal:'500-650 cal'},{img:im.gallery[5],t:'CrossFit WOD',d:'60 min \u2022 Advanced',cal:'800-1000 cal'}].map(c=>`<div class="card" style="border-radius:16px;overflow:hidden;border:1px solid #27272a;background:#18181b">
<div style="position:relative"><img src="${c.img}" style="width:100%;height:180px;object-fit:cover;display:block" loading="lazy"/><div style="position:absolute;top:10px;right:10px;background:${p};color:#fff;padding:4px 10px;border-radius:6px;font-size:11px;font-weight:700">\u{1F525} ${c.cal}</div></div>
<div style="padding:16px"><h3 style="font-family:'${fH}',sans-serif;font-size:17px;font-weight:700;color:#fff;text-transform:uppercase">${c.t}</h3><p style="font-size:13px;color:#71717a;margin-top:4px">${c.d}</p></div></div>`).join('')}</div></div></section>`;

  // TRAINERS
  b += `<section class="sp" style="padding:80px 20px;background:#18181b"><div class="ctn"><div style="text-align:center;margin-bottom:60px"><p style="font-size:13px;color:${p};text-transform:uppercase;letter-spacing:3px;font-weight:700;margin-bottom:12px">Our Team</p><h2 style="font-family:'${fH}',sans-serif;font-size:clamp(28px,4vw,44px);font-weight:800;color:#fff;text-transform:uppercase">Elite Trainers</h2></div>
<div class="g3" style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px">${[{n:'Mike Torres',s:'Strength & Conditioning',cert:'NSCA-CSCS',img:im.team[0]},{n:'Jess Park',s:'HIIT & Cardio',cert:'ACE Certified',img:im.team[1]},{n:'Chris Reed',s:'Boxing & MMA',cert:'USA Boxing Coach',img:im.team[2]}].map(t=>`<div style="text-align:center"><img src="${t.img}" style="width:130px;height:130px;border-radius:50%;object-fit:cover;margin:0 auto 16px;display:block;border:3px solid ${p}" onerror="this.style.display='none'"/><h3 style="font-family:'${fH}',sans-serif;font-size:17px;font-weight:700;color:#fff;text-transform:uppercase">${t.n}</h3><p style="font-size:13px;color:${p};font-weight:600">${t.s}</p><p style="font-size:12px;color:#71717a;margin-top:4px">${t.cert}</p></div>`).join('')}</div></div></section>`;

  // MEMBERSHIP PLANS
  b += `<section class="sp" style="padding:100px 20px;background:#09090b"><div class="ctn"><div style="text-align:center;margin-bottom:60px"><p style="font-size:13px;color:${p};text-transform:uppercase;letter-spacing:3px;font-weight:700;margin-bottom:12px">Membership</p><h2 style="font-family:'${fH}',sans-serif;font-size:clamp(28px,4vw,44px);font-weight:800;color:#fff;text-transform:uppercase">Choose Your Plan</h2></div>
<div class="g3" style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px;max-width:960px;margin:0 auto">${[{n:'BASIC',pr:'49',f:['Gym floor access','Locker room','2 classes/week','Basic app access'],ft:false},{n:'PRO',pr:'89',f:['Unlimited classes','Personal training (2x/mo)','Nutrition coaching','Sauna & recovery','Full app access'],ft:true},{n:'ELITE',pr:'149',f:['Everything in Pro','Unlimited PT sessions','Meal prep service','Priority booking','Guest passes (4/mo)'],ft:false}].map(m=>`<div class="card" style="padding:32px;border-radius:16px;background:${m.ft?'linear-gradient(135deg,'+p+'15,'+p+'05)':'#18181b'};border:${m.ft?'2px solid '+p:'1px solid #27272a'}">
${m.ft?'<div style="font-size:11px;color:'+p+';text-transform:uppercase;letter-spacing:2px;font-weight:700;margin-bottom:12px">\u{1F525} MOST POPULAR</div>':''}
<h3 style="font-family:\''+fH+'\',sans-serif;font-size:20px;font-weight:800;color:#fff;text-transform:uppercase">${m.n}</h3>
<div style="margin:12px 0 24px"><span style="font-family:\''+fH+'\',sans-serif;font-size:44px;font-weight:800;color:${m.ft?p:'#fff'}">$${m.pr}</span><span style="font-size:14px;color:#71717a">/month</span></div>
${m.f.map(f=>`<div style="padding:7px 0;font-size:14px;color:#a1a1aa"><span style="color:${p};margin-right:8px">\u2713</span>${f}</div>`).join('')}
<a href="#" style="display:block;text-align:center;padding:14px;margin-top:24px;border-radius:10px;font-weight:700;font-size:14px;text-transform:uppercase;letter-spacing:1px;${m.ft?'background:'+p+';color:#fff;box-shadow:0 4px 20px '+p+'40':'border:2px solid #27272a;color:#fff'}">Join Now</a></div>`).join('')}</div></div></section>`;

  // CTA
  b += `<section style="padding:100px 20px;background:linear-gradient(135deg,${p},#ea580c);text-align:center"><div style="max-width:600px;margin:0 auto"><h2 style="font-family:'${fH}',sans-serif;font-size:clamp(28px,4vw,44px);font-weight:800;color:#fff;text-transform:uppercase;margin-bottom:16px">Your Transformation Starts Today</h2><p style="font-size:16px;color:rgba(255,255,255,.9);margin-bottom:32px">First week free. No contracts. No excuses.</p><a href="#" style="padding:16px 40px;background:#fff;color:${p};border-radius:10px;font-weight:800;font-size:16px;text-transform:uppercase;letter-spacing:1px;display:inline-block">Claim Free Week \u2192</a></div></section>`;

  b += footer('Titan Fitness','Premium training facility with world-class coaches.',d,fH,fB);
  return wrap('Titan Fitness',fH,fB,d,p,s,b);
}

/* ============ RESTAURANT ============ */
function buildRestaurant(im: typeof IMG[string]): string {
  const p = '#881337', s = '#d4af37', fH = 'Playfair Display', fB = 'Lora';
  let b = `<nav style="position:fixed;top:0;left:0;right:0;z-index:50;padding:14px 20px;background:rgba(28,16,8,.9);backdrop-filter:blur(12px);border-bottom:1px solid rgba(212,175,55,.15);display:flex;align-items:center;justify-content:space-between">
<div style="font-family:'${fH}',serif;font-size:20px;font-weight:700;color:#fef3c7">Maison</div>
<div class="hide-m" style="display:flex;gap:24px"><a href="#" style="font-size:14px;color:#d6d3d1">Menu</a><a href="#" style="font-size:14px;color:#d6d3d1">Story</a><a href="#" style="font-size:14px;color:#d6d3d1">Gallery</a><a href="#" style="font-size:14px;color:#d6d3d1">Private Events</a></div>
<a href="#" style="padding:8px 20px;background:${s};color:#1c1008;border-radius:6px;font-size:13px;font-weight:700">Reserve a Table</a></nav>`;

  b += `<section style="min-height:100vh;display:flex;align-items:center;position:relative;overflow:hidden;background:url('${im.hero}') center/cover no-repeat">
<div style="position:absolute;inset:0;background:linear-gradient(to bottom,rgba(28,16,8,.4),rgba(28,16,8,.85))"></div>
<div style="position:relative;z-index:1;text-align:center;max-width:700px;margin:0 auto;padding:120px 20px 80px">
<div style="width:50px;height:1px;background:${s};margin:0 auto 20px"></div>
<p style="font-family:'${fB}',serif;font-size:14px;color:${s};text-transform:uppercase;letter-spacing:4px;margin-bottom:16px">Est. 2018</p>
<h1 style="font-family:'${fH}',serif;font-size:clamp(40px,7vw,76px);font-weight:700;color:#fef3c7;line-height:1.1;margin-bottom:20px">An Experience<br/>for the Senses</h1>
<p style="font-family:'${fB}',serif;font-size:17px;color:rgba(254,243,199,.7);max-width:500px;margin:0 auto 32px;line-height:1.8;font-style:italic">Celebrating seasonal ingredients and artisan techniques in an intimate atmosphere.</p>
<a href="#" style="padding:14px 36px;background:${s};color:#1c1008;border-radius:6px;font-weight:700;display:inline-block">Reserve Your Table</a>
<div style="display:flex;justify-content:center;gap:32px;margin-top:32px;font-size:13px;color:rgba(254,243,199,.5)"><span>Tue - Sun</span><span>\u2022</span><span>5:30 PM - 11:00 PM</span></div>
</div></section>`;

  // MENU
  b += `<section class="sp" style="padding:100px 20px;background:#1c1008"><div style="max-width:800px;margin:0 auto;text-align:center">
<div style="width:50px;height:1px;background:${s};margin:0 auto 20px"></div>
<p style="font-size:13px;color:${s};text-transform:uppercase;letter-spacing:4px;font-weight:600;margin-bottom:12px">The Menu</p>
<h2 style="font-family:'${fH}',serif;font-size:clamp(28px,4vw,44px);font-weight:700;color:#fef3c7;margin-bottom:48px">Seasonal Tasting Menu</h2>

<div style="text-align:left;margin-bottom:48px">
<h3 style="font-family:'${fH}',serif;font-size:16px;color:${s};text-transform:uppercase;letter-spacing:3px;margin-bottom:24px">First Course</h3>
${[{n:'Seared Foie Gras',d:'Brioche, fig compote, aged balsamic',pr:'$28'},{n:'Yellowtail Crudo',d:'Yuzu, serrano, micro cilantro',pr:'$24'},{n:'Burrata Caprese',d:'Heirloom tomato, basil oil, fleur de sel',pr:'$22'}].map(i=>`<div style="display:flex;justify-content:space-between;align-items:baseline;padding:14px 0;border-bottom:1px solid rgba(212,175,55,.1)"><div><div style="font-family:'${fH}',serif;font-size:17px;font-weight:600;color:#fef3c7">${i.n}</div><div style="font-family:'${fB}',serif;font-size:13px;color:#a8a29e;font-style:italic;margin-top:2px">${i.d}</div></div><div style="font-family:'${fH}',serif;font-size:16px;color:${s};font-weight:600;white-space:nowrap;margin-left:20px">${i.pr}</div></div>`).join('')}</div>

<div style="text-align:left;margin-bottom:48px">
<h3 style="font-family:'${fH}',serif;font-size:16px;color:${s};text-transform:uppercase;letter-spacing:3px;margin-bottom:24px">Main Course</h3>
${[{n:'Wagyu Ribeye A5',d:'Bone marrow butter, charred shallot, truffle jus',pr:'$85'},{n:'Pan-Roasted Branzino',d:'Saffron risotto, beurre blanc, capers',pr:'$48'},{n:'Duck Breast Confit',d:'Cherry gastrique, root vegetables, thyme',pr:'$42'}].map(i=>`<div style="display:flex;justify-content:space-between;align-items:baseline;padding:14px 0;border-bottom:1px solid rgba(212,175,55,.1)"><div><div style="font-family:'${fH}',serif;font-size:17px;font-weight:600;color:#fef3c7">${i.n}</div><div style="font-family:'${fB}',serif;font-size:13px;color:#a8a29e;font-style:italic;margin-top:2px">${i.d}</div></div><div style="font-family:'${fH}',serif;font-size:16px;color:${s};font-weight:600;white-space:nowrap;margin-left:20px">${i.pr}</div></div>`).join('')}</div>

<div style="text-align:left">
<h3 style="font-family:'${fH}',serif;font-size:16px;color:${s};text-transform:uppercase;letter-spacing:3px;margin-bottom:24px">Dessert</h3>
${[{n:'Cr\u00E8me Br\u00FBl\u00E9e',d:'Tahitian vanilla, caramelized sugar, berries',pr:'$18'},{n:'Chocolate Fondant',d:'Valrhona dark chocolate, salted caramel ice cream',pr:'$20'}].map(i=>`<div style="display:flex;justify-content:space-between;align-items:baseline;padding:14px 0;border-bottom:1px solid rgba(212,175,55,.1)"><div><div style="font-family:'${fH}',serif;font-size:17px;font-weight:600;color:#fef3c7">${i.n}</div><div style="font-family:'${fB}',serif;font-size:13px;color:#a8a29e;font-style:italic;margin-top:2px">${i.d}</div></div><div style="font-family:'${fH}',serif;font-size:16px;color:${s};font-weight:600;white-space:nowrap;margin-left:20px">${i.pr}</div></div>`).join('')}</div>
</div></section>`;

  // GALLERY
  b += `<section class="sp" style="padding:80px 20px;background:#150e06"><div class="ctn"><div style="text-align:center;margin-bottom:48px"><h2 style="font-family:'${fH}',serif;font-size:clamp(28px,4vw,40px);font-weight:700;color:#fef3c7">Culinary Artistry</h2></div>
<div class="g3" style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px">${im.gallery.slice(0,6).map(img=>`<div style="border-radius:12px;overflow:hidden"><img src="${img}" style="width:100%;aspect-ratio:4/3;object-fit:cover;display:block" loading="lazy"/></div>`).join('')}</div></div></section>`;

  // CHEF
  b += `<section class="sp" style="padding:100px 20px;background:#1c1008"><div class="ctn g2" style="display:grid;grid-template-columns:1fr 1fr;gap:60px;align-items:center">
<div style="border-radius:16px;overflow:hidden"><img src="${im.team[0]}" style="width:100%;aspect-ratio:3/4;object-fit:cover;display:block" loading="lazy" onerror="this.parentElement.style.display='none'"/></div>
<div><div style="width:50px;height:1px;background:${s};margin-bottom:20px"></div><p style="font-size:13px;color:${s};text-transform:uppercase;letter-spacing:4px;font-weight:600;margin-bottom:12px">The Chef</p>
<h2 style="font-family:'${fH}',serif;font-size:clamp(28px,4vw,40px);font-weight:700;color:#fef3c7;margin-bottom:16px">Chef Antoine Laurent</h2>
<p style="font-family:'${fB}',serif;font-size:15px;line-height:1.8;color:#a8a29e;font-style:italic">With over two decades of experience in Michelin-starred kitchens across Paris and New York, Chef Laurent brings a philosophy of respect for ingredients and bold flavor combinations.</p>
<div style="margin-top:24px;display:flex;gap:24px">${[{n:'2',l:'Michelin Stars'},{n:'22',l:'Years Experience'}].map(x=>`<div><div style="font-family:'${fH}',serif;font-size:28px;font-weight:700;color:${s}">${x.n}</div><div style="font-size:12px;color:#71717a">${x.l}</div></div>`).join('')}</div>
</div></div></section>`;

  // RESERVATION CTA
  b += `<section style="padding:100px 20px;background:url('${im.gallery[0]}') center/cover no-repeat;position:relative"><div style="position:absolute;inset:0;background:rgba(28,16,8,.85)"></div>
<div style="position:relative;z-index:1;text-align:center;max-width:600px;margin:0 auto">
<div style="width:50px;height:1px;background:${s};margin:0 auto 20px"></div>
<h2 style="font-family:'${fH}',serif;font-size:clamp(28px,4vw,44px);font-weight:700;color:#fef3c7;margin-bottom:16px">Make a Reservation</h2>
<p style="font-family:'${fB}',serif;font-size:15px;color:#a8a29e;margin-bottom:32px;font-style:italic">For parties of 6 or more, please contact us directly for availability.</p>
<div style="display:flex;gap:12px;max-width:400px;margin:0 auto;flex-wrap:wrap">
<input type="text" placeholder="Your Name" style="flex:1;min-width:120px;padding:12px 16px;border-radius:8px;border:1px solid rgba(212,175,55,.2);background:rgba(255,255,255,.05);color:#fef3c7;font-size:14px;font-family:'${fB}',serif"/>
<input type="text" placeholder="Date & Time" style="flex:1;min-width:120px;padding:12px 16px;border-radius:8px;border:1px solid rgba(212,175,55,.2);background:rgba(255,255,255,.05);color:#fef3c7;font-size:14px;font-family:'${fB}',serif"/>
</div>
<a href="#" style="display:inline-block;margin-top:16px;padding:14px 36px;background:${s};color:#1c1008;border-radius:6px;font-weight:700">Reserve Now</a>
</div></section>`;

  b += `<footer style="padding:48px 20px;background:#0f0a04;border-top:1px solid rgba(212,175,55,.1)"><div class="ctn" style="text-align:center">
<div style="font-family:'${fH}',serif;font-size:24px;font-weight:700;color:#fef3c7;margin-bottom:8px">Maison</div>
<p style="font-family:'${fB}',serif;font-size:14px;color:#71717a;font-style:italic;margin-bottom:16px">An Experience for the Senses</p>
<div style="font-size:13px;color:#52525b;margin-bottom:8px">123 Culinary Avenue \u2022 New York, NY 10012</div>
<div style="font-size:13px;color:#52525b">Reservations: (212) 555-0189</div>
<div style="margin-top:24px;font-size:12px;color:#3f3f46">\u00A9 2025 Maison Fine Dining. All rights reserved.</div>
</div></footer>`;

  return wrap('Maison Fine Dining',fH,fB,true,p,s,b);
}

/* ============ CREATIVE AGENCY ============ */
function buildAgency(im: typeof IMG[string]): string {
  const p = '#9333ea', s = '#ec4899', fH = 'Sora', fB = 'DM Sans';
  let b = `<nav style="position:fixed;top:0;left:0;right:0;z-index:50;padding:14px 20px;background:rgba(255,255,255,.92);backdrop-filter:blur(12px);border-bottom:1px solid #f0e4ff;display:flex;align-items:center;justify-content:space-between">
<div style="font-family:'${fH}',sans-serif;font-size:20px;font-weight:700;background:linear-gradient(135deg,${p},${s});-webkit-background-clip:text;-webkit-text-fill-color:transparent">Nova\u2605</div>
<div class="hide-m" style="display:flex;gap:24px"><a href="#" style="font-size:14px;color:#71717a">Work</a><a href="#" style="font-size:14px;color:#71717a">Services</a><a href="#" style="font-size:14px;color:#71717a">About</a><a href="#" style="font-size:14px;color:#71717a">Contact</a></div>
<a href="#" style="padding:8px 20px;background:linear-gradient(135deg,${p},${s});color:#fff;border-radius:8px;font-size:13px;font-weight:600">Let\u2019s Talk</a></nav>`;

  b += `<section style="min-height:100vh;display:flex;align-items:center;padding:120px 20px 80px;background:#fdf4ff;position:relative;overflow:hidden">
<div style="position:absolute;top:-200px;right:-200px;width:600px;height:600px;background:radial-gradient(circle,${s}15 0%,transparent 60%);border-radius:50%"></div>
<div style="position:absolute;bottom:-200px;left:-100px;width:500px;height:500px;background:radial-gradient(circle,${p}10 0%,transparent 60%);border-radius:50%"></div>
<div class="ctn" style="position:relative;z-index:1;text-align:center">
<div style="display:inline-flex;align-items:center;gap:8px;padding:6px 14px;border-radius:20px;background:white;border:1px solid #f0e4ff;margin-bottom:28px;box-shadow:0 2px 10px rgba(0,0,0,.05)"><div style="width:8px;height:8px;border-radius:50%;background:linear-gradient(135deg,${p},${s})"></div><span style="font-size:12px;color:${p};font-weight:600">AWARD-WINNING AGENCY</span></div>
<h1 style="font-family:'${fH}',sans-serif;font-size:clamp(40px,7vw,84px);font-weight:800;line-height:1.05;margin-bottom:24px"><span style="background:linear-gradient(135deg,${p},${s});-webkit-background-clip:text;-webkit-text-fill-color:transparent">We Make the<br/>Impossible Visible</span></h1>
<p style="font-size:18px;color:#71717a;max-width:550px;margin:0 auto 36px;line-height:1.7">Full-service creative agency delivering brand strategy, digital design, and development for ambitious brands.</p>
<div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
<a href="#" style="padding:14px 32px;background:linear-gradient(135deg,${p},${s});color:#fff;border-radius:12px;font-weight:700;box-shadow:0 4px 30px ${p}30">View Our Work</a>
<a href="#" style="padding:14px 32px;border:2px solid #e4e4e7;color:#09090b;border-radius:12px;font-weight:700">Start a Project \u2192</a></div>
<div style="display:flex;justify-content:center;gap:32px;margin-top:40px">${[{n:'200+',l:'Projects'},{n:'50+',l:'Clients'},{n:'12',l:'Awards'}].map(x=>`<div><div style="font-family:'${fH}',sans-serif;font-size:24px;font-weight:800;background:linear-gradient(135deg,${p},${s});-webkit-background-clip:text;-webkit-text-fill-color:transparent">${x.n}</div><div style="font-size:12px;color:#a1a1aa">${x.l}</div></div>`).join('')}</div>
</div></section>`;

  // SERVICES with numbered labels
  b += `<section class="sp" style="padding:100px 20px;background:#fff"><div class="ctn"><div style="text-align:center;margin-bottom:60px"><p style="font-size:13px;color:${p};text-transform:uppercase;letter-spacing:2px;font-weight:600;margin-bottom:12px">What We Do</p><h2 style="font-family:'${fH}',sans-serif;font-size:clamp(28px,4vw,44px);font-weight:800;color:#09090b">Our Services</h2></div>
<div style="max-width:800px;margin:0 auto">${[{n:'01',t:'Brand Strategy',d:'Research, positioning, and brand architecture that sets you apart in crowded markets.'},{n:'02',t:'Digital Design',d:'UI/UX design for web & mobile that converts visitors into loyal customers.'},{n:'03',t:'Web Development',d:'Performant, accessible websites built with cutting-edge technology.'},{n:'04',t:'Content & Motion',d:'Photography, video, animation and content that tells your brand story.'}].map(s=>`<div style="display:flex;gap:24px;align-items:flex-start;padding:32px 0;border-bottom:1px solid #f4f4f5">
<div style="font-family:'${fH}',sans-serif;font-size:clamp(36px,5vw,56px);font-weight:800;background:linear-gradient(135deg,${p}20,${s}20);-webkit-background-clip:text;-webkit-text-fill-color:transparent;line-height:1;flex-shrink:0">${s.n}</div>
<div><h3 style="font-family:'${fH}',sans-serif;font-size:20px;font-weight:700;color:#09090b;margin-bottom:6px">${s.t}</h3><p style="font-size:15px;color:#71717a;line-height:1.7">${s.d}</p></div></div>`).join('')}</div></div></section>`;

  // PORTFOLIO
  b += `<section class="sp" style="padding:100px 20px;background:#fdf4ff"><div class="ctn"><div style="text-align:center;margin-bottom:60px"><p style="font-size:13px;color:${p};text-transform:uppercase;letter-spacing:2px;font-weight:600;margin-bottom:12px">Selected Work</p><h2 style="font-family:'${fH}',sans-serif;font-size:clamp(28px,4vw,44px);font-weight:800;color:#09090b">Portfolio</h2></div>
<div class="g2" style="display:grid;grid-template-columns:repeat(2,1fr);gap:20px">${[{img:im.gallery[0],t:'Nexus Brand Redesign',c:'Branding \u2022 Web'},{img:im.gallery[1],t:'FlowState App',c:'UI/UX \u2022 Mobile'},{img:im.gallery[2],t:'Meridian Campaign',c:'Content \u2022 Strategy'},{img:im.gallery[3],t:'Pulse Dashboard',c:'Web \u2022 Development'}].map(w=>`<div class="card" style="border-radius:16px;overflow:hidden;border:1px solid #f0e4ff;background:#fff">
<img src="${w.img}" style="width:100%;height:240px;object-fit:cover;display:block" loading="lazy"/>
<div style="padding:20px"><h3 style="font-family:'${fH}',sans-serif;font-size:17px;font-weight:700;color:#09090b">${w.t}</h3><p style="font-size:13px;color:${p};margin-top:4px">${w.c}</p></div></div>`).join('')}</div></div></section>`;

  // TEAM
  b += `<section class="sp" style="padding:80px 20px;background:#fff"><div class="ctn"><div style="text-align:center;margin-bottom:48px"><h2 style="font-family:'${fH}',sans-serif;font-size:clamp(28px,4vw,40px);font-weight:800;color:#09090b">The Crew</h2></div>
<div class="g4" style="display:grid;grid-template-columns:repeat(4,1fr);gap:24px">${[{n:'Alex Kim',r:'Creative Director',img:im.team[0]},{n:'Maya Chen',r:'Lead Designer',img:im.team[1]},{n:'James Wu',r:'Dev Lead',img:im.team[2]},{n:'Sofia Martinez',r:'Strategist',img:im.team[3]}].map(t=>`<div style="text-align:center"><img src="${t.img}" style="width:100px;height:100px;border-radius:50%;object-fit:cover;margin:0 auto 12px;display:block" onerror="this.style.display='none'"/><h3 style="font-size:15px;font-weight:600;color:#09090b">${t.n}</h3><p style="font-size:13px;color:${p}">${t.r}</p></div>`).join('')}</div></div></section>`;

  // CLIENT LOGOS
  b += `<section style="padding:60px 20px;background:#fdf4ff;border-top:1px solid #f0e4ff"><div class="ctn" style="text-align:center"><p style="font-size:12px;color:#a1a1aa;text-transform:uppercase;letter-spacing:2px;margin-bottom:20px">Trusted by leading brands</p><div style="display:flex;justify-content:center;gap:40px;flex-wrap:wrap;opacity:.35">${['Google','Spotify','Airbnb','Netflix','Figma','Stripe'].map(n=>`<span style="font-family:'${fH}',sans-serif;font-size:18px;font-weight:700;color:#71717a">${n}</span>`).join('')}</div></div></section>`;

  // CTA
  b += `<section style="padding:100px 20px;background:linear-gradient(135deg,${p},${s});text-align:center"><div style="max-width:600px;margin:0 auto"><h2 style="font-family:'${fH}',sans-serif;font-size:clamp(28px,4vw,44px);font-weight:800;color:#fff;margin-bottom:16px">Ready to Stand Out?</h2><p style="font-size:16px;color:rgba(255,255,255,.9);margin-bottom:32px">Let\u2019s build something extraordinary together.</p><a href="#" style="padding:16px 40px;background:#fff;color:${p};border-radius:12px;font-weight:700;font-size:16px;display:inline-block">Start a Project \u2192</a></div></section>`;

  b += footer('Nova Creative','Full-service creative agency for ambitious brands.',false,fH,fB);
  return wrap('Nova Creative Agency',fH,fB,false,p,s,b);
}

/* ============ HEALTHCARE ============ */
function buildHealth(im: typeof IMG[string]): string {
  const p = '#0369a1', s = '#0d9488', fH = 'Plus Jakarta Sans', fB = 'Inter';
  let b = nav('Meridian Health','Services,Doctors,About,Contact'.split(','),'Book Appointment',false,p,fH,fB);

  b += `<section style="min-height:85vh;display:flex;align-items:center;padding:100px 20px 80px;background:linear-gradient(135deg,#f0f9ff,#f0fdfa);position:relative;overflow:hidden">
<div style="position:absolute;top:-150px;right:-150px;width:400px;height:400px;background:radial-gradient(circle,${p}10 0%,transparent 60%);border-radius:50%"></div>
<div class="ctn g2" style="display:grid;grid-template-columns:1fr 1fr;gap:60px;align-items:center">
<div>
<div style="display:inline-flex;align-items:center;gap:8px;padding:6px 14px;border-radius:20px;background:white;border:1px solid #e0f2fe;margin-bottom:24px"><span style="font-size:12px;color:${p};font-weight:600">\u2764\uFE0F Accepting New Patients</span></div>
<h1 style="font-family:'${fH}',sans-serif;font-size:clamp(36px,5vw,56px);font-weight:800;color:#09090b;line-height:1.1;margin-bottom:20px">Compassionate Care,<br/><span style="color:${p}">Expert Results</span></h1>
<p style="font-size:17px;color:#71717a;line-height:1.7;max-width:500px;margin-bottom:28px">Modern medical practice offering comprehensive primary care, preventive health, and specialized treatments.</p>
<div style="display:flex;gap:12px;flex-wrap:wrap">
<a href="#" style="padding:14px 28px;background:${p};color:#fff;border-radius:12px;font-weight:600;box-shadow:0 4px 20px ${p}30">Book Appointment</a>
<a href="#" style="padding:14px 28px;border:2px solid #e4e4e7;color:#09090b;border-radius:12px;font-weight:600">Call (555) 123-4567</a></div>
<div style="display:flex;gap:16px;margin-top:24px;flex-wrap:wrap">${['Board Certified','Telehealth Available','Same-Day Visits'].map(x=>`<div style="display:flex;align-items:center;gap:6px;font-size:13px;color:#71717a"><div style="width:20px;height:20px;border-radius:50%;background:${p}15;display:flex;align-items:center;justify-content:center;font-size:10px;color:${p}">\u2713</div>${x}</div>`).join('')}</div>
</div>
<div class="hide-m" style="border-radius:20px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.1)"><img src="${im.hero}" style="width:100%;height:400px;object-fit:cover;display:block" loading="lazy"/></div>
</div></section>`;

  // SERVICES
  b += `<section class="sp" style="padding:100px 20px;background:#fff"><div class="ctn"><div style="text-align:center;margin-bottom:60px"><p style="font-size:13px;color:${p};text-transform:uppercase;letter-spacing:2px;font-weight:600;margin-bottom:12px">Our Services</p><h2 style="font-family:'${fH}',sans-serif;font-size:clamp(28px,4vw,44px);font-weight:800;color:#09090b">Comprehensive Care</h2></div>
<div class="g3" style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px">${[{i:'\u{1FA7A}',t:'Primary Care',d:'Annual physicals, chronic disease management, preventive screenings.'},{i:'\u{1F489}',t:'Vaccinations',d:'Flu shots, COVID boosters, travel vaccines, childhood immunizations.'},{i:'\u{1F9E0}',t:'Mental Health',d:'Depression, anxiety, counseling referrals, and wellness support.'},{i:'\u{1F9EC}',t:'Lab & Diagnostics',d:'On-site blood work, imaging referrals, rapid testing.'},{i:'\u{1F476}',t:'Pediatrics',d:'Newborn to teen care, developmental milestones, school physicals.'},{i:'\u2764\uFE0F',t:'Cardiology',d:'Heart health screenings, EKG, blood pressure management.'}].map(s=>`<div class="card" style="padding:28px;border-radius:16px;border:1px solid #e4e4e7;background:#fff"><div style="width:48px;height:48px;border-radius:12px;background:${p}10;display:flex;align-items:center;justify-content:center;font-size:24px;margin-bottom:16px">${s.i}</div><h3 style="font-family:'${fH}',sans-serif;font-size:17px;font-weight:700;color:#09090b;margin-bottom:8px">${s.t}</h3><p style="font-size:14px;line-height:1.7;color:#71717a">${s.d}</p></div>`).join('')}</div></div></section>`;

  // STATS
  b += `<section style="padding:80px 20px;background:${p}"><div class="ctn g4" style="display:grid;grid-template-columns:repeat(4,1fr);gap:32px;text-align:center">${[{n:'25K+',l:'Patients Served'},{n:'15+',l:'Years of Care'},{n:'4.9/5',l:'Patient Rating'},{n:'98%',l:'Would Recommend'}].map(x=>`<div><div style="font-family:'${fH}',sans-serif;font-size:clamp(28px,4vw,44px);font-weight:800;color:#fff">${x.n}</div><div style="font-size:13px;color:rgba(255,255,255,.7);margin-top:4px">${x.l}</div></div>`).join('')}</div></section>`;

  // DOCTORS
  b += `<section class="sp" style="padding:100px 20px;background:#f0f9ff"><div class="ctn"><div style="text-align:center;margin-bottom:60px"><p style="font-size:13px;color:${p};text-transform:uppercase;letter-spacing:2px;font-weight:600;margin-bottom:12px">Our Providers</p><h2 style="font-family:'${fH}',sans-serif;font-size:clamp(28px,4vw,44px);font-weight:800;color:#09090b">Meet Your Doctors</h2></div>
<div class="g3" style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px">${[{n:'Dr. Sarah Mitchell',s:'Internal Medicine',cert:'Board Certified, ABIM',edu:'Johns Hopkins University',img:im.team[0]},{n:'Dr. Emily Chen',s:'Family Medicine',cert:'Board Certified, ABFM',edu:'Stanford Medical School',img:im.team[1]},{n:'Dr. James Park',s:'Pediatrics',cert:'Board Certified, ABP',edu:'Harvard Medical School',img:im.team[2]}].map(d=>`<div class="card" style="padding:24px;border-radius:16px;border:1px solid #e4e4e7;background:#fff;text-align:center"><img src="${d.img}" style="width:100px;height:100px;border-radius:50%;object-fit:cover;margin:0 auto 16px;display:block;border:3px solid ${p}20" onerror="this.style.display='none'"/><h3 style="font-family:'${fH}',sans-serif;font-size:17px;font-weight:700;color:#09090b">${d.n}</h3><p style="font-size:14px;color:${p};font-weight:600;margin-top:2px">${d.s}</p><p style="font-size:12px;color:#a1a1aa;margin-top:4px">${d.cert}</p><p style="font-size:12px;color:#a1a1aa">${d.edu}</p>
<a href="#" style="display:inline-block;margin-top:12px;padding:8px 20px;background:${p}10;color:${p};border-radius:8px;font-size:13px;font-weight:600">Book with Dr. ${d.n.split(' ').pop()}</a></div>`).join('')}</div></div></section>`;

  // INSURANCE + FAQ
  b += `<section class="sp" style="padding:80px 20px;background:#fff"><div style="max-width:700px;margin:0 auto"><div style="text-align:center;margin-bottom:48px"><h2 style="font-family:'${fH}',sans-serif;font-size:clamp(24px,3vw,36px);font-weight:800;color:#09090b">Insurance & FAQs</h2></div>
<div style="background:#f0f9ff;border-radius:12px;padding:20px;margin-bottom:32px;border:1px solid #e0f2fe"><p style="font-size:13px;color:${p};font-weight:600;margin-bottom:8px">Accepted Insurance</p><p style="font-size:14px;color:#71717a">Blue Cross Blue Shield \u2022 Aetna \u2022 UnitedHealthcare \u2022 Cigna \u2022 Medicare \u2022 Medicaid \u2022 And many more</p></div>
${[{q:'Do you accept new patients?',a:'Yes! We are currently accepting new patients of all ages.'},{q:'Do you offer telehealth?',a:'Yes, we offer video visits for many appointment types.'},{q:'What are your hours?',a:'Monday-Friday 8am-6pm, Saturday 9am-1pm.'}].map(f=>`<div style="padding:16px 0;border-bottom:1px solid #e4e4e7"><h3 style="font-size:15px;font-weight:600;color:#09090b;margin-bottom:6px">${f.q}</h3><p style="font-size:14px;color:#71717a;line-height:1.7">${f.a}</p></div>`).join('')}</div></section>`;

  // CONTACT CTA
  b += `<section style="padding:100px 20px;background:${p};text-align:center"><div style="max-width:600px;margin:0 auto"><h2 style="font-family:'${fH}',sans-serif;font-size:clamp(28px,4vw,44px);font-weight:800;color:#fff;margin-bottom:16px">Your Health Starts Here</h2><p style="font-size:16px;color:rgba(255,255,255,.85);margin-bottom:32px">Schedule your appointment today. Same-day and next-day openings available.</p><div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap"><a href="#" style="padding:14px 32px;background:#fff;color:${p};border-radius:12px;font-weight:700;display:inline-block">Book Online</a><a href="#" style="padding:14px 32px;border:2px solid rgba(255,255,255,.3);color:#fff;border-radius:12px;font-weight:700;display:inline-block">Call Us</a></div></div></section>`;

  b += footer('Meridian Health','Compassionate care and expert results for your family.',false,fH,fB);
  return wrap('Meridian Health',fH,fB,false,p,s,b);
}

/* ============ E-COMMERCE ============ */
function buildEcommerce(im: typeof IMG[string]): string {
  const p = '#1c1917', s = '#44403c', fH = 'Manrope', fB = 'Inter';
  let b = `<nav style="position:fixed;top:0;left:0;right:0;z-index:50;padding:14px 20px;background:rgba(250,250,249,.95);backdrop-filter:blur(12px);border-bottom:1px solid #e4e4e7;display:flex;align-items:center;justify-content:space-between">
<div style="font-family:'${fH}',sans-serif;font-size:20px;font-weight:700;color:${p};letter-spacing:-0.5px">LUXE</div>
<div class="hide-m" style="display:flex;gap:28px"><a href="#" style="font-size:14px;color:#71717a">Shop All</a><a href="#" style="font-size:14px;color:#71717a">New Arrivals</a><a href="#" style="font-size:14px;color:#71717a">Collections</a><a href="#" style="font-size:14px;color:#71717a">About</a></div>
<div style="display:flex;align-items:center;gap:16px"><a href="#" style="font-size:14px;color:#71717a">Search</a><a href="#" style="font-size:14px;color:${p};font-weight:600">Bag (0)</a></div></nav>`;

  b += `<section style="min-height:90vh;display:flex;align-items:center;position:relative;overflow:hidden;background:url('${im.hero}') center/cover no-repeat">
<div style="position:absolute;inset:0;background:linear-gradient(to right,rgba(0,0,0,.5),rgba(0,0,0,.2))"></div>
<div style="position:relative;z-index:1;padding:120px 20px 80px;max-width:600px;margin-left:5%">
<p style="font-size:13px;color:rgba(255,255,255,.6);text-transform:uppercase;letter-spacing:3px;margin-bottom:16px">Spring/Summer 2025</p>
<h1 style="font-family:'${fH}',sans-serif;font-size:clamp(36px,5vw,60px);font-weight:800;color:#fff;line-height:1.1;margin-bottom:20px;letter-spacing:-1px">Curated for the Discerning</h1>
<p style="font-size:17px;color:rgba(255,255,255,.7);line-height:1.7;margin-bottom:32px">Premium essentials crafted with intention. Timeless design meets modern sophistication.</p>
<a href="#" style="padding:14px 36px;background:#fff;color:${p};border-radius:8px;font-weight:700;display:inline-block">Shop Collection \u2192</a>
</div></section>`;

  // PRODUCT GRID
  b += `<section class="sp" style="padding:100px 20px;background:#fafaf9"><div class="ctn">
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:48px;flex-wrap:wrap;gap:12px">
<h2 style="font-family:'${fH}',sans-serif;font-size:clamp(24px,3vw,36px);font-weight:800;color:${p}">Shop Collection</h2>
<div style="display:flex;gap:12px">${['All','Clothing','Accessories','Footwear'].map((c,i)=>`<a href="#" style="font-size:13px;color:${i===0?p:'#a1a1aa'};font-weight:${i===0?'700':'500'};padding:6px 14px;border-radius:20px;${i===0?'background:#f4f4f5':''}white-space:nowrap">${c}</a>`).join('')}</div>
</div>
<div class="g3" style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px">${[{n:'Essential Tee',pr:'$85',cat:'Clothing',img:im.products[0]},{n:'Linen Trousers',pr:'$195',cat:'Clothing',img:im.products[1]},{n:'Leather Tote',pr:'$340',cat:'Accessories',img:im.products[2]},{n:'Cashmere Sweater',pr:'$280',cat:'Clothing',img:im.products[3]},{n:'Canvas Sneakers',pr:'$150',cat:'Footwear',img:im.products[4]},{n:'Running Shoes',pr:'$120',cat:'Footwear',img:im.products[5]}].map(p2=>`<div class="card" style="border-radius:12px;overflow:hidden;background:#fff;border:1px solid #e4e4e7;cursor:pointer">
<div style="position:relative;overflow:hidden"><img src="${p2.img}" style="width:100%;aspect-ratio:3/4;object-fit:cover;display:block;transition:transform .5s" loading="lazy" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'"/>
<div style="position:absolute;top:10px;left:10px;background:#fff;color:${p};padding:4px 10px;border-radius:6px;font-size:11px;font-weight:600">${p2.cat}</div></div>
<div style="padding:16px;display:flex;justify-content:space-between;align-items:center">
<div><h3 style="font-family:'${fH}',sans-serif;font-size:15px;font-weight:600;color:${p}">${p2.n}</h3><p style="font-size:14px;color:#71717a;margin-top:2px">${p2.pr}</p></div>
<a href="#" style="width:36px;height:36px;border-radius:50%;background:#f4f4f5;display:flex;align-items:center;justify-content:center;font-size:16px;color:${p};transition:all .2s" onmouseover="this.style.background='#09090b';this.style.color='#fff'" onmouseout="this.style.background='#f4f4f5';this.style.color='#1c1917'">+</a>
</div></div>`).join('')}</div>
<div style="text-align:center;margin-top:40px"><a href="#" style="padding:12px 32px;border:2px solid #e4e4e7;color:${p};border-radius:8px;font-weight:600;display:inline-block;font-size:14px">View All Products \u2192</a></div></div></section>`;

  // COLLECTIONS BANNER
  b += `<section class="sp" style="padding:80px 20px;background:#fff"><div class="ctn g2" style="display:grid;grid-template-columns:1fr 1fr;gap:20px">${[{t:'Summer Essentials',s:'Light layers for warm days',img:im.gallery[0]},{t:'Travel Collection',s:'Versatile pieces on the go',img:im.gallery[1]}].map(c=>`<div style="position:relative;border-radius:16px;overflow:hidden;height:300px"><img src="${c.img}" style="width:100%;height:100%;object-fit:cover;display:block" loading="lazy"/><div style="position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,.6),transparent);display:flex;flex-direction:column;justify-content:flex-end;padding:28px"><h3 style="font-family:'${fH}',sans-serif;font-size:22px;font-weight:700;color:#fff">${c.t}</h3><p style="font-size:14px;color:rgba(255,255,255,.7);margin-top:4px">${c.s}</p><a href="#" style="font-size:14px;color:#fff;font-weight:600;margin-top:12px;text-decoration:underline">Shop Now \u2192</a></div></div>`).join('')}</div></section>`;

  // FEATURES
  b += `<section style="padding:60px 20px;background:#fafaf9;border-top:1px solid #e4e4e7"><div class="ctn g4" style="display:grid;grid-template-columns:repeat(4,1fr);gap:24px;text-align:center">${[{i:'\u{1F4E6}',t:'Free Shipping',d:'On orders over $100'},{i:'\u{1F504}',t:'Easy Returns',d:'30-day return policy'},{i:'\u{1F512}',t:'Secure Checkout',d:'Encrypted payments'},{i:'\u{1F48E}',t:'Premium Quality',d:'Ethically sourced materials'}].map(f=>`<div><div style="font-size:24px;margin-bottom:8px">${f.i}</div><div style="font-size:14px;font-weight:600;color:${p}">${f.t}</div><div style="font-size:12px;color:#a1a1aa;margin-top:2px">${f.d}</div></div>`).join('')}</div></section>`;

  // NEWSLETTER
  b += `<section style="padding:80px 20px;background:${p};text-align:center"><div style="max-width:500px;margin:0 auto"><h2 style="font-family:'${fH}',sans-serif;font-size:clamp(24px,3vw,36px);font-weight:800;color:#fff;margin-bottom:12px;letter-spacing:-0.5px">Stay in the Loop</h2><p style="font-size:15px;color:#a1a1aa;margin-bottom:24px">New arrivals, exclusive offers, and styling tips. Delivered weekly.</p><div style="display:flex;gap:8px;max-width:400px;margin:0 auto"><input type="email" placeholder="your@email.com" style="flex:1;padding:12px 16px;border-radius:8px;border:1px solid #27272a;background:#09090b;color:#fff;font-size:14px"/><a href="#" style="padding:12px 24px;background:#fff;color:${p};border-radius:8px;font-weight:700;font-size:14px;white-space:nowrap">Subscribe</a></div></div></section>`;

  b += footer('LUXE','Premium fashion and lifestyle. Curated for the discerning.',false,fH,fB);
  return wrap('Luxe Store',fH,fB,false,p,s,b);
}

/* ============ PROFESSIONAL / LAW ============ */
function buildLaw(im: typeof IMG[string]): string {
  const p = '#1e3a5f', s = '#1d4ed8', fH = 'Playfair Display', fB = 'Inter';
  let b = `<nav style="position:fixed;top:0;left:0;right:0;z-index:50;padding:14px 20px;background:rgba(248,250,252,.95);backdrop-filter:blur(12px);border-bottom:1px solid #e2e8f0;display:flex;align-items:center;justify-content:space-between">
<div style="font-family:'${fH}',serif;font-size:20px;font-weight:700;color:${p}">Axiom <span style="color:${s}">&amp;</span> Associates</div>
<div class="hide-m" style="display:flex;gap:24px"><a href="#" style="font-size:14px;color:#64748b">Practice Areas</a><a href="#" style="font-size:14px;color:#64748b">Attorneys</a><a href="#" style="font-size:14px;color:#64748b">Results</a><a href="#" style="font-size:14px;color:#64748b">Contact</a></div>
<a href="#" style="padding:8px 20px;background:${p};color:#fff;border-radius:8px;font-size:13px;font-weight:600">Free Consultation</a></nav>`;

  b += `<section style="min-height:85vh;display:flex;align-items:center;position:relative;overflow:hidden;background:url('${im.hero}') center/cover no-repeat">
<div style="position:absolute;inset:0;background:linear-gradient(135deg,rgba(30,58,95,.9),rgba(30,58,95,.7))"></div>
<div style="position:relative;z-index:1;padding:120px 20px 80px;max-width:1200px;margin:0 auto;width:100%">
<div class="g2" style="display:grid;grid-template-columns:1.2fr 0.8fr;gap:60px;align-items:center">
<div>
<div style="display:flex;align-items:center;gap:8px;margin-bottom:24px"><div style="width:40px;height:2px;background:${s}"></div><span style="font-size:13px;color:rgba(255,255,255,.6);text-transform:uppercase;letter-spacing:2px">Established 2005</span></div>
<h1 style="font-family:'${fH}',serif;font-size:clamp(36px,5vw,60px);font-weight:700;color:#fff;line-height:1.1;margin-bottom:20px">Protecting What<br/>Matters Most</h1>
<p style="font-size:17px;color:rgba(255,255,255,.75);line-height:1.7;max-width:500px;margin-bottom:32px">Expert legal counsel in corporate law, litigation, estate planning, and real estate. Serving individuals and businesses with integrity.</p>
<div style="display:flex;gap:12px;flex-wrap:wrap">
<a href="#" style="padding:14px 28px;background:${s};color:#fff;border-radius:8px;font-weight:600;box-shadow:0 4px 20px ${s}30">Free Consultation</a>
<a href="#" style="padding:14px 28px;border:1.5px solid rgba(255,255,255,.3);color:#fff;border-radius:8px;font-weight:600">Call (555) 987-6543</a></div>
</div>
<div class="hide-m" style="background:rgba(255,255,255,.1);backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,.15);border-radius:16px;padding:28px">
<h3 style="font-family:'${fH}',serif;font-size:18px;color:#fff;margin-bottom:20px">Request a Consultation</h3>
<input type="text" placeholder="Full Name" style="width:100%;padding:10px 14px;border-radius:8px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.08);color:#fff;font-size:14px;margin-bottom:10px"/>
<input type="email" placeholder="Email Address" style="width:100%;padding:10px 14px;border-radius:8px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.08);color:#fff;font-size:14px;margin-bottom:10px"/>
<select style="width:100%;padding:10px 14px;border-radius:8px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.08);color:rgba(255,255,255,.6);font-size:14px;margin-bottom:16px"><option>Select Practice Area</option><option>Corporate Law</option><option>Litigation</option><option>Estate Planning</option><option>Real Estate</option></select>
<a href="#" style="display:block;text-align:center;padding:12px;background:${s};color:#fff;border-radius:8px;font-weight:600;font-size:14px">Submit Request</a>
</div></div></div></section>`;

  // PRACTICE AREAS
  b += `<section class="sp" style="padding:100px 20px;background:#f8fafc"><div class="ctn"><div style="text-align:center;margin-bottom:60px"><p style="font-size:13px;color:${s};text-transform:uppercase;letter-spacing:2px;font-weight:600;margin-bottom:12px">Expertise</p><h2 style="font-family:'${fH}',serif;font-size:clamp(28px,4vw,44px);font-weight:700;color:${p}">Practice Areas</h2></div>
<div class="g4" style="display:grid;grid-template-columns:repeat(4,1fr);gap:20px">${[{i:'\u{1F3E2}',t:'Corporate Law',d:'Business formation, contracts, mergers and acquisitions.'},{i:'\u2696\uFE0F',t:'Litigation',d:'Civil and commercial dispute resolution and trial advocacy.'},{i:'\u{1F4DC}',t:'Estate Planning',d:'Wills, trusts, probate and asset protection strategies.'},{i:'\u{1F3E0}',t:'Real Estate',d:'Commercial and residential transactions, zoning, leasing.'}].map(a=>`<div class="card" style="padding:24px;border-radius:16px;background:#fff;border:1px solid #e2e8f0;text-align:center"><div style="font-size:32px;margin-bottom:12px">${a.i}</div><h3 style="font-family:'${fH}',serif;font-size:17px;font-weight:600;color:${p};margin-bottom:6px">${a.t}</h3><p style="font-size:13px;line-height:1.7;color:#64748b">${a.d}</p></div>`).join('')}</div></div></section>`;

  // CASE RESULTS
  b += `<section class="sp" style="padding:80px 20px;background:${p}"><div class="ctn"><div style="text-align:center;margin-bottom:60px"><p style="font-size:13px;color:#60a5fa;text-transform:uppercase;letter-spacing:2px;font-weight:600;margin-bottom:12px">Track Record</p><h2 style="font-family:'${fH}',serif;font-size:clamp(28px,4vw,44px);font-weight:700;color:#fff">Notable Case Results</h2></div>
<div class="g3" style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px">${[{r:'$12.5M',t:'Corporate Merger',d:'Successfully structured a multi-party acquisition for a tech firm.'},{r:'$4.2M',t:'Commercial Litigation',d:'Breach of contract verdict in favor of our client, a regional retailer.'},{r:'$8.7M',t:'Real Estate Dispute',d:'Resolved a complex multi-property development disagreement.'}].map(c=>`<div style="padding:28px;border-radius:16px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1)"><div style="font-family:'${fH}',serif;font-size:32px;font-weight:700;color:#60a5fa;margin-bottom:8px">${c.r}</div><h3 style="font-size:16px;font-weight:600;color:#fff;margin-bottom:6px">${c.t}</h3><p style="font-size:13px;color:rgba(255,255,255,.6);line-height:1.7">${c.d}</p></div>`).join('')}</div></div></section>`;

  // ATTORNEYS
  b += `<section class="sp" style="padding:100px 20px;background:#f8fafc"><div class="ctn"><div style="text-align:center;margin-bottom:60px"><p style="font-size:13px;color:${s};text-transform:uppercase;letter-spacing:2px;font-weight:600;margin-bottom:12px">Legal Team</p><h2 style="font-family:'${fH}',serif;font-size:clamp(28px,4vw,44px);font-weight:700;color:${p}">Our Attorneys</h2></div>
<div class="g4" style="display:grid;grid-template-columns:repeat(4,1fr);gap:24px">${[{n:'Robert Axiom',r:'Managing Partner',bar:'NY, CA Bar',exp:'25+ Years',img:im.team[0]},{n:'Catherine Wells',r:'Senior Partner',bar:'NY, DC Bar',exp:'18+ Years',img:im.team[1]},{n:'David Kim',r:'Associate Partner',bar:'NY Bar',exp:'12+ Years',img:im.team[2]},{n:'Michael Chen',r:'Senior Associate',bar:'CA, TX Bar',exp:'8+ Years',img:im.team[3]}].map(a=>`<div class="card" style="padding:20px;border-radius:16px;background:#fff;border:1px solid #e2e8f0;text-align:center"><img src="${a.img}" style="width:90px;height:90px;border-radius:50%;object-fit:cover;margin:0 auto 12px;display:block;border:3px solid ${p}15" onerror="this.style.display='none'"/><h3 style="font-family:'${fH}',serif;font-size:16px;font-weight:600;color:${p}">${a.n}</h3><p style="font-size:13px;color:${s};font-weight:600;margin-top:2px">${a.r}</p><p style="font-size:11px;color:#94a3b8;margin-top:4px">${a.bar}</p><p style="font-size:11px;color:#94a3b8">${a.exp}</p></div>`).join('')}</div></div></section>`;

  // STATS
  b += `<section style="padding:60px 20px;background:#fff;border-top:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0"><div class="ctn g4" style="display:grid;grid-template-columns:repeat(4,1fr);gap:32px;text-align:center">${[{n:'500+',l:'Cases Won'},{n:'$50M+',l:'Recovered'},{n:'20+',l:'Years Practice'},{n:'98%',l:'Client Retention'}].map(x=>`<div><div style="font-family:'${fH}',serif;font-size:clamp(28px,3vw,40px);font-weight:700;color:${p}">${x.n}</div><div style="font-size:13px;color:#94a3b8;margin-top:4px">${x.l}</div></div>`).join('')}</div></section>`;

  // TESTIMONIAL
  b += `<section class="sp" style="padding:80px 20px;background:#f8fafc"><div style="max-width:700px;margin:0 auto;text-align:center">
<div style="font-family:'${fH}',serif;font-size:56px;color:${p}15;line-height:1">&ldquo;</div>
<p style="font-family:'${fH}',serif;font-size:clamp(18px,2.5vw,22px);line-height:1.7;color:${p};margin-bottom:20px;font-style:italic">Axiom & Associates protected our family through a complex estate dispute with professionalism and compassion. They exceeded our expectations at every turn.</p>
<p style="font-size:14px;color:#64748b;font-weight:600">\u2014 The Williams Family</p>
</div></section>`;

  // CTA
  b += `<section style="padding:100px 20px;background:${p};text-align:center"><div style="max-width:600px;margin:0 auto"><h2 style="font-family:'${fH}',serif;font-size:clamp(28px,4vw,44px);font-weight:700;color:#fff;margin-bottom:16px">Get Expert Legal Counsel</h2><p style="font-size:16px;color:rgba(255,255,255,.75);margin-bottom:32px">Schedule a free, confidential consultation with one of our experienced attorneys.</p><div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap"><a href="#" style="padding:14px 32px;background:${s};color:#fff;border-radius:8px;font-weight:700;display:inline-block">Schedule Consultation</a><a href="#" style="padding:14px 32px;border:1.5px solid rgba(255,255,255,.3);color:#fff;border-radius:8px;font-weight:700;display:inline-block">Call (555) 987-6543</a></div></div></section>`;

  b += footer('Axiom & Associates','Expert legal counsel for individuals and businesses.',false,fH,fB);
  return wrap('Axiom Professional',fH,fB,false,p,s,b);
}

/* ============ ROUTE HANDLER ============ */
const BUILDERS: Record<string, (im: typeof IMG[string]) => string> = {
  'obsidian-saas': buildSaas,
  'ivory-realty': buildRealty,
  'titan-fitness': buildFitness,
  'maison-restaurant': buildRestaurant,
  'nova-agency': buildAgency,
  'meridian-health': buildHealth,
  'luxe-ecommerce': buildEcommerce,
  'axiom-law': buildLaw,
};

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  const { templateId } = await context.params;
  const template = getTemplateById(templateId);

  if (!template) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  }

  const images = getImages(templateId);
  const builder = BUILDERS[templateId];

  if (!builder) {
    return NextResponse.json({ error: 'Preview not available' }, { status: 404 });
  }

  const html = builder(images);

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
