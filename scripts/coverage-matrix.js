#!/usr/bin/env node
/**
 * TASK-GR-V52T04: Coverage Matrix
 * Generate city × treatment coverage matrix from Supabase clinics table
 * Uses canonical treatment slugs from lib/treatments.ts
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

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

// Canonical treatment slugs (from lib/treatments.ts)
const CANONICAL_SLUGS = [
  'botox-fillers',
  'laser-hair-removal',
  'hydrafacial',
  'weight-loss-ozempic',
  'iv-therapy',
  'microneedling',
  'chemical-peels',
  'trt-testosterone',
  'peptide-therapy',
  'coolsculpting',
];

// Treatment normalization mapping (same as load-clinics-simple.js)
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

// Normalize a single treatment string to a canonical slug
function normalizeTreatment(treatment) {
  if (!treatment || typeof treatment !== 'string') return null;
  const lower = treatment.toLowerCase().trim();
  
  // Direct match for canonical slugs
  if (CANONICAL_SLUGS.includes(lower)) {
    return lower;
  }
  
  // Keyword mapping
  for (const [keyword, slug] of Object.entries(TREATMENT_MAPPING)) {
    if (lower.includes(keyword) || keyword.includes(lower)) {
      return slug;
    }
  }
  
  // No match - could return null or keep original
  return null;
}

// Normalize an array of treatments (or string) to canonical slugs
function normalizeTreatments(treatments) {
  if (!treatments) return [];
  let serviceList = treatments;
  if (typeof serviceList === 'string') {
    try {
      serviceList = JSON.parse(serviceList);
    } catch (e) {
      serviceList = serviceList.split(/[,;|]/).map(s => s.trim()).filter(s => s);
    }
  }
  if (!Array.isArray(serviceList)) {
    serviceList = [];
  }
  
  const normalized = new Set();
  serviceList.forEach(treatment => {
    const slug = normalizeTreatment(treatment);
    if (slug) {
      normalized.add(slug);
    }
  });
  return Array.from(normalized);
}

async function fetchAllClinics() {
  console.log('📊 Fetching all clinics...');
  let allClinics = [];
  let page = 0;
  const pageSize = 1000;
  let hasMore = true;
  
  while (hasMore) {
    const from = page * pageSize;
    const to = from + pageSize - 1;
    const { data, error, count } = await supabase
      .from('clinics')
      .select('city,services', { count: 'exact' })
      .range(from, to);
      
    if (error) {
      console.error('❌ Error fetching clinics:', error.message);
      break;
    }
    
    if (data) {
      allClinics = allClinics.concat(data);
      console.log(`   Fetched ${data.length} clinics (total: ${allClinics.length})`);
    }
    
    if (!data || data.length < pageSize) {
      hasMore = false;
    }
    page++;
  }
  
  console.log(`✅ Total clinics fetched: ${allClinics.length}`);
  return allClinics;
}

function processCoverage(clinics) {
  console.log('🧮 Processing coverage matrix (canonical treatments)...');
  
  const cityTreatmentCounts = {};
  const cityCounts = {};
  const treatmentCounts = {};
  const allCities = new Set();
  
  clinics.forEach(clinic => {
    const city = clinic.city || 'Unknown';
    const services = clinic.services || [];
    
    // Normalize services to canonical slugs
    const canonicalServices = normalizeTreatments(services);
    
    // Count total clinics per city
    cityCounts[city] = (cityCounts[city] || 0) + 1;
    
    // Count each canonical service
    canonicalServices.forEach(slug => {
      // Increment city-treatment count
      const key = `${city}||${slug}`;
      cityTreatmentCounts[key] = (cityTreatmentCounts[key] || 0) + 1;
      
      // Increment overall treatment count
      treatmentCounts[slug] = (treatmentCounts[slug] || 0) + 1;
    });
    
    allCities.add(city);
  });
  
  // Build matrix: city × canonical treatment
  const matrix = {};
  const allTreatments = CANONICAL_SLUGS; // Only canonical treatments
  Array.from(allCities).sort().forEach(city => {
    matrix[city] = {};
    allTreatments.forEach(treatment => {
      const key = `${city}||${treatment}`;
      matrix[city][treatment] = cityTreatmentCounts[key] || 0;
    });
  });
  
  // Identify gaps (city+treatment combos with 0 clinics)
  const gaps = [];
  Array.from(allCities).sort().forEach(city => {
    allTreatments.forEach(treatment => {
      const key = `${city}||${treatment}`;
      if (!cityTreatmentCounts[key]) {
        gaps.push({ city, treatment, count: 0 });
      }
    });
  });
  
  // Top cities by clinic count
  const topCities = Object.entries(cityCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([city, count]) => ({ city, count }));
  
  // Top treatments by coverage
  const topTreatments = Object.entries(treatmentCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([treatment, count]) => ({ treatment, count }));
  
  return {
    matrix,
    summary: {
      totalClinics: clinics.length,
      totalCities: allCities.size,
      totalTreatments: allTreatments.length,
      topCities,
      topTreatments,
    },
    gaps: gaps.slice(0, 100), // Limit gaps output
  };
}

async function main() {
  console.log('🚀 Starting TASK-GR-V52T04: Coverage Matrix (canonical treatments)');
  
  // Fetch all clinics
  const clinics = await fetchAllClinics();
  if (clinics.length === 0) {
    console.error('❌ No clinics found');
    return;
  }
  
  // Process coverage
  const coverage = processCoverage(clinics);
  
  // Output to file
  const outputPath = path.join(__dirname, '../data/coverage-matrix.json');
  fs.writeFileSync(outputPath, JSON.stringify(coverage, null, 2));
  console.log(`✅ Coverage matrix saved to: ${outputPath}`);
  
  // Print summary
  console.log('\n📊 COVERAGE SUMMARY:');
  console.log(`   Total clinics: ${coverage.summary.totalClinics}`);
  console.log(`   Total cities: ${coverage.summary.totalCities}`);
  console.log(`   Total treatments: ${coverage.summary.totalTreatments}`);
  console.log(`   Top city: ${coverage.summary.topCities[0]?.city} (${coverage.summary.topCities[0]?.count} clinics)`);
  console.log(`   Top treatment: ${coverage.summary.topTreatments[0]?.treatment} (${coverage.summary.topTreatments[0]?.count} clinics)`);
  console.log(`   Gaps identified: ${coverage.gaps.length}`);
  
  // Post to Build Room
  console.log('\n📢 Post to Build Room:');
  console.log(`   ✅ [T-04] DONE — Coverage matrix generated`);
  console.log(`   Cities: ${coverage.summary.totalCities}, Treatments: ${coverage.summary.totalTreatments}`);
  console.log(`   Top city: ${coverage.summary.topCities[0]?.city} (${coverage.summary.topCities[0]?.count} clinics)`);
  console.log(`   Top treatment: ${coverage.summary.topTreatments[0]?.treatment} (${coverage.summary.topTreatments[0]?.count} clinics)`);
  console.log(`   @mention @Zion_Sealey_Bot`);
  
  // Commit and push
  console.log('\n📝 Committing changes...');
  try {
    require('child_process').execSync('git add .', { cwd: path.join(__dirname, '..') });
    require('child_process').execSync('git commit -m "feat: T-04 coverage matrix — city x canonical treatments"', { cwd: path.join(__dirname, '..') });
    require('child_process').execSync('git push origin main', { cwd: path.join(__dirname, '..') });
    console.log('✅ Changes committed and pushed');
  } catch (err) {
    console.error('⚠️  Git commit/push failed:', err.message);
  }
}

main().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});