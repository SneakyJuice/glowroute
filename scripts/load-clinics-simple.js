#!/usr/bin/env node
/**
 * Simplified clinic loader for TASK-GR-V52T00
 * Loads clinics_data.json + output/*.json to Supabase
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid'); // Import UUID v4 generator

// Load env
const keysEnvPath = path.join(process.env.HOME, '.openclaw/workspace/.keys.env');
if (fs.existsSync(keysEnvPath)) {
  fs.readFileSync(keysEnvPath, 'utf8').split('\n').forEach(line => {
    const m = line.trim().match(/^export\s+(\w+)=(.+)$/);
    if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  });
}

// Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

// Basic treatment normalization mapping
const TREATMENT_MAPPING = {
  // Botox & fillers
  'botox': 'botox-fillers',
  'dysport': 'botox-fillers',
  'juvederm': 'botox-fillers',
  'restylane': 'botox-fillers',
  'filler': 'botox-fillers',
  'injectable': 'botox-fillers',
  'injectables': 'botox-fillers',
  
  // Laser hair removal
  'laser hair': 'laser-hair-removal',
  'laser hair removal': 'laser-hair-removal',
  'hair removal': 'laser-hair-removal',
  'laser': 'laser-hair-removal',
  
  // Hydrafacial
  'hydrafacial': 'hydrafacial',
  'hydra facial': 'hydrafacial',
  'hydradermabrasion': 'hydrafacial',
  'facial': 'hydrafacial',
  
  // Weight loss
  'weight loss': 'weight-loss-ozempic',
  'semaglutide': 'weight-loss-ozempic',
  'ozempic': 'weight-loss-ozempic',
  'glp-1': 'weight-loss-ozempic',
  'glp1': 'weight-loss-ozempic',
  'tirzepatide': 'weight-loss-ozempic',
  'mounjaro': 'weight-loss-ozempic',
  'wegovy': 'weight-loss-ozempic',
  'medical weight': 'weight-loss-ozempic',
  
  // IV therapy
  'iv therapy': 'iv-therapy',
  'iv drip': 'iv-therapy',
  'infusion': 'iv-therapy',
  'nad+': 'iv-therapy',
  'vitamin drip': 'iv-therapy',
  'hydration drip': 'iv-therapy',
  'drip bar': 'iv-therapy',
  'ketamine': 'iv-therapy',
  
  // Microneedling
  'microneedling': 'microneedling',
  'micro needling': 'microneedling',
  'rf microneedling': 'microneedling',
  'prp': 'microneedling',
  'collagen induction': 'microneedling',
  'skin rejuvenation': 'microneedling',
  
  // Chemical peels
  'chemical peel': 'chemical-peels',
  'peel': 'chemical-peels',
  'glycolic': 'chemical-peels',
  'tca peel': 'chemical-peels',
  'vi peel': 'chemical-peels',
  'exfoliation': 'chemical-peels',
  'skin peel': 'chemical-peels',
  
  // TRT
  'testosterone': 'trt-testosterone',
  'trt': 'trt-testosterone',
  "men's health": 'trt-testosterone',
  'hormone replacement': 'trt-testosterone',
  'low t': 'trt-testosterone',
  'male hormone': 'trt-testosterone',
  'andropause': 'trt-testosterone',
  
  // Peptide therapy
  'peptide': 'peptide-therapy',
  'peptide therapy': 'peptide-therapy',
  'bpc-157': 'peptide-therapy',
  'sermorelin': 'peptide-therapy',
  'ipamorelin': 'peptide-therapy',
  'cjc-1295': 'peptide-therapy',
  'growth hormone': 'peptide-therapy',
  'pt-141': 'peptide-therapy',
  
  // Coolsculpting
  'coolsculpting': 'coolsculpting',
  'cool sculpting': 'coolsculpting',
  'body contouring': 'coolsculpting',
  'cryolipolysis': 'coolsculpting',
  'emsculpt': 'coolsculpting',
  'fat reduction': 'coolsculpting',
  'sculpsure': 'coolsculpting',
  'kybella': 'coolsculpting',
};

function normalizeTreatments(treatments) {
  if (!treatments) return [];
  if (typeof treatments === 'string') {
    treatments = treatments.split(/[,;|]/).map(t => t.trim()).filter(t => t);
  }
  if (!Array.isArray(treatments)) return [];
  
  const normalized = new Set();
  
  treatments.forEach(treatment => {
    if (!treatment) return;
    // Convert to string if needed
    const treatmentStr = typeof treatment === 'string' ? treatment : String(treatment);
    const lower = treatmentStr.toLowerCase().trim();
    
    // Check mapping
    let matched = false;
    for (const [keyword, slug] of Object.entries(TREATMENT_MAPPING)) {
      if (lower.includes(keyword) || keyword.includes(lower)) {
        normalized.add(slug);
        matched = true;
        break;
      }
    }
    
    // If no match, keep original as slug
    if (!matched) {
      normalized.add(lower.replace(/\s+/g, '-'));
    }
  });
  
  return Array.from(normalized);
}

function normalizeClinic(clinic) {
  // Generate ID for new records (UUID format)
  // Note: Supabase 'id' column is UUID type. Ensure 'crypto' module is available in Node.js runtime.
  const id = (clinic.id && isValidUUID(clinic.id)) ? clinic.id : uuidv4(); 
  const slug = clinic.slug || `${clinic.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${clinic.city?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'unknown'}-${clinic.state?.toLowerCase() || 'na'}`;
  
  return {
    id,
    slug: slug.replace(/--+/g, '-'), // Ensure slug is clean
    name: clinic.name || '',
    description: clinic.description || '',
    address: clinic.address || '',
    city: clinic.city || '',
    state: clinic.state || (clinic.address ? extractState(clinic.address) : ''),
    phone: clinic.phone || '',
    website: clinic.website || '',
    lat: clinic.lat || null,
    lng: clinic.lng || null,

    // Mapped fields to Supabase schema
    hero_image_url: clinic.imageUrl || '', // imageUrl -> hero_image_url
    logo_url: clinic.logo || '',           // logo -> logo_url
    is_verified: clinic.verified || false, // verified -> is_verified
    is_featured: clinic.featured || false, // featured -> is_featured, these are default false by Supabase but explicitly set here
    
    // Store treatments as a text array (PostgreSQL ARRAY type)
    // treatments: normalizeTreatments(clinic.treatments || clinic.services || []),

    // Omitted fields that are not in the actual Supabase schema based on test-insert and schema inference:
    // google_rating, google_review_count, price_tier
    // fields like 'email', 'instagram_handle', 'facebook_url', 'zip', 'gPlaceId' are not consistently present in source data
  };
}

function extractState(addr) {
  const match = addr.match(/,\s*([A-Z]{2})\s*\d/);
  return match ? match[1] : '';
}

// Helper to validate UUID format
function isValidUUID(uuid) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

async function main() {
  console.log('🚀 Starting TASK-GR-V52T00: Consolidated Clinic DB (simple version)');
  
  // Load clinics_data.json
  console.log('📖 Loading clinics_data.json...');
  const clinicsData = JSON.parse(fs.readFileSync(path.join(__dirname, '../clinics_data.json'), 'utf8'));
  console.log(`   Found ${clinicsData.length} clinics`);
  
  // Load output/*.json
  console.log('📖 Loading output/*.json...');
  const outputDir = path.join(__dirname, '../output');
  const outputFiles = fs.readdirSync(outputDir).filter(f => f.endsWith('.json'));
  const expansionClinics = [];
  
  for (const file of outputFiles) {
    const data = JSON.parse(fs.readFileSync(path.join(outputDir, file), 'utf8'));
    expansionClinics.push(...data);
  }
  console.log(`   Found ${expansionClinics.length} expansion clinics in ${outputFiles.length} files`);
  
  // Combine and normalize
  const allClinics = [...clinicsData, ...expansionClinics];
  console.log(`📊 Total clinics to process: ${allClinics.length}`);
  
  const normalizedClinics = allClinics.map(clinic => normalizeClinic(clinic));
  
  // Remove exact duplicates by slug
  const uniqueClinics = [];
  const seenSlugs = new Set();
  
  for (const clinic of normalizedClinics) {
    if (!seenSlugs.has(clinic.slug)) {
      seenSlugs.add(clinic.slug);
      uniqueClinics.push(clinic);
    }
  }
  
  console.log(`📊 Unique clinics after dedup: ${uniqueClinics.length}`);
  
  // Upsert in batches
  const BATCH_SIZE = 100;
  let success = 0;
  let errors = 0;
  
  console.log(`📤 Upserting ${uniqueClinics.length} clinics in batches of ${BATCH_SIZE}...`);
  
  for (let i = 0; i < uniqueClinics.length; i += BATCH_SIZE) {
    const batch = uniqueClinics.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(uniqueClinics.length / BATCH_SIZE);
    
    console.log(`   Batch ${batchNum}/${totalBatches} (${i+1}-${Math.min(i+BATCH_SIZE, uniqueClinics.length)})`);
    
    try {
      const { error } = await supabase
        .from('clinics')
        .upsert(batch, { onConflict: 'slug' });
      
      if (error) {
        console.error(`     ❌ Error: ${error.message}`);
        errors += batch.length;
      } else {
        console.log(`     ✅ Success`);
        success += batch.length;
      }
    } catch (err) {
      console.error(`     ❌ Exception: ${err.message}`);
      errors += batch.length;
    }
  }
  
  console.log('\n📊 LOAD SUMMARY:');
  console.log(`   Total processed: ${uniqueClinics.length}`);
  console.log(`   Successfully upserted: ${success}`);
  console.log(`   Errors: ${errors}`);
  
  if (errors === 0) {
    // Get final count
    const { count } = await supabase
      .from('clinics')
      .select('*', { count: 'exact', head: true });
    
    console.log(`✅ TASK-GR-V52T00 COMPLETE!`);
    console.log(`📊 Total clinics in Supabase: ${count}`);
    
    // Post to Build Room
    console.log(`\n📢 Post to Build Room:`);
    console.log(`   ✅ [T-00] DONE — ${success} records loaded`);
    console.log(`   @mention @Zion_Sealey_Bot`);
    
    // Commit and push
    console.log('\n📝 Committing changes...');
    try {
      require('child_process').execSync('git add .', { cwd: path.join(__dirname, '..') });
      require('child_process').execSync('git commit -m "feat: T-00 consolidated clinic DB normalized + loaded to Supabase"', { cwd: path.join(__dirname, '..') });
      require('child_process').execSync('git push origin main', { cwd: path.join(__dirname, '..') });
      console.log('✅ Changes committed and pushed');
    } catch (err) {
      console.error('⚠️  Git commit/push failed:', err.message);
    }
  } else {
    console.error('❌ TASK-GR-V52T00 FAILED');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});