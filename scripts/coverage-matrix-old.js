#!/usr/bin/env node
/**
 * TASK-GR-V52T04: Coverage Matrix
 * Generate city × treatment coverage matrix from Supabase clinics table
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
  console.log('🧮 Processing coverage matrix...');
  
  const cityTreatmentCounts = {};
  const cityCounts = {};
  const treatmentCounts = {};
  const allCities = new Set();
  const allTreatments = new Set();
  
  clinics.forEach(clinic => {
    const city = clinic.city || 'Unknown';
    const services = clinic.services || [];
    
    // Ensure services is an array
    let serviceList = services;
    if (typeof services === 'string') {
      try {
        serviceList = JSON.parse(services);
      } catch (e) {
        serviceList = services.split(',').map(s => s.trim()).filter(s => s);
      }
    }
    if (!Array.isArray(serviceList)) {
      serviceList = [];
    }
    
    // Count total clinics per city
    cityCounts[city] = (cityCounts[city] || 0) + 1;
    
    // Count each service
    serviceList.forEach(service => {
      const treatment = service.trim().toLowerCase();
      if (!treatment) return;
      
      allTreatments.add(treatment);
      
      // Increment city-treatment count
      const key = `${city}||${treatment}`;
      cityTreatmentCounts[key] = (cityTreatmentCounts[key] || 0) + 1;
      
      // Increment overall treatment count
      treatmentCounts[treatment] = (treatmentCounts[treatment] || 0) + 1;
    });
    
    allCities.add(city);
  });
  
  // Build matrix
  const matrix = {};
  Array.from(allCities).sort().forEach(city => {
    matrix[city] = {};
    Array.from(allTreatments).sort().forEach(treatment => {
      const key = `${city}||${treatment}`;
      matrix[city][treatment] = cityTreatmentCounts[key] || 0;
    });
  });
  
  // Identify gaps (city+treatment combos with 0 clinics)
  const gaps = [];
  Array.from(allCities).sort().forEach(city => {
    Array.from(allTreatments).sort().forEach(treatment => {
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
      totalTreatments: allTreatments.size,
      topCities,
      topTreatments,
    },
    gaps: gaps.slice(0, 50), // Limit gaps output
  };
}

async function main() {
  console.log('🚀 Starting TASK-GR-V52T04: Coverage Matrix');
  
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
  console.log(`   @mention @Zion_Sealey_Bot`);
  
  // Commit and push
  console.log('\n📝 Committing changes...');
  try {
    require('child_process').execSync('git add .', { cwd: path.join(__dirname, '..') });
    require('child_process').execSync('git commit -m "feat: T-04 coverage matrix — city x treatment"', { cwd: path.join(__dirname, '..') });
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