#!/usr/bin/env node
/**
 * BUG-04: Import enriched Tampa clinics from JSON → Supabase
 * ClickUp: 86e0r14yf | GitHub: #17
 *
 * Usage: node scripts/import-tampa-to-supabase.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { sourceLocation, hasReviewHold, isAliasSource, loadSuppressedAliases } = require('./lib/source-integrity.cjs');
const { createClient } = require('@supabase/supabase-js');

// Load .env.local or .keys.env for Supabase creds
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
        const m = line.match(/^([A-Z_]+)=(.+)$/);
        if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
      }
    }
  }
}
loadEnv();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://psiuknphchmhsthvhkpt.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found. Check .env.local or .keys.env');
  process.exit(1);
}

function slugify(name, city) {
  return (name + '-' + city)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function mapToRow(clinic) {
  const location = sourceLocation(clinic, 'Tampa', 'FL');
  const reviewHold = hasReviewHold(clinic) || ['hidden', 'removed', 'needs_review'].includes(clinic.visibility);
  return {
    slug: clinic.slug || slugify(clinic.name, clinic.city),
    name: clinic.name,
    city: location.city,
    state: location.state,
    address: clinic.address || null,
    phone: clinic.phone || null,
    website: clinic.website || null,
    lat: clinic.lat || null,
    lng: clinic.lng || null,
    services: Array.isArray(clinic.service_tags) ? clinic.service_tags :
              Array.isArray(clinic.services) ? clinic.services : [],
    glow_score: clinic.glowscore || clinic.glow_score || clinic.rating || null,
    review_count: clinic.review_count || clinic.reviewCount || 0,
    hero_image_url: clinic.hero_image_url || clinic.imageUrl || null,
    description: clinic.description || null,
    visibility: reviewHold || location.needs_review ? 'hidden' : 'visible',
    needs_review: reviewHold || location.needs_review,
    review_reason: clinic.review_reason || location.review_reason,
    is_verified: false,
    is_claimed: false,
    is_featured: false,
  };
}

async function supabaseUpsert(rows) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(rows);
    const url = new URL(`${SUPABASE_URL}/rest/v1/clinics`);
    const opts = {
      hostname: url.hostname,
      path: url.pathname + '?on_conflict=slug',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        // Insert-only intake preserves existing ownership, moderation and verified facts.
        'Prefer': 'resolution=ignore-duplicates,return=representation',
      }
    };
    const req = https.request(opts, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) resolve(JSON.parse(data || '[]'));
        else reject(new Error(`Supabase error ${res.statusCode}: ${data}`));
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function getCount(city) {
  return new Promise((resolve) => {
    const url = new URL(`${SUPABASE_URL}/rest/v1/clinics`);
    url.searchParams.set('city', `eq.${city}`);
    url.searchParams.set('visibility', 'eq.visible');
    url.searchParams.set('select', 'id');
    url.searchParams.set('limit', '1');
    const opts = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'GET',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'count=exact',
      }
    };
    const req = https.request(opts, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        const cr = res.headers['content-range'] || '';
        const m = cr.match(/\/(\d+)$/);
        resolve(m ? parseInt(m[1]) : 0);
      });
    });
    req.on('error', () => resolve(0));
    req.end();
  });
}

async function main() {
  const aliases = await loadSuppressedAliases(createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } }));
  const jsonPath = path.join(__dirname, '../output/enriched-clinics.json');
  if (!fs.existsSync(jsonPath)) {
    console.error(`❌ File not found: ${jsonPath}`);
    process.exit(1);
  }

  const all = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const tampa = all.filter(c => c.city && c.city.toLowerCase().includes('tampa'));
  console.log(`📋 Found ${tampa.length} Tampa clinics in JSON`);
  console.log(`📊 Total clinics in JSON: ${all.length}`);

  const before = await getCount('Tampa');
  console.log(`📊 Supabase Tampa count BEFORE: ${before}`);

  // Process in batches of 20
  const BATCH = 20;
  let imported = 0;
  let errors = 0;

  for (let i = 0; i < tampa.length; i += BATCH) {
    const batch = tampa.slice(i, i + BATCH).filter(row => !isAliasSource(row, aliases)).map(mapToRow).filter(row => !isAliasSource(row, aliases));
    if (!batch.length) continue;
    try {
      const result = await supabaseUpsert(batch);
      imported += result.length;
      console.log(`  ✅ Batch ${Math.floor(i/BATCH)+1}: ${result.length} upserted (total: ${imported})`);
    } catch (err) {
      console.error(`  ❌ Batch ${Math.floor(i/BATCH)+1} failed:`, err.message);
      errors++;
    }
    // Small delay between batches
    await new Promise(r => setTimeout(r, 300));
  }

  const after = await getCount('Tampa');
  console.log('');
  console.log('=== RESULTS ===');
  console.log(`✅ Imported: ${imported} records`);
  console.log(`❌ Errors: ${errors} batches`);
  console.log(`📊 Supabase Tampa BEFORE: ${before} → AFTER: ${after}`);
  console.log('');

  if (after >= 70) {
    console.log('🎉 SUCCESS — Tampa count >= 70. Live site will show correct results.');
  } else {
    console.log(`⚠️  Tampa count is ${after}. Expected 70+. Check for slug conflicts or errors above.`);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
