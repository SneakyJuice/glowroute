#!/usr/bin/env node
/**
 * Load expand03 raw leads (data/leads/raw/2026-04-10*.json) to Supabase
 * Upserts by website_url to avoid duplicates
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

// Load .keys.env
const keysEnvPath = path.join(process.env.HOME, '.openclaw/workspace/.keys.env');
if (fs.existsSync(keysEnvPath)) {
  fs.readFileSync(keysEnvPath, 'utf8').split('\n').forEach(line => {
    const m = line.trim().match(/^export\s+(\w+)=(.+)$/);
    if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  });
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

function slugify(str) {
  return (str || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function normalizeTreatments(services) {
  const map = {
    'botox': 'botox-fillers', 'filler': 'botox-fillers', 'juvederm': 'botox-fillers',
    'restylane': 'botox-fillers', 'dysport': 'botox-fillers', 'sculptra': 'botox-fillers',
    'laser': 'laser-treatments', 'ipl': 'laser-treatments', 'laser hair': 'laser-hair-removal',
    'laser hair removal': 'laser-hair-removal',
    'hydrafacial': 'hydrafacial', 'facial': 'facials', 'skin rejuvenation': 'facials',
    'microneedling': 'microneedling', 'prp': 'prp-therapy',
    'chemical peel': 'chemical-peels', 'dermaplaning': 'dermaplaning',
    'coolsculpting': 'body-contouring', 'body contouring': 'body-contouring',
    'weight loss': 'weight-management', 'semaglutide': 'weight-management',
    'hormone': 'hormone-therapy', 'testosterone': 'hormone-therapy', 'hrt': 'hormone-therapy',
    'iv therapy': 'iv-therapy', 'iv': 'iv-therapy',
    'skin tightening': 'skin-tightening', 'ultherapy': 'skin-tightening',
    'tattoo removal': 'tattoo-removal',
    'emsculpt': 'body-contouring', 'kybella': 'body-contouring',
    'thread lift': 'thread-lifts', 'threads': 'thread-lifts',
    'hair restoration': 'hair-restoration', 'hair loss': 'hair-restoration',
  };
  const result = new Set();
  for (const s of (services || [])) {
    const key = s.toLowerCase().trim();
    const mapped = map[key] || map[key.split(' ')[0]];
    if (mapped) result.add(mapped);
  }
  return Array.from(result);
}

async function run() {
  const rawDir = path.join(__dirname, '../data/leads/raw');
  const files = fs.readdirSync(rawDir)
    .filter(f => f.startsWith('2026-04-10') && f.endsWith('.json'))
    .sort();

  console.log(`📁 Found ${files.length} expand03 files`);

  let allRecords = [];
  for (const f of files) {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(rawDir, f), 'utf8'));
      const arr = Array.isArray(data) ? data : [data];
      allRecords.push(...arr);
    } catch (e) {
      console.warn(`⚠️ Skip ${f}: ${e.message}`);
    }
  }

  console.log(`📊 Total raw records: ${allRecords.length}`);

  // Deduplicate by website_url within this batch
  const seen = new Map();
  for (const r of allRecords) {
    const key = (r.website_url || r.clinic_name || '').toLowerCase().trim();
    if (key && !seen.has(key)) seen.set(key, r);
  }
  const deduped = Array.from(seen.values());
  console.log(`🔄 After dedup: ${deduped.length} unique records`);

  // Transform to Supabase schema
  const rows = deduped.map(r => ({
    id: uuidv4(),
    name: r.clinic_name || r.name || 'Unknown Clinic',
    slug: slugify(r.clinic_name || r.name || 'unknown') + '-' + slugify(r.city || '') + '-' + slugify(r.state || ''),
    city: r.city || '',
    state: r.state || '',
    zip: r.zip || '',
    phone: r.phone || '',
    email: r.email || '',
    website: r.website_url || r.website || '',
    address: r.raw_address || r.address || '',
    services: normalizeTreatments(r.services_offered || r.treatments || []),
    glow_score: r.rating ? Math.min(5, Math.round(r.rating)) : null,
    review_count: r.review_count || null,
    source: 'apify-google-maps',
    visibility: 'visible',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));

  console.log(`\n🚀 Upserting ${rows.length} clinics to Supabase...`);

  let inserted = 0, skipped = 0, errors = 0;
  const BATCH = 50;

  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const { data, error } = await supabase
      .from('clinics')
      .upsert(batch, { onConflict: 'slug', ignoreDuplicates: true });

    if (error) {
      console.error(`❌ Batch ${Math.floor(i/BATCH)+1} error: ${error.message}`);
      errors += batch.length;
    } else {
      inserted += batch.length;
      process.stdout.write(`\r   Progress: ${Math.min(i+BATCH, rows.length)}/${rows.length}`);
    }
  }

  console.log(`\n\n✅ Done!`);
  console.log(`   Upserted: ${inserted}`);
  console.log(`   Errors:   ${errors}`);

  // Final count
  const { count } = await supabase.from('clinics').select('*', { count: 'exact', head: true });
  console.log(`\n🗄️  Total clinics in Supabase: ${count}`);
}

run().catch(console.error);
