#!/usr/bin/env node
/**
 * goals-backfill.js
 *
 * Computes goals[] for every clinic in Supabase based on their services[] column.
 * Goals are derived from taxonomy.json goals layer — each goal maps to a set of
 * modality slugs. A clinic qualifies for a goal if it has >= minModalities matching slugs.
 *
 * Also runs taxonomy-backfill logic first to ensure services[] is normalized.
 *
 * Usage:
 *   node scripts/goals-backfill.js           # dry run
 *   node scripts/goals-backfill.js --write   # live write
 */

const fs = require('fs');
const path = require('path');

const DRY_RUN = !process.argv.includes('--write');
const SUPA_URL = process.env.SUPABASE_URL || 'https://psiuknphchmhsthvhkpt.supabase.co';
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPA_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not set. Run: source .keys.env');
  process.exit(1);
}

const taxonomy = JSON.parse(fs.readFileSync(path.join(__dirname, '../lib/taxonomy.json'), 'utf8'));
const goals = taxonomy.goals;
const goalDefs = Object.entries(goals).filter(([k]) => k !== '_meta');

// Build variant → canonical map (for normalizing services on the fly)
const variantMap = new Map();
for (const [slug, def] of Object.entries(taxonomy.canonicals)) {
  for (const v of def.variants) variantMap.set(v.toLowerCase().trim(), slug);
}

console.log(`[goals-backfill] taxonomy v${taxonomy._meta.version} — ${goalDefs.length} goals`);
if (DRY_RUN) console.log('[goals-backfill] DRY RUN — pass --write to apply');

/**
 * Compute canonical services from raw services array
 */
function normalizeServices(rawServices) {
  const slugs = new Set();
  for (const tag of (rawServices || [])) {
    const canonical = variantMap.get(tag.toLowerCase().trim());
    if (canonical) slugs.add(canonical);
    // Also accept already-canonical slugs
    if (taxonomy.canonicals[tag]) slugs.add(tag);
  }
  return slugs;
}

/**
 * Compute goal slugs for a clinic given its normalized services
 */
function computeGoals(serviceSet) {
  const matchedGoals = [];
  for (const [goalSlug, def] of goalDefs) {
    const modalities = def.modalities || [];
    const min = def.minModalities || 1;
    const matches = modalities.filter(m => serviceSet.has(m));
    if (matches.length >= min) {
      matchedGoals.push(goalSlug);
    }
  }
  return matchedGoals.sort();
}

async function fetchPage(offset, limit) {
  const url = `${SUPA_URL}/rest/v1/clinics?select=id,slug,name,city,services,goals&offset=${offset}&limit=${limit}&order=id`;
  const res = await fetch(url, {
    headers: { 'apikey': SUPA_KEY, 'Authorization': 'Bearer ' + SUPA_KEY }
  });
  return res.json();
}

async function patch(id, goals, services) {
  const url = `${SUPA_URL}/rest/v1/clinics?id=eq.${id}`;
  await fetch(url, {
    method: 'PATCH',
    headers: {
      'apikey': SUPA_KEY, 'Authorization': 'Bearer ' + SUPA_KEY,
      'Content-Type': 'application/json', 'Prefer': 'return=minimal'
    },
    body: JSON.stringify({ goals, services: [...services].sort() })
  });
}

async function main() {
  const PAGE = 500;
  let offset = 0;
  let totalProcessed = 0, totalUpdated = 0, totalNoGoals = 0;
  const goalCounts = new Map(goalDefs.map(([s]) => [s, 0]));

  while (true) {
    const rows = await fetchPage(offset, PAGE);
    if (!Array.isArray(rows) || rows.length === 0) break;

    const patches = [];
    for (const row of rows) {
      const services = normalizeServices(row.services);
      const newGoals = computeGoals(services);
      const currentGoals = [...(row.goals || [])].sort().join(',');
      const nextGoals = newGoals.join(',');

      if (newGoals.length === 0) { totalNoGoals++; continue; }
      newGoals.forEach(g => goalCounts.set(g, (goalCounts.get(g) || 0) + 1));

      if (currentGoals === nextGoals) continue;
      patches.push({ id: row.id, goals: newGoals, services, name: row.name, city: row.city });
    }

    // Dry run examples
    if (DRY_RUN && patches.length > 0 && offset === 0) {
      console.log('\n[dry run examples]');
      patches.slice(0, 6).forEach(p => {
        console.log(`  ${p.name} (${p.city})`);
        console.log(`    services: [${[...p.services].join(', ')}]`);
        console.log(`    goals:    [${p.goals.join(', ')}]`);
      });
    }

    if (!DRY_RUN && patches.length > 0) {
      const CONCURRENT = 25;
      for (let i = 0; i < patches.length; i += CONCURRENT) {
        await Promise.all(patches.slice(i, i + CONCURRENT).map(p => patch(p.id, p.goals, p.services)));
      }
    }

    totalUpdated += patches.length;
    totalProcessed += rows.length;
    process.stdout.write(`\r  Processed: ${totalProcessed} | Updated: ${totalUpdated} | No goals: ${totalNoGoals}`);
    if (rows.length < PAGE) break;
    offset += PAGE;
  }

  console.log(`\n\n✅ Done — processed: ${totalProcessed}, updated: ${totalUpdated}, no-goals: ${totalNoGoals}`);

  console.log('\n📊 Goal distribution:');
  [...goalCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .forEach(([slug, count]) => {
      const label = goals[slug]?.label || slug;
      console.log(`  ${count.toString().padStart(4)}  ${goals[slug]?.emoji || ''}  ${label}`);
    });
}

main().catch(err => { console.error(err); process.exit(1); });
