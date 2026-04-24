#!/usr/bin/env node
/**
 * BUG-05 v2: Backfill hero_image_url using Apify Google Maps scraper
 * No Google Places API key needed — Apify handles it.
 *
 * Usage:
 *   node scripts/backfill-images-apify.js --city Tampa     # Phase 1: one city
 *   node scripts/backfill-images-apify.js --all            # Phase 2: all 1,769 nulls
 *   node scripts/backfill-images-apify.js --all --batch 50 # Custom batch size
 *   node scripts/backfill-images-apify.js --dry-run        # Preview only
 *
 * Cost estimate (Apify free plan $5/mo credits):
 *   ~$0.002 per clinic via Google Maps actor
 *   1,769 clinics ≈ $3.54 total — well within free plan
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// ── Config ────────────────────────────────────────────────────────────────────

function loadEnv() {
  const envFiles = [
    path.join(__dirname, '../.env.local'),
    path.join(__dirname, '../.env'),
    path.join(process.env.HOME, '.openclaw/workspace/.keys.env'),
  ];
  for (const f of envFiles) {
    if (!fs.existsSync(f)) continue;
    for (const line of fs.readFileSync(f, 'utf8').split('\n')) {
      const m = line.match(/^(?:export\s+)?([A-Z_0-9]+)=["']?(.+?)["']?\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
    }
  }
}
loadEnv();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://psiuknphchmhsthvhkpt.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const APIFY_KEY    = process.env.APIFY_API_KEY;

const args        = process.argv.slice(2);
const CITY_FILTER = args.includes('--city') ? args[args.indexOf('--city') + 1] : null;
const ALL_MODE    = args.includes('--all');
const DRY_RUN     = args.includes('--dry-run');
const BATCH_SIZE  = args.includes('--batch') ? parseInt(args[args.indexOf('--batch') + 1]) : 25;

if (!SUPABASE_KEY) { console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found.'); process.exit(1); }
if (!APIFY_KEY)    { console.error('❌ APIFY_API_KEY not found.'); process.exit(1); }

// ── HTTP helpers ──────────────────────────────────────────────────────────────

function request(method, url, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const payload = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: u.hostname,
      path: u.pathname + u.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'GlowRoute-ImageBackfill/2.0',
        ...headers,
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
      },
      timeout: 120000,
    };
    const req = https.request(opts, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => resolve({ status: res.statusCode, body: data, headers: res.headers }));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Request timeout')); });
    if (payload) req.write(payload);
    req.end();
  });
}

// ── Supabase helpers ──────────────────────────────────────────────────────────

async function fetchNullImageClinics(city, limit = 2000) {
  const url = new URL(`${SUPABASE_URL}/rest/v1/clinics`);
  url.searchParams.set('hero_image_url', 'is.null');
  url.searchParams.set('visibility', 'eq.visible');
  url.searchParams.set('select', 'id,name,city,state,address,website');
  url.searchParams.set('limit', String(limit));
  if (city) url.searchParams.set('city', `eq.${city}`);

  const res = await request('GET', url.toString(), null, {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Prefer': 'count=exact',
  });
  const total = (res.headers['content-range'] || '').match(/\/(\d+)$/)?.[1] || '?';
  console.log(`📊 Total null-image clinics ${city ? `(${city})` : '(all)'}: ${total}`);
  return JSON.parse(res.body || '[]');
}

async function updateHeroImage(id, imageUrl) {
  if (DRY_RUN) return true;
  const res = await request(
    'PATCH',
    `${SUPABASE_URL}/rest/v1/clinics?id=eq.${id}`,
    { hero_image_url: imageUrl },
    { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Prefer': 'return=minimal' }
  );
  return res.status < 300;
}

// ── Apify: Google Maps batch fetch ────────────────────────────────────────────

async function fetchImagesViaApify(clinics) {
  // Build search strings: "Clinic Name City State"
  const searches = clinics.map(c =>
    `${c.name} ${c.city || ''} ${c.state || 'FL'}`.trim().replace(/\s+/g, ' ')
  );

  console.log(`  🔍 Sending ${searches.length} queries to Apify Google Maps...`);

  const res = await request(
    'POST',
    `https://api.apify.com/v2/acts/compass~crawler-google-places/run-sync-get-dataset-items?maxItems=${searches.length * 2}&token=${APIFY_KEY}`,
    {
      searchStringsArray: searches,
      maxCrawledPlacesPerSearch: 1,
      language: 'en',
      maxImages: 3,
      scrapeReviews: false,
      scrapeReviewerName: false,
      includeHistogram: false,
      includeOpeningHours: false,
      includePeopleAlsoSearch: false,
    }
  );

  if (res.status !== 200 && res.status !== 201) {
    console.error(`  ❌ Apify error ${res.status}: ${res.body.slice(0, 200)}`);
    return [];
  }

  let results = [];
  try { results = JSON.parse(res.body); } catch { return []; }
  return results;
}

// ── Match Apify result back to clinic ────────────────────────────────────────

function nameSimilarity(a, b) {
  // Returns 0.0-1.0 overlap score based on shared significant words
  const stopWords = new Set(['the','and','of','at','by','for','in','a','an','llc','inc','pllc','pc','md','dba','center','clinic','medical','spa','wellness','health','aesthetics','beauty','care']);
  const words = (s) => s.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(w => w.length > 2 && !stopWords.has(w));
  const wa = new Set(words(a));
  const wb = new Set(words(b));
  if (wa.size === 0 || wb.size === 0) return 0;
  const intersection = [...wa].filter(w => wb.has(w)).length;
  return intersection / Math.min(wa.size, wb.size);
}

function matchResult(clinic, apifyResults) {
  // Must meet minimum name similarity threshold — no position-based fallback
  const MIN_SCORE = 0.5; // at least 50% of significant words must match
  let best = null, bestScore = 0;
  for (const r of apifyResults) {
    if (!r.imageUrls || r.imageUrls.length === 0) continue;
    const resultName = r.title || r.name || '';
    if (!resultName) continue;
    const score = nameSimilarity(clinic.name, resultName);
    if (score > bestScore) { bestScore = score; best = r; }
  }
  if (best && bestScore >= MIN_SCORE) return best.imageUrls[0];
  return null;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🖼️  GlowRoute Image Backfill v2 — Powered by Apify Google Maps`);
  console.log(`Mode:     ${CITY_FILTER ? `City=${CITY_FILTER}` : ALL_MODE ? 'ALL cities' : 'Tampa (default)'}`);
  console.log(`Batch:    ${BATCH_SIZE} clinics per Apify call`);
  console.log(`Dry run:  ${DRY_RUN}`);
  console.log(`Supabase: ${SUPABASE_URL.replace('https://', '').split('.')[0]}...`);
  console.log('');

  const targetCity = CITY_FILTER || (!ALL_MODE ? 'Tampa' : null);
  const clinics = await fetchNullImageClinics(targetCity);

  if (clinics.length === 0) {
    console.log('✅ No clinics missing images!');
    return;
  }

  console.log(`\nProcessing ${clinics.length} clinics in batches of ${BATCH_SIZE}...\n`);

  let updated = 0, apifyHits = 0, errors = 0;
  const log = [];

  for (let i = 0; i < clinics.length; i += BATCH_SIZE) {
    const batch = clinics.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(clinics.length / BATCH_SIZE);
    console.log(`\n── Batch ${batchNum}/${totalBatches} (${batch.length} clinics) ──`);

    // Fetch all images for batch via Apify (one API call per batch)
    let apifyResults = [];
    try {
      apifyResults = await fetchImagesViaApify(batch);
      console.log(`  📦 Apify returned ${apifyResults.length} results`);
    } catch (err) {
      console.error(`  ❌ Apify call failed: ${err.message} — skipping this batch (all will stay null)`);
    }

    // Match results to clinics and update
    for (let j = 0; j < batch.length; j++) {
      const clinic = batch[j];
      // Try to match by name first, then by position
      const imageUrl = matchResult(clinic, apifyResults) || apifyResults[j]?.imageUrls?.[0];
      const source = 'apify-google-maps';

      if (!imageUrl) {
        console.log(`  ⏭️  ${clinic.name} — no Apify result, skipping (stays null)`);
        continue;
      }

      try {
        const ok = await updateHeroImage(clinic.id, imageUrl);
        if (ok) {
          console.log(`  📸 ${clinic.name} [${source}]${DRY_RUN ? ' (dry-run)' : ''}`);
          log.push({ id: clinic.id, name: clinic.name, city: clinic.city, imageUrl, source });
          updated++;
          apifyHits++;
        }
      } catch (err) {
        console.log(`  ❌ ${clinic.name} — update failed: ${err.message}`);
        errors++;
      }
    }

    // Pause between batches (respect Apify rate limits)
    if (i + BATCH_SIZE < clinics.length) {
      console.log(`  ⏳ Waiting 5s before next batch...`);
      await new Promise(r => setTimeout(r, 5000));
    }
  }

  // Save log
  if (!DRY_RUN && log.length > 0) {
    const logDir = path.join(__dirname, '../logs');
    fs.mkdirSync(logDir, { recursive: true });
    const logPath = path.join(logDir, `image-backfill-apify-${new Date().toISOString().slice(0,10)}.json`);
    fs.writeFileSync(logPath, JSON.stringify(log, null, 2));
    console.log(`\n📝 Log: ${logPath}`);
  }

  console.log('\n════════════════════════════════');
  console.log(`✅ Total updated:      ${updated}`);
  console.log(`📸 Google Maps photos: ${apifyHits}`);
  console.log(`⏭️  Skipped (no match): ${clinics.length - updated - errors}`);
  console.log(`❌ Errors:             ${errors}`);
  if (DRY_RUN) console.log('\n(Dry run — no writes performed)');
  console.log('════════════════════════════════\n');
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
