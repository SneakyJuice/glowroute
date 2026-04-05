#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

// Load env
const keysEnvPath = path.join(process.env.HOME, '.openclaw/workspace/.keys.env');
if (fs.existsSync(keysEnvPath)) {
  fs.readFileSync(keysEnvPath, 'utf8').split('\n').forEach(line => {
    const m = line.trim().match(/^export\s+(\w+)=(.+)$/);
    if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  });
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseKey) { console.error('❌ Missing Supabase credentials'); process.exit(1); }

const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

// Convert any ID to a valid UUID v4 format using SHA1 hash of the original ID
function toUUID(id) {
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return id;
  const hash = crypto.createHash('sha1').update(String(id)).digest('hex');
  return `${hash.slice(0,8)}-${hash.slice(8,12)}-4${hash.slice(13,16)}-${(parseInt(hash[16],16)&3|8).toString(16)}${hash.slice(17,20)}-${hash.slice(20,32)}`;
}

const TREATMENT_MAPPING = {
  'botox':'botox-fillers','dysport':'botox-fillers','juvederm':'botox-fillers','restylane':'botox-fillers','filler':'botox-fillers','lip filler':'botox-fillers','cheek filler':'botox-fillers',
  'laser':'laser-treatments','ipl':'laser-treatments','photorejuvenation':'laser-treatments','fraxel':'laser-treatments','co2 laser':'laser-treatments','laser hair removal':'laser-hair-removal',
  'hydrafacial':'facials-skincare','facial':'facials-skincare','chemical peel':'facials-skincare','microdermabrasion':'facials-skincare','dermaplaning':'facials-skincare',
  'coolsculpting':'body-contouring','emsculpt':'body-contouring','kybella':'body-contouring','body contouring':'body-contouring','sculpsure':'body-contouring',
  'prp':'prp-treatments','platelet':'prp-treatments','microneedling':'microneedling',
  'semaglutide':'weight-loss','tirzepatide':'weight-loss','weight loss':'weight-loss','weight management':'weight-loss',
  'peptide':'peptide-therapy','bpc-157':'peptide-therapy','tb-500':'peptide-therapy',
  'iv therapy':'iv-therapy','iv drip':'iv-therapy','vitamin infusion':'iv-therapy',
  'testosterone':'hormone-therapy','hormone':'hormone-therapy','bioidentical':'hormone-therapy',
  'vampire facial':'prp-treatments','vampire facelift':'prp-treatments',
};

function normalizeServices(services) {
  if (!services) return [];
  const raw = Array.isArray(services) ? services : [services];
  const slugSet = new Set();
  raw.forEach(s => {
    const lower = String(s).toLowerCase();
    let matched = false;
    for (const [key, slug] of Object.entries(TREATMENT_MAPPING)) {
      if (lower.includes(key)) { slugSet.add(slug); matched = true; }
    }
    if (!matched) {
      const slug = lower.replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
      if (slug.length > 2) slugSet.add(slug);
    }
  });
  return [...slugSet];
}

async function run() {
  console.log('🚀 Loading consolidated clinic DB (UUID-fixed)...');
  const srcDir = '/home/anthony/.openclaw/workspace/glowroute_src';
  
  const mainData = JSON.parse(fs.readFileSync(path.join(srcDir, 'clinics_data.json'), 'utf8'));
  const clinics = Array.isArray(mainData) ? mainData : mainData.clinics || [];
  console.log(`📖 Main data: ${clinics.length} clinics`);
  
  const outputDir = path.join(srcDir, 'output');
  let expansionClinics = [];
  if (fs.existsSync(outputDir)) {
    for (const f of fs.readdirSync(outputDir).filter(x => x.endsWith('.json'))) {
      try {
        const d = JSON.parse(fs.readFileSync(path.join(outputDir, f), 'utf8'));
        const arr = Array.isArray(d) ? d : d.clinics || [];
        expansionClinics = expansionClinics.concat(arr);
      } catch(e) {}
    }
  }
  console.log(`📖 Expansion: ${expansionClinics.length} clinics from output/`);

  const allClinics = [...clinics, ...expansionClinics];
  
  // Deduplicate by slug
  const seen = new Map();
  for (const c of allClinics) {
    const slug = c.slug || c.id || String(c.name||'').toLowerCase().replace(/[^a-z0-9]+/g,'-');
    if (!seen.has(slug)) seen.set(slug, c);
  }
  const unique = [...seen.values()];
  console.log(`📊 Unique clinics: ${unique.length}`);

  const rows = unique.map(c => ({
    id: toUUID(c.id || c.slug || c.name),
    slug: c.slug || String(c.name||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''),
    name: c.name || '',
    description: c.description || null,
    address: c.address || null,
    city: c.city || null,
    state: c.state || null,
    zip: c.zip || c.zipCode || null,
    lat: c.lat || c.latitude || null,
    lng: c.lng || c.longitude || null,
    phone: c.phone || null,
    email: c.email || null,
    website: c.website || null,
    instagram_handle: c.instagram_handle || c.instagram || null,
    hero_image_url: c.hero_image_url || c.imageUrl || c.image || null,
    logo_url: c.logo_url || c.logoUrl || null,
    services: normalizeServices(c.services || c.treatments),
    status: c.status || 'pending',
  }));

  let ok = 0, errs = 0;
  const BATCH = 200;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i+BATCH);
    const { error } = await supabase.from('clinics').upsert(batch, { onConflict: 'slug' });
    if (error) { console.error(`  ❌ Batch ${Math.floor(i/BATCH)+1}: ${error.message}`); errs += batch.length; }
    else { ok += batch.length; process.stdout.write('.'); }
  }
  console.log(`\n\n✅ T-00 COMPLETE: ${ok} upserted, ${errs} errors`);
  
  // Verify count
  const { count } = await supabase.from('clinics').select('*', { count: 'exact', head: true });
  console.log(`📊 Total in Supabase: ${count} clinics`);
}

run().catch(e => { console.error('Fatal:', e); process.exit(1); });
