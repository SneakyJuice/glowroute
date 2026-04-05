#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Check for non-printable characters
function checkBinaryGarbage(content) {
  const nonPrintable = content.match(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g);
  if (nonPrintable) {
    console.log(`Found ${nonPrintable.length} non-printable characters`);
    return true;
  }
  
  // Check for weird patterns
  const weirdPatterns = [
    /\\u0000/g,
    /\\x00/g,
    /&#[0-9]+;/g,
    /&[a-z]+;/g
  ];
  
  let found = false;
  weirdPatterns.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) {
      console.log(`Found pattern ${pattern}: ${matches.length} occurrences`);
      found = true;
    }
  });
  
  return found;
}

// Check FL clinics file
console.log('Checking fl-clinics.ts...');
const flClinicsContent = fs.readFileSync(path.join(__dirname, 'data/fl-clinics.ts'), 'utf8');
const hasBinaryFL = checkBinaryGarbage(flClinicsContent);

// Check national clinics file  
console.log('\nChecking national-clinics.ts...');
const nationalClinicsContent = fs.readFileSync(path.join(__dirname, 'data/national-clinics.ts'), 'utf8');
const hasBinaryNational = checkBinaryGarbage(nationalClinicsContent);

console.log('\n=== Summary ===');
console.log(`fl-clinics.ts has binary/control chars: ${hasBinaryFL ? 'YES' : 'NO'}`);
console.log(`national-clinics.ts has binary/control chars: ${hasBinaryNational ? 'YES' : 'NO'}`);

// Count clinics
const flClinicsMatch = flClinicsContent.match(/id: 'clinic-/g);
const nationalClinicsMatch = nationalClinicsContent.match(/id: 'clinic-/g);

console.log(`\n=== Clinic Counts ===`);
console.log(`FL clinics: ${flClinicsMatch ? flClinicsMatch.length : 0}`);
console.log(`National clinics: ${nationalClinicsMatch ? nationalClinicsMatch.length : 0}`);
console.log(`Total: ${(flClinicsMatch ? flClinicsMatch.length : 0) + (nationalClinicsMatch ? nationalClinicsMatch.length : 0)}`);

// Check for description quality
console.log('\n=== Description Analysis ===');
const descriptions = flClinicsContent.match(/description: '[^']*'/g);
if (descriptions) {
  const shortDescriptions = descriptions.filter(desc => {
    const text = desc.match(/description: '([^']*)'/)[1];
    return text.length < 50;
  });
  console.log(`Total descriptions in FL: ${descriptions.length}`);
  console.log(`Short descriptions (<50 chars): ${shortDescriptions.length}`);
  
  // Show some short descriptions
  console.log('\nSample short descriptions:');
  shortDescriptions.slice(0, 5).forEach(desc => {
    const text = desc.match(/description: '([^']*)'/)[1];
    console.log(`- "${text.substring(0, 100)}${text.length > 100 ? '...' : ''}"`);
  });
}