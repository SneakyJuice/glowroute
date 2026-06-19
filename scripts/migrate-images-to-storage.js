#!/usr/bin/env node
/**
 * GR-040 CP2 — Migrate clinic hero images to Supabase Storage.
 *
 * Usage:
 *   node scripts/migrate-images-to-storage.js --dry-run   # count only, no writes
 *   node scripts/migrate-images-to-storage.js              # full migration (needs explicit go)
 *
 * Idempotent: skips clinics whose hero_image_url already points to Supabase Storage.
 * Rate-limited: 5 concurrent downloads, 100ms delay between batches.
 */

'use strict'

const https = require('https')
const http = require('http')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

// ── Config ────────────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://psiuknphchmhsthvhkpt.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'REMOVED_LEAKED_SUPABASE_SERVICE_KEY'
const BUCKET = 'clinic-images'
const BATCH_CONCURRENCY = 5
const BATCH_DELAY_MS = 100
const PAGE_SIZE = 1000

const DRY_RUN = process.argv.includes('--dry-run')

if (DRY_RUN) {
  console.log('🔍 DRY-RUN MODE — no writes will occur')
} else {
  console.log('⚠️  LIVE MODE — uploading images to Supabase Storage')
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
})

// ── Helpers ───────────────────────────────────────────────────────────────────
function isInternal(url) {
  return url && (
    url.includes('supabase.co') ||
    url.includes('supabase.in')
  )
}

function getExtFromUrl(url) {
  try {
    const pathname = new URL(url).pathname
    const ext = path.extname(pathname).toLowerCase()
    if (['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif'].includes(ext)) return ext
  } catch (_) {}
  return '.jpg'
}

function fetchBuffer(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http
    const request = protocol.get(url, { timeout: 15000 }, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        // Follow one redirect
        return fetchBuffer(res.headers.location).then(resolve).catch(reject)
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`))
      }
      const chunks = []
      res.on('data', (c) => chunks.push(c))
      res.on('end', () => resolve({ buffer: Buffer.concat(chunks), contentType: res.headers['content-type'] || 'image/jpeg' }))
      res.on('error', reject)
    })
    request.on('error', reject)
    request.on('timeout', () => {
      request.destroy()
      reject(new Error(`Timeout fetching ${url}`))
    })
  })
}

async function delay(ms) {
  return new Promise(r => setTimeout(r, ms))
}

// ── Ensure bucket exists ───────────────────────────────────────────────────────
async function ensureBucket() {
  const { data: buckets, error } = await supabase.storage.listBuckets()
  if (error) throw new Error(`Failed to list buckets: ${error.message}`)
  const exists = buckets.some(b => b.name === BUCKET)
  if (!exists) {
    if (DRY_RUN) {
      console.log(`ℹ️  [dry-run] Would create public bucket: ${BUCKET}`)
      return
    }
    const { error: createErr } = await supabase.storage.createBucket(BUCKET, { public: true })
    if (createErr) throw new Error(`Failed to create bucket: ${createErr.message}`)
    console.log(`✅ Created bucket: ${BUCKET}`)
  } else {
    console.log(`✅ Bucket already exists: ${BUCKET}`)
  }
}

// ── Fetch all external-image clinic rows (paginated) ──────────────────────────
async function fetchExternalRows() {
  const rows = []
  let page = 0
  while (true) {
    const from = page * PAGE_SIZE
    const to = from + PAGE_SIZE - 1
    const { data, error } = await supabase
      .from('clinics')
      .select('id, hero_image_url')
      .in('visibility', ['visible'])
      .not('hero_image_url', 'is', null)
      .range(from, to)

    if (error) throw new Error(`Fetch error: ${error.message}`)
    if (!data || data.length === 0) break

    for (const row of data) {
      if (!isInternal(row.hero_image_url)) {
        rows.push(row)
      }
    }

    if (data.length < PAGE_SIZE) break
    page++
  }
  return rows
}

// ── Migrate a single clinic ───────────────────────────────────────────────────
async function migrateClinic(row) {
  const { id, hero_image_url } = row

  if (DRY_RUN) {
    return { id, status: 'dry-run', url: hero_image_url }
  }

  try {
    const ext = getExtFromUrl(hero_image_url)
    const storagePath = `${id}${ext}`

    // Download
    const { buffer, contentType } = await fetchBuffer(hero_image_url)

    // Upload
    const { error: uploadErr } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, buffer, {
        contentType,
        upsert: true,
      })

    if (uploadErr) throw new Error(`Upload failed: ${uploadErr.message}`)

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(storagePath)

    const newUrl = publicUrlData.publicUrl

    // Update DB
    const { error: updateErr } = await supabase
      .from('clinics')
      .update({ hero_image_url: newUrl })
      .eq('id', id)

    if (updateErr) throw new Error(`DB update failed: ${updateErr.message}`)

    return { id, status: 'migrated', newUrl }
  } catch (err) {
    return { id, status: 'error', error: err.message }
  }
}

// ── Process in batches ────────────────────────────────────────────────────────
async function processBatches(rows) {
  const results = { migrated: 0, dry_run: 0, errors: 0, errorList: [] }

  for (let i = 0; i < rows.length; i += BATCH_CONCURRENCY) {
    const batch = rows.slice(i, i + BATCH_CONCURRENCY)
    const batchResults = await Promise.all(batch.map(migrateClinic))

    for (const r of batchResults) {
      if (r.status === 'migrated') results.migrated++
      else if (r.status === 'dry-run') results.dry_run++
      else if (r.status === 'error') {
        results.errors++
        results.errorList.push(`${r.id}: ${r.error}`)
      }
    }

    const done = Math.min(i + BATCH_CONCURRENCY, rows.length)
    if (done % 50 === 0 || done === rows.length) {
      process.stdout.write(`\r  Progress: ${done}/${rows.length}`)
    }
    if (i + BATCH_CONCURRENCY < rows.length) await delay(BATCH_DELAY_MS)
  }
  console.log() // newline after progress
  return results
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n=== GR-040 CP2: Image Storage Migration ===\n')

  await ensureBucket()

  console.log('📋 Fetching external-image clinic rows...')
  const externalRows = await fetchExternalRows()

  // Count internal for reference
  const { count: totalVisible } = await supabase
    .from('clinics')
    .select('*', { count: 'exact', head: true })
    .in('visibility', ['visible'])
    .not('hero_image_url', 'is', null)

  const internalCount = (totalVisible || 0) - externalRows.length

  console.log(`\n📊 Image Audit:`)
  console.log(`   Total visible clinics with hero_image_url : ${totalVisible}`)
  console.log(`   ✅ Already internal (Supabase Storage)     : ${internalCount}`)
  console.log(`   🌐 External (need migration)               : ${externalRows.length}`)

  if (DRY_RUN) {
    console.log('\n✅ DRY-RUN COMPLETE')
    console.log(`   Would migrate: ${externalRows.length} external images`)
    console.log(`   Already internal: ${internalCount} images`)
    console.log('\n⏸  Paused — run without --dry-run flag only after Zion/Anthony explicit go.')
    return
  }

  if (externalRows.length === 0) {
    console.log('\n✅ Nothing to migrate — all images already internal.')
    return
  }

  console.log(`\n🚀 Starting migration of ${externalRows.length} images...\n`)
  const results = await processBatches(externalRows)

  console.log('\n=== Migration Complete ===')
  console.log(`   ✅ Migrated: ${results.migrated}`)
  console.log(`   ❌ Errors:   ${results.errors}`)
  if (results.errorList.length > 0) {
    console.log('\nError details:')
    results.errorList.slice(0, 20).forEach(e => console.log(`   - ${e}`))
    if (results.errorList.length > 20) console.log(`   ... and ${results.errorList.length - 20} more`)
  }
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err.message)
  process.exit(1)
})
