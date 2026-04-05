#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { Command } = require('commander');
const program = new Command();
const { execSync } = require('child_process');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

program
  .option('--template <type>', 'Template type (city-landing, treatment-page)')
  .option('--city <name>', 'City name')
  .option('--treatment <name>', 'Treatment name (for treatment pages)')
  .option('--count <number>', 'Number of clinics to include', 3)
  .option('--batch', 'Generate for multiple cities', false)
  .option('--dry-run', 'Preview without writing files', false);

program.parse(process.argv);
const options = program.opts();

async function fetchClinicsByCity(city, limit = 3) {
  const { data, error } = await supabase
    .from('clinics')
    .select('*')
    .eq('city', city)
    .order('glow_score', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

async function fetchCityStats(city) {
  const { count } = await supabase
    .from('clinics')
    .select('*', { count: 'exact', head: true })
    .eq('city', city)
    .eq('visibility', 'visible');

  const { data: scoreData } = await supabase
    .from('clinics')
    .select('glow_score')
    .eq('city', city)
    .eq('visibility', 'visible')
    .not('glow_score', 'is', null);

  const scores = (scoreData || []).map(c => c.glow_score).filter(Boolean);
  const avgScore = scores.length ? (scores.reduce((s, v) => s + v, 0) / scores.length).toFixed(1) : 'N/A';

  return {
    clinic_count: count || 0,
    avg_score: avgScore
  };
}

async function generateContent() {
  try {
    const templatePath = path.join(__dirname, '../content/templates', `${options.template}.mdx`);
    const template = fs.readFileSync(templatePath, 'utf-8');

    if (options.batch) {
      // Batch mode - generate for top cities
      const { data: cities } = await supabase
        .from('clinics')
        .select('city')
        .order('glow_score', { ascending: false })
        .limit(options.count);

      for (const { city } of cities) {
        await processCity(city, template);
      }
    } else {
      // Single city mode
      await processCity(options.city, template);
    }

    if (!options.dryRun) {
      // Commit and push to GitHub
      execSync('git add .', { cwd: path.join(__dirname, '..') });
      execSync(`git commit -m "Generated content for ${options.city || 'multiple cities'}"`, 
        { cwd: path.join(__dirname, '..') });
      execSync('git push origin main', { cwd: path.join(__dirname, '..') });
      console.log('Changes committed and pushed to GitHub');
    }
  } catch (error) {
    console.error('Error generating content:', error);
    process.exit(1);
  }
}

async function processCity(city, template) {
  const clinics = await fetchClinicsByCity(city, options.count);
  const cityStats = await fetchCityStats(city);

  // Replace template variables
  let content = template
    .replace(/\{\{city\}\}/g, city)
    .replace(/\{\{clinics\.length\}\}/g, clinics.length)
    .replace(/\{\{city_stats\.clinic_count\}\}/g, cityStats.clinic_count)
    .replace(/\{\{city_stats\.avg_score\}\}/g, cityStats.avg_score);

  // Process clinic data
  const clinicPattern = /\{% for clinic in clinics %\}([\s\S]*?)\{% endfor %\}/;
  const clinicTemplate = clinicPattern.exec(content)[1];
  let clinicContent = '';

  for (const clinic of clinics) {
    let clinicBlock = clinicTemplate
      .replace(/\{\{clinic\.name\}\}/g, clinic.name)
      .replace(/\{\{clinic\.glow_score\}\}/g, clinic.glow_score)
      .replace(/\{\{clinic\.specialties\}\}/g, Array.isArray(clinic.specialties) ? clinic.specialties.join(', ') : (Array.isArray(clinic.services) ? clinic.services.join(', ') : ''))
      .replace(/\{\{clinic\.address\}\}/g, clinic.address)
      .replace(/\{\{clinic\.description\}\}/g, clinic.description)
      .replace(/\{\{clinic\.website\}\}/g, clinic.website);
    clinicContent += clinicBlock;
  }

  content = content.replace(clinicPattern, clinicContent);

  // Generate slug
  const slug = `${options.template}-${city.toLowerCase().replace(/\s+/g, '-')}`;
  const outputPath = path.join(__dirname, '../app/blog', slug, 'page.mdx');

  if (options.dryRun) {
    console.log(`Would generate content for ${city} at ${outputPath}`);
    console.log('Preview content:');
    console.log(content);
  } else {
    // Ensure directory exists
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, content);
    console.log(`Generated content for ${city} at ${outputPath}`);
  }
}

generateContent();