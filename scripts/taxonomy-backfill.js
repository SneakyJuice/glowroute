#!/usr/bin/env node
/**
 * taxonomy-backfill.js
 *
 * Reads lib/taxonomy.json and normalizes the `services` column for all clinics in Supabase.
 * Also reads treatments[] / specialtyTreatments[] from the Supabase rows themselves.
 *
 * Usage:
 *   node scripts/taxonomy-backfill.js           # dry run (no writes)
 *   node scripts/taxonomy-backfill.js --write    # live write to Supabase
 *   node scripts/taxonomy-backfill.js --write --city=Tampa
 */

const fs = require('fs');
const path = require('path');

const DRY_RUN = !process.argv.includes('--write');
const CITY_FILTER = (process.argv.find(a => a.startsWith('--city=')) || '').replace('--city=', '');

const SUPA_URL = process.env.SUPABASE_URL || 'https://psiuknphchmhsthvhkpt.supabase.co';
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPA_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not set. Run: source .keys.env');
  process.exit(1);
}

// Load taxonomy
const taxonomyPath = path.join(__dirname, '../lib/taxonomy.json');
const taxonomy = JSON.parse(fs.readFileSync(taxonomyPath, 'utf8'));

// Build lookup: variant (lowercased) → canonical slug
const variantMap = new Map();
for (const [slug, def] of Object.entries(taxonomy.canonicals)) {
  for (const variant of def.variants) {
    variantMap.set(variant.toLowerCase().trim(), slug);
  }
}

console.log(`[taxonomy] Loaded ${Object.keys(taxonomy.canonicals).length} canonicals, ${variantMap.size} variants`);
if (DRY_RUN) console.log('[taxonomy] DRY RUN — pass --write to apply changes');
if (CITY_FILTER) console.log(`[taxonomy] City filter: ${CITY_FILTER}`);

/**
 * Normalize an array of raw tag strings → array of unique canonical slugs
 */
function normalize(rawTags) {
  if (!rawTags || !Array.isArray(rawTags)) return [];
  const slugs = new Set();
  for (const tag of rawTags) {
    if (!tag || typeof tag !== 'string') continue;
    const canonical = variantMap.get(tag.toLowerCase().trim());
    if (canonical) slugs.add(canonical);
  }
  return [...slugs].sort();
}

async function fetchPage(from, to) {
  let url = `${SUPA_URL}/rest/v1/clinics?select=id,slug,name,city,services&order=id&offset=${from}&limit=${to - from + 1}`;
  if (CITY_FILTER) url += `&city=ilike.${encodeURIComponent(CITY_FILTER)}`;
  const res = await fetch(url, {
    headers: { 'apikey': SUPA_KEY, 'Authorization': 'Bearer ' + SUPA_KEY }
  });
  return res.json();
}

async function patchClinic(id, services) {
  const url = `${SUPA_URL}/rest/v1/clinics?id=eq.${id}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      'apikey': SUPA_KEY,
      'Authorization': 'Bearer ' + SUPA_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({ services })
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PATCH failed for ${id}: ${text}`);
  }
}

async function main() {
  let page = 0;
  const PAGE_SIZE = 500;
  let totalProcessed = 0, totalUpdated = 0, totalUnchanged = 0, totalNoSignal = 0;
  const unmappedCounter = new Map();

  while (true) {
    const from = page * PAGE_SIZE;
    const rows = await fetchPage(from, from + PAGE_SIZE - 1);
    if (!Array.isArray(rows) || rows.length === 0) break;

    const patches = [];

    for (const row of rows) {
      const rawServices = row.services || [];

      // Track unmapped tags for audit
      for (const tag of rawServices) {
        const key = tag.toLowerCase().trim();
        if (key && !variantMap.has(key)) {
          unmappedCounter.set(key, (unmappedCounter.get(key) || 0) + 1);
        }
      }

      const normalized = normalize(rawServices);
      const current = [...(row.services || [])].sort().join(',');
      const next = [...normalized].sort().join(',');

      if (normalized.length === 0) {
        totalNoSignal++;
        continue;
      }

      if (current === next) {
        totalUnchanged++;
        continue;
      }

      patches.push({ id: row.id, services: normalized, name: row.name, city: row.city, old: rawServices, new: normalized });
    }

    // Apply patches in parallel batches of 20
    if (!DRY_RUN && patches.length > 0) {
      const CONCURRENT = 20;
      for (let i = 0; i < patches.length; i += CONCURRENT) {
        await Promise.all(patches.slice(i, i + CONCURRENT).map(p => patchClinic(p.id, p.services)));
      }
    } else if (DRY_RUN && patches.length > 0 && page < 2) {
      // Show first 5 examples on dry run
      console.log(`\n[dry run examples - page ${page}]`);
      patches.slice(0, 5).forEach(p => {
        console.log(`  ${p.name} (${p.city})`);
        console.log(`    OLD: [${p.old.slice(0,4).join(', ')}${p.old.length > 4 ? '...' : ''}]`);
        console.log(`    NEW: [${p.new.join(', ')}]`);
      });
    }

    totalUpdated += patches.length;
    totalProcessed += rows.length;
    totalUnchanged += (rows.length - patches.length - (rows.filter(r => normalize(r.services || []).length === 0).length - (page === 0 ? 0 : 0)));

    process.stdout.write(`\r  Page ${page + 1}: processed ${totalProcessed}, updated ${totalUpdated}, no signal ${totalNoSignal}`);

    if (rows.length < PAGE_SIZE) break;
    page++;
  }

  console.log(`\n\n✅ Complete — processed: ${totalProcessed}, updated: ${totalUpdated}, no-signal: ${totalNoSignal}`);

  // Report top unmapped tags (future taxonomy candidates)
  const topUnmapped = [...unmappedCounter.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30);

  if (topUnmapped.length > 0) {
    console.log(`\n📊 Top unmapped tags (taxonomy candidates for next audit):`);
    topUnmapped.forEach(([tag, count]) => console.log(`  ${count.toString().padStart(4)}  ${tag}`));
  }
}

main().catch(err => { console.error(err); process.exit(1); });
