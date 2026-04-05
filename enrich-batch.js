#!/usr/bin/env node
/**
 * GlowRoute — City Batch Enrichment Script
 * Usage: node enrich-batch.js --city "St. Petersburg" --state FL --max 25 --skip 0
 *
 * Reads API keys from ~/.openclaw/workspace/.keys.env
 * Step 1: Apify Google Maps → get clinic list for city
 * Step 2: Firecrawl each clinic website (1s delay — paid plan rate limit)
 * Step 3: Save enriched results to ./output/<city-slug>.json
 *
 * Batch size recommendation: --max 20 to prevent timeouts
 * Run multiple times with --skip to process full city
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// ─── Load keys from .keys.env ───────────────────────────────────────────────
function loadKeys() {
  const keyPaths = [
    path.join(process.env.USERPROFILE || process.env.HOME, '.openclaw', 'workspace', '.keys.env'),
    path.join(process.env.HOME || '', '.openclaw', 'workspace', '.keys.env'),
  ];
  for (const kp of keyPaths) {
    if (fs.existsSync(kp)) {
      const lines = fs.readFileSync(kp, 'utf8').split('\n');
      for (const line of lines) {
        const m = line.match(/^export\s+(\w+)=['"]?([^'"]+)['"]?/);
        if (m) process.env[m[1]] = m[2].trim();
      }
      console.log(`✅ Keys loaded from ${kp}`);
      return;
    }
  }
  console.warn('⚠️  .keys.env not found — using existing env vars');
}

loadKeys();

const FIRECRAWL_KEY = process.env.FIRECRAWL_FIRECRAWL_API_KEY;
const APIFY_KEY = process.env.APIFY_APIFY_API_KEY;

if (!FIRECRAWL_KEY || !APIFY_KEY) {
  console.error('❌ Missing FIRECRAWL_FIRECRAWL_API_KEY or APIFY_APIFY_API_KEY');
  process.exit(1);
}

// ─── Args ────────────────────────────────────────────────────────────────────
const args = {};
process.argv.slice(2).forEach((a, i, arr) => {
  if (a.startsWith('--')) args[a.slice(2)] = arr[i + 1] || true;
});
const CITY = args.city || 'St. Petersburg';
const STATE = args.state || 'FL';
const MAX = parseInt(args.max || '20');
const SKIP = parseInt(args.skip || '0');
const citySlug = CITY.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

const OUTPUT_DIR = path.join(__dirname, 'output');
const OUTPUT_FILE = path.join(OUTPUT_DIR, `${citySlug}.json`);
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

console.log(`\n🏙️  City: ${CITY}, ${STATE} | Batch: skip=${SKIP} max=${MAX}`);
console.log(`📁 Output: ${OUTPUT_FILE}\n`);

// ─── HTTP helper ─────────────────────────────────────────────────────────────
function request(url, options = {}, body = null) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const lib = u.protocol === 'https:' ? https : http;
    const req = lib.request({
      hostname: u.hostname, port: u.port,
      path: u.pathname + u.search,
      method: options.method || 'GET',
      headers: options.headers || {},
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(typeof body === 'string' ? body : JSON.stringify(body));
    req.end();
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ─── Step 1: Apify Google Maps ───────────────────────────────────────────────
async function discoverClinics(city, state, maxItems) {
  console.log(`🔍 Step 1: Discovering clinics via Apify Google Maps...`);
  const input = {
    searchStringsArray: [
      `medspa ${city} ${state}`,
      `aesthetic clinic ${city} ${state}`,
      `medical spa ${city} ${state}`,
    ],
    maxCrawledPlacesPerSearch: Math.ceil(maxItems / 2),
    language: 'en',
    countryCode: 'us',
  };

  try {
    // Start async run
    const startRes = await request(
      `https://api.apify.com/v2/acts/compass~crawler-google-places/runs?token=${APIFY_KEY}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' } },
      input
    );
    if (startRes.status !== 201) {
      console.warn(`   ⚠️  Apify start failed: ${startRes.status}`);
      return [];
    }
    const runId = startRes.body?.data?.id;
    console.log(`   Run started: ${runId} — polling...`);

    // Poll until SUCCEEDED (max 3 min)
    const start = Date.now();
    let status = 'RUNNING';
    while (status === 'RUNNING' || status === 'READY') {
      if (Date.now() - start > 180000) { console.warn('   ⚠️  Apify timeout'); return []; }
      await sleep(5000);
      const poll = await request(
        `https://api.apify.com/v2/actor-runs/${runId}?token=${APIFY_KEY}`,
        { method: 'GET' }
      );
      status = poll.body?.data?.status || 'RUNNING';
      process.stdout.write(`   status: ${status}\r`);
    }
    console.log(`   Run ${status}`);
    if (status !== 'SUCCEEDED') return [];

    // Fetch dataset
    const datasetId = startRes.body?.data?.defaultDatasetId;
    const items = await request(
      `https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_KEY}&limit=${maxItems}`,
      { method: 'GET' }
    );
    if (!Array.isArray(items.body)) { console.warn('   ⚠️  No items in dataset'); return []; }
    console.log(`   Found ${items.body.length} places`);
    return items.body.map(p => ({
      name: p.title || p.name || '',
      address: p.address || p.street || '',
      city: city,
      state: state,
      phone: p.phone || '',
      website: p.website || '',
      rating: p.totalScore || p.rating || null,
      reviewCount: p.reviewsCount || p.reviewCount || 0,
      lat: p.location?.lat || p.lat || null,
      lng: p.location?.lng || p.lng || null,
      googleMapsUrl: p.url || p.googleMapsUrl || '',
      categories: p.categories || (p.categoryName ? [p.categoryName] : []),
    })).filter(c => c.website);
  } catch (e) {
    console.error(`   ❌ Apify error: ${e.message}`);
    return [];
  }
}

// ─── Step 2: Firecrawl enrichment ────────────────────────────────────────────
async function enrichClinic(clinic) {
  if (!clinic.website) return clinic;
  try {
    const res = await request('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_KEY}`,
        'Content-Type': 'application/json',
      },
    }, {
      url: clinic.website,
      formats: ['markdown'],
      onlyMainContent: true,
      timeout: 20000,
    });

    if (res.status === 200 && res.body?.data) {
      const d = res.body.data;
      const md = d.markdown || '';

      // Extract OG image from metadata
      const ogImage = d.metadata?.ogImage || d.metadata?.['og:image'] || null;
      const logo = d.metadata?.logo || null;

      return {
        ...clinic,
        services: parseServices(md),
        description: parseDescription(md),
        about_text: '',
        brand_values: [],
        price_tier: inferPriceTier(clinic.name, md),
        imageUrl: ogImage,
        logo: logo,
        enriched: true,
        enriched_at: new Date().toISOString(),
      };
    } else {
      console.error(`   ⚠️  Firecrawl non-200 for ${clinic.name}: status=${res.status}`);
    }
  } catch (e) {
    console.error(`   ⚠️  Firecrawl error for ${clinic.name}: ${e.message}`);
  }
  return { ...clinic, enriched: false };
}

function parseServices(md) {
  const keywords = ['botox', 'filler', 'semaglutide', 'laser', 'hydrafacial', 'microneedling',
    'peptide', 'iv therapy', 'trt', 'prp', 'weight loss', 'coolsculpting', 'kybella',
    'sculptra', 'dysport', 'chemical peel', 'dermaplaning'];
  const lower = md.toLowerCase();
  return keywords.filter(k => lower.includes(k)).map(k =>
    k.split(' ').map(w => w[0].toUpperCase() + w.slice(1)).join(' ')
  );
}

function parseDescription(md) {
  const lines = md.split('\n').filter(l => l.trim().length > 60 && !l.startsWith('#'));
  return lines[0]?.trim().slice(0, 300) || '';
}

function inferPriceTier(name, md) {
  const lower = (name + md).toLowerCase();
  if (['luxury', 'elite', 'premier', 'concierge', 'exclusive'].some(w => lower.includes(w))) return '$$$$';
  if (['medical', 'clinical', 'physician', 'aesthetic'].some(w => lower.includes(w))) return '$$$';
  return '$$';
}

// ─── Step 3: Deduplicate against existing clinics ────────────────────────────
function loadExistingNames() {
  const paths = [
    path.join(__dirname, 'output', 'all-merged.json'),
    path.join(__dirname, '..', 'glowroute_src', 'data', 'all-clinics-raw.json'),
  ];
  const names = new Set();
  for (const p of paths) {
    if (fs.existsSync(p)) {
      try {
        const data = JSON.parse(fs.readFileSync(p, 'utf8'));
        (Array.isArray(data) ? data : data.clinics || []).forEach(c => names.add(c.name?.toLowerCase()));
      } catch {}
    }
  }
  return names;
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  // Load existing output if resuming
  let existing = [];
  if (fs.existsSync(OUTPUT_FILE)) {
    existing = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8'));
    console.log(`📂 Resuming — ${existing.length} already in output file`);
  }

  const existingNames = loadExistingNames();

  // Step 1: Discover
  const discovered = await discoverClinics(CITY, STATE, MAX + SKIP);
  const batch = discovered.slice(SKIP, SKIP + MAX);
  const newClinics = batch.filter(c =>
    !existingNames.has(c.name?.toLowerCase()) &&
    !existing.find(e => e.name?.toLowerCase() === c.name?.toLowerCase())
  );

  console.log(`\n📋 Discovered: ${discovered.length} | Batch: ${batch.length} | New: ${newClinics.length}`);

  if (newClinics.length === 0) {
    console.log('✅ No new clinics to enrich in this batch.');
    return;
  }

  // Step 2: Enrich each clinic
  console.log(`\n🔬 Step 2: Enriching ${newClinics.length} clinic websites (1s delay between requests)...`);
  const enriched = [];
  for (let i = 0; i < newClinics.length; i++) {
    const clinic = newClinics[i];
    process.stdout.write(`   [${i + 1}/${newClinics.length}] ${clinic.name.slice(0, 45)}... `);
    const result = await enrichClinic(clinic);
    enriched.push(result);
    console.log(result.enriched ? '✅' : '⚠️ (no enrich)');
    await sleep(1100); // 1.1s delay — paid plan rate limit
  }

  // Step 3: Save
  const merged = [...existing, ...enriched];
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(merged, null, 2));
  console.log(`\n✅ Saved ${merged.length} clinics to ${OUTPUT_FILE}`);
  console.log(`   New this batch: ${enriched.filter(c => c.enriched).length} enriched, ${enriched.filter(c => !c.enriched).length} failed`);

  // Summary
  console.log(`\n📊 Batch Summary:`);
  console.log(`   City: ${CITY}, ${STATE}`);
  console.log(`   Total in file: ${merged.length}`);
  console.log(`   Run next batch: node enrich-batch.js --city "${CITY}" --skip ${SKIP + MAX} --max ${MAX}`);
}

main().catch(e => { console.error('❌ Fatal:', e); process.exit(1); });
