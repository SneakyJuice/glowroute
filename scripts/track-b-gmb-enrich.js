#!/usr/bin/env node
/**
 * track-b-gmb-enrich.js
 *
 * Re-scrapes GMB for 314 medspas with empty services[] via Apify Google Maps actor.
 * Writes place_id + services[] back to Supabase.
 *
 * Strategy: batch 10 clinics per Apify run (sync), 32 runs total.
 * Apify free plan: 8GB concurrent — run sequentially.
 *
 * Usage:
 *   node scripts/track-b-gmb-enrich.js              # dry run (no writes)
 *   node scripts/track-b-gmb-enrich.js --write      # live run
 *   node scripts/track-b-gmb-enrich.js --write --batch=0   # resume from batch 0
 */

const fs = require('fs');
const path = require('path');

const DRY_RUN = !process.argv.includes('--write');
const START_BATCH = parseInt((process.argv.find(a => a.startsWith('--batch=')) || '--batch=0').split('=')[1]);
const BATCH_SIZE = 10;

const SUPA_URL = process.env.SUPABASE_URL || 'https://psiuknphchmhsthvhkpt.supabase.co';
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const APIFY_KEY = process.env.APIFY_API_KEY;

if (!SUPA_KEY) { console.error('❌ SUPABASE_SERVICE_ROLE_KEY not set'); process.exit(1); }
if (!APIFY_KEY) { console.error('❌ APIFY_API_KEY not set'); process.exit(1); }

// Load taxonomy for category → canonical mapping
const taxonomy = JSON.parse(fs.readFileSync(path.join(__dirname, '../lib/taxonomy.json'), 'utf8'));
const variantMap = new Map();
for (const [slug, def] of Object.entries(taxonomy.canonicals)) {
  for (const v of def.variants) variantMap.set(v.toLowerCase().trim(), slug);
}

// GMB category → canonical service slug mappings (raw GMB strings)
const GMB_CATEGORY_MAP = {
  'medical spa': 'anti-aging',
  'medspa': 'anti-aging',
  'med spa': 'anti-aging',
  'day spa': 'hydrafacial',
  'spa': 'anti-aging',
  'beauty salon': 'anti-aging',
  'skin care clinic': 'anti-aging',
  'weight loss service': 'weight-loss-ozempic',
  'weight loss clinic': 'weight-loss-ozempic',
  'wellness center': 'trt-testosterone',
  'medical clinic': 'anti-aging',
  'medical center': 'anti-aging',
  'health consultant': 'trt-testosterone',
  'laser hair removal service': 'laser-hair-removal',
  'laser hair removal': 'laser-hair-removal',
  'hair removal service': 'laser-hair-removal',
  'botox service': 'botox-fillers',
  'cosmetic surgeon': 'cosmetic-surgery',
  'plastic surgeon': 'cosmetic-surgery',
  'hormone therapy': 'trt-testosterone',
  'iv therapy': 'iv-therapy',
  'dermatologist': 'anti-aging',
  'massage therapist': 'massage-wellness',
  'massage spa': 'massage-wellness',
  'hair transplantation clinic': 'hair-restoration',
  'body sculpting': 'coolsculpting',
  'coolsculpting': 'coolsculpting',
  'peptide therapy': 'peptide-therapy',
};

function mapGmbCategories(categories) {
  const slugs = new Set();
  for (const cat of (categories || [])) {
    const key = cat.toLowerCase().trim();
    // Direct map
    const direct = GMB_CATEGORY_MAP[key];
    if (direct) { slugs.add(direct); continue; }
    // Variant map
    const variant = variantMap.get(key);
    if (variant) slugs.add(variant);
    // Keyword fallback
    if (key.includes('botox') || key.includes('filler') || key.includes('injectable')) slugs.add('botox-fillers');
    if (key.includes('laser') && key.includes('hair')) slugs.add('laser-hair-removal');
    if (key.includes('laser')) slugs.add('laser-skin');
    if (key.includes('weight')) slugs.add('weight-loss-ozempic');
    if (key.includes('hormone') || key.includes('testosterone')) slugs.add('trt-testosterone');
    if (key.includes('peptide')) slugs.add('peptide-therapy');
    if (key.includes('iv') || key.includes('infusion') || key.includes('drip')) slugs.add('iv-therapy');
    if (key.includes('microneedl')) slugs.add('microneedling');
    if (key.includes('hydrafacial') || key.includes('facial')) slugs.add('hydrafacial');
    if (key.includes('coolsculpt') || key.includes('body contour') || key.includes('body sculpt')) slugs.add('coolsculpting');
    if (key.includes('chemical peel') || key.includes('dermabrasion')) slugs.add('chemical-peels');
    if (key.includes('hair restor') || key.includes('hair transplant')) slugs.add('hair-restoration');
    if (key.includes('prp')) slugs.add('prp-treatments');
    if (key.includes('wellness') || key.includes('medical') || key.includes('medspa') || key.includes('spa')) slugs.add('anti-aging');
  }
  return [...slugs].sort();
}

async function fetchTargets() {
  const url = `${SUPA_URL}/rest/v1/clinics?select=id,slug,name,city,state,address,review_count&goals=eq.%7B%7D&glow_score=gte.4&services=eq.%7B%7D&limit=500&order=review_count.desc`;
  const r = await fetch(url, {
    headers: { 'apikey': SUPA_KEY, 'Authorization': 'Bearer ' + SUPA_KEY }
  });
  const data = await r.json();
  if (!Array.isArray(data)) { console.error('Unexpected response:', JSON.stringify(data).slice(0,200)); return []; }
  // Filter to likely medspas
  return data.filter(c =>
    /spa|aesthetic|wellness|med|clinic|beauty|laser|skin|inject|peptide|hormone|weight|body|anti/i.test(c.name)
  );
}

async function apifyScrape(queries) {
  const url = `https://api.apify.com/v2/acts/compass~crawler-google-places/run-sync-get-dataset-items?maxItems=${queries.length}&timeout=120`;
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${APIFY_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      searchStringsArray: queries,
      maxCrawledPlacesPerSearch: 1,
      language: 'en',
      maxImages: 0,
      includeReviews: false,
    })
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`Apify error ${r.status}: ${t.slice(0, 200)}`);
  }
  return r.json();
}

async function updateClinic(id, placeId, services) {
  const url = `${SUPA_URL}/rest/v1/clinics?id=eq.${id}`;
  await fetch(url, {
    method: 'PATCH',
    headers: {
      'apikey': SUPA_KEY, 'Authorization': 'Bearer ' + SUPA_KEY,
      'Content-Type': 'application/json', 'Prefer': 'return=minimal'
    },
    body: JSON.stringify({ place_id: placeId, services, gmb_enriched_at: new Date().toISOString() })
  });
}

async function main() {
  const targets = await fetchTargets();
  console.log(`[track-b] ${targets.length} targets loaded`);
  if (DRY_RUN) {
    console.log('[track-b] DRY RUN — pass --write to apply');
    console.log('Sample targets:');
    targets.slice(0, 5).forEach(t => console.log(`  ${t.name} (${t.city}, ${t.state})`));
    console.log(`\nEstimated batches: ${Math.ceil(targets.length / BATCH_SIZE)}`);
    console.log(`Estimated Apify cost: ~${(targets.length * 0.004).toFixed(2)} credits`);
    return;
  }

  const logPath = path.join(__dirname, '../logs/track-b-enrich.jsonl');
  fs.mkdirSync(path.dirname(logPath), { recursive: true });
  const logStream = fs.createWriteStream(logPath, { flags: 'a' });

  let enriched = 0, skipped = 0, failed = 0;
  const batches = Math.ceil(targets.length / BATCH_SIZE);

  for (let b = START_BATCH; b < batches; b++) {
    const batch = targets.slice(b * BATCH_SIZE, (b + 1) * BATCH_SIZE);
    const queries = batch.map(c => `${c.name} ${c.city} ${c.state || 'FL'}`);

    process.stdout.write(`\r  Batch ${b+1}/${batches}: scraping ${batch.length} clinics...`);

    let results;
    try {
      results = await apifyScrape(queries);
    } catch (e) {
      console.error(`\n  ❌ Batch ${b+1} failed: ${e.message}`);
      failed += batch.length;
      await new Promise(r => setTimeout(r, 5000)); // wait before retry
      continue;
    }

    // Match results back to clinics by name similarity
    for (const clinic of batch) {
      const match = results.find(r => {
        if (!r.title) return false;
        const a = r.title.toLowerCase().replace(/[^a-z0-9]/g, '');
        const b = clinic.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        return a.includes(b.slice(0, 12)) || b.includes(a.slice(0, 12));
      });

      if (!match) { skipped++; continue; }

      const services = mapGmbCategories(match.categories || []);
      const placeId = match.placeId || null;

      logStream.write(JSON.stringify({
        id: clinic.id, name: clinic.name, city: clinic.city,
        gmb_name: match.title, place_id: placeId,
        categories: match.categories, services,
      }) + '\n');

      if (services.length > 0 || placeId) {
        await updateClinic(clinic.id, placeId, services.length > 0 ? services : undefined);
        enriched++;
      } else {
        skipped++;
      }
    }

    process.stdout.write(`\r  Batch ${b+1}/${batches} done — enriched: ${enriched}, skipped: ${skipped}, failed: ${failed}    \n`);

    // Rate limit: wait 2s between batches
    if (b < batches - 1) await new Promise(r => setTimeout(r, 2000));
  }

  logStream.end();
  console.log(`\n✅ Track B complete — enriched: ${enriched}, skipped: ${skipped}, failed: ${failed}`);
  console.log(`📝 Log: ${logPath}`);
  console.log('\nNext: run taxonomy-backfill.js --write + goals-backfill.js --write to propagate new services');
}

main().catch(err => { console.error(err); process.exit(1); });
