#!/usr/bin/env node
/**
 * T-07: Generate hormone/peptide/longevity SEO crossover pages
 * 50 cities × 7 treatments = 350 pages
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const set_a = (f) => { try { for (const l of fs.readFileSync(f,'utf8').split('\n')) { const m=l.match(/^([A-Z_0-9]+)=["']?(.+?)["']?\s*$/); if(m&&!process.env[m[1]])process.env[m[1]]=m[2].trim(); } } catch{} };
set_a(path.join(__dirname,'../.env.local'));
set_a(path.join(process.env.HOME,'.openclaw/workspace/.keys.env'));

const SB = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: KEY, Authorization: 'Bearer ' + KEY };

const TREATMENTS = [
  { slug: 'hormone-therapy',           label: 'Hormone Therapy',           tagline: 'Balance your hormones, reclaim your vitality.' },
  { slug: 'peptide-therapy',           label: 'Peptide Therapy',           tagline: 'Cutting-edge peptides for recovery, longevity, and performance.' },
  { slug: 'longevity',                 label: 'Longevity & Anti-Aging',    tagline: 'Science-backed protocols to slow aging and extend healthspan.' },
  { slug: 'wellness',                  label: 'Wellness & Preventive Care',tagline: 'Proactive health optimization for high performers.' },
  { slug: 'testosterone-replacement',  label: 'Testosterone Replacement Therapy (TRT)', tagline: 'Restore optimal T levels, energy, and body composition.' },
  { slug: 'semaglutide',               label: 'Semaglutide / GLP-1 Weight Loss', tagline: 'Medical weight loss with FDA-cleared GLP-1 therapy.' },
  { slug: 'iv-therapy',                label: 'IV Therapy & Vitamin Infusions', tagline: 'Fast-acting nutrient delivery for energy, immunity, and recovery.' },
];

const TOP_50 = ["Tampa","Miami Beach","Charlotte","Miami","Naples","Las Vegas","Surfside","Orlando","Key Biscayne","Fisher Island","Hallandale Beach","Jupiter","Lauderhill","Boca Raton","San Antonio","Fort Lauderdale","Bal Harbour","Wellington","Jacksonville","Austin","Dallas","Chicago","North Miami","Minneapolis","Miami Lakes","Henderson","Phoenix","Bradenton","Denver","San Diego","Lake Worth","Estero","Columbus","Winter Park","Philadelphia","Tamarac","Newport Beach","Seattle","Aventura","Palm Beach Gardens","Doral","Houston","Atlanta","Margate","Davie","Deerfield Beach","San Francisco","Tempe","New York City","Beverly Hills"];

// State lookup
const STATE_MAP = {"Tampa":"FL","Miami Beach":"FL","Charlotte":"NC","Miami":"FL","Naples":"FL","Las Vegas":"NV","Surfside":"FL","Orlando":"FL","Key Biscayne":"FL","Fisher Island":"FL","Hallandale Beach":"FL","Jupiter":"FL","Lauderhill":"FL","Boca Raton":"FL","San Antonio":"TX","Fort Lauderdale":"FL","Bal Harbour":"FL","Wellington":"FL","Jacksonville":"FL","Austin":"TX","Dallas":"TX","Chicago":"IL","North Miami":"FL","Minneapolis":"MN","Miami Lakes":"FL","Henderson":"NV","Phoenix":"AZ","Bradenton":"FL","Denver":"CO","San Diego":"CA","Lake Worth":"FL","Estero":"FL","Columbus":"OH","Winter Park":"FL","Philadelphia":"PA","Tamarac":"FL","Newport Beach":"CA","Seattle":"WA","Aventura":"FL","Palm Beach Gardens":"FL","Doral":"FL","Houston":"TX","Atlanta":"GA","Margate":"FL","Davie":"FL","Deerfield Beach":"FL","San Francisco":"CA","Tempe":"AZ","New York City":"NY","Beverly Hills":"CA"};

function slugify(s) { return s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''); }

function get(url) {
  return new Promise((res,rej) => {
    const u = new URL(url);
    https.get({hostname:u.hostname,path:u.pathname+u.search,headers:H}, r => {
      let d=''; r.on('data',c=>d+=c); r.on('end',()=>{ try{res(JSON.parse(d));}catch{res([]); }});
    }).on('error',rej);
  });
}

async function getTopClinics(city, n=3) {
  const url = `${SB}/rest/v1/clinics?city=eq.${encodeURIComponent(city)}&visibility=eq.visible&order=glow_score.desc,review_count.desc&limit=${n}&select=name,glow_score,review_count,website,address`;
  const clinics = await get(url);
  return Array.isArray(clinics) ? clinics : [];
}

async function getCityCount(city) {
  const url = `${SB}/rest/v1/clinics?city=eq.${encodeURIComponent(city)}&visibility=eq.visible&select=id&limit=1`;
  return new Promise((res) => {
    const u = new URL(url);
    https.get({hostname:u.hostname,path:u.pathname+u.search,headers:{...H,'Prefer':'count=exact'}}, r => {
      let d=''; r.on('data',c=>d+=c);
      r.on('end',()=>{
        const cr = r.headers['content-range']||'';
        const m = cr.match(/\/(\d+)$/);
        res(m ? parseInt(m[1]) : 0);
      });
    }).on('error',()=>res(0));
  });
}

function generatePage(city, state, treatment, clinics, clinicCount) {
  const year = 2026;
  const top = clinics.slice(0,3);
  const citySlug = slugify(city);
  const avgScore = clinics.length ? (clinics.reduce((s,c)=>s+(c.glow_score||0),0)/clinics.length).toFixed(1) : '4.8';

  const clinicList = top.length
    ? top.map((c,i) => `${i+1}. **${c.name}** — ${c.glow_score}★ (${c.review_count} reviews)`).join('\n')
    : `Search GlowRoute for top-rated ${treatment.label} providers in ${city}.`;

  const faqItems = [
    { q: `How much does ${treatment.label} cost in ${city}?`, a: `Costs vary by provider and protocol. In ${city}, expect to pay $150–$500+ per session for ${treatment.label}. Many clinics offer consultation packages or monthly memberships that reduce per-visit costs.` },
    { q: `Is ${treatment.label} safe?`, a: `When administered by a licensed medical professional, ${treatment.label} is considered safe for most healthy adults. Always verify your provider's credentials and request a full medical consultation before starting any hormone or peptide protocol.` },
    { q: `How do I find a qualified ${treatment.label} provider in ${city}?`, a: `Look for board-certified physicians, nurse practitioners, or physician assistants with specific training in hormone optimization or functional medicine. GlowRoute verifies provider credentials and aggregates patient reviews to help you choose confidently.` },
    { q: `How long before I see results from ${treatment.label}?`, a: `Most patients notice early changes within 2–6 weeks, with full effects at 3–6 months depending on your baseline levels, the protocol used, and lifestyle factors like sleep, nutrition, and exercise.` },
    { q: `Does insurance cover ${treatment.label} in ${city}?`, a: `Most insurance plans do not cover elective ${treatment.label} protocols. However, if treatment is medically necessary (e.g., diagnosed hypogonadism or hormone deficiency), partial coverage may apply. Confirm with your provider and insurance carrier.` },
  ];

  return `---
title: "${treatment.label} in ${city}, ${state} | Top Providers ${year}"
description: "Find the best ${treatment.label} providers in ${city}, ${state}. Compare ${clinicCount}+ verified clinics, read real patient reviews, and book your consultation today."
city: "${city}"
state: "${state}"
treatment: "${treatment.slug}"
year: ${year}
clinicCount: ${clinicCount}
lastUpdated: "${new Date().toISOString().slice(0,10)}"
---

# ${treatment.label} in ${city}, ${state}: Top Providers in ${year}

${city} has ${clinicCount} verified wellness and aesthetic clinics on GlowRoute${clinicCount > 0 ? `, with an average patient rating of ${avgScore}★` : ''}. If you're researching ${treatment.label} in ${city}, you're in the right place.

${treatment.tagline}

## Why ${city} Residents Choose ${treatment.label}

${city} has become a hub for advanced wellness and aesthetic medicine, with a growing number of clinics offering evidence-based ${treatment.label} protocols. Patients choose ${city} providers for:

- Access to board-certified physicians specializing in hormone optimization and longevity medicine
- Competitive pricing compared to major metro markets
- Personalized treatment plans with follow-up monitoring
- Convenient locations with flexible scheduling

## Top ${treatment.label} Clinics in ${city}

${clinicList}

[View all ${treatment.label} providers in ${city} →](https://glowroute.sealey.ai/?search=${encodeURIComponent(city)})

## What to Expect from ${treatment.label}

Before starting any ${treatment.label} protocol in ${city}, your provider will typically:

1. **Initial consultation** — Review your health history, symptoms, and goals
2. **Lab work** — Baseline bloodwork to assess hormone levels and biomarkers
3. **Personalized protocol** — Custom dosing and delivery method based on your results
4. **Follow-up monitoring** — Regular check-ins and lab repeats to optimize your protocol
5. **Ongoing support** — Lifestyle guidance on nutrition, sleep, and exercise to amplify results

## How to Choose a ${treatment.label} Provider in ${city}

Not all providers are equal. When evaluating ${city} clinics for ${treatment.label}, look for:

- **Credentials** — MD, DO, NP, or PA with specific training in hormone/functional medicine
- **Transparency** — Clear pricing, informed consent, and willingness to share their protocol details
- **Monitoring** — Regular labs and follow-ups (avoid any provider who doesn't require bloodwork)
- **Reviews** — Real patient feedback on GlowRoute, Google, and Healthgrades

## Frequently Asked Questions

${faqItems.map(f => `### ${f.q}\n${f.a}`).join('\n\n')}

---

## Find ${treatment.label} Providers in ${city} Today

GlowRoute has verified ${clinicCount}+ clinics in ${city} offering ${treatment.label} and related wellness services. Browse real patient reviews, compare GlowScores, and find the right provider for your goals.

[Search ${treatment.label} in ${city} →](https://glowroute.sealey.ai/?search=${encodeURIComponent(city)}&treatment=${treatment.slug})
`;
}

async function main() {
  const outDir = path.join(__dirname, '../app/treatments');
  let generated = 0, errors = 0;
  const manifest = [];

  for (const city of TOP_50) {
    const state = STATE_MAP[city] || 'US';
    const citySlug = slugify(city);
    const [topClinics, clinicCount] = await Promise.all([
      getTopClinics(city, 5),
      getCityCount(city)
    ]);

    for (const treatment of TREATMENTS) {
      try {
        const dir = path.join(outDir, citySlug, treatment.slug);
        fs.mkdirSync(dir, { recursive: true });
        const content = generatePage(city, state, treatment, topClinics, clinicCount);
        fs.writeFileSync(path.join(dir, 'page.md'), content);
        generated++;
        manifest.push({ city, state, treatment: treatment.slug, path: `/treatments/${citySlug}/${treatment.slug}`, clinicCount });
      } catch (err) {
        console.error(`  ❌ ${city}/${treatment.slug}: ${err.message}`);
        errors++;
      }
    }
    process.stdout.write(`  ✅ ${city} (${clinicCount} clinics) — 7 pages\n`);
    await new Promise(r => setTimeout(r, 100)); // gentle rate limit
  }

  // Save manifest
  fs.writeFileSync(path.join(__dirname,'../output/seo-pages-manifest.json'), JSON.stringify(manifest, null, 2));

  console.log(`\n════════════════════════════════`);
  console.log(`✅ Generated: ${generated} pages`);
  console.log(`❌ Errors:    ${errors}`);
  console.log(`📁 Location:  app/treatments/[city]/[treatment]/page.md`);
  console.log(`📋 Manifest:  output/seo-pages-manifest.json`);
  console.log(`════════════════════════════════`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
