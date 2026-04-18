#!/usr/bin/env node
/**
 * Regenerate all 350 SEO pages with clean data (fixed glow_score scale + null handling)
 */
const https = require('https');
const fs = require('fs');
const path = require('path');

const envFiles = [path.join(__dirname,'../.env.local'), path.join(process.env.HOME,'.openclaw/workspace/.keys.env')];
envFiles.forEach(f => { try { for (const l of fs.readFileSync(f,'utf8').split('\n')) { const m=l.match(/^(?:export\s+)?([A-Z_0-9]+)=['"]?(.+?)['"]?\s*$/); if(m&&!process.env[m[1]])process.env[m[1]]=m[2]; } } catch{} });

const SB = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: KEY, Authorization: 'Bearer ' + KEY };

function get(url) {
  return new Promise((res,rej) => {
    const u = new URL(url);
    https.get({hostname:u.hostname,path:u.pathname+u.search,headers:H}, r => {
      let d=''; r.on('data',c=>d+=c);
      r.on('end',()=>{ try{res(JSON.parse(d));}catch{res([]);} });
    }).on('error',rej);
  });
}

function normScore(s) {
  if (!s || isNaN(s)) return null;
  const n = parseFloat(s);
  return n > 5 ? (n / 20).toFixed(1) : n.toFixed(1);
}

function slugify(s) { return s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''); }

async function getTopClinics(city) {
  const clinics = await get(SB+'/rest/v1/clinics?city=eq.'+encodeURIComponent(city)+'&visibility=eq.visible&order=review_count.desc&limit=5&select=name,glow_score,review_count');
  return clinics.filter(c => c.review_count > 0).slice(0,3);
}

async function getCityCount(city) {
  return new Promise(res => {
    const u = new URL(SB+'/rest/v1/clinics?city=eq.'+encodeURIComponent(city)+'&visibility=eq.visible&select=id&limit=1');
    https.get({hostname:u.hostname,path:u.pathname+u.search,headers:{...H,'Prefer':'count=exact'}}, r => {
      let d=''; r.on('data',c=>d+=c);
      r.on('end',()=>{ const m=(r.headers['content-range']||'').match(/\/(\d+)$/); res(m?parseInt(m[1]):0); });
    }).on('error',()=>res(0));
  });
}

const TREATMENTS = [
  {slug:'hormone-therapy',          label:'Hormone Therapy',                    tagline:'Balance your hormones, reclaim your vitality.'},
  {slug:'peptide-therapy',          label:'Peptide Therapy',                    tagline:'Cutting-edge peptides for recovery, longevity, and performance.'},
  {slug:'longevity',                label:'Longevity & Anti-Aging',             tagline:'Science-backed protocols to slow aging and extend healthspan.'},
  {slug:'wellness',                 label:'Wellness & Preventive Care',         tagline:'Proactive health optimization for high performers.'},
  {slug:'testosterone-replacement', label:'Testosterone Replacement Therapy',   tagline:'Restore optimal T levels, energy, and body composition.'},
  {slug:'semaglutide',              label:'Semaglutide / GLP-1 Weight Loss',    tagline:'Medical weight loss with FDA-cleared GLP-1 therapy.'},
  {slug:'iv-therapy',               label:'IV Therapy & Vitamin Infusions',     tagline:'Fast-acting nutrient delivery for energy, immunity, and recovery.'},
];

const CITIES = {
  'Tampa':'FL','Miami Beach':'FL','Charlotte':'NC','Miami':'FL','Naples':'FL','Las Vegas':'NV',
  'Surfside':'FL','Orlando':'FL','Key Biscayne':'FL','Hallandale Beach':'FL','Jupiter':'FL',
  'Lauderhill':'FL','Boca Raton':'FL','San Antonio':'TX','Fort Lauderdale':'FL','Wellington':'FL',
  'Jacksonville':'FL','Austin':'TX','Dallas':'TX','Chicago':'IL','North Miami':'FL','Minneapolis':'MN',
  'Miami Lakes':'FL','Henderson':'NV','Phoenix':'AZ','Bradenton':'FL','Denver':'CO','San Diego':'CA',
  'Lake Worth':'FL','Estero':'FL','Columbus':'OH','Winter Park':'FL','Philadelphia':'PA','Tamarac':'FL',
  'Newport Beach':'CA','Seattle':'WA','Aventura':'FL','Palm Beach Gardens':'FL','Houston':'TX',
  'Atlanta':'GA','Margate':'FL','Davie':'FL','Deerfield Beach':'FL','San Francisco':'CA',
  'Tempe':'AZ','New York City':'NY','Beverly Hills':'CA','Doral':'FL','Scottsdale':'AZ','Nashville':'TN'
};

function buildPage(city, state, t, clinics, count) {
  const clinicList = clinics.length
    ? clinics.map((c,i) => `${i+1}. **${c.name}** — ${normScore(c.glow_score)}★ (${c.review_count} reviews)`).join('\n')
    : `Browse verified ${t.label} providers on GlowRoute.`;

  const faq = [
    {q:`How much does ${t.label} cost in ${city}?`, a:`Costs vary by provider and protocol. In ${city}, expect $150–$500+ per session for ${t.label}. Many clinics offer membership pricing that reduces per-visit costs.`},
    {q:`Is ${t.label} safe?`, a:`When administered by a licensed medical professional, ${t.label} is considered safe for most healthy adults. Always verify credentials and request a full medical consultation.`},
    {q:`How do I find a qualified ${t.label} provider in ${city}?`, a:`Look for board-certified physicians, nurse practitioners, or PAs with specific training. GlowRoute verifies providers and surfaces real patient reviews.`},
    {q:`How long before I see results from ${t.label}?`, a:`Most patients notice early changes within 2–6 weeks, with full effects at 3–6 months depending on baseline levels and lifestyle.`},
    {q:`Does insurance cover ${t.label} in ${city}?`, a:`Most plans do not cover elective ${t.label}. If medically necessary, partial coverage may apply — confirm with your provider and insurer.`},
  ];

  return `---
title: "${t.label} in ${city}, ${state} | Top Providers 2026"
description: "Find the best ${t.label} providers in ${city}, ${state}. Compare ${count}+ verified clinics, read real patient reviews, and book your consultation today."
city: "${city}"
state: "${state}"
treatment: "${t.slug}"
clinicCount: ${count}
lastUpdated: "2026-04-05"
---

# ${t.label} in ${city}, ${state}: Top Providers in 2026

${city} has ${count} verified wellness and aesthetic clinics on GlowRoute. ${t.tagline}

## Why ${city} Residents Choose ${t.label}

${city} has become a hub for advanced wellness medicine, with providers offering evidence-based ${t.label} protocols. Patients choose ${city} providers for:

- Access to board-certified physicians specializing in hormone optimization and longevity medicine
- Personalized treatment plans with ongoing lab monitoring
- Competitive pricing with flexible membership options
- Convenient locations across the metro area

## Top ${t.label} Clinics in ${city}

${clinicList}

[View all ${t.label} providers in ${city} →](https://glowroute.io/?search=${encodeURIComponent(city)})

## What to Expect from ${t.label}

Before starting any ${t.label} protocol in ${city}, your provider will typically:

1. **Initial consultation** — Review your health history, symptoms, and goals
2. **Lab work** — Baseline bloodwork to assess your hormone levels and biomarkers
3. **Personalized protocol** — Custom dosing and delivery method based on your results
4. **Follow-up monitoring** — Regular check-ins and lab repeats to optimize your protocol
5. **Ongoing support** — Lifestyle guidance on nutrition, sleep, and exercise

## Frequently Asked Questions

${faq.map(f => `### ${f.q}\n${f.a}`).join('\n\n')}

---

## Find ${t.label} Providers in ${city} Today

GlowRoute has ${count}+ verified clinics in ${city} offering ${t.label} and related wellness services.

[Search ${t.label} in ${city} →](https://glowroute.io/?search=${encodeURIComponent(city)}&treatment=${t.slug})
`;
}

async function main() {
  let generated = 0;
  const manifest = [];
  for (const [city, state] of Object.entries(CITIES)) {
    const citySlug = slugify(city);
    const [topClinics, count] = await Promise.all([getTopClinics(city), getCityCount(city)]);
    for (const t of TREATMENTS) {
      const dir = path.join(__dirname, '../public/seo-content/treatments', citySlug, t.slug);
      fs.mkdirSync(dir, {recursive:true});
      fs.writeFileSync(path.join(dir, 'page.md'), buildPage(city, state, t, topClinics, count));
      manifest.push({city, state, citySlug, treatment: t.slug, path: `/treatments/${citySlug}/${t.slug}`, clinicCount: count});
      generated++;
    }
    process.stdout.write(`  ✅ ${city} (${count} clinics, ${topClinics.length} with reviews)\n`);
    await new Promise(r => setTimeout(r, 80));
  }
  fs.writeFileSync(path.join(__dirname, '../output/seo-pages-manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(`\n✅ Regenerated ${generated} pages`);
}

main().catch(e => { console.error(e); process.exit(1); });
