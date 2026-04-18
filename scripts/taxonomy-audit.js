#!/usr/bin/env node
/**
 * taxonomy-audit.js
 *
 * Monthly maintenance script. Surfaces:
 * 1. New unmapped service tags appearing in Supabase (new treatments)
 * 2. PostHog search signals — what are users actually filtering/searching?
 * 3. Canonical variants with zero matches (dead weight to prune)
 * 4. Clinics gaining new services that still have no canonical coverage
 *
 * Outputs a markdown report → docs/taxonomy-audit-YYYY-MM.md
 * Does NOT auto-update taxonomy.json — human review required before changes.
 *
 * Usage:
 *   node scripts/taxonomy-audit.js              # run audit, write report
 *   node scripts/taxonomy-audit.js --posthog    # include PostHog signal pull (needs PH key)
 */

const fs = require('fs');
const path = require('path');

const SUPA_URL = process.env.SUPABASE_URL || 'https://psiuknphchmhsthvhkpt.supabase.co';
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const POSTHOG_KEY = process.env.POSTHOG_API_KEY;
const POSTHOG_PROJECT = process.env.POSTHOG_PROJECT_ID || '80668';

if (!SUPA_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not set. Run: source .keys.env');
  process.exit(1);
}

const taxonomyPath = path.join(__dirname, '../lib/taxonomy.json');
const taxonomy = JSON.parse(fs.readFileSync(taxonomyPath, 'utf8'));

// Build variant lookup
const variantMap = new Map();
const canonicalUsage = new Map();
for (const [slug, def] of Object.entries(taxonomy.canonicals)) {
  canonicalUsage.set(slug, 0);
  for (const variant of def.variants) {
    variantMap.set(variant.toLowerCase().trim(), slug);
  }
}

const today = new Date().toISOString().split('T')[0];
const monthKey = today.slice(0, 7);

async function fetchAllServices() {
  let offset = 0;
  const PAGE = 1000;
  const allServices = [];

  while (true) {
    const url = `${SUPA_URL}/rest/v1/clinics?select=services,city,glow_score&offset=${offset}&limit=${PAGE}`;
    const res = await fetch(url, {
      headers: { 'apikey': SUPA_KEY, 'Authorization': 'Bearer ' + SUPA_KEY }
    });
    const rows = await res.json();
    if (!Array.isArray(rows) || rows.length === 0) break;
    allServices.push(...rows);
    if (rows.length < PAGE) break;
    offset += PAGE;
  }
  return allServices;
}

async function fetchPostHogSearchSignals() {
  if (!POSTHOG_KEY || !process.argv.includes('--posthog')) {
    return { note: 'PostHog signals skipped (pass --posthog flag + POSTHOG_API_KEY to include)', events: [] };
  }

  try {
    // Query PostHog for search/filter events in last 30 days
    const url = `https://app.posthog.com/api/projects/${POSTHOG_PROJECT}/events/?event=filter_used&after=${new Date(Date.now() - 30*24*60*60*1000).toISOString()}&limit=1000`;
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${POSTHOG_KEY}` }
    });
    const data = await res.json();
    const events = data.results || [];

    const signalCounts = {};
    for (const event of events) {
      const treatment = event.properties?.treatment_slug || event.properties?.filter_value;
      if (treatment) signalCounts[treatment] = (signalCounts[treatment] || 0) + 1;
    }

    return {
      note: `PostHog: ${events.length} filter_used events in last 30 days`,
      events: Object.entries(signalCounts).sort((a, b) => b[1] - a[1])
    };
  } catch (e) {
    return { note: `PostHog error: ${e.message}`, events: [] };
  }
}

async function main() {
  console.log('🔍 Running taxonomy audit...\n');

  const rows = await fetchAllServices();
  console.log(`Fetched ${rows.length} clinic rows from Supabase`);

  // Count all raw service tags
  const rawTagCounts = new Map();
  let emptyServices = 0;
  let coveredClinics = 0;

  for (const row of rows) {
    const services = row.services || [];
    if (services.length === 0) { emptyServices++; continue; }

    let hasCoverage = false;
    for (const tag of services) {
      const key = tag.toLowerCase().trim();
      rawTagCounts.set(key, (rawTagCounts.get(key) || 0) + 1);
      const slug = variantMap.get(key);
      if (slug) {
        canonicalUsage.set(slug, (canonicalUsage.get(slug) || 0) + 1);
        hasCoverage = true;
      }
    }
    if (hasCoverage) coveredClinics++;
  }

  const coveredRated = rows.filter(r => (r.glow_score || 0) > 0 && (r.services || []).length > 0).length;

  // Unmapped tags — sorted by frequency
  const unmapped = [...rawTagCounts.entries()]
    .filter(([tag]) => !variantMap.has(tag))
    .sort((a, b) => b[1] - a[1]);

  // Dead canonical variants (never matched)
  const deadCanonicals = [...canonicalUsage.entries()]
    .filter(([, count]) => count === 0)
    .map(([slug]) => slug);

  // PostHog signals
  const phSignals = await fetchPostHogSearchSignals();

  // Build report
  const lines = [
    `# GlowRoute Taxonomy Audit — ${monthKey}`,
    ``,
    `**Run date:** ${today}  `,
    `**Taxonomy version:** ${taxonomy._meta.version}  `,
    `**Total clinics:** ${rows.length}  `,
    `**Clinics with empty services:** ${emptyServices} (${(emptyServices/rows.length*100).toFixed(0)}%)  `,
    `**Clinics with canonical coverage:** ${coveredClinics} (${(coveredClinics/(rows.length-emptyServices)*100).toFixed(0)}% of those with any tags)  `,
    ``,
    `---`,
    ``,
    `## 🆕 New / Unmapped Tags (Taxonomy Candidates)`,
    ``,
    `These tags appear in clinic data but don't map to any canonical slug.  `,
    `**Review for potential additions to taxonomy.json.** Signal-driven: prefer tags users search for, not clinical terminology.`,
    ``,
    `| Tag | Count | Suggested Action |`,
    `|-----|-------|-----------------|`,
    ...unmapped.slice(0, 50).map(([tag, count]) => {
      let action = 'Evaluate';
      if (count >= 20) action = '⚡ HIGH SIGNAL — add to canonical or existing variant list';
      else if (count >= 10) action = '👀 Worth adding as variant';
      else if (count >= 5) action = 'Monitor next month';
      else action = 'Low signal — skip';
      return `| \`${tag}\` | ${count} | ${action} |`;
    }),
    ``,
    `**Total unmapped unique tags:** ${unmapped.length}  `,
    `**Total unmapped instances:** ${unmapped.reduce((s, [,c]) => s + c, 0)}`,
    ``,
    `---`,
    ``,
    `## 📊 Canonical Coverage`,
    ``,
    `| Canonical Slug | Label | Clinic Matches |`,
    `|----------------|-------|---------------|`,
    ...[...canonicalUsage.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([slug, count]) => {
        const def = taxonomy.canonicals[slug];
        const flag = count === 0 ? ' ⚠️ ZERO MATCHES' : '';
        return `| \`${slug}\` | ${def?.label || slug} | ${count}${flag} |`;
      }),
    ``,
    `---`,
    ``,
    `## ⚠️ Dead Canonicals (Zero Matches)`,
    ``,
    deadCanonicals.length === 0
      ? `All canonicals have at least one match. ✅`
      : `These canonical slugs have zero clinic matches. Consider merging or removing:\n\n${deadCanonicals.map(s => `- \`${s}\``).join('\n')}`,
    ``,
    `---`,
    ``,
    `## 📱 PostHog Search Signals`,
    ``,
    `_${phSignals.note}_`,
    ``,
    phSignals.events.length > 0
      ? `| Search Term | Uses |\n|------------|------|\n` + phSignals.events.slice(0, 20).map(([t, c]) => `| \`${t}\` | ${c} |`).join('\n')
      : `_No PostHog data available this run. Re-run with --posthog flag after 30+ days of traffic._`,
    ``,
    `---`,
    ``,
    `## 🔧 Recommended Actions This Month`,
    ``,
    `1. **Review high-signal unmapped tags above** — add to taxonomy.json variants or create new canonical`,
    `2. **Run backfill after any taxonomy.json changes:** \`node scripts/taxonomy-backfill.js --write\``,
    `3. **Check PostHog dashboard** for new search terms at posthog.com`,
    `4. **Next audit:** First Monday of ${new Date(new Date().setMonth(new Date().getMonth() + 1)).toLocaleString('default', { month: 'long', year: 'numeric' })}`,
    ``,
    `---`,
    ``,
    `_Auto-generated by scripts/taxonomy-audit.js. Do not manually edit — re-run script to refresh._`,
  ];

  const report = lines.join('\n');

  // Write report
  const docsDir = path.join(__dirname, '../docs');
  if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true });
  const reportPath = path.join(docsDir, `taxonomy-audit-${monthKey}.md`);
  fs.writeFileSync(reportPath, report);

  console.log(`\n✅ Report written: docs/taxonomy-audit-${monthKey}.md`);
  console.log(`\n📊 Quick summary:`);
  console.log(`  Unmapped tags: ${unmapped.length} unique (${unmapped.slice(0, 3).map(([t]) => t).join(', ')}...)`);
  console.log(`  High-signal candidates (≥20 uses): ${unmapped.filter(([,c]) => c >= 20).length}`);
  console.log(`  Dead canonicals: ${deadCanonicals.length}`);
  console.log(`  Coverage: ${(coveredClinics/(rows.length-emptyServices)*100).toFixed(0)}%`);
}

main().catch(err => { console.error(err); process.exit(1); });
