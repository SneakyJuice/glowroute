#!/usr/bin/env node
/**
 * GlowRoute — Merge all city JSONs into one master file
 * Run after all city batches complete
 * Usage: node merge-cities.js
 */
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, 'output');
const MASTER_FILE = path.join(OUTPUT_DIR, 'all-merged.json');

if (!fs.existsSync(OUTPUT_DIR)) {
  console.error('No output/ directory found. Run enrich-batch.js first.');
  process.exit(1);
}

const files = fs.readdirSync(OUTPUT_DIR)
  .filter(f => f.endsWith('.json') && f !== 'all-merged.json');

const allClinics = [];
const seenNames = new Set();
let dupes = 0;

for (const file of files) {
  const city = file.replace('.json', '');
  const data = JSON.parse(fs.readFileSync(path.join(OUTPUT_DIR, file), 'utf8'));
  const arr = Array.isArray(data) ? data : [data];
  for (const clinic of arr) {
    const key = clinic.name?.toLowerCase().trim();
    if (key && seenNames.has(key)) { dupes++; continue; }
    if (key) seenNames.add(key);
    allClinics.push(clinic);
  }
  console.log(`✅ ${city}: ${arr.length} clinics`);
}

fs.writeFileSync(MASTER_FILE, JSON.stringify(allClinics, null, 2));
console.log(`\n📊 Merged: ${allClinics.length} unique clinics (${dupes} dupes removed)`);
console.log(`📁 Saved to: ${MASTER_FILE}`);
console.log(`\nNext: push output/all-merged.json to GitHub so Atlas can pull it.`);
