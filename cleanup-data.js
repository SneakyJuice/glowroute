#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Clean description text
function cleanDescription(text) {
  if (!text) return '';
  
  let cleaned = text;
  
  // Remove markdown images
  cleaned = cleaned.replace(/!\[[^\]]*\]\([^)]*\)/g, '');
  
  // Remove markdown links but keep text
  cleaned = cleaned.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');
  
  // Remove HTML tags
  cleaned = cleaned.replace(/<[^>]*>/g, '');
  
  // Remove HTML entities
  cleaned = cleaned.replace(/&[a-z]+;/g, '');
  cleaned = cleaned.replace(/&#[0-9]+;/g, '');
  
  // Remove control characters and weird unicode
  cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  cleaned = cleaned.replace(/\\u[0-9a-fA-F]{4}/g, '');
  
  // Trim and clean up whitespace
  cleaned = cleaned.trim();
  cleaned = cleaned.replace(/\s+/g, ' ');
  
  // Remove quotes if they're the entire description
  if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || 
      (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
    cleaned = cleaned.slice(1, -1).trim();
  }
  
  // Remove "We use cookies..." notices
  if (cleaned.includes('We use cookies') || cleaned.includes('cookie consent')) {
    return '';
  }
  
  return cleaned;
}

// Read and parse TypeScript file
function parseTSFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Extract array content (simplified parser)
  const arrayStart = content.indexOf('[');
  const arrayEnd = content.lastIndexOf(']');
  const arrayContent = content.substring(arrayStart, arrayEnd + 1);
  
  // Very simple parsing - just for counting
  const clinicMatches = arrayContent.match(/\{\s*id:/g);
  const clinicCount = clinicMatches ? clinicMatches.length : 0;
  
  return { content, arrayContent, clinicCount };
}

// Clean a TypeScript clinic data file
function cleanTSFile(inputPath, outputPath) {
  console.log(`Cleaning ${path.basename(inputPath)}...`);
  
  const { content, arrayContent, clinicCount } = parseTSFile(inputPath);
  console.log(`  Found ${clinicCount} clinics`);
  
  // Simple cleaning - find and clean descriptions
  let cleanedContent = content;
  
  // Find and clean all descriptions
  const descRegex = /description:\s*'([^']*)'/g;
  let match;
  let cleanedCount = 0;
  let shortCount = 0;
  
  while ((match = descRegex.exec(content)) !== null) {
    const original = match[1];
    const cleaned = cleanDescription(original);
    
    if (cleaned !== original && cleaned !== '') {
      cleanedContent = cleanedContent.replace(
        `description: '${original}'`,
        `description: '${cleaned}'`
      );
      cleanedCount++;
    }
    
    if (cleaned.length < 30 && cleaned.length > 0) {
      shortCount++;
    }
  }
  
  console.log(`  Cleaned ${cleanedCount} descriptions`);
  console.log(`  Still short (<30 chars): ${shortCount} descriptions`);
  
  // Write cleaned file
  fs.writeFileSync(outputPath, cleanedContent, 'utf8');
  console.log(`  Saved to ${outputPath}`);
  
  return { cleanedCount, shortCount, clinicCount };
}

// Main cleanup
console.log('=== GlowRoute Data Cleanup ===\n');

// Backup original files
const backupDir = path.join(__dirname, 'data-backup');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir);
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const filesToClean = [
  { input: 'data/fl-clinics.ts', output: `data-backup/fl-clinics-${timestamp}.ts` },
  { input: 'data/national-clinics.ts', output: `data-backup/national-clinics-${timestamp}.ts` }
];

// Create backups
filesToClean.forEach(file => {
  fs.copyFileSync(path.join(__dirname, file.input), path.join(__dirname, file.output));
});
console.log('Created backups in data-backup/\n');

// Clean files
const results = [];
filesToClean.forEach(file => {
  const result = cleanTSFile(
    path.join(__dirname, file.input),
    path.join(__dirname, file.input) // overwrite original
  );
  results.push(result);
});

// Summary
console.log('\n=== Cleanup Summary ===');
const totalClinics = results.reduce((sum, r) => sum + r.clinicCount, 0);
const totalCleaned = results.reduce((sum, r) => sum + r.cleanedCount, 0);
const totalShort = results.reduce((sum, r) => sum + r.shortCount, 0);

console.log(`Total clinics: ${totalClinics}`);
console.log(`Descriptions cleaned: ${totalCleaned}`);
console.log(`Short descriptions remaining (<30 chars): ${totalShort}`);

// Verify TypeScript still compiles
console.log('\n=== TypeScript Verification ===');
try {
  const { execSync } = require('child_process');
  execSync('npx tsc --noEmit', { cwd: __dirname, stdio: 'pipe' });
  console.log('✅ TypeScript compiles cleanly');
} catch (error) {
  console.log('❌ TypeScript compilation failed:');
  console.log(error.stdout?.toString() || error.message);
}

console.log('\n=== Next Steps ===');
console.log('1. Run TypeScript compile: npx tsc --noEmit');
console.log('2. Build: npm run build');
console.log('3. Deploy: vercel --prod');