#!/usr/bin/env node
/**
 * Parse fl-clinics.ts TypeScript file to extract clinic data
 */

const fs = require('fs');
const path = require('path');

const FL_CLINICS_TS_PATH = path.join(__dirname, '../data/fl-clinics.ts');

function parseFlClinics() {
  console.log(`Parsing ${FL_CLINICS_TS_PATH}...`);
  const content = fs.readFileSync(FL_CLINICS_TS_PATH, 'utf8');
  
  // Find all chunk arrays
  const chunkRegex = /const flClinicsChunk\d+: Clinic\[\] = \[([\s\S]*?)\](?=\s*(?:,|const|export))/g;
  const chunks = [];
  let match;
  
  while ((match = chunkRegex.exec(content)) !== null) {
    chunks.push(match[1]);
  }
  
  console.log(`Found ${chunks.length} chunks`);
  
  // Parse each chunk
  const allClinics = [];
  let clinicCount = 0;
  
  chunks.forEach((chunk, chunkIndex) => {
    // Split by clinic objects (simplified - looks for }, at start of line with spaces)
    const clinicBlocks = chunk.split(/\n  \},?\n/);
    
    clinicBlocks.forEach((block, blockIndex) => {
      if (!block.trim() || block.trim() === ']' || block.includes('export')) {
        return;
      }
      
      // Parse clinic object
      const clinic = parseClinicBlock(block);
      if (clinic) {
        allClinics.push(clinic);
        clinicCount++;
      }
    });
  });
  
  console.log(`Parsed ${clinicCount} clinics`);
  return allClinics;
}

function parseClinicBlock(block) {
  // Remove leading { and trailing }
  let blockStr = block.trim();
  if (blockStr.startsWith('{')) blockStr = blockStr.substring(1);
  if (blockStr.endsWith('},')) blockStr = blockStr.substring(0, blockStr.length - 2);
  if (blockStr.endsWith('}')) blockStr = blockStr.substring(0, blockStr.length - 1);
  
  const clinic = {};
  const lines = blockStr.split('\n').map(l => l.trim()).filter(l => l);
  
  for (const line of lines) {
    // Parse key: value
    const match = line.match(/^(\w+):\s*(.+),?$/);
    if (match) {
      const [, key, value] = match;
      
      // Parse value based on type
      if (value.startsWith("'") && value.endsWith("'")) {
        // String
        clinic[key] = value.substring(1, value.length - 1).replace(/\\'/g, "'");
      } else if (value.startsWith('[') && value.endsWith(']')) {
        // Array
        const items = value.substring(1, value.length - 1).split(',').map(s => {
          s = s.trim();
          if (s.startsWith("'") && s.endsWith("'")) {
            return s.substring(1, s.length - 1).replace(/\\'/g, "'");
          }
          return s;
        }).filter(s => s);
        clinic[key] = items;
      } else if (value === 'true' || value === 'false') {
        // Boolean
        clinic[key] = value === 'true';
      } else if (!isNaN(parseFloat(value)) && value.trim() !== '') {
        // Number
        clinic[key] = parseFloat(value);
      } else {
        // Keep as string
        clinic[key] = value;
      }
    }
  }
  
  return clinic;
}

// Test
if (require.main === module) {
  const clinics = parseFlClinics();
  console.log(`First clinic:`, JSON.stringify(clinics[0], null, 2));
  console.log(`Sample treatments:`, clinics[0].treatments);
  
  // Count
  console.log(`\nTotal clinics: ${clinics.length}`);
  
  // Write to file for inspection
  fs.writeFileSync(
    path.join(__dirname, '../parsed-fl-clinics.json'),
    JSON.stringify(clinics, null, 2)
  );
  console.log(`Written to parsed-fl-clinics.json`);
}

module.exports = parseFlClinics;