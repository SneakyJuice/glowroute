#!/usr/bin/env node
/**
 * BUG-05: Backfill hero_image_url for clinics missing images
 * ClickUp: 86e0r14yg | GitHub: #18
 *
 * Usage:
 *   node scripts/backfill-images.js --city Tampa    # Phase 1: Tampa only
 *   node scripts/backfill-images.js --all           # Phase 2: all 1,769 nulls
 *   node scripts/backfill-images.js --dry-run       # Preview without writing
 *
 * Image source priority:
 *   1. Google Places Photos API (best quality, real clinic photos)
 *   2. Website og:image meta tag (clinic's own photo)
 *   3. Unsplash fallback (stock photo by category)
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

function loadEnv() {
  const envFiles = [
    path.join(__dirname, '../.env.local'),
    path.join(__dirname, '../.env'),
    path.join(process.env.HOME, '.openclaw/workspace/.keys.env'),
  ];
  for (const f of envFiles) {
    if (fs.existsSync(f)) {
      const lines = fs.readFileSync(f, 'utf8').split('\n');
      for (const line of lines) {
        const m = line.match(/^([A-Z_0-9]+)=(.+)$/);
        if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
      }
    }
  }
}
loadEnv();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://psiuknphchmhsthvhkpt.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GOOGLE_PLACES_KEY = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_API_KEY;

const args = process.argv.slice(2);
const CITY_FILTER = args.includes('--city') ? args[args.indexOf('--city') + 1] : null;
const ALL_MODE = args.includes('--all');
const DRY_RUN = args.includes('--dry-run');
const BATCH_SIZE = 10;

if (!SUPABASE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found.');
  process.exit(1);
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function httpsGet(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const opts = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers: { 'User-Agent': 'GlowRoute/1.0', ...headers },
      timeout: 8000,
    };
    const req = https.request(opts, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => resolve({ status: res.statusCode, body: data, headers: res.headers }));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    req.end();
  });
}

// ── Image Source 1: Google Places ─────────────────────────────────────────────

async function getGooglePlacesImage(clinic) {
  if (!GOOGLE_PLACES_KEY) return null;
  try {
    const query = encodeURIComponent(`${clinic.name} ${clinic.city} FL medspa`);
    const findUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${query}&inputtype=textquery&fields=photos,place_id&key=${GOOGLE_PLACES_KEY}`;
    const findRes = await httpsGet(findUrl);
    const findData = JSON.parse(findRes.body);
    const photoRef = findData?.candidates?.[0]?.photos?.[0]?.photo_reference;
    if (!photoRef) return null;
    // Return the photo URL (maxwidth=800 for good quality)
    return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photoRef}&key=${GOOGLE_PLACES_KEY}`;
  } catch { return null; }
}

// ── Image Source 2: Website og:image ─────────────────────────────────────────

async function getWebsiteOgImage(website) {
  if (!website) return null;
  try {
    const url = website.startsWith('http') ? website : `https://${website}`;
    const res = await httpsGet(url);
    if (res.status !== 200) return null;
    const match = res.body.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
                || res.body.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    return match ? match[1] : null;
  } catch { return null; }
}

// ── Image Source 3: Unsplash fallback ─────────────────────────────────────────

function getUnsplashFallback(services) {
  const tags = Array.isArray(services) ? services : [];
  let keyword = 'medspa,wellness';
  if (tags.some(s => s.includes('botox') || s.includes('inject'))) keyword = 'botox,aesthetic,clinic';
  else if (tags.some(s => s.includes('laser'))) keyword = 'laser,skincare,clinic';
  else if (tags.some(s => s.includes('hormone') || s.includes('peptide'))) keyword = 'wellness,health,clinic';
  else if (tags.some(s => s.includes('body') || s.includes('contouring'))) keyword = 'body,sculpting,wellness';
  // Use a stable Unsplash URL (no API key needed for source.unsplash)
  return `https://source.unsplash.com/featured/800x600/?${keyword}`;
}

// ── Supabase helpers ──────────────────────────────────────────────────────────

async function fetchClinicsMissingImages(city, limit = 1000) {
  const url = new URL(`${SUPABASE_URL}/rest/v1/clinics`);
  url.searchParams.set('hero_image_url', 'is.null');
  url.searchParams.set('visibility', 'eq.visible');
  url.searchParams.set('select', 'id,name,city,website,services,slug');
  url.searchParams.set('limit', String(limit));
  if (city) url.searchParams.set('city', `eq.${city}`);

  const res = await httpsGet(url.toString(), {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
  });
  return JSON.parse(res.body || '[]');
}

async function updateClinicImage(id, imageUrl) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ hero_image_url: imageUrl });
    const url = new URL(`${SUPABASE_URL}/rest/v1/clinics?id=eq.${id}`);
    const opts = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'return=minimal',
      }
    };
    const req = https.request(opts, res => {
      let data = ''; res.on('data', d => data += d);
      res.on('end', () => res.statusCode < 300 ? resolve(true) : reject(new Error(`${res.statusCode}: ${data}`)));
    });
    req.on('error', reject);
    req.write(body); req.end();
  });
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function processClinic(clinic) {
  let imageUrl = null;
  let source = null;

  // Priority 1: Google Places
  imageUrl = await getGooglePlacesImage(clinic);
  if (imageUrl) source = 'google-places';

  // Priority 2: og:image
  if (!imageUrl && clinic.website) {
    imageUrl = await getWebsiteOgImage(clinic.website);
    if (imageUrl) source = 'og:image';
  }

  // Priority 3: Unsplash fallback
  if (!imageUrl) {
    imageUrl = getUnsplashFallback(clinic.services);
    source = 'unsplash-fallback';
  }

  return { imageUrl, source };
}

async function main() {
  console.log(`🖼️  GlowRoute Image Backfill`);
  console.log(`Mode: ${CITY_FILTER ? `City=${CITY_FILTER}` : ALL_MODE ? 'ALL' : 'Tampa (default)'}`);
  console.log(`Dry run: ${DRY_RUN}`);
  if (!GOOGLE_PLACES_KEY) console.log(`⚠️  No GOOGLE_PLACES_KEY — will skip Google Places, use og:image + Unsplash`);
  console.log('');

  const targetCity = CITY_FILTER || (!ALL_MODE ? 'Tampa' : null);
  const clinics = await fetchClinicsMissingImages(targetCity);
  console.log(`📋 Clinics missing images: ${clinics.length}${targetCity ? ` (${targetCity})` : ' (all)'}`);

  if (clinics.length === 0) {
    console.log('✅ No clinics missing images. Done!');
    return;
  }

  let updated = 0, failed = 0;
  const log = [];

  for (let i = 0; i < clinics.length; i += BATCH_SIZE) {
    const batch = clinics.slice(i, i + BATCH_SIZE);
    console.log(`\nBatch ${Math.floor(i/BATCH_SIZE)+1}/${Math.ceil(clinics.length/BATCH_SIZE)} (${batch.length} clinics):`);

    for (const clinic of batch) {
      try {
        const { imageUrl, source } = await processClinic(clinic);
        if (imageUrl) {
          if (!DRY_RUN) await updateClinicImage(clinic.id, imageUrl);
          console.log(`  ✅ ${clinic.name} [${source}]${DRY_RUN ? ' (dry-run)' : ''}`);
          log.push({ slug: clinic.slug, name: clinic.name, imageUrl, source });
          updated++;
        } else {
          console.log(`  ⚠️  ${clinic.name} — no image found`);
          failed++;
        }
      } catch (err) {
        console.log(`  ❌ ${clinic.name} — ${err.message}`);
        failed++;
      }
      // Small delay to avoid rate limits
      await new Promise(r => setTimeout(r, 200));
    }
  }

  // Save log
  if (!DRY_RUN && log.length > 0) {
    const logPath = path.join(__dirname, '../logs/image-backfill-' + new Date().toISOString().slice(0,10) + '.json');
    fs.mkdirSync(path.dirname(logPath), { recursive: true });
    fs.writeFileSync(logPath, JSON.stringify(log, null, 2));
    console.log(`\n📝 Log saved: ${logPath}`);
  }

  console.log('\n=== RESULTS ===');
  console.log(`✅ Updated: ${updated}`);
  console.log(`⚠️  Failed/skipped: ${failed}`);
  if (DRY_RUN) console.log('\n(Dry run — no Supabase writes performed)');
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
