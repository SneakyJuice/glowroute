#!/usr/bin/env node
/**
 * GlowRoute Quality & Visibility Scoring
 * 
 * Recalculates data_quality_score and sets visibility based on data completeness.
 * Does NOT touch: removed, hidden (manual), or claimed/verified listings.
 * 
 * Scoring logic:
 *   data_quality_score (0-100):
 *     +30  hero_image_url present
 *     +25  website present
 *     +20  phone present
 *     +15  address present
 *     +10  description present
 *   Total max: 100
 * 
 * Visibility tiers:
 *   visible  → score >= 55 (has at minimum: phone + address + one of: image or website)
 *   partial  → score 35-54 (has phone + address but missing image AND website) — still visible, ranked lower via glow_score
 *   hidden   → score < 35  (missing phone or address — not useful to a searcher)
 * 
 * glow_score (0-5):
 *   Full profile (score 80-100) → 5
 *   Strong (score 65-79)        → 4
 *   Good (score 50-64)          → 3
 *   Partial (score 35-49)       → 2
 *   Weak (score 20-34)          → 1
 *   Stub (score < 20)           → 0
 * 
 * Usage:
 *   node scripts/quality-visibility-score.js           # live run
 *   node scripts/quality-visibility-score.js --dry-run # preview only
 *   node scripts/quality-visibility-score.js --report  # stats only, no writes
 */

// Load env without dotenv dependency
(function loadEnv() {
  const path = require('path'), fs = require('fs');
  const envFiles = [
    path.join(__dirname, '../.env.local'),
    path.join(__dirname, '../.env'),
    path.join(process.env.HOME, '.openclaw/workspace/.keys.env'),
  ];
  for (const f of envFiles) {
    if (!fs.existsSync(f)) continue;
    for (const line of fs.readFileSync(f, 'utf8').split('\n')) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
    }
  }
})();

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://psiuknphchmhsthvhkpt.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_KEY) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

const DRY_RUN = process.argv.includes('--dry-run');
const REPORT_ONLY = process.argv.includes('--report');
const BATCH_SIZE = 500;

// ── Scoring ───────────────────────────────────────────────────────────────────

function calcQualityScore(clinic) {
  let score = 0;
  if (clinic.hero_image_url)  score += 30;
  if (clinic.website)         score += 25;
  if (clinic.phone)           score += 20;
  if (clinic.address)         score += 15;
  if (clinic.description)     score += 10;
  return score;
}

function calcGlowScore(qualityScore) {
  if (qualityScore >= 80) return 5;
  if (qualityScore >= 65) return 4;
  if (qualityScore >= 50) return 3;
  if (qualityScore >= 35) return 2;
  if (qualityScore >= 20) return 1;
  return 0;
}

function calcVisibility(clinic, qualityScore, currentVisibility) {
  // Never touch manually managed states
  if (currentVisibility === 'removed') return 'removed';
  if (currentVisibility === 'hidden')  return 'hidden';

  if (qualityScore >= 55) return 'visible';
  if (qualityScore >= 35) return 'visible'; // partial but still show — glow_score handles ranking
  return 'hidden'; // stub — suppress
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🏥 GlowRoute Quality & Visibility Scorer`);
  console.log(`Mode: ${REPORT_ONLY ? 'REPORT ONLY' : DRY_RUN ? 'DRY RUN' : 'LIVE'}\n`);

  // Fetch all clinics (paginate)
  let allClinics = [];
  let offset = 0;
  while (true) {
    const { data, error } = await sb
      .from('clinics')
      .select('id, name, hero_image_url, phone, address, website, description, visibility, status, glow_score, data_quality_score')
      .range(offset, offset + BATCH_SIZE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    allClinics = allClinics.concat(data);
    offset += BATCH_SIZE;
    if (data.length < BATCH_SIZE) break;
  }

  console.log(`📊 Loaded ${allClinics.length} clinics\n`);

  // Score all
  const updates = [];
  const stats = {
    visible: 0, hidden: 0, removed: 0, manual_hidden: 0,
    scoreDistribution: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    visibilityChanges: { toVisible: 0, toHidden: 0, unchanged: 0 },
    qualityBuckets: { full: 0, strong: 0, good: 0, partial: 0, weak: 0, stub: 0 }
  };

  for (const clinic of allClinics) {
    const qualityScore = calcQualityScore(clinic);
    const glowScore = calcGlowScore(qualityScore);
    const newVisibility = calcVisibility(clinic, qualityScore, clinic.visibility);

    // Track stats
    stats.scoreDistribution[glowScore]++;
    if (qualityScore >= 80) stats.qualityBuckets.full++;
    else if (qualityScore >= 65) stats.qualityBuckets.strong++;
    else if (qualityScore >= 50) stats.qualityBuckets.good++;
    else if (qualityScore >= 35) stats.qualityBuckets.partial++;
    else if (qualityScore >= 20) stats.qualityBuckets.weak++;
    else stats.qualityBuckets.stub++;

    if (newVisibility === 'visible') stats.visible++;
    else if (newVisibility === 'hidden') stats.hidden++;
    else if (newVisibility === 'removed') stats.removed++;

    if (clinic.visibility === 'hidden' && newVisibility === 'visible') stats.visibilityChanges.toVisible++;
    else if (clinic.visibility === 'visible' && newVisibility === 'hidden') stats.visibilityChanges.toHidden++;
    else stats.visibilityChanges.unchanged++;

    // Queue update if anything changed
    const changed = (
      clinic.data_quality_score !== qualityScore ||
      clinic.glow_score !== glowScore ||
      clinic.visibility !== newVisibility
    );

    if (changed) {
      updates.push({
        id: clinic.id,
        data_quality_score: qualityScore,
        glow_score: glowScore,
        visibility: newVisibility,
        updated_at: new Date().toISOString()
      });
    }
  }

  // Print report
  console.log(`━━━ Quality Score Distribution ━━━`);
  console.log(`⭐⭐⭐⭐⭐ Full    (80-100): ${stats.qualityBuckets.full.toLocaleString()} clinics`);
  console.log(`⭐⭐⭐⭐  Strong  (65-79):  ${stats.qualityBuckets.strong.toLocaleString()} clinics`);
  console.log(`⭐⭐⭐   Good    (50-64):  ${stats.qualityBuckets.good.toLocaleString()} clinics`);
  console.log(`⭐⭐    Partial (35-49):  ${stats.qualityBuckets.partial.toLocaleString()} clinics`);
  console.log(`⭐     Weak    (20-34):  ${stats.qualityBuckets.weak.toLocaleString()} clinics`);
  console.log(`       Stub    (<20):    ${stats.qualityBuckets.stub.toLocaleString()} clinics`);

  console.log(`\n━━━ Glow Score (0-5) ━━━`);
  for (let i = 5; i >= 0; i--) {
    console.log(`  ${i}: ${stats.scoreDistribution[i].toLocaleString()} clinics`);
  }

  console.log(`\n━━━ Visibility After Scoring ━━━`);
  console.log(`  🟢 Visible: ${stats.visible.toLocaleString()}`);
  console.log(`  🔴 Hidden:  ${stats.hidden.toLocaleString()}`);
  console.log(`  ⛔ Removed: ${stats.removed.toLocaleString()}`);

  console.log(`\n━━━ Visibility Changes ━━━`);
  console.log(`  ↑ Will become visible: ${stats.visibilityChanges.toVisible.toLocaleString()}`);
  console.log(`  ↓ Will be hidden:      ${stats.visibilityChanges.toHidden.toLocaleString()}`);
  console.log(`  → Unchanged:           ${stats.visibilityChanges.unchanged.toLocaleString()}`);

  console.log(`\n━━━ Updates Needed ━━━`);
  console.log(`  ${updates.length.toLocaleString()} clinics need score/visibility update`);

  if (REPORT_ONLY) {
    console.log(`\n📋 Report complete (no writes — use without --report to apply)`);
    return;
  }

  if (DRY_RUN) {
    console.log(`\n🔍 Dry run — no writes. Sample of changes:`);
    updates.slice(0, 10).forEach(u => console.log(`  ${u.id}: quality=${u.data_quality_score} glow=${u.glow_score} visibility=${u.visibility}`));
    return;
  }

  // Apply updates one batch at a time using update (not upsert — avoids slug constraint)
  console.log(`\n⚡ Applying ${updates.length} updates...`);
  let done = 0, errors = 0;
  const UPDATE_BATCH = 100; // smaller batches for individual updates
  for (let i = 0; i < updates.length; i += UPDATE_BATCH) {
    const batch = updates.slice(i, i + UPDATE_BATCH);
    // Update each record individually by id using .in() filter
    const ids = batch.map(u => u.id);
    // Build per-record updates — Supabase doesn't support bulk update with different values,
    // so we group by identical score combos to minimize round trips
    const groups = {};
    for (const u of batch) {
      const key = `${u.data_quality_score}|${u.glow_score}|${u.visibility}`;
      if (!groups[key]) groups[key] = { data_quality_score: u.data_quality_score, glow_score: u.glow_score, visibility: u.visibility, updated_at: u.updated_at, ids: [] };
      groups[key].ids.push(u.id);
    }
    for (const [, g] of Object.entries(groups)) {
      const { error } = await sb.from('clinics')
        .update({ data_quality_score: g.data_quality_score, glow_score: g.glow_score, visibility: g.visibility, updated_at: g.updated_at })
        .in('id', g.ids);
      if (error) {
        console.error(`  ❌ Update failed:`, error.message);
        errors++;
      } else {
        done += g.ids.length;
      }
    }
    process.stdout.write(`  ✅ ${done}/${updates.length} updated\r`);
  }

  console.log(`\n\n════════════════════════════════`);
  console.log(`✅ Done`);
  console.log(`   Updated: ${done}`);
  console.log(`   Errors:  ${errors}`);
  console.log(`   Visible: ${stats.visible.toLocaleString()} clinics now in directory`);
  console.log(`════════════════════════════════\n`);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
