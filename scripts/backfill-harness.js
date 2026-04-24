#!/usr/bin/env node
/**
 * GlowRoute Image Backfill Harness
 * 
 * Runs backfill-images-apify.js in a loop until no null-image clinics remain.
 * Handles retries, inter-run delays, cumulative stats, and final report.
 * 
 * Usage:
 *   node scripts/backfill-harness.js              # run until done
 *   node scripts/backfill-harness.js --max-runs 3 # cap at 3 runs
 *   node scripts/backfill-harness.js --dry-run    # pass dry-run to child script
 */

const { execSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const SCRIPT = path.join(__dirname, 'backfill-images-apify.js');
const MAX_RUNS = parseInt(process.argv.find(a => a.startsWith('--max-runs='))?.split('=')[1] || '20');
const DRY_RUN = process.argv.includes('--dry-run');
const INTER_RUN_DELAY_MS = 10000; // 10s between runs
const RUN_TIMEOUT_MS = 45 * 60 * 1000; // 45 min per run hard limit

// ── Helpers ───────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function ts() {
  return new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
}

function parseRunSummary(output) {
  const updated = output.match(/✅ Total updated:\s+(\d+)/)?.[1];
  const skipped = output.match(/⏭️\s+Skipped[^:]*:\s+(\d+)/)?.[1];
  const errors  = output.match(/❌ Errors:\s+(\d+)/)?.[1];
  return {
    updated: parseInt(updated || '0'),
    skipped: parseInt(skipped || '0'),
    errors:  parseInt(errors  || '0'),
  };
}

function runScript() {
  return new Promise((resolve) => {
    const args = ['--all', '--batch', '25'];
    if (DRY_RUN) args.push('--dry-run');

    const child = spawn('node', [SCRIPT, ...args], {
      cwd: path.join(__dirname, '..'),
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let output = '';
    let lastLine = '';

    child.stdout.on('data', chunk => {
      const str = chunk.toString();
      output += str;
      // Print progress lines live
      const lines = str.split('\n');
      for (const line of lines) {
        if (line.trim()) {
          process.stdout.write('  ' + line.trim() + '\n');
          lastLine = line.trim();
        }
      }
    });

    child.stderr.on('data', chunk => {
      process.stderr.write(chunk);
    });

    // Hard timeout
    const killer = setTimeout(() => {
      console.log(`\n⏰ Run timeout (${RUN_TIMEOUT_MS / 60000} min) — killing and continuing`);
      child.kill('SIGTERM');
    }, RUN_TIMEOUT_MS);

    child.on('close', (code) => {
      clearTimeout(killer);
      const summary = parseRunSummary(output);
      resolve({ code, output, summary });
    });
  });
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🚀 GlowRoute Backfill Harness`);
  console.log(`   Script:   ${SCRIPT}`);
  console.log(`   Max runs: ${MAX_RUNS}`);
  console.log(`   Dry run:  ${DRY_RUN}`);
  console.log(`   Started:  ${ts()}\n`);

  let totalUpdated = 0;
  let totalSkipped = 0;
  let totalErrors  = 0;
  let runCount     = 0;

  for (let i = 1; i <= MAX_RUNS; i++) {
    console.log(`\n${'═'.repeat(60)}`);
    console.log(`🔁 Run ${i}/${MAX_RUNS} — ${ts()}`);
    console.log(`${'═'.repeat(60)}\n`);

    const { code, summary } = await runScript();
    runCount++;

    totalUpdated += summary.updated;
    totalSkipped += summary.skipped;
    totalErrors  += summary.errors;

    console.log(`\n📊 Run ${i} summary: updated=${summary.updated} skipped=${summary.skipped} errors=${summary.errors} (exit ${code})`);

    if (summary.updated === 0) {
      console.log(`\n✅ No more nulls to fill — harness complete after ${runCount} run(s).`);
      break;
    }

    if (i < MAX_RUNS) {
      console.log(`⏳ Waiting ${INTER_RUN_DELAY_MS / 1000}s before next run...`);
      await sleep(INTER_RUN_DELAY_MS);
    }
  }

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`🏁 HARNESS COMPLETE — ${ts()}`);
  console.log(`${'═'.repeat(60)}`);
  console.log(`   Runs completed: ${runCount}`);
  console.log(`   Total updated:  ${totalUpdated}`);
  console.log(`   Total skipped:  ${totalSkipped}`);
  console.log(`   Total errors:   ${totalErrors}`);
  console.log(`${'═'.repeat(60)}\n`);
}

main().catch(err => {
  console.error('Harness fatal error:', err);
  process.exit(1);
});
